'use client';

import { Howl } from 'howler';

/**
 * AudioEngine — Manages all game sound effects using Howler.js
 * Uses local sound assets for a premium casino experience.
 *
 * Sound files:
 *   /sounds/spin.mp3  — looping roulette wheel spin
 *   /sounds/win.mp3   — victory fanfare
 *   /sounds/lose.mp3  — loss / bust effect
 */
class AudioEngine {
  private sounds: Record<string, Howl> = {};
  private enabled: boolean = true;
  private spinId: number | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.sounds = {
        chip: new Howl({
          src: ['https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3'],
          volume: 0.3,
        }),
        spin: new Howl({
          src: ['/sounds/spin.mp3'],
          volume: 0.25,
          loop: true,
          preload: true,
        }),
        win: new Howl({
          src: ['/sounds/win.mp3'],
          volume: 0.5,
          preload: true,
        }),
        loss: new Howl({
          src: ['/sounds/lose.mp3'],
          volume: 0.4,
          preload: true,
        }),
        // Advanced betting UI sounds
        click: new Howl({
          src: ['https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'],
          volume: 0.35,
          preload: true,
        }),
        drip: new Howl({
          src: ['https://assets.mixkit.co/active_storage/sfx/2547/2547-preview.mp3'],
          volume: 0.3,
          preload: true,
        }),
        whoosh: new Howl({
          src: ['https://assets.mixkit.co/active_storage/sfx/2548/2548-preview.mp3'],
          volume: 0.4,
          preload: true,
        }),
      };
    }
  }

  // ── Chip / Tick ────────────────────────────────────────────────────────────

  playChipSound() {
    if (this.enabled && this.sounds.chip) this.sounds.chip.play();
  }

  playWheelTick() {
    if (this.enabled && this.sounds.tick) {
      const id = this.sounds.tick.play();
      this.sounds.tick.rate(0.8 + Math.random() * 0.4, id);
    }
  }

  // ── Advanced Betting Sounds ────────────────────────────────────────────────

  play2XSound() {
    if (this.enabled && this.sounds.click) this.sounds.click.play();
  }

  playChipRemoveSound() {
    if (this.enabled && this.sounds.chip) {
      const id = this.sounds.chip.play();
      this.sounds.chip.rate(1.6, id);
    }
  }

  playClearZoneSound() {
    if (this.enabled && this.sounds.whoosh) this.sounds.whoosh.play();
  }

  // ── Win / Loss ─────────────────────────────────────────────────────────────

  playWinSound() {
    if (this.enabled && this.sounds.win) {
      this.sounds.win.stop();   // reset in case it's still playing
      this.sounds.win.play();
    }
  }

  playLossSound() {
    if (this.enabled && this.sounds.loss) {
      this.sounds.loss.stop();
      this.sounds.loss.play();
    }
  }

  // ── Spin sound (looping, with real-time volume/rate control) ───────────────

  startSpinSound() {
    if (this.enabled && this.sounds.spin) {
      this.sounds.spin.stop();
      this.sounds.spin.volume(0.25);
      this.sounds.spin.rate(1.0);
      this.spinId = this.sounds.spin.play();
    }
  }

  /**
   * Dynamically adjust the spinning sound to follow the wheel deceleration.
   * Called every animation frame by RouletteWheel.tsx.
   */
  setSpinEffect(volume: number, rate: number) {
    if (this.sounds.spin && this.sounds.spin.playing()) {
      this.sounds.spin.volume(Math.max(0, Math.min(1, volume)));
      this.sounds.spin.rate(Math.max(0.1, Math.min(2, rate)));
    }
  }

  stopSpinSound() {
    if (this.sounds.spin) {
      this.sounds.spin.stop();
      this.spinId = null;
    }
  }

  // ── Global controls ───────────────────────────────────────────────────────

  stopAll() {
    Object.values(this.sounds).forEach(s => s.stop());
    this.spinId = null;
  }

  toggleSound() {
    this.enabled = !this.enabled;
    if (!this.enabled) this.stopAll();
    return this.enabled;
  }
}

export const soundEngine = typeof window !== 'undefined' ? new AudioEngine() : null;
