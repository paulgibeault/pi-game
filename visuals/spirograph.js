class SpirographVisual {
  constructor() { this.reset(); }
  reset() {
    this.cards = [];
    this.moving = false;
    this.updateScreenSize();
  }
  updateScreenSize() {
    this.bs = Math.max(1, Math.min(window.innerWidth, window.innerHeight) / 400);
    const availH = window.innerHeight * 0.78;
    this.cardH = Math.max(220, Math.min(availH, 560));
    this.cardW = Math.max(95, Math.min(this.cardH * 0.55, window.innerWidth * 0.16, 240));
    this.cardGap = this.cardW * 0.08;
    this.margin = this.cardW * 0.15;
  }

  feedDigit(digit, seqLen) {
    this.cards.push({ digit, seqIdx: seqLen, age: 0 });
    this.moving = true;
    const visibleCount = Math.ceil(window.innerWidth / (this.cardW + this.cardGap)) + 4;
    while (this.cards.length > visibleCount + 8) this.cards.shift();
    ensureAnimationLoop();
  }

  update() {
    let active = false;
    this.cards.forEach(c => {
      if (c.age < 24) { c.age++; active = true; }
    });
    if (this.cards.length > 0) active = true;
    return active;
  }

  draw(ctx) {
    if (this.cards.length === 0) return;
    const accent = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#4ac0e8';
    const accentSec = getComputedStyle(document.body).getPropertyValue('--accent-secondary').trim() || '#e8c84a';

    const cw = this.cardW, ch = this.cardH, gap = this.cardGap, margin = this.margin;
    const anchorX = window.innerWidth - cw - margin;
    const anchorY = window.innerHeight - ch - margin;

    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];
      const offsetFromNewest = (this.cards.length - 1 - i) * (cw + gap);
      let drawX = anchorX - offsetFromNewest;
      const drawY = anchorY;

      if (i === this.cards.length - 1 && card.age < 22) {
        const t = card.age / 22;
        const ease = 1 - Math.pow(1 - t, 3);
        drawX = anchorX + (cw + gap) * (1 - ease);
      }

      if (drawX > window.innerWidth + 20) continue;
      if (drawX + cw < -50) continue;

      let alpha = 1;
      const fadeZone = margin * 2;
      if (drawX < fadeZone) alpha = Math.max(0, drawX / fadeZone);

      ctx.save();
      ctx.globalAlpha = alpha;
      this.drawCard(ctx, drawX, drawY, cw, ch, card.digit, card.seqIdx, accent, accentSec);
      ctx.restore();
    }
  }

  drawCard(ctx, x, y, w, h, digit, seqIdx, accent, accentSec) {
    const bs = this.bs;
    const titleH = Math.max(28, h * 0.09);
    const designH = h - titleH;
    const baseAlpha = ctx.globalAlpha;

    ctx.save();
    ctx.translate(x, y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.globalAlpha = baseAlpha * 0.45;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    ctx.beginPath();
    ctx.moveTo(0, designH);
    ctx.lineTo(w, designH);
    ctx.stroke();

    const tick = Math.max(5, 7 * bs);
    ctx.beginPath();
    ctx.moveTo(0, tick); ctx.lineTo(tick, 0);
    ctx.moveTo(w - tick, 0); ctx.lineTo(w, tick);
    ctx.moveTo(0, designH - tick); ctx.lineTo(tick, designH);
    ctx.moveTo(w - tick, designH); ctx.lineTo(w, designH - tick);
    ctx.moveTo(0, h - tick); ctx.lineTo(tick, h);
    ctx.moveTo(w - tick, h); ctx.lineTo(w, h - tick);
    ctx.stroke();

    ctx.globalAlpha = baseAlpha;
    this.drawDigitDesign(ctx, digit, 0, 0, w, designH, accent, accentSec);

    const fontSize = Math.max(13, titleH * 0.5);
    ctx.fillStyle = accent;
    ctx.globalAlpha = baseAlpha * 0.95;
    ctx.font = `bold ${fontSize}px 'Courier New', monospace`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(digit, w * 0.08, designH + titleH / 2);

    ctx.globalAlpha = baseAlpha * 0.55;
    ctx.font = `${fontSize * 0.55}px 'Courier New', monospace`;
    ctx.textAlign = 'right';
    ctx.fillText('#' + (seqIdx + 1).toString().padStart(3, '0'), w - w * 0.08, designH + titleH / 2);

    ctx.restore();
  }

  drawDigitDesign(ctx, digit, x, y, w, h, accent, accentSec) {
    const baseAlpha = ctx.globalAlpha;
    const padX = w * 0.12, padY = h * 0.06;
    const ix = x + padX, iy = y + padY;
    const iw = w - padX * 2, ih = h - padY * 2;

    ctx.strokeStyle = accent;
    ctx.fillStyle = accent;
    ctx.lineWidth = 1.1;

    ctx.globalAlpha = baseAlpha * 0.10;
    ctx.beginPath();
    ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h);
    ctx.stroke();
    ctx.globalAlpha = baseAlpha;

    switch (digit) {
      case '0': this._dRotunda(ctx, ix, iy, iw, ih, baseAlpha, accent); break;
      case '1': this._dColumn(ctx, ix, iy, iw, ih, baseAlpha, accent); break;
      case '2': this._dArch(ctx, ix, iy, iw, ih, baseAlpha, accent); break;
      case '3': this._dPediment(ctx, ix, iy, iw, ih, baseAlpha, accent); break;
      case '4': this._dWindow(ctx, ix, iy, iw, ih, baseAlpha, accent); break;
      case '5': this._dPentagon(ctx, ix, iy, iw, ih, baseAlpha, accent, accentSec); break;
      case '6': this._dHexPlan(ctx, ix, iy, iw, ih, baseAlpha, accent); break;
      case '7': this._dStairs(ctx, ix, iy, iw, ih, baseAlpha, accent); break;
      case '8': this._dTower(ctx, ix, iy, iw, ih, baseAlpha, accent); break;
      case '9': this._dRoseWindow(ctx, ix, iy, iw, ih, baseAlpha, accent); break;
    }
    ctx.globalAlpha = baseAlpha;
  }

  _dimLine(ctx, x1, y1, x2, y2, baseAlpha) {
    ctx.save();
    ctx.globalAlpha = baseAlpha * 0.45;
    ctx.beginPath();
    ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const px = -uy, py = ux;
    const ah = 5;
    ctx.moveTo(x1, y1); ctx.lineTo(x1 + ux * ah + px * ah * 0.6, y1 + uy * ah + py * ah * 0.6);
    ctx.moveTo(x1, y1); ctx.lineTo(x1 + ux * ah - px * ah * 0.6, y1 + uy * ah - py * ah * 0.6);
    ctx.moveTo(x2, y2); ctx.lineTo(x2 - ux * ah + px * ah * 0.6, y2 - uy * ah + py * ah * 0.6);
    ctx.moveTo(x2, y2); ctx.lineTo(x2 - ux * ah - px * ah * 0.6, y2 - uy * ah - py * ah * 0.6);
    ctx.stroke();
    ctx.restore();
  }

  _dRotunda(ctx, x, y, w, h, ba, accent) {
    const cx = x + w / 2, cy = y + h * 0.45;
    const r = Math.min(w, h * 0.55) * 0.45;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.7, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.18, 0, Math.PI * 2); ctx.fill();
    ctx.save();
    ctx.globalAlpha = ba * 0.35;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = i * Math.PI / 4;
      ctx.moveTo(cx + Math.cos(a) * r * 0.7, cy + Math.sin(a) * r * 0.7);
      ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    }
    ctx.stroke();
    ctx.restore();
    this._dimLine(ctx, cx - r, cy + h * 0.30, cx + r, cy + h * 0.30, ba);
    ctx.save();
    ctx.fillStyle = accent;
    ctx.globalAlpha = ba * 0.6;
    ctx.font = `${Math.max(10, h * 0.04)}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('Ø ' + (r * 2).toFixed(0), cx, cy + h * 0.30 + 4);
    ctx.restore();
  }

  _dColumn(ctx, x, y, w, h, ba, accent) {
    const cx = x + w / 2;
    const top = y + h * 0.05;
    const bot = y + h * 0.95;
    const baseH = h * 0.06;
    const capH = h * 0.08;
    const shaftW = Math.min(w * 0.30, 50);
    const baseW = shaftW * 1.55;
    const capW = shaftW * 1.7;

    ctx.strokeRect(cx - baseW / 2, bot - baseH, baseW, baseH);
    ctx.strokeRect(cx - capW / 2, top, capW, capH);
    ctx.beginPath();
    ctx.moveTo(cx - shaftW / 2, top + capH);
    ctx.lineTo(cx - shaftW / 2, bot - baseH);
    ctx.moveTo(cx + shaftW / 2, top + capH);
    ctx.lineTo(cx + shaftW / 2, bot - baseH);
    ctx.stroke();
    ctx.save();
    ctx.globalAlpha = ba * 0.35;
    const flutes = 4;
    for (let i = 1; i < flutes; i++) {
      const fx = cx - shaftW / 2 + (shaftW / flutes) * i;
      ctx.beginPath();
      ctx.moveTo(fx, top + capH + 4);
      ctx.lineTo(fx, bot - baseH - 4);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(cx - capW / 2, top + capH * 0.55);
    ctx.lineTo(cx + capW / 2, top + capH * 0.55);
    ctx.moveTo(cx - baseW / 2, bot - baseH * 0.45);
    ctx.lineTo(cx + baseW / 2, bot - baseH * 0.45);
    ctx.stroke();
    ctx.restore();
    const dx = x + w * 0.92;
    this._dimLine(ctx, dx, top, dx, bot, ba);
    ctx.save();
    ctx.fillStyle = accent;
    ctx.globalAlpha = ba * 0.6;
    ctx.font = `${Math.max(9, h * 0.032)}px 'Courier New', monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.translate(dx + 8, (top + bot) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText((bot - top).toFixed(0), 0, 0);
    ctx.restore();
  }

  _dArch(ctx, x, y, w, h, ba, accent) {
    const cx = x + w / 2;
    const top = y + h * 0.10;
    const bot = y + h * 0.92;
    const colW = Math.min(w * 0.18, 36);
    const archR = Math.min((w - colW * 2) * 0.5, h * 0.30);
    const springline = top + archR;

    ctx.strokeRect(cx - w * 0.42, bot - h * 0.04, w * 0.84, h * 0.04);

    ctx.strokeRect(cx - w * 0.4, springline, colW, bot - h * 0.04 - springline);
    ctx.strokeRect(cx + w * 0.4 - colW, springline, colW, bot - h * 0.04 - springline);

    ctx.beginPath();
    ctx.arc(cx, springline, archR, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, springline, archR * 0.85, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.save();
    ctx.globalAlpha = ba * 0.4;
    ctx.beginPath();
    for (let i = 1; i < 5; i++) {
      const a = Math.PI + (i / 5) * Math.PI;
      const r1 = archR * 0.85, r2 = archR;
      ctx.moveTo(cx + Math.cos(a) * r1, springline + Math.sin(a) * r1);
      ctx.lineTo(cx + Math.cos(a) * r2, springline + Math.sin(a) * r2);
    }
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.42, springline);
    ctx.lineTo(cx + w * 0.42, springline);
    ctx.stroke();
    ctx.restore();
  }

  _dPediment(ctx, x, y, w, h, ba, accent) {
    const cx = x + w / 2;
    const top = y + h * 0.12;
    const cornice = y + h * 0.40;
    const apex = y + h * 0.05;
    const bot = y + h * 0.94;
    const baseW = w * 0.86;

    ctx.beginPath();
    ctx.moveTo(cx - baseW / 2, cornice);
    ctx.lineTo(cx, apex);
    ctx.lineTo(cx + baseW / 2, cornice);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx - baseW / 2 - 4, cornice);
    ctx.lineTo(cx + baseW / 2 + 4, cornice);
    ctx.moveTo(cx - baseW / 2 - 4, cornice + 5);
    ctx.lineTo(cx + baseW / 2 + 4, cornice + 5);
    ctx.stroke();

    const colW = baseW / 6;
    const colTop = cornice + 8;
    const colBot = bot - h * 0.04;
    for (let i = 0; i < 4; i++) {
      const xCol = cx - baseW / 2 + colW * 0.5 + i * (baseW - colW) / 3;
      ctx.beginPath();
      ctx.moveTo(xCol - colW * 0.25, colTop);
      ctx.lineTo(xCol - colW * 0.25, colBot);
      ctx.moveTo(xCol + colW * 0.25, colTop);
      ctx.lineTo(xCol + colW * 0.25, colBot);
      ctx.stroke();
    }

    ctx.strokeRect(cx - baseW / 2 - 4, colBot, baseW + 8, h * 0.04);
  }

  _dWindow(ctx, x, y, w, h, ba, accent) {
    const cx = x + w / 2;
    const top = y + h * 0.06;
    const bot = y + h * 0.94;
    const winW = Math.min(w * 0.7, h * 0.45);
    const left = cx - winW / 2, right = cx + winW / 2;

    ctx.strokeRect(left - 5, top, winW + 10, bot - top);
    ctx.strokeRect(left, top + 5, winW, bot - top - 10);

    const midY = top + (bot - top) * 0.55;
    ctx.beginPath();
    ctx.moveTo(left, midY); ctx.lineTo(right, midY);
    ctx.moveTo(cx, top + 5); ctx.lineTo(cx, bot - 5);
    ctx.stroke();

    ctx.save();
    ctx.globalAlpha = ba * 0.25;
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const fx = left + (winW / 4) * (i + 0.5);
      ctx.moveTo(fx, top + 5);
      ctx.lineTo(fx, midY);
    }
    for (let i = 0; i < 4; i++) {
      const fx = left + (winW / 4) * (i + 0.5);
      ctx.moveTo(fx, midY);
      ctx.lineTo(fx, bot - 5);
    }
    ctx.stroke();
    ctx.restore();

    ctx.strokeRect(left - 10, bot, winW + 20, h * 0.04);
  }

  _dPentagon(ctx, x, y, w, h, ba, accent, accentSec) {
    const cx = x + w / 2, cy = y + h * 0.42;
    const r = Math.min(w * 0.4, h * 0.30);
    const pts = [];
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * 2 * Math.PI / 5;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      pts.push({ x: px, y: py });
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.save();
    ctx.globalAlpha = ba * 0.3;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      ctx.moveTo(cx, cy);
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = accentSec || accent;
    ctx.globalAlpha = ba * 0.6;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = pts[i], b = pts[(i + 2) % 5];
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();
    ctx.restore();

    const baseY = y + h * 0.86;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.1, baseY); ctx.lineTo(x + w * 0.9, baseY);
    ctx.stroke();
    this._dimLine(ctx, x + w * 0.15, y + h * 0.92, x + w * 0.85, y + h * 0.92, ba);
  }

  _dHexPlan(ctx, x, y, w, h, ba, accent) {
    const cx = x + w / 2, cy = y + h * 0.42;
    const r = Math.min(w * 0.42, h * 0.30);
    const pts = [];
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      pts.push({ x: px, y: py });
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      ctx.moveTo(cx, cy);
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, Math.PI * 2); ctx.fill();

    ctx.save();
    ctx.globalAlpha = ba * 0.35;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3;
      ctx.arc(cx, cy, r * 0.65 + (i % 2 === 0 ? 0 : 6), 0, Math.PI * 2);
    }
    ctx.restore();

    const baseY = y + h * 0.86;
    this._dimLine(ctx, cx - r, baseY, cx + r, baseY, ba);
  }

  _dStairs(ctx, x, y, w, h, ba, accent) {
    const left = x + w * 0.10, right = x + w * 0.90;
    const top = y + h * 0.10, bot = y + h * 0.90;
    const steps = 7;
    const sw = (right - left) / steps;
    const sh = (bot - top) / steps;

    ctx.beginPath();
    ctx.moveTo(left, bot);
    for (let i = 0; i < steps; i++) {
      const sx = left + i * sw;
      const sy = bot - i * sh;
      ctx.lineTo(sx, sy);
      ctx.lineTo(sx + sw, sy);
    }
    ctx.lineTo(right, top);
    ctx.stroke();

    ctx.save();
    ctx.globalAlpha = ba * 0.35;
    ctx.beginPath();
    ctx.moveTo(left, bot);
    ctx.lineTo(right, top);
    ctx.stroke();
    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(left, bot); ctx.lineTo(left, bot + 4);
    ctx.moveTo(right, top); ctx.lineTo(right, top - 4);
    ctx.stroke();
    this._dimLine(ctx, left - 6, top, left - 6, bot, ba);
  }

  _dTower(ctx, x, y, w, h, ba, accent) {
    const cx = x + w / 2;
    const towerW = Math.min(w * 0.55, h * 0.30);
    const top = y + h * 0.05;
    const bot = y + h * 0.92;
    const left = cx - towerW / 2, right = cx + towerW / 2;

    ctx.strokeRect(left, top, towerW, bot - top);
    ctx.strokeRect(left - 6, bot, towerW + 12, h * 0.05);

    const battH = h * 0.04;
    const battW = towerW / 5;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const bx = left + i * battW;
      if (i % 2 === 0) {
        ctx.moveTo(bx, top);
        ctx.lineTo(bx, top - battH);
        ctx.lineTo(bx + battW, top - battH);
        ctx.lineTo(bx + battW, top);
      }
    }
    ctx.stroke();

    const floors = 5;
    const floorH = (bot - top) / floors;
    ctx.save();
    ctx.globalAlpha = ba * 0.5;
    for (let i = 0; i < floors; i++) {
      const fy = top + (i + 0.5) * floorH;
      const winW = towerW * 0.35;
      const winH = floorH * 0.45;
      ctx.strokeRect(cx - winW / 2, fy - winH / 2, winW, winH);
      ctx.beginPath();
      ctx.arc(cx, fy - winH / 2, winW / 2, Math.PI, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx, fy - winH / 2); ctx.lineTo(cx, fy + winH / 2);
      ctx.moveTo(cx - winW / 2, fy); ctx.lineTo(cx + winW / 2, fy);
      ctx.stroke();
      if (i < floors - 1) {
        ctx.beginPath();
        ctx.moveTo(left, top + (i + 1) * floorH);
        ctx.lineTo(right, top + (i + 1) * floorH);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  _dRoseWindow(ctx, x, y, w, h, ba, accent) {
    const cx = x + w / 2, cy = y + h * 0.42;
    const r = Math.min(w * 0.40, h * 0.30);
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.30, 0, Math.PI * 2); ctx.stroke();

    const petals = 9;
    for (let i = 0; i < petals; i++) {
      const a = -Math.PI / 2 + i * 2 * Math.PI / petals;
      const pr = r * 0.55;
      const px = cx + Math.cos(a) * pr;
      const py = cy + Math.sin(a) * pr;
      ctx.beginPath();
      ctx.arc(px, py, r * 0.20, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.save();
    ctx.globalAlpha = ba * 0.4;
    ctx.beginPath();
    for (let i = 0; i < petals; i++) {
      const a = -Math.PI / 2 + i * 2 * Math.PI / petals;
      ctx.moveTo(cx + Math.cos(a) * r * 0.30, cy + Math.sin(a) * r * 0.30);
      ctx.lineTo(cx + Math.cos(a) * r * 0.85, cy + Math.sin(a) * r * 0.85);
    }
    ctx.stroke();
    ctx.restore();

    const baseY = y + h * 0.84;
    ctx.strokeRect(cx - w * 0.42, baseY, w * 0.84, h * 0.06);
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.42, baseY + h * 0.06);
    ctx.lineTo(cx + w * 0.42, baseY + h * 0.06);
    ctx.stroke();
  }
}
