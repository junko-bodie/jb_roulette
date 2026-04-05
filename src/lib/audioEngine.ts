'use client';

import { Howl } from 'howler';

/**
 * AudioEngine — Manages all game sound effects using Howler.js
 * Uses royalty-free sound assets for a premium casino experience.
 */
class AudioEngine {
  private sounds: Record<string, Howl> = {};
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      this.sounds = {
        chip: new Howl({
          src: ['https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'], // Casino chip
          volume: 0.3
        }),
        tick: new Howl({
          src: ['https://assets.mixkit.co/active_storage/sfx/500/500-preview.mp3'], // Clean click
          volume: 0.05 // Much softer to avoid "rain" effect
        }),
        win: new Howl({
          src: ['https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3'], // Upbeat win
          volume: 0.5
        }),
        loss: new Howl({
          src: ['https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3'], // Soft loss
          volume: 0.3
        }),
        spin: new Howl({
          src: ['https://assets.mixkit.co/active_storage/sfx/2012/2012-preview.mp3'], // Authentic roulette spin
          volume: 0.2,
          loop: true
        })
      };
    }
  }

  playChipSound() {
    if (this.enabled && this.sounds.chip) this.sounds.chip.play();
  }

  playWheelTick() {
    // Play with slight random pitch to sound more natural/physical
    if (this.enabled && this.sounds.tick) {
      const id = this.sounds.tick.play();
      this.sounds.tick.rate(0.8 + Math.random() * 0.4, id);
    }
  }

  playWinSound() {
    if (this.enabled && this.sounds.win) this.sounds.win.play();
  }

  playLossSound() {
    if (this.enabled && this.sounds.loss) this.sounds.loss.play();
  }

  startSpinSound() {
    if (this.enabled && this.sounds.spin) {
      console.log('AudioEngine: Starting spin sound');
      this.sounds.spin.stop(); 
      this.sounds.spin.volume(0.2);
      this.sounds.spin.play();
    }
  }

  setSpinEffect(volume: number, rate: number) {
    if (this.sounds.spin && this.sounds.spin.playing()) {
      this.sounds.spin.volume(volume);
      this.sounds.spin.rate(rate);
    }
  }

  stopSpinSound() {
    if (this.sounds.spin) {
      console.log('AudioEngine: Stopping spin sound');
      this.sounds.spin.stop();
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    return this.enabled;
  }
}

export const soundEngine = typeof window !== 'undefined' ? new AudioEngine() : null;
