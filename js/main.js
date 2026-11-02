import { CricketGame } from './game.js';

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('canvas-container');
  const game = new CricketGame(container);

  // Mode Selection Buttons
  const modeBtns = document.querySelectorAll('.mode-btn');
  let selectedMode = 'SUPER_OVER';

  modeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      modeBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedMode = btn.dataset.mode;
    });
  });

  // Start Match Button
  const startBtn = document.getElementById('start-match-btn');
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      game.startMatch(selectedMode);
    });
  }

  // Camera Switch Button in HUD
  const camBtn = document.getElementById('btn-camera');
  if (camBtn) {
    camBtn.addEventListener('click', () => {
      game.cycleCamera();
    });
  }

  // Sound Toggle Button in HUD
  const soundBtn = document.getElementById('btn-sound');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      const isMuted = !game.audio.isMuted;
      game.audio.setMuted(isMuted);
      soundBtn.innerHTML = isMuted ? '🔇' : '🔊';
    });
  }

  // Wagon Wheel / Stats Button
  const statsBtn = document.getElementById('btn-stats');
  if (statsBtn) {
    statsBtn.addEventListener('click', () => {
      game.ui.setStatsModalVisible(true);
      drawWagonWheel(game.matchData);
    });
  }

  const closeStatsBtn = document.getElementById('close-stats-btn');
  if (closeStatsBtn) {
    closeStatsBtn.addEventListener('click', () => {
      game.ui.setStatsModalVisible(false);
    });
  }

  // Draw 2D Wagon Wheel on Canvas
  function drawWagonWheel(matchData) {
    const canvas = document.getElementById('wagon-wheel-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;

    // Clear
    ctx.clearRect(0, 0, w, h);

    // Oval turf
    ctx.beginPath();
    ctx.arc(cx, cy, 110, 0, Math.PI * 2);
    ctx.fillStyle = '#0f291e';
    ctx.fill();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 30 yard circle
    ctx.beginPath();
    ctx.arc(cx, cy, 45, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Pitch strip
    ctx.fillStyle = '#c2a677';
    ctx.fillRect(cx - 3, cy - 14, 6, 28);

    // Raycast shot directions for 4s and 6s
    const shots = [
      { angle: -Math.PI / 3, r: 105, color: '#ffd700', label: '6' },
      { angle: -Math.PI / 6, r: 95, color: '#00f0ff', label: '4' },
      { angle: Math.PI / 4, r: 85, color: '#00f0ff', label: '4' },
      { angle: (3 * Math.PI) / 4, r: 108, color: '#ffd700', label: '6' }
    ];

    shots.forEach((s) => {
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      const ex = cx + Math.cos(s.angle) * s.r;
      const ey = cy + Math.sin(s.angle) * s.r;
      ctx.lineTo(ex, ey);
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(ex, ey, 5, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.fill();
    });
  }

  // Start Animation Loop
  game.animate();
});
