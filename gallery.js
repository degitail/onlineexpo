// 作品ページの画像を押すと全画面で拡大。横スワイプ（PCは横スクロール）で次の画像
const imgs = [...document.querySelectorAll(".gallery img")];
if (imgs.length) {
  const box = document.createElement("dialog");
  box.id = "lightbox";
  box.innerHTML = `<button class="btn">閉じる ✕</button><div class="strip">${imgs.map(i => `<img src="${i.src}" alt="">`).join("")}</div>`;
  document.body.append(box);
  const strip = box.querySelector(".strip");
  box.querySelector("button").onclick = () => box.close();
  strip.onclick = e => e.target === strip || box.close();
  imgs.forEach((img, i) => img.onclick = () => { box.showModal(); strip.scrollLeft = strip.clientWidth * i; });
}
