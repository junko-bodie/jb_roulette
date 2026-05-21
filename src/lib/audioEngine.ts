'use client';

import { Howl, Howler } from 'howler';

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
  private musicEnabled: boolean = true;
  private spinId: number | null = null;
  private activeBackground: 'standard' | 'waiting' | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.sounds = {
        chip: new Howl({
          src: ['/soundreality-pen-click-411629.mp3'],
          volume: 0.45,
          preload: true,
          pool: 10,           // Allow multiple chips to overlap without cutting off
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
          src: ['/sounds/click.mp3'],
          volume: 0.4,
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
          src: ['/sounds/lock.mp3'], 
          volume: 0.6,
          preload: true,
        }),
        thump: new Howl({
          src: ['/sounds/skyscraper_seven-click-buttons-ui-menu-sounds-effects-button-7-203601.mp3'],
          volume: 0.8,
          preload: true,
          onload: () => console.log('AudioEngine: Thump sound loaded'),
          onloaderror: (id, err) => {
            console.warn('AudioEngine: Thump load error:', err);
          },
        }),
        denied: new Howl({
          src: ['/sounds/denied.mp3'], 
          volume: 0.5,
          preload: true,
          onloaderror: (id, err) => console.warn('AudioEngine: Denied sound load error'),
        }),
        placeBets: new Howl({
          src: ['/sounds/placeBets.mp3'],
          volume: 0.8,
          preload: true,
        }),
        background: new Howl({
          src: ['/sounds/background.mp3'],
          volume: 0.2, // background volume
          loop: true,
          preload: true,
        }),
        waitingBackground: new Howl({
          src: ['/sounds/waiting_background.mp3'],
          volume: 0.2, // waiting background volume
          loop: true,
          preload: true,
        }),
      };

      // ── Visibility Guard ──
      // Use Howler's global mute for maximum reliability in the background
      document.addEventListener('visibilitychange', () => {
        if (typeof Howler !== 'undefined') {
          Howler.mute(document.hidden);
        }
        if (document.hidden) {
          this.stopAll();
        } else {
          // Resume appropriate background music when tab becomes visible again
          if (this.activeBackground === 'waiting') {
            this.playWaitingBackgroundMusic();
          } else if (this.activeBackground === 'standard') {
            this.playBackgroundMusic();
          }
        }
      });
    }
  }

  // ── Chip / Tick ────────────────────────────────────────────────────────────

  playChipSound() {
    if (typeof document !== 'undefined' && document.hidden) return;
    if (this.enabled && this.sounds.chip) this.sounds.chip.play();
  }

  playWheelTick() {
    if (typeof document !== 'undefined' && document.hidden) return;
    if (this.enabled && this.sounds.tick) {
      const id = this.sounds.tick.play();
      this.sounds.tick.rate(0.8 + Math.random() * 0.4, id);
    }
  }

  // ── Advanced Betting Sounds ────────────────────────────────────────────────
  
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (!enabled) {
      // Intentionally mapping everything off when 'Sound' is off
      Object.values(this.sounds).forEach(s => {
        if (s !== this.sounds.background) s.stop();
      });
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      this.spinId = null;
    }
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) {
      if (this.sounds.background) {
        this.sounds.background.stop();
      }
      if (this.sounds.waitingBackground) {
        this.sounds.waitingBackground.stop();
      }
    } else {
      if (this.activeBackground === 'waiting') {
        this.playWaitingBackgroundMusic();
      } else {
        this.playBackgroundMusic();
      }
    }
  }

  play2XClick() {
    if (this.enabled && this.sounds.btn2X) this.sounds.btn2X.play();
  }

  playClick() {
    if (typeof document !== 'undefined' && document.hidden) return;
    if (this.enabled && this.sounds.click) this.sounds.click.play();
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
    if (typeof document !== 'undefined' && document.hidden) return;
    console.log('AudioEngine: Playing thump...');
    if (this.enabled && this.sounds.thump) this.sounds.thump.play();
  }

  playRebetSound() {
    if (this.enabled && this.sounds.swoosh) this.sounds.swoosh.play();
  }

  playDeniedSound() {
    if (this.enabled && this.sounds.denied) this.sounds.denied.play();
  }

  playPlaceBetsSound() {
    if (typeof document !== 'undefined' && document.hidden) return;
    if (this.enabled && this.sounds.placeBets) this.sounds.placeBets.play();
  }

  // ── Win / Loss ─────────────────────────────────────────────────────────────

  playWinSound() {
    if (typeof document !== 'undefined' && document.hidden) return;
    if (this.enabled && this.sounds.win) {
      this.sounds.win.stop();   // reset in case it's still playing
      this.sounds.win.play();
    }
  }

  playLossSound() {
    if (typeof document !== 'undefined' && document.hidden) return;
    if (this.enabled && this.sounds.loss) {
      this.sounds.loss.stop();
      this.sounds.loss.play();
    }
  }

  // ── Spin sound (looping, with real-time volume/rate control) ───────────────

  startSpinSound() {
    if (typeof document !== 'undefined' && document.hidden) return;
    
    // Attempt to pause background music if it was playing, so we can resume later
    if (this.musicEnabled && this.sounds.background && this.sounds.background.playing()) {
      this.sounds.background.pause();
    }
    
    if (this.enabled) {
      if (this.sounds.spin) {
        this.sounds.spin.stop();
        this.sounds.spin.volume(0.25);
        this.sounds.spin.rate(1.0);
        this.spinId = this.sounds.spin.play();
      }
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

  // ── Verbal Announcements (Speech Synthesis) ───────────────────────────────

  announce(text: string) {
    if (!this.enabled || typeof window === 'undefined' || !window.speechSynthesis) return;

    // Don't announce if the tab is hidden (prevents queuing/exploding on focus)
    if (document.hidden) return;

    // Interrupt previous announcement if same type or high priority
    if (window.speechSynthesis.speaking) {
       window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = 0.95;
    utterance.rate = 1.0; // Standard speed for clarity
    utterance.pitch = 1.05; // Slightly higher for premium feelminine voice (American or British)
    const voices = window.speechSynthesis.getVoices();
    
    // Priority list of feminine-sounding English voices
    const feminineVoices = voices.filter(v => {
      const name = v.name.toLowerCase();
      const lang = v.lang.toLowerCase();
      const isEnglish = lang.startsWith('en');
      const isFeminine = name.includes('female') || 
                        name.includes('samantha') || 
                        name.includes('victoria') || 
                        name.includes('hazel') || 
                        name.includes('zira') || 
                        name.includes('serena') || 
                        name.includes('susan') ||
                        name.includes('moira');
      return isEnglish && isFeminine;
    });

    // Select British (GB) first for elegance, then American (US), then any English Google voice
    const selectedVoice = feminineVoices.find(v => v.lang.includes('gb')) || 
                         feminineVoices.find(v => v.lang.includes('us')) ||
                         voices.find(v => v.name.includes('Google US English') || (v.name.includes('Google') && v.lang.startsWith('en')));

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    window.speechSynthesis.speak(utterance);
  }

  announceNewLeader(name: string) {
    this.announce(`New leader: ${name}!`);
    this.play2XClick(); // Subtle chime
  }

  announceElimination(name: string) {
    this.announce(`${name} has been eliminated.`);
    this.playLossSound();
  }

  announceMatchFound() {
    this.announce("Match found!");
  }


  // ── Global controls ───────────────────────────────────────────────────────

  playBackgroundMusic() {
    if (typeof document !== 'undefined' && document.hidden) return;
    this.activeBackground = 'standard';
    if (this.sounds.waitingBackground && this.sounds.waitingBackground.playing()) {
      this.sounds.waitingBackground.stop();
    }
    if (this.musicEnabled && this.sounds.background && !this.sounds.background.playing()) {
      this.sounds.background.play();
    }
  }

  stopBackgroundMusic() {
    this.activeBackground = null;
    if (this.sounds.background) {
      this.sounds.background.stop();
    }
  }

  playWaitingBackgroundMusic() {
    if (typeof document !== 'undefined' && document.hidden) return;
    this.activeBackground = 'waiting';
    if (this.sounds.background && this.sounds.background.playing()) {
      this.sounds.background.stop();
    }
    if (this.musicEnabled && this.sounds.waitingBackground && !this.sounds.waitingBackground.playing()) {
      this.sounds.waitingBackground.play();
    }
  }

  stopWaitingBackgroundMusic() {
    this.activeBackground = null;
    if (this.sounds.waitingBackground) {
      this.sounds.waitingBackground.stop();
    }
  }

  stopAll() {
    Object.values(this.sounds).forEach(s => s.stop());
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.spinId = null;
  }

  toggleSound() {
    this.enabled = !this.enabled;
    if (!this.enabled) this.stopAll();
    return this.enabled;
  }
}

export const soundEngine = typeof window !== 'undefined' ? new AudioEngine() : null;
