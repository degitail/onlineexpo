// 票数を0から数え上げて表示する（読み込み時に1回）
document.querySelectorAll(".count").forEach(el => {
  const n = +el.dataset.n, t0 = performance.now(), ms = 900;
  const step = t => {
    const p = Math.min(1, (t - t0) / ms);
    el.textContent = `${Math.round(n * (1 - (1 - p) ** 3))}票`;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
});
