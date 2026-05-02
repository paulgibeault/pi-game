class OrbitalVisual {
  constructor() { this.reset(); }
  reset() {
    this.planets = []; this.time = 0; this.moving = false; this.updateScreenSize();
    this.focusX = 0; this.focusY = 0;
  }
  updateScreenSize() { 
    this.bs = Math.max(1, Math.min(window.innerWidth, window.innerHeight) / 400); 
    this.maxRadius = Math.max(window.innerWidth, window.innerHeight) / 2 * 0.95;
  }
  feedDigit(digit, seqLen) {
    this.moving = true;
    if (digit === '0') {
      this.planets.forEach(p => p.teleport = true);
    } else if (digit === '5') {
       this.planets.push({ type: 'flare', maxRadius: this.maxRadius, age: 0 });
    } else {
      const d = parseInt(digit);
      // Span the entire screen
      const phase = (seqLen % 30 + 1) / 31; 
      const distance = this.maxRadius * phase;
      const speed = ((d - 4.5) * 0.003) || 0.01;
      const size = this.bs * (2 + (d % 5));
      this.planets.push({ type: 'planet', distance, speed, angle: seqLen, size, trail: [] });
    }
    ensureAnimationLoop();
  }
  update() {
    this.time += 1;
    let active = false;
    let newestPlanet = null;
    
    this.planets.forEach(p => {
      if (p.type === 'flare') {
         if (p.age < 150) { p.age++; active = true; }
      } else {
         p.angle += p.speed;
         active = true;
         const px = Math.cos(p.angle) * p.distance;
         const py = Math.sin(p.angle) * p.distance;
         p.trail.push({x: px, y: py});
         if (p.teleport) { p.trail = []; p.teleport = false; }
         if (p.trail.length > 80) p.trail.shift();
         newestPlanet = {x: px, y: py};
      }
    });
    
    if (state.cameraFollow && newestPlanet) {
      this.focusX += (newestPlanet.x - this.focusX) * 0.05;
      this.focusY += (newestPlanet.y - this.focusY) * 0.05;
    } else {
      this.focusX += (0 - this.focusX) * 0.05;
      this.focusY += (0 - this.focusY) * 0.05;
    }
    
    if (this.planets.length > 0) active = true;
    return active;
  }
  draw(ctx) {
    if (this.planets.length === 0) return;
    const accent = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#00e5ff';
    const accentSec = getComputedStyle(document.body).getPropertyValue('--accent-secondary').trim() || '#ff00e5';
    ctx.save();
    
    ctx.translate(window.innerWidth / 2, window.innerHeight / 2);
    ctx.translate(-this.focusX, -this.focusY);
    
    ctx.beginPath(); ctx.fillStyle = accentSec; ctx.shadowColor = accentSec; ctx.shadowBlur = 20 * this.bs;
    ctx.arc(0, 0, 10 * this.bs, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
    
    this.planets.forEach(p => {
      if (p.type === 'flare') {
        const prog = p.age / 150;
        ctx.beginPath(); ctx.strokeStyle = accentSec; ctx.lineWidth = 2 * this.bs * (1-prog);
        ctx.globalAlpha = Math.max(0, 1 - prog);
        ctx.arc(0, 0, p.maxRadius * Math.pow(prog, 0.5), 0, Math.PI * 2);
        ctx.stroke(); ctx.globalAlpha = 1;
      } else {
        ctx.beginPath(); ctx.strokeStyle = accentSec; ctx.lineWidth = 0.5; ctx.globalAlpha = 0.1;
        ctx.arc(0, 0, p.distance, 0, Math.PI * 2); ctx.stroke();
        
        if (p.trail.length > 1) {
          ctx.beginPath(); ctx.strokeStyle = accent; ctx.lineWidth = 2 * this.bs;
          ctx.lineCap = 'round'; ctx.lineJoin = 'round';
          ctx.moveTo(p.trail[0].x, p.trail[0].y);
          for (let i = 1; i < p.trail.length; i++) {
             ctx.globalAlpha = 0.5 * (i / p.trail.length);
             ctx.lineTo(p.trail[i].x, p.trail[i].y);
          }
          ctx.stroke(); ctx.globalAlpha = 1;
        }
        
        const px = Math.cos(p.angle) * p.distance;
        const py = Math.sin(p.angle) * p.distance;
        ctx.beginPath(); ctx.fillStyle = accent; 
        ctx.shadowColor = accent; ctx.shadowBlur = 8 * this.bs;
        ctx.arc(px, py, p.size, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      }
    });
    ctx.restore();
  }
}
