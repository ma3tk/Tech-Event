"use server";

/**
 * イベントアンケート (Survey) 用 Server Actions
 *
 * - 主催者専用: createQuestion / updateQuestion / deleteQuestion
 *   トリガーは on_apply (申込時) のみ実装。
 * - 参加者用: submitSurveyAndJoin
 *   SurveyAnswer を一括保存し、joinEvent と同様のロジックで Participant 作成。
 *
 * 既存スキーマ:
 *   Survey { id, eventId, title, trigger, required }
 *   SurveyQuestion { id, surveyId, displayOrder, body, inputType, options, required }
 *   SurveyAnswer { id, surveyQuestionId, participantId, answerValue, answeredAt }
 *
 * inputType: text|textarea|single|multi|scale
 *   text     -> 1 行テキスト
 *   textarea -> 複数行テキスト
 *   single   -> 単一選択 (options: ["A","B",...])
 *   multi    -> 複数選択 (options: ["A","B",...])
 *   scale    -> 1〜5 などの段階評価 (options: { min:1, max:5 })
 */

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { nextId } from "@/lib/id-gen";
import { ActionError } from "@/lib/action-error";
import { getString as formValue, getStringRaw as formValueRaw } from "@/lib/form-data";
import { BigIntIdString } from "@/lib/schemas";

/* ============================================================
 * 共通ヘルパー
 * ============================================================ */

const InputTypeEnum = z.enum(["text", "textarea", "single", "multi", "scale"]);

/** Survey/SurveyQuestion/SurveyAnswer の id 採番 (`@/lib/id-gen.nextId` に委譲) */
async function nextSurveyId(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
): Promise<bigint> {
  return nextId(tx, "survey");
}

async function nextSurveyQuestionId(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
): Promise<bigint> {
  return nextId(tx, "surveyQuestion");
}

async function nextSurveyAnswerId(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
): Promise<bigint> {
  return nextId(tx, "surveyAnswer");
}

async function nextParticipantId(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
): Promise<bigint> {
  return nextId(tx, "participant");
}

async function nextNotificationId(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
): Promise<bigint> {
  return nextId(tx, "notification");
}

/** イベントの主催者権限チェック (owner or group admin) */
async function assertEventAdmin(
  eventId: bigint,
  userId: bigint,
): Promise<{ ownerId: bigint; groupId: bigint }> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { ownerId: true, groupId: true },
  });
  if (!event) throw new ActionError("not_found", "イベントが見つかりません");
  if (event.ownerId === userId) return event;
  const admin = await prisma.groupAdmin.findUnique({
    where: { groupId_userId: { groupId: event.groupId, userId } },
  });
  if (!admin || (admin.role !== "owner" && admin.role !== "admin")) {
    throw new ActionError("forbidden", "このイベントを操作する権限がありません");
  }
  return event;
}

/**
 * on_apply トリガーの Survey を1件返す。なければ作成して返す。
 * (現状は 1 イベント 1 アンケート前提)
 */
async function ensureSurveyForEvent(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  eventId: bigint,
): Promise<bigint> {
  const existing = await tx.survey.findFirst({
    where: { eventId, trigger: "on_apply" },
    select: { id: true },
  });
  if (existing) return existing.id;
  const id = await nextSurveyId(tx);
  await tx.survey.create({
    data: {
      id,
      eventId,
      title: "申込時アンケート",
      trigger: "on_apply",
      required: false,
    },
  });
  return id;
}

/* ============================================================
 * createQuestion (主催者)
 * ============================================================ */

const CreateQuestionSchema = z.object({
  eventId: BigIntIdString,
  body: z.string().min(1).max(500),
  inputType: InputTypeEnum,
  options: z.string().max(5_000).optional().default(""),
  required: z.string().optional().default(""),
});

