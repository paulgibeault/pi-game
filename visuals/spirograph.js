class SpirographVisual {
  constructor() { this.reset(); }
  reset() {
    this.cards = [];
    this.moving = false;
    this.updateScreenSize();
  }
  updateScreenSize() {
    this.bs = Math.max(1, Math.min(window.innerWidth, window.innerHeight) / 400);
    const minDim = Math.min(window.innerWidth, window.innerHeight);
    this.cardSize = Math.max(110, Math.min(window.innerWidth * 0.16, minDim * 0.32, 220));
    this.cardGap = this.cardSize * 0.08;
    this.margin = this.cardSize * 0.12;
  }

  feedDigit(digit, seqLen) {
    this.cards.push({ digit, seqIdx: seqLen, age: 0 });
    this.moving = true;
    const visibleCount = Math.ceil(window.innerWidth / (this.cardSize + this.cardGap)) + 4;
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

    const cw = this.cardSize, ch = this.cardSize, gap = this.cardGap, margin = this.margin;
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
    const titleH = h * 0.16;
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
    ctx.moveTo(0, designH + (h - designH) - tick); ctx.lineTo(tick, h);
    ctx.moveTo(w - tick, h); ctx.lineTo(w, designH + (h - designH) - tick);
    ctx.stroke();

    ctx.globalAlpha = baseAlpha;
    this.drawDigitDesign(ctx, digit, 0, 0, w, designH, accent, accentSec);

    const fontSize = Math.max(11, titleH * 0.5);
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
    const cx = x + w / 2, cy = y + h / 2;
    const sz = Math.min(w, h);
    const r = sz * 0.30;
    const baseAlpha = ctx.globalAlpha;

    ctx.strokeStyle = accent;
    ctx.fillStyle = accent;
    ctx.lineWidth = 1.2;

    ctx.globalAlpha = baseAlpha * 0.12;
    ctx.beginPath();
    ctx.moveTo(cx - sz * 0.42, cy); ctx.lineTo(cx + sz * 0.42, cy);
    ctx.moveTo(cx, cy - sz * 0.42); ctx.lineTo(cx, cy + sz * 0.42);
    ctx.stroke();
    ctx.globalAlpha = baseAlpha;

    switch (digit) {
      case '0': this._d0(ctx, cx, cy, r, sz, baseAlpha, accent); break;
      case '1': this._d1(ctx, cx, cy, r, sz, baseAlpha, accent); break;
      case '2': this._d2(ctx, cx, cy, r, sz, baseAlpha, accent); break;
      case '3': this._d3(ctx, cx, cy, r, sz, baseAlpha, accent); break;
      case '4': this._d4(ctx, cx, cy, r, sz, baseAlpha, accent); break;
      case '5': this._d5(ctx, cx, cy, r, sz, baseAlpha, accent, accentSec); break;
      case '6': this._d6(ctx, cx, cy, r, sz, baseAlpha, accent); break;
      case '7': this._d7(ctx, cx, cy, r, sz, baseAlpha, accent); break;
      case '8': this._d8(ctx, cx, cy, r, sz, baseAlpha, accent); break;
      case '9': this._d9(ctx, cx, cy, r, sz, baseAlpha, accent); break;
    }
    ctx.globalAlpha = baseAlpha;
  }

  _label(ctx, text, x, y, sz, baseAlpha, accent, align = 'center', baseline = 'middle') {
    ctx.save();
    ctx.fillStyle = accent;
    ctx.globalAlpha = baseAlpha * 0.65;
    ctx.font = `${Math.max(9, sz * 0.10)}px 'Courier New', monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  _d0(ctx, cx, cy, r, sz, ba, accent) {
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = ba * 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - r * 1.15, cy); ctx.lineTo(cx + r * 1.15, cy);
    ctx.stroke();
    const tipL = cx - r, tipR = cx + r;
    ctx.beginPath();
    ctx.moveTo(tipL, cy); ctx.lineTo(tipL + 6, cy - 4); ctx.moveTo(tipL, cy); ctx.lineTo(tipL + 6, cy + 4);
    ctx.moveTo(tipR, cy); ctx.lineTo(tipR - 6, cy - 4); ctx.moveTo(tipR, cy); ctx.lineTo(tipR - 6, cy + 4);
    ctx.stroke();
    ctx.globalAlpha = ba;
    this._label(ctx, 'Ø' + (r * 2).toFixed(0), cx, cy - r - 6, sz, ba, accent, 'center', 'bottom');
  }

  _d1(ctx, cx, cy, r, sz, ba, accent) {
    const w = r * 1.05, h = r * 1.7;
    ctx.beginPath();
    ctx.moveTo(cx - w / 2, cy - h / 2); ctx.lineTo(cx + w / 2, cy - h / 2);
    ctx.moveTo(cx - w / 2, cy + h / 2); ctx.lineTo(cx + w / 2, cy + h / 2);
    ctx.moveTo(cx, cy - h / 2); ctx.lineTo(cx, cy + h / 2);
    ctx.moveTo(cx - w / 2 * 0.7, cy - h / 2); ctx.lineTo(cx - w / 2 * 0.7, cy - h / 2 + 4);
    ctx.moveTo(cx + w / 2 * 0.7, cy - h / 2); ctx.lineTo(cx + w / 2 * 0.7, cy - h / 2 + 4);
    ctx.moveTo(cx - w / 2 * 0.7, cy + h / 2); ctx.lineTo(cx - w / 2 * 0.7, cy + h / 2 - 4);
    ctx.moveTo(cx + w / 2 * 0.7, cy + h / 2); ctx.lineTo(cx + w / 2 * 0.7, cy + h / 2 - 4);
    ctx.stroke();

    ctx.globalAlpha = ba * 0.4;
    const dx = cx + w / 2 + sz * 0.06;
    ctx.beginPath();
    ctx.moveTo(dx, cy - h / 2); ctx.lineTo(dx, cy + h / 2);
    ctx.moveTo(dx - 3, cy - h / 2 + 5); ctx.lineTo(dx, cy - h / 2); ctx.lineTo(dx + 3, cy - h / 2 + 5);
    ctx.moveTo(dx - 3, cy + h / 2 - 5); ctx.lineTo(dx, cy + h / 2); ctx.lineTo(dx + 3, cy + h / 2 - 5);
    ctx.stroke();
    ctx.globalAlpha = ba;
    this._label(ctx, h.toFixed(0), dx + 4, cy, sz, ba, accent, 'left', 'middle');
  }

  _d2(ctx, cx, cy, r, sz, ba, accent) {
    ctx.beginPath();
    ctx.moveTo(cx - r, cy - r); ctx.lineTo(cx - r, cy + r); ctx.lineTo(cx + r, cy + r);
    ctx.stroke();
    ctx.globalAlpha = ba * 0.55;
    ctx.beginPath();
    ctx.arc(cx - r, cy + r, r * 0.32, -Math.PI / 2, 0);
    ctx.stroke();
    ctx.globalAlpha = ba;
    this._label(ctx, '90°', cx - r + r * 0.4, cy + r * 0.45, sz, ba, accent, 'left', 'top');
  }

  _d3(ctx, cx, cy, r, sz, ba, accent) {
    const tH = r * 1.85;
    const apex = { x: cx, y: cy - tH * 0.55 };
    const bl = { x: cx - tH * 0.55, y: cy + tH * 0.45 };
    const br = { x: cx + tH * 0.55, y: cy + tH * 0.45 };
    ctx.beginPath();
    ctx.moveTo(apex.x, apex.y); ctx.lineTo(bl.x, bl.y); ctx.lineTo(br.x, br.y); ctx.closePath();
    ctx.stroke();
    ctx.globalAlpha = ba * 0.4;
    const mid = { x: (bl.x + br.x) / 2, y: (bl.y + br.y) / 2 };
    ctx.beginPath();
    ctx.moveTo(apex.x, apex.y); ctx.lineTo(mid.x, mid.y);
    ctx.stroke();
    [apex, bl, br].forEach(p => {
      ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = ba;
  }

  _d4(ctx, cx, cy, r, sz, ba, accent) {
    const s = r * 1.5;
    ctx.strokeRect(cx - s / 2, cy - s / 2, s, s);
    ctx.globalAlpha = ba * 0.45;
    ctx.beginPath();
    ctx.moveTo(cx - s / 2, cy - s / 2); ctx.lineTo(cx + s / 2, cy + s / 2);
    ctx.moveTo(cx + s / 2, cy - s / 2); ctx.lineTo(cx - s / 2, cy + s / 2);
    ctx.stroke();
    ctx.globalAlpha = ba;
  }

  _d5(ctx, cx, cy, r, sz, ba, accent, accentSec) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * 2 * Math.PI / 5;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.save();
    ctx.strokeStyle = accentSec || accent;
    ctx.globalAlpha = ba * 0.7;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + i * 2 * Math.PI / 5;
      const a2 = -Math.PI / 2 + ((i + 2) % 5) * 2 * Math.PI / 5;
      ctx.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      ctx.lineTo(cx + Math.cos(a2) * r, cy + Math.sin(a2) * r);
    }
    ctx.stroke();
    ctx.restore();
  }

  _d6(ctx, cx, cy, r, sz, ba, accent) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = i * Math.PI / 3;
      const px = cx + Math.cos(a) * r;
      const py = cy + Math.sin(a) * r;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = ba * 0.4;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = ba;
  }

  _d7(ctx, cx, cy, r, sz, ba, accent) {
    const ar = r * 1.4;
    ctx.beginPath();
    ctx.moveTo(cx - ar, cy); ctx.lineTo(cx + ar, cy);
    ctx.moveTo(cx - ar, cy); ctx.lineTo(cx - ar + 9, cy - 5);
    ctx.moveTo(cx - ar, cy); ctx.lineTo(cx - ar + 9, cy + 5);
    ctx.moveTo(cx + ar, cy); ctx.lineTo(cx + ar - 9, cy - 5);
    ctx.moveTo(cx + ar, cy); ctx.lineTo(cx + ar - 9, cy + 5);
    ctx.stroke();
    ctx.globalAlpha = ba * 0.55;
    ctx.beginPath();
    ctx.moveTo(cx - ar, cy - 9); ctx.lineTo(cx - ar, cy + 9);
    ctx.moveTo(cx + ar, cy - 9); ctx.lineTo(cx + ar, cy + 9);
    ctx.stroke();
    ctx.globalAlpha = ba;
    this._label(ctx, (ar * 2).toFixed(0), cx, cy - 8, sz, ba, accent, 'center', 'bottom');
  }

  _d8(ctx, cx, cy, r, sz, ba, accent) {
    const cr = r * 0.55;
    const off = cr * 0.92;
    ctx.beginPath(); ctx.arc(cx, cy - off, cr, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy + off, cr, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha = ba * 0.4;
    ctx.beginPath();
    ctx.moveTo(cx, cy - off - cr * 1.3); ctx.lineTo(cx, cy + off + cr * 1.3);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy - off, cr * 0.18, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, cy + off, cr * 0.18, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = ba;
  }

  _d9(ctx, cx, cy, r, sz, ba, accent) {
    const teethN = 9;
    const innerR = r * 0.88, outerR = r * 1.08;
    ctx.beginPath();
    for (let i = 0; i < teethN * 2; i++) {
      const a = i * Math.PI / teethN - Math.PI / 2;
      const rr = i % 2 === 0 ? outerR : innerR;
      const px = cx + Math.cos(a) * rr;
      const py = cy + Math.sin(a) * rr;
      i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.22, 0, Math.PI * 2);
    ctx.stroke();
  }
}
