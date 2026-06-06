/**
 * 料金プランページ (Luma 風)
 *
 * - 3 プラン (Free / Plus $29/month / Enterprise) を比較
 * - 12 項目の機能比較表
 * - 5 問の FAQ (アコーディオン)
 *
 * Server Component で構築 (FAQ の折りたたみは Pure HTML `<details>` を使用)。
 */
import type { Metadata } from "next";
import Link from "next/link";
import { Check, X } from "lucide-react";

import { absoluteUrl, SITE_NAME } from "@/lib/seo";

export const dynamic = "force-static";

const PAGE_TITLE = "料金プラン";
const PAGE_DESCRIPTION =
  "tech-event の料金プラン。無料の Free / 個人主催者向け Plus / 企業向け Enterprise の 3 つから選べます。";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} - ${SITE_NAME}`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: absoluteUrl("/pricing") },
  openGraph: {
    title: `${PAGE_TITLE} - ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: absoluteUrl("/pricing"),
    type: "website",
  },
};

type PlanKey = "free" | "plus" | "enterprise";

type Plan = {
  key: PlanKey;
  name: string;
  price: string;
  cadence: string;
  description: string;
  cta: { label: string; href: string };
  highlight?: boolean;
};

const PLANS: Plan[] = [
  {
    key: "free",
    name: "Free",
    price: "¥0",
    cadence: "/ 月",
    description: "個人開発者・コミュニティ運営者向けの無料プラン",
    cta: { label: "Sign up", href: "/signup" },
  },
  {
    key: "plus",
    name: "Plus",
    price: "$29",
    cadence: "/ 月",
    description: "成長するコミュニティ向けの高機能プラン",
    cta: { label: "Upgrade", href: "/signup?plan=plus" },
    highlight: true,
  },
  {
    key: "enterprise",
    name: "Enterprise",
    price: "Contact",
    cadence: "",
    description: "大規模カンファレンス・企業向けカスタムプラン",
    cta: { label: "Contact", href: "/contact?plan=enterprise" },
  },
];

type Feature = {
  label: string;
  values: Record<PlanKey, string | boolean>;
};

/** 機能比較表 (12 項目) */
const FEATURES: Feature[] = [
  {
    label: "月次イベント開催数",
    values: { free: "3", plus: "無制限", enterprise: "無制限" },
  },
  {
    label: "1イベントあたりの参加者数",
    values: { free: "100名まで", plus: "1,000名", enterprise: "無制限" },
  },
  {
    label: "カスタムドメイン",
    values: { free: false, plus: true, enterprise: true },
  },
  {
    label: "Public API アクセス",
    values: { free: false, plus: true, enterprise: true },
  },
  {
    label: "Webhook 通知 (Slack 等)",
    values: { free: false, plus: true, enterprise: true },
  },
  {
    label: "有料イベント / 決済",
    values: { free: false, plus: true, enterprise: true },
  },
  {
    label: "詳細 Insights",
    values: { free: "基本のみ", plus: "高度な分析", enterprise: "高度+SLA" },
  },
  {
    label: "メール一斉送信",
    values: { free: "月10件", plus: "無制限", enterprise: "無制限" },
  },
  {
    label: "イベントテーマカスタマイズ",
    values: { free: false, plus: true, enterprise: true },
  },
  {
    label: "サポート",
    values: { free: "コミュニティ", plus: "メール", enterprise: "専任担当" },
  },
  {
    label: "SLA 保証",
    values: { free: false, plus: false, enterprise: "99.9%" },
  },
  {
    label: "監査ログ・SSO",
    values: { free: false, plus: false, enterprise: true },
  },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "Free プランから Plus にアップグレードできますか?",
    a: "はい。マイページの設定 > 料金プランからいつでもアップグレードできます。日割り精算に対応しています。",
  },
  {
    q: "支払い方法は何が使えますか?",
    a: "クレジットカード (Visa / Mastercard / JCB / AMEX) と PayPal に対応しています。Enterprise プランは請求書払いも可能です。",
  },
  {
    q: "途中で解約した場合の返金はありますか?",
    a: "Plus プランは月額課金のため、解約後は次回更新日まではサービスをご利用いただけます。日割り返金は対応していません。",
  },
  {
    q: "イベント参加者は料金が必要ですか?",
    a: "いいえ。料金はイベント主催者向けです。参加者はすべてのプランで完全無料でご利用いただけます。",
  },
  {
    q: "Enterprise プランの最低契約期間は?",
    a: "年間契約が基本ですが、個別にご相談に応じます。お気軽にお問い合わせください。",
  },
];

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div
      data-testid={`plan-${plan.key}`}
      className={[
        "flex flex-col rounded-lg border p-6 bg-surface",
        plan.highlight
          ? "border-brand-orange ring-2 ring-brand-orange/30 shadow-lg"
          : "border-border",
      ].join(" ")}
    >
      {plan.highlight && (
        <span className="mb-3 inline-block w-fit rounded-full bg-brand-orange px-2 py-0.5 text-xs font-semibold text-white">
          人気
        </span>
      )}
      <h2 className="text-2xl font-bold">{plan.name}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-4xl font-bold">{plan.price}</span>
        {plan.cadence && (
          <span className="text-sm text-muted-foreground">{plan.cadence}</span>
        )}
      </div>
      <Link
        href={plan.cta.href}
        data-testid={`plan-cta-${plan.key}`}
        className={[
          "mt-6 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold transition-colors",
          plan.highlight
            ? "bg-brand-orange text-white hover:bg-brand-orange-hover"
            : "border border-border bg-surface text-foreground hover:bg-brand-orange-soft",
        ].join(" ")}
      >
        {plan.cta.label}
      </Link>
    </div>
  );
}

