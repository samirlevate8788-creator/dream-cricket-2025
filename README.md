# 🏏 Dream Cricket 2025 - 3D Realistic Cricket Simulator

A next-generation, photorealistic 3D Cricket game built with **Three.js (WebGL)**, **Web Audio API procedural sound engine**, and realistic physics simulation inspired by **Dream Cricket 2025**.

---

## 🌟 Key Features

### 🏟️ 1. International 3D Stadium & Atmosphere
- **Authentic Outfield & Pitch**: Procedural radial-cut lawn turf with grass stripes, 30-yard fielding circle, boundary rope with sponsorship wedge cushions.
- **22-Yard Clay Pitch**: Worn soil strip with official ICC crease markings (popping crease, bowling crease, return creases).
- **Mega Floodlight Towers**: 4 massive 38m steel lattice towers with 5x4 halogen spotlight banks casting realistic stadium spotlights and night shadows.
- **Double-Deck Grandstands**: Realistic spectator seating bowl filled with thousands of animated 3D crowd spectators in team colors.
- **Animated LED Hoardings**: Real-time scrolling electronic advertising banners encircling the perimeter.
- **Dynamic Wickets & Flying Bails**: Real wooden stumps and bails that shatter and cartwheel with parabolic physics upon clean bowled!

### 🏏 2. 3D Athletes & Motion Animations
- **Realistic Batsman**:
  - Full kit: Helmet with steel visor, India blue jersey, white embossed pads, spiked shoes, batting gloves, and English willow bat.
  - Authentic shots:
    - **Cover Drive** (leaning on front foot, flowing stroke through covers)
    - **Straight Drive / Lofted Six** (high elbow straight swing down the ground)
    - **Pull Shot** (backfoot swivel across to deep midwicket)
    - **Square Cut** (backfoot slash piercing point)
    - **Leg Glance** (wrist flick to fine leg)
    - **Defensive Block** (prodding dead bat block)
- **Dynamic Bowler**:
  - 18-meter run-up stride animation, bound stride, high-arm delivery action, and follow-through.
- **Wicketkeeper & 9 Dynamic Fielders**:
  - Fielders stationed across classic positions (Slip, Point, Cover, Mid-off, Mid-on, Deep Midwicket, Square Leg, Fine Leg, Long-on).
  - Dynamic chase AI: Calculates interception trajectory, sprints at 7.5 m/s, retrieves ball and throws back to wickets.

### ⚡ 3. Ball Physics & Delivery Variations
- **Realistic Aerodynamics**: 3D gravity ($g = -9.81\text{ m/s}^2$), air drag, Magnus effect swing, and pitch surface friction.
- **Bowler Variations**:
  - **146 KM/H Fast Outswinger** (curves away to off stump / slips)
  - **142 KM/H Inswinger** (darts into batsman's pads)
  - **140 KM/H Toe-crushing Yorker** (lands at batsman's crease)
  - **148 KM/H Steep Bouncer** (rises chest/helmet high)
  - **Off-Break & Leg-Break Spin** (sharp deviation off pitch surface)
- **Pitch Marker & Hawk-Eye**:
  - Glowing circular pitch landing indicator with color-coded length (Red = Yorker, Orange = Short Bouncer, Cyan = Good Length).

### 🔊 4. High-Fidelity Audio & Commentary Engine
- Zero external MP3/WAV dependencies! Built with zero-latency **Web Audio API** procedural acoustics:
  - English Willow bat-on-leather **CRACK! / THWACK!**
  - Stumps shattering and timber rattling sound
  - Pitch turf bounce impact
  - 50,000 fan stadium crowd ambience, cheers, and vuvuzela horns
  - Loud "HOWZAT?!" appeals and crowd groans
  - Dynamic **TV Broadcast Commentary** powered by speech synthesis

### 🎥 5. Broadcast Camera Modes
- **Batting View**: Over-the-shoulder 3rd-person view (Dream Cricket 2025 default).
- **Broadcast TV Cam**: High grandstand angle from behind bowler.
- **Ball Follow Cam**: Cinematic tracking following maximum Sixes soaring into the night sky.
- **Slow-Mo Orbit Replay**: 360-degree dramatic replay for wickets and milestones.

---

## 🎮 Controls

| Action | Keyboard Key | Touch / Mouse |
| :--- | :--- | :--- |
| **Straight Drive** | `W` or `↑` | Tap `⬆` on Direction Pad |
| **Pull Shot** | `A` or `←` | Tap `↗` on Direction Pad |
| **Cover Drive** | `W` + `D` | Tap `↖` on Direction Pad |
| **Square Cut** | `D` or `→` | Tap `⬅` on Direction Pad |
| **Leg Glance** | `S` or `↓` | Tap `⬇` on Direction Pad |
| **Lofted Shot (Six)** | `Space` or `Shift` | Tap `LOFT` button |
| **Swing Bat** | `Enter` | Tap `SWING` or Click on Screen |
| **Run Between Wickets** | `R` | Tap `RUN` button |
| **Switch Camera** | `C` | Tap `🎥` button |
| **Toggle Sound** | `M` | Tap `🔊` button |

---

## 🚀 How to Run the Game

### Option 1: Instant Quick Launch (Any HTTP Server)
Inside the project directory (`C:\Users\HP\.gemini\antigravity\scratch\dream-cricket-2025`):
```bash
npx serve .
# or
npx vite
```
Then open `http://localhost:3000` or `http://localhost:5173` in any modern web browser (Google Chrome, Microsoft Edge, Brave, etc.).

### Option 2: Direct Browser Launch
Because the game uses modern ES modules and import maps, you can also launch `index.html` directly in any web server or VS Code Live Server!

---

## 🏆 Match Modes
1. **⚡ Super Over Blitz**: Chase 18 runs off 6 deliveries under high-voltage stadium floodlights!
2. **🏏 3-Over T20 Thriller**: Competitive 46-run chase against international fast bowling and spin variations.
3. **🎯 Net Practice Arcade**: Endless batting machine to master timing, sweet spot contacts, and bowling reads.
