(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const W = canvas.width, H = canvas.height;

  const starVal = document.getElementById("starVal");
  const rankVal = document.getElementById("rankVal");
  const levelVal = document.getElementById("levelVal");
  const bonusVal = document.getElementById("bonusVal");
  const leaderList = document.getElementById("leaderList");
  const msg = document.getElementById("msg");
  const startBtn = document.getElementById("startBtn");
  const upgradeBtn = document.getElementById("upgradeBtn");
  const restartBtn = document.getElementById("restartBtn");
  const toast = document.getElementById("toast");
  const mobilePad = document.getElementById("mobilePad");
  const mobileKnob = document.getElementById("mobileKnob");

  const STORE_KEY = "xgp_v2_save";
  const LEADER_KEY = "xgp_v2_leaderboard";
  const NAME_KEY = "xgp_v2_name";

  const state = {
    running: false,
    last: 0,
    spawnBombT: 0,
    spawnStarT: 0,
    stars: 0,
    rank: 0,
    level: 1,
    bonusPct: 0,
    bestRank: 0,
    nickname: localStorage.getItem(NAME_KEY) || "",
    player: { x: W/2, y: H*0.82, r: 22, vx: 0 },
    bombs: [],
    yellows: [],
    purples: [],
    particles: [],
    keys: { left:false, right:false },
    dragX: null,
    padX: 0,
    time: 0
  };

  if (!state.nickname) {
    const input = prompt("Enter your nickname", "PLAYER") || "PLAYER";
    state.nickname = input.trim().slice(0,16) || "PLAYER";
    localStorage.setItem(NAME_KEY, state.nickname);
  }

  function saveProgress(){
    localStorage.setItem(STORE_KEY, JSON.stringify({
      stars: state.stars,
      rank: state.rank,
      level: state.level,
      bonusPct: state.bonusPct,
      bestRank: state.bestRank,
      nickname: state.nickname
    }));
  }

  function loadProgress(){
    try{
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      state.stars = +s.stars || 0;
      state.rank = +s.rank || 0;
      state.level = +s.level || 1;
      state.bonusPct = +s.bonusPct || Math.max(0, (state.level - 1) * 0.5);
      state.bestRank = +s.bestRank || 0;
      if (s.nickname) state.nickname = s.nickname;
    }catch(e){}
  }

  function loadBoard(){
    try{
      return JSON.parse(localStorage.getItem(LEADER_KEY) || "[]");
    }catch(e){
      return [];
    }
  }
  function saveBoard(rankScore){
    const board = loadBoard();
    const existing = board.find(v => v.name === state.nickname);
    if (!existing || rankScore > existing.score) {
      const next = board.filter(v => v.name !== state.nickname);
      next.push({ name: state.nickname, score: rankScore });
      next.sort((a,b)=>b.score-a.score);
      localStorage.setItem(LEADER_KEY, JSON.stringify(next.slice(0,50)));
    }
    renderBoard();
  }
  function renderBoard(){
    const board = loadBoard();
    leaderList.innerHTML = "";
    board.slice(0,10).forEach(row => {
      const li = document.createElement("li");
      li.textContent = `${row.name} - ${row.score}`;
      leaderList.appendChild(li);
    });
  }

  function toastMsg(text){
    toast.textContent = text;
    toast.style.display = "block";
    clearTimeout(toast._t);
    toast._t = setTimeout(()=>toast.style.display="none", 1100);
  }

  function resetRun(){
    state.running = false;
    state.last = 0;
    state.spawnBombT = 0;
    state.spawnStarT = 0;
    state.time = 0;
    state.player.x = W/2;
    state.player.vx = 0;
    state.bombs = [];
    state.yellows = [];
    state.purples = [];
    state.particles = [];
  }

  function startGame(){
    resetRun();
    state.running = true;
    msg.style.display = "none";
    requestAnimationFrame(loop);
  }

  function gameOver(){
    state.running = false;
    state.bestRank = Math.max(state.bestRank, state.rank);
    saveBoard(state.rank);
    saveProgress();
    msg.innerHTML = `<h1>GAME OVER</h1>
      <p>STAR: ${Math.floor(state.stars)}<br>RANK: ${state.rank}<br>LEVEL: ${state.level}</p>
      <button id="startBtn2">PLAY AGAIN</button>`;
    msg.style.display = "block";
    document.getElementById("startBtn2").onclick = startGame;
  }

  function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
  function rand(a,b){ return a + Math.random()*(b-a); }
  function dist(ax,ay,bx,by){ const dx=ax-bx, dy=ay-by; return Math.hypot(dx,dy); }

  // Accurate hitbox: circle-circle, tighter bomb radius
  function hitCircle(a, b){
    return dist(a.x, a.y, b.x, b.y) <= (a.r + b.r);
  }

  function playerGlowColor(){
    if (state.level >= 50) return "rainbow";
    if (state.level >= 40) return "#59ff8c";
    if (state.level >= 30) return "#c06bff";
    if (state.level >= 20) return "#ff6464";
    if (state.level >= 10) return "#ffd84d";
    return null;
  }

  function emitTrail(){
    const glow = playerGlowColor();
    if (!glow) return;
    for(let i=0;i<2;i++){
      state.particles.push({
        x: state.player.x + rand(-8,8),
        y: state.player.y + state.player.r + rand(8,14),
        vx: rand(-0.4,0.4),
        vy: rand(1.5,3.2),
        life: rand(24,38),
        t: 0,
        c: glow === "rainbow" ? ["#ff4d4d","#ffd84d","#59ff8c","#5cd6ff","#c06bff"][Math.floor(Math.random()*5)] : glow
      });
    }
  }

  function spawnBomb(){
    state.bombs.push({
      x: rand(28, W-28),
      y: -30,
      r: 14, // tighter than the visual size
      vy: rand(3.6, 5.4),
      wobble: rand(0, 6.28)
    });
  }

  // 5 yellow : 1 purple
  function spawnStar(){
    const isPurple = Math.random() < (1/6);
    const obj = {
      x: rand(24, W-24),
      y: -26,
      r: isPurple ? 14 : 12,
      vy: isPurple ? rand(3.0,4.3) : rand(3.2,4.6),
      spin: rand(0,6.28)
    };
    if (isPurple) state.purples.push(obj);
    else state.yellows.push(obj);
  }

  function upgradeCost(level){
    return 50 + (level - 1) * 25;
  }

  function doUpgrade(){
    const cost = upgradeCost(state.level);
    if (state.stars < cost) {
      toastMsg(`Need ${cost} STAR`);
      return;
    }
    state.stars -= cost;
    state.level += 1;
    state.bonusPct = (state.level - 1) * 0.5;
    saveProgress();
    toastMsg(`LEVEL UP -> ${state.level}`);
  }

  function update(dt){
    state.time += dt;

    // spawns
    state.spawnBombT += dt;
    state.spawnStarT += dt;

    const bombInterval = Math.max(0.34, 0.88 - Math.min(0.45, state.time * 0.006));
    const starInterval = 0.42;

    if (state.spawnBombT >= bombInterval) {
      state.spawnBombT = 0;
      spawnBomb();
    }
    if (state.spawnStarT >= starInterval) {
      state.spawnStarT = 0;
      spawnStar();
    }

    // movement
    const spd = 7.2;
    if (state.dragX != null) {
      state.player.x = clamp(state.dragX, 24, W-24);
    } else {
      const padMove = state.padX * 9;
      state.player.vx = 0;
      if (state.keys.left) state.player.vx -= spd;
      if (state.keys.right) state.player.vx += spd;
      state.player.vx += padMove;
      state.player.x = clamp(state.player.x + state.player.vx, 24, W-24);
    }

    if (state.level >= 10) emitTrail();

    for (let i = state.particles.length-1; i >=0; i--){
      const p = state.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.t++;
      if (p.t >= p.life) state.particles.splice(i,1);
    }

    const playerHit = { x: state.player.x, y: state.player.y, r: 16 }; // tighter player hitbox

    for (let i = state.bombs.length-1; i >=0; i--){
      const b = state.bombs[i];
      b.y += b.vy;
      b.x += Math.sin((state.time * 3.6) + b.wobble) * 0.5;
      if (hitCircle(playerHit, b)) {
        gameOver();
        return;
      }
      if (b.y > H + 40) state.bombs.splice(i,1);
    }

    for (let i = state.yellows.length-1; i >=0; i--){
      const s = state.yellows[i];
      s.y += s.vy;
      s.spin += 0.12;
      if (hitCircle(playerHit, s)) {
        const gain = 1 + ((state.level - 1) * 0.005);
        state.stars += gain; // linear bonus, not compound
        state.yellows.splice(i,1);
        saveProgress();
        continue;
      }
      if (s.y > H + 40) state.yellows.splice(i,1);
    }

    for (let i = state.purples.length-1; i >=0; i--){
      const s = state.purples[i];
      s.y += s.vy;
      s.spin += 0.1;
      if (hitCircle(playerHit, s)) {
        state.rank += 1;
        state.purples.splice(i,1);
        saveBoard(state.rank);
        saveProgress();
        continue;
      }
      if (s.y > H + 40) state.purples.splice(i,1);
    }

    starVal.textContent = Math.floor(state.stars);
    rankVal.textContent = state.rank;
    levelVal.textContent = state.level;
    bonusVal.textContent = `${state.bonusPct.toFixed(1)}%`;
    upgradeBtn.textContent = `UPGRADE (${upgradeCost(state.level)} STAR)`;
  }

  function drawBg(){
    ctx.clearRect(0,0,W,H);
    for (let i=0;i<80;i++){
      const x = (i*57.13)%W;
      const y = ((i*91.77)+(state.time*40*(i%3+1)))%H;
      ctx.globalAlpha = 0.35 + (i%5)*0.1;
      ctx.fillStyle = i % 11 === 0 ? "#b45cff" : "#dff7ff";
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1;
  }

  function drawPlayer(){
    const glow = playerGlowColor();
    if (glow) {
      if (glow === "rainbow") {
        const colors = ["#ff4d4d","#ffd84d","#59ff8c","#5cd6ff","#c06bff"];
        ctx.shadowBlur = 18;
        ctx.shadowColor = colors[Math.floor((performance.now()/120)%colors.length)];
      } else {
        ctx.shadowBlur = 18;
        ctx.shadowColor = glow;
      }
    } else {
      ctx.shadowBlur = 0;
    }

    const x = state.player.x, y = state.player.y;
    ctx.save();
    ctx.translate(x,y);

    // body
    ctx.fillStyle = "#7df9ff";
    ctx.beginPath();
    ctx.moveTo(0,-24); ctx.lineTo(16,20); ctx.lineTo(0,10); ctx.lineTo(-16,20);
    ctx.closePath(); ctx.fill();

    // cockpit
    ctx.fillStyle = "#e8fbff";
    ctx.beginPath(); ctx.ellipse(0,-5,7,11,0,0,Math.PI*2); ctx.fill();

    // wings
    ctx.fillStyle = "#5ac7ff";
    ctx.fillRect(-28, 6, 56, 8);

    // engine flame
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#ff9c3d";
    ctx.fillStyle = "#ffd84d";
    ctx.beginPath(); ctx.moveTo(-5,18); ctx.lineTo(0,30 + Math.sin(state.time*18)*3); ctx.lineTo(5,18); ctx.fill();

    ctx.restore();
    ctx.shadowBlur = 0;
  }

  function drawBomb(b){
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.fillStyle = "#5f35c7";
    ctx.beginPath(); ctx.arc(0,0,18,0,Math.PI*2); ctx.fill();
    ctx.fillStyle = "#31106e";
    ctx.beginPath(); ctx.arc(-5,-5,8,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle = "#d6c2ff";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(3,-16); ctx.quadraticCurveTo(8,-28,14,-20); ctx.stroke();
    ctx.restore();
  }

  function drawYellow(s){
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.spin);
    ctx.shadowBlur = 14; ctx.shadowColor = "#ffd84d";
    ctx.fillStyle = "#ffd84d";
    starShape(0,0,14,7,5);
    ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0;
  }

  function drawPurple(s){
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(-s.spin);
    ctx.shadowBlur = 16; ctx.shadowColor = "#b45cff";
    ctx.fillStyle = "#b45cff";
    starShape(0,0,16,8,5);
    ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0;
  }

  function starShape(x,y,r1,r2,n){
    ctx.beginPath();
    for(let i=0;i<n*2;i++){
      const a = (Math.PI / n) * i - Math.PI/2;
      const r = i%2===0 ? r1 : r2;
      const px = x + Math.cos(a)*r;
      const py = y + Math.sin(a)*r;
      if (i===0) ctx.moveTo(px,py); else ctx.lineTo(px,py);
    }
    ctx.closePath();
  }

  function drawParticles(){
    for (const p of state.particles){
      const alpha = 1 - (p.t / p.life);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function draw(){
    drawBg();
    for (const s of state.yellows) drawYellow(s);
    for (const s of state.purples) drawPurple(s);
    for (const b of state.bombs) drawBomb(b);
    drawParticles();
    drawPlayer();
  }

  function loop(ts){
    if (!state.running) return;
    if (!state.last) state.last = ts;
    const dt = Math.min(0.033, (ts - state.last) / 1000);
    state.last = ts;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  // controls
  window.addEventListener("keydown", e => {
    if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") state.keys.left = true;
    if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") state.keys.right = true;
  });
  window.addEventListener("keyup", e => {
    if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") state.keys.left = false;
    if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") state.keys.right = false;
  });

  function canvasX(ev){
    const r = canvas.getBoundingClientRect();
    return (ev.clientX - r.left) * (canvas.width / r.width);
  }

  canvas.addEventListener("mousedown", e => { state.dragX = canvasX(e); });
  window.addEventListener("mousemove", e => { if (state.dragX != null) state.dragX = canvasX(e); });
  window.addEventListener("mouseup", () => state.dragX = null);

  canvas.addEventListener("touchstart", e => {
    const t = e.touches[0];
    const r = canvas.getBoundingClientRect();
    state.dragX = (t.clientX - r.left) * (canvas.width / r.width);
  }, {passive:true});
  canvas.addEventListener("touchmove", e => {
    const t = e.touches[0];
    const r = canvas.getBoundingClientRect();
    state.dragX = (t.clientX - r.left) * (canvas.width / r.width);
  }, {passive:true});
  window.addEventListener("touchend", () => state.dragX = null, {passive:true});

  // mobile pad
  if (mobilePad) {
    let padActive = false;
    function movePad(clientX){
      const rect = mobilePad.getBoundingClientRect();
      const cx = rect.left + rect.width/2;
      let dx = (clientX - cx) / (rect.width/2);
      dx = clamp(dx, -1, 1);
      state.padX = dx;
      mobileKnob.style.left = `${50 + dx*28}%`;
    }
    mobilePad.addEventListener("touchstart", e => { padActive = true; movePad(e.touches[0].clientX); }, {passive:true});
    mobilePad.addEventListener("touchmove", e => { if (padActive) movePad(e.touches[0].clientX); }, {passive:true});
    window.addEventListener("touchend", ()=>{ padActive = false; state.padX = 0; mobileKnob.style.left = "50%"; }, {passive:true});
  }

  // UI
  startBtn.onclick = startGame;
  restartBtn.onclick = () => {
    resetRun();
    msg.innerHTML = `<h1>XGP GAME V2</h1>
      <p>Collect yellow stars for STAR currency.<br>Collect purple stars for RANK points.<br>Avoid bombs.</p>
      <button id="startBtn3">START GAME</button>`;
    msg.style.display = "block";
    document.getElementById("startBtn3").onclick = startGame;
    draw();
  };
  upgradeBtn.onclick = doUpgrade;

  loadProgress();
  renderBoard();
  draw();
})();
