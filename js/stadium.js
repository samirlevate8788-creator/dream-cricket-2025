import * as THREE from 'three';

/**
 * DREAM CRICKET 2025 - International 3D Stadium
 * Builds a realistic stadium with:
 * - Radial cut grass outfield
 * - Clay pitch with ICC crease markings
 * - Dynamic breakable wooden stumps & bails
 * - 4 Colossal floodlight towers with spotlights
 * - Double-deck spectator bowl with 3D crowd
 * - Animated LED perimeter boards
 */
export class CricketStadium {
  constructor(scene) {
    this.scene = scene;
    this.stumpsGroupStriker = new THREE.Group();
    this.stumpsGroupNonStriker = new THREE.Group();
    this.bailsStriker = [];
    this.stumpsStriker = [];
    this.ledTexture = null;
    this.ledMaterial = null;

    this.createOutfield();
    this.createPitch();
    this.createWickets();
    this.createFloodlights();
    this.createGrandstands();
    this.createSightScreens();
    this.createAtmosphere();
  }

  // Realistic grass outfield with radial mower pattern
  createOutfield() {
    const radius = 70; // 70 meter international boundary
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Concentric mower rings
    const numRings = 16;
    for (let r = numRings; r > 0; r--) {
      ctx.beginPath();
      ctx.arc(512, 512, (r / numRings) * 512, 0, Math.PI * 2);
      ctx.fillStyle = (r % 2 === 0) ? '#18632c' : '#1e7534';
      ctx.fill();
    }

    // 30-yard fielding circle (dashed line)
    ctx.beginPath();
    ctx.arc(512, 512, (27.4 / radius) * 512, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.lineWidth = 4;
    ctx.setLineDash([12, 10]);
    ctx.stroke();

    const grassTexture = new THREE.CanvasTexture(canvas);
    grassTexture.wrapS = THREE.ClampToEdgeWrapping;
    grassTexture.wrapT = THREE.ClampToEdgeWrapping;

    const outfieldGeo = new THREE.CircleGeometry(radius, 64);
    const outfieldMat = new THREE.MeshStandardMaterial({
      map: grassTexture,
      roughness: 0.9,
      metalness: 0.05
    });

    const outfield = new THREE.Mesh(outfieldGeo, outfieldMat);
    outfield.rotation.x = -Math.PI / 2;
    outfield.receiveShadow = true;
    this.scene.add(outfield);

    // Boundary Rope
    const ropeGeo = new THREE.TorusGeometry(radius - 0.5, 0.25, 8, 80);
    const ropeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
    const rope = new THREE.Mesh(ropeGeo, ropeMat);
    rope.rotation.x = Math.PI / 2;
    rope.position.y = 0.15;
    this.scene.add(rope);

    // Boundary Wedge Cushions
    const wedgeCount = 48;
    for (let i = 0; i < wedgeCount; i++) {
      const angle = (i / wedgeCount) * Math.PI * 2;
      const x = Math.sin(angle) * (radius - 0.5);
      const z = Math.cos(angle) * (radius - 0.5);

      const wedgeGeo = new THREE.BoxGeometry(2.4, 0.45, 0.45);
      const wedgeMat = new THREE.MeshStandardMaterial({
        color: (i % 2 === 0) ? 0x00f0ff : 0xff2a5f,
        roughness: 0.4
      });
      const wedge = new THREE.Mesh(wedgeGeo, wedgeMat);
      wedge.position.set(x, 0.2, z);
      wedge.rotation.y = angle + Math.PI / 2;
      this.scene.add(wedge);
    }
  }

  // 22-Yard Clay Pitch with ICC standard markings
  createPitch() {
    const pitchLength = 20.12; // 22 yards
    const pitchWidth = 3.05;   // 10 feet

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Clay soil base
    ctx.fillStyle = '#b89868';
    ctx.fillRect(0, 0, 512, 1024);

    // Worn grass and central tan footmarks
    const grad = ctx.createLinearGradient(0, 0, 512, 0);
    grad.addColorStop(0, '#226932');
    grad.addColorStop(0.18, '#aa8855');
    grad.addColorStop(0.5, '#c7a974');
    grad.addColorStop(0.82, '#aa8855');
    grad.addColorStop(1, '#226932');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 1024);

    // Subtle pitch cracks & wear
    ctx.fillStyle = 'rgba(90, 65, 35, 0.25)';
    for (let i = 0; i < 40; i++) {
      const px = Math.random() * 400 + 56;
      const py = Math.random() * 900 + 60;
      const pw = Math.random() * 15 + 5;
      const ph = Math.random() * 4 + 2;
      ctx.fillRect(px, py, pw, ph);
    }

    // Crease Markings (Striker and Non-Striker)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;

    // Striker Crease (Bottom)
    // Bowling crease
    ctx.beginPath();
    ctx.moveTo(80, 880);
    ctx.lineTo(432, 880);
    ctx.stroke();

    // Popping crease (Batting line, 1.22m forward)
    ctx.beginPath();
    ctx.moveTo(40, 810);
    ctx.lineTo(472, 810);
    ctx.stroke();

    // Return creases
    ctx.beginPath();
    ctx.moveTo(80, 750);
    ctx.lineTo(80, 930);
    ctx.moveTo(432, 750);
    ctx.lineTo(432, 930);
    ctx.stroke();

    // Non-Striker Crease (Top)
    ctx.beginPath();
    ctx.moveTo(80, 144);
    ctx.lineTo(432, 144);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(40, 214);
    ctx.lineTo(472, 214);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(80, 94);
    ctx.lineTo(80, 274);
    ctx.moveTo(432, 94);
    ctx.lineTo(432, 274);
    ctx.stroke();

    const pitchTexture = new THREE.CanvasTexture(canvas);
    const pitchGeo = new THREE.PlaneGeometry(pitchWidth, pitchLength);
    const pitchMat = new THREE.MeshStandardMaterial({
      map: pitchTexture,
      roughness: 0.85,
      metalness: 0.05
    });

    const pitch = new THREE.Mesh(pitchGeo, pitchMat);
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.y = 0.02; // Sits flush right above outfield
    pitch.receiveShadow = true;
    this.scene.add(pitch);
  }

