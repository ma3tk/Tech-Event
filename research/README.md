# tech-event 調査資料インデックス

connpass.com の機能・UI・API・データモデル・UXフロー・非機能要件を網羅的に調査した資料群。
模倣サービス実装の一次資料として参照する。著作物の複製は行わず、機能仕様のみクローンする方針。

**調査統計**: 58 ファイル / 約 16,259 行 (2026-06-04 調査)

---

## 1. ページ仕様 (`pages/`)

ページ単位の URL 構造・レイアウト・表示項目・フォーム・状態・遷移・SEO・A11y。

| ファイル | 内容 |
| --- | --- |
| [top.md](pages/top.md) | トップページ (`/`) |
| [event-search.md](pages/event-search.md) | イベント検索/一覧 (`/explore/`, `/event/`) |
| [event-detail.md](pages/event-detail.md) | イベント詳細 (`{group}.connpass.com/event/{id}/`) 4サンプル |
| [event-create.md](pages/event-create.md) | イベント作成/編集 (主催者向け、ヘルプから推測) |
| [group-list.md](pages/group-list.md) | グループ一覧 |
| [group-detail.md](pages/group-detail.md) | グループ詳細 (bpstudy/pyhack/devlove サンプル) |
| [user-profile.md](pages/user-profile.md) | ユーザープロフィール (`/user/{name}/`) |
| [user-dashboard.md](pages/user-dashboard.md) | マイページ (推測) |
| [login-signup.md](pages/login-signup.md) | ログイン/新規登録 |
| [ranking.md](pages/ranking.md) | 人気イベントランキング |

## 2. UIコンポーネント (`components/`)

再利用UIの役割・構造・Props・状態バリエーション・React実装案。

| ファイル | 内容 |
| --- | --- |
| [header-nav.md](components/header-nav.md) | グローバルヘッダー・ナビ |
| [footer.md](components/footer.md) | フッター |
| [event-card.md](components/event-card.md) | イベントカード (4 variant) |
| [event-detail-header.md](components/event-detail-header.md) | イベント詳細ヘッダー |
| [participant-list.md](components/participant-list.md) | 参加者一覧 |
| [comment-section.md](components/comment-section.md) | フィード/コメント |
| [group-card.md](components/group-card.md) | グループカード |
| [tag-pill.md](components/tag-pill.md) | タグ |
| [search-filter-panel.md](components/search-filter-panel.md) | 検索・絞り込みパネル |
| [breadcrumb.md](components/breadcrumb.md) | パンくず |
| [pagination.md](components/pagination.md) | ページネーション |
| [event-status-badge.md](components/event-status-badge.md) | ステータスバッジ |

## 3. 機能仕様 (`features/`)

機能単位の目的・エンティティ・状態遷移・ルール・ユーザー/主催者フロー・エッジケース・実装案。

### コア機能
| ファイル | 内容 |
| --- | --- |
| [event-registration.md](features/event-registration.md) | 参加登録 (先着/抽選/参加枠) |
| [waitlist.md](features/waitlist.md) | 補欠と繰り上げ |
| [attendance-management.md](features/attendance-management.md) | 出欠管理 (手動/出席コード/QR) |
| [group-roles.md](features/group-roles.md) | グループ権限 (5階層) |
| [notifications.md](features/notifications.md) | 通知 (メール+サイト内) |
| [search-filter.md](features/search-filter.md) | 検索・絞り込み |
| [tags.md](features/tags.md) | タグ機能 |

### 付加機能・連携
| ファイル | 内容 |
| --- | --- |
| [payment.md](features/payment.md) | 有料イベント (PayPal連携) |
| [presentation-materials.md](features/presentation-materials.md) | 発表資料 (Speaker Deck/Docswell/YouTube) |
| [social-integration.md](features/social-integration.md) | X/Facebook/GitHub連携 |
| [calendar-integration.md](features/calendar-integration.md) | Googleカレンダー/iCal |
| [ranking-points.md](features/ranking-points.md) | ランキング (個人ポイントは無し) |
| [event-survey.md](features/event-survey.md) | アンケート (申込フォーム同梱) |
| [report-flag.md](features/report-flag.md) | 通報・ブラックリスト |
| [image-upload.md](features/image-upload.md) | 画像アップロード (660×270px, 1MB) |
| [rich-text-editor.md](features/rich-text-editor.md) | Markdown + 限定HTML |
| [embed.md](features/embed.md) | 埋め込み・OGP |

## 4. API仕様 (`api/`)

公開API (v2/v1) と画面から推測される内部API。

| ファイル | 内容 |
| --- | --- |
| [public-api-overview.md](api/public-api-overview.md) | 概要・認証 (X-API-Key + UA)・レート制限 (1req/sec)・料金 |
| [endpoint-event-search.md](api/endpoint-event-search.md) | `GET /api/v2/events/` (15パラメータ、24フィールド) |
| [endpoint-users.md](api/endpoint-users.md) | ユーザー関連4本 |
| [endpoint-groups.md](api/endpoint-groups.md) | `GET /api/v2/groups/` (subdomain検索のみ) |
| [endpoint-others.md](api/endpoint-others.md) | 資料・その他 |
| [internal-api-inferred.md](api/internal-api-inferred.md) | 参加/コメント/ブックマーク等の非公開API推測 |

## 5. データモデル (`data-model/`)

| ファイル | 内容 |
| --- | --- |
| [entities.md](data-model/entities.md) | 20主要エンティティのフィールド表 |
| [relationships.md](data-model/relationships.md) | 多重度・ASCII ER図・不変条件 |
| [enums-and-states.md](data-model/enums-and-states.md) | 20種類の状態遷移 |
| [migration-strategy.md](data-model/migration-strategy.md) | **Prismaスキーマ案 + 段階移行計画** |

