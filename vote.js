// 投票：Apps Script の URL（gas/vote.gs を公開したら差し替える）
// ponytail: 1人3票はブラウザの記録だけで止めている。別端末・シークレットなら再投票できる
const VOTE_API = "https://script.google.com/macros/s/AKfycbx_gxGqy6cIcCTMm6ZjeX77fixzrtL7_Y8kA0vWkdjWTirFDra_Jn88qDqsszFp8Tl36Q/exec";
const DEADLINE = new Date("2026-11-30T23:59:59+09:00");
const MAX_VOTES = 3;

// 旧方式（1人1票、"voted" に作品ID1つ）の記録も数える
const myVotes = () => JSON.parse(localStorage.getItem("votes") || JSON.stringify(localStorage.getItem("voted") ? [localStorage.getItem("voted")] : []));

function shareLinks(b) {
  const text = `「${b.dataset.title}」に投票しました #DegitailExpo`, url = location.href;
  const x = "https://x.com/intent/post?text=" + encodeURIComponent(`${text} ${url}`);
  const th = "https://www.threads.com/intent/post?text=" + encodeURIComponent(`${text} ${url}`);
  b.insertAdjacentHTML("afterend", `<a class="btn" href="${x}" target="_blank" rel="noopener">投票をXで伝える</a><a class="btn" href="${th}" target="_blank" rel="noopener">投票をThreadsで伝える</a>`);
}

document.querySelectorAll(".vote").forEach(b => {
  const done = msg => { b.disabled = true; b.textContent = msg; };
  if (Date.now() > DEADLINE) return done("投票は締め切りました");
  const votes = myVotes();
  if (votes.includes(b.dataset.id)) return done("投票済み");
  if (votes.length >= MAX_VOTES) return done(`投票済み（1人${MAX_VOTES}作品まで）`);
  b.onclick = async () => {
    const left = MAX_VOTES - myVotes().length;
    if (!VOTE_API || !confirm(`この作品に投票しますか？（あと${left}作品に投票できます）`)) return;
    done("送信中…");
    try {
      await fetch(VOTE_API, { method:"POST", mode:"no-cors", body:new URLSearchParams({ id:b.dataset.id }) });
      localStorage.setItem("votes", JSON.stringify([...myVotes(), b.dataset.id]));
      done(`投票しました（反映は1時間以内・残り${left - 1}票）`);
      shareLinks(b);
    } catch { b.disabled = false; b.textContent = "送信できませんでした。もう一度"; }
  };
});
