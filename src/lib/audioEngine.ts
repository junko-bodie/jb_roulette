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
          src: ['https://cdn.pixabay.com/audio/2022/03/15/audio_73130c2537.mp3'], // Quality chip/click
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
          src: ['https://cdn.pixabay.com/audio/2022/03/15/audio_c8c8a73430.mp3'],
          volume: 0.35,
          preload: true,
        }),
        drip: new Howl({
          src: ['https://cdn.pixabay.com/audio/2021/08/04/audio_3430a91176.mp3'],
          volume: 0.3,
          preload: true,
        }),
        whoosh: new Howl({
          src: ['https://cdn.pixabay.com/audio/2022/03/10/audio_c2ed7516d7.mp3'],
          volume: 0.4,
          preload: true,
        }),
        // New specific sounds requested by user
        swoosh: new Howl({
          src: ['/sounds/dheerajakam4jor-swoosh-sound-effect-for-fight-scenes-or-transitions-1-149889.mp3'],
          volume: 0.7,
          preload: true,
        }),
        btnSpin: new Howl({
          src: ['/sounds/skyscraper_seven-click-buttons-ui-menu-sounds-effects-button-7-203601.mp3'],
          volume: 0.7,
          preload: true,
        }),
        btn2X: new Howl({
          src: ['/sounds/universfield-new-notification-026-380249.mp3'],
          volume: 0.7,
          preload: true,
        }),
        lock: new Howl({
          src: ['https://cdn.pixabay.com/audio/2022/03/15/audio_65cf68d067.mp3'], 
          volume: 0.8,
          preload: true,
        }),
        thump: new Howl({
          src: ['/sounds/skyscraper_seven-click-buttons-ui-menu-sounds-effects-button-7-203601.mp3'], // Reliable local file as fallback
          volume: 0.8,
          preload: true,
          onload: () => console.log('AudioEngine: Thump sound loaded'),
          onloaderror: (id, err) => {
            console.error('AudioEngine: Thump load error:', err);
          },
        }),
        denied: new Howl({
          src: ['https://cdn.pixabay.com/audio/2022/03/10/audio_55a2979603.mp3'], 
          volume: 0.5,
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
  
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) this.stopAll();
  }

  play2XClick() {
    if (this.enabled && this.sounds.btn2X) this.sounds.btn2X.play();
  }

  playSwoosh() {
    if (this.enabled && this.sounds.swoosh) this.sounds.swoosh.play();
  }

  playSpinClick() {
    if (this.enabled && this.sounds.btnSpin) this.sounds.btnSpin.play();
  }

  playLockSound() {
    if (this.enabled && this.sounds.lock) this.sounds.lock.play();
  }

  playThump() {
    console.log('AudioEngine: Playing thump...');
    if (this.enabled && this.sounds.thump) this.sounds.thump.play();
  }

  playRebetSound() {
    if (this.enabled && this.sounds.swoosh) this.sounds.swoosh.play();
  }

  playDeniedSound() {
    if (this.enabled && this.sounds.denied) this.sounds.denied.play();
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
