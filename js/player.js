import * as THREE from 'three';

/**
 * DREAM CRICKET 2025 - 3D Cricket Characters & Animation Controller
 * Builds procedural 3D human models for:
 * - Batsman (equipped with helmet, jersey, pads, gloves, willow bat)
 * - Bowler (with full runup, delivery action, and follow-through)
 * - Wicketkeeper (crouching with gloves behind stumps)
 * - 9 Intelligent Fielders (with dynamic ball chasing & throwing AI)
 */

export class CricketPlayerManager {
  constructor(scene) {
    this.scene = scene;
    this.batsman = null;
    this.bowler = null;
    this.keeper = null;
    this.fielders = [];
    this.nonStriker = null;

    this.createBatsman();
    this.createBowler();
    this.createWicketkeeper();
    this.createFielders();
    this.createNonStriker();
  }

  // Helper to create a stylized cricket athlete mesh
  createAthleteMesh(options = {}) {
    const {
      jerseyColor = 0x0088ff,
      pantsColor = 0xffffff,
      padColor = 0xffffff,
      hasHelmet = false,
      hasBat = false,
      hasGloves = false,
      isKeeper = false
    } = options;

    const group = new THREE.Group();

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xdca67e, roughness: 0.8 });
    const jerseyMat = new THREE.MeshStandardMaterial({ color: jerseyColor, roughness: 0.6 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.7 });
    const padMat = new THREE.MeshStandardMaterial({ color: padColor, roughness: 0.5 });
    const gloveMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.5 });

    // Torso / Chest
    const torsoGeo = new THREE.BoxGeometry(0.55, 0.7, 0.32);
    const torso = new THREE.Mesh(torsoGeo, jerseyMat);
    torso.position.y = 1.15;
    torso.castShadow = true;
    group.add(torso);

    // Head & Neck
    const neckGeo = new THREE.CylinderGeometry(0.09, 0.1, 0.12, 12);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.set(0, 1.55, 0);
    group.add(neck);

    const headGeo = new THREE.SphereGeometry(0.16, 16, 16);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0, 1.72, 0);
    head.castShadow = true;
    group.add(head);

    // Helmet with steel visor if batting/keeping
    if (hasHelmet) {
      const helmetGeo = new THREE.SphereGeometry(0.18, 16, 16);
      const helmetMat = new THREE.MeshStandardMaterial({ color: jerseyColor, roughness: 0.3, metalness: 0.2 });
      const helmet = new THREE.Mesh(helmetGeo, helmetMat);
      helmet.position.set(0, 1.74, -0.02);
      group.add(helmet);

      // Steel visor grille
      const visorGeo = new THREE.TorusGeometry(0.14, 0.015, 6, 12, Math.PI);
      const visorMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, metalness: 0.9, roughness: 0.1 });
      const visor = new THREE.Mesh(visorGeo, visorMat);
      visor.position.set(0, 1.7, 0.14);
      visor.rotation.x = -Math.PI / 4;
      group.add(visor);
    }

    // Left & Right Legs
    const buildLeg = (xOff) => {
      const legGroup = new THREE.Group();
      legGroup.position.set(xOff, 0.8, 0);

      const upperGeo = new THREE.BoxGeometry(0.2, 0.45, 0.22);
      const upper = new THREE.Mesh(upperGeo, pantsMat);
      upper.position.y = -0.22;
      legGroup.add(upper);

      // Shin / Pad
      const shinGeo = new THREE.BoxGeometry(0.22, 0.45, hasHelmet ? 0.26 : 0.2);
      const shin = new THREE.Mesh(shinGeo, hasHelmet ? padMat : pantsMat);
      shin.position.set(0, -0.65, hasHelmet ? 0.03 : 0);
      legGroup.add(shin);

      // Shoe
      const shoeGeo = new THREE.BoxGeometry(0.2, 0.1, 0.32);
      const shoe = new THREE.Mesh(shoeGeo, shoeMat);
      shoe.position.set(0, -0.9, 0.06);
      legGroup.add(shoe);

      return legGroup;
    };

    const leftLeg = buildLeg(-0.16);
    const rightLeg = buildLeg(0.16);
    group.add(leftLeg);
    group.add(rightLeg);

    // Left & Right Arms
    const leftArm = new THREE.Group();
    leftArm.position.set(-0.35, 1.4, 0);
    const lUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.38), jerseyMat);
    lUpper.position.y = -0.19;
    leftArm.add(lUpper);
    const lFore = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.36), skinMat);
    lFore.position.y = -0.52;
    leftArm.add(lFore);
    const lGlove = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), hasGloves ? gloveMat : skinMat);
    lGlove.position.y = -0.72;
    leftArm.add(lGlove);
    group.add(leftArm);

    const rightArm = new THREE.Group();
    rightArm.position.set(0.35, 1.4, 0);
    const rUpper = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.07, 0.38), jerseyMat);
    rUpper.position.y = -0.19;
    rightArm.add(rUpper);
    const rFore = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.36), skinMat);
    rFore.position.y = -0.52;
    rightArm.add(rFore);
    const rGlove = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 12), hasGloves ? gloveMat : skinMat);
    rGlove.position.y = -0.72;
    rightArm.add(rGlove);
    group.add(rightArm);

    // English Willow Cricket Bat attached to hands
    let batGroup = null;
    if (hasBat) {
      batGroup = new THREE.Group();
      // Handle
      const handleGeo = new THREE.CylinderGeometry(0.022, 0.022, 0.35, 12);
      const handleMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
      const handle = new THREE.Mesh(handleGeo, handleMat);
      handle.position.y = 0.175;
      batGroup.add(handle);

      // Willow Blade
      const bladeGeo = new THREE.BoxGeometry(0.12, 0.85, 0.045);
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0xdec190, roughness: 0.4 });
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.y = -0.38;
      blade.castShadow = true;
      batGroup.add(blade);

      // Colored sticker on bat back
      const stickerGeo = new THREE.BoxGeometry(0.11, 0.45, 0.005);
      const stickerMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
      const sticker = new THREE.Mesh(stickerGeo, stickerMat);
      sticker.position.set(0, -0.3, 0.024);
      batGroup.add(sticker);

      batGroup.position.set(0, -0.72, 0.1);
      rightArm.add(batGroup);
    }

    return {
      group,
      torso,
      head,
      leftLeg,
      rightLeg,
      leftArm,
      rightArm,
      batGroup
    };
  }

  // Batsman at Striker's Crease (z = 8.0)
  createBatsman() {
    this.batsman = this.createAthleteMesh({
      jerseyColor: 0x0070f3, // Team India Blue
      pantsColor: 0xffffff,
      padColor: 0xffffff,
      hasHelmet: true,
      hasBat: true,
      hasGloves: true
    });

    this.batsman.group.position.set(0.15, 0, 8.0);
    this.batsman.group.rotation.y = -Math.PI / 2; // Right-hand batsman facing pitch
    this.scene.add(this.batsman.group);

    // Animation state
    this.batsmanState = {
      shotName: 'IDLE',
      shotTimer: 0,
      shotDuration: 0.8,
      isSwinging: false,
      swingProgress: 0
    };

    this.setBatsmanStance();
  }

  // Default ready stance (tapping bat)
  setBatsmanStance() {
    if (!this.batsman) return;
    this.batsman.leftArm.rotation.set(0.4, 0.2, 0.5);
    this.batsman.rightArm.rotation.set(-0.2, -0.1, -0.4);
    if (this.batsman.batGroup) {
      this.batsman.batGroup.rotation.set(0.2, 0, 0);
    }
    this.batsman.leftLeg.rotation.set(0.1, 0, 0);
    this.batsman.rightLeg.rotation.set(-0.1, 0, 0);
  }

  // Trigger Batsman Shot Swing Animation
  playShot(shotType = 'STRAIGHT') {
    this.batsmanState.shotName = shotType;
    this.batsmanState.shotTimer = 0;
    this.batsmanState.isSwinging = true;
    this.batsmanState.swingProgress = 0;
  }

  // Non-Striker at z = -7.5
  createNonStriker() {
    this.nonStriker = this.createAthleteMesh({
      jerseyColor: 0x0070f3,
      hasHelmet: true,
      hasBat: true,
      hasGloves: true
    });
    this.nonStriker.group.position.set(1.4, 0, -7.5);
    this.nonStriker.group.rotation.y = Math.PI / 2;
    this.scene.add(this.nonStriker.group);
  }

  // Bowler starting run-up
  createBowler() {
    this.bowler = this.createAthleteMesh({
      jerseyColor: 0xffd700, // Aussie Gold / Opposition
      pantsColor: 0xffffff,
      hasHelmet: false,
      hasBat: false,
      hasGloves: false
    });

    this.bowlerStartPos = new THREE.Vector3(0.5, 0, -24.0);
    this.bowlerDeliveryPos = new THREE.Vector3(0.5, 0, -8.0);

    this.bowler.group.position.copy(this.bowlerStartPos);
    this.scene.add(this.bowler.group);

    this.bowlerState = {
      phase: 'IDLE', // 'RUN_UP', 'DELIVERY', 'FOLLOW_THROUGH', 'IDLE'
      timer: 0,
      runSpeed: 8.5
    };
  }

  // Start bowler run-up towards popping crease
  startBowlingRunUp() {
    this.bowlerState.phase = 'RUN_UP';
    this.bowlerState.timer = 0;
    this.bowler.group.position.copy(this.bowlerStartPos);
    this.bowler.group.rotation.y = 0;
  }

  // Wicketkeeper crouching behind stumps (z = 11.5)
  createWicketkeeper() {
    this.keeper = this.createAthleteMesh({
      jerseyColor: 0xffd700,
      pantsColor: 0xffffff,
      padColor: 0xffffff,
      hasHelmet: true,
      hasBat: false,
      hasGloves: true,
      isKeeper: true
    });

    this.keeper.group.position.set(0, 0, 11.2);
    this.keeper.group.rotation.y = Math.PI;

    // Crouch stance
    this.keeper.torso.position.y = 0.95;
    this.keeper.leftLeg.rotation.x = -0.6;
    this.keeper.rightLeg.rotation.x = -0.6;
    this.keeper.leftArm.rotation.set(0.6, 0.2, 0.4);
    this.keeper.rightArm.rotation.set(0.6, -0.2, -0.4);

    this.scene.add(this.keeper.group);
  }

  // 9 Fielders stationed around the stadium
  createFielders() {
    const fieldPositions = [
      { name: 'Slip', x: -2.8, z: 12.0 },
      { name: 'Gully / Point', x: -18.0, z: 6.0 },
      { name: 'Cover', x: -24.0, z: -4.0 },
      { name: 'Mid-off', x: -12.0, z: -14.0 },
      { name: 'Mid-on', x: 12.0, z: -14.0 },
      { name: 'Mid-wicket', x: 26.0, z: 2.0 },
      { name: 'Square Leg', x: 22.0, z: 8.0 },
      { name: 'Deep Mid-wicket', x: 48.0, z: 18.0 },
      { name: 'Long-off', x: -32.0, z: -48.0 }
    ];

    fieldPositions.forEach((pos) => {
      const fielder = this.createAthleteMesh({
        jerseyColor: 0xffd700,
        pantsColor: 0xffffff
      });

      fielder.group.position.set(pos.x, 0, pos.z);
      fielder.group.lookAt(0, 0, 8.0); // Facing batsman

      fielder.initialPos = new THREE.Vector3(pos.x, 0, pos.z);
      fielder.isChasing = false;
      fielder.chaseSpeed = 7.5;

      this.scene.add(fielder.group);
      this.fielders.push(fielder);
    });
  }

  // Reset all fielders back to standard field positions
  resetFielders() {
    this.fielders.forEach((f) => {
      f.group.position.copy(f.initialPos);
      f.group.lookAt(0, 0, 8.0);
      f.isChasing = false;
      f.leftLeg.rotation.set(0, 0, 0);
      f.rightLeg.rotation.set(0, 0, 0);
    });
  }

  // Dispatch nearest fielder to sprint and retrieve the ball
  triggerFielderChase(ballPos, ballVel) {
    let closestFielder = null;
    let minDist = Infinity;

    this.fielders.forEach((f) => {
      const dist = f.group.position.distanceTo(ballPos);
      if (dist < minDist) {
        minDist = dist;
        closestFielder = f;
      }
    });

    if (closestFielder) {
      closestFielder.isChasing = true;
      this.activeChaser = closestFielder;
    }
  }

  // Animate character models frame by frame
  update(dt, time, onBallReleaseCallback) {
    // 1. Bowler Run-Up & Delivery Logic
    if (this.bowlerState.phase === 'RUN_UP') {
      this.bowlerState.timer += dt;
      const progress = Math.min(1.0, this.bowlerState.timer / 1.7);

      // Stride forward towards delivery crease
      this.bowler.group.position.z = THREE.MathUtils.lerp(
        this.bowlerStartPos.z,
        this.bowlerDeliveryPos.z,
        progress
      );

      // Running limb cycles
      const runCycle = time * 14;
      this.bowler.leftLeg.rotation.x = Math.sin(runCycle) * 0.7;
      this.bowler.rightLeg.rotation.x = -Math.sin(runCycle) * 0.7;
      this.bowler.leftArm.rotation.x = -Math.sin(runCycle) * 0.8;
      this.bowler.rightArm.rotation.x = Math.sin(runCycle) * 0.8;

      // Delivery jump & arm wind-up
      if (progress > 0.85) {
        // High arm release action
        this.bowler.rightArm.rotation.x = THREE.MathUtils.lerp(-0.8, -3.2, (progress - 0.85) / 0.15);
      }

      if (progress >= 1.0) {
        this.bowlerState.phase = 'FOLLOW_THROUGH';
        if (onBallReleaseCallback) onBallReleaseCallback();
      }
    } else if (this.bowlerState.phase === 'FOLLOW_THROUGH') {
      this.bowler.rightArm.rotation.x = THREE.MathUtils.lerp(this.bowler.rightArm.rotation.x, 0.4, dt * 6);
      this.bowler.group.position.z += dt * 2.0; // Slowing follow through
    }

    // 2. Batsman Shot Animations
    if (this.batsmanState.isSwinging) {
      this.batsmanState.shotTimer += dt;
      const p = Math.min(1.0, this.batsmanState.shotTimer / this.batsmanState.shotDuration);
      this.batsmanState.swingProgress = p;

      const swingArc = Math.sin(p * Math.PI);

      switch (this.batsmanState.shotName) {
        case 'COVER_DRIVE':
          this.batsman.torso.rotation.y = -0.3 + swingArc * 0.5;
          this.batsman.rightArm.rotation.set(-0.2 - swingArc * 1.8, -0.4, -0.6);
          this.batsman.leftLeg.rotation.x = swingArc * 0.6; // Leaning on front foot
          if (this.batsman.batGroup) this.batsman.batGroup.rotation.x = swingArc * 1.6;
          break;

        case 'PULL':
          this.batsman.torso.rotation.y = 0.5 - swingArc * 1.2;
          this.batsman.rightArm.rotation.set(-swingArc * 1.9, 0.6, 0.4);
          this.batsman.rightLeg.rotation.x = swingArc * 0.5; // Backfoot swivel
          if (this.batsman.batGroup) this.batsman.batGroup.rotation.z = -swingArc * 1.8;
          break;

        case 'CUT':
          this.batsman.torso.rotation.y = -0.4;
          this.batsman.rightArm.rotation.set(-1.4 * swingArc, -0.8, 0.2);
          if (this.batsman.batGroup) this.batsman.batGroup.rotation.set(swingArc * 1.4, 0, swingArc * 0.8);
          break;

        case 'SIX':
        case 'STRAIGHT':
        default:
          // Magnificent Straight Loft / Drive down the ground
          this.batsman.rightArm.rotation.x = -0.3 - swingArc * 2.2;
          this.batsman.leftArm.rotation.x = 0.2 - swingArc * 1.8;
          if (this.batsman.batGroup) this.batsman.batGroup.rotation.x = swingArc * 2.4;
          this.batsman.leftLeg.rotation.x = swingArc * 0.4;
          break;
      }

      if (p >= 1.0) {
        this.batsmanState.isSwinging = false;
        this.setBatsmanStance();
      }
    } else {
      // Idle bat tapping on crease
      const tap = Math.sin(time * 6);
      if (this.batsman.batGroup) {
        this.batsman.batGroup.rotation.x = tap * 0.08;
      }
    }

    // 3. Fielder Chase AI
    if (this.activeChaser && this.activeChaser.isChasing) {
      const f = this.activeChaser;
      if (f.targetPos) {
        const dir = new THREE.Vector3().subVectors(f.targetPos, f.group.position);
        dir.y = 0;
        const dist = dir.length();

        if (dist > 1.2) {
          dir.normalize();
          f.group.position.addScaledVector(dir, f.chaseSpeed * dt);
          f.group.lookAt(f.targetPos.x, 0, f.targetPos.z);

          // Sprint stride animation
          const fCycle = time * 12;
          f.leftLeg.rotation.x = Math.sin(fCycle) * 0.7;
          f.rightLeg.rotation.x = -Math.sin(fCycle) * 0.7;
        } else {
          // Reached ball, pick up & throw
          f.isChasing = false;
          f.leftLeg.rotation.set(0, 0, 0);
          f.rightLeg.rotation.set(0, 0, 0);
        }
      }
    }
  }
}
