// 応募フォームの URL（フォームを作ったら差し替える）。作品データ APPS は data.js（build.py が生成）
const APPLY_URL = "https://docs.google.com/forms/d/e/1FAIpQLScEji_qMJN-BxBYaiNHoy4ybokrVzFev1Lb0x0jSaS6IVyVNw/viewform";

document.querySelectorAll(".apply").forEach(a => a.href = APPLY_URL);

// rank を渡すと順位を表示する。投票バトル参加作品はサムネ右上に票数
function render(list, rank) {
  list.forEach((a, i) => {
    const card = document.createElement("a");
    card.className = "card";
    card.href = `w/${a.id}.html`;
    card.innerHTML = `<div class="thumb"></div><div class="body"><h3></h3><p></p><div class="tags"></div></div>`;
    const t = card.querySelector(".thumb");
    if (a.imgs[0]) t.style.backgroundImage = `url(${a.imgs[0]})`;
    else t.textContent = a.title;
    if (a.video) {
      const v = Object.assign(document.createElement("video"), { src:a.video, muted:true, loop:true, playsInline:true });
      t.append(v);
      card.onmouseenter = () => v.play();
      card.onmouseleave = () => v.pause();
      // スマホ：画面に入ったら再生
      new IntersectionObserver(([e]) => e.isIntersecting ? v.play() : v.pause(), { threshold:.6 }).observe(card);
    }
    if (isNew(a)) t.insertAdjacentHTML("beforeend", `<span class="new">NEW</span>`);
    if (a.battle) t.insertAdjacentHTML("beforeend", `<span class="count" data-n="${a.votes}">${a.votes}票</span>`);
    card.querySelector("h3").textContent = (rank ? `${i + 1}位　` : "") + a.title;
    card.querySelector("p").textContent = a.short;
    card.querySelector(".tags").textContent = a.by + (rank ? ` ／ ${a.votes}票` : "");
    document.getElementById("grid").append(card);
  });
}

// 掲載（フォーム送信）から3日以内か。start は「2026/11/03 7:07:45」形式の日本時間
function isNew(a) {
  const [y, mo, d, h, mi, se] = a.start.split(/\D+/).map(Number);
  return Date.now() - (Date.UTC(y, mo - 1, d, h, mi, se) - 9 * 36e5) < 3 * 864e5;
}
