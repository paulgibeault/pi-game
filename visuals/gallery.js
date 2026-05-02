class GalleryVisual {
  constructor() { this.reset(); }
  reset() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.rects = [];
    this.currentRect = {x: -w/2, y: -h/2, w: w, h: h};
    this.moving = false; this.updateScreenSize();
    this.zoomScale = 1; this.targetZoomScale = 1;
    this.focusX = 0; this.focusY = 0;
    this.targetFocusX = 0; this.targetFocusY = 0;
  }
  updateScreenSize() { this.bs = Math.max(1, Math.min(window.innerWidth, window.innerHeight) / 400); }
  feedDigit(digit, seqLen) {
    this.moving = true;
    if (digit === '0') {
      this.reset();
    } else if (digit === '5') {
      if (this.rects.length > 0) {
        const colors = ['#c0392b', '#2980b9', '#f39c12', '#2c3e50'];
        this.rects[this.rects.length - 1].color = colors[seqLen % colors.length];
      }
    } else {
      const phi = 0.61803398875;
      const r = this.currentRect;
      let square = {x: r.x, y: r.y, w: 0, h: 0, color: null};
      let nextRect = {x: 0, y: 0, w: 0, h: 0};
      
      const dir = parseInt(digit) % 4; // 0: left, 1: top, 2: right, 3: bottom
      
      if (r.w >= r.h) {
        const size = r.w * (1 - phi);
        square.w = size; square.h = r.h;
        nextRect.w = r.w - size; nextRect.h = r.h;
        if (dir % 2 === 0) { // left
          square.x = r.x; nextRect.x = r.x + size; nextRect.y = r.y;
        } else { // right
          square.x = r.x + nextRect.w; nextRect.x = r.x; nextRect.y = r.y;
        }
      } else {
        const size = r.h * (1 - phi);
        square.w = r.w; square.h = size;
        nextRect.w = r.w; nextRect.h = r.h - size;
        if (dir % 2 === 0) { // top
          square.y = r.y; nextRect.x = r.x; nextRect.y = r.y + size;
        } else { // bottom
          square.y = r.y + nextRect.h; nextRect.x = r.x; nextRect.y = r.y;
        }
      }
      this.rects.push(square);
      this.currentRect = nextRect;
      
      // Update target zoom and focus to keep the current rect in view
      if (state.cameraFollow) {
         this.targetFocusX = this.currentRect.x + this.currentRect.w / 2;
         this.targetFocusY = this.currentRect.y + this.currentRect.h / 2;
         const minDim = Math.min(window.innerWidth, window.innerHeight);
         const rectMin = Math.min(this.currentRect.w, this.currentRect.h);
         this.targetZoomScale = (minDim / rectMin) * 0.4; // leave margin
      }
    }
    ensureAnimationLoop();
  }
  update() {
    let active = false;
    if (Math.abs(this.zoomScale - this.targetZoomScale) > 0.001) {
      this.zoomScale += (this.targetZoomScale - this.zoomScale) * 0.05;
      active = true;
    }
    if (Math.abs(this.focusX - this.targetFocusX) > 0.5) {
      this.focusX += (this.targetFocusX - this.focusX) * 0.05;
      active = true;
    }
    if (Math.abs(this.focusY - this.targetFocusY) > 0.5) {
      this.focusY += (this.targetFocusY - this.focusY) * 0.05;
      active = true;
    }
    // Always return active if moving so we don't freeze early
    if (!active && this.moving) this.moving = false;
    return active || this.moving;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(window.innerWidth / 2, window.innerHeight / 2);
    
    if (state.cameraFollow) {
      ctx.scale(this.zoomScale, this.zoomScale);
      ctx.translate(-this.focusX, -this.focusY);
    }
    
    ctx.lineWidth = 6 * this.bs / this.zoomScale; // keep lines thick even when zoomed
    ctx.strokeStyle = '#2c2c2c';
    
    this.rects.forEach(r => {
      if (r.color) { 
        ctx.fillStyle = r.color; 
        ctx.fillRect(r.x, r.y, r.w, r.h); 
      }
      ctx.strokeRect(r.x, r.y, r.w, r.h);
    });
    
    // Draw current remaining rect outline faintly
    ctx.strokeStyle = 'rgba(44,44,44,0.3)';
    ctx.strokeRect(this.currentRect.x, this.currentRect.y, this.currentRect.w, this.currentRect.h);
    
    ctx.restore();
  }
}
