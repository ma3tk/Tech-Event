"use client";

/**
 * ShareModal の client-side dynamic wrapper。
 *
 * - `next/dynamic` で `ssr: false` 指定し、Radix Dialog + qrcode-svg を含む
 *   ShareModal 本体を初回ロードから外す。
 * - トリガーは Modal 本体 (`ShareModal`) 内で描画されるため、本ラッパーが
 *   置かれた箇所はマウント時に動的 import が走るが、ボタン以外の重い処理
 *   (qrcode-svg の Dialog 内 useEffect) は open まで走らない。
 * - 結果として:
 *    - 初回 navigation 時の JS から `ShareModal.tsx` + `@radix-ui/react-dialog`
 *      + `lucide-react` 一部を切り離せる。
 *    - `qrcode-svg` (~300KB on disk) はモーダル open 時に await import される
 *      ため、ボタンをクリックするまで未取得。
 * - SSR を切るのは Dialog のフォーカストラップが server で意味を持たないため。
 */
import dynamic from "next/dynamic";
import type { ComponentProps } from "react";

import { Skeleton } from "@tech-event/shared-ui";
import type ShareModal from "./ShareModal";

type Props = ComponentProps<typeof ShareModal>;

const ShareModalClient = dynamic(() => import("./ShareModal"), {
  ssr: false,
  loading: () => (
    <Skeleton
      className="h-9 w-full"
      data-testid="share-modal-loading"
    />
  ),
});

export default function ShareModalDynamic(props: Props) {
  return <ShareModalClient {...props} />;
}
