// 最初の画面：作品サムネの丸がふわふわ動く。タップで一覧へ。同じ訪問中は1回だけ
(() => {
  if (sessionStorage.getItem("entered")) return;
  const intro = document.createElement("button");
  intro.id = "intro";
  intro.innerHTML = `<span class="intro-title"><strong>Degitail Expo</strong><small>生成AIで作ったアプリの展示会</small><em>タップして入場</em></span>`;
  document.body.classList.add("intro");
  document.body.append(intro);

  const R = () => Math.max(36, Math.min(innerWidth, innerHeight) * .11); // 丸の半径
  const orbs = APPS.filter(a => a.imgs[0]).sort(() => Math.random() - .5).slice(0, 20).map(a => {
    const el = document.createElement("span");
    el.className = "orb";
    el.style.backgroundImage = `url(${a.imgs[0]})`;
    intro.prepend(el);
    return { el, x:Math.random(), y:Math.random(), dir:Math.random() * 6.28, speed:.4 + Math.random() * .5, r:R() * (.7 + Math.random() * .5) };
  });
  orbs.forEach(o => { o.x *= innerWidth - o.r * 2; o.y *= innerHeight - o.r * 2; o.el.style.width = o.el.style.height = `${o.r * 2}px`; });

  let open = true;
  const place = o => o.el.style.transform = `translate(${o.x}px,${o.y}px)`;
  const move = () => {
    if (!open) return;
    orbs.forEach(o => {
      o.dir += (Math.random() - .5) * .12; // 向きを少しずつ変えて、ふらふらさせる
      o.x += Math.cos(o.dir) * o.speed;
      o.y += Math.sin(o.dir) * o.speed;
      const maxX = innerWidth - o.r * 2, maxY = innerHeight - o.r * 2;
      if (o.x < 0 || o.x > maxX) { o.dir = Math.PI - o.dir; o.x = Math.min(Math.max(o.x, 0), maxX); }
      if (o.y < 0 || o.y > maxY) { o.dir = -o.dir; o.y = Math.min(Math.max(o.y, 0), maxY); }
      place(o);
    });
    requestAnimationFrame(move);
  };
  move();

  intro.onclick = () => {
    open = false;
    sessionStorage.setItem("entered", "1");
    intro.remove();
    document.body.classList.remove("intro");
    scrollTo(0, 0);
  };
})();
