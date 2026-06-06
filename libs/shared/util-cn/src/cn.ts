/**
 * `clsx` と `tailwind-merge` を組み合わせて、条件付き/重複した Tailwind クラスを
 * 安全に合成するユーティリティ。コンポーネント全体で `cn(...)` として利用する。
 */
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
