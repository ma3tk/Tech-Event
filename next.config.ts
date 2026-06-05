import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 画像最適化対象のリモートホストを許可。
  // - picsum.photos: シードイメージのプレースホルダ (seed 経由)
  // - i.pravatar.cc: ユーザーアバターのモック
  // - api.dicebear.com: アバター fallback
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
    // dev で large bundle を避けるため、最も使うサイズに絞る
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
};

export default nextConfig;
