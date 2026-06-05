# バックアップ & リストア戦略

tech-event の永続データ (DB / 画像ストレージ) を業務継続性 (BCP) の観点から守るためのガイド。
本書では **3 種類のデータ** ごとに RPO/RTO 目標とバックアップ運用、復元手順を整理する。

---

## 1. RTO/RPO 目標 (例)

| データ種別 | RPO (許容データ損失) | RTO (許容復旧時間) | 重要度 |
| --- | --- | --- | --- |
| DB (events, users, groups, ...) | **5 分** | **1 時間** | Critical |
| 画像ストレージ (event-cover, group-thumb 等) | **24 時間** | **4 時間** | High |
| 監査ログ / メトリクス時系列 | **1 時間** | **8 時間** | Medium |
| 設定 / IaC (GitHub repo) | **0 分** (git で保護) | **30 分** | Critical |

> RPO = Recovery Point Objective (どこまで遡るデータ損失を許容するか)
> RTO = Recovery Time Objective (障害発生からサービス復旧までの目標時間)

---

## 2. DB バックアップ

### 2.1 SQLite (dev / 小規模 production)

SQLite はファイル単位でバックアップできるが、WAL モードのため
**チェックポイントを挟まないと不完全なスナップショット** になる。

#### 2.1.1 推奨手順 (sqlite3 CLI)

```bash
# 1. WAL を main DB へフラッシュ
sqlite3 dev.db "PRAGMA wal_checkpoint(TRUNCATE);"

# 2. オンライン .backup でロックなしコピー
sqlite3 dev.db ".backup '/backups/dev-$(date +%Y%m%d-%H%M%S).db'"

# 3. S3 等に転送
aws s3 cp /backups/dev-*.db s3://tech-event-backups/sqlite/ --storage-class=STANDARD_IA
```

#### 2.1.2 自動化 (cron 例)

```bash
# /etc/cron.d/tech-event-backup
*/15 * * * * tech-event /usr/local/bin/sqlite-backup.sh
```

`sqlite-backup.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
DB=/var/lib/tech-event/dev.db
OUT=/var/backups/tech-event/$(date +%Y%m%d-%H%M%S).db
sqlite3 "$DB" "PRAGMA wal_checkpoint(TRUNCATE);"
sqlite3 "$DB" ".backup '$OUT'"
aws s3 cp "$OUT" "s3://tech-event-backups/sqlite/" --storage-class=STANDARD_IA
# 30 日より古いものを削除
find /var/backups/tech-event/ -name "*.db" -mtime +30 -delete
```

#### 2.1.3 復元手順

```bash
# 1. アプリ停止
systemctl stop tech-event

# 2. 復元
aws s3 cp s3://tech-event-backups/sqlite/dev-20260605-093000.db /var/lib/tech-event/dev.db

# 3. WAL / SHM ファイルを削除 (古いものが残っているとロールバックされる)
rm -f /var/lib/tech-event/dev.db-wal /var/lib/tech-event/dev.db-shm

# 4. 整合性チェック
sqlite3 /var/lib/tech-event/dev.db "PRAGMA integrity_check;"
#  => "ok" が返ること

# 5. アプリ再起動
systemctl start tech-event
```

### 2.2 PostgreSQL (推奨 production)

#### 2.2.1 論理バックアップ (`pg_dump`) - 日次

```bash
# /etc/cron.d/tech-event-pg-dump
0 3 * * * postgres /usr/local/bin/pg-dump-tech-event.sh
```

`pg-dump-tech-event.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
DATE=$(date +%Y%m%d)
OUT=/var/backups/postgres/tech-event-$DATE.sql.gz
pg_dump \
  -h localhost -U techevent -d techevent \
  --format=custom \
  --compress=9 \
  --no-owner --no-privileges \
  --file=/var/backups/postgres/tech-event-$DATE.dump

gzip -c /var/backups/postgres/tech-event-$DATE.dump > "$OUT"
rm /var/backups/postgres/tech-event-$DATE.dump

aws s3 cp "$OUT" "s3://tech-event-backups/postgres/daily/" \
  --storage-class=STANDARD_IA \
  --metadata=type=daily

# 14 日より古い daily を削除 (週次/月次は別保持)
find /var/backups/postgres/ -name "tech-event-*.sql.gz" -mtime +14 -delete
```

#### 2.2.2 PITR (Point-In-Time Recovery) - WAL 連続アーカイブ

`postgresql.conf`:

```
wal_level = replica
archive_mode = on
archive_command = 'aws s3 cp %p s3://tech-event-backups/postgres/wal/%f --storage-class=INTELLIGENT_TIERING'
max_wal_senders = 3
```

ベースバックアップ (週次):

```bash
0 4 * * 0 postgres pg_basebackup \
  -h localhost -U replication \
  -D /var/backups/postgres/base-$(date +%Y%m%d) \
  -Ft -z -P --checkpoint=fast
```

#### 2.2.3 復元手順 (PITR)

