import { useId } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

export type SearchBoxProps = {
  /** 初期値 */
  defaultValue?: string;
  /** 送信先 URL。デフォルトは `/search` で GET 送信。 */
  action?: string;
  /** input の name 属性。デフォルトは `q` */
  name?: string;
  /** プレースホルダ */
  placeholder?: string;
  /** スタイルバリアント */
  variant?: "header" | "hero";
  /**
   * `<label htmlFor>` で参照する input の id。
   * 省略時は `useId()` で生成し、複数 SearchBox が同居する場合でも
   * id 衝突 (axe `duplicate-id` 違反) を起こさないようにする。
   */
  inputId?: string;
  className?: string;
};

/**
 * ヘッダー内検索ボックス。
 * 通常の `<form method="get">` として実装し、submit で `/search?q=...` に遷移する
 * (JS なしでも動く)。アクセシビリティのため `role="search"` と `<label>` (sr-only) を付与。
 *
 * 内部の送信ボタンは `ui/Button` (variant=default, brand-orange) を流用。
 * input はネイティブ `<input type="search">` を維持 (左にアイコン + 右に隣接ボタン、
 * という独特の rounded-l/rounded-r レイアウトのため `ui/Input` は使わず、
 * 既存の見た目を保持)。
 */
export default function SearchBox({
  defaultValue,
  action = "/search",
  name = "q",
  placeholder = "イベントを検索",
  variant = "header",
  inputId: inputIdProp,
  className,
}: SearchBoxProps) {
  const autoId = useId();
  const inputId = inputIdProp ?? `searchbox-${autoId}`;
  const isHero = variant === "hero";
  return (
    <form
      role="search"
      action={action}
      method="get"
      className={cn(
        "flex items-center w-full",
        isHero ? "max-w-2xl" : "max-w-md",
        className,
      )}
    >
      <label htmlFor={inputId} className="sr-only">
        イベントを検索
      </label>
      <div className="relative flex-1">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted"
        />
        <input
          id={inputId}
          name={name}
          type="search"
          defaultValue={defaultValue}
          placeholder={placeholder}
          autoComplete="off"
          className={cn(
            "w-full rounded-l-md border border-border bg-surface pl-9 pr-3 text-sm",
            isHero ? "h-12 text-base" : "h-9",
            "placeholder:text-muted focus:outline-none focus:border-brand-orange",
          )}
        />
      </div>
      <Button
        type="submit"
        aria-label="検索"
        // ui/Button の rounded-md を rounded-r-md に上書き、検索ボックスと
        // 一体化させる。`h-9`/`h-12` を維持するため size を md に固定して
        // ハイト/幅を className で再指定 (tailwind-merge の後勝ち)。
        size="md"
        className={cn(
          "rounded-l-none rounded-r-md px-4",
          isHero ? "h-12 text-base" : "h-9 text-sm",
        )}
      >
        <Search aria-hidden="true" className="h-4 w-4" />
        <span className="sr-only">検索</span>
      </Button>
    </form>
  );
}
