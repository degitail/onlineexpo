// 最初の画面：作品サムネの丸がふわふわ動く。タップで一覧へ。同じ訪問中は1回だけ
(() => {
  if (sessionStorage.getItem("entered")) return;
  const intro = document.createElement("button");
  intro.id = "intro";
  intro.innerHTML = `<span class="intro-title"><strong>Degitail Expo</strong><small>生成AIで作ったアプリの展示会</small><em>タップして入場</em></span>`;
  document.body.classList.add("intro");
  document.body.append(intro);

  // 展示中の作品をすべて出す（画像がなければ動画、それもなければ作品名）。21個目からは数に応じて丸を小さくする
  const list = APPS;
  const R = () => Math.max(16, Math.min(innerWidth, innerHeight) * .11 * Math.min(1, Math.sqrt(20 / list.length))); // 丸の半径
  const orbs = list.map(a => {
    const el = document.createElement("span");
    el.className = "orb";
    if (a.imgs[0]) el.style.backgroundImage = `url(${a.imgs[0]})`;
    else if (a.video) el.append(Object.assign(document.createElement("video"), { src:a.video, muted:true, autoplay:true, loop:true, playsInline:true }));
    else el.textContent = a.title;
    intro.prepend(el);
    return { el, x:Math.random(), y:Math.random(), dir:Math.random() * 6.28, speed:.4 + Math.random() * .5, r:R() * (.7 + Math.random() * .5) };
  });
  orbs.forEach(o => { o.x *= innerWidth - o.r * 2; o.y *= innerHeight - o.r * 2; o.el.style.width = o.el.style.height = `${o.r * 2}px`; });

  // 縁：小さな四角を円周に並べ、ときどき内外に1マスずれさせてデジタルっぽくチラつかせる
  const cv = document.createElement("canvas");
  cv.className = "edges";
  intro.prepend(cv);
  const g = cv.getContext("2d"), PX = 4; // 四角の大きさ
  const fit = () => { cv.width = innerWidth; cv.height = innerHeight; };
  fit(); addEventListener("resize", fit);
  orbs.forEach(o => o.jit = Array.from({ length: Math.ceil(o.r * 2 * Math.PI / PX) }, () => 0));
  const edges = () => {
    g.clearRect(0, 0, cv.width, cv.height);
    g.fillStyle = "#000";
    orbs.forEach(o => {
      const cx = o.x + o.r, cy = o.y + o.r, n = o.jit.length;
      o.jit.forEach((j, i) => {
        if (Math.random() < .08) o.jit[i] = Math.floor(Math.random() * 3) - 1; // -1, 0, 1 マス
        const a = i / n * 6.283, d = o.r + o.jit[i] * PX;
        // マス目にそろえて置く（ドット絵の格子）
        g.fillRect(Math.round((cx + Math.cos(a) * d) / PX) * PX - PX / 2, Math.round((cy + Math.sin(a) * d) / PX) * PX - PX / 2, PX, PX);
      });
    });
  };

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
    edges();
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
