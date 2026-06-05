/**
 * `/bookmarks` ページの選択 + カレンダー追加 UI (Client Component)。
 *
 * 機能:
 *  - チェックボックスでブックマーク行を個別選択 / 全選択 / 全解除
 *  - 選択件数を「選択した X 件をカレンダーに追加」ボタンに反映
 *  - ボタンを押すとモーダルが開き:
 *    - 「新規カレンダーを作る」: name / description を入力
 *    - 「既存カレンダーに追加」: 自分の所有 calendar を select から選ぶ
 *  - 「カレンダーに追加」で `createCalendarFromBookmarks` Server Action を呼ぶ
 *
 * 親 (`/bookmarks/page.tsx`) はブックマーク一覧の `data-bookmark-event-id` を
 * 各行に付与し、本コンポーネントが `document.querySelectorAll` 経由でチェック状態と
 * 同期する。
 */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarPlus } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createCalendarFromBookmarks } from "@/app/actions/calendar-actions";

export interface OwnedCalendarOption {
  slug: string;
  name: string;
}

export interface BookmarksCalendarToolProps {
  allEventIds: string[];
  defaultName: string;
  ownedCalendars: OwnedCalendarOption[];
}

const SELECTED_EVENT_ATTR = "data-bookmark-event-id";

export default function BookmarksCalendarTool({
  allEventIds,
  defaultName,
  ownedCalendars,
}: BookmarksCalendarToolProps): React.JSX.Element {
  // 選択状態 (eventId string → boolean)
  const [selected, setSelected] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    for (const id of allEventIds) init[id] = false;
    return init;
  });

  // 全選択 / 全解除 ボタン
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [name, setName] = useState<string>(defaultName);
  const [description, setDescription] = useState<string>("");
  const [existingSlug, setExistingSlug] = useState<string>(
    ownedCalendars[0]?.slug ?? "",
  );

  const selectedIds = useMemo(
    () => Object.entries(selected).filter(([, v]) => v).map(([k]) => k),
    [selected],
  );

  /**
   * UI 上のチェックボックスとこのコンポーネントの内部状態を双方向にバインドする。
   *
   * リスト DOM は親の Server Component が描画しているため、ここでは
   * `document.querySelectorAll('[data-bookmark-event-id]')` で input を拾い、
   * `change` イベントを購読して `selected` state を更新する。
   */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const inputs = document.querySelectorAll<HTMLInputElement>(
      `input[type="checkbox"][${SELECTED_EVENT_ATTR}]`,
    );
    const handlers: { el: HTMLInputElement; fn: (e: Event) => void }[] = [];
    inputs.forEach((el) => {
      const id = el.getAttribute(SELECTED_EVENT_ATTR);
      if (!id) return;
      const fn = (): void => {
        setSelected((prev) => ({ ...prev, [id]: el.checked }));
      };
      el.addEventListener("change", fn);
      handlers.push({ el, fn });
    });
    return () => {
      for (const { el, fn } of handlers) el.removeEventListener("change", fn);
    };
  }, []);

  const setAll = useCallback(
    (next: boolean): void => {
      const map: Record<string, boolean> = {};
      for (const id of allEventIds) map[id] = next;
      setSelected(map);
      const inputs = document.querySelectorAll<HTMLInputElement>(
        `input[type="checkbox"][${SELECTED_EVENT_ATTR}]`,
      );
      inputs.forEach((el) => {
        el.checked = next;
      });
    },
    [allEventIds],
  );

  const count = selectedIds.length;

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      data-testid="bookmarks-calendar-tool"
    >
      <button
        type="button"
        onClick={() => setAll(true)}
        data-testid="bookmarks-select-all"
        className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-xs font-medium hover:bg-brand-orange-soft"
      >
        全選択
      </button>
      <button
        type="button"
        onClick={() => setAll(false)}
        data-testid="bookmarks-select-none"
        className="inline-flex h-9 items-center rounded-md border border-border bg-background px-3 text-xs font-medium hover:bg-brand-orange-soft"
      >
        全解除
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button
            type="button"
            disabled={count === 0}
            data-testid="bookmarks-create-calendar-from-selection"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-brand-orange px-4 text-sm font-semibold text-white shadow hover:bg-brand-orange-hover disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            <CalendarPlus aria-hidden className="h-4 w-4" />
            選択した{" "}
            <span data-testid="bookmarks-selected-count">{count}</span> 件をカレンダーに追加
          </button>
        </DialogTrigger>
        <DialogContent
          data-testid="bookmarks-calendar-modal"
          className="max-w-md"
        >
          <DialogHeader>
            <DialogTitle>カレンダーに追加</DialogTitle>
            <DialogDescription>
              選択した {count} 件のイベントをカレンダーに追加します。
            </DialogDescription>
          </DialogHeader>

          <form
            action={createCalendarFromBookmarks}
            className="mt-2 flex flex-col gap-4"
            data-testid="bookmarks-calendar-form"
          >
            {selectedIds.map((id) => (
              <input
                key={id}
                type="hidden"
                name="eventIds"
                value={id}
              />
            ))}

            <fieldset className="flex flex-col gap-2 text-sm">
              <legend className="text-xs font-semibold text-muted-foreground">
                追加先
              </legend>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="targetMode"
                  value="new"
                  checked={mode === "new"}
                  onChange={() => setMode("new")}
                  data-testid="bookmarks-target-new"
                />
                新規カレンダーを作る
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="targetMode"
                  value="existing"
                  checked={mode === "existing"}
                  onChange={() => setMode("existing")}
                  disabled={ownedCalendars.length === 0}
                  data-testid="bookmarks-target-existing"
                />
                既存カレンダーに追加 (
                {ownedCalendars.length === 0
                  ? "なし"
                  : `${ownedCalendars.length}件`}
                )
              </label>
            </fieldset>

            {mode === "new" ? (
              <>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-foreground">
                    カレンダー名
                  </span>
                  <input
                    type="text"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    data-testid="bookmarks-calendar-name"
                    className="h-9 rounded-md border border-border bg-background px-3 text-sm"
                    required
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm">
                  <span className="font-medium text-foreground">説明</span>
                  <textarea
                    name="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={3}
                    data-testid="bookmarks-calendar-description"
                    className="rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="自分のブックマークから一括作成"
                  />
                </label>
              </>
            ) : (
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-foreground">
                  追加先のカレンダー
                </span>
                <select
                  name="existingCalendarSlug"
                  value={existingSlug}
                  onChange={(e) => setExistingSlug(e.target.value)}
                  data-testid="bookmarks-existing-slug-select"
                  className="h-9 rounded-md border border-border bg-background px-2 text-sm"
                >
                  {ownedCalendars.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name} ({c.slug})
                    </option>
                  ))}
                </select>
              </label>
            )}

            <DialogFooter className="mt-2 gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium hover:bg-brand-orange-soft"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={count === 0}
                data-testid="bookmarks-calendar-submit"
                className="inline-flex h-10 items-center rounded-md bg-brand-orange px-4 text-sm font-semibold text-white hover:bg-brand-orange-hover disabled:bg-zinc-300"
              >
                カレンダーに追加
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