## 6. UXフロー (`ux-flows/`)

| ファイル | 内容 |
| --- | --- |
| [new-user-signup.md](ux-flows/new-user-signup.md) | 新規登録〜初回参加 |
| [create-event-flow.md](ux-flows/create-event-flow.md) | グループ作成〜公開〜開催後 |
| [join-event-flow.md](ux-flows/join-event-flow.md) | 発見〜申込〜抽選〜参加〜キャンセル |
| [organize-group-flow.md](ux-flows/organize-group-flow.md) | グループ運営者の日常運用 |

## 7. 非機能要件 (`non-functional/`)

| ファイル | 内容 |
| --- | --- |
| [seo.md](non-functional/seo.md) | sitemap・JSON-LD・OGP・パンくず |
| [accessibility.md](non-functional/accessibility.md) | WCAG・キーボード操作・コントラスト |
| [performance.md](non-functional/performance.md) | 画像最適化・キャッシュ戦略 |
| [security-privacy.md](non-functional/security-privacy.md) | 個人情報・参加者公開設定・不正対策 |
| [responsive.md](non-functional/responsive.md) | ブレークポイント (>=1024 / 768-1023 / <768) |

---

## 重要な発見 (Top 15)

1. **イベントURL**: `{group}.connpass.com/event/{id}/` が正規。ルート `/event/{id}/` は302リダイレクト。
2. **イベントは必ずグループに属する**。グループ非公開機能なし (オープンコミュニティ原則)。
3. **参加枠 (TicketType) は独立エンティティ**。同一イベント内で「抽選/先着」「オンライン/オフライン」「学生/メンター」を混在可。
4. **抽選 cron は 0〜2 時に自動実行**、発表後は先着順に切替。
5. **参加申込でグループに自動加入** (joined_via=event_join)。
6. **認証は X / Facebook / GitHub / メール の 4 ルート**。メール確認が申込のゲート。
7. **ユーザー名・サブドメインは登録後変更不可** (URL永続性のための重要設計)。
8. **有料イベントは PayPal 一択**。3.6%+40円。返金機能なし(主催者対応)。connpass手数料は0。
9. **発表資料は connpass にホストしない**。URL登録のみ (Speaker Deck/Docswell/YouTube)。
10. **画像アップロードはイベント画像のみ** (660×270px, 1MB)。説明文内は外部URL必須。
11. **Markdown対応**: 説明文+「参加者への情報」欄 (2023/2/8〜)。限定HTML可。
12. **公開APIは7本のみ・GET のみ**。書き込み系(参加/コメント等)は完全非公開。
13. **公開API料金**: 法人月額297,000円、コミュニティは無料・1本のみ。
14. **個人ユーザーのスコア・ポイント機能は意図的に持たない**。ランキングはイベント単位のみ。
15. **出席方法は手動/出席コード/QRの3種**。

---

## 実装ロードマップ概要

調査結果に基づく実装フェーズ案 (詳細は [migration-strategy.md](data-model/migration-strategy.md)):

- **Phase 0 — 基盤**: Next.js + Prisma + NextAuth + Tailwind セットアップ
- **Phase 1 — 公開閲覧**: イベント一覧/詳細、グループ一覧/詳細、ユーザープロフィール (read-only)
- **Phase 2 — ユーザー操作**: 認証、参加申込 (先着)、キャンセル、ブックマーク
- **Phase 3 — 主催者機能**: グループ作成、イベント作成/編集、参加枠、出欠管理
- **Phase 4 — 抽選・通知**: 抽選バッチ、メール通知、補欠繰り上げ
- **Phase 5 — 付加機能**: コメント、発表資料、カレンダー連携、検索フィルタ拡張
- **Phase 6 — 公開API + 埋め込み**: REST API、iCal、OGP
- **Phase 7 — Playwright E2E ループ**: 本家との視覚・機能比較で差分潰し

---

## 利用上の注意

- 各mdは2026-06-04時点の調査結果。connpassの仕様変更により陳腐化する可能性あり。
- 「(推測)」と明示された箇所はログイン必須ページや内部APIから逆算した想定。
- 模倣実装時、ロゴ・固有テキスト・画像等の著作物は複製せず、機能仕様のみ参考にする。

---

## Luma 調査資料

`tech-event` の UI / 機能拡張を検討するための、Luma (luma.com) の構造調査メモ集。
全 32 ファイル (pages: 10 / components: 9 / features: 10 / api: 3) を整理した。

詳細は [luma/README.md](luma/README.md) を参照。主な収録内容:

- **ページ仕様**: トップ / Discover / イベント詳細 / カレンダー / ホスト管理画面 / プロフィール / Sign In / Pricing / Embed / Create Event
- **UI コンポーネント**: EventHero, EventCard, CalendarCard, HostAvatar, AttendeeGrid, RegisterButton, ShareModal, HeaderNav, ThemeCustomization
- **機能仕様**: One-Tap RSVP / Calendar Subscription / Discover Algorithm / Themes / Ticketing (Stripe) / Email & Invitations / Host Tools / Bio Link / Embed Widget / Mobile App
- **API**: Public API 概要 / 主要エンドポイント / Webhooks

**Luma vs connpass の構造的差分 Top 10** と **Luma から模倣すべき UI Top 5** も [luma/README.md](luma/README.md) 末尾にまとめている。

実装ステータス: `HostAvatarStack` (Luma の共催者アバター) は既に `src/components/HostAvatarStack.tsx` として実装され、`/components` ショーケースで variant 網羅検証中。
