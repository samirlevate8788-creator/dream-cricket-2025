import * as THREE from 'three';
import { CricketStadium } from './stadium.js';
import { CricketPlayerManager } from './player.js';
import { CricketPhysicsEngine } from './physics.js';
import { CricketAudioEngine } from './audio.js';
import { CricketUIController } from './ui.js';

/**
 * DREAM CRICKET 2025 - Master Game Orchestrator & State Machine
 */
export class CricketGame {
  constructor(canvasContainer) {
    this.container = canvasContainer;

    // Three.js Core
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.container.appendChild(this.renderer.domElement);

    // Modules
    this.audio = new CricketAudioEngine();
    this.stadium = new CricketStadium(this.scene);
    this.players = new CricketPlayerManager(this.scene);
    this.physics = new CricketPhysicsEngine(this.scene);
    this.ui = new CricketUIController();

    // Camera Modes
    this.cameraMode = 'BATTING'; // 'BATTING', 'BROADCAST', 'TRACK_BALL', 'SLOMO'
    this.cameraTarget = new THREE.Vector3(0, 1.2, 0);

    // Match Engine State
    this.state = 'MENU'; // 'MENU', 'READY', 'RUNUP', 'IN_FLIGHT', 'IN_PLAY', 'BALL_DEAD', 'MATCH_OVER'
    this.matchData = {
      mode: 'SUPER_OVER', // 'SUPER_OVER', 'T20_3OVER', 'NETS'
      maxOvers: 1,
      runs: 0,
      wickets: 0,
      overs: 0,
      balls: 0,
      target: 18,
      striker: { name: 'V. Kohli', runs: 0, balls: 0, fours: 0, sixes: 0 },
      nonStriker: { name: 'R. Sharma', runs: 0, balls: 0 },
      bowler: { name: 'P. Cummins', overs: 0, balls: 0, runs: 0, wickets: 0 },
      currentOverBalls: []
    };

    this.clock = new THREE.Clock();
    this.isRunningBetweenWickets = false;
    this.runsCompletedThisBall = 0;
    this.ballDeadTimer = 0;

    this.initInput();
    this.setupWindowEvents();
    this.setCameraView('BATTING');
  }

  // Set Camera View Angles
  setCameraView(mode) {
    this.cameraMode = mode;
    switch (mode) {
      case 'BATTING':
        // Over-the-shoulder batting view looking down the pitch
        this.camera.position.set(0.6, 2.3, 11.8);
        this.cameraTarget.set(0, 1.2, -5.0);
        break;

      case 'BROADCAST':
        // High TV broadcast view behind bowler
        this.camera.position.set(0, 8.5, -22.0);
        this.cameraTarget.set(0, 1.0, 8.0);
        break;

      case 'TRACK_BALL':
        // Handled dynamically in update()
        break;

      case 'SLOMO':
        this.camera.position.set(3.5, 1.8, 8.5);
        this.cameraTarget.set(0, 1.0, 8.0);
        break;
    }
    this.camera.lookAt(this.cameraTarget);
  }

  // Cycle camera views with 'C' key
  cycleCamera() {
    const modes = ['BATTING', 'BROADCAST'];
    const nextIdx = (modes.indexOf(this.cameraMode) + 1) % modes.length;
    this.setCameraView(modes[nextIdx]);
  }

  // Input bindings (Keyboard & Touch / Click)
  initInput() {
    window.addEventListener('keydown', (e) => {
      if (this.state === 'MENU') return;

      switch (e.code) {
        // Shot Directions
        case 'KeyW':
        case 'ArrowUp':
          this.ui.setDirection('STRAIGHT');
          break;
        case 'KeyA':
        case 'ArrowLeft':
          this.ui.setDirection('PULL');
          break;
        case 'KeyD':
        case 'ArrowRight':
          this.ui.setDirection('CUT');
          break;
        case 'KeyS':
        case 'ArrowDown':
          this.ui.setDirection('GLANCE');
          break;

        // Loft modifier
        case 'Space':
        case 'ShiftLeft':
          e.preventDefault();
          this.ui.toggleLoft();
          break;

        // Bat Swing Trigger
        case 'Enter':
          this.triggerBatSwing();
          break;

        // Run between wickets
        case 'KeyR':
          this.triggerRun();
          break;

        // Camera Switch
        case 'KeyC':
          this.cycleCamera();
          break;

        // Audio Mute toggle
        case 'KeyM':
          this.audio.setMuted(!this.audio.isMuted);
          break;
      }
    });

    // Hit Button
    const hitBtn = document.getElementById('btn-hit');
    if (hitBtn) {
      hitBtn.addEventListener('click', () => {
        this.triggerBatSwing();
      });
    }

    // Run Button
    const runBtn = document.getElementById('btn-run');
    if (runBtn) {
      runBtn.addEventListener('click', () => {
        this.triggerRun();
      });
    }

    // Canvas click also swings bat
    this.container.addEventListener('pointerdown', () => {
      this.audio.init();
      if (this.state === 'IN_FLIGHT') {
        this.triggerBatSwing();
      }
    });
  }