export async function createQuestion(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    const back = formValue(formData, "eventId");
    redirect(`/login?next=${encodeURIComponent(`/event/${back}/edit`)}`);
  }
  const parsed = CreateQuestionSchema.safeParse({
    eventId: formValue(formData, "eventId"),
    body: formValueRaw(formData, "body"),
    inputType: formValue(formData, "inputType"),
    options: formValueRaw(formData, "options"),
    required: formValue(formData, "required"),
  });
  if (!parsed.success) {
    throw new Error(
      `invalid_input: ${parsed.error.issues[0]?.message ?? "unknown"}`,
    );
  }
  const data = parsed.data;
  const eventId = BigInt(data.eventId);
  await assertEventAdmin(eventId, user.id);

  // options の JSON 妥当性チェック
  const optionsJson = normalizeOptionsJson(data.inputType, data.options);

  await prisma.$transaction(async (tx) => {
    const surveyId = await ensureSurveyForEvent(tx, eventId);
    // displayOrder は既存最大 + 1
    const maxOrder = await tx.surveyQuestion.aggregate({
      where: { surveyId },
      _max: { displayOrder: true },
    });
    const nextOrder = (maxOrder._max.displayOrder ?? 0) + 1;
    await tx.surveyQuestion.create({
      data: {
        id: await nextSurveyQuestionId(tx),
        surveyId,
        displayOrder: nextOrder,
        body: data.body,
        inputType: data.inputType,
        options: optionsJson,
        required: data.required === "1" || data.required === "on",
      },
    });
  });

  revalidatePath(`/event/${eventId.toString()}/edit`);
  revalidatePath(`/event/${eventId.toString()}/apply`);
  revalidatePath(`/event/${eventId.toString()}`);
}

/* ============================================================
 * updateQuestion (主催者)
 * ============================================================ */

const UpdateQuestionSchema = z.object({
  eventId: BigIntIdString,
  questionId: BigIntIdString,
  body: z.string().min(1).max(500),
  inputType: InputTypeEnum,
  options: z.string().max(5_000).optional().default(""),
  required: z.string().optional().default(""),
  displayOrder: z.string().optional().default(""),
});

export async function updateQuestion(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    const back = formValue(formData, "eventId");
    redirect(`/login?next=${encodeURIComponent(`/event/${back}/edit`)}`);
  }
  const parsed = UpdateQuestionSchema.safeParse({
    eventId: formValue(formData, "eventId"),
    questionId: formValue(formData, "questionId"),
    body: formValueRaw(formData, "body"),
    inputType: formValue(formData, "inputType"),
    options: formValueRaw(formData, "options"),
    required: formValue(formData, "required"),
    displayOrder: formValue(formData, "displayOrder"),
  });
  if (!parsed.success) {
    throw new Error(
      `invalid_input: ${parsed.error.issues[0]?.message ?? "unknown"}`,
    );
  }
  const data = parsed.data;
  const eventId = BigInt(data.eventId);
  await assertEventAdmin(eventId, user.id);

  const optionsJson = normalizeOptionsJson(data.inputType, data.options);

  const question = await prisma.surveyQuestion.findUnique({
    where: { id: BigInt(data.questionId) },
    include: { survey: true },
  });
  if (!question || question.survey.eventId !== eventId) {
    throw new Error("question_not_found");
  }

  let displayOrder: number | undefined;
  if (data.displayOrder && /^\d+$/.test(data.displayOrder)) {
    displayOrder = Number(data.displayOrder);
  }

  await prisma.surveyQuestion.update({
    where: { id: question.id },
    data: {
      body: data.body,
      inputType: data.inputType,
      options: optionsJson,
      required: data.required === "1" || data.required === "on",
      ...(displayOrder != null ? { displayOrder } : {}),
    },
  });

  revalidatePath(`/event/${eventId.toString()}/edit`);
  revalidatePath(`/event/${eventId.toString()}/apply`);
  revalidatePath(`/event/${eventId.toString()}`);
}

/* ============================================================
 * deleteQuestion (主催者)
 * ============================================================ */

const DeleteQuestionSchema = z.object({
  eventId: BigIntIdString,
  questionId: BigIntIdString,
});

export async function deleteQuestion(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) {
    const back = formValue(formData, "eventId");
    redirect(`/login?next=${encodeURIComponent(`/event/${back}/edit`)}`);
  }
  const parsed = DeleteQuestionSchema.safeParse({
    eventId: formValue(formData, "eventId"),
    questionId: formValue(formData, "questionId"),
  });
  if (!parsed.success) throw new ActionError("invalid_input", "入力内容が不正です");
  const eventId = BigInt(parsed.data.eventId);
  await assertEventAdmin(eventId, user.id);

  const question = await prisma.surveyQuestion.findUnique({
    where: { id: BigInt(parsed.data.questionId) },
    include: { survey: true },
  });
  if (!question || question.survey.eventId !== eventId) {
    return; // no-op
  }
  await prisma.surveyQuestion.delete({ where: { id: question.id } });

  revalidatePath(`/event/${eventId.toString()}/edit`);
  revalidatePath(`/event/${eventId.toString()}/apply`);
  revalidatePath(`/event/${eventId.toString()}`);
}

/* ============================================================
 * submitSurveyAndJoin (参加者): SurveyAnswer 保存 + joinEvent
 * ============================================================ */

