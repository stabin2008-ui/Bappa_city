/**
 * ==========================================================================
 * BAPPA'S CITY — A Ganesh Chaturthi Festival Adventure
 * Pure Vanilla JavaScript HTML5 Canvas Game Engine
 * Zero Dependencies | In-Memory State | Web Audio Procedural Synthesizer
 * ==========================================================================
 */

(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. CONSTANTS & CONFIGURATION
  // ---------------------------------------------------------------------------
  const V_WIDTH = 800;
  const V_HEIGHT = 600;
  const HORIZON_Y = 230;
  const ROAD_BOTTOM_Y = 600;
  const ROAD_TOP_W = 90;
  const ROAD_BOTTOM_W = 720;
  const CAMERA_FOV = 220;
  const PLAYER_Z = 50; // Camera distance where player runs
  const GOAL_DISTANCE = 2800; // Target distance to reach Visarjan finale

  const STATES = {
    MENU: 'MENU',
    PLAYING: 'PLAYING',
    EVENT: 'EVENT',
    PAUSED: 'PAUSED',
    GAMEOVER: 'GAMEOVER',
    MISSIONS: 'MISSIONS',
    SHOP: 'SHOP',
    HOWTO: 'HOWTO',
    FINALE: 'FINALE',
    RESULTS: 'RESULTS'
  };

  // ---------------------------------------------------------------------------
  // 2. IN-MEMORY PERSISTENT DATA (Session only, no localStorage)
  // ---------------------------------------------------------------------------
  const SessionData = {
    highScore: 0,
    coins: 150,
    shopUpgrades: {
      shield: 0,      // Level 0-3 (Start with shield / longer duration)
      magnet: 0,      // Level 0-3 (+3s duration per level)
      slowTime: 0,    // Level 0-3 (+3s duration per level)
      doubleScore: 0, // Level 0-3 (+3s duration per level)
      extraLife: 0,   // Level 0-1 (Start with 4 lives instead of 3)
      speedBoost: 0   // Level 0-3 (+2s duration per level)
    },
    missions: [
      { id: 'm1', title: 'Devoted Collector', desc: 'Collect 40 Modaks in a single run', target: 40, current: 0, reward: 100, completed: false, claimed: false },
      { id: 'm2', title: 'Guardian of the Pandal', desc: 'Help people in 2 festival events', target: 2, current: 0, reward: 150, completed: false, claimed: false },
      { id: 'm3', title: 'Sacred Journey', desc: 'Travel at least 1800 meters', target: 1800, current: 0, reward: 200, completed: false, claimed: false },
      { id: 'm4', title: 'Rhythm of the Drums', desc: 'Reach a 4x Combo multiplier', target: 4, current: 0, reward: 120, completed: false, claimed: false },
      { id: 'm5', title: 'Festival Champion', desc: 'Achieve a score of 5,000 points', target: 5000, current: 0, reward: 250, completed: false, claimed: false },
      { id: 'm6', title: 'Sacred Safety', desc: 'Maintain at least 85% Festival Safety', target: 85, current: 0, reward: 180, completed: false, claimed: false },
      { id: 'm7', title: 'Blessing of Ganapati', desc: 'Activate Bappa\'s Blessing once', target: 1, current: 0, reward: 150, completed: false, claimed: false }
    ]
  };

  // ---------------------------------------------------------------------------
  // 3. WEB AUDIO PROCEDURAL SYNTHESIZER
  // ---------------------------------------------------------------------------
  class SoundEngine {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this.bgmTimer = null;
      this.rhythmStep = 0;
    }

    init() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    toggle() {
      this.enabled = !this.enabled;
      if (!this.enabled) {
        this.stopBGM();
      }
      return this.enabled;
    }

    playClick() {
      if (!this.enabled || !this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const t = this.ctx.currentTime;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(1400, t + 0.06);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.08);
      } catch (e) {}
    }

    playModakChime() {
      if (!this.enabled || !this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const notes = [1046.5, 1318.5, 1568.0]; // C6, E6, G6
        const freq = notes[Math.floor(Math.random() * notes.length)];
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.5, t + 0.18);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.28);
      } catch (e) {}
    }

    playCrash() {
      if (!this.enabled || !this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        // Low punch
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(110, t);
        osc.frequency.exponentialRampToValueAtTime(35, t + 0.25);
        gain.gain.setValueAtTime(0.35, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
      } catch (e) {}
    }

    playPowerup() {
      if (!this.enabled || !this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        freqs.forEach((f, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          const st = t + idx * 0.07;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, st);
          gain.gain.setValueAtTime(0.18, st);
          gain.gain.exponentialRampToValueAtTime(0.001, st + 0.2);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(st);
          osc.stop(st + 0.2);
        });
      } catch (e) {}
    }

    playBlessing() {
      if (!this.enabled || !this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        // Triumphant divine chord
        const chord = [392.0, 493.88, 587.33, 783.99]; // G4, B4, D5, G5
        chord.forEach(f => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, t);
          osc.frequency.linearRampToValueAtTime(f * 1.01, t + 1.2);
          gain.gain.setValueAtTime(0.16, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(t);
          osc.stop(t + 1.4);
        });
      } catch (e) {}
    }

    playTempleBell() {
      if (!this.enabled || !this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, t);
        osc.frequency.exponentialRampToValueAtTime(875, t + 1.2);
        gain.gain.setValueAtTime(0.25, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 1.5);
      } catch (e) {}
    }

    playWarningTone() {
      if (!this.enabled || !this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.linearRampToValueAtTime(180, t + 0.3);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.3);
      } catch (e) {}
    }

    playFirework() {
      if (!this.enabled || !this.ctx) return;
      try {
        const t = this.ctx.currentTime;
        // Low boom + pop
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(30, t + 0.4);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.5);

        // Crackle
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(1400, t + 0.15);
        gain2.gain.setValueAtTime(0.12, t + 0.15);
        gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(t + 0.15);
        osc2.stop(t + 0.45);
      } catch (e) {}
    }

    startBGM() {
      if (!this.enabled || this.bgmTimer) return;
      this.rhythmStep = 0;
      this.bgmTimer = setInterval(() => {
        if (!this.enabled || !this.ctx) return;
        try {
          const t = this.ctx.currentTime;
          // Soft Indian Dhol percussion beat: Bass on 0, 4; Tasha tap on 2, 6
          const step = this.rhythmStep % 8;
          if (step === 0 || step === 4) {
            // Bass Dhol
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(step === 0 ? 80 : 70, t);
            osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);
            gain.gain.setValueAtTime(0.14, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.16);
          } else if (step === 2 || step === 6) {
            // Tasha high slap
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(750, t);
            osc.frequency.exponentialRampToValueAtTime(300, t + 0.06);
            gain.gain.setValueAtTime(0.06, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(t);
            osc.stop(t + 0.08);
          }
          this.rhythmStep++;
        } catch (e) {}
      }, 160);
    }

    stopBGM() {
      if (this.bgmTimer) {
        clearInterval(this.bgmTimer);
        this.bgmTimer = null;
      }
    }
  }

  const audio = new SoundEngine();

  // ---------------------------------------------------------------------------
  // 4. PERSPECTIVE PROJECTION MATHEMATICS
  // ---------------------------------------------------------------------------
  function projectZ(z) {
    // Hyperbolic scale factor: scale = CAMERA_FOV / (CAMERA_FOV + z)
    // z is distance ahead of camera (z=0 is at player, z=1000 is horizon)
    const clampedZ = Math.max(0, z);
    return CAMERA_FOV / (CAMERA_FOV + clampedZ);
  }

  function getScreenY(z) {
    const scale = projectZ(z);
    return HORIZON_Y + (ROAD_BOTTOM_Y - HORIZON_Y) * scale;
  }

  function getRoadWidth(z) {
    const scale = projectZ(z);
    return ROAD_TOP_W + (ROAD_BOTTOM_W - ROAD_TOP_W) * scale;
  }

  function getLaneScreenX(lane, z) {
    // lane: -1 (Left), 0 (Center), 1 (Right)
    const scale = projectZ(z);
    const roadW = getRoadWidth(z);
    const laneW = roadW / 3;
    const centerX = V_WIDTH / 2;
    return centerX + lane * laneW;
  }

  // ---------------------------------------------------------------------------
  // 5. GAME ENGINE STATE & ENTITIES
  // ---------------------------------------------------------------------------
  let currentState = STATES.MENU;
  let canvas, ctx;
  let animFrameId = null;
  let lastTime = 0;
  let globalTime = 0;

  // Screen shake
  let screenShake = 0;

  // Active Run State
  let runState = {
    distance: 0,
    score: 0,
    modaks: 0,
    combo: 1,
    comboStreak: 0,
    maxCombo: 1,
    safety: 100, // 0 to 100%
    speed: 380, // z units per second
    blessingMeter: 0, // 0 to 100%
    blessingReady: false,
    blessingActive: false,
    blessingTimer: 0,

    // Reputation dimensions [0, 100]
    devotion: 70,
    cleanliness: 75,
    community: 80,
    speedScore: 65,
    peopleHelped: 0,

    // Active Power-ups: { shield: 0, magnet: 0, slowTime: 0, doubleScore: 0, speedBoost: 0 }
    buffs: {
      shield: 0,
      magnet: 0,
      slowTime: 0,
      doubleScore: 0,
      speedBoost: 0
    },

    // Events triggered milestones
    eventsEncountered: {
      500: false,
      1100: false,
      1700: false,
      2300: false
    },

    spawnTimer: 0,
    obstacleQueue: [],
    modakQueue: [],
    powerupQueue: [],
    particles: [],
    floatingTexts: []
  };

  // Player Object
  const player = {
    lane: 0, // -1: Left, 0: Center, 1: Right
    currentX: 400,
    targetX: 400,
    y: 520,
    width: 50,
    height: 85,
    runCycle: 0,
    invulnerableTimer: 0
  };

  // Finale scene state
  const finaleScene = {
    timer: 0,
    fireworks: [],
    diyas: [],
    idolGlow: 0
  };

  // ---------------------------------------------------------------------------
  // 6. FESTIVAL EVENT DEFINITIONS
  // ---------------------------------------------------------------------------
  const FESTIVAL_EVENTS = [
    {
      dist: 500,
      badge: '🪔',
      title: 'PROCESSION APPROACHING',
      desc: 'A vibrant Ganesh procession with dhol beats is turning onto your street. Devotees are dancing and carrying banners.',
      choices: [
        {
          label: 'Take Alternate Route',
          consequence: '+15% Safety, +10 Devotion',
          action: () => {
            runState.safety = Math.min(100, runState.safety + 15);
            runState.devotion = Math.min(100, runState.devotion + 10);
            runState.score += 250;
            audio.playTempleBell();
          }
        },
        {
          label: 'Wait & Bow Respectfully',
          consequence: '+25 Devotion, +15 Community, +50 🪙',
          action: () => {
            runState.devotion = Math.min(100, runState.devotion + 25);
            runState.community = Math.min(100, runState.community + 15);
            runState.peopleHelped++;
            SessionData.coins += 50;
            runState.score += 300;
            audio.playTempleBell();
          }
        },
        {
          label: 'Squeeze Through Crowd',
          consequence: '-20% Safety, +15 Speed',
          action: () => {
            runState.safety = Math.max(0, runState.safety - 20);
            runState.speedScore = Math.min(100, runState.speedScore + 15);
            runState.score += 150;
            audio.playWarningTone();
          }
        }
      ]
    },
    {
      dist: 1100,
      badge: '🧒',
      title: 'LOST CHILD IN THE PANDAL',
      desc: 'A young child has gotten separated from their family amidst the cheerful crowd and looks worried.',
      choices: [
        {
          label: 'Help Child Find Parents',
          consequence: '+25 Community, +15 Safety, +100 🪙',
          action: () => {
            runState.community = Math.min(100, runState.community + 25);
            runState.safety = Math.min(100, runState.safety + 15);
            runState.peopleHelped++;
            SessionData.coins += 100;
            runState.score += 500;
            audio.playTempleBell();
          }
        },
        {
          label: 'Direct to Police Helpdesk',
          consequence: '+15 Safety, +10 Community, +40 🪙',
          action: () => {
            runState.safety = Math.min(100, runState.safety + 15);
            runState.community = Math.min(100, runState.community + 10);
            runState.peopleHelped++;
            SessionData.coins += 40;
            runState.score += 300;
            audio.playTempleBell();
          }
        },
        {
          label: 'Rush Past to Keep Pace',
          consequence: '-20 Community, -15 Safety',
          action: () => {
            runState.community = Math.max(0, runState.community - 20);
            runState.safety = Math.max(0, runState.safety - 15);
            audio.playWarningTone();
          }
        }
      ]
    },
    {
      dist: 1700,
      badge: '🌺',
      title: 'FALLEN MARIGOLD TORAN',
      desc: 'A sacred flower garland and toran banner have fallen across the pavement. Pedestrians might step on it.',
      choices: [
        {
          label: 'Lift & Re-hang Toran',
          consequence: '+25 Devotion, +25 Cleanliness, +80 🪙',
          action: () => {
            runState.devotion = Math.min(100, runState.devotion + 25);
            runState.cleanliness = Math.min(100, runState.cleanliness + 25);
            SessionData.coins += 80;
            runState.score += 400;
            audio.playTempleBell();
          }
        },
        {
          label: 'Step Carefully Around',
          consequence: '+5% Safety, No penalty',
          action: () => {
            runState.safety = Math.min(100, runState.safety + 5);
            runState.score += 150;
            audio.playTempleBell();
          }
        },
        {
          label: 'Push Past Recklessly',
          consequence: '-25 Devotion, -20 Cleanliness',
          action: () => {
            runState.devotion = Math.max(0, runState.devotion - 25);
            runState.cleanliness = Math.max(0, runState.cleanliness - 20);
            audio.playWarningTone();
          }
        }
      ]
    },
    {
      dist: 2300,
      badge: '💧',
      title: 'WATER SERVICE FOR DEVOTEES',
      desc: 'Thirsty devotees walking in the procession have run out of drinking water near the neighborhood pandal.',
      choices: [
        {
          label: 'Distribute Drinking Water Pots',
          consequence: '+25 Community, +20 Devotion, +100 🪙',
          action: () => {
            runState.community = Math.min(100, runState.community + 25);
            runState.devotion = Math.min(100, runState.devotion + 20);
            runState.peopleHelped++;
            SessionData.coins += 100;
            runState.score += 500;
            audio.playTempleBell();
          }
        },
        {
          label: 'Guide Crowd to Water Tanker',
          consequence: '+15 Cleanliness, +10 Community, +50 🪙',
          action: () => {
            runState.cleanliness = Math.min(100, runState.cleanliness + 15);
            runState.community = Math.min(100, runState.community + 10);
            runState.peopleHelped++;
            SessionData.coins += 50;
            runState.score += 300;
            audio.playTempleBell();
          }
        },
        {
          label: 'Ignore & Sprint Ahead',
          consequence: '-20 Community, +10 Speed',
          action: () => {
            runState.community = Math.max(0, runState.community - 20);
            runState.speedScore = Math.min(100, runState.speedScore + 10);
            audio.playWarningTone();
          }
        }
      ]
    }
  ];

  // ---------------------------------------------------------------------------
  // 7. INITIALIZATION & RESIZING
  // ---------------------------------------------------------------------------
  function initEngine() {
    canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');

    setupEventListeners();
    setupShop();
    renderMissions();
    updateMenuStats();

    // Start in MENU state
    setGameState(STATES.MENU);

    // Initial render & loop kickoff
    lastTime = performance.now();
    if (!animFrameId) {
      animFrameId = requestAnimationFrame(gameLoop);
    }
  }

  // ---------------------------------------------------------------------------
  // 8. STATE MACHINE TRANSITIONS
  // ---------------------------------------------------------------------------
  function setGameState(newState) {
    currentState = newState;

    // Hide all overlay screens
    document.querySelectorAll('.ui-screen').forEach(el => el.classList.add('hidden'));
    const hud = document.getElementById('hud');
    const mobileControls = document.getElementById('mobile-controls');

    switch (newState) {
      case STATES.MENU:
        audio.stopBGM();
        hud.classList.add('hidden');
        document.getElementById('menu-screen').classList.remove('hidden');
        updateMenuStats();
        break;

      case STATES.PLAYING:
        hud.classList.remove('hidden');
        audio.startBGM();
        break;

      case STATES.PAUSED:
        hud.classList.remove('hidden');
        document.getElementById('pause-screen').classList.remove('hidden');
        audio.stopBGM();
        break;

      case STATES.EVENT:
        hud.classList.remove('hidden');
        document.getElementById('event-modal').classList.remove('hidden');
        break;

      case STATES.HOWTO:
        document.getElementById('howto-screen').classList.remove('hidden');
        break;

      case STATES.MISSIONS:
        renderMissions();
        document.getElementById('missions-screen').classList.remove('hidden');
        break;

      case STATES.SHOP:
        renderShop();
        document.getElementById('shop-screen').classList.remove('hidden');
        break;

      case STATES.GAMEOVER:
        audio.stopBGM();
        hud.classList.add('hidden');
        populateGameOverScreen();
        document.getElementById('gameover-screen').classList.remove('hidden');
        break;

      case STATES.FINALE:
        hud.classList.add('hidden');
        initFinaleSequence();
        break;

      case STATES.RESULTS:
        audio.stopBGM();
        hud.classList.add('hidden');
        populateResultsScreen();
        document.getElementById('results-screen').classList.remove('hidden');
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // 9. GAME START / RESTART LOGIC
  // ---------------------------------------------------------------------------
  function startNewRun() {
    audio.init();

    // Reset Player
    player.lane = 0;
    player.currentX = 400;
    player.targetX = 400;
    player.y = 515;
    player.runCycle = 0;
    player.invulnerableTimer = 0;

    // Apply Shop starting upgrades
    const startShield = SessionData.shopUpgrades.shield > 0;

    // Reset Run State
    runState = {
      distance: 0,
      score: 0,
      modaks: 0,
      combo: 1,
      comboStreak: 0,
      maxCombo: 1,
      safety: 100,
      speed: 380,
      blessingMeter: 0,
      blessingReady: false,
      blessingActive: false,
      blessingTimer: 0,

      devotion: 70,
      cleanliness: 75,
      community: 80,
      speedScore: 65,
      peopleHelped: 0,

      buffs: {
        shield: startShield ? 1 : 0,
        magnet: 0,
        slowTime: 0,
        doubleScore: 0,
        speedBoost: 0
      },

      eventsEncountered: {
        500: false,
        1100: false,
        1700: false,
        2300: false
      },

      spawnTimer: 0,
      obstacleQueue: [],
      modakQueue: [],
      powerupQueue: [],
      particles: [],
      floatingTexts: []
    };

    updateHUD();
    setGameState(STATES.PLAYING);
  }

  // ---------------------------------------------------------------------------
  // 10. INPUT HANDLING (Keyboard & Mobile Touch)
  // ---------------------------------------------------------------------------
  function setupEventListeners() {
    // Keyboard Controls
    window.addEventListener('keydown', (e) => {
      if (currentState === STATES.PLAYING) {
        if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
          movePlayer(-1);
          e.preventDefault();
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
          movePlayer(1);
          e.preventDefault();
        } else if (e.key === ' ' || e.code === 'Space') {
          triggerBlessing();
          e.preventDefault();
        } else if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          setGameState(STATES.PAUSED);
          e.preventDefault();
        }
      } else if (currentState === STATES.PAUSED) {
        if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
          setGameState(STATES.PLAYING);
          e.preventDefault();
        }
      } else if (currentState === STATES.FINALE) {
        if (e.key === ' ' || e.key === 'Enter') {
          setGameState(STATES.RESULTS);
          e.preventDefault();
        }
      }
    });

    // Mobile Touch Controls
    const touchLeft = document.getElementById('touch-left');
    const touchRight = document.getElementById('touch-right');
    const touchPower = document.getElementById('touch-power');

    if (touchLeft) {
      touchLeft.addEventListener('touchstart', (e) => {
        e.preventDefault();
        audio.init();
        movePlayer(-1);
        touchLeft.classList.add('active-touch');
      }, { passive: false });
      touchLeft.addEventListener('touchend', () => touchLeft.classList.remove('active-touch'));
      touchLeft.addEventListener('click', () => { audio.init(); movePlayer(-1); });
    }

    if (touchRight) {
      touchRight.addEventListener('touchstart', (e) => {
        e.preventDefault();
        audio.init();
        movePlayer(1);
        touchRight.classList.add('active-touch');
      }, { passive: false });
      touchRight.addEventListener('touchend', () => touchRight.classList.remove('active-touch'));
      touchRight.addEventListener('click', () => { audio.init(); movePlayer(1); });
    }

    if (touchPower) {
      touchPower.addEventListener('touchstart', (e) => {
        e.preventDefault();
        audio.init();
        triggerBlessing();
        touchPower.classList.add('active-touch');
      }, { passive: false });
      touchPower.addEventListener('touchend', () => touchPower.classList.remove('active-touch'));
      touchPower.addEventListener('click', () => { audio.init(); triggerBlessing(); });
    }

    // Top HUD Actions
    const btnSound = document.getElementById('btn-sound-toggle');
    if (btnSound) {
      btnSound.addEventListener('click', () => {
        audio.init();
        const on = audio.toggle();
        btnSound.textContent = on ? '🔊' : '🔇';
      });
    }

    const btnPause = document.getElementById('btn-pause-game');
    if (btnPause) {
      btnPause.addEventListener('click', () => {
        audio.init();
        if (currentState === STATES.PLAYING) {
          setGameState(STATES.PAUSED);
        }
      });
    }

    // Menu Buttons
    document.getElementById('btn-play').addEventListener('click', () => {
      audio.init();
      audio.playClick();
      startNewRun();
    });

    document.getElementById('btn-missions').addEventListener('click', () => {
      audio.init();
      audio.playClick();
      setGameState(STATES.MISSIONS);
    });

    document.getElementById('btn-shop').addEventListener('click', () => {
      audio.init();
      audio.playClick();
      setGameState(STATES.SHOP);
    });

    document.getElementById('btn-howto').addEventListener('click', () => {
      audio.init();
      audio.playClick();
      setGameState(STATES.HOWTO);
    });

    // How to Play Close
    document.getElementById('btn-close-howto').addEventListener('click', () => {
      audio.playClick();
      setGameState(STATES.MENU);
    });
    document.getElementById('btn-howto-back').addEventListener('click', () => {
      audio.playClick();
      setGameState(STATES.MENU);
    });

    // Missions Close
    document.getElementById('btn-close-missions').addEventListener('click', () => {
      audio.playClick();
      setGameState(STATES.MENU);
    });
    document.getElementById('btn-missions-back').addEventListener('click', () => {
      audio.playClick();
      setGameState(STATES.MENU);
    });

    // Shop Close
    document.getElementById('btn-close-shop').addEventListener('click', () => {
      audio.playClick();
      setGameState(STATES.MENU);
    });
    document.getElementById('btn-shop-back').addEventListener('click', () => {
      audio.playClick();
      setGameState(STATES.MENU);
    });

    // Pause Screen Buttons
    document.getElementById('btn-resume').addEventListener('click', () => {
      audio.playClick();
      setGameState(STATES.PLAYING);
    });
    document.getElementById('btn-pause-howto').addEventListener('click', () => {
      audio.playClick();
      setGameState(STATES.HOWTO);
    });
    document.getElementById('btn-restart').addEventListener('click', () => {
      audio.playClick();
      startNewRun();
    });
    document.getElementById('btn-pause-home').addEventListener('click', () => {
      audio.playClick();
      setGameState(STATES.MENU);
    });

    // Game Over Buttons
    document.getElementById('btn-gameover-restart').addEventListener('click', () => {
      audio.playClick();
      startNewRun();
    });
    document.getElementById('btn-gameover-home').addEventListener('click', () => {
      audio.playClick();
      setGameState(STATES.MENU);
    });

    // Results Screen Buttons
    document.getElementById('btn-results-replay').addEventListener('click', () => {
      audio.playClick();
      startNewRun();
    });
    document.getElementById('btn-results-missions').addEventListener('click', () => {
      audio.playClick();
      setGameState(STATES.MISSIONS);
    });
    document.getElementById('btn-results-home').addEventListener('click', () => {
      audio.playClick();
      setGameState(STATES.MENU);
    });

    // Canvas click skip for Finale
    canvas.addEventListener('click', () => {
      audio.init();
      if (currentState === STATES.FINALE) {
        setGameState(STATES.RESULTS);
      }
    });
  }

  function movePlayer(dir) {
    const newLane = player.lane + dir;
    if (newLane >= -1 && newLane <= 1) {
      player.lane = newLane;
      player.targetX = getLaneScreenX(player.lane, PLAYER_Z);
      audio.playClick();
    }
  }

  function triggerBlessing() {
    if (runState.blessingReady && !runState.blessingActive) {
      runState.blessingActive = true;
      runState.blessingReady = false;
      runState.blessingMeter = 0;
      runState.blessingTimer = 10; // 10 seconds of divine power

      // Activate all powers during blessing
      runState.buffs.shield = Math.max(runState.buffs.shield, 1);
      runState.buffs.magnet = Math.max(runState.buffs.magnet, 10);
      runState.buffs.doubleScore = Math.max(runState.buffs.doubleScore, 10);

      // Restore safety
      runState.safety = Math.min(100, runState.safety + 15);
      runState.devotion = Math.min(100, runState.devotion + 15);

      audio.playBlessing();
      spawnFloatingText('BAPPA\'S BLESSING!', player.currentX, player.y - 70, '#00E5FF');

      // Update Mission
      updateMissionProgress('m7', 1);
      updateHUD();
    }
  }

  // ---------------------------------------------------------------------------
  // 11. PROCEDURAL ENTITY SPAWNING
  // ---------------------------------------------------------------------------
  const OBSTACLE_TYPES = ['barricade', 'dhol', 'flowers', 'giftbox', 'rickshaw'];
  const POWERUP_TYPES = ['shield', 'magnet', 'slowTime', 'doubleScore', 'extraLife', 'speedBoost'];

  function spawnWave() {
    // Pick an obstacle lane and safe lane (Ensure at least 1 lane is strictly open!)
    const lanes = [-1, 0, 1];
    const blockedLanesCount = Math.random() < 0.35 ? 2 : 1; // 1 or 2 lanes blocked, never 3!

    // Shuffle lanes
    lanes.sort(() => Math.random() - 0.5);

    for (let i = 0; i < blockedLanesCount; i++) {
      const lane = lanes[i];
      const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
      runState.obstacleQueue.push({
        id: Math.random(),
        lane: lane,
        z: 1000,
        type: type,
        passed: false
      });
    }

    // In the open lane, spawn a line of Modaks or a Power-up!
    const openLane = lanes[blockedLanesCount];
    if (Math.random() < 0.22) {
      // Spawn a Power-up
      const pType = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
      runState.powerupQueue.push({
        id: Math.random(),
        lane: openLane,
        z: 980,
        type: pType
      });
    } else {
      // Spawn 3 sequential Modaks in open lane
      for (let m = 0; m < 3; m++) {
        runState.modakQueue.push({
          id: Math.random(),
          lane: openLane,
          z: 960 + m * 55,
          collected: false
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 12. GAME LOOP & UPDATE
  // ---------------------------------------------------------------------------
  function gameLoop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;
    globalTime += dt;

    if (currentState === STATES.PLAYING) {
      updateGame(dt);
      renderGame();
    } else if (currentState === STATES.MENU) {
      renderMenuAtmosphere(dt);
    } else if (currentState === STATES.FINALE) {
      updateFinale(dt);
      renderFinale();
    }

    animFrameId = requestAnimationFrame(gameLoop);
  }

  function updateGame(dt) {
    // 1. Calculate effective speed
    let currentSpeed = runState.speed;
    if (runState.buffs.slowTime > 0) {
      currentSpeed *= 0.55;
    }
    if (runState.buffs.speedBoost > 0) {
      currentSpeed *= 1.45;
    }

    // Advance distance
    const distDelta = (currentSpeed * dt) * 0.18;
    runState.distance += distDelta;

    // Check Milestones for Festival Events
    for (const milestone in runState.eventsEncountered) {
      const mNum = parseInt(milestone);
      if (!runState.eventsEncountered[milestone] && runState.distance >= mNum) {
        runState.eventsEncountered[milestone] = true;
        triggerFestivalEvent(mNum);
        return; // Pause runner while event displays
      }
    }

    // Check for Visarjan Goal
    if (runState.distance >= GOAL_DISTANCE) {
      setGameState(STATES.FINALE);
      return;
    }

    // 2. Player interpolation & animation
    player.currentX += (player.targetX - player.currentX) * 16 * dt;
    player.runCycle += dt * (currentSpeed * 0.025);
    if (player.invulnerableTimer > 0) {
      player.invulnerableTimer -= dt;
    }

    // 3. Power-up and blessing timers
    if (runState.blessingActive) {
      runState.blessingTimer -= dt;
      if (runState.blessingTimer <= 0) {
        runState.blessingActive = false;
      }
    }

    for (const buff in runState.buffs) {
      if (runState.buffs[buff] > 0) {
        runState.buffs[buff] -= dt;
        if (runState.buffs[buff] < 0) runState.buffs[buff] = 0;
      }
    }

    // 4. Obstacle Spawning
    runState.spawnTimer += dt;
    const spawnInterval = Math.max(1.1, 2.2 - (runState.distance / 3000));
    if (runState.spawnTimer > spawnInterval) {
      runState.spawnTimer = 0;
      spawnWave();
    }

    // 5. Update Obstacles
    for (let i = runState.obstacleQueue.length - 1; i >= 0; i--) {
      const obs = runState.obstacleQueue[i];
      obs.z -= currentSpeed * dt;

      // Check collision
      if (Math.abs(obs.z - PLAYER_Z) < 30 && !obs.passed) {
        const obsScreenX = getLaneScreenX(obs.lane, obs.z);
        // Generous fair collision check
        if (Math.abs(player.currentX - obsScreenX) < 42) {
          obs.passed = true;
          handleObstacleCollision(obs);
        }
      }

      // Cleanup
      if (obs.z < -40) {
        runState.obstacleQueue.splice(i, 1);
      }
    }

    // 6. Update Modaks
    const hasMagnet = runState.buffs.magnet > 0 || runState.blessingActive;
    for (let i = runState.modakQueue.length - 1; i >= 0; i--) {
      const m = runState.modakQueue[i];
      m.z -= currentSpeed * dt;

      // Magnet pull towards player lane if nearby
      if (hasMagnet && m.z < 450 && m.z > 0) {
        const modakX = getLaneScreenX(m.lane, m.z);
        const diffX = player.currentX - modakX;
        // Shift lane towards player
        if (Math.abs(diffX) > 10) {
          m.lane += Math.sign(diffX) * 0.05;
        }
      }

      // Collect check
      if (Math.abs(m.z - PLAYER_Z) < 38 && !m.collected) {
        const mX = getLaneScreenX(m.lane, m.z);
        if (Math.abs(player.currentX - mX) < 46) {
          m.collected = true;
          collectModak(m);
        }
      }

      if (m.z < -30 || m.collected) {
        runState.modakQueue.splice(i, 1);
      }
    }

    // 7. Update Power-ups on Road
    for (let i = runState.powerupQueue.length - 1; i >= 0; i--) {
      const p = runState.powerupQueue[i];
      p.z -= currentSpeed * dt;

      if (Math.abs(p.z - PLAYER_Z) < 38) {
        const pX = getLaneScreenX(p.lane, p.z);
        if (Math.abs(player.currentX - pX) < 46) {
          collectPowerup(p.type);
          runState.powerupQueue.splice(i, 1);
          continue;
        }
      }

      if (p.z < -30) {
        runState.powerupQueue.splice(i, 1);
      }
    }

    // 8. Update Particles & Floating Text
    for (let i = runState.particles.length - 1; i >= 0; i--) {
      const pt = runState.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) runState.particles.splice(i, 1);
    }

    for (let i = runState.floatingTexts.length - 1; i >= 0; i--) {
      const ft = runState.floatingTexts[i];
      ft.y += ft.vy * dt;
      ft.life -= dt;
      if (ft.life <= 0) runState.floatingTexts.splice(i, 1);
    }

    // Screen shake decay
    if (screenShake > 0) {
      screenShake = Math.max(0, screenShake - dt * 25);
    }

    // Continuous distance scoring
    runState.score += Math.floor(distDelta * 0.6 * (runState.buffs.doubleScore > 0 ? 2 : 1));

    // Update Missions progress
    updateMissionProgress('m3', Math.floor(runState.distance));
    updateMissionProgress('m5', runState.score);

    updateHUD();
  }

  // ---------------------------------------------------------------------------
  // 13. COLLISION & COLLECTION LOGIC
  // ---------------------------------------------------------------------------
  function handleObstacleCollision(obs) {
    // If invulnerable or hyper speed, ignore
    if (player.invulnerableTimer > 0 || runState.buffs.speedBoost > 0) {
      return;
    }

    // Check Shield Protection
    if (runState.buffs.shield > 0 || runState.blessingActive) {
      runState.buffs.shield = 0;
      audio.playPowerup();
      spawnParticles(player.currentX, player.y - 30, '#00E5FF', 16);
      spawnFloatingText('SHIELD PROTECTED!', player.currentX, player.y - 60, '#00E5FF');
      player.invulnerableTimer = 1.0;
      return;
    }

    // Direct collision
    audio.playCrash();
    screenShake = 14;
    player.invulnerableTimer = 1.6;

    // Reduce Safety
    runState.safety = Math.max(0, runState.safety - 18);
    runState.combo = 1;
    runState.comboStreak = 0;

    spawnParticles(player.currentX, player.y - 20, '#FF5252', 20);
    spawnFloatingText('-18% SAFETY', player.currentX, player.y - 60, '#FF5252');

    // Check Game Over
    if (runState.safety <= 0) {
      setGameState(STATES.GAMEOVER);
    }
  }

  function collectModak(m) {
    audio.playModakChime();
    runState.modaks++;
    runState.comboStreak++;

    // Calculate Combo
    if (runState.comboStreak >= 30) runState.combo = 5;
    else if (runState.comboStreak >= 20) runState.combo = 4;
    else if (runState.comboStreak >= 10) runState.combo = 3;
    else if (runState.comboStreak >= 4) runState.combo = 2;
    else runState.combo = 1;

    if (runState.combo > runState.maxCombo) {
      runState.maxCombo = runState.combo;
    }

    const points = 100 * runState.combo * (runState.buffs.doubleScore > 0 ? 2 : 1);
    runState.score += points;

    // Blessing Meter Fill (+8.5% per modak)
    if (!runState.blessingActive && !runState.blessingReady) {
      runState.blessingMeter = Math.min(100, runState.blessingMeter + 8.5);
      if (runState.blessingMeter >= 100) {
        runState.blessingReady = true;
        audio.playBlessing();
        spawnFloatingText('BLESSING READY!', player.currentX, player.y - 65, '#FFD54F');
      }
    }

    // Slight safety recovery (+0.5%)
    runState.safety = Math.min(100, runState.safety + 0.5);

    const screenX = getLaneScreenX(m.lane, m.z);
    const screenY = getScreenY(m.z);
    spawnParticles(screenX, screenY, '#FFD54F', 10);
    spawnFloatingText(`+${points}`, screenX, screenY - 20, '#FFE082');

    // Update Missions
    updateMissionProgress('m1', runState.modaks);
    updateMissionProgress('m4', runState.combo);
  }

  function collectPowerup(type) {
    audio.playPowerup();
    const upg = SessionData.shopUpgrades;

    switch (type) {
      case 'shield':
        runState.buffs.shield = 1;
        spawnFloatingText('DIVINE SHIELD!', player.currentX, player.y - 60, '#00E5FF');
        break;
      case 'magnet':
        runState.buffs.magnet = 10 + upg.magnet * 3;
        spawnFloatingText('MODAK MAGNET!', player.currentX, player.y - 60, '#E040FB');
        break;
      case 'slowTime':
        runState.buffs.slowTime = 8 + upg.slowTime * 3;
        spawnFloatingText('SLOW TIME!', player.currentX, player.y - 60, '#FFD54F');
        break;
      case 'doubleScore':
        runState.buffs.doubleScore = 10 + upg.doubleScore * 3;
        spawnFloatingText('2X SCORE!', player.currentX, player.y - 60, '#FF9100');
        break;
      case 'extraLife':
        runState.safety = Math.min(100, runState.safety + 25);
        spawnFloatingText('+25% SAFETY!', player.currentX, player.y - 60, '#00E676');
        break;
      case 'speedBoost':
        runState.buffs.speedBoost = 5 + upg.speedBoost * 2;
        player.invulnerableTimer = 5 + upg.speedBoost * 2;
        spawnFloatingText('HYPER SPRINT!', player.currentX, player.y - 60, '#FF3D00');
        break;
    }

    spawnParticles(player.currentX, player.y - 30, '#FFD54F', 18);
  }

  function triggerFestivalEvent(milestone) {
    const ev = FESTIVAL_EVENTS.find(e => e.dist === milestone);
    if (!ev) return;

    setGameState(STATES.EVENT);
    audio.playTempleBell();

    document.getElementById('event-badge-icon').textContent = ev.badge;
    document.getElementById('event-title').textContent = ev.title;
    document.getElementById('event-desc').textContent = ev.desc;

    const choicesContainer = document.getElementById('event-choices-container');
    choicesContainer.innerHTML = '';

    ev.choices.forEach(ch => {
      const btn = document.createElement('button');
      btn.className = 'event-choice-btn';
      btn.innerHTML = `
        <span class="event-choice-label">${ch.label}</span>
        <span class="event-choice-consequence">${ch.consequence}</span>
      `;
      btn.addEventListener('click', () => {
        ch.action();
        updateMissionProgress('m2', runState.peopleHelped);
        setGameState(STATES.PLAYING);
      });
      choicesContainer.appendChild(btn);
    });
  }

  function spawnParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      runState.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        radius: 2 + Math.random() * 3,
        life: 0.5 + Math.random() * 0.4
      });
    }
  }

  function spawnFloatingText(text, x, y, color) {
    runState.floatingTexts.push({
      text: text,
      x: x,
      y: y,
      vy: -45,
      color: color,
      life: 0.9
    });
  }

  // ---------------------------------------------------------------------------
  // 14. PROCEDURAL CANVAS RENDERING
  // ---------------------------------------------------------------------------
  function renderGame() {
    ctx.save();

    // Apply Screen Shake
    if (screenShake > 0) {
      const dx = (Math.random() - 0.5) * screenShake;
      const dy = (Math.random() - 0.5) * screenShake;
      ctx.translate(dx, dy);
    }

    // 1. Sky & Atmosphere
    renderAtmosphere(runState.distance);

    // 2. Horizon Temples & Festive City Skyline
    renderSkyline(runState.distance);

    // 3. Perspective Road, Sidewalks & Crowd
    renderRoadAndSidewalks(runState.distance);

    // 4. Overhead Torans & Garlands
    renderOverheadTorans(runState.distance);

    // 5. Entities Sorted by Depth (Z)
    renderDepthEntities();

    // 6. Player Character
    renderPlayer();

    // 7. Particles & Floating Text
    renderParticles();
    renderFloatingTexts();

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // 14A. ATMOSPHERE & TIME-OF-DAY CYCLE
  // ---------------------------------------------------------------------------
  function renderAtmosphere(dist) {
    // Morning (0-600) -> Sunset (600-1400) -> Evening (1400-2200) -> Night (2200+)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, HORIZON_Y);

    if (dist < 600) {
      // Morning
      skyGrad.addColorStop(0, '#3A7BD5');
      skyGrad.addColorStop(0.65, '#FEE140');
      skyGrad.addColorStop(1, '#FFB300');
    } else if (dist < 1400) {
      // Sunset
      skyGrad.addColorStop(0, '#8E2DE2');
      skyGrad.addColorStop(0.45, '#F000FF');
      skyGrad.addColorStop(0.75, '#FF512F');
      skyGrad.addColorStop(1, '#F09819');
    } else if (dist < 2200) {
      // Evening
      skyGrad.addColorStop(0, '#0F2027');
      skyGrad.addColorStop(0.6, '#203A43');
      skyGrad.addColorStop(0.85, '#4B134F');
      skyGrad.addColorStop(1, '#C94B4B');
    } else {
      // Night / Finale
      skyGrad.addColorStop(0, '#050813');
      skyGrad.addColorStop(0.6, '#0B132B');
      skyGrad.addColorStop(0.9, '#1C2541');
      skyGrad.addColorStop(1, '#3A2E39');
    }

    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, V_WIDTH, HORIZON_Y);

    // Celestial Bodies
    if (dist >= 1400) {
      // Crescent Moon & Twinkling Stars
      ctx.fillStyle = '#FFF8E1';
      ctx.beginPath();
      ctx.arc(680, 70, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = dist < 2200 ? '#203A43' : '#0B132B';
      ctx.beginPath();
      ctx.arc(672, 66, 19, 0, Math.PI * 2);
      ctx.fill();

      // Stars
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      for (let s = 0; s < 25; s++) {
        const sx = (s * 37 + 15) % V_WIDTH;
        const sy = (s * 19 + 10) % (HORIZON_Y - 40);
        const r = (s % 3 === 0) ? 1.5 : 1;
        ctx.fillRect(sx, sy, r, r);
      }
    } else {
      // Morning / Sunset Sun
      const sunGrad = ctx.createRadialGradient(400, HORIZON_Y - 20, 10, 400, HORIZON_Y - 20, 80);
      sunGrad.addColorStop(0, 'rgba(255, 235, 59, 0.9)');
      sunGrad.addColorStop(0.5, 'rgba(255, 152, 0, 0.4)');
      sunGrad.addColorStop(1, 'rgba(255, 87, 34, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(400, HORIZON_Y - 20, 80, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---------------------------------------------------------------------------
  // 14B. SKYLINE & HORIZON TEMPLES
  // ---------------------------------------------------------------------------
  function renderSkyline(dist) {
    const isNight = dist >= 1400;
    ctx.fillStyle = isNight ? '#070C18' : '#3E2723';

    // Stylized Temple Shikharas (spires) along the horizon
    const temples = [
      { x: 40, w: 60, h: 45 },
      { x: 120, w: 40, h: 65 },
      { x: 220, w: 80, h: 50 },
      { x: 500, w: 75, h: 55 },
      { x: 620, w: 45, h: 70 },
      { x: 710, w: 55, h: 40 }
    ];

    temples.forEach(t => {
      // Base
      ctx.fillRect(t.x, HORIZON_Y - t.h, t.w, t.h);
      // Conical Shikhara
      ctx.beginPath();
      ctx.moveTo(t.x, HORIZON_Y - t.h);
      ctx.lineTo(t.x + t.w / 2, HORIZON_Y - t.h - 30);
      ctx.lineTo(t.x + t.w, HORIZON_Y - t.h);
      ctx.fill();
      // Kalash / Flag
      ctx.fillStyle = '#FF9933';
      ctx.fillRect(t.x + t.w / 2 - 1, HORIZON_Y - t.h - 38, 2, 8);
      ctx.beginPath();
      ctx.moveTo(t.x + t.w / 2 + 1, HORIZON_Y - t.h - 38);
      ctx.lineTo(t.x + t.w / 2 + 10, HORIZON_Y - t.h - 34);
      ctx.lineTo(t.x + t.w / 2 + 1, HORIZON_Y - t.h - 30);
      ctx.fill();
      ctx.fillStyle = isNight ? '#070C18' : '#3E2723';
    });
  }

  // ---------------------------------------------------------------------------
  // 14C. ROAD, SIDEWALKS & FESTIVAL STREET LAMPS
  // ---------------------------------------------------------------------------
  function renderRoadAndSidewalks(dist) {
    // 1. Sidewalk Ground
    const groundGrad = ctx.createLinearGradient(0, HORIZON_Y, 0, ROAD_BOTTOM_Y);
    groundGrad.addColorStop(0, '#1a1f2c');
    groundGrad.addColorStop(1, '#0e121a');
    ctx.fillStyle = groundGrad;
    ctx.fillRect(0, HORIZON_Y, V_WIDTH, ROAD_BOTTOM_Y - HORIZON_Y);

    // 2. Asphalt Road Surface
    const topW = ROAD_TOP_W;
    const botW = ROAD_BOTTOM_W;
    const cx = V_WIDTH / 2;

    ctx.fillStyle = '#21252b';
    ctx.beginPath();
    ctx.moveTo(cx - topW / 2, HORIZON_Y);
    ctx.lineTo(cx + topW / 2, HORIZON_Y);
    ctx.lineTo(cx + botW / 2, ROAD_BOTTOM_Y);
    ctx.lineTo(cx - botW / 2, ROAD_BOTTOM_Y);
    ctx.closePath();
    ctx.fill();

    // 3. Road Curb Borders (Festive Yellow/Black Curbing)
    ctx.strokeStyle = '#FFB300';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx - topW / 2, HORIZON_Y);
    ctx.lineTo(cx - botW / 2, ROAD_BOTTOM_Y);
    ctx.moveTo(cx + topW / 2, HORIZON_Y);
    ctx.lineTo(cx + botW / 2, ROAD_BOTTOM_Y);
    ctx.stroke();

    // 4. Moving Lane Dashes
    const roadScroll = (dist * 1.8) % 80;
    ctx.strokeStyle = 'rgba(255, 213, 79, 0.6)';
    ctx.lineWidth = 2;

    // Draw lane dividing lines at -1/3 and +1/3 width
    for (let z = 20; z < 900; z += 70) {
      const zEff = z - roadScroll;
      if (zEff <= 0 || zEff > 900) continue;
      const y1 = getScreenY(zEff);
      const y2 = getScreenY(zEff + 35);
      const roadW1 = getRoadWidth(zEff);
      const roadW2 = getRoadWidth(zEff + 35);

      // Left lane dash
      ctx.beginPath();
      ctx.moveTo(cx - roadW1 / 6, y1);
      ctx.lineTo(cx - roadW2 / 6, y2);
      ctx.stroke();

      // Right lane dash
      ctx.beginPath();
      ctx.moveTo(cx + roadW1 / 6, y1);
      ctx.lineTo(cx + roadW2 / 6, y2);
      ctx.stroke();
    }

    // 5. Street Lamps & Diyas along sidewalk
    const isNight = dist >= 1400;
    for (let z = 80; z < 800; z += 180) {
      const zEff = (z - (dist * 1.5) % 180 + 180) % 800;
      if (zEff < 30) continue;

      const scale = projectZ(zEff);
      const roadW = getRoadWidth(zEff);
      const y = getScreenY(zEff);

      // Left & Right Sidewalk Lamps
      [-1, 1].forEach(side => {
        const lx = cx + side * (roadW / 2 + 25 * scale);
        const lampH = 90 * scale;

        // Pole
        ctx.strokeStyle = '#37474F';
        ctx.lineWidth = Math.max(1.5, 3 * scale);
        ctx.beginPath();
        ctx.moveTo(lx, y);
        ctx.lineTo(lx, y - lampH);
        ctx.lineTo(lx - side * 15 * scale, y - lampH);
        ctx.stroke();

        // Lantern / Diya Glow
        if (isNight) {
          const glowGrad = ctx.createRadialGradient(
            lx - side * 15 * scale, y - lampH, 2,
            lx - side * 15 * scale, y - lampH, 30 * scale
          );
          glowGrad.addColorStop(0, 'rgba(255, 179, 0, 0.9)');
          glowGrad.addColorStop(0.5, 'rgba(255, 111, 0, 0.35)');
          glowGrad.addColorStop(1, 'rgba(255, 111, 0, 0)');
          ctx.fillStyle = glowGrad;
          ctx.beginPath();
          ctx.arc(lx - side * 15 * scale, y - lampH, 30 * scale, 0, Math.PI * 2);
          ctx.fill();
        }

        // Lantern bulb
        ctx.fillStyle = isNight ? '#FFF59D' : '#CFD8DC';
        ctx.beginPath();
        ctx.arc(lx - side * 15 * scale, y - lampH, Math.max(2, 5 * scale), 0, Math.PI * 2);
        ctx.fill();
      });
    }
  }

  // ---------------------------------------------------------------------------
  // 14D. OVERHEAD FESTIVE TORANS (MARIGOLD GARLANDS)
  // ---------------------------------------------------------------------------
  function renderOverheadTorans(dist) {
    const cx = V_WIDTH / 2;
    for (let z = 120; z < 900; z += 300) {
      const zEff = (z - (dist * 1.5) % 300 + 300) % 900;
      if (zEff < 40) continue;

      const scale = projectZ(zEff);
      const roadW = getRoadWidth(zEff);
      const y = getScreenY(zEff) - 85 * scale;
      const leftX = cx - roadW / 2 - 15 * scale;
      const rightX = cx + roadW / 2 + 15 * scale;

      // Swag cable
      ctx.strokeStyle = '#D84315';
      ctx.lineWidth = Math.max(1, 2 * scale);
      ctx.beginPath();
      ctx.moveTo(leftX, y);
      ctx.quadraticCurveTo(cx, y + 25 * scale, rightX, y);
      ctx.stroke();

      // Hanging marigold flowers & pennants
      const flags = 7;
      for (let f = 0; f <= flags; f++) {
        const t = f / flags;
        const fx = leftX + (rightX - leftX) * t;
        const fy = y + 25 * scale * (4 * t * (1 - t));

        // Marigold flower ball
        ctx.fillStyle = (f % 2 === 0) ? '#FF8F00' : '#FFD54F';
        ctx.beginPath();
        ctx.arc(fx, fy + 4 * scale, Math.max(1.5, 4 * scale), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // 14E. ENTITIES SORTED BY DEPTH
  // ---------------------------------------------------------------------------
  function renderDepthEntities() {
    // Collect all active objects (obstacles, modaks, power-ups)
    const renderList = [];

    runState.obstacleQueue.forEach(obs => {
      renderList.push({ type: 'obstacle', data: obs, z: obs.z });
    });

    runState.modakQueue.forEach(m => {
      renderList.push({ type: 'modak', data: m, z: m.z });
    });

    runState.powerupQueue.forEach(p => {
      renderList.push({ type: 'powerup', data: p, z: p.z });
    });

    // Sort descending by Z so farthest render first
    renderList.sort((a, b) => b.z - a.z);

    renderList.forEach(item => {
      if (item.type === 'obstacle') {
        renderSingleObstacle(item.data);
      } else if (item.type === 'modak') {
        renderSingleModak(item.data);
      } else if (item.type === 'powerup') {
        renderSinglePowerup(item.data);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // 14F. PROCEDURAL OBSTACLES ART
  // ---------------------------------------------------------------------------
  function renderSingleObstacle(obs) {
    const scale = projectZ(obs.z);
    const x = getLaneScreenX(obs.lane, obs.z);
    const y = getScreenY(obs.z);

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    switch (obs.type) {
      case 'barricade':
        // Wooden / Metal police barricade
        ctx.fillStyle = '#D32F2F';
        ctx.fillRect(-36, -42, 72, 38);

        // Reflective stripes
        ctx.fillStyle = '#FFF';
        for (let i = -30; i < 30; i += 16) {
          ctx.beginPath();
          ctx.moveTo(i, -42);
          ctx.lineTo(i + 8, -42);
          ctx.lineTo(i, -10);
          ctx.lineTo(i - 8, -10);
          ctx.fill();
        }

        // Frame posts & legs
        ctx.fillStyle = '#263238';
        ctx.fillRect(-38, -45, 6, 45);
        ctx.fillRect(32, -45, 6, 45);
        ctx.fillRect(-42, -4, 14, 4);
        ctx.fillRect(28, -4, 14, 4);

        // Blinking amber warning light
        const blink = Math.floor(globalTime * 6) % 2 === 0;
        ctx.fillStyle = blink ? '#FFEA00' : '#FF8F00';
        ctx.beginPath();
        ctx.arc(0, -46, 6, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'dhol':
        // Large traditional Dhol Drum on stand
        // Crossed stand
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-22, 0); ctx.lineTo(22, -35);
        ctx.moveTo(22, 0); ctx.lineTo(-22, -35);
        ctx.stroke();

        // Drum barrel
        ctx.fillStyle = '#8D6E63';
        ctx.beginPath();
        ctx.ellipse(0, -28, 30, 18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Drum heads & decorative ropes
        ctx.fillStyle = '#FFF8E1';
        ctx.beginPath();
        ctx.ellipse(-26, -28, 5, 16, 0, 0, Math.PI * 2);
        ctx.ellipse(26, -28, 5, 16, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#FF9800';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-24, -40); ctx.lineTo(0, -14); ctx.lineTo(24, -40);
        ctx.moveTo(-24, -16); ctx.lineTo(0, -42); ctx.lineTo(24, -16);
        ctx.stroke();
        break;

      case 'flowers':
        // Wooden Crates of Marigolds
        ctx.fillStyle = '#795548';
        ctx.fillRect(-28, -26, 56, 26);
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(-28, -14, 56, 3);

        // Heaping Marigold Flowers
        for (let fx = -22; fx <= 22; fx += 11) {
          ctx.fillStyle = (Math.abs(fx) % 2 === 0) ? '#FF8F00' : '#FFD54F';
          ctx.beginPath();
          ctx.arc(fx, -28, 7, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#E65100';
        ctx.beginPath();
        ctx.arc(0, -35, 9, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'giftbox':
        // Stack of festive gift and prasad hampers
        ctx.fillStyle = '#C2185B';
        ctx.fillRect(-24, -28, 48, 28);
        ctx.fillStyle = '#FFD54F';
        ctx.fillRect(-4, -28, 8, 28);
        ctx.fillRect(-24, -16, 48, 6);

        // Top smaller box
        ctx.fillStyle = '#00897B';
        ctx.fillRect(-16, -46, 32, 18);
        ctx.fillStyle = '#FFD54F';
        ctx.fillRect(-3, -46, 6, 18);
        break;

      case 'rickshaw':
        // Festive Auto-Rickshaw back view
        // Yellow top
        ctx.fillStyle = '#FDD835';
        ctx.beginPath();
        ctx.roundRect(-28, -52, 56, 24, 6);
        ctx.fill();
        // Green bottom
        ctx.fillStyle = '#2E7D32';
        ctx.fillRect(-28, -28, 56, 26);
        // Back window
        ctx.fillStyle = '#263238';
        ctx.fillRect(-20, -46, 40, 14);
        // Tail lights
        ctx.fillStyle = '#D50000';
        ctx.fillRect(-26, -14, 8, 6);
        ctx.fillRect(18, -14, 8, 6);
        // Marigold garland across back
        ctx.fillStyle = '#FF8F00';
        for (let gx = -22; gx <= 22; gx += 8) {
          ctx.beginPath();
          ctx.arc(gx, -27, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
    }

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // 14G. PROCEDURAL MODAK SWEET DUMPLING
  // ---------------------------------------------------------------------------
  function renderSingleModak(m) {
    const scale = projectZ(m.z);
    const x = getLaneScreenX(m.lane, m.z);
    const y = getScreenY(m.z) - Math.sin(globalTime * 6 + m.id) * 6 * scale;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Warm radial aura
    const aura = ctx.createRadialGradient(0, -18, 4, 0, -18, 28);
    aura.addColorStop(0, 'rgba(255, 213, 79, 0.85)');
    aura.addColorStop(0.5, 'rgba(255, 143, 0, 0.4)');
    aura.addColorStop(1, 'rgba(255, 143, 0, 0)');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(0, -18, 28, 0, Math.PI * 2);
    ctx.fill();

    // Modak sweet dumpling body (fluted teardrop cone)
    ctx.fillStyle = '#FFF8E1';
    ctx.beginPath();
    ctx.moveTo(0, -36); // Pointed top spire
    ctx.bezierCurveTo(18, -20, 22, -2, 0, 0); // Right curved belly
    ctx.bezierCurveTo(-22, -2, -18, -20, 0, -36); // Left curved belly
    ctx.fill();

    // Saffron pleats / ridges
    ctx.strokeStyle = '#FFA000';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, -36); ctx.quadraticCurveTo(8, -18, 8, 0);
    ctx.moveTo(0, -36); ctx.quadraticCurveTo(-8, -18, -8, 0);
    ctx.moveTo(0, -36); ctx.lineTo(0, 0);
    ctx.stroke();

    // Golden tip drop
    ctx.fillStyle = '#FF8F00';
    ctx.beginPath();
    ctx.arc(0, -35, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // 14H. PROCEDURAL POWER-UP ORBS
  // ---------------------------------------------------------------------------
  function renderSinglePowerup(p) {
    const scale = projectZ(p.z);
    const x = getLaneScreenX(p.lane, p.z);
    const y = getScreenY(p.z) - 20 * scale;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // Glowing outer orb
    let color = '#FFD54F';
    let icon = '⚡';
    switch (p.type) {
      case 'shield': color = '#00E5FF'; icon = '🛡️'; break;
      case 'magnet': color = '#E040FB'; icon = '🧲'; break;
      case 'slowTime': color = '#FFD54F'; icon = '⏳'; break;
      case 'doubleScore': color = '#FF9100'; icon = '2X'; break;
      case 'extraLife': color = '#00E676'; icon = '❤️'; break;
      case 'speedBoost': color = '#FF3D00'; icon = '🚀'; break;
    }

    const glow = ctx.createRadialGradient(0, 0, 6, 0, 0, 24);
    glow.addColorStop(0, color);
    glow.addColorStop(0.7, 'rgba(20, 30, 50, 0.85)');
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Icon text
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFF';
    ctx.fillText(icon, 0, 0);

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // 14I. PROCEDURAL PLAYER CHARACTER (RUNNER)
  // ---------------------------------------------------------------------------
  function renderPlayer() {
    ctx.save();

    // Invulnerability flashing
    if (player.invulnerableTimer > 0 && Math.floor(globalTime * 12) % 2 === 0) {
      ctx.restore();
      return;
    }

    ctx.translate(player.currentX, player.y);

    // Bappa's Blessing Divine Aura
    if (runState.blessingActive) {
      const auraGrad = ctx.createRadialGradient(0, -45, 10, 0, -45, 75);
      auraGrad.addColorStop(0, 'rgba(255, 213, 79, 0.75)');
      auraGrad.addColorStop(0.5, 'rgba(0, 229, 255, 0.45)');
      auraGrad.addColorStop(1, 'rgba(0, 229, 255, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(0, -45, 75, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shield Barrier Bubble
    if (runState.buffs.shield > 0) {
      ctx.strokeStyle = '#00E5FF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -45, 52, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(0, 229, 255, 0.15)';
      ctx.fill();
    }

    // 1. Drop Shadow under feet
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Running cycle calculations
    const stride = Math.sin(player.runCycle);
    const legOffset1 = stride * 14;
    const legOffset2 = -stride * 14;
    const armSwing = Math.cos(player.runCycle) * 12;

    // 2. Legs & Shoes
    // Left Leg
    ctx.fillStyle = '#FFA000'; // Festive Dhoti folds
    ctx.fillRect(-14, -28, 10, 24);
    ctx.fillStyle = '#4E342E'; // Traditional mojari shoe
    ctx.fillRect(-15, -4 + legOffset1 * 0.3, 12, 6);

    // Right Leg
    ctx.fillStyle = '#FFA000';
    ctx.fillRect(4, -28, 10, 24);
    ctx.fillStyle = '#4E342E';
    ctx.fillRect(3, -4 + legOffset2 * 0.3, 12, 6);

    // 3. Dhoti / Bottom Wear
    ctx.fillStyle = '#FF8F00';
    ctx.beginPath();
    ctx.moveTo(-16, -34);
    ctx.lineTo(16, -34);
    ctx.lineTo(12, -10);
    ctx.lineTo(-12, -10);
    ctx.closePath();
    ctx.fill();

    // Golden border pleats
    ctx.strokeStyle = '#FFD54F';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -34); ctx.lineTo(0, -10);
    ctx.stroke();

    // 4. Fluttering Angavastram / Sash (Celebratory stole waving behind)
    const sashFlutter = Math.sin(globalTime * 10) * 8;
    ctx.fillStyle = '#D84315';
    ctx.beginPath();
    ctx.moveTo(-8, -52);
    ctx.quadraticCurveTo(-26 + sashFlutter, -40, -34 + sashFlutter, -22);
    ctx.lineTo(-26 + sashFlutter, -20);
    ctx.quadraticCurveTo(-18 + sashFlutter, -38, -4, -48);
    ctx.closePath();
    ctx.fill();

    // 5. Kurta / Torso
    ctx.fillStyle = '#C62828'; // Royal Festive Red Kurta
    ctx.fillRect(-14, -60, 28, 28);

    // Golden Kurta Collar & Buttons
    ctx.strokeStyle = '#FFD54F';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -60); ctx.lineTo(0, -42);
    ctx.stroke();

    // 6. Arms & Hands
    // Left Arm
    ctx.fillStyle = '#C62828';
    ctx.fillRect(-20, -58 + armSwing * 0.5, 7, 20);
    ctx.fillStyle = '#FFCC80';
    ctx.beginPath();
    ctx.arc(-16, -38 + armSwing * 0.5, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Right Arm (Holding Brass Puja Bell / Lotus)
    ctx.fillStyle = '#C62828';
    ctx.fillRect(13, -58 - armSwing * 0.5, 7, 20);
    ctx.fillStyle = '#FFCC80';
    ctx.beginPath();
    ctx.arc(17, -38 - armSwing * 0.5, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Sacred Puja Bell in hand
    ctx.fillStyle = '#FFD54F';
    ctx.beginPath();
    ctx.arc(17, -32 - armSwing * 0.5, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // 7. Head, Hair & Festive Tika
    // Neck
    ctx.fillStyle = '#FFCC80';
    ctx.fillRect(-4, -64, 8, 6);

    // Head
    ctx.beginPath();
    ctx.arc(0, -72, 13, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = '#212121';
    ctx.beginPath();
    ctx.arc(0, -75, 14, Math.PI, 0);
    ctx.fill();

    // Tika / Tilak on forehead (Red kumkum + yellow chandan)
    ctx.fillStyle = '#D50000';
    ctx.fillRect(-1.5, -78, 3, 5);
    ctx.fillStyle = '#FFEA00';
    ctx.fillRect(-1.5, -73, 3, 2);

    ctx.restore();
  }

  // ---------------------------------------------------------------------------
  // 14J. PARTICLES & FLOATING TEXT RENDERING
  // ---------------------------------------------------------------------------
  function renderParticles() {
    runState.particles.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.globalAlpha = Math.max(0, pt.life);
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;
  }

  function renderFloatingTexts() {
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    runState.floatingTexts.forEach(ft => {
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = Math.max(0, ft.life);
      ctx.fillText(ft.text, ft.x, ft.y);
    });
    ctx.globalAlpha = 1.0;
  }

  // ---------------------------------------------------------------------------
  // 15. MAIN MENU ATMOSPHERE RENDERING
  // ---------------------------------------------------------------------------
  function renderMenuAtmosphere(dt) {
    // Serene festive night background on Menu
    ctx.clearRect(0, 0, V_WIDTH, V_HEIGHT);
    const bgGrad = ctx.createLinearGradient(0, 0, 0, V_HEIGHT);
    bgGrad.addColorStop(0, '#0a0d18');
    bgGrad.addColorStop(0.5, '#191b33');
    bgGrad.addColorStop(1, '#2c192f');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, V_WIDTH, V_HEIGHT);

    // Floating Diyas & Petals on Menu
    for (let i = 0; i < 15; i++) {
      const px = (i * 57 + globalTime * 20) % V_WIDTH;
      const py = (i * 43 + Math.sin(globalTime + i) * 30 + 150) % (V_HEIGHT - 50);

      // Warm glow
      const glow = ctx.createRadialGradient(px, py, 2, px, py, 18);
      glow.addColorStop(0, 'rgba(255, 179, 0, 0.8)');
      glow.addColorStop(0.6, 'rgba(255, 111, 0, 0.25)');
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(px, py, 18, 0, Math.PI * 2);
      ctx.fill();

      // Diya clay lamp
      ctx.fillStyle = '#E65100';
      ctx.beginPath();
      ctx.arc(px, py + 2, 7, 0, Math.PI);
      ctx.fill();
      // Flame
      ctx.fillStyle = '#FFEB3B';
      ctx.beginPath();
      ctx.ellipse(px, py - 2, 2.5, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---------------------------------------------------------------------------
  // 16. VISARJAN FINALE SEQUENCE (SACRED GHAT & CELEBRATION)
  // ---------------------------------------------------------------------------
  function initFinaleSequence() {
    finaleScene.timer = 0;
    finaleScene.fireworks = [];
    finaleScene.diyas = [];

    // Pre-populate 40 floating diyas on the water
    for (let i = 0; i < 40; i++) {
      finaleScene.diyas.push({
        x: 40 + Math.random() * (V_WIDTH - 80),
        y: 410 + Math.random() * 160,
        speed: 8 + Math.random() * 16,
        phase: Math.random() * Math.PI * 2
      });
    }

    audio.playBlessing();
  }

  function updateFinale(dt) {
    finaleScene.timer += dt;

    // Fireworks generator
    if (Math.random() < 0.08) {
      launchFirework();
    }

    // Update fireworks
    for (let i = finaleScene.fireworks.length - 1; i >= 0; i--) {
      const fw = finaleScene.fireworks[i];
      fw.x += fw.vx * dt;
      fw.y += fw.vy * dt;
      fw.vy += 45 * dt; // Gravity
      fw.life -= dt;
      if (fw.life <= 0) finaleScene.fireworks.splice(i, 1);
    }

    // Update floating diyas drift
    finaleScene.diyas.forEach(d => {
      d.x += Math.sin(globalTime + d.phase) * 8 * dt;
      d.y += dt * 4;
      if (d.y > V_HEIGHT + 10) d.y = 400;
    });

    // Automatically transition to results after 7 seconds
    if (finaleScene.timer >= 7.5) {
      setGameState(STATES.RESULTS);
    }
  }

  function launchFirework() {
    audio.playFirework();
    const colors = ['#FF1744', '#00E676', '#FFEA00', '#00E5FF', '#FF9100', '#E040FB'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const cx = 100 + Math.random() * (V_WIDTH - 200);
    const cy = 60 + Math.random() * 200;

    for (let i = 0; i < 35; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 140;
      finaleScene.fireworks.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: color,
        radius: 2 + Math.random() * 2.5,
        life: 0.8 + Math.random() * 0.6
      });
    }
  }

  function renderFinale() {
    // 1. Midnight Sky
    const sky = ctx.createLinearGradient(0, 0, 0, 380);
    sky.addColorStop(0, '#04060d');
    sky.addColorStop(0.7, '#0b1124');
    sky.addColorStop(1, '#1b1b3a');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, V_WIDTH, 380);

    // Stars
    ctx.fillStyle = '#FFF';
    for (let s = 0; s < 40; s++) {
      ctx.fillRect((s * 41 + 10) % V_WIDTH, (s * 23 + 5) % 320, 1.5, 1.5);
    }

    // Full Golden Moon
    ctx.fillStyle = '#FFF8E1';
    ctx.beginPath();
    ctx.arc(700, 70, 32, 0, Math.PI * 2);
    ctx.fill();

    // 2. Fireworks in sky
    finaleScene.fireworks.forEach(fw => {
      ctx.fillStyle = fw.color;
      ctx.globalAlpha = Math.max(0, fw.life);
      ctx.beginPath();
      ctx.arc(fw.x, fw.y, fw.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // 3. Sacred River / Ocean Water
    const water = ctx.createLinearGradient(0, 380, 0, V_HEIGHT);
    water.addColorStop(0, '#0d1b2a');
    water.addColorStop(0.5, '#1b263b');
    water.addColorStop(1, '#080d1a');
    ctx.fillStyle = water;
    ctx.fillRect(0, 380, V_WIDTH, V_HEIGHT - 380);

    // Shimmering Waves
    ctx.strokeStyle = 'rgba(255, 213, 79, 0.25)';
    ctx.lineWidth = 1.5;
    for (let w = 390; w < V_HEIGHT; w += 22) {
      ctx.beginPath();
      for (let x = 0; x < V_WIDTH; x += 40) {
        const wy = w + Math.sin(x * 0.05 + globalTime * 3) * 3;
        if (x === 0) ctx.moveTo(x, wy);
        else ctx.lineTo(x, wy);
      }
      ctx.stroke();
    }

    // 4. Grand Illuminated Rath / Chariot of Lord Ganesha
    const cx = V_WIDTH / 2;
    const cy = 340;

    // Royal Chariot Boat Platform
    ctx.fillStyle = '#5D4037';
    ctx.beginPath();
    ctx.moveTo(cx - 110, cy + 40);
    ctx.lineTo(cx + 110, cy + 40);
    ctx.lineTo(cx + 85, cy + 65);
    ctx.lineTo(cx - 85, cy + 65);
    ctx.closePath();
    ctx.fill();

    // Floral Garlands around platform
    ctx.fillStyle = '#FF9933';
    for (let gx = cx - 100; gx <= cx + 100; gx += 14) {
      ctx.beginPath();
      ctx.arc(gx, cy + 42, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Radiant Golden Halo behind Bappa
    const halo = ctx.createRadialGradient(cx, cy - 20, 10, cx, cy - 20, 95);
    halo.addColorStop(0, 'rgba(255, 213, 79, 0.95)');
    halo.addColorStop(0.6, 'rgba(255, 143, 0, 0.5)');
    halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy - 20, 95, 0, Math.PI * 2);
    ctx.fill();

    // Majestic Silhouette of Lord Ganesha
    ctx.fillStyle = '#3E2723';
    // Crown (Mukut)
    ctx.beginPath();
    ctx.moveTo(cx - 18, cy - 60);
    ctx.lineTo(cx, cy - 95);
    ctx.lineTo(cx + 18, cy - 60);
    ctx.closePath();
    ctx.fill();

    // Head & Ears
    ctx.beginPath();
    ctx.arc(cx, cy - 45, 22, 0, Math.PI * 2); // Head
    ctx.ellipse(cx - 28, cy - 45, 12, 18, -0.2, 0, Math.PI * 2); // Left ear
    ctx.ellipse(cx + 28, cy - 45, 12, 18, 0.2, 0, Math.PI * 2); // Right ear
    ctx.fill();

    // Trunk (Sond)
    ctx.lineWidth = 9;
    ctx.strokeStyle = '#3E2723';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 40);
    ctx.quadraticCurveTo(cx - 14, cy - 10, cx - 22, cy - 15);
    ctx.stroke();

    // Body & Blessing Mudra Hand
    ctx.beginPath();
    ctx.ellipse(cx, cy + 10, 32, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Golden Tilak on idol
    ctx.fillStyle = '#FFEA00';
    ctx.fillRect(cx - 2, cy - 56, 4, 8);
    ctx.fillStyle = '#D50000';
    ctx.fillRect(cx - 2, cy - 50, 4, 3);

    // 5. Floating Diyas with Water Reflections
    finaleScene.diyas.forEach(d => {
      // Warm water reflection
      const rGrad = ctx.createRadialGradient(d.x, d.y, 2, d.x, d.y, 14);
      rGrad.addColorStop(0, 'rgba(255, 179, 0, 0.85)');
      rGrad.addColorStop(0.5, 'rgba(255, 111, 0, 0.3)');
      rGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = rGrad;
      ctx.beginPath();
      ctx.arc(d.x, d.y, 14, 0, Math.PI * 2);
      ctx.fill();

      // Diya cup
      ctx.fillStyle = '#D84315';
      ctx.beginPath();
      ctx.arc(d.x, d.y + 2, 5, 0, Math.PI);
      ctx.fill();
      // Little flame
      ctx.fillStyle = '#FFF59D';
      ctx.beginPath();
      ctx.arc(d.x, d.y - 1, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6. Celebration Banners
    ctx.fillStyle = 'rgba(10, 14, 26, 0.75)';
    ctx.fillRect(0, 30, V_WIDTH, 75);

    ctx.font = '900 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFD54F';
    ctx.fillText('VISARJAN FINALE', cx, 65);

    ctx.font = '800 18px sans-serif';
    ctx.fillStyle = '#FFF8E1';
    ctx.fillText('🚩 GANPATI BAPPA MORYA! PUDHCHYA VARSHI LAVKAR YA! 🚩', cx, 93);
  }

  // ---------------------------------------------------------------------------
  // 17. HUD UPDATES
  // ---------------------------------------------------------------------------
  function updateHUD() {
    document.getElementById('hud-score').textContent = runState.score.toLocaleString();
    document.getElementById('hud-distance').textContent = `${Math.floor(runState.distance)} m`;
    document.getElementById('hud-modaks').textContent = runState.modaks;
    document.getElementById('hud-coins').textContent = SessionData.coins;

    // Combo badge
    const comboBadge = document.getElementById('hud-combo');
    if (runState.combo > 1) {
      comboBadge.classList.remove('hidden');
      comboBadge.textContent = `x${runState.combo}`;
    } else {
      comboBadge.classList.add('hidden');
    }

    // Safety Bar
    const safetyPct = Math.max(0, Math.min(100, Math.round(runState.safety)));
    const safetyFill = document.getElementById('hud-safety-fill');
    safetyFill.style.width = `${safetyPct}%`;
    document.getElementById('hud-safety-pct').textContent = `${safetyPct}%`;
    if (safetyPct < 30) {
      safetyFill.classList.add('danger');
    } else {
      safetyFill.classList.remove('danger');
    }

    // Blessing Bar
    const blessFill = document.getElementById('hud-blessing-fill');
    const blessStatus = document.getElementById('hud-blessing-status');
    const blessBadge = document.getElementById('hud-blessing-ready-badge');

    if (runState.blessingActive) {
      const pct = (runState.blessingTimer / 10) * 100;
      blessFill.style.width = `${pct}%`;
      blessStatus.textContent = `ACTIVE (${Math.ceil(runState.blessingTimer)}s)`;
      blessBadge.classList.add('hidden');
    } else if (runState.blessingReady) {
      blessFill.style.width = '100%';
      blessStatus.textContent = 'READY!';
      blessBadge.classList.remove('hidden');
    } else {
      blessFill.style.width = `${runState.blessingMeter}%`;
      blessStatus.textContent = `${Math.round(runState.blessingMeter)}%`;
      blessBadge.classList.add('hidden');
    }

    // Active Buffs Icons
    const buffsContainer = document.getElementById('hud-active-buffs');
    buffsContainer.innerHTML = '';
    const buffIcons = {
      shield: '🛡️ Shield',
      magnet: '🧲 Magnet',
      slowTime: '⏳ Slow',
      doubleScore: '⭐ 2X',
      speedBoost: '🚀 Sprint'
    };

    for (const b in runState.buffs) {
      if (runState.buffs[b] > 0) {
        const chip = document.createElement('div');
        chip.className = 'buff-chip';
        chip.innerHTML = `
          <span>${buffIcons[b]}</span>
          <span class="buff-timer">${Math.ceil(runState.buffs[b])}s</span>
        `;
        buffsContainer.appendChild(chip);
      }
    }
  }

  function updateMenuStats() {
    document.getElementById('menu-high-score').textContent = SessionData.highScore.toLocaleString();
    document.getElementById('menu-coin-count').textContent = `${SessionData.coins} 🪙`;
  }

  // ---------------------------------------------------------------------------
  // 18. GAME OVER & RESULTS SCREENS
  // ---------------------------------------------------------------------------
  function populateGameOverScreen() {
    if (runState.score > SessionData.highScore) {
      SessionData.highScore = runState.score;
    }
    document.getElementById('gameover-score').textContent = runState.score.toLocaleString();
    document.getElementById('gameover-distance').textContent = `${Math.floor(runState.distance)} m`;
    document.getElementById('gameover-modaks').textContent = runState.modaks;
    document.getElementById('gameover-safety').textContent = '0%';
  }

  function populateResultsScreen() {
    if (runState.score > SessionData.highScore) {
      SessionData.highScore = runState.score;
    }

    // Award bonus coins from run
    const earnedCoins = Math.floor(runState.modaks * 2 + runState.distance * 0.05);
    SessionData.coins += earnedCoins;

    document.getElementById('results-score').textContent = runState.score.toLocaleString();
    document.getElementById('results-modaks').textContent = runState.modaks;
    document.getElementById('results-distance').textContent = `${Math.floor(runState.distance)} m`;
    document.getElementById('results-combo').textContent = `x${runState.maxCombo}`;

    // Determine Festival Hero Title based on highest reputation
    const repStats = [
      { name: 'Supreme Sevak of Bappa', val: runState.devotion },
      { name: 'Guardian of the Pandal', val: runState.safety },
      { name: 'Heart of the Festival', val: runState.community },
      { name: 'Sacred City Keeper', val: runState.cleanliness },
      { name: 'Divine Swift Sprinter', val: runState.speedScore }
    ];
    repStats.sort((a, b) => b.val - a.val);
    document.getElementById('results-hero-title').textContent = repStats[0].name.toUpperCase();

    // Set 5 reputation bars
    const setRepBar = (id, val) => {
      const clamped = Math.max(0, Math.min(100, Math.round(val)));
      document.getElementById(`rep-bar-${id}`).style.width = `${clamped}%`;
      document.getElementById(`rep-val-${id}`).textContent = clamped;
    };

    setRepBar('devotion', runState.devotion);
    setRepBar('safety', runState.safety);
    setRepBar('cleanliness', runState.cleanliness);
    setRepBar('community', runState.community);
    setRepBar('speed', runState.speedScore);

    // Check Safety Mission
    if (runState.safety >= 85) {
      updateMissionProgress('m6', Math.round(runState.safety));
    }
  }

  // ---------------------------------------------------------------------------
  // 19. MISSIONS SYSTEM
  // ---------------------------------------------------------------------------
  function updateMissionProgress(id, value) {
    const m = SessionData.missions.find(item => item.id === id);
    if (!m || m.completed) return;

    m.current = Math.max(m.current, value);
    if (m.current >= m.target) {
      m.current = m.target;
      m.completed = true;
      audio.playTempleBell();
    }
  }

  function renderMissions() {
    const list = document.getElementById('missions-list');
    if (!list) return;
    list.innerHTML = '';

    SessionData.missions.forEach(m => {
      const card = document.createElement('div');
      card.className = `mission-card ${m.completed ? 'completed' : ''}`;
      const pct = Math.min(100, Math.round((m.current / m.target) * 100));

      let actionHtml = '';
      if (m.claimed) {
        actionHtml = '<span class="mission-done-tag">✓ COMPLETED</span>';
      } else if (m.completed) {
        actionHtml = `<button class="mission-claim-btn" data-id="${m.id}">CLAIM ${m.reward} 🪙</button>`;
      } else {
        actionHtml = `<span class="mission-reward-badge">+${m.reward} 🪙</span>`;
      }

      card.innerHTML = `
        <div class="mission-info">
          <div class="mission-title">${m.title}</div>
          <div class="mission-desc">${m.desc} (${m.current}/${m.target})</div>
          <div class="mission-progress-bar">
            <div class="mission-progress-fill" style="width: ${pct}%;"></div>
          </div>
        </div>
        <div class="mission-reward-side">
          ${actionHtml}
        </div>
      `;

      list.appendChild(card);
    });

    // Attach Claim Event Listeners
    list.querySelectorAll('.mission-claim-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const m = SessionData.missions.find(item => item.id === id);
        if (m && m.completed && !m.claimed) {
          m.claimed = true;
          SessionData.coins += m.reward;
          audio.playPowerup();
          renderMissions();
          updateMenuStats();
        }
      });
    });
  }

  // ---------------------------------------------------------------------------
  // 20. SHOP SYSTEM (IN-MEMORY)
  // ---------------------------------------------------------------------------
  const SHOP_CONFIG = [
    { id: 'shield', name: 'Divine Shield', icon: '🛡️', baseCost: 100, maxLvl: 3, desc: 'Start runs equipped with protective energy shield.' },
    { id: 'magnet', name: 'Modak Magnet', icon: '🧲', baseCost: 120, maxLvl: 3, desc: 'Increases Modak pull duration by +3s per level.' },
    { id: 'slowTime', name: 'Time Expansion', icon: '⏳', baseCost: 120, maxLvl: 3, desc: 'Increases Slow Time power duration by +3s per level.' },
    { id: 'doubleScore', name: 'Golden Prasad', icon: '⭐', baseCost: 140, maxLvl: 3, desc: 'Increases 2X Score boost duration by +3s per level.' },
    { id: 'extraLife', name: 'Amrit Life', icon: '❤️', baseCost: 200, maxLvl: 1, desc: 'Restore +25% bonus safety on heart pickups.' },
    { id: 'speedBoost', name: 'Prasad Sprint', icon: '🚀', baseCost: 150, maxLvl: 3, desc: 'Increases Hyper Sprint invincibility duration by +2s.' }
  ];

  function setupShop() {
    renderShop();
  }

  function renderShop() {
    const list = document.getElementById('shop-items-list');
    const display = document.getElementById('shop-coin-display');
    if (!list || !display) return;

    display.textContent = `${SessionData.coins} 🪙`;
    list.innerHTML = '';

    SHOP_CONFIG.forEach(item => {
      const currentLvl = SessionData.shopUpgrades[item.id] || 0;
      const isMax = currentLvl >= item.maxLvl;
      const cost = item.baseCost * (currentLvl + 1);
      const canAfford = SessionData.coins >= cost && !isMax;

      const card = document.createElement('div');
      card.className = 'shop-item-card';
      card.innerHTML = `
        <div class="shop-item-header">
          <span class="shop-item-icon">${item.icon}</span>
          <div>
            <div class="shop-item-title">${item.name}</div>
            <div class="shop-item-level">LEVEL ${currentLvl} / ${item.maxLvl}</div>
          </div>
        </div>
        <div class="shop-item-desc">${item.desc}</div>
        <button class="shop-buy-btn" data-id="${item.id}" ${canAfford ? '' : 'disabled'}>
          ${isMax ? 'MAX LEVEL' : `UPGRADE (${cost} 🪙)`}
        </button>
      `;

      list.appendChild(card);
    });

    // Attach Buy Event Listeners
    list.querySelectorAll('.shop-buy-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.getAttribute('data-id');
        const item = SHOP_CONFIG.find(sc => sc.id === id);
        const currentLvl = SessionData.shopUpgrades[id] || 0;
        const cost = item.baseCost * (currentLvl + 1);

        if (SessionData.coins >= cost && currentLvl < item.maxLvl) {
          SessionData.coins -= cost;
          SessionData.shopUpgrades[id] = currentLvl + 1;
          audio.playPowerup();
          renderShop();
          updateMenuStats();
        }
      });
    });
  }

  // ---------------------------------------------------------------------------
  // 21. BOOTSTRAP ON LOAD
  // ---------------------------------------------------------------------------
  window.addEventListener('DOMContentLoaded', () => {
    initEngine();
  });

})();
