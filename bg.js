// 背景：白い数字が縦に流れる（映画マトリックス風）。各列はランダムな間隔で流れ始める
(() => {
  const c = document.createElement("canvas"), g = c.getContext("2d"), S = 18;
  c.id = "bg";
  document.body.prepend(c);
  let drops = [];
  const resize = () => {
    // スマホはスクロールでアドレスバーが動いて高さだけ変わる。そこで描き直すと数字が消えるので無視する
    if (c.width === innerWidth && c.height >= innerHeight) return;
    c.width = innerWidth; c.height = innerHeight;
    drops = Array.from({ length: Math.ceil(c.width / S) }, () => -Math.random() * 100);
  };
  resize();
  addEventListener("resize", resize);
  setInterval(() => {
    g.globalCompositeOperation = "destination-out"; // 前の文字を少しずつ消して尾を引かせる
    g.fillStyle = "rgba(0,0,0,.08)";
    g.fillRect(0, 0, c.width, c.height);
    g.globalCompositeOperation = "source-over";
    g.fillStyle = "#fff";
    g.font = `${S - 2}px Consolas, monospace`;
    drops.forEach((y, i) => {
      if (y >= 0) g.fillText(Math.floor(Math.random() * 10), i * S, y * S);
      // 画面下まで来たら、しばらく休んでからまた上から流す
      drops[i] = y * S > c.height ? -Math.random() * 80 : y + 1;
    });
  }, 60);
})();