```bash
# 1. アプリ + Postgres 停止
systemctl stop tech-event postgresql

# 2. data ディレクトリを退避
mv /var/lib/postgresql/16/main /var/lib/postgresql/16/main.broken

# 3. ベースバックアップを展開
mkdir -p /var/lib/postgresql/16/main
tar -xzf /var/backups/postgres/base-20260601/base.tar.gz \
  -C /var/lib/postgresql/16/main

# 4. WAL を S3 から復元するための recovery 設定
cat > /var/lib/postgresql/16/main/postgresql.auto.conf <<EOF
restore_command = 'aws s3 cp s3://tech-event-backups/postgres/wal/%f %p'
recovery_target_time = '2026-06-05 02:30:00 JST'
recovery_target_action = 'promote'
EOF
touch /var/lib/postgresql/16/main/recovery.signal

# 5. Postgres 起動 → 自動で WAL を適用
chown -R postgres:postgres /var/lib/postgresql/16/main
systemctl start postgresql

# 6. 整合性確認
psql -U techevent -c "SELECT COUNT(*) FROM events;"
psql -U techevent -c "SELECT MAX(created_at) FROM audit_logs;"

# 7. アプリ再起動
systemctl start tech-event
```

---

## 3. 画像ストレージのバックアップ

### 3.1 ローカル (`STORAGE_PROVIDER=local`)

`public/uploads/` をそのまま rsync で別ホストに同期する。

```bash
# /etc/cron.d/tech-event-image-backup
0 4 * * * tech-event rsync -av --delete \
  /var/lib/tech-event/public/uploads/ \
  backup@backup-host:/var/backups/tech-event/uploads/
```

### 3.2 S3 / R2 / B2 (推奨)

S3 は **以下 2 つを必ず有効化** する:

#### 3.2.1 Versioning (誤削除 / 改ざん耐性)

```bash
aws s3api put-bucket-versioning \
  --bucket tech-event-uploads \
  --versioning-configuration Status=Enabled
```

すべての PUT/DELETE が version object として保持される。`DELETE` は「削除マーカー」を
置くだけで実体は残るため、誤削除や ransomware 系の上書きから保護される。

ライフサイクルで古い version を削除 (コスト最適化):

```json
{
  "Rules": [
    {
      "ID": "expire-noncurrent-versions",
      "Status": "Enabled",
      "NoncurrentVersionExpiration": { "NoncurrentDays": 90 }
    }
  ]
}
```

#### 3.2.2 Cross-Region Replication (CRR)

```json
{
  "Role": "arn:aws:iam::123456:role/s3-replication",
  "Rules": [
    {
      "Status": "Enabled",
      "Priority": 1,
      "Filter": { "Prefix": "uploads/" },
      "DeleteMarkerReplication": { "Status": "Enabled" },
      "Destination": {
        "Bucket": "arn:aws:s3:::tech-event-uploads-dr-osaka",
        "StorageClass": "STANDARD_IA"
      }
    }
  ]
}
```

東京 (`ap-northeast-1`) → 大阪 (`ap-northeast-3`) など別リージョンへリアルタイム複製。
リージョン障害時に DR バケットを参照する CDN origin に切替えるだけで復旧できる。

#### 3.2.3 Cloudflare R2 / Backblaze B2

R2 は object lock (S3 互換 API) で WORM 保護、B2 は `b2 sync` で別 application key
配下の bucket に複製する運用が一般的。詳細は public docs を参照。

### 3.3 復元手順 (S3)

```bash
# 特定の object を復元 (誤削除を取り消す)
aws s3api list-object-versions --bucket tech-event-uploads --prefix uploads/2026/06/abc.webp
# DeleteMarker を削除 → 直前の version が見える状態に
aws s3api delete-object \
  --bucket tech-event-uploads \
  --key uploads/2026/06/abc.webp \
  --version-id <DeleteMarkerVersionId>

# bucket 全体を CRR DR から復元 (リージョン障害時)
aws s3 sync \
  s3://tech-event-uploads-dr-osaka/uploads/ \
  s3://tech-event-uploads-new/uploads/ \
  --storage-class=STANDARD
```

---

## 4. 設定 / IaC

- すべての `Dockerfile`, `docker-compose.yml`, `.github/workflows/*`, `prisma/schema.prisma` は
  git で管理。
- secrets (Stripe / Sentry / RESEND_API_KEY) は GitHub Actions Secrets と HashiCorp Vault
  に二重保管。Vault の audit log は S3 にエクスポート。
- 復元: `git clone` + `make deploy` で完全再現できる状態を維持する。

---

## 5. 災害復旧 (DR) 訓練

### 5.1 半期に 1 度実施

1. 本番に近いステージング環境を新規プロビジョン
2. 上記手順で DB / 画像を復元
3. E2E (`pnpm test:e2e`) と smoke test (`/api/health`, `/api/ready`) を通す
4. 復旧までの所要時間を計測 → RTO 目標との乖離を docs に記録

### 5.2 監視

- `/api/metrics` で `backup_age_seconds` ゲージを公開 (TODO)
- Sentry でバックアップ job の失敗を捕捉
- Slack `#alerts` に PagerDuty 連携

---

## 6. 関連 docs

- `docs/architecture.md` — システム構成
- `docs/ci.md` — CI/CD パイプライン
- README 4 章 — 環境変数 (S3_* / DATABASE_URL)
- `prisma/schema.prisma` / `prisma/schema.postgres.prisma` — DB スキーマ