  // ICC Standard Wickets (3 Stumps + 2 Bails at both ends)
  createWickets() {
    const stumpRadius = 0.022; // 2.2 cm
    const stumpHeight = 0.71;  // 28 inches
    const stumpSpacing = 0.11; // 11 cm between stump centers

    const woodMat = new THREE.MeshStandardMaterial({
      color: 0xdfa052,
      roughness: 0.5,
      metalness: 0.1
    });

    const bailMat = new THREE.MeshStandardMaterial({
      color: 0xedd092,
      roughness: 0.4
    });

    // Helper to generate wicket set
    const buildWicketSet = (zPos, isStriker) => {
      const setGroup = isStriker ? this.stumpsGroupStriker : this.stumpsGroupNonStriker;
      setGroup.position.set(0, 0, zPos);

      const stumps = [];
      const stumpGeo = new THREE.CylinderGeometry(stumpRadius, stumpRadius, stumpHeight, 16);

      // Off, Middle, Leg stumps
      [-stumpSpacing, 0, stumpSpacing].forEach((xOff, idx) => {
        const stump = new THREE.Mesh(stumpGeo, woodMat);
        stump.position.set(xOff, stumpHeight / 2, 0);
        stump.castShadow = true;
        setGroup.add(stump);
        stumps.push(stump);
      });

      // 2 Bails resting on top
      const bailGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.11, 8);
      const bails = [];
      [-stumpSpacing / 2, stumpSpacing / 2].forEach((bx) => {
        const bail = new THREE.Mesh(bailGeo, bailMat);
        bail.rotation.z = Math.PI / 2;
        bail.position.set(bx, stumpHeight + 0.01, 0);
        bail.castShadow = true;
        setGroup.add(bail);
        bails.push(bail);
      });

      this.scene.add(setGroup);

      if (isStriker) {
        this.stumpsStriker = stumps;
        this.bailsStriker = bails;
      }
    };

