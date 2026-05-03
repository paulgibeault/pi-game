class GalleryVisual {
  constructor() { this.reset(); }
  reset() {
    this.rects = [];
    this.spiralStep = 0;
    this.updateScreenSize();

    const phi = 1.618033988749895;
    const w = window.innerWidth, h = window.innerHeight;
    let rectW, rectH;
    if (w / h > phi) {
      rectH = h * 0.78;
      rectW = rectH * phi;
    } else {
      rectW = w * 0.78;
      rectH = rectW / phi;
    }
    this.currentRect = { x: -rectW / 2, y: -rectH / 2, w: rectW, h: rectH };
    this.outerRect = { ...this.currentRect };

    this.zoomScale = 1; this.targetZoomScale = 1;
    this.focusX = 0; this.focusY = 0;
    this.targetFocusX = 0; this.targetFocusY = 0;
    this.moving = false;
    this.updateCamera();
    this.zoomScale = this.targetZoomScale;
    this.focusX = this.targetFocusX;
    this.focusY = this.targetFocusY;
  }
  updateScreenSize() { this.bs = Math.max(1, Math.min(window.innerWidth, window.innerHeight) / 400); }

  digitColor(digit) {
    const palette = {
      '0': '#f0d8a0',
      '1': '#b53024',
      '2': '#d8702a',
      '3': '#ecb022',
      '4': '#5a9030',
      '5': '#1f5099',
      '6': '#3895c4',
      '7': '#7038a0',
      '8': '#3a2410',
      '9': '#dc3010'
    };
    return palette[digit] || '#6b4a2e';
  }

  feedDigit(digit, seqLen) {
    this.moving = true;

    const r = this.currentRect;
    if (r.w < 1e-6 || r.h < 1e-6) {
      ensureAnimationLoop();
      return;
    }
    const step = this.spiralStep % 4;
    let square, nextRect;

    if (r.w >= r.h) {
      const size = r.h;
      if (step === 0) {
        square = { x: r.x, y: r.y, w: size, h: size };
        nextRect = { x: r.x + size, y: r.y, w: r.w - size, h: r.h };
      } else {
        square = { x: r.x + r.w - size, y: r.y, w: size, h: size };
        nextRect = { x: r.x, y: r.y, w: r.w - size, h: r.h };
      }
    } else {
      const size = r.w;
      if (step === 1) {
        square = { x: r.x, y: r.y, w: size, h: size };
        nextRect = { x: r.x, y: r.y + size, w: r.w, h: r.h - size };
      } else {
        square = { x: r.x, y: r.y + r.h - size, w: size, h: size };
        nextRect = { x: r.x, y: r.y, w: r.w, h: r.h - size };
      }
    }

    square.color = this.digitColor(digit);
    square.digit = digit;
    square.step = this.spiralStep;
    square.arc = this.computeArcParams(square);

    this.rects.push(square);
    this.currentRect = nextRect;
    this.spiralStep++;

    this.updateCamera();
    ensureAnimationLoop();
  }

  updateCamera() {
    const window_ = 6;
    const recent = this.rects.slice(-window_);
    const frame = recent.length ? [...recent, this.currentRect] : [this.outerRect];
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const r of frame) {
      if (r.x < minX) minX = r.x;
      if (r.y < minY) minY = r.y;
      if (r.x + r.w > maxX) maxX = r.x + r.w;
      if (r.y + r.h > maxY) maxY = r.y + r.h;
    }
    const span = Math.max(maxX - minX, maxY - minY);
    const pad = span * 0.12;
    minX -= pad; maxX += pad; minY -= pad; maxY += pad;
    const w = maxX - minX, h = maxY - minY;
    this.targetFocusX = (minX + maxX) / 2;
    this.targetFocusY = (minY + maxY) / 2;
    this.targetZoomScale = Math.min(window.innerWidth / w, window.innerHeight / h);
  }

  update() {
    let active = false;
    const zRate = 0.16, fRate = 0.16;
    if (Math.abs(this.zoomScale - this.targetZoomScale) / Math.max(this.zoomScale, 1) > 0.002) {
      this.zoomScale += (this.targetZoomScale - this.zoomScale) * zRate;
      active = true;
    }
    const focusThresh = 0.3 / Math.max(this.zoomScale, 1);
    if (Math.abs(this.focusX - this.targetFocusX) > focusThresh) {
      this.focusX += (this.targetFocusX - this.focusX) * fRate;
      active = true;
    }
    if (Math.abs(this.focusY - this.targetFocusY) > focusThresh) {
      this.focusY += (this.targetFocusY - this.focusY) * fRate;
      active = true;
    }
    if (!active && this.moving) this.moving = false;
    return active || this.moving;
  }

  draw(ctx) {
    const zs = this.zoomScale;
    const W = window.innerWidth, H = window.innerHeight;
    const halfW = W / (2 * zs);
    const halfH = H / (2 * zs);
    const vL = this.focusX - halfW;
    const vR = this.focusX + halfW;
    const vT = this.focusY - halfH;
    const vB = this.focusY + halfH;

    ctx.save();
    ctx.translate(W / 2, H / 2);
    ctx.scale(zs, zs);
    ctx.translate(-this.focusX, -this.focusY);

    const screenPx = 1 / Math.max(zs, 0.5);
    const ink = '#2a1f14';
    const inkSoft = 'rgba(42,31,20,0.42)';
    const inkFaint = 'rgba(42,31,20,0.20)';
    const inkGhost = 'rgba(42,31,20,0.10)';
    const borderW = screenPx * 0.9;
    const rects = this.rects;
    const n = rects.length;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const oR = this.outerRect;
    const outerContains = oR.x < vL && oR.x + oR.w > vR && oR.y < vT && oR.y + oR.h > vB;
    const outerOff = oR.x + oR.w < vL || oR.x > vR || oR.y + oR.h < vT || oR.y > vB;
    if (!outerContains && !outerOff) {
      ctx.strokeStyle = ink;
      ctx.lineWidth = borderW * 1.1;
      ctx.strokeRect(oR.x, oR.y, oR.w, oR.h);
    }

    let firstVisible = n;
    let endIdx = 0;
    for (let i = 0; i < n; i++) {
      const r = rects[i];
      if (r.w * zs < 0.5) break;
      if (r.x + r.w < vL || r.x > vR || r.y + r.h < vT || r.y > vB) continue;
      if (firstVisible === n) firstVisible = i;
      endIdx = i + 1;
    }

    ctx.globalAlpha = 0.62;
    for (let i = firstVisible; i < endIdx; i++) {
      const r = rects[i];
      if (r.x + r.w < vL || r.x > vR || r.y + r.h < vT || r.y > vB) continue;
      if (r.color) {
        ctx.fillStyle = r.color;
        ctx.fillRect(r.x, r.y, r.w, r.h);
      }
    }
    ctx.globalAlpha = 1;

    ctx.strokeStyle = inkGhost;
    ctx.lineWidth = borderW * 0.45;
    ctx.setLineDash([screenPx * 3, screenPx * 4]);
    ctx.beginPath();
    for (let i = firstVisible; i < endIdx; i++) {
      const r = rects[i];
      if (r.w * zs < 60) break;
      if (r.x + r.w < vL || r.x > vR || r.y + r.h < vT || r.y > vB) continue;
      const p = r.arc;
      ctx.moveTo(p.cx + p.r, p.cy);
      ctx.arc(p.cx, p.cy, p.r, 0, Math.PI * 2);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = inkFaint;
    ctx.lineWidth = borderW * 0.4;
    ctx.beginPath();
    for (let i = firstVisible; i < endIdx; i++) {
      const r = rects[i];
      if (r.w * zs < 40) break;
      if (r.x + r.w < vL || r.x > vR || r.y + r.h < vT || r.y > vB) continue;
      const p = r.arc;
      ctx.moveTo(p.cx, p.cy);
      ctx.lineTo(p.p1x, p.p1y);
      ctx.moveTo(p.cx, p.cy);
      ctx.lineTo(p.p2x, p.p2y);
    }
    ctx.stroke();

    ctx.fillStyle = inkSoft;
    const dotR = screenPx * 1.2;
    ctx.beginPath();
    for (let i = firstVisible; i < endIdx; i++) {
      const r = rects[i];
      if (r.w * zs < 40) break;
      if (r.x + r.w < vL || r.x > vR || r.y + r.h < vT || r.y > vB) continue;
      const p = r.arc;
      ctx.moveTo(p.cx + dotR, p.cy);
      ctx.arc(p.cx, p.cy, dotR, 0, Math.PI * 2);
    }
    ctx.fill();

    ctx.strokeStyle = ink;
    ctx.lineWidth = borderW * 0.95;
    ctx.beginPath();
    for (let i = firstVisible; i < endIdx; i++) {
      const r = rects[i];
      if (r.w * zs < 0.8) break;
      if (r.x + r.w < vL || r.x > vR || r.y + r.h < vT || r.y > vB) continue;
      ctx.rect(r.x, r.y, r.w, r.h);
    }
    ctx.stroke();

    const j = screenPx * 0.5;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = borderW * 0.55;
    ctx.beginPath();
    for (let i = firstVisible; i < endIdx; i++) {
      const r = rects[i];
      if (r.w * zs < 0.8) break;
      if (r.x + r.w < vL || r.x > vR || r.y + r.h < vT || r.y > vB) continue;
      ctx.moveTo(r.x - j, r.y + j);
      ctx.lineTo(r.x + r.w + j, r.y - j);
      ctx.lineTo(r.x + r.w - j, r.y + r.h + j);
      ctx.lineTo(r.x + j, r.y + r.h - j);
      ctx.closePath();
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.strokeStyle = ink;
    ctx.lineWidth = borderW * 1.5;
    ctx.beginPath();
    for (let i = firstVisible; i < endIdx; i++) {
      const r = rects[i];
      if (r.w * zs < 0.6) break;
      if (r.x + r.w < vL || r.x > vR || r.y + r.h < vT || r.y > vB) continue;
      const p = r.arc;
      ctx.moveTo(p.p1x, p.p1y);
      ctx.arc(p.cx, p.cy, p.r, p.a1, p.a2, p.ccw);
    }
    ctx.stroke();

    ctx.globalAlpha = 0.6;
    ctx.lineWidth = borderW * 0.85;
    for (let i = firstVisible; i < endIdx; i++) {
      const r = rects[i];
      if (r.w * zs < 0.6) break;
      if (r.x + r.w < vL || r.x > vR || r.y + r.h < vT || r.y > vB) continue;
      if (!r.color) continue;
      const p = r.arc;
      ctx.strokeStyle = r.color;
      ctx.beginPath();
      ctx.arc(p.cx, p.cy, p.r, p.a1, p.a2, p.ccw);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const cR = this.currentRect;
    if (cR.w * zs > 4 && !(cR.x + cR.w < vL || cR.x > vR || cR.y + cR.h < vT || cR.y > vB)) {
      ctx.strokeStyle = inkSoft;
      ctx.lineWidth = borderW * 0.55;
      ctx.setLineDash([screenPx * 2.5, screenPx * 2.5]);
      ctx.strokeRect(cR.x, cR.y, cR.w, cR.h);
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  computeArcParams(r) {
    const step = r.step % 4;
    let cx, cy, p1x, p1y, p2x, p2y;
    if (step === 0) {
      cx = r.x + r.w; cy = r.y + r.h;
      p1x = r.x; p1y = r.y + r.h;
      p2x = r.x + r.w; p2y = r.y;
    } else if (step === 1) {
      cx = r.x; cy = r.y + r.h;
      p1x = r.x; p1y = r.y;
      p2x = r.x + r.w; p2y = r.y + r.h;
    } else if (step === 2) {
      cx = r.x; cy = r.y;
      p1x = r.x + r.w; p1y = r.y;
      p2x = r.x; p2y = r.y + r.h;
    } else {
      cx = r.x + r.w; cy = r.y;
      p1x = r.x + r.w; p1y = r.y + r.h;
      p2x = r.x; p2y = r.y;
    }
    const a1 = Math.atan2(p1y - cy, p1x - cx);
    const a2 = Math.atan2(p2y - cy, p2x - cx);
    let diff = a2 - a1;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return { cx, cy, r: r.w, a1, a2, ccw: diff < 0, p1x, p1y, p2x, p2y };
  }
}
