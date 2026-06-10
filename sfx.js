'use strict';

const SFX = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, type, attack, sustain, release, gain = 0.18) {
    const c = getCtx(), o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination);
    o.type = type;
    o.frequency.setValueAtTime(freq, c.currentTime);
    g.gain.setValueAtTime(0, c.currentTime);
    g.gain.linearRampToValueAtTime(gain, c.currentTime + attack);
    g.gain.setValueAtTime(gain, c.currentTime + attack + sustain);
    g.gain.linearRampToValueAtTime(0, c.currentTime + attack + sustain + release);
    o.start(c.currentTime);
    o.stop(c.currentTime + attack + sustain + release + 0.01);
  }

  function seq(notes) {
    const c = getCtx();
    notes.forEach(n => {
      const o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = n.type || 'square';
      const d = n.delay || 0, a = n.attack || 0.01, s = n.sustain || 0.06,
            r = n.release || 0.05, gv = n.gain || 0.15;
      o.frequency.setValueAtTime(n.freq, c.currentTime + d);
      g.gain.setValueAtTime(0, c.currentTime + d);
      g.gain.linearRampToValueAtTime(gv, c.currentTime + d + a);
      g.gain.setValueAtTime(gv, c.currentTime + d + a + s);
      g.gain.linearRampToValueAtTime(0, c.currentTime + d + a + s + r);
      o.start(c.currentTime + d);
      o.stop(c.currentTime + d + a + s + r + 0.02);
    });
  }

  return {
    // Single dart hit
    hit() {
      tone(440, 'square', 0.005, 0.04, 0.06, 0.14);
    },
    // Double — two rising blips
    double() {
      seq([
        { freq: 440, delay: 0,    sustain: 0.04, release: 0.04 },
        { freq: 554, delay: 0.07, sustain: 0.04, release: 0.04 },
      ]);
    },
    // Triple — three rising blips
    triple() {
      seq([
        { freq: 440, delay: 0,    sustain: 0.03, release: 0.03 },
        { freq: 554, delay: 0.07, sustain: 0.03, release: 0.03 },
        { freq: 659, delay: 0.14, sustain: 0.05, release: 0.05 },
      ]);
    },
    // Closing a cricket number — small chord
    close() {
      seq([
        { freq: 523, type: 'square', delay: 0,    sustain: 0.08, release: 0.10, gain: 0.13 },
        { freq: 659, type: 'square', delay: 0,    sustain: 0.08, release: 0.10, gain: 0.10 },
        { freq: 784, type: 'square', delay: 0.05, sustain: 0.10, release: 0.12, gain: 0.12 },
      ]);
    },
    // Scoring overflow points — upward sawtooth sweep
    score() {
      const c = getCtx(), o = c.createOscillator(), g = c.createGain();
      o.connect(g); g.connect(c.destination);
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(330, c.currentTime);
      o.frequency.linearRampToValueAtTime(660, c.currentTime + 0.15);
      g.gain.setValueAtTime(0, c.currentTime);
      g.gain.linearRampToValueAtTime(0.13, c.currentTime + 0.01);
      g.gain.linearRampToValueAtTime(0, c.currentTime + 0.22);
      o.start(c.currentTime); o.stop(c.currentTime + 0.25);
    },
    // Miss
    miss() {
      tone(180, 'sawtooth', 0.005, 0.03, 0.08, 0.12);
    },
    // Dead number (fully closed, no effect)
    dead() {
      tone(220, 'square', 0.005, 0.02, 0.05, 0.07);
    },
    // End of turn / next player
    next() {
      seq([
        { freq: 330, type: 'square', delay: 0,    sustain: 0.03, release: 0.04, gain: 0.12 },
        { freq: 262, type: 'square', delay: 0.07, sustain: 0.05, release: 0.06, gain: 0.10 },
      ]);
    },
    // X01 bust
    bust() {
      seq([
        { freq: 220, type: 'sawtooth', delay: 0,   sustain: 0.05, release: 0.08, gain: 0.15 },
        { freq: 180, type: 'sawtooth', delay: 0.1, sustain: 0.05, release: 0.10, gain: 0.13 },
      ]);
    },
    // X01 checkout (hits zero)
    checkout() {
      seq([
        { freq: 659,  type: 'square', delay: 0,    attack: 0.01, sustain: 0.06, release: 0.05, gain: 0.14 },
        { freq: 784,  type: 'square', delay: 0.10, attack: 0.01, sustain: 0.06, release: 0.05, gain: 0.14 },
        { freq: 880,  type: 'square', delay: 0.20, attack: 0.01, sustain: 0.10, release: 0.08, gain: 0.16 },
      ]);
    },
    // Win fanfare
    win() {
      seq([
        { freq: 523,  type: 'square', delay: 0,    attack: 0.01, sustain: 0.08, release: 0.05, gain: 0.14 },
        { freq: 659,  type: 'square', delay: 0.12, attack: 0.01, sustain: 0.08, release: 0.05, gain: 0.14 },
        { freq: 784,  type: 'square', delay: 0.24, attack: 0.01, sustain: 0.08, release: 0.05, gain: 0.14 },
        { freq: 1046, type: 'square', delay: 0.36, attack: 0.01, sustain: 0.18, release: 0.15, gain: 0.16 },
        { freq: 784,  type: 'square', delay: 0.36, attack: 0.01, sustain: 0.18, release: 0.15, gain: 0.10 },
      ]);
    },
  };
})();