    // Striker's End (z = 8.5) and Non-Striker's End (z = -8.5)
    buildWicketSet(8.5, true);
    buildWicketSet(-8.5, false);
  }

  // Trigger realistic wicket shatter physics
  shatterStrikerWickets(hitVector = new THREE.Vector3(0, 0, 1)) {
    // Send bails flying into the air
    this.bailsStriker.forEach((bail, i) => {
      bail.userData.isFlying = true;
      bail.userData.vel = new THREE.Vector3(
        (Math.random() - 0.5) * 5 + hitVector.x * 3,
        Math.random() * 7 + 4,
        hitVector.z * 6 + (Math.random() - 0.5) * 4
      );
      bail.userData.rotVel = new THREE.Vector3(
        Math.random() * 15,
        Math.random() * 15,
        Math.random() * 15
      );
    });

    // Tilt or send middle/off stump cartwheeling
    this.stumpsStriker.forEach((stump, i) => {
      stump.userData.isFlying = true;
      stump.userData.vel = new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 3 + 1,
        hitVector.z * 4
      );
      stump.userData.rotVel = new THREE.Vector3(
        (Math.random() - 0.5) * 8,
        0,
        (Math.random() - 0.5) * 8
      );
    });
  }

  // Reset striker wickets back to standing position
  resetStrikerWickets() {
    const stumpSpacing = 0.11;
    const stumpHeight = 0.71;

    this.stumpsStriker.forEach((stump, idx) => {
      stump.userData.isFlying = false;
      stump.position.set([-stumpSpacing, 0, stumpSpacing][idx], stumpHeight / 2, 0);
      stump.rotation.set(0, 0, 0);
    });

    this.bailsStriker.forEach((bail, idx) => {
      bail.userData.isFlying = false;
      bail.position.set([-stumpSpacing / 2, stumpSpacing / 2][idx], stumpHeight + 0.01, 0);
      bail.rotation.set(0, 0, Math.PI / 2);
    });
  }

  // 4 Giant Floodlight Towers with realistic spotlights
  createFloodlights() {
    const towerDist = 78;
    const towerHeight = 38;
    const towerAngles = [
      Math.PI / 4,
      (3 * Math.PI) / 4,
      (5 * Math.PI) / 4,
      (7 * Math.PI) / 4
    ];

    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.7,
      metalness: 0.8
    });

    const lampMat = new THREE.MeshBasicMaterial({
      color: 0xffffff
    });

    towerAngles.forEach((angle, idx) => {
      const tx = Math.sin(angle) * towerDist;
      const tz = Math.cos(angle) * towerDist;

      // Steel Lattice Mast
      const mastGeo = new THREE.CylinderGeometry(0.6, 1.8, towerHeight, 6);
      const mast = new THREE.Mesh(mastGeo, metalMat);
      mast.position.set(tx, towerHeight / 2, tz);
      this.scene.add(mast);

      // Light Head Array (5x4 halogen panel)
      const headGeo = new THREE.BoxGeometry(6, 4, 1);
      const head = new THREE.Mesh(headGeo, metalMat);
      head.position.set(tx, towerHeight, tz);
      head.lookAt(0, 5, 0);
      this.scene.add(head);

      // Emissive bulb grid
      for (let r = -1.5; r <= 1.5; r += 0.8) {
        for (let c = -2.4; c <= 2.4; c += 1.0) {
          const bulb = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.5, 0.2), lampMat);
          bulb.position.set(c, r, 0.55);
          head.add(bulb);
        }
      }

      // Powerful SpotLight aimed at the center pitch
      const spot = new THREE.SpotLight(0xfff8e8, 1.6);
      spot.position.set(tx, towerHeight, tz);
      spot.target.position.set(0, 0, 0);
      spot.angle = Math.PI / 4;
      spot.penumbra = 0.5;
      spot.distance = 160;
      spot.castShadow = (idx === 0 || idx === 2); // Cast shadows from 2 main towers for optimal 60fps performance
      spot.shadow.mapSize.width = 2048;
      spot.shadow.mapSize.height = 2048;
      spot.shadow.camera.near = 10;
      spot.shadow.camera.far = 160;

      this.scene.add(spot);
      this.scene.add(spot.target);
    });

    // Balanced ambient stadium night lighting
    const ambLight = new THREE.AmbientLight(0x243552, 0.9);
    this.scene.add(ambLight);

    // Directional moon/sky fill
    const dirLight = new THREE.DirectionalLight(0x406090, 0.6);
    dirLight.position.set(0, 50, 20);
    this.scene.add(dirLight);
  }

  // Colossal Double-Deck Stadium Grandstands with 3D Crowd
  createGrandstands() {
    const innerRadius = 72;
    const outerRadius = 100;

    // Lower Tier Seating
    const lowerTierGeo = new THREE.RingGeometry(innerRadius, 85, 48, 8);
    const seatMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a5f,
      roughness: 0.8,
      side: THREE.DoubleSide
    });
    const lowerTier = new THREE.Mesh(lowerTierGeo, seatMat);
    lowerTier.rotation.x = -Math.PI / 2.3;
    lowerTier.position.set(0, 6, 0);
    this.scene.add(lowerTier);

    // Upper Tier Seating & Canopy
    const upperTierGeo = new THREE.RingGeometry(85, outerRadius, 48, 8);
    const upperSeatMat = new THREE.MeshStandardMaterial({
      color: 0x0f2342,
      roughness: 0.8,
      side: THREE.DoubleSide
    });
    const upperTier = new THREE.Mesh(upperTierGeo, upperSeatMat);
    upperTier.rotation.x = -Math.PI / 2.2;
    upperTier.position.set(0, 15, 0);
    this.scene.add(upperTier);

    // Roof Canopy
    const roofGeo = new THREE.RingGeometry(80, 105, 48);
    const roofMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.1,
      side: THREE.DoubleSide
    });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.rotation.x = -Math.PI / 2;
    roof.position.set(0, 28, 0);
    this.scene.add(roof);

    // 3D Spectator Crowd Instanced Billboards
    this.createAnimatedCrowd(innerRadius + 3, outerRadius - 2);

    // Animated LED Perimeter Boards encircling the field
    this.createPerimeterLEDs(innerRadius - 1.2);
  }

  // Thousands of crowd spectators waving and cheering
  createAnimatedCrowd(rMin, rMax) {
    const crowdCount = 1200;
    const crowdGeo = new THREE.BoxGeometry(0.7, 1.2, 0.4);

    const colors = [0x00f0ff, 0xffd700, 0xff2a5f, 0xffffff, 0x1e3a8a, 0x10b981];
    const crowdInstanced = new THREE.InstancedMesh(
      crowdGeo,
      new THREE.MeshStandardMaterial({ roughness: 0.7 }),
      crowdCount
    );

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    for (let i = 0; i < crowdCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = rMin + Math.random() * (rMax - rMin);
      const elevation = ((dist - rMin) / (rMax - rMin)) * 18 + 2;

      dummy.position.set(
        Math.sin(angle) * dist,
        elevation,
        Math.cos(angle) * dist
      );
      dummy.lookAt(0, 1, 0);
      dummy.scale.set(0.9 + Math.random() * 0.3, 0.9 + Math.random() * 0.3, 1);
      dummy.updateMatrix();

      crowdInstanced.setMatrixAt(i, dummy.matrix);

      color.setHex(colors[Math.floor(Math.random() * colors.length)]);
      crowdInstanced.setColorAt(i, color);
    }

    this.crowdMesh = crowdInstanced;
    this.scene.add(crowdInstanced);
  }

  // Electronic LED Perimeter Advertising Screen
  createPerimeterLEDs(radius) {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 64;
    this.ledCtx = canvas.getContext('2d');
    this.ledCanvas = canvas;

    this.ledTexture = new THREE.CanvasTexture(canvas);
    this.ledTexture.wrapS = THREE.RepeatWrapping;
    this.ledTexture.repeat.set(24, 1);

    this.ledMaterial = new THREE.MeshBasicMaterial({
      map: this.ledTexture
    });

    const ledGeo = new THREE.CylinderGeometry(radius, radius, 1.1, 80, 1, true);
    const ledMesh = new THREE.Mesh(ledGeo, this.ledMaterial);
    ledMesh.position.y = 0.55;
    this.scene.add(ledMesh);

    this.updateLEDContent(0);
  }

  updateLEDContent(time) {
    if (!this.ledCtx) return;
    const ctx = this.ledCtx;
    ctx.fillStyle = '#050a18';
    ctx.fillRect(0, 0, 1024, 64);

    // Glowing LED animation
    ctx.font = 'bold 36px Rajdhani, sans-serif';
    ctx.fillStyle = '#00f0ff';
    ctx.fillText('⚡ DREAM CRICKET 2025 ⚡', 40, 46);

    ctx.fillStyle = '#ffd700';
    ctx.fillText('SUPER SIX • MAXIMUM POWER', 560, 46);

    this.ledTexture.needsUpdate = true;
    this.ledTexture.offset.x = (time * 0.08) % 1;
  }

  // Sight Screens (behind bowler arm for high batsman visibility)
  createSightScreens() {
    const screenGeo = new THREE.BoxGeometry(10, 4.5, 0.4);
    const screenMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.9
    });

    // North & South sight screens
    [71, -71].forEach((zPos) => {
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.set(0, 2.3, zPos);
      this.scene.add(screen);
    });
  }

  // Atmospheric Dusk/Night Skybox
  createAtmosphere() {
    this.scene.fog = new THREE.FogExp2(0x060c1c, 0.0055);
  }

  // Render loop update (flying bails physics + LED scroll)
  update(dt, time) {
    this.updateLEDContent(time);

    // Animate flying bails and broken stumps when bowled
    const gravity = -9.8;
    [...this.bailsStriker, ...this.stumpsStriker].forEach((piece) => {
      if (piece.userData && piece.userData.isFlying) {
        piece.userData.vel.y += gravity * dt;
        piece.position.x += piece.userData.vel.x * dt;
        piece.position.y += piece.userData.vel.y * dt;
        piece.position.z += piece.userData.vel.z * dt;

        piece.rotation.x += piece.userData.rotVel.x * dt;
        piece.rotation.y += piece.userData.rotVel.y * dt;
        piece.rotation.z += piece.userData.rotVel.z * dt;

        // Bounce on turf
        if (piece.position.y < 0.05) {
          piece.position.y = 0.05;
          piece.userData.vel.y = -piece.userData.vel.y * 0.4;
          piece.userData.vel.x *= 0.6;
          piece.userData.vel.z *= 0.6;
          piece.userData.rotVel.multiplyScalar(0.6);
        }
      }
    });
  }
}
