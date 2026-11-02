// 「○人が見ています」：日本時間19時を山にした正規分布＋1分ごとのばらつき（5〜10人）。3〜6時は0人
// 同じ作品・同じ分なら誰が開いても同じ数字になる
const SIGMA = 4; // 山の広がり（時間）。小さくすると19時前後だけ多くなる

function hash01(s) { // 文字列 → 0〜1 の決まった値（FNV-1a）
  let h = 2166136261;
  for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return (h >>> 0) / 4294967296;
}

function viewers(id, now = Date.now()) {
  const h = (now / 3600e3 + 9) % 24;
  if (h >= 3 && h < 6) return 0;
  const d = Math.min(Math.abs(h - 19), 24 - Math.abs(h - 19));
  const w = Math.exp(-d * d / (2 * SIGMA * SIGMA));
  const r = hash01(id + ":" + Math.floor(now / 60000));
  return Math.min(10, Math.max(5, Math.round(5 + 5 * w + (r * 2 - 1) * 1.5)));
}

document.querySelectorAll(".viewers").forEach(el => {
  const show = () => el.textContent = `${viewers(el.dataset.id)}人が見ています`;
  show();
  setInterval(show, 60000);
});
