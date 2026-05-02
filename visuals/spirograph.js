class SpirographVisual {
  constructor() { this.reset(); }
  reset() {
    this.points = []; this.moving = false; this.angleOffset = 0; this.updateScreenSize();
  }
  updateScreenSize() { 
    this.bs = Math.max(1, Math.min(window.innerWidth, window.innerHeight) / 400); 
    this.maxRadius = Math.max(window.innerWidth, window.innerHeight) / 2 * 0.9;
  }
  feedDigit(digit, seqLen) {
    this.moving = true;
    if (digit === '0') {
      this.angleOffset += Math.PI / 10;
      this.points.push({teleport: true});
    } else if (digit === '5') {
      this.points.push({burst: true, age: 0, r: (seqLen % 20) / 20 * this.maxRadius});
    } else {
      const d = parseInt(digit);
      const angle = this.angleOffset + d * Math.PI * 2 / 10;
      // Cycle radius in a predictable pattern to create mandala loops
      const rPhase = (seqLen % 12) / 11; // 0 to 1
      const radius = this.maxRadius * (0.2 + 0.8 * rPhase);
      const px = Math.cos(angle) * radius;
      const py = Math.sin(angle) * radius;
      this.points.push({x: px, y: py});
    }
    ensureAnimationLoop();
  }
  update() {
    let active = false;
    this.points.forEach(p => { if (p.burst && p.age < 150) { p.age++; active = true; } });
    if (this.points.length > 0) active = true;
    return active;
  }
  draw(ctx) {
    if (this.points.length === 0) return;
    const accent = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#00e5ff';
    const accentSec = getComputedStyle(document.body).getPropertyValue('--accent-secondary').trim() || '#ff00e5';
    ctx.save();
    
    ctx.translate(window.innerWidth / 2, window.innerHeight / 2);
    // Camera follow for spirograph could slowly rotate it or zoom it
    if (state.cameraFollow) {
      const rot = this.points.length * 0.005;
      ctx.rotate(rot);
    }
    
    ctx.strokeStyle = accent; ctx.lineWidth = 1.5 * this.bs;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    
    let lastP = {x: 0, y: 0};
    this.points.forEach((p, i) => {
      if (p.teleport) { lastP = {x: 0, y: 0}; }
      else if (p.burst) {
         ctx.beginPath();
         const progress = p.age / 150;
         ctx.globalAlpha = Math.max(0.15, 1 - Math.pow(progress, 2));
         const r = p.r + (Math.pow(progress, 0.5) * 60) * this.bs;
         ctx.strokeStyle = accentSec; ctx.lineWidth = (2 + (1 - progress) * 2) * this.bs;
         ctx.arc(0, 0, r, 0, Math.PI * 2);
         ctx.stroke(); ctx.globalAlpha = 1; ctx.strokeStyle = accent; ctx.lineWidth = 1.5 * this.bs;
      } else {
         ctx.beginPath();
         // strict geometric lines
         ctx.moveTo(lastP.x, lastP.y);
         ctx.lineTo(p.x, p.y);
         ctx.stroke();
         
         ctx.beginPath(); ctx.fillStyle = accentSec;
         ctx.arc(p.x, p.y, 2 * this.bs, 0, Math.PI*2); ctx.fill();
         
         lastP = p;
      }
    });
    ctx.restore();
  }
}
