let currentVisual = null;

function initVisual() {
  const theme = state.currentTheme;
  if (theme === 'neural') currentVisual = new TracerVisual();
  else if (theme === 'blueprint') currentVisual = new SpirographVisual();
  else if (theme === 'gallery') currentVisual = new GalleryVisual();
  else if (theme === 'orbital') currentVisual = new OrbitalVisual();
  else currentVisual = new TracerVisual();
  
  const $practiceArea = document.getElementById('practice-area');
  
  if (state.gameState === 'PLAYING' || ($practiceArea && $practiceArea.classList.contains('active'))) {
     const seq = state.gameState === 'PLAYING' ? state.userSequence : practiceDigitsStr.slice(0, practicePos);
     for (let i = 0; i < seq.length; i++) {
        currentVisual.feedDigit(seq[i], i + (state.gameState === 'PLAYING' ? 0 : practiceRangeStart));
     }
  }
}