  // Batsman swings bat and evaluates collision
  triggerBatSwing() {
    if (this.state !== 'IN_FLIGHT' && this.state !== 'RUNUP') return;

    const shotDir = this.ui.selectedShotDir;
    const isLofted = this.ui.isLofted;

    // Trigger visual bat swing animation
    this.players.playShot(isLofted ? 'SIX' : shotDir);

    // Collision calculation
    const hitResult = this.physics.checkBatCollision(shotDir, isLofted, this.audio);

    if (hitResult) {
      this.state = 'IN_PLAY';
      this.matchData.striker.balls++;

      // Camera transitions to high action tracking
      this.setCameraView('TRACK_BALL');

      // Dispatch nearest fielder
      this.players.triggerFielderChase(this.physics.pos, this.physics.vel);

      // UI Feedback
      this.ui.showTimingFeedback(hitResult.timing, hitResult.speedKmh);

      // Audio Commentary
      if (hitResult.timing === 'PERFECT' && hitResult.isLofted) {
        this.audio.speakCommentary('What an unbelievable shot! Smashed high and handsome!');
      } else if (hitResult.timing === 'PERFECT') {
        this.audio.speakCommentary('Pure timing! Pierces the infield beautifully!');
      }
    }
  }

  // Running between wickets
  triggerRun() {
    if (this.state !== 'IN_PLAY' || this.isRunningBetweenWickets) return;

    this.runsCompletedThisBall++;
    this.matchData.runs++;
    this.matchData.striker.runs++;
    this.matchData.bowler.runs++;
    this.ui.updateScoreboard(this.matchData);

    this.audio.speakCommentary(`${this.runsCompletedThisBall} taken!`);
  }

  // Handle boundary (4 or 6)
  handleBoundary(runs) {
    this.state = 'BALL_DEAD';
    this.matchData.runs += runs;
    this.matchData.striker.runs += runs;
    this.matchData.bowler.runs += runs;

    if (runs === 6) {
      this.matchData.striker.sixes++;
      this.ui.showAlert('MAXIMUM 6!', 'banner-six', 2600);
      this.audio.playCrowdCheer(true, 1.5);
      this.audio.speakCommentary('That is huge! Into the top tier for a massive SIX!');
    } else {
      this.matchData.striker.fours++;
      this.ui.showAlert('FOUR RUNS!', 'banner-four', 2200);
      this.audio.playCrowdCheer(false, 1.2);
      this.audio.speakCommentary('Raced away like a tracer bullet! Four runs!');
    }

    this.matchData.currentOverBalls.push(runs);
    this.ui.updateScoreboard(this.matchData);
    this.checkMatchConditions();
  }

  // Handle clean bowled
  handleBowled(hitVel) {
    this.state = 'BALL_DEAD';
    this.stadium.shatterStrikerWickets(hitVel);
    this.matchData.wickets++;
    this.matchData.striker.balls++;
    this.matchData.bowler.wickets++;
    this.matchData.currentOverBalls.push('W');

    this.ui.showAlert('BOWLED HIM!', 'banner-wicket', 2800);
    this.audio.playCrowdCheer(false, 1.4);
    this.audio.speakCommentary('BOWLED HIM! Absolute beauty, uproots the off stump!');

    this.setCameraView('SLOMO');
    this.ui.updateScoreboard(this.matchData);
    this.checkMatchConditions();
  }

  // Handle dot ball (beaten by bowler)
  handleDotBall() {
    if (this.state !== 'IN_FLIGHT') return;
    this.state = 'BALL_DEAD';
    this.matchData.striker.balls++;
    this.matchData.currentOverBalls.push(0);
    this.ui.updateScoreboard(this.matchData);
    this.audio.speakCommentary('Beaten outside off stump! Good delivery.');
    this.checkMatchConditions();
  }

  // Check victory / defeat / over complete
  checkMatchConditions() {
    this.matchData.balls++;
    if (this.matchData.balls >= 6) {
      this.matchData.overs++;
      this.matchData.balls = 0;
      this.matchData.bowler.overs++;
    }

    // Win condition: Target chased
    if (this.matchData.runs >= this.matchData.target) {
      setTimeout(() => {
        this.endMatch(true);
      }, 1800);
      return;
    }

    // Lose condition: All out or overs finished
    const totalBallsMatch = this.matchData.maxOvers * 6;
    const ballsBowled = this.matchData.overs * 6 + this.matchData.balls;

    if (this.matchData.wickets >= 2 || ballsBowled >= totalBallsMatch) {
      setTimeout(() => {
        this.endMatch(false);
      }, 1800);
      return;
    }

    // Prepare next ball after short delay
    setTimeout(() => {
      this.prepareNextBall();
    }, 2800);
  }

