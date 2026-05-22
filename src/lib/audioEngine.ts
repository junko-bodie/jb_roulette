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
  private activeBackground: 'standard' | 'waiting' | 'tourney' | null = null;
  private speechQueue: Array<{ type: 'speak' | 'sound'; value: string }> = [];
  private isProcessingQueue: boolean = false;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private activeTimeout: ReturnType<typeof setTimeout> | null = null;
  private isDucked: boolean = false;
  private duckTimeout: ReturnType<typeof setTimeout> | null = null;

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
          volume: 0.25, // background volume
          loop: true,
          preload: true,
        }),
        waitingBackground: new Howl({
          src: ['/sounds/waiting_background.mp3'],
          volume: 0.45, // waiting background volume
          loop: true,
          preload: true,
        }),
        tourneyBackground: new Howl({
          src: ['/sounds/tourney_background.mp3'],
          volume: 0.65,
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
          } else if (this.activeBackground === 'tourney') {
            this.playTourneyBackgroundMusic();
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
      if (this.sounds.tourneyBackground) {
        this.sounds.tourneyBackground.stop();
      }
    } else if (this.activeBackground !== null) {
      // Only resume if a background track was already active (i.e. we're in-game).
      // Never auto-start music on pages that never called play*BackgroundMusic().
      if (this.activeBackground === 'waiting') {
        this.playWaitingBackgroundMusic();
      } else if (this.activeBackground === 'tourney') {
        this.playTourneyBackgroundMusic();
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
    if (this.enabled && this.sounds.placeBets) {
      this.duckBackgroundMusic();
      this.sounds.placeBets.stop(); // Prevent overlap if called twice
      this.sounds.placeBets.play();
      // Unduck after the "place your bets" clip finishes (~1.2s)
      if (this.duckTimeout) clearTimeout(this.duckTimeout);
      this.duckTimeout = setTimeout(() => {
        this.duckTimeout = null;
        this.unduckBackgroundMusic();
      }, 1400);
    }
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

    // Cancel any in-progress speech so it doesn't overlap with the spin
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.speechQueue = [];
    this.isProcessingQueue = false;
    if (this.activeTimeout) {
      clearTimeout(this.activeTimeout);
      this.activeTimeout = null;
    }
    if (this.duckTimeout) {
      clearTimeout(this.duckTimeout);
      this.duckTimeout = null;
    }

    // Pause background music so we can resume after spin
    if (this.musicEnabled && this.sounds.background && this.sounds.background.playing()) {
      this.sounds.background.pause();
    }
    if (this.musicEnabled && this.sounds.tourneyBackground && this.sounds.tourneyBackground.playing()) {
      this.sounds.tourneyBackground.pause();
    }
    this.isDucked = false; // Reset duck state since we're pausing entirely

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

  /**
   * Resume tourney background music after a spin completes.
   * Uses play() from paused state so it continues where it left off.
   */
  resumeTourneyBackgroundMusic() {
    if (typeof document !== 'undefined' && document.hidden) return;
    if (this.activeBackground !== 'tourney') return;
    if (this.musicEnabled && this.sounds.tourneyBackground && !this.sounds.tourneyBackground.playing()) {
      this.sounds.tourneyBackground.play();
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

    this.activeUtterance = new SpeechSynthesisUtterance(text);
    this.activeUtterance.volume = 0.95;
    this.activeUtterance.rate = 1.0; // Standard speed for clarity
    this.activeUtterance.pitch = 1.05; // Slightly higher for premium feelminine voice (American or British)
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
      this.activeUtterance.voice = selectedVoice;
    }

    window.speechSynthesis.speak(this.activeUtterance);
  }

  announceNewLeader(name: string) {
    // Route through the queue system to avoid cancelling any in-progress commentary
    const sequence: Array<{ type: 'speak' | 'sound'; value: string }> = [
      { type: 'sound', value: 'chime' },
      { type: 'speak', value: `New leader, ${name}!` },
    ];
    this.playTournamentCommentary(sequence);
  }

  announceElimination(name: string) {
    this.announce(`${name} has been eliminated.`);
    this.playLossSound();
  }

  processSpeechQueue() {
    if (this.isProcessingQueue || this.speechQueue.length === 0) {
      // ── Queue finished — unduck background music ──
      if (this.speechQueue.length === 0 && !this.isProcessingQueue) {
        this.unduckBackgroundMusic();
      }
      return;
    }
    this.isProcessingQueue = true;

    const item = this.speechQueue.shift();
    if (!item) {
      this.isProcessingQueue = false;
      this.unduckBackgroundMusic();
      return;
    }

    if (item.type === 'sound') {
      let delay = 700;
      if (item.value === 'loss') {
        this.playLossSound();
      } else if (item.value === 'swoosh') {
        this.playSwoosh();
      } else if (item.value === 'chime') {
        this.play2XClick();
        delay = 350; // Chime is very brief, so reduce the wait time
      } else if (item.value === 'placeBets') {
        // Play directly without the duck wrapper since we're already ducked
        if (this.enabled && this.sounds.placeBets) this.sounds.placeBets.play();
        delay = 1200; // Wait for "Place your bets" sound to finish before doing anything else
      }

      if (this.activeTimeout) clearTimeout(this.activeTimeout);
      this.activeTimeout = setTimeout(() => {
        this.activeTimeout = null;
        this.isProcessingQueue = false;
        this.processSpeechQueue();
      }, delay);
    } else {
      if (!this.enabled || typeof window === 'undefined' || !window.speechSynthesis || document.hidden) {
        this.isProcessingQueue = false;
        this.processSpeechQueue();
        return;
      }

      this.activeUtterance = new SpeechSynthesisUtterance(item.value);
      this.activeUtterance.volume = 0.95;
      this.activeUtterance.rate = 1.0;
      this.activeUtterance.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
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

      const selectedVoice = feminineVoices.find(v => v.lang.includes('gb')) ||
        feminineVoices.find(v => v.lang.includes('us')) ||
        voices.find(v => v.name.includes('Google US English') || (v.name.includes('Google') && v.lang.startsWith('en')));

      if (selectedVoice) {
        this.activeUtterance.voice = selectedVoice;
      }

      this.activeUtterance.onend = () => {
        this.activeUtterance = null;
        if (this.activeTimeout) clearTimeout(this.activeTimeout);
        this.activeTimeout = setTimeout(() => {
          this.activeTimeout = null;
          this.isProcessingQueue = false;
          this.processSpeechQueue();
        }, 100); // 100ms breathing room (snappier transition)
      };

      this.activeUtterance.onerror = (e) => {
        console.warn('SpeechSynthesis queue error:', e);
        this.activeUtterance = null;
        this.isProcessingQueue = false;
        this.processSpeechQueue();
      };

      window.speechSynthesis.speak(this.activeUtterance);
    }
  }

  playTournamentCommentary(sequence: Array<{ type: 'speak' | 'sound'; value: string }>) {
    // Cancel any in-progress speech/queue first
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    if (this.activeTimeout) {
      clearTimeout(this.activeTimeout);
      this.activeTimeout = null;
    }
    if (this.duckTimeout) {
      clearTimeout(this.duckTimeout);
      this.duckTimeout = null;
    }

    // Duck background music for the entire commentary sequence
    this.duckBackgroundMusic();

    this.speechQueue = [...sequence];
    this.isProcessingQueue = false;
    this.processSpeechQueue();
  }

  announceRoundEnd(
    eliminatedName: string,
    roundNumber: number,
    isMe: boolean,
    nextRoundNumber: number,
    newLeaderName: string | null = null
  ) {
    // Play the transition/loss sound concurrently so it's immediate
    if (isMe) {
      this.playLossSound();
    } else {
      this.playSwoosh();
    }

    const sequence: Array<{ type: 'speak' | 'sound'; value: string }> = [];

    // 1. Speak "End of Round X. Y has been eliminated." as a continuous phrase
    const elimText = isMe ? 'You have been eliminated.' : `${eliminatedName} has been eliminated.`;
    sequence.push({ type: 'speak', value: `End of Round ${roundNumber}. ${elimText}` });

    // 2. Speak new leader if applicable
    if (newLeaderName) {
      sequence.push({ type: 'sound', value: 'chime' });
      sequence.push({ type: 'speak', value: `New leader, ${newLeaderName}!` });
    }

    // 3. Speak next round start if player is still in the game
    if (!isMe) {
      sequence.push({ type: 'speak', value: `Starting Round ${nextRoundNumber}.` });
    }

    this.playTournamentCommentary(sequence);
  }

  announceMatchFound() {
    const sequence: Array<{ type: 'speak' | 'sound'; value: string }> = [
      { type: 'speak', value: 'Match found!' },
      { type: 'sound', value: 'placeBets' }
    ];
    this.playTournamentCommentary(sequence);
  }


  // ── Global controls ───────────────────────────────────────────────────────

  playBackgroundMusic() {
    if (typeof document !== 'undefined' && document.hidden) return;
    this.activeBackground = 'standard';
    if (this.sounds.waitingBackground && this.sounds.waitingBackground.playing()) {
      this.sounds.waitingBackground.stop();
    }
    if (this.sounds.tourneyBackground && this.sounds.tourneyBackground.playing()) {
      this.sounds.tourneyBackground.stop();
    }
    if (this.musicEnabled && this.sounds.background && !this.sounds.background.playing()) {
      this.sounds.background.play();
    }
  }

  stopBackgroundMusic() {
    if (this.activeBackground === 'standard') {
      this.activeBackground = null;
    }
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
    if (this.sounds.tourneyBackground && this.sounds.tourneyBackground.playing()) {
      this.sounds.tourneyBackground.stop();
    }
    if (this.musicEnabled && this.sounds.waitingBackground && !this.sounds.waitingBackground.playing()) {
      this.sounds.waitingBackground.play();
    }
  }

  stopWaitingBackgroundMusic() {
    if (this.activeBackground === 'waiting') {
      this.activeBackground = null;
    }
    if (this.sounds.waitingBackground) {
      this.sounds.waitingBackground.stop();
    }
  }

  playTourneyBackgroundMusic() {
    if (typeof document !== 'undefined' && document.hidden) return;
    this.activeBackground = 'tourney';
    if (this.sounds.background && this.sounds.background.playing()) {
      this.sounds.background.stop();
    }
    if (this.sounds.waitingBackground && this.sounds.waitingBackground.playing()) {
      this.sounds.waitingBackground.stop();
    }
    if (this.musicEnabled && this.sounds.tourneyBackground && !this.sounds.tourneyBackground.playing()) {
      this.sounds.tourneyBackground.play();
    }
  }

  stopTourneyBackgroundMusic() {
    if (this.activeBackground === 'tourney') {
      this.activeBackground = null;
    }
    if (this.sounds.tourneyBackground) {
      this.sounds.tourneyBackground.stop();
    }
  }

  // ── Background Music Ducking ──────────────────────────────────────────────

  /**
   * Lower background music volume so announcements/sounds are clearly heard.
   */
  duckBackgroundMusic() {
    if (this.isDucked) return;
    this.isDucked = true;
    if (this.sounds.tourneyBackground && this.sounds.tourneyBackground.playing()) {
      this.sounds.tourneyBackground.volume(this.sounds.tourneyBackground.volume() * 0.15);
    }
    if (this.sounds.background && this.sounds.background.playing()) {
      this.sounds.background.volume(this.sounds.background.volume() * 0.15);
    }
  }

  /**
   * Restore background music volume after announcements finish.
   */
  unduckBackgroundMusic() {
    if (!this.isDucked) return;
    this.isDucked = false;
    // Restore to configured volumes
    if (this.sounds.tourneyBackground && this.sounds.tourneyBackground.playing()) {
      this.sounds.tourneyBackground.volume(0.6);
    }
    if (this.sounds.background && this.sounds.background.playing()) {
      this.sounds.background.volume(0.25);
    }
  }

  stopAll() {
    Object.values(this.sounds).forEach(s => s.stop());
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.spinId = null;
    this.isDucked = false;
    if (this.duckTimeout) {
      clearTimeout(this.duckTimeout);
      this.duckTimeout = null;
    }
  }

  toggleSound() {
    this.enabled = !this.enabled;
    if (!this.enabled) this.stopAll();
    return this.enabled;
  }
}

export const soundEngine = typeof window !== 'undefined' ? new AudioEngine() : null;