const SubmitSchema = z.object({
  eventId: BigIntIdString,
  eventRoleId: BigIntIdString,
});

/**
 * アンケート回答を保存しつつ参加申込を行う。
 *
 * - フォームの `answer-<questionId>` (text/textarea/single/scale) と
 *   `answer-<questionId>[]` (multi) を読み出す。
 * - required な質問が空なら redirect でフォームへ戻す。
 * - 申込完了後は /event/<id> へ。
 */
export async function submitSurveyAndJoin(formData: FormData): Promise<void> {
  const parsed = SubmitSchema.safeParse({
    eventId: formValue(formData, "eventId"),
    eventRoleId: formValue(formData, "eventRoleId"),
  });
  if (!parsed.success) throw new ActionError("invalid_input", "入力内容が不正です");
  const eventId = BigInt(parsed.data.eventId);
  const eventRoleId = BigInt(parsed.data.eventRoleId);

  const user = await getCurrentUser();
  if (!user) {
    redirect(
      `/login?next=${encodeURIComponent(`/event/${eventId.toString()}/apply`)}`,
    );
  }

  // 質問取得 (validation 用)
  const survey = await prisma.survey.findFirst({
    where: { eventId, trigger: "on_apply" },
    include: { questions: { orderBy: { displayOrder: "asc" } } },
  });
  const questions = survey?.questions ?? [];

  // 回答収集 (FormData)
  type CollectedAnswer = {
    questionId: bigint;
    value: string; // JSON-encoded
  };
  const collected: CollectedAnswer[] = [];
  for (const q of questions) {
    const key = `answer-${q.id.toString()}`;
    if (q.inputType === "multi") {
      const all = formData.getAll(`${key}[]`);
      const arr = all
        .filter((v): v is string => typeof v === "string")
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
      if (q.required && arr.length === 0) {
        // 必須未回答: 申込ページに戻す
        redirect(
          `/event/${eventId.toString()}/apply?eventRoleId=${eventRoleId.toString()}&error=required`,
        );
      }
      collected.push({
        questionId: q.id,
        value: JSON.stringify(arr),
      });
    } else {
      const raw = formValueRaw(formData, key);
      if (q.required && raw.trim().length === 0) {
        redirect(
          `/event/${eventId.toString()}/apply?eventRoleId=${eventRoleId.toString()}&error=required`,
        );
      }
      collected.push({
        questionId: q.id,
        value: JSON.stringify(raw),
      });
    }
  }

  // ============ Participant 作成 + SurveyAnswer 保存 (joinEvent と同じロジック) ============
  await prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({ where: { id: eventId } });
    if (!event) throw new Error("event_not_found");
    const role = await tx.eventRole.findUnique({ where: { id: eventRoleId } });
    if (!role || role.eventId !== eventId) {
      throw new Error("role_not_found");
    }

    // 既参加チェック
    const existing = await tx.participant.findFirst({
      where: {
        eventId,
        userId: user.id,
        status: { not: "cancelled" },
      },
    });

    let participantId: bigint;
    const now = new Date();

    if (existing) {
      participantId = existing.id;
    } else if (role.recruitmentMethod === "lottery") {
      // 抽選方式
      const cancelled = await tx.participant.findFirst({
        where: {
          eventId,
          userId: user.id,
          status: "cancelled",
        },
        orderBy: { cancelledAt: "desc" },
      });
      if (cancelled) {
        await tx.participant.update({
          where: { id: cancelled.id },
          data: {
            eventRoleId,
            status: "pending",
            appliedAt: now,
            cancelledAt: null,
            acceptedAt: null,
            waitingPosition: null,
          },
        });
        participantId = cancelled.id;
      } else {
        participantId = await nextParticipantId(tx);
        await tx.participant.create({
          data: {
            id: participantId,
            eventId,
            eventRoleId,
            userId: user.id,
            status: "pending",
            appliedAt: now,
          },
        });
      }
    } else {
      // fcfs
      const acceptedInRole = await tx.participant.count({
        where: { eventId, eventRoleId, status: "accepted" },
      });
      const isFull =
        role.capacity != null && acceptedInRole >= role.capacity;
      if (isFull) {
        const waitingInRole = await tx.participant.count({
          where: { eventId, eventRoleId, status: "waiting" },
        });
        const cancelled = await tx.participant.findFirst({
          where: { eventId, userId: user.id, status: "cancelled" },
          orderBy: { cancelledAt: "desc" },
        });
        if (cancelled) {
          await tx.participant.update({
            where: { id: cancelled.id },
            data: {
              eventRoleId,
              status: "waiting",
              waitingPosition: waitingInRole + 1,
              appliedAt: now,
              cancelledAt: null,
              acceptedAt: null,
            },
          });
          participantId = cancelled.id;
        } else {
          participantId = await nextParticipantId(tx);
          await tx.participant.create({
            data: {
              id: participantId,
              eventId,
              eventRoleId,
              userId: user.id,
              status: "waiting",
              waitingPosition: waitingInRole + 1,
              appliedAt: now,
            },
          });
        }
        await tx.event.update({
          where: { id: eventId },
          data: { waitingCount: { increment: 1 } },
        });
      } else {
        const cancelled = await tx.participant.findFirst({
          where: { eventId, userId: user.id, status: "cancelled" },
          orderBy: { cancelledAt: "desc" },
        });
        if (cancelled) {
          await tx.participant.update({
            where: { id: cancelled.id },
            data: {
              eventRoleId,
              status: "accepted",
              appliedAt: now,
              acceptedAt: now,
              cancelledAt: null,
              waitingPosition: null,
            },
          });
          participantId = cancelled.id;
        } else {
          participantId = await nextParticipantId(tx);
          await tx.participant.create({
            data: {
              id: participantId,
              eventId,
              eventRoleId,
              userId: user.id,
              status: "accepted",
              appliedAt: now,
              acceptedAt: now,
            },
          });
        }
        await tx.event.update({
          where: { id: eventId },
          data: { acceptedCount: { increment: 1 } },
        });
      }
    }

    // SurveyAnswer 保存 (既存があれば上書き)
    for (const ans of collected) {
      const existingAnswer = await tx.surveyAnswer.findFirst({
        where: { surveyQuestionId: ans.questionId, participantId },
      });
      if (existingAnswer) {
        await tx.surveyAnswer.update({
          where: { id: existingAnswer.id },
          data: { answerValue: ans.value, answeredAt: now },
        });
      } else {
        await tx.surveyAnswer.create({
          data: {
            id: await nextSurveyAnswerId(tx),
            surveyQuestionId: ans.questionId,
            participantId,
            answerValue: ans.value,
            answeredAt: now,
          },
        });
      }
    }

    // 主催者通知 (自身以外)
    if (event.ownerId !== user.id) {
      await tx.notification.create({
        data: {
          id: await nextNotificationId(tx),
          recipientUserId: event.ownerId,
          kind: "participant_joined",
          eventId,
          payload: JSON.stringify({
            participantUserId: user.id.toString(),
            participantDisplayName: user.displayName,
          }),
          channel: "in_app",
        },
      });
    }
  });

  revalidatePath(`/event/${eventId.toString()}`);
  revalidatePath(`/dashboard`);
  redirect(`/event/${eventId.toString()}?applied=1`);
}

