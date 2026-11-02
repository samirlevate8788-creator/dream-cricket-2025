/**
 * DREAM CRICKET 2025 - High Fidelity Procedural Audio Engine
 * Uses Web Audio API for zero-latency, realistic physics-based acoustics:
 * - English Willow bat-on-ball crack
 * - Stumps clatter & timber flying
 * - Roaring 50,000 crowd ambience & cheers
 * - Ball pitching turf impact
 * - Web Speech API TV commentary
 */

export class CricketAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.crowdNode = null;
    this.crowdGain = null;
    this.speechEnabled = true;
    this.synth = window.speechSynthesis || null;
    this.voices = [];

    // Pre-load speech voices
    if (this.synth) {
      this.synth.onvoiceschanged = () => {
        this.voices = this.synth.getVoices();
      };
    }
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.startCrowdAmbience();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.isMuted = muted;
    if (this.crowdGain) {
      this.crowdGain.gain.setValueAtTime(muted ? 0 : 0.15, this.ctx.currentTime);
    }
    if (muted && this.synth) {
      this.synth.cancel();
    }
  }

  // Realistic English Willow bat crack on leather ball
  playBatCrack(power = 1.0, isSweetSpot = true) {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    // 1. Transient Click (ball leather seam hitting willow)
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(isSweetSpot ? 2400 : 1600, now);
    clickOsc.frequency.exponentialRampToValueAtTime(120, now + 0.03);

    clickGain.gain.setValueAtTime(0.8 * power, now);
    clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    clickOsc.connect(clickGain);
    clickGain.connect(this.ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.05);

    // 2. Willow Body Resonance (Acoustic cavity of 2.7 lb cricket bat)
    const woodOsc = this.ctx.createOscillator();
    const woodFilter = this.ctx.createBiquadFilter();
    const woodGain = this.ctx.createGain();

    woodOsc.type = 'sine';
    woodOsc.frequency.setValueAtTime(isSweetSpot ? 420 : 310, now);
    woodOsc.frequency.exponentialRampToValueAtTime(140, now + 0.18);

    woodFilter.type = 'bandpass';
    woodFilter.frequency.setValueAtTime(isSweetSpot ? 650 : 450, now);
    woodFilter.Q.setValueAtTime(8, now);

    woodGain.gain.setValueAtTime(1.0 * power, now);
    woodGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    woodOsc.connect(woodFilter);
    woodFilter.connect(woodGain);
    woodGain.connect(this.ctx.destination);
    woodOsc.start(now);
    woodOsc.stop(now + 0.25);

    // 3. High-velocity air crack burst (Noise blast)
    const bufferSize = this.ctx.sampleRate * 0.08;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(isSweetSpot ? 1200 : 800, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.6 * power, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    whiteNoise.start(now);
    whiteNoise.stop(now + 0.07);
  }

  // Stumps breaking / timber rattling sound
  playStumpHit() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    // Multiple rapid wooden clicks representing bails and stumps rattling
    const times = [0, 0.02, 0.06, 0.11, 0.17];
    const freqs = [550, 480, 620, 390, 720];

    times.forEach((t, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freqs[idx], now + t);
      osc.frequency.exponentialRampToValueAtTime(180, now + t + 0.08);

      gain.gain.setValueAtTime(0.7 - idx * 0.1, now + t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.1);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(freqs[idx] * 1.5, now + t);
      filter.Q.value = 5;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + t);
      osc.stop(now + t + 0.12);
    });

    this.playCrowdCheer(false, 1.2);
  }

  // Ball pitching on clay pitch turf
  playPitchBounce(speed = 1.0) {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.05);

    gain.gain.setValueAtTime(0.4 * speed, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  // Continuous realistic stadium crowd background roar
  startCrowdAmbience() {
    if (!this.ctx || this.crowdNode) return;

    const bufferSize = this.ctx.sampleRate * 4;
    const buffer = this.ctx.createBuffer(2, bufferSize, this.ctx.sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        // Pink-brown filter approximation
        lastOut = (lastOut * 0.95) + (white * 0.05);
        data[i] = lastOut * 0.7;
      }
    }

    this.crowdNode = this.ctx.createBufferSource();
    this.crowdNode.buffer = buffer;
    this.crowdNode.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 450;
    filter.Q.value = 1.5;

    this.crowdGain = this.ctx.createGain();
    this.crowdGain.gain.value = this.isMuted ? 0 : 0.15;

    this.crowdNode.connect(filter);
    filter.connect(this.crowdGain);
    this.crowdGain.connect(this.ctx.destination);

    this.crowdNode.start();
  }

  // Dynamic crowd cheer when boundary or wicket happens
  playCrowdCheer(isSix = false, intensity = 1.0) {
    if (this.isMuted || !this.ctx || !this.crowdGain) return;
    const now = this.ctx.currentTime;
    const targetGain = (isSix ? 0.65 : 0.45) * intensity;

    // Swell crowd volume
    this.crowdGain.gain.cancelScheduledValues(now);
    this.crowdGain.gain.setValueAtTime(this.crowdGain.gain.value, now);
    this.crowdGain.gain.linearRampToValueAtTime(targetGain, now + 0.2);
    this.crowdGain.gain.exponentialRampToValueAtTime(0.15, now + 3.5);

    // Stadium horn / Vuvuzela cheer effect for big sixes
    if (isSix) {
      this.playStadiumHorn();
    }
  }

  // Stadium celebration horn
  playStadiumHorn() {
    if (this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const freqs = [350, 440, 523];

    freqs.forEach((f) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(f, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1800;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.3);
    });
  }

  // Loud crowd groan when batsman misses or ball beats the edge
  playCrowdGroan() {
    if (this.isMuted || !this.ctx || !this.crowdGain) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(95, now + 0.8);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 350;

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 1.0);
  }

  // Dynamic TV Broadcast Commentary
  speakCommentary(text) {
    if (this.isMuted || !this.speechEnabled || !this.synth) return;
    try {
      this.synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.15;
      utterance.pitch = 1.05;
      utterance.volume = 0.95;

      // Try selecting an English broadcast sounding voice
      if (this.voices.length > 0) {
        const preferred = this.voices.find(v => 
          v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('David') || v.name.includes('Google') || v.name.includes('George'))
        ) || this.voices.find(v => v.lang.startsWith('en'));
        if (preferred) utterance.voice = preferred;
      }

      this.synth.speak(utterance);
    } catch (e) {
      // Graceful fallback if speech synthesis is restricted by browser policy
    }
  }
}
