/**
 * qrcode-svg は CommonJS / 型定義無しのため最小限の宣言を追加する。
 * 利用するのは `new QRCode({ content, padding, width, height, color, background, ecl }).svg()` のみ。
 */
declare module "qrcode-svg" {
  type ECL = "L" | "M" | "Q" | "H";
  interface QRCodeOptions {
    content: string;
    padding?: number;
    width?: number;
    height?: number;
    color?: string;
    background?: string;
    ecl?: ECL;
  }
  class QRCode {
    constructor(options: QRCodeOptions | string);
    svg(): string;
  }
  export default QRCode;
}