/* ============================================================
 * Pure helpers
 * ============================================================ */

/**
 * options 文字列の正規化。
 * - text/textarea: 空文字または "null" を返す
 * - single/multi: カンマ区切りまたは JSON 配列を JSON.stringify する
 * - scale: "min,max" or JSON {min,max} を JSON.stringify する
 */
function normalizeOptionsJson(inputType: string, raw: string): string | null {
  if (!raw || raw.trim() === "") return null;
  const trimmed = raw.trim();
  if (inputType === "text" || inputType === "textarea") {
    return null;
  }
  // JSON として有効ならそのまま (ただし最終的に stringify し直す)
  try {
    const parsed = JSON.parse(trimmed);
    if (inputType === "scale") {
      if (
        parsed &&
        typeof parsed === "object" &&
        Number.isFinite(parsed.min) &&
        Number.isFinite(parsed.max)
      ) {
        return JSON.stringify({ min: parsed.min, max: parsed.max });
      }
    }
    if (
      (inputType === "single" || inputType === "multi") &&
      Array.isArray(parsed)
    ) {
      return JSON.stringify(parsed.map((v) => String(v)));
    }
  } catch {
    // JSON でなければカンマ区切りとして処理
  }

  if (inputType === "scale") {
    // "1,5" → {min:1,max:5}
    const parts = trimmed.split(/[,\s]+/).map((s) => s.trim()).filter(Boolean);
    const nums = parts.map((p) => Number(p)).filter((n) => Number.isFinite(n));
    if (nums.length >= 2) {
      return JSON.stringify({ min: nums[0], max: nums[1] });
    }
    return JSON.stringify({ min: 1, max: 5 });
  }
  // single/multi: カンマ区切り
  const arr = trimmed.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
  return JSON.stringify(arr);
}
