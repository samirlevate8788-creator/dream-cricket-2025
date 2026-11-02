import * as THREE from 'three';

/**
 * DREAM CRICKET 2025 - Ball Dynamics & Shot Collision Engine
 * Simulates:
 * - 3D trajectory with gravity & aerodynamic drag
 * - Realistic bowling swing (Inswing / Outswing / Spin turn)
 * - Pitch bounce with restitution and friction
 * - Bat-Ball sweet spot collision detection & exit velocity
 * - Stump impact & boundary detection
 */

export class CricketPhysicsEngine {
  constructor(scene) {
    this.scene = scene;

    // Cricket Ball constants
    this.ballRadius = 0.036; // 3.6 cm
    this.gravity = -9.81;
    this.airDrag = 0.012; // Drag coefficient
    this.pitchRestitution = 0.62; // Bounce damping
    this.pitchFriction = 0.88;    // Forward turf friction

    this.ballMesh = null;
    this.pitchMarker = null;

    this.createBall();
    this.createPitchMarker();

    this.resetBall();
  }

  // Create 3D Cricket Ball with seam
  createBall() {
    const ballGeo = new THREE.SphereGeometry(this.ballRadius, 24, 24);
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Traditional red cherry / white ball
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(0, 0, 256, 256);

    // White embossed seam
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(124, 0, 8, 256);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    for (let y = 0; y < 256; y += 8) {
      ctx.beginPath();
      ctx.moveTo(120, y);
      ctx.lineTo(136, y + 4);
      ctx.stroke();
    }

    const ballTex = new THREE.CanvasTexture(canvas);
    const ballMat = new THREE.MeshStandardMaterial({
      map: ballTex,
      roughness: 0.35,
      metalness: 0.1
    });

    this.ballMesh = new THREE.Mesh(ballGeo, ballMat);
    this.ballMesh.castShadow = true;
    this.scene.add(this.ballMesh);

    // Ball motion trail
    this.trailPoints = [];
    this.trailGeo = new THREE.BufferGeometry();
    const trailMat = new THREE.LineBasicMaterial({
      color: 0x00f0ff,
      linewidth: 3,
      transparent: true,
      opacity: 0.6
    });
    this.trailLine = new THREE.Line(this.trailGeo, trailMat);
    this.scene.add(this.trailLine);
  }

  // Glowing Pitch Marker indicating landing spot & length
  createPitchMarker() {
    const ringGeo = new THREE.RingGeometry(0.2, 0.32, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85
    });