function FeatureValue({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center text-brand-orange">
        <Check aria-label="対応" className="h-5 w-5" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center text-muted-foreground">
        <X aria-label="非対応" className="h-5 w-5" />
      </span>
    );
  }
  return <span className="text-sm">{value}</span>;
}

export default function PricingPage() {
  return (
    <div
      className="mx-auto max-w-6xl px-4 py-12 md:px-6"
      data-testid="pricing-page"
    >
      {/* ============ Hero ============ */}
      <section className="text-center">
        <h1 className="text-3xl font-bold md:text-4xl">料金プラン</h1>
        <p className="mt-3 text-muted-foreground">
          コミュニティ規模に合わせて選べる、シンプルな 3 プラン。
        </p>
      </section>

      {/* ============ Plans ============ */}
      <section
        className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3"
        data-testid="pricing-plans"
      >
        {PLANS.map((p) => (
          <PlanCard key={p.key} plan={p} />
        ))}
      </section>

      {/* ============ Compare Table ============ */}
      <section className="mt-16" data-testid="pricing-features">
        <h2 className="text-2xl font-bold">機能比較</h2>
        <div className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-background text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">機能</th>
                {PLANS.map((p) => (
                  <th
                    key={p.key}
                    className="px-4 py-3 text-center"
                    scope="col"
                  >
                    {p.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((f, i) => (
                <tr
                  key={f.label}
                  data-testid={`pricing-feature-${i}`}
                  className="border-t border-border"
                >
                  <th
                    scope="row"
                    className="px-4 py-3 text-left font-medium"
                  >
                    {f.label}
                  </th>
                  {PLANS.map((p) => (
                    <td key={p.key} className="px-4 py-3 text-center">
                      <FeatureValue value={f.values[p.key]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="mt-16" data-testid="pricing-faq">
        <h2 className="text-2xl font-bold">よくある質問</h2>
        <div className="mt-4 space-y-2">
          {FAQS.map((f, i) => (
            <details
              key={i}
              data-testid={`pricing-faq-item-${i}`}
              className="group rounded-md border border-border bg-surface p-4"
            >
              <summary className="cursor-pointer list-none font-medium marker:hidden">
                <span className="inline-flex w-full items-center justify-between gap-2">
                  <span>{f.q}</span>
                  <span
                    aria-hidden="true"
                    className="text-muted-foreground transition-transform group-open:rotate-180"
                  >
                    ▼
                  </span>
                </span>
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
