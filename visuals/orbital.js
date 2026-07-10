class OrbitalVisual {
  constructor() { this.reset(); }
  reset() {
    this.bodies = [];
    this.time = 0;
    this.moving = false;
    this.focusX = 0; this.focusY = 0;
    this.updateScreenSize();
  }
  updateScreenSize() {
    this.bs = Math.max(1, Math.min(window.innerWidth, window.innerHeight) / 400);
    this.maxRadius = Math.max(window.innerWidth, window.innerHeight) / 2 * 0.92;
  }

  digitConfig(digit) {
    const palette = {
      '0': '#a8e0ff', '1': '#9c8a7a', '2': '#e8b048', '3': '#4a9ce8',
      '4': '#c84a2e', '5': '#ffa028', '6': '#e8c878', '7': '#7adcd6',
      '8': '#4a6cdc', '9': '#c890e0'
    };
    const orbitFrac = {
      '1': 0.18, '2': 0.28, '3': 0.38, '4': 0.48,
      '6': 0.62, '7': 0.74, '8': 0.85, '9': 0.95
    };
    const sizeMul = {
      '0': 1.6, '1': 1.6, '2': 2.6, '3': 3.0, '4': 2.4,
      '6': 4.5, '7': 4.0, '8': 4.2, '9': 1.8
    };
    return {
      color: palette[digit] || '#fff',
      orbit: orbitFrac[digit] || 0.5,
      size: sizeMul[digit] || 3
    };
  }

  feedDigit(digit, seqLen) {
    this.moving = true;
    const cfg = this.digitConfig(digit);

    if (digit === '5') {
      this.bodies.push({ type: 'flare', color: cfg.color, age: 0, maxRadius: this.maxRadius });
    } else if (digit === '0') {
      this.bodies.push({
        type: 'comet',
        digit,
        color: cfg.color,
        a: this.maxRadius * 0.7,
        e: 0.82,
        speed: 0.014,
        angle: (seqLen * 0.83) % (Math.PI * 2),
        axisRotation: (seqLen * 0.4) % (Math.PI * 2),
        size: this.bs * cfg.size,
        trail: []
      });
    } else {
      const distance = cfg.orbit * this.maxRadius;
      const baseSpeed = 0.018 * Math.pow(0.6 / cfg.orbit, 1.5);
      const direction = (parseInt(digit) % 2 === 0) ? 1 : -1;
      const planet = {
        type: 'planet',
        digit,
        color: cfg.color,
        distance,
        speed: baseSpeed * direction * 0.4,
        angle: (seqLen * 0.83) % (Math.PI * 2),
        size: this.bs * cfg.size,
        trail: [],
        maxTrail: 50
      };
      if (digit === '6') planet.rings = true;
      if (digit === '7') planet.moons = 1;
      if (digit === '8') planet.moons = 2;
      if (digit === '9') planet.dwarf = true;
      this.bodies.push(planet);
    }

    if (this.bodies.length > 90) {
      for (let i = 0; i < this.bodies.length; i++) {
        if (this.bodies[i].type !== 'flare') { this.bodies.splice(i, 1); break; }
      }
    }
    ensureAnimationLoop();
  }

  update() {
    // Reduced motion: still place every body (so newly fed digits render),
    // but freeze orbits, trails and camera drift instead of advancing them.
    const reduced = Arcade.settings.reducedMotion();
    if (!reduced) this.time++;
    let active = false;
    let newest = null;

    for (const b of this.bodies) {
      if (b.type === 'flare') {
        if (!reduced && b.age < 150) { b.age++; active = true; }
      } else if (b.type === 'comet') {
        if (!reduced) b.angle += b.speed;
        const r = b.a * (1 - b.e * b.e) / (1 + b.e * Math.cos(b.angle));
        const lx = Math.cos(b.angle) * r;
        const ly = Math.sin(b.angle) * r;
        const c = Math.cos(b.axisRotation), s = Math.sin(b.axisRotation);
        b.x = lx * c - ly * s;
        b.y = lx * s + ly * c;
        if (!reduced) {
          b.trail.push({ x: b.x, y: b.y });
          if (b.trail.length > 60) b.trail.shift();
          active = true;
        }
        newest = { x: b.x, y: b.y };
      } else {
        if (!reduced) b.angle += b.speed;
        b.x = Math.cos(b.angle) * b.distance;
        b.y = Math.sin(b.angle) * b.distance;
        if (!reduced) {
          b.trail.push({ x: b.x, y: b.y });
          if (b.trail.length > b.maxTrail) b.trail.shift();
          active = true;
        }
        newest = { x: b.x, y: b.y };
      }
    }

    const target = (state.cameraFollow && newest) ? newest : { x: 0, y: 0 };
    if (reduced) {
      this.focusX = target.x; this.focusY = target.y;
    } else {
      this.focusX += (target.x - this.focusX) * 0.04;
      this.focusY += (target.y - this.focusY) * 0.04;
    }

    if (this.bodies.length > 0 && !reduced) active = true;
    return active;
  }

  draw(ctx) {
    if (this.bodies.length === 0) return;
    const accent = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#7c5cfc';
    const accentSec = getComputedStyle(document.body).getPropertyValue('--accent-secondary').trim() || '#fc5c7c';

    ctx.save();
    ctx.translate(window.innerWidth / 2, window.innerHeight / 2);
    ctx.translate(-this.focusX, -this.focusY);

    ctx.beginPath();
    ctx.fillStyle = accentSec;
    ctx.shadowColor = accentSec;
    ctx.shadowBlur = 28 * this.bs;
    ctx.arc(0, 0, 12 * this.bs, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    const orbitsUsed = new Set();
    for (const b of this.bodies) {
      if (b.type === 'planet') orbitsUsed.add(b.digit);
    }
    ctx.strokeStyle = accent;
    ctx.lineWidth = 0.6;
    ctx.globalAlpha = 0.13;
    orbitsUsed.forEach(d => {
      const cfg = this.digitConfig(d);
      ctx.beginPath();
      ctx.arc(0, 0, cfg.orbit * this.maxRadius, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    for (const b of this.bodies) {
      if (b.type === 'flare') {
        const prog = b.age / 150;
        ctx.beginPath();
        ctx.strokeStyle = b.color;
        ctx.lineWidth = 2 * this.bs * (1 - prog);
        ctx.globalAlpha = Math.max(0, 1 - prog);
        ctx.arc(0, 0, b.maxRadius * Math.pow(prog, 0.5), 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
        continue;
      }

      this._drawTrail(ctx, b);

      if (b.type === 'comet') {
        ctx.beginPath();
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 14 * this.bs;
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      } else {
        ctx.beginPath();
        ctx.fillStyle = b.color;
        ctx.shadowColor = b.color;
        ctx.shadowBlur = 8 * this.bs;
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (b.rings) this._drawRings(ctx, b);
        if (b.moons) this._drawMoons(ctx, b);
        if (b.dwarf) this._drawDwarfRing(ctx, b);
      }
    }

    ctx.restore();
  }

  _drawTrail(ctx, b) {
    if (b.trail.length < 2) return;
    ctx.lineCap = 'round';
    ctx.strokeStyle = b.color;
    ctx.lineWidth = (b.type === 'comet' ? 2 : 1.5) * this.bs;
    for (let i = 1; i < b.trail.length; i++) {
      const t = i / b.trail.length;
      ctx.beginPath();
      ctx.globalAlpha = 0.55 * t;
      ctx.moveTo(b.trail[i - 1].x, b.trail[i - 1].y);
      ctx.lineTo(b.trail[i].x, b.trail[i].y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  _drawRings(ctx, b) {
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.angle * 0.4);
    ctx.strokeStyle = b.color;
    ctx.lineWidth = 1.2 * this.bs;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.ellipse(0, 0, b.size * 2.3, b.size * 0.65, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.ellipse(0, 0, b.size * 1.75, b.size * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  _drawMoons(ctx, b) {
    for (let m = 0; m < b.moons; m++) {
      const baseA = this.time * 0.06 + m * (Math.PI * 2 / b.moons);
      const dist = b.size * (2.2 + m * 0.7);
      const mx = b.x + Math.cos(baseA) * dist;
      const my = b.y + Math.sin(baseA) * dist;
      ctx.beginPath();
      ctx.fillStyle = '#cccccc';
      ctx.shadowColor = '#cccccc';
      ctx.shadowBlur = 4 * this.bs;
      ctx.arc(mx, my, b.size * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  _drawDwarfRing(ctx, b) {
    ctx.beginPath();
    ctx.strokeStyle = b.color;
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 0.6 * this.bs;
    ctx.arc(b.x, b.y, b.size * 1.9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}