  // End match banner & victory celebration
  endMatch(isVictory) {
    this.state = 'MATCH_OVER';
    if (isVictory) {
      this.ui.showAlert('CHAMPIONS! VICTORY!', 'banner-six', 4500);
      this.audio.playCrowdCheer(true, 2.0);
      this.audio.speakCommentary('What a stunning victory! They have chased down the target in style!');
      if (window.confetti) {
        window.confetti({ particleCount: 150, spread: 120, origin: { y: 0.5 } });
      }
    } else {
      this.ui.showAlert('MATCH LOST!', 'banner-wicket', 4000);
      this.audio.playCrowdGroan();
      this.audio.speakCommentary('And that is the end of the match. Fallen just short!');
    }

    setTimeout(() => {
      this.ui.setMenuModalVisible(true);
    }, 4500);
  }

  // Reset pitch and begin bowler runup
  prepareNextBall() {
    this.state = 'RUNUP';
    this.setCameraView('BATTING');
    this.runsCompletedThisBall = 0;
    this.physics.resetBall();
    this.stadium.resetStrikerWickets();
    this.players.resetFielders();

    // Start Bowler Run-Up
    this.players.startBowlingRunUp();
  }

  // Start selected match mode
  startMatch(mode = 'SUPER_OVER') {
    this.matchData.mode = mode;
    this.matchData.runs = 0;
    this.matchData.wickets = 0;
    this.matchData.overs = 0;
    this.matchData.balls = 0;
    this.matchData.currentOverBalls = [];
    this.matchData.striker = { name: 'V. Kohli', runs: 0, balls: 0, fours: 0, sixes: 0 };
    this.matchData.bowler = { name: 'P. Cummins', overs: 0, balls: 0, runs: 0, wickets: 0 };

    if (mode === 'SUPER_OVER') {
      this.matchData.maxOvers = 1;
      this.matchData.target = 18;
    } else if (mode === 'T20_3OVER') {
      this.matchData.maxOvers = 3;
      this.matchData.target = 46;
    } else {
      this.matchData.maxOvers = 99;
      this.matchData.target = 999;
    }

    this.ui.setMenuModalVisible(false);
    this.ui.updateScoreboard(this.matchData);
    this.audio.init();
    this.audio.speakCommentary('Welcome to Dream Cricket 2025! The players are taking their positions on the field.');

    setTimeout(() => {
      this.prepareNextBall();
    }, 1500);
  }

  // Window resize handler
  setupWindowEvents() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  // Master Game Loop
  animate() {
    requestAnimationFrame(() => this.animate());

    const dt = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();

    // 1. Update Stadium
    this.stadium.update(dt, time);

    // 2. Update Players (Bowler run-up triggers ball release)
    this.players.update(dt, time, () => {
      // Ball release event
      if (this.state === 'RUNUP') {
        this.state = 'IN_FLIGHT';

        // Select bowler variation AI
        const variations = [
          { speedKmh: 146, deliveryType: 'OUTSWING', lineOffset: -0.15 },
          { speedKmh: 142, deliveryType: 'INSWING', lineOffset: 0.12 },
          { speedKmh: 140, deliveryType: 'YORKER', lineOffset: 0.0 },
          { speedKmh: 148, deliveryType: 'BOUNCER', lineOffset: -0.1 },
          { speedKmh: 118, deliveryType: 'OFF_SPIN', lineOffset: -0.22 },
          { speedKmh: 114, deliveryType: 'LEG_SPIN', lineOffset: 0.15 }
        ];

        const selected = variations[Math.floor(Math.random() * variations.length)];
        this.physics.deliverBall(selected);
        this.ui.updateSpeedRadar(selected.speedKmh, selected.deliveryType);
      }
    });

    // 3. Update Ball Physics
    this.physics.update(
      dt,
      this.audio,
      (hitVel) => this.handleBowled(hitVel),
      (runs) => this.handleBoundary(runs)
    );

    // Check if keeper caught dot ball
    if (this.state === 'IN_FLIGHT' && this.physics.hasReachedKeeper) {
      this.handleDotBall();
    }

    // 4. Dynamic Camera Director
    if (this.cameraMode === 'TRACK_BALL' && this.physics.ballMesh && this.physics.ballMesh.visible) {
      // Smooth cinematic follow cam tracking soaring ball
      const ballPos = this.physics.pos;
      const targetCamPos = new THREE.Vector3(ballPos.x * 0.4, Math.max(3.5, ballPos.y + 2.5), ballPos.z + 12);
      this.camera.position.lerp(targetCamPos, dt * 4.5);
      this.camera.lookAt(ballPos);
    } else if (this.cameraMode === 'SLOMO') {
      // Orbit around stumps
      this.camera.position.x = Math.sin(time * 0.8) * 4.5;
      this.camera.position.z = 8.5 + Math.cos(time * 0.8) * 4.5;
      this.camera.lookAt(0, 0.7, 8.5);
    }

    // 5. Render Scene
    this.renderer.render(this.scene, this.camera);
  }
}
