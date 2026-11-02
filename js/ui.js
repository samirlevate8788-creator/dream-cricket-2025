/**
 * DREAM CRICKET 2025 - HUD & Broadcast UI Controller
 * Manages:
 * - Real-time scoreboard & run rate statistics
 * - Ball speed radar & delivery type
 * - Shot timing gauge & feedback banners
 * - Over ball-by-ball timeline
 * - Wagon wheel modal & victory confetti
 */

export class CricketUIController {
  constructor() {
    this.initElements();
    this.selectedShotDir = 'STRAIGHT';
    this.isLofted = false;
  }

  initElements() {
    // Scoreboard
    this.scoreMain = document.getElementById('score-runs');
    this.scoreWickets = document.getElementById('score-wickets');
    this.oversText = document.getElementById('overs-text');
    this.targetScore = document.getElementById('target-score');
    this.targetReq = document.getElementById('target-req');

    // Batsman & Bowler
    this.strikerName = document.getElementById('striker-name');
    this.strikerStats = document.getElementById('striker-stats');
    this.bowlerName = document.getElementById('bowler-name');
    this.bowlerStats = document.getElementById('bowler-stats');

    // Speed Radar
    this.radarSpeed = document.getElementById('radar-speed');
    this.radarType = document.getElementById('radar-type');

    // Banners
    this.bannerAlert = document.getElementById('banner-alert');
    this.bannerTiming = document.getElementById('banner-timing');

    // Over Timeline
    this.timelineContainer = document.getElementById('timeline-balls');

    // Controls
    this.loftBtn = document.getElementById('btn-loft');
    this.dirButtons = document.querySelectorAll('.dir-btn');

    // Modals
    this.menuModal = document.getElementById('menu-modal');
    this.statsModal = document.getElementById('stats-modal');

    this.setupListeners();
  }

  setupListeners() {
    // Direction button selectors
    this.dirButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        this.dirButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedShotDir = btn.dataset.dir || 'STRAIGHT';
      });
    });

    // Loft toggle button
    if (this.loftBtn) {
      this.loftBtn.addEventListener('click', () => {
        this.isLofted = !this.isLofted;
        this.loftBtn.classList.toggle('active', this.isLofted);
        const sub = this.loftBtn.querySelector('span');
        if (sub) sub.innerText = this.isLofted ? 'AERIAL' : 'GROUND';
      });
    }
  }

  // Set active direction programmatically (via keyboard arrow keys)
  setDirection(dir) {
    this.selectedShotDir = dir;
    this.dirButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.dir === dir);
    });
  }

  // Toggle loft via keyboard (Spacebar / Shift)
  toggleLoft(forceState) {
    this.isLofted = (forceState !== undefined) ? forceState : !this.isLofted;
    if (this.loftBtn) {
      this.loftBtn.classList.toggle('active', this.isLofted);
      const sub = this.loftBtn.querySelector('span');
      if (sub) sub.innerText = this.isLofted ? 'AERIAL' : 'GROUND';
    }
  }

  // Update live scoreboard
  updateScoreboard(matchData) {
    const {
      runs = 0,
      wickets = 0,
      overs = 0,
      balls = 0,
      target = 0,
      striker = {},
      bowler = {},
      currentOverBalls = []
    } = matchData;

    if (this.scoreMain) this.scoreMain.innerText = runs;
    if (this.scoreWickets) this.scoreWickets.innerText = `/${wickets}`;
    if (this.oversText) this.oversText.innerText = `OV ${overs}.${balls}`;

    // Target calculation
    if (this.targetScore) this.targetScore.innerText = target;
    if (this.targetReq) {
      const remainingRuns = Math.max(0, target - runs);
      const totalBallsMatch = matchData.maxOvers * 6;
      const ballsBowled = overs * 6 + balls;
      const remainingBalls = Math.max(0, totalBallsMatch - ballsBowled);
      this.targetReq.innerText = `${remainingRuns} off ${remainingBalls} balls`;
    }

    // Striker stats (e.g. "V. Kohli 28* (14)")
    if (this.strikerName && striker.name) this.strikerName.innerText = `${striker.name}*`;
    if (this.strikerStats) {
      this.strikerStats.innerHTML = `${striker.runs || 0} <span>(${striker.balls || 0}b • ${striker.fours || 0}x4 • ${striker.sixes || 0}x6)</span>`;
    }

    // Bowler stats (e.g. "P. Cummins 1.4-0-18-1")
    if (this.bowlerName && bowler.name) this.bowlerName.innerText = bowler.name;
    if (this.bowlerStats) {
      this.bowlerStats.innerHTML = `${bowler.wickets || 0}/${bowler.runs || 0} <span>(${bowler.overs || 0}.${bowler.balls || 0} ov)</span>`;
    }

    // Over timeline balls
    if (this.timelineContainer) {
      this.timelineContainer.innerHTML = '';
      currentOverBalls.forEach((b) => {
        const pip = document.createElement('div');
        pip.className = 'ball-pip';
        if (b === 4) {
          pip.classList.add('four');
          pip.innerText = '4';
        } else if (b === 6) {
          pip.classList.add('six');
          pip.innerText = '6';
        } else if (b === 'W') {
          pip.classList.add('wicket');
          pip.innerText = 'W';
        } else if (b === 0) {
          pip.classList.add('dot');
          pip.innerText = '•';
        } else {
          pip.innerText = b;
        }
        this.timelineContainer.appendChild(pip);
      });
    }
  }

  // Update speed gun radar
  updateSpeedRadar(speedKmh, deliveryType) {
    if (this.radarSpeed) this.radarSpeed.innerText = `${speedKmh} KM/H`;
    if (this.radarType) this.radarType.innerText = deliveryType.replace('_', ' ');
  }

  // Show banner alert for 6, 4, Bowled, etc.
  showAlert(text, type = 'banner-six', durationMs = 2200) {
    if (!this.bannerAlert) return;
    this.bannerAlert.className = `banner-alert active ${type}`;
    this.bannerAlert.innerText = text;

    if (type === 'banner-six' && window.confetti) {
      window.confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 }
      });
    }

    setTimeout(() => {
      this.bannerAlert.classList.remove('active');
    }, durationMs);
  }

  // Show shot timing feedback (PERFECT, GOOD, EARLY, LATE)
  showTimingFeedback(timing, exitSpeed) {
    if (!this.bannerTiming) return;
    this.bannerTiming.className = `banner-timing active timing-${timing.toLowerCase()}`;
    this.bannerTiming.innerText = `${timing} TIMING • ${exitSpeed} KM/H`;

    setTimeout(() => {
      this.bannerTiming.classList.remove('active');
    }, 1800);
  }

  // Show/Hide Modals
  setMenuModalVisible(visible) {
    if (this.menuModal) this.menuModal.classList.toggle('hidden', !visible);
  }

  setStatsModalVisible(visible) {
    if (this.statsModal) this.statsModal.classList.toggle('hidden', !visible);
  }
}
