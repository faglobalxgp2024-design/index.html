(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");

  const starVal = document.getElementById("starVal");
  const rankVal = document.getElementById("rankVal");
  const levelVal = document.getElementById("levelVal");
  const bonusVal = document.getElementById("bonusVal");

  const toast = document.getElementById("toast");
  const menuOverlay = document.getElementById("menuOverlay");
  const menuBtn = document.getElementById("menuBtn");
  const resetBtn = document.getElementById("resetBtn");
  const nameBtn = document.getElementById("nameBtn");
  const startBtn = document.getElementById("startBtn");
  const upgradeBtn = document.getElementById("upgradeBtn");

  const tabPlay = document.getElementById("tabPlay");
  const tabShop = document.getElementById("tabShop");
  const tabBoard = document.getElementById("tabBoard");
  const playSection = document.getElementById("playSection");
  const shopSection = document.getElementById("shopSection");
  const boardSection = document.getElementById("boardSection");

  const playerNameText = document.getElementById("playerNameText");
  const menuStarText = document.getElementById("menuStarText");
  const bestRankText = document.getElementById("bestRankText");
  const menuLevelText = document.getElementById("menuLevelText");

  const shopLevelText = document.getElementById("shopLevelText");
  const shopBonusText = document.getElementById("shopBonusText");
  const upgradeCostText = document.getElementById("upgradeCostText");

  const lbList = document.getElementById("lbList");
  const lbMode = document.getElementById("lbMode");

  const previewLv10 = document.getElementById("previewLv10");
  const previewLv20 = document.getElementById("previewLv20");
  const previewLv30 = document.getElementById("previewLv30");
  const previewLv40 = document.getElementById("previewLv40");
  const previewLv50 = document.getElementById("previewLv50");

  const W = canvas.width;
  const H = canvas.height;

  let running = false;
  let last = 0;
  let timeAlive = 0;
  let spawnHazardTimer = 0;
  let spawnStarTimer = 0;
  let rankSyncTimer = 0;

  function askNickname(initialValue = "") {
    let next = "";
    while (!next) {
      const input = prompt("Enter your nickname", initialValue);
      if (input === null) continue;
      next = String(input).trim();
    }
    return next;
  }

  let playerName = localStorage.getItem("xgp_v5_name") || "";
  if (!playerName) {
    playerName = askNickname("");
    localStorage.setItem("xgp_v5_name", playerName);
  }

  const onlineConfig = window.XGP_ONLINE_CONFIG || { enabled: false, firebaseConfig: null };
  let useFirebase = false;
  let db = null;

  const save = {
    starCurrency: Number(localStorage.getItem("xgp_v5_star") || 0),
    level: Number(localStorage.getItem("xgp_v5_level") || 1),
    bestRank: Number(localStorage.getItem("xgp_v5_best_rank") || 0),
  };

  const run = {
    rankPoint: 0,
  };

  const player = { x: W * 0.5, y: H * 0.82, r: 22, speed: 430, moveX: 0 };
  const hazards = [];
  const yellowStars = [];
  const purpleStars = [];
  const particles = [];
  const popups = [];
  const bgStars = Array.from({length: 100}, () => ({
    x: Math.random() * W, y: Math.random() * H, s: Math.random() * 2 + 1, v: Math.random() * 18 + 9
  }));

  let pointerActive = false;
  let pointerOffsetX = 0;

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("show"), 950);
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function distance(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
  function circleHit(a, b) { return distance(a.x, a.y, b.x, b.y) <= (a.r + b.r); }

  function getRankBonusPercent() {
    return save.level * 0.5;
  }

  function getYellowRankGain() {
    return 1 + (getRankBonusPercent() / 100);
  }

  function getUpgradeCost() {
    return 50 + (save.level - 1) * 25;
  }

  function persistSave() {
    localStorage.setItem("xgp_v5_star", String(Math.floor(save.starCurrency)));
    localStorage.setItem("xgp_v5_level", String(save.level));
    localStorage.setItem("xgp_v5_best_rank", String(Math.floor(save.bestRank)));
  }

  function updateHUD() {
    starVal.textContent = Math.floor(save.starCurrency).toString();
    rankVal.textContent = Math.floor(run.rankPoint).toString();
    levelVal.textContent = save.level.toString();
    bonusVal.textContent = getRankBonusPercent().toFixed(1) + "%";
    playerNameText.textContent = playerName;
    menuStarText.textContent = Math.floor(save.starCurrency).toString();
    bestRankText.textContent = Math.floor(save.bestRank).toString();
    menuLevelText.textContent = save.level.toString();
    shopLevelText.textContent = save.level.toString();
    shopBonusText.textContent = getRankBonusPercent().toFixed(1) + "%";
    upgradeCostText.textContent = `${getUpgradeCost()} STAR`;
  }

  function switchTab(name) {
    playSection.classList.toggle("active", name === "play");
    shopSection.classList.toggle("active", name === "shop");
    boardSection.classList.toggle("active", name === "board");
  }

  async function initFirebase() {
    if (!onlineConfig.enabled || !onlineConfig.firebaseConfig || !onlineConfig.firebaseConfig.projectId) {
      lbMode.textContent = "Local mode";
      return;
    }
    try {
      const [{ initializeApp }, { getFirestore, doc, getDoc, setDoc }] = await Promise.all([
        import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
        import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"),
      ]);
      const app = initializeApp(onlineConfig.firebaseConfig);
      db = { api: { getFirestore, doc, getDoc, setDoc }, store: getFirestore(app) };
      useFirebase = true;
      lbMode.textContent = "Online mode";
      await loadLeaderboard();
    } catch (e) {
      console.error(e);
      lbMode.textContent = "Local mode";
    }
  }

  function spawnHazard() {
    const type = Math.random() < 0.62 ? "meteor" : "planet";
    if (type === "meteor") {
      hazards.push({
        type,
        x: rand(28, W - 28),
        y: -40,
        r: 16,
        visualR: 22,
        speed: rand(220, 310) + Math.min(180, timeAlive * 3.2),
        rot: rand(0, Math.PI * 2),
        spin: rand(-3.5, 3.5),
      });
    } else {
      hazards.push({
        type,
        x: rand(34, W - 34),
        y: -58,
        r: 20,
        visualR: 28,
        speed: rand(170, 245) + Math.min(120, timeAlive * 2.3),
        rot: rand(0, Math.PI * 2),
        spin: rand(-2.2, 2.2),
        hue: Math.random() < 0.5 ? "purple" : "blue",
      });
    }
  }

  function spawnFallingStar() {
    const purple = Math.random() < (1 / 6);
    const obj = {
      x: rand(24, W - 24),
      y: -24,
      r: purple ? 12 : 11,
      speed: purple ? rand(185, 220) : rand(195, 250),
      rot: rand(0, Math.PI * 2),
      spin: rand(-4, 4),
      tw: rand(0, Math.PI * 2),
    };
    (purple ? purpleStars : yellowStars).push(obj);
  }

  function addPopup(x, y, text, color) {
    popups.push({ x, y, text, color, life: 0.85, age: 0 });
  }

  function emitParticles(x, y, color, count, spread = 1) {
    for (let i = 0; i < count; i++) {
      particles.push({
        x, y,
        vx: rand(-100, 100) * spread,
        vy: rand(-30, 85) * spread,
        size: rand(2, 5),
        life: rand(0.35, 0.9),
        age: 0,
        color,
      });
    }
  }

  function auraColorAt(t) {
    const colors = ["#ff5757", "#ffd84a", "#42ff72", "#4dd6ff", "#b25dff"];
    return colors[Math.floor((t * 7) % colors.length)];
  }

  function getPlayerAura() {
    if (save.level >= 50) return "rainbow";
    if (save.level >= 40) return "#42ff72";
    if (save.level >= 30) return "#b25dff";
    if (save.level >= 20) return "#ff5757";
    if (save.level >= 10) return "#ffd84a";
    return null;
  }

  function drawBackground(dt) {
    for (const s of bgStars) {
      s.y += s.v * dt;
      if (s.y > H + 4) {
        s.y = -4;
        s.x = Math.random() * W;
      }
      ctx.globalAlpha = 0.7;
      ctx.fillStyle = "#dff6ff";
      ctx.fillRect(s.x, s.y, s.s, s.s);
    }
    ctx.globalAlpha = 1;
  }

  function drawPlayer(now) {
    const aura = getPlayerAura();
    if (aura) {
      ctx.save();
      const color = aura === "rainbow" ? auraColorAt(now * 0.001) : aura;
      ctx.globalCompositeOperation = "lighter";
      const glowR = player.r + 20 + Math.sin(now * 0.009) * 4;
      const g = ctx.createRadialGradient(player.x, player.y + 12, 6, player.x, player.y + 12, glowR);
      g.addColorStop(0, color + "bb");
      g.addColorStop(0.38, color + "55");
      g.addColorStop(1, color + "00");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(player.x, player.y, glowR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      emitParticles(player.x, player.y + 26, color, 1, 0.28);
    }

    ctx.save();
    ctx.translate(player.x, player.y);
    const tilt = clamp(player.moveX * 0.24, -0.35, 0.35);
    ctx.rotate(tilt);

    // outer shadow glow
    ctx.fillStyle = "rgba(92,206,255,.18)";
    ctx.beginPath();
    ctx.ellipse(0, 12, 32, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // rear wing plates
    const wingGrad = ctx.createLinearGradient(-28, 0, 28, 0);
    wingGrad.addColorStop(0, "#2d90cd");
    wingGrad.addColorStop(0.5, "#6dd5ff");
    wingGrad.addColorStop(1, "#2d90cd");
    ctx.fillStyle = wingGrad;
    ctx.beginPath(); ctx.moveTo(-34, 16); ctx.lineTo(-7, -1); ctx.lineTo(-6, 18); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(34, 16); ctx.lineTo(7, -1); ctx.lineTo(6, 18); ctx.closePath(); ctx.fill();

    // side fins
    ctx.fillStyle = "#275e92";
    ctx.beginPath(); ctx.moveTo(-18, 20); ctx.lineTo(-6, 9); ctx.lineTo(-8, 26); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(18, 20); ctx.lineTo(6, 9); ctx.lineTo(8, 26); ctx.closePath(); ctx.fill();

    // main hull
    const bodyG = ctx.createLinearGradient(0, -34, 0, 30);
    bodyG.addColorStop(0, "#ffffff");
    bodyG.addColorStop(0.28, "#b9f0ff");
    bodyG.addColorStop(0.58, "#67c6f7");
    bodyG.addColorStop(1, "#1d6fa7");
    ctx.fillStyle = bodyG;
    ctx.beginPath();
    ctx.moveTo(0, -36);
    ctx.lineTo(16, -8);
    ctx.lineTo(14, 22);
    ctx.lineTo(0, 31);
    ctx.lineTo(-14, 22);
    ctx.lineTo(-16, -8);
    ctx.closePath();
    ctx.fill();

    // top highlights
    ctx.strokeStyle = "rgba(255,255,255,.88)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -24); ctx.lineTo(0, 18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-8, 2); ctx.lineTo(-2, 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, 2); ctx.lineTo(2, 10); ctx.stroke();

    // nose
    ctx.fillStyle = "#f3fbff";
    ctx.beginPath(); ctx.moveTo(0, -40); ctx.lineTo(8, -18); ctx.lineTo(-8, -18); ctx.closePath(); ctx.fill();

    // cockpit
    const cockpitG = ctx.createLinearGradient(0, -22, 0, 0);
    cockpitG.addColorStop(0, "#eefcff");
    cockpitG.addColorStop(1, "#10253e");
    ctx.fillStyle = cockpitG;
    ctx.beginPath(); ctx.ellipse(0, -10, 7, 13, 0, 0, Math.PI * 2); ctx.fill();

    // engine blocks
    ctx.fillStyle = "#e8f7ff";
    ctx.fillRect(-8, 22, 6, 7);
    ctx.fillRect(2, 22, 6, 7);

    // engine flames
    const flick = Math.sin(performance.now() * 0.05) * 5;
    ctx.fillStyle = "#fff4bf";
    ctx.beginPath(); ctx.moveTo(-5.2, 38 + flick); ctx.lineTo(1, 23); ctx.lineTo(-10, 23); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(5.2, 38 + flick); ctx.lineTo(10, 23); ctx.lineTo(-1, 23); ctx.closePath(); ctx.fill();

    ctx.fillStyle = "#ff9a3e";
    ctx.beginPath(); ctx.moveTo(-5, 33 + flick * 0.7); ctx.lineTo(-2, 24); ctx.lineTo(-8, 24); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(5, 33 + flick * 0.7); ctx.lineTo(8, 24); ctx.lineTo(2, 24); ctx.closePath(); ctx.fill();

    // tiny side lights
    ctx.fillStyle = "#ffd84a";
    ctx.beginPath(); ctx.arc(-15, 10, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ff5757";
    ctx.beginPath(); ctx.arc(15, 10, 2, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  function drawMeteor(h) {
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.rot);

    const trail = ctx.createRadialGradient(-6, -10, 4, -6, -10, 30);
    trail.addColorStop(0, "rgba(255,255,210,.75)");
    trail.addColorStop(0.35, "rgba(255,182,80,.45)");
    trail.addColorStop(1, "rgba(255,80,40,0)");
    ctx.fillStyle = trail;
    ctx.beginPath();
    ctx.ellipse(-6, -12, 16, 32, 0, 0, Math.PI * 2);
    ctx.fill();

    const g = ctx.createRadialGradient(-4, -6, 2, 0, 0, h.visualR);
    g.addColorStop(0, "#f8d3a0");
    g.addColorStop(0.45, "#b26436");
    g.addColorStop(1, "#552d18");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, h.visualR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#3b1c10";
    ctx.beginPath(); ctx.arc(-6, -2, 5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(6, 7, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(5, -8, 3, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
  }

  function drawPlanet(h) {
    ctx.save();
    ctx.translate(h.x, h.y);
    ctx.rotate(h.rot);

    const base = h.hue === "purple"
      ? ["#f0dbff", "#b25dff", "#5b2694"]
      : ["#d6f0ff", "#66bdf8", "#22456f"];

    const g = ctx.createRadialGradient(-6, -8, 3, 0, 0, h.visualR + 6);
    g.addColorStop(0, base[0]);
    g.addColorStop(0.45, base[1]);
    g.addColorStop(1, base[2]);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, h.visualR, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255,255,255,.55)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, h.visualR + 9, 11, 0.3, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,.12)";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(-4, -2, h.visualR * 0.55, -0.8, 1.2); ctx.stroke();
    ctx.beginPath(); ctx.arc(6, 3, h.visualR * 0.35, -1.1, 0.9); ctx.stroke();

    ctx.restore();
  }

  function drawStarObj(s, purple, now) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);
    const scale = 1 + Math.sin(now * 0.01 + s.tw) * 0.08;
    ctx.scale(scale, scale);

    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const ang = -Math.PI / 2 + i * Math.PI / 5;
      const rad = i % 2 === 0 ? 14 : 6;
      const px = Math.cos(ang) * rad;
      const py = Math.sin(ang) * rad;
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.closePath();

    if (purple) {
      const g = ctx.createRadialGradient(0, -3, 2, 0, 0, 18);
      g.addColorStop(0, "#f0d8ff");
      g.addColorStop(0.55, "#b25dff");
      g.addColorStop(1, "#6d29c7");
      ctx.fillStyle = g;
      ctx.shadowBlur = 18;
      ctx.shadowColor = "#a348ff";
    } else {
      const g = ctx.createRadialGradient(0, -3, 2, 0, 0, 18);
      g.addColorStop(0, "#fff8cd");
      g.addColorStop(0.55, "#ffd84a");
      g.addColorStop(1, "#ff9c29");
      ctx.fillStyle = g;
      ctx.shadowBlur = 16;
      ctx.shadowColor = "#ffd84a";
    }
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }

  function drawParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      const a = 1 - (p.age / p.life);
      if (a <= 0) {
        particles.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.globalAlpha = 1;
    }
  }

  function drawPopups(dt) {
    ctx.save();
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    for (let i = popups.length - 1; i >= 0; i--) {
      const p = popups[i];
      p.age += dt;
      p.y -= 30 * dt;
      const a = 1 - p.age / p.life;
      if (a <= 0) {
        popups.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x, p.y);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function explodeHazard(h) {
    if (h.type === "meteor") {
      emitParticles(h.x, h.y, "#ff8d47", 26, 1.2);
      emitParticles(h.x, h.y, "#ffdc7b", 14, 1);
    } else {
      emitParticles(h.x, h.y, h.hue === "purple" ? "#b25dff" : "#62bfff", 30, 1.2);
      emitParticles(h.x, h.y, "#ffffff", 10, 0.8);
    }
  }

  function resetRun() {
    hazards.length = 0;
    yellowStars.length = 0;
    purpleStars.length = 0;
    particles.length = 0;
    popups.length = 0;
    run.rankPoint = 0;
    timeAlive = 0;
    spawnHazardTimer = 0;
    spawnStarTimer = 0;
    rankSyncTimer = 0;
    player.x = W * 0.5;
    player.moveX = 0;
    updateHUD();
  }

  async function loadLeaderboard() {
    if (useFirebase && db) {
      const { doc, getDoc } = db.api;
      const snap = await getDoc(doc(db.store, "xgp", "leaderboard"));
      const rows = snap.exists() ? (snap.data().rows || []) : [];
      renderLeaderboard(rows);
      return;
    }
    const rows = JSON.parse(localStorage.getItem("xgp_v5_local_lb") || "[]");
    renderLeaderboard(rows);
  }

  function renderLeaderboard(rows) {
    lbList.innerHTML = "";
    rows.slice(0, 20).forEach((r, i) => {
      const li = document.createElement("li");
      const crown = i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : "";
      li.innerHTML = `
        <span class="rankBadge">
          <span class="rankNum">${i + 1}</span>
          <span class="crown">${crown}</span>
          <span class="nameText">${r.name}</span>
        </span>
        <span class="scoreText">${Math.floor(r.score)}</span>
      `;
      lbList.appendChild(li);
    });
  }

  async function saveLeaderboard() {
    const entry = { name: playerName, score: Math.floor(save.bestRank) };

    if (useFirebase && db) {
      const { doc, getDoc, setDoc } = db.api;
      const ref = doc(db.store, "xgp", "leaderboard");
      const snap = await getDoc(ref);
      const rows = snap.exists() ? (snap.data().rows || []) : [];

      const idx = rows.findIndex(r => r.name === entry.name);
      if (idx >= 0) rows[idx].score = Math.max(rows[idx].score, entry.score);
      else rows.push(entry);

      rows.sort((a, b) => b.score - a.score);
      await setDoc(ref, { rows: rows.slice(0, 100) });
      await loadLeaderboard();
      return;
    }

    const rows = JSON.parse(localStorage.getItem("xgp_v5_local_lb") || "[]");
    const idx = rows.findIndex(r => r.name === entry.name);
    if (idx >= 0) rows[idx].score = Math.max(rows[idx].score, entry.score);
    else rows.push(entry);
    rows.sort((a, b) => b.score - a.score);
    localStorage.setItem("xgp_v5_local_lb", JSON.stringify(rows.slice(0, 100)));
    await loadLeaderboard();
  }

  function buyUpgrade() {
    const cost = getUpgradeCost();
    if (save.starCurrency < cost) {
      showToast(`Need ${cost} STAR`);
      return;
    }
    save.starCurrency -= cost;
    save.level += 1;
    persistSave();
    updateHUD();
    emitParticles(player.x, player.y, "#7dd7ff", 22, 0.8);
    showToast(`LEVEL UP ${save.level}`);
  }

  function endRun() {
    if (!running) return;
    running = false;

    if (run.rankPoint > save.bestRank) {
      save.bestRank = Math.floor(run.rankPoint);
      persistSave();
      saveLeaderboard();
      showToast("NEW BEST RANK");
    } else {
      saveLeaderboard();
      showToast("RUN END");
    }

    updateHUD();
    switchTab("play");
    menuOverlay.style.display = "flex";
  }

  function drawPreviewShip(canvas, auraColor, extraColor, rainbow = false) {
    if (!canvas) return;
    const pctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    pctx.clearRect(0, 0, w, h);

    const bg = pctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#081225");
    bg.addColorStop(1, "#040914");
    pctx.fillStyle = bg;
    pctx.fillRect(0, 0, w, h);

    for (let i = 0; i < 16; i++) {
      pctx.fillStyle = "rgba(223,246,255,.7)";
      pctx.fillRect((i * 31) % w, (i * 17) % h, 1.5, 1.5);
    }

    const cx = w / 2, cy = h / 2 + 6;

    pctx.save();
    pctx.translate(cx, cy);

    let auraFill = auraColor;
    if (rainbow) {
      const rg = pctx.createRadialGradient(0, 8, 5, 0, 8, 34);
      rg.addColorStop(0, "rgba(255,87,87,.8)");
      rg.addColorStop(0.25, "rgba(255,216,74,.65)");
      rg.addColorStop(0.5, "rgba(66,255,114,.55)");
      rg.addColorStop(0.75, "rgba(77,214,255,.5)");
      rg.addColorStop(1, "rgba(178,93,255,0)");
      pctx.fillStyle = rg;
    } else {
      const g = pctx.createRadialGradient(0, 8, 5, 0, 8, 34);
      g.addColorStop(0, auraFill + "cc");
      g.addColorStop(0.4, auraFill + "44");
      g.addColorStop(1, auraFill + "00");
      pctx.fillStyle = g;
    }
    pctx.beginPath();
    pctx.arc(0, 4, 34, 0, Math.PI * 2);
    pctx.fill();

    const wingGrad = pctx.createLinearGradient(-28, 0, 28, 0);
    wingGrad.addColorStop(0, "#2d90cd");
    wingGrad.addColorStop(0.5, "#6dd5ff");
    wingGrad.addColorStop(1, "#2d90cd");
    pctx.fillStyle = wingGrad;
    pctx.beginPath(); pctx.moveTo(-30, 14); pctx.lineTo(-6, -1); pctx.lineTo(-5, 16); pctx.closePath(); pctx.fill();
    pctx.beginPath(); pctx.moveTo(30, 14); pctx.lineTo(6, -1); pctx.lineTo(5, 16); pctx.closePath(); pctx.fill();

    pctx.fillStyle = "#275e92";
    pctx.beginPath(); pctx.moveTo(-16, 18); pctx.lineTo(-5, 8); pctx.lineTo(-7, 24); pctx.closePath(); pctx.fill();
    pctx.beginPath(); pctx.moveTo(16, 18); pctx.lineTo(5, 8); pctx.lineTo(7, 24); pctx.closePath(); pctx.fill();

    const bodyG = pctx.createLinearGradient(0, -32, 0, 28);
    bodyG.addColorStop(0, "#ffffff");
    bodyG.addColorStop(0.28, "#b9f0ff");
    bodyG.addColorStop(0.58, "#67c6f7");
    bodyG.addColorStop(1, "#1d6fa7");
    pctx.fillStyle = bodyG;
    pctx.beginPath();
    pctx.moveTo(0, -34); pctx.lineTo(15, -8); pctx.lineTo(13, 20);
    pctx.lineTo(0, 28); pctx.lineTo(-13, 20); pctx.lineTo(-15, -8); pctx.closePath();
    pctx.fill();

    pctx.fillStyle = "#f3fbff";
    pctx.beginPath(); pctx.moveTo(0, -38); pctx.lineTo(8, -18); pctx.lineTo(-8, -18); pctx.closePath(); pctx.fill();

    const cockpitG = pctx.createLinearGradient(0, -20, 0, 0);
    cockpitG.addColorStop(0, "#eefcff");
    cockpitG.addColorStop(1, "#10253e");
    pctx.fillStyle = cockpitG;
    pctx.beginPath(); pctx.ellipse(0, -10, 6.5, 12, 0, 0, Math.PI * 2); pctx.fill();

    pctx.strokeStyle = "rgba(255,255,255,.85)";
    pctx.lineWidth = 2;
    pctx.beginPath(); pctx.moveTo(0, -22); pctx.lineTo(0, 16); pctx.stroke();

    if (rainbow) {
      const rg2 = pctx.createLinearGradient(-10, 0, 10, 0);
      rg2.addColorStop(0, "#ff5757");
      rg2.addColorStop(0.25, "#ffd84a");
      rg2.addColorStop(0.5, "#42ff72");
      rg2.addColorStop(0.75, "#4dd6ff");
      rg2.addColorStop(1, "#b25dff");
      pctx.strokeStyle = rg2;
    } else {
      pctx.strokeStyle = extraColor;
    }
    pctx.lineWidth = 2.2;
    pctx.beginPath(); pctx.moveTo(-9, 2); pctx.lineTo(-2, 11); pctx.stroke();
    pctx.beginPath(); pctx.moveTo(9, 2); pctx.lineTo(2, 11); pctx.stroke();

    pctx.fillStyle = "#fff4bf";
    pctx.beginPath(); pctx.moveTo(-5, 35); pctx.lineTo(1, 22); pctx.lineTo(-10, 22); pctx.closePath(); pctx.fill();
    pctx.beginPath(); pctx.moveTo(5, 35); pctx.lineTo(10, 22); pctx.lineTo(-1, 22); pctx.closePath(); pctx.fill();

    pctx.fillStyle = "#ff9a3e";
    pctx.beginPath(); pctx.moveTo(-4.5, 30); pctx.lineTo(-2, 23); pctx.lineTo(-8, 23); pctx.closePath(); pctx.fill();
    pctx.beginPath(); pctx.moveTo(4.5, 30); pctx.lineTo(8, 23); pctx.lineTo(2, 23); pctx.closePath(); pctx.fill();

    pctx.restore();
  }

  function renderShopPreviews() {
    drawPreviewShip(previewLv10, "#ffd84a", "#ffd84a");
    drawPreviewShip(previewLv20, "#ff5757", "#ff5757");
    drawPreviewShip(previewLv30, "#b25dff", "#b25dff");
    drawPreviewShip(previewLv40, "#42ff72", "#42ff72");
    drawPreviewShip(previewLv50, "#b25dff", "#b25dff", true);
  }


  function update(dt) {
    timeAlive += dt;

    if (!pointerActive) player.x += player.moveX * player.speed * dt;
    player.x = clamp(player.x, 30, W - 30);

    spawnHazardTimer += dt;
    spawnStarTimer += dt;
    rankSyncTimer += dt;

    const hazardInterval = Math.max(0.34, 0.82 - timeAlive * 0.0034);
    const starInterval = 0.43;

    if (spawnHazardTimer >= hazardInterval) { spawnHazardTimer = 0; spawnHazard(); }
    if (spawnStarTimer >= starInterval) { spawnStarTimer = 0; spawnFallingStar(); }
    if (rankSyncTimer >= 6) { rankSyncTimer = 0; loadLeaderboard(); }

    for (let i = hazards.length - 1; i >= 0; i--) {
      const h = hazards[i];
      h.y += h.speed * dt;
      h.rot += h.spin * dt;
      if (h.y > H + 70) {
        hazards.splice(i, 1);
        continue;
      }
      if (circleHit(player, h)) {
        explodeHazard(h);
        hazards.splice(i, 1);
        endRun();
        return;
      }
    }

    for (let i = yellowStars.length - 1; i >= 0; i--) {
      const s = yellowStars[i];
      s.y += s.speed * dt;
      s.rot += s.spin * dt;
      if (s.y > H + 50) { yellowStars.splice(i, 1); continue; }
      if (circleHit(player, s)) {
        const gain = getYellowRankGain();
        run.rankPoint += gain;
        emitParticles(s.x, s.y, "#ffd84a", 14, 0.7);
        addPopup(s.x, s.y, `+${gain.toFixed(2)} RANK`, "#ffd84a");
        yellowStars.splice(i, 1);
        updateHUD();
      }
    }

    for (let i = purpleStars.length - 1; i >= 0; i--) {
      const s = purpleStars[i];
      s.y += s.speed * dt;
      s.rot += s.spin * dt;
      if (s.y > H + 50) { purpleStars.splice(i, 1); continue; }
      if (circleHit(player, s)) {
        save.starCurrency += 1;
        persistSave();
        emitParticles(s.x, s.y, "#b25dff", 16, 0.8);
        addPopup(s.x, s.y, "+1 STAR", "#d39cff");
        purpleStars.splice(i, 1);
        updateHUD();
      }
    }
  }

  function draw(now, dt) {
    ctx.clearRect(0, 0, W, H);
    drawBackground(dt);

    for (const s of yellowStars) drawStarObj(s, false, now);
    for (const s of purpleStars) drawStarObj(s, true, now);
    for (const h of hazards) {
      if (h.type === "meteor") drawMeteor(h);
      else drawPlanet(h);
    }

    drawParticles(dt);
    drawPlayer(now);
    drawPopups(dt);
  }

  function loop(now) {
    if (!last) last = now;
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;

    if (running) update(dt);
    draw(now, dt);
    requestAnimationFrame(loop);
  }

  function setPointer(clientX) {
    const rect = canvas.getBoundingClientRect();
    const x = (clientX - rect.left) * (canvas.width / rect.width);
    player.x = clamp(x - pointerOffsetX, 30, W - 30);
  }

  canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    pointerActive = true;
    pointerOffsetX = x - player.x;
    setPointer(e.clientX);
  });
  window.addEventListener("mousemove", (e) => { if (pointerActive) setPointer(e.clientX); });
  window.addEventListener("mouseup", () => pointerActive = false);

  canvas.addEventListener("touchstart", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = (e.touches[0].clientX - rect.left) * (canvas.width / rect.width);
    pointerActive = true;
    pointerOffsetX = x - player.x;
    setPointer(e.touches[0].clientX);
  }, { passive: true });
  canvas.addEventListener("touchmove", (e) => { if (pointerActive) setPointer(e.touches[0].clientX); }, { passive: true });
  window.addEventListener("touchend", () => pointerActive = false, { passive: true });

  window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") player.moveX = -1;
    if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") player.moveX = 1;
  });
  window.addEventListener("keyup", (e) => {
    if ((e.key === "ArrowLeft" || e.key.toLowerCase() === "a") && player.moveX < 0) player.moveX = 0;
    if ((e.key === "ArrowRight" || e.key.toLowerCase() === "d") && player.moveX > 0) player.moveX = 0;
  });


  function startRun() {
    resetRun();
    updateHUD();
    menuOverlay.style.display = "none";
    running = true;
    last = 0;
    showToast("START");
  }

  startBtn.addEventListener("click", startRun);
  upgradeBtn.addEventListener("click", buyUpgrade);
  menuBtn.addEventListener("click", () => {
    running = false;
    switchTab("play");
    updateHUD();
    menuOverlay.style.display = "flex";
  });
  resetBtn.addEventListener("click", () => {
    resetRun();
    running = true;
    menuOverlay.style.display = "none";
    last = 0;
    showToast("RESET RUN");
  });
  nameBtn.addEventListener("click", () => {
    playerName = askNickname(playerName);
    localStorage.setItem("xgp_v5_name", playerName);
    updateHUD();
    showToast("NAME SAVED");
  });

  tabPlay.addEventListener("click", () => switchTab("play"));
  tabShop.addEventListener("click", () => switchTab("shop"));
  tabBoard.addEventListener("click", () => {
    switchTab("board");
    loadLeaderboard();
  });

  updateHUD();
  renderShopPreviews();
  loadLeaderboard();
  initFirebase();
  requestAnimationFrame(loop);
})();
