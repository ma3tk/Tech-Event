/**
 * イベント複製モーダル (Client Component)
 *
 * - 各オプション (タグ / ロール / アンケート / 発表資料) のチェックボックス
 * - 開催日のシフト日数指定 (default 7)
 * - 「複製してdraft作成」ボタン → `duplicateEvent` Server Action に POST
 */
"use client";

import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { duplicateEvent } from "@/app/actions/event-admin-actions";

export interface DuplicateEventModalProps {
  eventId: string;
}

export default function DuplicateEventModal({
  eventId,
}: DuplicateEventModalProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [includeTags, setIncludeTags] = useState(true);
  const [includeRoles, setIncludeRoles] = useState(true);
  const [includeSurvey, setIncludeSurvey] = useState(false);
  const [includePresentations, setIncludePresentations] = useState(false);
  const [shiftDays, setShiftDays] = useState<number>(7);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-5 text-sm font-medium hover:bg-brand-orange-soft"
          data-testid="admin-more-duplicate-button"
        >
          このイベントを複製する
        </button>
      </DialogTrigger>
      <DialogContent data-testid="admin-more-duplicate-modal" className="max-w-md">
        <DialogHeader>
          <DialogTitle>イベントを複製</DialogTitle>
          <DialogDescription>
            コピーする要素を選択し、開催日のシフト日数を指定してください。draft 状態で作成されます。
          </DialogDescription>
        </DialogHeader>
        <form
          action={duplicateEvent}
          className="mt-2 flex flex-col gap-4"
          data-testid="admin-more-duplicate-form"
        >
          <input type="hidden" name="eventId" value={eventId} />
          {/* チェック未送信の boolean を区別するため、checked のときだけ value="1" の input を出す。
              未 checked のときは "0" を必ず送信して explicit flag として扱う。 */}
          <CheckboxRow
            name="includeRoles"
            label="参加枠 (Roles) をコピー"
            checked={includeRoles}
            onChange={setIncludeRoles}
            testId="duplicate-opt-roles"
          />
          <CheckboxRow
            name="includeTags"
            label="タグ (Tags) をコピー"
            checked={includeTags}
            onChange={setIncludeTags}
            testId="duplicate-opt-tags"
          />
          <CheckboxRow
            name="includeSurvey"
            label="アンケート (Survey) をコピー"
            checked={includeSurvey}
            onChange={setIncludeSurvey}
            testId="duplicate-opt-survey"
          />
          <CheckboxRow
            name="includePresentations"
            label="発表資料 (Presentations) をコピー"
            checked={includePresentations}
            onChange={setIncludePresentations}
            testId="duplicate-opt-presentations"
          />

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">
              開催日のシフト (日)
            </span>
            <input
              type="number"
              name="shiftDays"
              data-testid="duplicate-opt-shift-days"
              value={shiftDays}
              min={-3650}
              max={3650}
              step={1}
              onChange={(e) => setShiftDays(Number(e.target.value || 7))}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm"
            />
            <span className="text-xs text-muted-foreground">
              例: 7 → 1週間後、-7 → 1週間前、30 → 1ヶ月後
            </span>
          </label>

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
              data-testid="admin-more-duplicate-submit"
              className="inline-flex h-10 items-center rounded-md bg-brand-orange px-4 text-sm font-semibold text-white shadow hover:bg-brand-orange-hover"
            >
              複製してdraft作成
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CheckboxRow({
  name,
  label,
  checked,
  onChange,
  testId,
}: {
  name: string;
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  testId: string;
}): React.JSX.Element {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        name={name}
        value="1"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        data-testid={testId}
        className="h-4 w-4 rounded border-border accent-brand-orange"
      />
      {/* 未チェック時は明示的に "0" を送信して default=true の互換動作を回避 */}
      {!checked && <input type="hidden" name={name} value="0" />}
      <span>{label}</span>
    </label>
  );
}
