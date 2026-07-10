class TracerVisual {
  constructor() { this.reset(); }
  reset() {
    this.history = []; this.bursts = []; this.moving = false;
    this.updateScreenSize();
    this.x = 0; this.y = 0;
    this.targetX = 0; this.targetY = 0;
  }
  updateScreenSize() {
    this.baseScale = Math.max(1, Math.min(window.innerWidth, window.innerHeight) / 400);
    this.stepSize = Math.round(45 * this.baseScale);
  }
  feedDigit(digit, seqLen) {
    if (this.history.length === 0 || this.history[0].x !== this.targetX || this.history[0].y !== this.targetY) {
      this.history.unshift({x: this.targetX, y: this.targetY});
    }
    if (this.history.length > 200) this.history.pop();
    if (digit === '5') {
      this.bursts.push({x: this.targetX, y: this.targetY, age: 0, maxAge: 150});
      this.moving = true;
    } else if (digit === '0') {
      const seed = seqLen * 1337.1337;
      if (!state.cameraFollow) {
        this.targetX = Math.round(((Math.sin(seed) * 0.4) * window.innerWidth) / this.stepSize) * this.stepSize;
        this.targetY = Math.round(((Math.cos(seed) * 0.4) * window.innerHeight) / this.stepSize) * this.stepSize;
      } else {
        this.targetX += Math.round((Math.sin(seed) * 2 - 1) * window.innerWidth / this.stepSize) * this.stepSize;
        this.targetY += Math.round((Math.cos(seed) * 2 - 1) * window.innerHeight / this.stepSize) * this.stepSize;
      }
      this.x = this.targetX; this.y = this.targetY;
      this.history.unshift({x: this.x, y: this.y, teleport: true});
      this.moving = true;
    } else {
      let dx = 0, dy = 0;
      if (['1', '4', '7'].includes(digit)) dx = -1;
      if (['3', '6', '9'].includes(digit)) dx = 1;
      if (['1', '2', '3'].includes(digit)) dy = -1;
      if (['7', '8', '9'].includes(digit)) dy = 1;
      this.targetX += dx * this.stepSize; this.targetY += dy * this.stepSize;
      if (!state.cameraFollow) {
        const marginX = this.stepSize;
        const marginY = this.stepSize;
        if (this.targetX < -window.innerWidth/2 + marginX) this.targetX += window.innerWidth - marginX * 2;
        if (this.targetX > window.innerWidth/2 - marginX) this.targetX -= window.innerWidth - marginX * 2;
        if (this.targetY < -window.innerHeight/2 + marginY) this.targetY += window.innerHeight - marginY * 2;
        if (this.targetY > window.innerHeight/2 - marginY) this.targetY -= window.innerHeight - marginY * 2;
        this.targetX = Math.round(this.targetX / this.stepSize) * this.stepSize;
        this.targetY = Math.round(this.targetY / this.stepSize) * this.stepSize;
      }
      this.moving = true;
    }
    ensureAnimationLoop();
  }
  update() {
    if (Arcade.settings.reducedMotion()) {
      // Snap straight to the resting position instead of continuously lerping.
      this.x = this.targetX; this.y = this.targetY;
      this.moving = false;
      return false;
    }
    let active = false;
    const dx = this.targetX - this.x, dy = this.targetY - this.y;
    if (Math.abs(dx) > window.innerWidth / 2 || Math.abs(dy) > window.innerHeight / 2) {
      this.x = this.targetX; this.y = this.targetY;
    } else {
      this.x += dx * 0.25; this.y += dy * 0.25;
    }
    if (Math.abs(this.targetX - this.x) > 0.5 || Math.abs(this.targetY - this.y) > 0.5) { active = true; } 
    else { this.x = this.targetX; this.y = this.targetY; }
    for (let i = this.bursts.length - 1; i >= 0; i--) {
      if (this.bursts[i].age < this.bursts[i].maxAge) {
        this.bursts[i].age++;
        active = true;
      }
    }
    if (this.history.length > 0) active = true;
    this.moving = active; return active;
  }
  draw(ctx) {
    if (this.history.length === 0 && this.bursts.length === 0 && !this.moving) return;
    const computed = getComputedStyle(document.body);
    const accent = computed.getPropertyValue('--accent').trim() || '#00e5ff';
    const accentSec = computed.getPropertyValue('--accent-secondary').trim() || '#ff00e5';
    const bs = this.baseScale || 1;
    ctx.save();
    
    ctx.translate(window.innerWidth / 2, window.innerHeight / 2);
    if (state.cameraFollow) {
      ctx.translate(-this.x, -this.y);
    }
    
    this.bursts.forEach(b => {
      const progress = b.age / b.maxAge;
      ctx.globalAlpha = Math.max(0.15, 1 - Math.pow(progress, 2));
      ctx.strokeStyle = accentSec; ctx.lineWidth = (2 + (1 - progress) * 2) * bs;
      ctx.beginPath();
      const r = (10 + Math.pow(progress, 0.5) * 60) * bs;
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const px = b.x + Math.cos(angle) * r, py = b.y + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.stroke();
    });
    
    if (this.history.length > 0) {
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.shadowColor = accent; ctx.shadowBlur = 12 * bs; 
      ctx.strokeStyle = accent; ctx.lineWidth = 3 * bs;
      ctx.globalCompositeOperation = 'lighter';
      let lastPt = {x: this.x, y: this.y};
      for (let i = 0; i < this.history.length; i++) {
        const pt = this.history[i];
        if (pt.teleport) { lastPt = pt; continue; }
        ctx.beginPath();
        ctx.globalAlpha = 0.15 + (0.4 * (1 - i/this.history.length));
        ctx.moveTo(lastPt.x, lastPt.y);
        if (Math.abs(pt.x - lastPt.x) > window.innerWidth/2 || Math.abs(pt.y - lastPt.y) > window.innerHeight/2) {
          // Wrapped
        } else {
          ctx.lineTo(pt.x, pt.y); ctx.stroke();
        }
        lastPt = pt;
      }
      ctx.globalCompositeOperation = 'source-over'; ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    }
    ctx.beginPath(); ctx.fillStyle = accent; ctx.arc(this.x, this.y, 5 * bs, 0, Math.PI * 2);
    ctx.shadowColor = accent; ctx.shadowBlur = 15 * bs;
    ctx.fill(); ctx.restore();
  }
}
