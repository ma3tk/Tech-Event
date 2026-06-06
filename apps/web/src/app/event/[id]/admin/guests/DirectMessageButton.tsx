/**
 * 主催者 → 個別参加者への 1:1 メッセージ送信ボタン + モーダル (Client Component)。
 *
 * Guests テーブルの各行に配置され、押すとモーダルが開いて件名 / 本文を入力 →
 * `sendDirectMessage` Server Action を起動する。
 */
"use client";

import { useState } from "react";
import { MessageSquare } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { sendDirectMessage } from "@/app/actions/event-admin-actions";

export interface DirectMessageButtonProps {
  eventId: string;
  participantId: string;
  recipientName: string;
}

export default function DirectMessageButton({
  eventId,
  participantId,
  recipientName,
}: DirectMessageButtonProps): React.JSX.Element {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState<string>("");
  const [body, setBody] = useState<string>("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          data-testid={`admin-guest-dm-${participantId}`}
          className="inline-flex h-8 items-center gap-1 rounded border border-border bg-surface px-2 text-xs hover:bg-brand-orange-soft"
        >
          <MessageSquare aria-hidden className="h-3 w-3" />
          メッセージ
        </button>
      </DialogTrigger>
      <DialogContent
        data-testid={`admin-guest-dm-modal-${participantId}`}
        className="max-w-md"
      >
        <DialogHeader>
          <DialogTitle>{recipientName} さんにメッセージ</DialogTitle>
          <DialogDescription>
            この参加者にだけ届く 1:1 メッセージを送信します。受信者の通知センターに表示されます。
          </DialogDescription>
        </DialogHeader>
        <form
          action={sendDirectMessage}
          className="mt-2 flex flex-col gap-3"
          data-testid={`admin-guest-dm-form-${participantId}`}
        >
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="participantId" value={participantId} />
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">件名</span>
            <input
              type="text"
              name="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              maxLength={200}
              className="h-9 rounded-md border border-border bg-background px-3 text-sm"
              data-testid={`admin-guest-dm-subject-${participantId}`}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-foreground">本文</span>
            <textarea
              name="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={6}
              maxLength={20_000}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              data-testid={`admin-guest-dm-body-${participantId}`}
            />
          </label>
          <DialogFooter className="gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm font-medium hover:bg-brand-orange-soft"
            >
              キャンセル
            </button>
            <button
              type="submit"
              data-testid={`admin-guest-dm-submit-${participantId}`}
              className="inline-flex h-9 items-center rounded-md bg-brand-orange px-3 text-sm font-semibold text-white hover:bg-brand-orange-hover"
            >
              送信
            </button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
