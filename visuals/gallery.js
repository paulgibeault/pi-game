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
      rectH = h * 0.85;
      rectW = rectH * phi;
    } else {
      rectW = w * 0.85;
      rectH = rectW / phi;
    }
    this.currentRect = { x: -rectW / 2, y: -rectH / 2, w: rectW, h: rectH };

    this.zoomScale = 1; this.targetZoomScale = 1;
    this.focusX = 0; this.focusY = 0;
    this.targetFocusX = 0; this.targetFocusY = 0;
    this.moving = false;
  }
  updateScreenSize() { this.bs = Math.max(1, Math.min(window.innerWidth, window.innerHeight) / 400); }

  digitColor(digit) {
    const palette = {
      '0': '#1abc9c', '1': '#c0392b', '2': '#e67e22', '3': '#f39c12',
      '4': '#27ae60', '5': '#16a085', '6': '#2980b9', '7': '#8e44ad',
      '8': '#34495e', '9': '#d35400'
    };
    return palette[digit] || '#888';
  }

  feedDigit(digit, seqLen) {
    this.moving = true;

    if (digit === '0') {
      this.reset();
      ensureAnimationLoop();
      return;
    }

    if (digit === '5') {
      if (this.rects.length > 0) {
        const last = this.rects[this.rects.length - 1];
        last.color = this.digitColor('5');
        last.accent = true;
      }
      this.updateCamera();
      ensureAnimationLoop();
      return;
    }

    const r = this.currentRect;
    const step = this.spiralStep % 4;
    let square, nextRect;

    if (r.w >= r.h) {
      const size = r.h;
      if (step === 0) {
        square = { x: r.x + r.w - size, y: r.y, w: size, h: size };
        nextRect = { x: r.x, y: r.y, w: r.w - size, h: r.h };
      } else {
        square = { x: r.x, y: r.y, w: size, h: size };
        nextRect = { x: r.x + size, y: r.y, w: r.w - size, h: r.h };
      }
    } else {
      const size = r.w;
      if (step === 1) {
        square = { x: r.x, y: r.y + r.h - size, w: size, h: size };
        nextRect = { x: r.x, y: r.y, w: r.w, h: r.h - size };
      } else {
        square = { x: r.x, y: r.y, w: size, h: size };
        nextRect = { x: r.x, y: r.y + size, w: r.w, h: r.h - size };
      }
    }

    square.color = this.digitColor(digit);
    square.digit = digit;
    square.step = this.spiralStep;

    this.rects.push(square);
    this.currentRect = nextRect;
    this.spiralStep++;

    this.updateCamera();
    ensureAnimationLoop();
  }

  updateCamera() {
    if (!state.cameraFollow) {
      this.targetZoomScale = 1;
      this.targetFocusX = 0;
      this.targetFocusY = 0;
      return;
    }
    let minX = this.currentRect.x, maxX = this.currentRect.x + this.currentRect.w;
    let minY = this.currentRect.y, maxY = this.currentRect.y + this.currentRect.h;
    if (this.rects.length > 0) {
      const last = this.rects[this.rects.length - 1];
      minX = Math.min(minX, last.x);
      maxX = Math.max(maxX, last.x + last.w);
      minY = Math.min(minY, last.y);
      maxY = Math.max(maxY, last.y + last.h);
    }
    const w = maxX - minX, h = maxY - minY;
    this.targetFocusX = (minX + maxX) / 2;
    this.targetFocusY = (minY + maxY) / 2;
    const fitW = window.innerWidth / w;
    const fitH = window.innerHeight / h;
    this.targetZoomScale = Math.min(fitW, fitH) * 0.82;
  }

  update() {
    let active = false;
    if (Math.abs(this.zoomScale - this.targetZoomScale) > 0.001) {
      this.zoomScale += (this.targetZoomScale - this.zoomScale) * 0.07;
      active = true;
    }
    if (Math.abs(this.focusX - this.targetFocusX) > 0.5) {
      this.focusX += (this.targetFocusX - this.focusX) * 0.07;
      active = true;
    }
    if (Math.abs(this.focusY - this.targetFocusY) > 0.5) {
      this.focusY += (this.targetFocusY - this.focusY) * 0.07;
      active = true;
    }
    if (!active && this.moving) this.moving = false;
    return active || this.moving;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(window.innerWidth / 2, window.innerHeight / 2);
    ctx.scale(this.zoomScale, this.zoomScale);
    ctx.translate(-this.focusX, -this.focusY);

    const screenPx = 1 / Math.max(this.zoomScale, 0.5);
    const borderW = screenPx * 0.9;

    this.rects.forEach(r => {
      if (r.color) {
        ctx.fillStyle = r.color;
        ctx.fillRect(r.x, r.y, r.w, r.h);
      }
    });

    ctx.strokeStyle = 'rgba(20,20,20,0.85)';
    ctx.lineWidth = borderW;
    this.rects.forEach(r => {
      ctx.strokeRect(r.x, r.y, r.w, r.h);
    });

    ctx.lineWidth = borderW * 1.6;
    ctx.lineCap = 'round';
    this.rects.forEach((r, i) => {
      const params = this.spiralArcParams(r, i);
      if (!params) return;
      ctx.strokeStyle = r.color || '#222';
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.arc(params.cx, params.cy, params.r, params.a1, params.a2, params.ccw);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = borderW * 0.6;
    ctx.strokeRect(this.currentRect.x, this.currentRect.y, this.currentRect.w, this.currentRect.h);

    ctx.restore();
  }

  spiralArcParams(r, i) {
    const step = (r.step != null ? r.step : i) % 4;
    let cx, cy, p1, p2;
    if (step === 0) {
      cx = r.x + r.w; cy = r.y + r.h;
      p1 = { x: r.x + r.w, y: r.y };
      p2 = { x: r.x, y: r.y + r.h };
    } else if (step === 1) {
      cx = r.x; cy = r.y + r.h;
      p1 = { x: r.x + r.w, y: r.y + r.h };
      p2 = { x: r.x, y: r.y };
    } else if (step === 2) {
      cx = r.x; cy = r.y;
      p1 = { x: r.x, y: r.y + r.h };
      p2 = { x: r.x + r.w, y: r.y };
    } else {
      cx = r.x + r.w; cy = r.y;
      p1 = { x: r.x, y: r.y };
      p2 = { x: r.x + r.w, y: r.y + r.h };
    }
    const a1 = Math.atan2(p1.y - cy, p1.x - cx);
    const a2 = Math.atan2(p2.y - cy, p2.x - cx);
    let diff = a2 - a1;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    return { cx, cy, r: r.w, a1, a2, ccw: diff < 0 };
  }
}