    this.pitchMarker = new THREE.Mesh(ringGeo, ringMat);
    this.pitchMarker.rotation.x = -Math.PI / 2;
    this.pitchMarker.position.y = 0.04;
    this.pitchMarker.visible = false;
    this.scene.add(this.pitchMarker);
  }

  // Reset ball to bowler's hand
  resetBall() {
    this.pos = new THREE.Vector3(0.5, 2.1, -8.0);
    this.vel = new THREE.Vector3(0, 0, 0);
    this.spin = new THREE.Vector3(0, 0, 0);

    this.isInFlight = false;
    this.hasPitched = false;
    this.isHitByBat = false;
    this.hasReachedKeeper = false;
    this.bounceCount = 0;
    this.pitchMarker.visible = false;

    this.trailPoints = [];
    this.trailGeo.setFromPoints([]);

    if (this.ballMesh) {
      this.ballMesh.position.copy(this.pos);
      this.ballMesh.visible = false;
    }
  }

  // Bowler delivers ball with specific trajectory & variation
  deliverBall(variation = {}) {
    const {
      speedKmh = 142,
      deliveryType = 'FAST', // 'OUTSWING', 'INSWING', 'YORKER', 'BOUNCER', 'OFF_SPIN', 'LEG_SPIN'
      lineOffset = 0 // Offset from middle stump (-0.2 = outside off, +0.2 = down leg)
    } = variation;

    const speedMs = (speedKmh * 1000) / 3600; // km/h to m/s (~39 m/s)
    this.pos.set(0.4, 2.15, -8.0);

    // Calculate target pitch length (z coordinate)
    let pitchZ = 5.0; // Standard good length
    let targetVy = -3.2;

    if (deliveryType === 'YORKER') {
      pitchZ = 7.4; // Lands right at batsman's feet
      targetVy = -1.8;
    } else if (deliveryType === 'BOUNCER') {
      pitchZ = 0.5; // Short pitch
      targetVy = -5.5;
    }

    const distZ = pitchZ - this.pos.z;
    const timeToPitch = Math.abs(distZ / speedMs);

    const vz = speedMs;
    const vx = (lineOffset - this.pos.x) / timeToPitch;
    const vy = targetVy;

    this.vel.set(vx, vy, vz);

    // Spin / Swing aerodynamics
    this.spin.set(0, 0, 0);
    if (deliveryType === 'OUTSWING') {
      this.swingAccel = -1.8; // Curves towards off-stump / slip
    } else if (deliveryType === 'INSWING') {
      this.swingAccel = 1.6;  // Curves into batsman's pads
    } else if (deliveryType === 'OFF_SPIN') {
      this.spin.y = 8.0;      // Breaks in sharply off the pitch
      this.swingAccel = 0;
    } else if (deliveryType === 'LEG_SPIN') {
      this.spin.y = -8.0;     // Turns away sharply
      this.swingAccel = 0;
    } else {
      this.swingAccel = 0;
    }

    this.deliveryType = deliveryType;
    this.speedKmh = speedKmh;
    this.isInFlight = true;
    this.hasPitched = false;
    this.isHitByBat = false;
    this.hasReachedKeeper = false;
    this.bounceCount = 0;

    // Show pitch marker
    this.pitchMarker.position.set(lineOffset, 0.04, pitchZ);
    this.pitchMarker.visible = true;

    // Color code marker by length
    if (deliveryType === 'YORKER') this.pitchMarker.material.color.setHex(0xff2a5f); // Red
    else if (deliveryType === 'BOUNCER') this.pitchMarker.material.color.setHex(0xff8800); // Orange
    else this.pitchMarker.material.color.setHex(0x00f0ff); // Cyan / Good length

    this.ballMesh.visible = true;
    this.ballMesh.position.copy(this.pos);
  }

  // Evaluate bat-ball collision & hit dynamics
  checkBatCollision(shotDirection, isLofted, audio) {
    if (!this.isInFlight || this.isHitByBat) return null;

    // Batsman striking zone (z between 6.6 and 8.6, y between 0.15 and 1.8)
    const dz = this.pos.z - 7.8;
    const dx = this.pos.x - 0.2;
    const dy = this.pos.y;

    const inZZone = this.pos.z >= 6.4 && this.pos.z <= 8.4;
    const inYZone = dy >= 0.15 && dy <= 1.9;

    if (!inZZone || !inYZone) return null;

    // Timing analysis based on optimal impact window
    const timingDiff = (this.pos.z - 7.6) / (this.vel.z || 35);
    let timingGrade = 'GOOD';
    let powerMult = 1.0;
    let isSweetSpot = false;

    if (Math.abs(timingDiff) < 0.025) {
      timingGrade = 'PERFECT';
      powerMult = 1.45;
      isSweetSpot = true;
    } else if (Math.abs(timingDiff) < 0.065) {
      timingGrade = 'GOOD';
      powerMult = 1.15;
    } else if (timingDiff < -0.065) {
      timingGrade = 'EARLY';
      powerMult = 0.75;
    } else {
      timingGrade = 'LATE';
      powerMult = 0.7;
    }

    this.isHitByBat = true;
    this.pitchMarker.visible = false;

    // Calculate Exit Velocity vector based on Shot Direction & Timing
    const baseSpeed = 38 * powerMult; // ~135 to 160 km/h exit speed
    let targetDir = new THREE.Vector3(0, 0, -1);

    switch (shotDirection) {
      case 'COVER_DRIVE':
        targetDir.set(-0.85, 0, -0.65).normalize();
        break;
      case 'PULL':
        targetDir.set(0.85, 0, -0.3).normalize();
        break;
      case 'CUT':
        targetDir.set(-0.95, 0, 0.2).normalize();
        break;
      case 'GLANCE':
        targetDir.set(0.7, 0, 0.7).normalize();
        break;
      case 'STRAIGHT':
      default:
        targetDir.set(-0.1, 0, -1.0).normalize();
        break;
    }

    // Apply timing skew
    if (timingGrade === 'EARLY') {
      targetDir.x += 0.35; // Skews leg side
    } else if (timingGrade === 'LATE') {
      targetDir.x -= 0.35; // Slices off side / edge
    }

    targetDir.normalize();

    // Elevation angle
    let elevation = isLofted ? (0.42 + Math.random() * 0.18) : (0.04 + Math.random() * 0.06);
    if (timingGrade === 'EARLY' && isLofted) elevation += 0.2; // High skier risk of catch!

    this.vel.x = targetDir.x * baseSpeed;
    this.vel.z = targetDir.z * baseSpeed;
    this.vel.y = baseSpeed * elevation;

    // Realistic audio feedback
    if (audio) {
      audio.playBatCrack(powerMult, isSweetSpot);
      if (timingGrade === 'PERFECT' && isLofted) {
        audio.playCrowdCheer(true, 1.4);
      }
    }

    return {
      timing: timingGrade,
      speedKmh: Math.round(baseSpeed * 3.6),
      isLofted,
      direction: shotDirection
    };
  }

  // Update physics simulation frame by frame
  update(dt, audio, onWicketHitCallback, onBoundaryCallback) {
    if (!this.isInFlight) return;

    // Apply Aerodynamic Swing in the air
    if (!this.hasPitched && !this.isHitByBat && this.swingAccel) {
      this.vel.x += this.swingAccel * dt * 8;
    }

    // Apply Gravity & Drag
    this.vel.y += this.gravity * dt;
    this.vel.x -= this.vel.x * this.airDrag;
    this.vel.z -= this.vel.z * this.airDrag;

    // Move Ball
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    this.pos.z += this.vel.z * dt;

    // 1. Pitch / Ground Collision
    if (this.pos.y <= this.ballRadius) {
      this.pos.y = this.ballRadius;
      this.vel.y = -this.vel.y * this.pitchRestitution;
      this.vel.x *= this.pitchFriction;
      this.vel.z *= this.pitchFriction;

      this.bounceCount++;

      // Spin deviation off pitch surface
      if (!this.hasPitched && !this.isHitByBat && this.spin.y !== 0) {
        this.vel.x += this.spin.y * 0.8;
      }

      if (!this.hasPitched) {
        this.hasPitched = true;
        this.pitchMarker.visible = false;
        if (audio) audio.playPitchBounce(Math.abs(this.vel.y));
      }

      // Rolling friction stop
      if (Math.abs(this.vel.y) < 0.25) {
        this.vel.y = 0;
        this.vel.multiplyScalar(0.96); // Turf drag
      }
    }

    // 2. Striker Wickets Collision (Clean Bowled!)
    if (!this.isHitByBat && Math.abs(this.pos.z - 8.5) < 0.22) {
      const inWicketWidth = Math.abs(this.pos.x) < 0.18; // Stumps span ~23 cm
      const inWicketHeight = this.pos.y <= 0.74;

      if (inWicketWidth && inWicketHeight) {
        this.isInFlight = false;
        if (audio) audio.playStumpHit();
        if (onWicketHitCallback) onWicketHitCallback(this.vel);
        return;
      }
    }

    // 3. Reached Wicketkeeper (Dot ball / Beaten)
    if (!this.isHitByBat && this.pos.z > 11.2 && !this.hasReachedKeeper) {
      this.hasReachedKeeper = true;
      if (audio) audio.playCrowdGroan();
    }

    // 4. Boundary Check (70 Meter Oval)
    const distFromCenter = Math.sqrt(this.pos.x * this.pos.x + this.pos.z * this.pos.z);
    if (this.isHitByBat && distFromCenter >= 69.5) {
      const isSix = this.bounceCount === 0;
      this.isInFlight = false;
      if (onBoundaryCallback) onBoundaryCallback(isSix ? 6 : 4);
    }

    // Update 3D mesh
    if (this.ballMesh) {
      this.ballMesh.position.copy(this.pos);
      // Realistic ball spin rotation
      this.ballMesh.rotation.x += this.vel.z * dt * 5;
      this.ballMesh.rotation.z -= this.vel.x * dt * 5;
    }

    // Update Motion Trail
    if (this.trailPoints.length < 35) {
      this.trailPoints.push(this.pos.clone());
    } else {
      this.trailPoints.shift();
      this.trailPoints.push(this.pos.clone());
    }
    this.trailGeo.setFromPoints(this.trailPoints);
  }
}
