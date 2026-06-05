# Luma Host Avatar (Stack)

## 役割

イベントの「主催者・共催者」を表現する小さなアバター列。Luma は **共催文化** (co-host) が強く、テックイベントだと「企業 × 個人 × コミュニティ」の 3〜4 名共催が常態。そのため重ね表示する **AvatarStack** が UI の基本パーツとして組み込まれている。

## 利用箇所

- イベント詳細のヒーロー (Hosted by ...)
- カレンダー詳細 (Admins セクション)
- Discover の Featured Calendars
- 招待メールのフッター
- About モーダル
- イベントカード (小サイズ)

## 構成パターン

| バリアント | 表示 |
| --- | --- |
| `single` | 1 人 (アバター + 名前) |
| `stack-overlap` | 2〜5 人をオーバーラップで重ね表示 |
| `stack-with-names` | アバター + "Alice, Bob & 2 others" |
| `expanded-list` | About モーダルで全員フルネーム + 役割 |

## Props 相当

```ts
type Host = {
  id: string;
  name: string;
  avatarUrl: string;
  username?: string;
  role?: 'host' | 'co-host' | 'manager' | 'check-in';
  isVerified?: boolean;
};

type HostAvatarStackProps = {
  hosts: Host[];
  size?: 'xs' | 'sm' | 'md' | 'lg';
  maxVisible?: number; // 残りは "+N" で省略
  showNames?: boolean;
  onClickHost?: (host: Host) => void;
};
```

## サイズトークン

| size | 直径 | 文字 | フォント |
| --- | --- | --- | --- |
| xs | 20px | 8px | 14 / 500 |
| sm | 28px | 10px | 14 / 500 |
| md | 36px | 12px | 16 / 600 |
| lg | 48px | 14px | 18 / 600 |

オーバーラップは前のアバターの右端に `-ml-2` (8px) で重ね、各アバターに 2px 白枠 `ring-2 ring-white`。

## 状態バリエーション

- **Verified host** — 青チェックバッジを右下に重ね
- **Organization** — 角丸 8px の四角アイコン (個人と区別)
- **No avatar** — イニシャル (例 "AS") + 自動生成カラー (name 文字列を hash → HSL)
- **Loading** — neutral-200 の skeleton 円
- **Hover** — `scale-110` で前面に出す (オーバーラップ時)

## レスポンシブ

- Mobile: maxVisible を 3 にし、それ以上は `+N`
- Desktop: 5 まで表示

## A11y

- 親要素に `aria-label="Hosted by Alice Smith, Bob Tan and 2 others"` をまとめて付与
- 個別の `<img alt>` は名前
- キーボードで個別ホストにフォーカス可 (将来ホストプロフへ遷移する想定)

## React 実装案

```tsx
export function HostAvatarStack({ hosts, size = 'md', maxVisible = 4, showNames }: HostAvatarStackProps) {
  const visible = hosts.slice(0, maxVisible);
  const overflow = hosts.length - visible.length;
  const sizeClass = { xs: 'size-5', sm: 'size-7', md: 'size-9', lg: 'size-12' }[size];

  return (
    <div className="flex items-center gap-3">
      <div className="flex -space-x-2">
        {visible.map((h) => (
          <Avatar key={h.id} host={h} className={cn(sizeClass, 'ring-2 ring-white')} />
        ))}
        {overflow > 0 && (
          <div className={cn(sizeClass, 'ring-2 ring-white grid place-items-center rounded-full bg-neutral-200 text-xs font-medium')}>
            +{overflow}
          </div>
        )}
      </div>
      {showNames && (
        <p className="text-sm text-neutral-700">
          <span className="text-neutral-500">Hosted by</span>{' '}
          <span className="font-semibold">{formatHostNames(hosts)}</span>
        </p>
      )}
    </div>
  );
}

function Avatar({ host, className }: { host: Host; className?: string }) {
  return host.avatarUrl ? (
    <img src={host.avatarUrl} alt={host.name} className={cn('rounded-full object-cover', className)} />
  ) : (
    <div
      className={cn('grid place-items-center rounded-full text-white font-semibold', className)}
      style={{ backgroundColor: hashColor(host.name) }}
    >
      {host.name.slice(0, 1)}
    </div>
  );
}
```

## hash color helper

```ts
function hashColor(name: string) {
  const hue = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return `hsl(${hue}, 65%, 55%)`;
}
```

## 真似すべきポイント

connpass はイベント主催者を「テキストの団体名」だけで表現するが、Luma は**顔写真があるだけで信頼感が跳ね上がる**。とくにテックイベントは「あの人が主催」が参加動機なので、ホストアバターを大きく出すことに価値がある。
