---
description: 2 色の WCAG コントラスト比を計算 (AA / AAA 判定込み)
argument-hint: <fg> <bg>
---

# /contrast

任意の 2 色 (HEX / rgb()) の WCAG 2.1 相対輝度ベースのコントラスト比を計算し、AA / AAA 判定を返す。`design-token-explorer` agent の単発確認版。

AA 判定は `Design.md` §11 (継続的検証) の必須項目、AAA は high-contrast テーマで必達。判定対象のブランド色は Design.md §2 で定義された orange `#c2410c` / red `#d23a3a` / link `#005d8c` を起点に運用する。

## 使い方

```
/contrast #1f2937 #f9fafb
/contrast rgb(31,41,55) rgb(249,250,251)
/contrast #6b7280 #ffffff
```

引数:
- `$1` = 前景色 (foreground)
- `$2` = 背景色 (background)

## 実行内容

Bash で node ワンライナーを実行して計算:

```bash
node -e '
function parse(s) {
  s = s.trim();
  if (s.startsWith("#")) {
    const h = s.slice(1);
    const v = h.length === 3
      ? h.split("").map(c => parseInt(c + c, 16))
      : [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
    return v;
  }
  const m = s.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (m) return [m[1], m[2], m[3]].map(Number);
  throw new Error("unsupported color: " + s);
}
function lum([r, g, b]) {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
const [fg, bg] = [process.argv[1], process.argv[2]];
const L = [lum(parse(fg)), lum(parse(bg))].sort((a, b) => b - a);
const ratio = (L[0] + 0.05) / (L[1] + 0.05);
const r = ratio.toFixed(2);
const aaN = ratio >= 4.5 ? "PASS" : "FAIL";
const aaaN = ratio >= 7 ? "PASS" : "FAIL";
const aaL = ratio >= 3 ? "PASS" : "FAIL";
const aaaL = ratio >= 4.5 ? "PASS" : "FAIL";
const aaUI = ratio >= 3 ? "PASS" : "FAIL";
console.log(`fg=${fg}  bg=${bg}  ratio=${r}:1`);
console.log("");
console.log("Normal text (< 18pt or < 14pt bold):");
console.log("  WCAG AA  (4.5:1): " + aaN);
console.log("  WCAG AAA (7.0:1): " + aaaN);
console.log("Large text (>= 18pt or >= 14pt bold):");
console.log("  WCAG AA  (3.0:1): " + aaL);
console.log("  WCAG AAA (4.5:1): " + aaaL);
console.log("UI components / graphics:");
console.log("  WCAG AA  (3.0:1): " + aaUI);
' "$1" "$2"
```

## 出力例

```
fg=#1f2937  bg=#f9fafb  ratio=14.32:1

Normal text (< 18pt or < 14pt bold):
  WCAG AA  (4.5:1): PASS
  WCAG AAA (7.0:1): PASS
Large text (>= 18pt or >= 14pt bold):
  WCAG AA  (3.0:1): PASS
  WCAG AAA (4.5:1): PASS
UI components / graphics:
  WCAG AA  (3.0:1): PASS
```

## 注意

- 透過度 (alpha) を含む色は背景合成が必要。本コマンドは不透明色のみ対応
- HSL / oklch は対応外。HEX または `rgb()` のみ
- 判定アルゴリズムは WCAG 2.1。WCAG 3 (APCA) 対応は別途
- CLAUDE.md §4.1 の HC テーマ判定 (AAA 必達) との整合チェックに使う
