// 投票：Apps Script の URL（gas/vote.gs を公開したら差し替える）
// ponytail: 1人1票はブラウザの記録だけで止めている。別端末・シークレットなら再投票できる
const VOTE_API = "https://script.google.com/macros/s/AKfycbx_gxGqy6cIcCTMm6ZjeX77fixzrtL7_Y8kA0vWkdjWTirFDra_Jn88qDqsszFp8Tl36Q/exec";
const DEADLINE = new Date("2026-11-30T23:59:59+09:00");

document.querySelectorAll(".vote").forEach(b => {
  const done = msg => { b.disabled = true; b.textContent = msg; };
  if (Date.now() > DEADLINE) return done("投票は締め切りました");
  const voted = localStorage.getItem("voted");
  if (voted) return done(voted === b.dataset.id ? "投票済み" : "投票済み（1人1作品）");
  b.onclick = async () => {
    if (!VOTE_API || !confirm("この作品に投票しますか？（1人1作品まで）")) return;
    done("送信中…");
    try {
      await fetch(VOTE_API, { method:"POST", mode:"no-cors", body:new URLSearchParams({ id:b.dataset.id }) });
      localStorage.setItem("voted", b.dataset.id);
      done("投票しました（反映は1時間以内）");
    } catch { b.disabled = false; b.textContent = "送信できませんでした。もう一度"; }
  };
});
