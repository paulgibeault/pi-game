class SpirographVisual {
  constructor() { this.reset(); }

  reset() {
    this.elements = [];
    this.moving = false;
    this.time = 0;
    this.scale = 1;
    this.targetScale = 1;
    this.updateScreenSize();
  }

  updateScreenSize() {
    this.cx = window.innerWidth / 2;
    this.cy = window.innerHeight / 2;
    this.viewMin = Math.min(window.innerWidth, window.innerHeight);
    // Tile size is fixed in screen px — independent of element count.
    // Only positions scale with the global camera zoom.
    this.SHAPE_R = Math.max(50, this.viewMin / 10);
    this.SPREAD = this.SHAPE_R * 2.2;
    this.MAX_SCALE = 1.6;
  }

  feedDigit(digit, seqIdx) {
    const golden = Math.PI * (3 - Math.sqrt(5));
    const r = this.SPREAD * Math.sqrt(seqIdx + 0.5);
    const theta = seqIdx * golden + Math.PI / 5;
    const wx = Math.cos(theta) * r;
    const wy = Math.sin(theta) * r;
    const rotation = (seqIdx * 0.7 + (parseInt(digit) || 0) * 0.31) % (Math.PI * 2);

    this.elements.push({
      digit, seqIdx, wx, wy, r, rotation,
      hueShift: (seqIdx * 9) % 360,
      drawProgress: 0,
      pulse: 1.0,
    });
    if (this.elements.length > 200) this.elements.shift();
    this.moving = true;
    ensureAnimationLoop();
  }

  update() {
    this.time++;

    // Camera zoom shrinks as tiles spread further. Tiles themselves stay fixed size on screen.
    let maxR = this.SHAPE_R;
    for (const e of this.elements) {
      if (e.r > maxR) maxR = e.r;
    }
    const buffer = this.SHAPE_R * 1.05;
    const fit = (this.viewMin / 2 - buffer) / maxR;
    this.targetScale = Math.max(0.04, Math.min(this.MAX_SCALE, fit));
    this.scale += (this.targetScale - this.scale) * 0.06;

    let active = false;
    for (const e of this.elements) {
      if (e.drawProgress < 1) { e.drawProgress = Math.min(1, e.drawProgress + 0.06); active = true; }
      if (e.pulse > 0) { e.pulse = Math.max(0, e.pulse - 0.025); active = true; }
    }
    if (Math.abs(this.scale - this.targetScale) > 0.002) active = true;
    if (this.elements.length > 0) active = true;
    return active;
  }

  draw(ctx) {
    if (this.elements.length === 0) return;

    ctx.save();
    ctx.translate(this.cx, this.cy);

    const newestIdx = this.elements.length - 1;
    for (let i = 0; i < this.elements.length; i++) {
      const el = this.elements[i];
      const isNewest = i === newestIdx;
      const dist = newestIdx - i;
      let alpha;
      if (isNewest) alpha = 1.0;
      else if (dist < 6) alpha = 0.95 - dist * 0.05;
      else alpha = Math.max(0.45, 0.7 - dist * 0.004);

      // Position scales with camera zoom; tile drawn at natural (constant) size.
      const px = el.wx * this.scale;
      const py = el.wy * this.scale;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(el.rotation);
      ctx.globalAlpha = alpha * el.drawProgress;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      this._drawTiling(ctx, el.digit, el.hueShift, isNewest);

      if (isNewest && el.pulse > 0) {
        ctx.globalAlpha = alpha * el.pulse * 0.55;
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = `hsl(${(50 + el.hueShift) % 360}, 75%, 66%)`;
        ctx.beginPath();
        const baseR = this.SHAPE_R * 1.18;
        ctx.arc(0, 0, baseR + (1 - el.pulse) * baseR * 0.4, 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.restore();
    }

    ctx.restore();
  }

  _colorsFor(hueShift) {
    return {
      c1: `hsl(${(200 + hueShift) % 360}, 62%, 58%)`,
      c2: `hsl(${(50 + hueShift) % 360}, 72%, 62%)`,
    };
  }

  _drawTiling(ctx, digit, hueShift, isNewest) {
    const tiles = this._tilesForDigit(digit);
    if (!tiles || tiles.length === 0) return;
    const colors = this._colorsFor(hueShift);
    const lineW = isNewest ? 1.7 : 1.1;
    const textureLineW = 0.6;
    for (let i = 0; i < tiles.length; i++) {
      const fill = (i % 2 === 0) ? colors.c1 : colors.c2;
      this._drawTile(ctx, tiles[i], fill, lineW, textureLineW);
    }
  }

  _drawTile(ctx, tile, fillColor, lineW, textureLineW) {
    const halfAcute = (tile.type === 'thick' ? 36 : 18) * Math.PI / 180;
    const s = this.SHAPE_R * (tile.scale || 1);
    const A = Math.cos(halfAcute) * s;
    const B = Math.sin(halfAcute) * s;

    ctx.save();
    ctx.translate(tile.cx, tile.cy);
    ctx.rotate(tile.rot);

    const baseAlpha = ctx.globalAlpha;

    const buildPath = () => {
      ctx.beginPath();
      ctx.moveTo(-A, 0);
      ctx.lineTo(0, -B);
      ctx.lineTo(A, 0);
      ctx.lineTo(0, B);
      ctx.closePath();
    };

    // Translucent fill — lets stacked tiles blend
    buildPath();
    ctx.globalAlpha = baseAlpha * 0.48;
    ctx.fillStyle = fillColor;
    ctx.fill();

    // Hatched texture, clipped to tile
    ctx.save();
    buildPath();
    ctx.clip();
    ctx.globalAlpha = baseAlpha * 0.32;
    ctx.strokeStyle = fillColor;
    ctx.lineWidth = textureLineW;
    const spacing = s * 0.16;
    for (let x = -A - spacing; x <= A + spacing; x += spacing) {
      ctx.beginPath();
      ctx.moveTo(x, -B - 1);
      ctx.lineTo(x, B + 1);
      ctx.stroke();
    }
    ctx.restore();

    // Outline
    buildPath();
    ctx.globalAlpha = baseAlpha * 0.9;
    ctx.lineWidth = lineW;
    ctx.strokeStyle = fillColor;
    ctx.stroke();

    ctx.restore();
  }

  _tilesForDigit(digit) {
    switch (digit) {
      case '0': return this._mandala();
      case '1': return this._tiles1();
      case '2': return this._tiles2();
      case '3': return this._radial(3, 'thin', 0.55);
      case '4': return this._radial(4, 'thick', 0.6);
      case '5': return this._radial(5, 'thin', 0.55);
      case '6': return this._radial(6, 'thin', 0.52);
      case '7': return this._radial(7, 'thin', 0.50);
      case '8': return this._radial(8, 'thin', 0.48);
      case '9': return this._radial(9, 'thin', 0.46);
    }
    return [];
  }

  // n rhombi share their acute vertex at origin, evenly spaced radially
  _radial(n, type, scale) {
    const halfAcute = (type === 'thick' ? 36 : 18) * Math.PI / 180;
    const s = this.SHAPE_R * scale;
    const A = Math.cos(halfAcute) * s;
    const tiles = [];
    for (let i = 0; i < n; i++) {
      const angle = (i / n) * Math.PI * 2 - Math.PI / 2;
      tiles.push({
        type, scale,
        cx: Math.cos(angle) * A,
        cy: Math.sin(angle) * A,
        rot: angle,
      });
    }
    return tiles;
  }

  _tiles1() {
    return [{ type: 'thick', cx: 0, cy: 0, rot: -Math.PI / 2, scale: 0.62 }];
  }

  // 2 thick rhombi sharing acute vertex, sharing one full edge — chevron opening down
  _tiles2() {
    const scale = 0.55;
    const halfAcute = 36 * Math.PI / 180;
    const s = this.SHAPE_R * scale;
    const A = Math.cos(halfAcute) * s;
    const angles = [Math.PI / 2 - halfAcute, Math.PI / 2 + halfAcute];
    const tiles = angles.map(a => ({
      type: 'thick', scale,
      cx: Math.cos(a) * A,
      cy: Math.sin(a) * A,
      rot: a,
    }));
    return this._center(tiles);
  }

  _mandala() {
    const tiles = [];
    const halfThick = 36 * Math.PI / 180;
    const halfThin = 18 * Math.PI / 180;

    // Inner Sun: 5 thick rhombi sharing acute vertex at center
    const innerScale = 0.32;
    const s1 = this.SHAPE_R * innerScale;
    const A1 = Math.cos(halfThick) * s1;
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      tiles.push({
        type: 'thick', scale: innerScale,
        cx: Math.cos(angle) * A1,
        cy: Math.sin(angle) * A1,
        rot: angle,
      });
    }

    // Middle ring: 5 thin rhombi pointing outward from between sun rhombi
    const midScale = 0.3;
    const s2 = this.SHAPE_R * midScale;
    const A2 = Math.cos(halfThin) * s2;
    const B1 = Math.sin(halfThick) * s1;
    const obtuseDist = 2 * B1;
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2 - Math.PI / 2 + Math.PI / 5;
      const radial = obtuseDist + A2;
      tiles.push({
        type: 'thin', scale: midScale,
        cx: Math.cos(angle) * radial,
        cy: Math.sin(angle) * radial,
        rot: angle,
      });
    }

    // Outer ring: 10 thin rhombi forming a starburst — acute vertex pointing outward
    const outerScale = 0.24;
    const s3 = this.SHAPE_R * outerScale;
    const A3 = Math.cos(halfThin) * s3;
    const outerBase = 2 * A1 + 0.05 * this.SHAPE_R;
    for (let i = 0; i < 10; i++) {
      const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
      const radial = outerBase + A3;
      tiles.push({
        type: 'thin', scale: outerScale,
        cx: Math.cos(angle) * radial,
        cy: Math.sin(angle) * radial,
        rot: angle,
      });
    }

    return tiles;
  }

  _tileVertices(tile) {
    const halfAcute = (tile.type === 'thick' ? 36 : 18) * Math.PI / 180;
    const s = this.SHAPE_R * (tile.scale || 1);
    const A = Math.cos(halfAcute) * s;
    const B = Math.sin(halfAcute) * s;
    const local = [[-A, 0], [0, -B], [A, 0], [0, B]];
    const cosR = Math.cos(tile.rot), sinR = Math.sin(tile.rot);
    return local.map(([x, y]) => [
      tile.cx + x * cosR - y * sinR,
      tile.cy + x * sinR + y * cosR,
    ]);
  }

  _center(tiles) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const t of tiles) {
      for (const [x, y] of this._tileVertices(t)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
    const dx = -(minX + maxX) / 2;
    const dy = -(minY + maxY) / 2;
    return tiles.map(t => ({ ...t, cx: t.cx + dx, cy: t.cy + dy }));
  }
}
