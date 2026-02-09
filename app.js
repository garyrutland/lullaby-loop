// --- CONFIG ---
let sessionMinutes = parseInt(localStorage.getItem('slowtide_duration')) || 90;
let currentSound = localStorage.getItem('slowtide_sound') || 'deep';
// If sound is 'off', default to 'deep' instead
if (currentSound === 'off') currentSound = 'deep';
let sfxEnabled = localStorage.getItem('slowtide_sfx') !== 'false';
let audioCtx, gainNode, waveLFO;
let timerInterval;
let startTime = 0;
let elapsedSaved = 0;
let isPaused = false;
let isSessionRunning = false;
let currentView = 'particles';
let selectedGames = [];

// --- GAME ICONS ---
const GAME_ICONS = {
    particles: '<svg viewBox="0 0 24 24"><path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" /></svg>',
    sorting: '<svg viewBox="0 0 24 24"><path d="M3 3H11V11H3V3ZM13 3H21V11H13V3ZM3 13H11V21H3V13ZM13 13H21V21H13V13Z" /></svg>',
    bubbles: '<svg viewBox="0 0 24 24"><path d="M12,2C6.48,2 2,6.48 2,12C2,17.52 6.48,22 12,22C17.52,22 22,17.52 22,12C22,6.48 17.52,2 12,2M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M13,7H11V11H7V13H11V17H13V13H17V11H13V7Z" /></svg>',
    liquid: '<svg viewBox="0 0 24 24"><path d="M12,2c-5.33,4.55-8,8.48-8,11.8c0,4.98,3.8,8.2,8,8.2s8-3.22,8-8.2C20,10.48,17.33,6.55,12,2z M12,20c-3.35,0-6-2.57-6-6.2c0-2.34,1.95-5.44,6-9.14c4.05,3.7,6,6.79,6,9.14C18,17.43,15.35,20,12,20z" /></svg>',
    marbles: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-5 10c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm10 0c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm-5 7c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" /></svg>',
    ripples: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5z" /></svg>',
    gravity: '<svg viewBox="0 0 24 24"><path d="M12 2c5.52 0 10 4.48 10 10s-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2m0 18c4.42 0 8-3.58 8-8s-3.58-8-8-8-8 3.58-8 8 3.58 8 8 8m3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5M8.5 11C9.33 11 10 10.33 10 9.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11m3.5 6c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z" /></svg>',
    pulse: '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2m0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8m0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6" /></svg>',
    flow: '<svg viewBox="0 0 24 24"><path d="M3 6h12v2H3zm0 4h12v2H3zm0 4h12v2H3zm14 0h2v2h-2zm0 4h2v2h-2zM3 16h2v2H3z" /></svg>',
    dots: '<svg viewBox="0 0 24 24"><path d="M12 8c1.1 0 2-1.1 2-2.5S13.1 3 12 3s-2 .9-2 2.5S10.9 8 12 8zm0 2c-1.1 0-2 1.1-2 2.5s.9 2.5 2 2.5 2-.9 2-2.5-.9-2.5-2-2.5zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>'
};

// --- DOM ---
const titleEl = document.getElementById('app-title');
const modeLabel = document.getElementById('mode-label');
const modal = document.getElementById('settings-modal');
const confirmModal = document.getElementById('confirm-modal');
const timerDisplay = document.getElementById('timer-display');
const pauseBtn = document.getElementById('pause-btn');
const navBar = document.getElementById('nav-bar');
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');

let entities = [];
let lastInteraction = Date.now();
let lastSFX = 0;
let dragPrevX = 0, dragPrevY = 0;
let dragDistance = 0;

// --- PARENT MENU LOGIC ---
let tapCount = 0;
let tapResetTimer;

titleEl.addEventListener('click', handleTitleTap);

function handleTitleTap() {
    clearTimeout(tapResetTimer);
    tapCount++;
    if (tapCount >= 5) {
        modal.style.display = 'block';
        tapCount = 0;
    } else {
        tapResetTimer = setTimeout(() => { tapCount = 0; }, 500);
    }
}

function changeDuration(mins) {
    sessionMinutes = mins;
    localStorage.setItem('slowtide_duration', mins);
    document.querySelectorAll('.time-btn').forEach(b => {
        b.classList.remove('selected');
        if (b.getAttribute('data-time') == mins) b.classList.add('selected');
    });
    pulse(30);
    updateTimerText();
}

function changeSound(type) {
    currentSound = type;
    localStorage.setItem('slowtide_sound', type);
    document.querySelectorAll('.sound-btn').forEach(b => {
        b.classList.remove('selected');
        if (b.getAttribute('data-sound') === type) b.classList.add('selected');
    });
    pulse(30);
    if (isSessionRunning && !isPaused && audioCtx) {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        generateSoundBuffer(type);
    }
}

function setSFX(val) {
    sfxEnabled = (val === 'on');
    localStorage.setItem('slowtide_sfx', sfxEnabled ? 'true' : 'false');
    document.querySelectorAll('.sfx-btn').forEach(b => {
        b.classList.remove('selected');
        if (b.getAttribute('data-sfx') === val) b.classList.add('selected');
    });
    pulse(30);
}

function togglePause() {
    if (!isSessionRunning) return;
    isPaused = !isPaused;
    if (isPaused) {
        clearInterval(timerInterval);
        elapsedSaved += Date.now() - startTime;
        if (audioCtx) audioCtx.suspend();
        pauseBtn.innerText = "Resume Session";
        pauseBtn.className = "action-btn resume-btn";
        timerDisplay.innerText += " (PAUSED)";
    } else {
        startTime = Date.now();
        startTimer(false);
        if (audioCtx) audioCtx.resume();
        pauseBtn.innerText = "Pause Session";
        pauseBtn.className = "action-btn pause-btn";
    }
}

function closeSettings() { modal.style.display = 'none'; }
function showQuitConfirm() { modal.style.display = 'none'; confirmModal.style.display = 'block'; }
function closeQuitConfirm() { confirmModal.style.display = 'none'; modal.style.display = 'block'; }
function resetApp() {
    confirmModal.style.display = 'none';
    if (audioCtx) audioCtx.suspend();
    if (noiseSource) try { noiseSource.stop() } catch (e) { }
    clearInterval(timerInterval);
    isSessionRunning = false; isPaused = false; elapsedSaved = 0;
    document.getElementById('sunset-overlay').style.opacity = 0;
    navBar.style.display = 'none'; navBar.style.opacity = 0;
    document.getElementById('start-screen').style.display = 'flex';
    pauseBtn.innerText = "Pause Session";
    pauseBtn.className = "action-btn pause-btn";
}
function performUpdate() { window.location.reload(); }

// --- AUDIO ENGINE ---
let noiseSource;
let baseNoiseGain = 0.12;
let duckedNoiseGain = 0.04;

function initAudio() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!audioCtx) audioCtx = new AudioContext();
    if (!gainNode) { gainNode = audioCtx.createGain(); gainNode.connect(audioCtx.destination); }

    // Resume audio context immediately (must be during user interaction)
    if (audioCtx.state === 'suspended') {
        audioCtx.resume().catch(e => {
            console.log('Audio context resume failed:', e);
        });
    }

    // Now generate the sound buffer
    generateSoundBuffer(currentSound);
}

function generateSoundBuffer(type) {
    if (noiseSource) { try { noiseSource.stop(); } catch (e) { } }
    if (waveLFO) { try { waveLFO.stop(); } catch (e) { } }
    if (type === 'off') { if (gainNode) gainNode.gain.value = 0; return; }
    if (gainNode) { gainNode.gain.value = baseNoiseGain; }

    const bufferSize = audioCtx.sampleRate * 2;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    if (type === 'deep' || type === 'waves') {
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            lastOut = (lastOut + (0.02 * white)) / 1.02;
            data[i] = lastOut * 3.5;
        }
    } else if (type === 'rain') {
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
            b6 = white * 0.115926;
        }
    } else if (type === 'static') {
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.5;
        }
    }

    noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;
    noiseSource.connect(gainNode);
    noiseSource.start(0);

    if (type === 'waves') {
        noiseSource.disconnect();
        const waveNode = audioCtx.createGain();
        waveNode.gain.value = 0.5;
        noiseSource.connect(waveNode);
        waveNode.connect(gainNode);
        waveLFO = audioCtx.createOscillator();
        waveLFO.type = 'sine';
        waveLFO.frequency.value = 0.1;
        waveLFO.connect(waveNode.gain);
        waveLFO.start();
    }
}

// --- CONTINUOUS SYNTH ---
let activeSynth = null;
let activeSynthGain = null;

const PARTICLE_SCALE = [220, 247, 262, 294, 330, 349, 392]; // soft major-ish scale
const LIQUID_SCALE = [196, 220, 247, 262, 294]; // slightly lower, smoother band

function pickScaleFreq(scale, yRatio) {
    if (!scale || scale.length === 0) return 220;
    const idx = Math.round((1 - yRatio) * (scale.length - 1));
    const safeIdx = Math.min(scale.length - 1, Math.max(0, idx));
    return scale[safeIdx];
}

function connectWithPanning(gainNode, xRatio) {
    if (!audioCtx || !gainNode) return;
    const dest = audioCtx.destination;
    const xr = (typeof xRatio === 'number') ? xRatio : 0.5;
    if (audioCtx.createStereoPanner) {
        const panner = audioCtx.createStereoPanner();
        const pan = Math.max(-0.7, Math.min(0.7, (xr - 0.5) * 1.4));
        panner.pan.value = pan;
        gainNode.connect(panner);
        panner.connect(dest);
    } else {
        gainNode.connect(dest);
    }
}

function duckBackground() {
    if (!audioCtx || !gainNode) return;
    if (currentSound === 'off') return;
    const t = audioCtx.currentTime;
    gainNode.gain.cancelScheduledValues(t);
    gainNode.gain.setTargetAtTime(duckedNoiseGain, t, 0.03);
    gainNode.gain.setTargetAtTime(baseNoiseGain, t + 0.15, 0.45);
}

function startContinuousSynth(type, yRatio, xRatio) {
    if (!sfxEnabled || !audioCtx) return;
    if (activeSynth) stopContinuousSynth();
    duckBackground();

    activeSynth = audioCtx.createOscillator();
    activeSynthGain = audioCtx.createGain();
    activeSynth.connect(activeSynthGain);
    connectWithPanning(activeSynthGain, xRatio);

    const t = audioCtx.currentTime;

    if (type === 'particles') {
        activeSynth.type = 'sine';
        activeSynth.frequency.value = pickScaleFreq(PARTICLE_SCALE, yRatio);
        activeSynthGain.gain.setValueAtTime(0, t);
        activeSynthGain.gain.linearRampToValueAtTime(0.15, t + 0.1);
    } else if (type === 'liquid') {
        activeSynth.type = 'triangle';
        activeSynth.frequency.value = pickScaleFreq(LIQUID_SCALE, yRatio);
        activeSynthGain.gain.setValueAtTime(0, t);
        activeSynthGain.gain.linearRampToValueAtTime(0.1, t + 0.2);
    } else if (type === 'sorting') {
        activeSynth.type = 'sawtooth';
        activeSynth.frequency.value = 60;
        activeSynthGain.gain.setValueAtTime(0, t);
        activeSynthGain.gain.linearRampToValueAtTime(0.05, t + 0.1);
    }

    activeSynth.start(t);
}

function updateContinuousSynth(yRatio, xRatio) {
    if (!activeSynth) return;
    const t = audioCtx.currentTime;
    if (activeSynth.type === 'sine') {
        const freq = pickScaleFreq(PARTICLE_SCALE, yRatio);
        activeSynth.frequency.setTargetAtTime(freq, t, 0.08);
    } else if (activeSynth.type === 'triangle') {
        const freq = pickScaleFreq(LIQUID_SCALE, yRatio);
        activeSynth.frequency.setTargetAtTime(freq, t, 0.1);
    }
}

function stopContinuousSynth() {
    if (!activeSynth) return;
    const t = audioCtx.currentTime;
    activeSynthGain.gain.cancelScheduledValues(t);
    activeSynthGain.gain.setTargetAtTime(0, t, 0.1);
    activeSynth.stop(t + 0.15);
    activeSynth = null;
    activeSynthGain = null;
}

// --- DISCRETE SFX ---
function playSFX(type, xRatio) {
    if (!audioCtx || !sfxEnabled) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    if (type === 'clack' && Date.now() - lastSFX < 80) return;
    lastSFX = Date.now();
    duckBackground();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    connectWithPanning(gain, xRatio);
    const t = audioCtx.currentTime;

    if (type === 'pop') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
        gain.gain.setValueAtTime(0.4, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
        osc.start(t); osc.stop(t + 0.15);
    } else if (type === 'tile') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(260, t);
        osc.frequency.exponentialRampToValueAtTime(220, t + 0.18);
        gain.gain.setValueAtTime(0.16, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
        osc.start(t); osc.stop(t + 0.2);
    } else if (type === 'clack') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300 + Math.random() * 100, t);
        osc.frequency.exponentialRampToValueAtTime(100, t + 0.1);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.start(t); osc.stop(t + 0.1);
    }
}

// --- AUDIO KICKSTART ---
function tryResumeAudio() {
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(e => {
            console.log('Audio resume blocked:', e);
        });
    }
}

document.body.addEventListener('touchstart', tryResumeAudio);
document.body.addEventListener('click', tryResumeAudio);

// --- SUNSET TIMER ---
function startTimer(reset = true) {
    if (timerInterval) clearInterval(timerInterval);
    if (reset) { startTime = Date.now(); elapsedSaved = 0; }
    updateTimerText();
    updateProgressRing();
    timerInterval = setInterval(() => { updateTimerText(); checkSunset(); checkIdle(); updateProgressRing(); }, 1000);
}
function getCurrentElapsed() { return Math.floor((Date.now() - startTime) + elapsedSaved) / 1000; }
function updateTimerText() {
    if (!isSessionRunning) return;
    const totalSeconds = sessionMinutes * 60;
    const currentSessionElapsed = isPaused ? (elapsedSaved / 1000) : getCurrentElapsed();
    let remaining = totalSeconds - currentSessionElapsed;
    if (remaining < 0) remaining = 0;
    let rMin = Math.floor(remaining / 60);
    let rSec = Math.floor(remaining % 60);
    timerDisplay.innerText = `Time Left: ${rMin}m ${rSec < 10 ? '0' : ''}${rSec}s` + (isPaused ? " (PAUSED)" : "");
}
function checkSunset() {
    if (isPaused) return;
    const totalSeconds = sessionMinutes * 60;
    const elapsed = getCurrentElapsed();
    let progress = elapsed / totalSeconds;
    if (progress > 1) progress = 1;
    if (progress > 0.5) {
        const fade = (progress - 0.5) * 2;
        document.getElementById('sunset-overlay').style.opacity = fade * 0.98;
        if (currentSound !== 'off' && gainNode) gainNode.gain.value = 0.8 * (1 - fade);
    }
}

function getSessionProgress() {
    if (!isSessionRunning) return 0;
    const totalSeconds = sessionMinutes * 60;
    if (totalSeconds <= 0) return 0;
    const elapsed = getCurrentElapsed();
    let p = elapsed / totalSeconds;
    if (p < 0) p = 0;
    if (p > 1) p = 1;
    return p;
}

function updateProgressRing() {
    if (!isSessionRunning) {
        document.getElementById('progress-ring').style.strokeDashoffset = '125.66';
        return;
    }
    const progress = getSessionProgress();
    const circumference = 125.66;
    const offset = circumference * (1 - progress);
    document.getElementById('progress-ring').style.strokeDashoffset = offset;
}

function getBaseHue() {
    const p = getSessionProgress();
    const sessionHue = 200 - p * 80; // drift from cooler to slightly warmer over session
    const t = Date.now() * 0.01;
    return (sessionHue + t) % 360;
}

function getActivityLevel() {
    if (!canvas) return 0;
    const norm = (canvas.width + canvas.height) || 1;
    let level = dragDistance / (norm * 10);
    if (level > 1) level = 1;
    if (level < 0) level = 0;
    return level;
}

function hslToRgb(h, s, l) {
    h = (h % 360) / 360;
    s = s / 100;
    l = l / 100;
    let r, g, b;
    if (s === 0) {
        r = g = b = l;
    } else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

// --- IDLE LOGIC ---
function checkIdle() {
    if (!isSessionRunning || isPaused) return;
    let idleTime = Date.now() - lastInteraction;
    if (idleTime > 2000 && Math.random() < 0.05) ghostInteraction();
    if (idleTime > 45000) {
        const fallbackGames = ['particles', 'sorting', 'bubbles', 'liquid', 'marbles', 'ripples', 'gravity', 'pulse', 'flow', 'dots'];
        const GAME_ROTATIONS = {
            particles: ['liquid', 'bubbles', 'flow', 'ripples'],
            sorting: ['marbles', 'particles', 'gravity', 'dots'],
            bubbles: ['liquid', 'marbles', 'pulse', 'ripples'],
            liquid: ['particles', 'bubbles', 'flow', 'gravity'],
            marbles: ['sorting', 'bubbles', 'pulse', 'gravity'],
            ripples: ['flow', 'dots', 'particles'],
            gravity: ['pulse', 'marbles', 'particles'],
            pulse: ['gravity', 'bubbles', 'ripples'],
            flow: ['ripples', 'liquid', 'particles'],
            dots: ['sorting', 'bubbles', 'flow']
        };
        const options = GAME_ROTATIONS[currentView] || fallbackGames;
        let next = options[Math.floor(Math.random() * options.length)];
        if (next === currentView) {
            const alt = fallbackGames.find(g => g !== currentView);
            if (alt) next = alt;
        }
        switchView(next);
        lastInteraction = Date.now() - 2000;
    }
}

function ghostInteraction() {
    let cx = Math.random() * canvas.width;
    let cy = Math.random() * canvas.height;
    if (currentView === 'particles') spawnParticle(cx, cy, 0);
    if (currentView === 'bubbles') spawnBubble();
    if (currentView === 'liquid') spawnLiquid(cx, cy, 0);
    if (currentView === 'sorting' && entities.length > 0) {
        let s = entities[Math.floor(Math.random() * entities.length)];
        s.dx += (Math.random() - 0.5) * 50; s.dy += (Math.random() - 0.5) * 50; s.vAngle += (Math.random() - 0.5) * 0.1;
    }
    if (currentView === 'marbles' && entities.length > 0) {
        let m = entities[Math.floor(Math.random() * entities.length)];
        m.vx += (Math.random() - 0.5) * 15; m.vy += (Math.random() - 0.5) * 15;
    }
    if (currentView === 'ripples') spawnRipple(cx, cy);
    if (currentView === 'gravity' && entities.length > 0) entities.gravityTarget = { x: cx, y: cy };
    if (currentView === 'flow') spawnFlow(cx, cy);
    if (currentView === 'dots' && entities.length > 0) {
        let d = entities[Math.floor(Math.random() * entities.length)];
        d.ox += (Math.random() - 0.5) * 100; d.oy += (Math.random() - 0.5) * 100;
    }
}

// --- VIEW MANAGEMENT ---
const VIEW_LABELS = {
    particles: 'trails',
    sorting: 'tiles',
    bubbles: 'bubbles',
    liquid: 'ink',
    marbles: 'marbles',
    ripples: 'ripples',
    gravity: 'gravity',
    pulse: 'pulse',
    flow: 'flow',
    dots: 'dots'
};

function updateModeLabel() {
    if (!modeLabel) return;
    const label = VIEW_LABELS[currentView] || currentView;
    modeLabel.textContent = `· ${label} ·`;
}

function switchView(viewName) {
    currentView = viewName;
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));
    const btn = document.getElementById(`btn-${viewName}`);
    if (btn) btn.classList.add('active');
    entities = [];
    if (viewName === 'sorting') initSorting();
    if (viewName === 'bubbles') initBubbles();
    if (viewName === 'marbles') initMarbles();
    if (viewName === 'ripples') initRipples();
    if (viewName === 'gravity') initGravity();
    if (viewName === 'pulse') initPulse();
    if (viewName === 'flow') initFlow();
    if (viewName === 'dots') initDots();
    updateModeLabel();
}

// --- INPUT HANDLING ---
function pulse(ms) { if (navigator.vibrate) navigator.vibrate(ms); }
function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }

// --- FPS MONITOR (DEV MODE) ---
let debugMode = false;
let fpsEnabled = false;
let fpsCounter = 0;
let fpsValue = 0;
let lastFpsTime = Date.now();
let debugTapCount = 0;
let debugTapTimer;

function handleDebugTap() {
    clearTimeout(debugTapTimer);
    debugTapCount++;
    if (debugTapCount >= 3) {
        fpsEnabled = !fpsEnabled;
        debugMode = fpsEnabled;
        debugTapCount = 0;
        if (fpsEnabled) console.log('Dev mode FPS monitor enabled');
    } else {
        debugTapTimer = setTimeout(() => { debugTapCount = 0; }, 500);
    }
}

// --- ADMIN MODE (ALL 10 GAMES) ---
let adminMode = false;
let adminTapCount = 0;
let adminTapTimer;

function handleAdminMode() {
    clearTimeout(adminTapTimer);
    adminTapCount++;
    if (adminTapCount >= 3) {
        adminMode = !adminMode;
        adminTapCount = 0;
        if (adminMode) console.log('Admin mode: showing all 10 games');
        else console.log('Admin mode disabled');
    } else {
        adminTapTimer = setTimeout(() => { adminTapCount = 0; }, 500);
    }
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') handleDebugTap();
    if (e.key === 'd' || e.key === 'D') handleAdminMode();
});

function updateFPS() {
    fpsCounter++;
    const now = Date.now();
    if (now - lastFpsTime >= 1000) {
        fpsValue = fpsCounter;
        fpsCounter = 0;
        lastFpsTime = now;
    }
}

function drawFPS() {
    if (!fpsEnabled || !ctx) return;
    ctx.save();
    ctx.fillStyle = 'rgba(255, 100, 100, 0.7)';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(`FPS: ${fpsValue}`, 15, 30);
    ctx.restore();
}
window.addEventListener('resize', resize);

// END HANDLER FOR CONTINUOUS AUDIO
function handleInputEnd() {
    stopContinuousSynth();
    if (currentView === 'sorting') handleSEnd();
}

canvas.addEventListener('mouseup', handleInputEnd);
canvas.addEventListener('touchend', handleInputEnd);
canvas.addEventListener('mouseleave', handleInputEnd);

function handleInput(e, type) {
    if (e.target.closest('.nav-btn') || e.target.closest('#header-area') || e.target.closest('.modal-overlay')) return;
    e.preventDefault();
    const t = e.touches ? e.touches[0] : e;
    const x = t.clientX; const y = t.clientY;
    const xRatio = canvas.width ? (x / canvas.width) : 0.5;

    // VELOCITY CALC
    let speed = 0;
    if (type === 'move') {
        let dx = x - dragPrevX;
        let dy = y - dragPrevY;
        speed = Math.sqrt(dx * dx + dy * dy);
        dragDistance += speed;
    }
    dragPrevX = x; dragPrevY = y;

    lastInteraction = Date.now();

    let yRatio = y / canvas.height;

    if (type === 'start') {
        dragDistance = dragDistance; // keep for activity tracking without resetting
        if (currentView === 'particles') { spawnParticle(x, y, 20); startContinuousSynth('particles', yRatio, xRatio); }
        if (currentView === 'sorting') { handleSStart(x, y); }
        if (currentView === 'bubbles') { handleBStart(x, y); }
        if (currentView === 'liquid') { spawnLiquid(x, y, 20); startContinuousSynth('liquid', yRatio, xRatio); }
        if (currentView === 'marbles') { handleMInput(x, y); }
        if (currentView === 'ripples') { spawnRipple(x, y); startContinuousSynth('ripples', yRatio, xRatio); }
        if (currentView === 'gravity') { entities.gravityTarget = { x, y }; }
        if (currentView === 'flow') { spawnFlow(x, y); startContinuousSynth('flow', yRatio, xRatio); }
        if (currentView === 'dots') {
            // nudge nearby dots toward touch point for an interactive response
            const influence = 120;
            for (let i = 0; i < entities.length; i++) {
                let d = entities[i];
                let dx = x - d.x, dy = y - d.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < influence) {
                    d.ox += (x - d.ox) * 0.5;
                    d.oy += (y - d.oy) * 0.5;
                    d.hue = (d.hue + 20) % 360;
                }
            }
        }
    } else if (type === 'move') {
        updateContinuousSynth(yRatio, xRatio);
        if (currentView === 'particles') spawnParticle(x, y, speed);
        if (currentView === 'sorting') handleSMove(x, y);
        if (currentView === 'liquid') spawnLiquid(x, y, speed);
        if (currentView === 'marbles') handleMInput(x, y);
        if (currentView === 'ripples') { if (speed > 5) spawnRipple(x, y); }
        if (currentView === 'gravity') { entities.gravityTarget = { x, y }; }
        if (currentView === 'dots') {
            const influence = 80;
            for (let i = 0; i < entities.length; i++) {
                let d = entities[i];
                let dx = x - d.x, dy = y - d.y;
                let dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < influence) {
                    d.ox += (x - d.ox) * 0.25;
                    d.oy += (y - d.oy) * 0.25;
                }
            }
        }
    }
}

canvas.addEventListener('mousedown', e => handleInput(e, 'start'));
canvas.addEventListener('touchstart', e => handleInput(e, 'start'), { passive: false });
canvas.addEventListener('mousemove', e => handleInput(e, 'move'));
canvas.addEventListener('touchmove', e => handleInput(e, 'move'), { passive: false });

// --- GAME LOGIC ---

// 1. PARTICLES (V61: Velocity Size + Rainbow)
function spawnParticle(x, y, speed) {
    let size = Math.min(30, Math.max(5, speed));
    let baseHue = getBaseHue();
    let hueJitter = (Math.random() - 0.5) * 30;
    let hue = (baseHue + hueJitter + 360) % 360;
    entities.push({ x, y, vx: (Math.random() - .5) * 2, vy: (Math.random() - .5) * 2, life: 1, hue: hue, size: size });
}
function animParticles() {
    ctx.fillStyle = 'rgba(5,5,5,0.2)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < entities.length; i++) {
        let p = entities[i]; p.x += p.vx; p.y += p.vy; p.life -= 0.01;
        if (p.life > 0) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(${p.hue},80%,60%,${p.life})`;
            ctx.fill();
        }
        else { entities.splice(i, 1); i--; }
    }
}

// 2. SORTING (Updated SFX + Magnetic Lanes)
let dragS = null, offX = 0, offY = 0;
let sortingLanes = [];
let sortingRows = [];

function initSorting() {
    const cols = ['#5D6D7E', '#A9DFBF', '#F5B7B1', '#D7BDE2', '#F9E79F'];
    sortingLanes = [];
    sortingRows = [];

    const laneCount = 3;
    const marginX = canvas.width * 0.15;
    const usableWidth = canvas.width - marginX * 2;
    for (let i = 0; i < laneCount; i++) {
        sortingLanes.push(marginX + (usableWidth * (i + 0.5) / laneCount));
    }

    const rowCount = 3;
    const topY = 140;
    const bottomY = Math.max(topY + 160, canvas.height - 140);
    for (let i = 0; i < rowCount; i++) {
        sortingRows.push(topY + (bottomY - topY) * (i + 0.5) / rowCount);
    }

    for (let i = 0; i < 20; i++) {
        const laneX = sortingLanes[Math.floor(Math.random() * sortingLanes.length)] || (canvas.width / 2);
        const rowY = sortingRows[Math.floor(Math.random() * sortingRows.length)] || (canvas.height / 2);
        const jitterX = (Math.random() - 0.5) * 80;
        const jitterY = (Math.random() - 0.5) * 40;
        entities.push({
            x: laneX + jitterX,
            y: rowY + jitterY,
            w: Math.random() * 60 + 40,
            h: Math.random() * 40 + 30,
            c: cols[Math.floor(Math.random() * cols.length)],
            angle: Math.random() * Math.PI,
            vAngle: (Math.random() - 0.5) * 0.02,
            dx: Math.random() * 100,
            dy: Math.random() * 100,
            scale: 1.0,
            targetX: null,
            targetY: null,
            prevX: 0
        });
    }
}
function handleSStart(x, y) {
    for (let i = entities.length - 1; i >= 0; i--) {
        let s = entities[i];
        if (x > s.x - s.w / 2 - 20 && x < s.x + s.w / 2 + 20 && y > s.y - s.h / 2 - 20 && y < s.y + s.h / 2 + 20) {
            dragS = s; offX = x - s.x; offY = y - s.y;
            entities.splice(i, 1); entities.push(dragS);
            s.targetX = null; s.prevX = x;
            pulse(10);
            const xr = canvas.width ? (x / canvas.width) : 0.5;
            playSFX('tile', xr);
            startContinuousSynth('sorting', 0.5, xr);
            break;
        }
    }
}
function handleSMove(x, y) {
    if (dragS) { let speedX = x - dragS.prevX; dragS.vAngle = speedX * 0.005; dragS.prevX = x; dragS.x = x - offX; dragS.y = y - offY; }
}
function handleSEnd() {
    if (!dragS) return;
    const s = dragS;
    dragS = null;

    if (sortingLanes.length && sortingRows.length) {
        let bestLaneX = sortingLanes[0];
        let bestLaneDist = Math.abs(s.x - sortingLanes[0]);
        for (let i = 1; i < sortingLanes.length; i++) {
            const d = Math.abs(s.x - sortingLanes[i]);
            if (d < bestLaneDist) { bestLaneDist = d; bestLaneX = sortingLanes[i]; }
        }

        let bestRowY = sortingRows[0];
        let bestRowDist = Math.abs(s.y - sortingRows[0]);
        for (let i = 1; i < sortingRows.length; i++) {
            const d = Math.abs(s.y - sortingRows[i]);
            if (d < bestRowDist) { bestRowDist = d; bestRowY = sortingRows[i]; }
        }

        const xr = canvas.width ? (bestLaneX / canvas.width) : 0.5;
        playSFX('tile', xr);

        s.targetX = bestLaneX;
        s.targetY = bestRowY;
    }
}

function animSorting() {
    ctx.fillStyle = 'rgba(5,5,5,0.3)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    entities.forEach(s => {
        if (s.targetX !== null && s.targetY !== null) {
            s.x += (s.targetX - s.x) * 0.12;
            s.y += (s.targetY - s.y) * 0.12;
            const doneX = Math.abs(s.x - s.targetX) < 2;
            const doneY = Math.abs(s.y - s.targetY) < 2;
            if (doneX && doneY) { s.targetX = null; s.targetY = null; }
        }
        if (s.y < 100 && dragS !== s && s.targetY === null) { s.y += 1; }
        s.angle += s.vAngle; s.vAngle *= 0.95;
        let fx = s.x, fy = s.y;
        if (dragS !== s) { fx += Math.sin(Date.now() * 0.001 + s.dx) * 2; fy += Math.cos(Date.now() * 0.001 + s.dy) * 2; s.scale += (1.0 - s.scale) * 0.2; } else { s.scale += (1.2 - s.scale) * 0.2; }
        ctx.save(); ctx.translate(fx, fy); ctx.rotate(s.angle); ctx.scale(s.scale, s.scale);
        let dw = s.w, dh = s.h;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.roundRect(-dw / 2 + 4, -dh / 2 + 4, dw, dh, 15); ctx.fill();
        ctx.fillStyle = s.c; ctx.beginPath(); ctx.roundRect(-dw / 2, -dh / 2, dw, dh, 15); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.beginPath(); ctx.roundRect(-dw / 2 + 5, -dh / 2 + 2, dw - 10, dh / 2, 10); ctx.fill();
        ctx.restore();
    });
}

// 3. BUBBLES
function initBubbles() {
    let maxB = Math.min(80, Math.max(25, Math.floor((canvas.width * canvas.height) / 8000)));
    for (let i = 0; i < maxB; i++) {
        let baseHue = getBaseHue();
        let hue = (baseHue + (Math.random() * 30 - 15) + 360) % 360;
        entities.push({
            type: 'b',
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            s: Math.random() * 40 + 15,
            scale: 1.0,
            sp: Math.random() * 1.5 + 0.5,
            w: Math.random() * Math.PI * 2,
            c: `hsla(${hue},70%,70%,0.3)`
        });
    }
}
function spawnBubble() {
    let baseHue = getBaseHue();
    let hue = (baseHue + (Math.random() * 30 - 15) + 360) % 360;
    entities.push({
        type: 'b',
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height + 50,
        s: Math.random() * 40 + 15,
        scale: 0.1,
        sp: Math.random() * 1.5 + 0.5,
        w: Math.random() * Math.PI * 2,
        c: `hsla(${hue},70%,70%,0.3)`
    });
}
function handleBStart(x, y) {
    for (let i = entities.length - 1; i >= 0; i--) {
        let b = entities[i];
        if (b.type === 'b' && Math.sqrt((x - b.x) ** 2 + (y - b.y) ** 2) < b.s + 20) {
            createPop(b.x, b.y, b.c);
            entities.splice(i, 1);
            pulse(10);
            const xr = canvas.width ? (b.x / canvas.width) : 0.5;
            playSFX('pop', xr);
            break;
        }
    }
}
function createPop(x, y, c) { for (let i = 0; i < 8; i++) entities.push({ type: 'p', x, y, vx: Math.cos(Math.PI * 2 * i / 8) * 3, vy: Math.sin(Math.PI * 2 * i / 8) * 3, l: 1, c: c.replace('0.3', '0.8') }); }
function animBubbles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let maxB = Math.min(80, Math.max(25, Math.floor((canvas.width * canvas.height) / 8000)));
    let activity = getActivityLevel();
    let spawnChance = 0.02 + activity * 0.06;
    if (entities.filter(e => e.type === 'b').length < maxB && Math.random() < spawnChance) spawnBubble();
    for (let i = 0; i < entities.length; i++) {
        let e = entities[i];
        if (e.type === 'b') {
            if (e.scale < 1.0) e.scale += 0.05;
            e.y -= e.sp; e.x += Math.sin(e.y * 0.01 + e.w) * 0.5;
            ctx.beginPath(); ctx.arc(e.x, e.y, e.s * e.scale, 0, Math.PI * 2); ctx.fillStyle = e.c; ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 2; ctx.stroke();
            if (e.y < -60) { entities.splice(i, 1); i--; }
        } else {
            e.l -= 0.04; e.x += e.vx; e.y += e.vy;
            if (e.l <= 0) { entities.splice(i, 1); i--; continue; }
            ctx.beginPath(); ctx.arc(e.x, e.y, 3, 0, Math.PI * 2); ctx.fillStyle = e.c; ctx.globalAlpha = e.l; ctx.fill(); ctx.globalAlpha = 1;
        }
    }
}

// 4. LIQUID (V61: Velocity Size + Rainbow)
function spawnLiquid(x, y, speed) {
    let size = Math.min(50, Math.max(10, speed * 1.5));
    let hue = getBaseHue();
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${hue},70%,60%)`;
    ctx.shadowBlur = 40; ctx.shadowColor = ctx.fillStyle;
    ctx.fill(); ctx.shadowBlur = 0;
}
function animLiquid() {
    ctx.fillStyle = 'rgba(5,5,5,0.08)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    let t = Date.now() * 0.002; spawnLiquid(canvas.width / 2 + Math.sin(t) * (canvas.width / 3), canvas.height / 2 + Math.cos(t * 1.3) * (canvas.height / 4), 20);
}

// 5. MARBLES
function initMarbles() {
    for (let i = 0; i < 50; i++) {
        let baseHue = getBaseHue();
        let hue = (baseHue + (Math.random() * 60 - 30) + 360) % 360;
        entities.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - .5) * 2,
            vy: (Math.random() - .5) * 2,
            r: Math.random() * 15 + 15,
            c: `hsl(${hue},60%,60%)`
        });
    }
}
function handleMInput(x, y) {
    entities.forEach(m => {
        let dx = m.x - x, dy = m.y - y, d = Math.sqrt(dx * dx + dy * dy);
        if (d < 200) { let f = (200 - d) / 200, a = Math.atan2(dy, dx); m.vx += Math.cos(a) * f * 2.5; m.vy += Math.sin(a) * f * 2.5; }
    });
}
function animMarbles() {
    const idleMs = Date.now() - lastInteraction;
    const recentlyActive = idleMs < 5000;
    let idleFactor = 0;
    if (!recentlyActive && idleMs > 5000) {
        idleFactor = Math.min(1, (idleMs - 5000) / 15000);
    }
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 + 40;
    ctx.fillStyle = 'rgba(5,5,5,0.3)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < entities.length; i++) {
        let m = entities[i]; m.x += m.vx; m.y += m.vy; m.vx *= 0.98; m.vy *= 0.98;

        if (idleFactor > 0) {
            let dxCenter = centerX - m.x;
            let dyCenter = centerY - m.y;
            m.vx += dxCenter * 0.0005 * idleFactor;
            m.vy += dyCenter * 0.0005 * idleFactor;
        }

        if (m.x < m.r || m.x > canvas.width - m.r) {
            m.vx *= -0.9;
            if (recentlyActive) {
                const xrWall = m.x < m.r ? 0 : 1;
                playSFX('clack', xrWall);
            }
        }
        if (m.y < m.r + 80 || m.y > canvas.height - m.r) {
            m.vy *= -0.9;
            if (recentlyActive) {
                const xr = canvas.width ? (m.x / canvas.width) : 0.5;
                playSFX('clack', xr);
            }
        }

        if (m.x < m.r) m.x = m.r; if (m.x > canvas.width - m.r) m.x = canvas.width - m.r;
        if (m.y < m.r + 80) m.y = m.r + 80; if (m.y > canvas.height - m.r) m.y = canvas.height - m.r;

        for (let j = i + 1; j < entities.length; j++) {
            let m2 = entities[j], dx = m2.x - m.x, dy = m2.y - m.y, d = Math.sqrt(dx * dx + dy * dy), minD = m.r + m2.r;
            if (d < minD) {
                let a = Math.atan2(dy, dx), tx = m.x + Math.cos(a) * minD, ty = m.y + Math.sin(a) * minD;
                let ax = (tx - m2.x) * 0.05, ay = (ty - m2.y) * 0.05; m.vx -= ax; m.vy -= ay; m2.vx += ax; m2.vy += ay;
                if (recentlyActive) {
                    const contactX = (m.x + m2.x) / 2;
                    const xr = canvas.width ? (contactX / canvas.width) : 0.5;
                    playSFX('clack', xr);
                }
            }
        }
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2); ctx.fillStyle = m.c; ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 2; ctx.stroke();
    }
}

// --- NEW GAMES ---
function initRipples() {
    entities = [];
}
function animRipples() {
    ctx.fillStyle = 'rgba(5,5,5,0.2)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = entities.length - 1; i >= 0; i--) {
        let r = entities[i];
        r.radius += r.speed;
        r.opacity -= r.decay;
        if (r.opacity <= 0) {
            entities.splice(i, 1);
            continue;
        }
        ctx.beginPath();
        ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${r.rc},${r.gc},${r.bc},${r.opacity})`;
        ctx.lineWidth = 3;
        ctx.stroke();
    }
}
function spawnRipple(x, y) {
    let baseHue = getBaseHue();
    let hue = (baseHue + (Math.random() * 60 - 30) + 360) % 360;
    let hsla = hslToRgb(hue, 60, 60);
    entities.push({ x, y, radius: 5, speed: 2, opacity: 0.8, decay: 0.015, rc: hsla.r, gc: hsla.g, bc: hsla.b });
}

function initGravity() {
    for (let i = 0; i < 60; i++) {
        let baseHue = getBaseHue();
        let hue = (baseHue + (Math.random() * 60 - 30) + 360) % 360;
        entities.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: 0, vy: 0,
            r: Math.random() * 8 + 4,
            c: `hsl(${hue},60%,60%)`
        });
    }
    entities.gravityTarget = { x: canvas.width / 2, y: canvas.height / 2 };
}
function animGravity() {
    ctx.fillStyle = 'rgba(5,5,5,0.1)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    let target = entities.gravityTarget || { x: canvas.width / 2, y: canvas.height / 2 };
    for (let i = 0; i < entities.length; i++) {
        let p = entities[i];
        let dx = target.x - p.x, dy = target.y - p.y;
        let d = Math.sqrt(dx * dx + dy * dy);
        if (d > 5) {
            let f = Math.min(0.001, 5 / d);
            p.vx += (dx / d) * f * 100;
            p.vy += (dy / d) * f * 100;
        }
        p.vx *= 0.995;
        p.vy *= 0.995;
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < p.r) { p.x = p.r; p.vx *= -0.8; }
        if (p.x > canvas.width - p.r) { p.x = canvas.width - p.r; p.vx *= -0.8; }
        if (p.y < p.r + 80) { p.y = p.r + 80; p.vy *= -0.8; }
        if (p.y > canvas.height - p.r) { p.y = canvas.height - p.r; p.vy *= -0.8; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.c;
        ctx.fill();
    }
}

function initPulse() {
    entities = [];
    for (let i = 0; i < 3; i++) {
        let baseHue = getBaseHue();
        let hue = (baseHue + (Math.random() * 60 - 30) + 360) % 360;
        entities.push({
            x: Math.random() * (canvas.width * 0.6) + canvas.width * 0.2,
            y: Math.random() * (canvas.height * 0.6) + canvas.height * 0.2,
            radius: 20,
            minRadius: 20,
            maxRadius: 120,
            phase: Math.random() * Math.PI * 2,
            c: `hsl(${hue},60%,60%)`
        });
    }
}
function animPulse() {
    ctx.fillStyle = 'rgba(5,5,5,0.15)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < entities.length; i++) {
        let p = entities[i];
        p.phase += 0.03;
        let pulseVal = Math.sin(p.phase) * 0.5 + 0.5;
        p.radius = p.minRadius + (p.maxRadius - p.minRadius) * pulseVal;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.c;
        ctx.globalAlpha = 0.3;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = p.c;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

function initFlow() {
    entities = [];
    for (let i = 0; i < 8; i++) {
        let baseHue = getBaseHue();
        let hue = (baseHue + (Math.random() * 60 - 30) + 360) % 360;
        let line = [];
        for (let j = 0; j < 10; j++) {
            line.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, vx: 0, vy: 0 });
        }
        entities.push({ points: line, c: `hsl(${hue},60%,60%)`, life: 1 });
    }
}
function animFlow() {
    ctx.fillStyle = 'rgba(5,5,5,0.08)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let i = entities.length - 1; i >= 0; i--) {
        let line = entities[i];
        line.life -= 0.004;
        for (let j = 0; j < line.points.length; j++) {
            let pt = line.points[j];
            pt.x += (Math.random() - 0.5) * 3;
            pt.y += (Math.random() - 0.5) * 3;
            if (pt.x < 0) pt.x = canvas.width; if (pt.x > canvas.width) pt.x = 0;
            if (pt.y < 80) pt.y = canvas.height; if (pt.y > canvas.height) pt.y = 80;
        }
        ctx.strokeStyle = line.c;
        ctx.globalAlpha = line.life;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(line.points[0].x, line.points[0].y);
        for (let j = 1; j < line.points.length; j++) {
            ctx.lineTo(line.points[j].x, line.points[j].y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
        if (line.life <= 0) entities.splice(i, 1);
    }
}

function spawnFlow(x, y) {
    let baseHue = getBaseHue();
    let hue = (baseHue + (Math.random() * 60 - 30) + 360) % 360;
    let line = [];
    for (let j = 0; j < 10; j++) {
        line.push({ x: x + (Math.random() - 0.5) * 30, y: y + (Math.random() - 0.5) * 30, vx: 0, vy: 0 });
    }
    entities.push({ points: line, c: `hsl(${hue},60%,60%)`, life: 1 });
}

function initDots() {
    entities = [];
    const spacing = 40;
    const cols = Math.ceil(canvas.width / spacing);
    const rows = Math.ceil((canvas.height - 80) / spacing);
    let baseHue = getBaseHue();
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let hue = (baseHue + (Math.random() * 20 - 10) + 360) % 360;
            const ox = c * spacing + spacing / 2;
            const oy = 80 + r * spacing + spacing / 2;
            entities.push({
                x: ox,
                y: oy,
                ox: ox,
                oy: oy,
                ix: ox, // original target x for resetting
                iy: oy, // original target y for resetting
                active: false,
                hue: hue,
                ihue: hue,
                lastActive: 0
            });
        }
    }
}
function animDots() {
    ctx.fillStyle = 'rgba(5,5,5,0.2)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const spacing = 40;
    const threshold = spacing * 1.5;
    for (let i = 0; i < entities.length; i++) {
        let d = entities[i];
        d.x += (d.ox - d.x) * 0.1;
        d.y += (d.oy - d.y) * 0.1;
    }
    for (let i = 0; i < entities.length; i++) {
        let d1 = entities[i];
        ctx.beginPath();
        ctx.arc(d1.x, d1.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = `hsl(${d1.hue},60%,60%)`;
        ctx.fill();
        for (let j = i + 1; j < entities.length; j++) {
            let d2 = entities[j];
            let dx = d2.x - d1.x, dy = d2.y - d1.y, dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < threshold) {
                ctx.beginPath();
                ctx.moveTo(d1.x, d1.y);
                ctx.lineTo(d2.x, d2.y);
                ctx.strokeStyle = `hsl(${d1.hue},60%,60%)`;
                ctx.globalAlpha = 0.3 * (1 - dist / threshold);
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.globalAlpha = 1;
            }
        }
    }
}

// --- LOOP ---
function animate() {
    if (isSessionRunning && !isPaused) {
        if (currentView === 'particles') animParticles();
        if (currentView === 'sorting') animSorting();
        if (currentView === 'bubbles') animBubbles();
        if (currentView === 'liquid') animLiquid();
        if (currentView === 'marbles') animMarbles();
        if (currentView === 'ripples') animRipples();
        if (currentView === 'gravity') animGravity();
        if (currentView === 'pulse') animPulse();
        if (currentView === 'flow') animFlow();
        if (currentView === 'dots') animDots();
    }
    drawFPS();
    updateFPS();
    requestAnimationFrame(animate);
}

document.getElementById('begin-btn').addEventListener('click', function () {
    document.getElementById('start-screen').style.display = 'none';

    // Generate game list (all 10 if admin mode, else 5 random)
    const allGames = ['particles', 'sorting', 'bubbles', 'liquid', 'marbles', 'ripples', 'gravity', 'pulse', 'flow', 'dots'];
    selectedGames = [];

    if (adminMode) {
        selectedGames = [...allGames];
        console.log('Admin mode: showing all 10 games');
    } else {
        const gamesToSelect = [...allGames];
        while (selectedGames.length < 5 && gamesToSelect.length > 0) {
            const idx = Math.floor(Math.random() * gamesToSelect.length);
            selectedGames.push(gamesToSelect[idx]);
            gamesToSelect.splice(idx, 1);
        }
    }

    // Regenerate nav-bar with selected games
    const navBar = document.getElementById('nav-bar');
    navBar.innerHTML = '';
    selectedGames.forEach((game, idx) => {
        const btn = document.createElement('div');
        btn.className = 'nav-btn' + (idx === 0 ? ' active' : '');
        btn.id = `btn-${game}`;
        btn.onclick = (e) => { switchView(game); };
        btn.ontouchstart = (e) => { switchView(game); };
        btn.innerHTML = GAME_ICONS[game] || '';
        navBar.appendChild(btn);
    });

    navBar.style.display = 'flex';
    setTimeout(() => navBar.style.opacity = 1, 100);
    resize();

    const randomGame = selectedGames[Math.floor(Math.random() * selectedGames.length)];
    switchView(randomGame);
    updateModeLabel();
    isSessionRunning = true;
    initAudio();
    animate();
    startTimer(true);
});

// --- INITIALIZE UI FROM LOADED SETTINGS ---
function initializeSettingsUI() {
    // Update start screen buttons
    document.querySelectorAll('.start-btn.time-btn').forEach(b => {
        b.classList.remove('selected');
        if (b.getAttribute('data-time') == sessionMinutes) b.classList.add('selected');
    });
    document.querySelectorAll('.start-btn.sound-btn').forEach(b => {
        b.classList.remove('selected');
        if (b.getAttribute('data-sound') === currentSound) b.classList.add('selected');
    });
    // Update modal buttons
    document.querySelectorAll('.opt-btn.time-btn').forEach(b => {
        b.classList.remove('selected');
        if (b.getAttribute('data-time') == sessionMinutes) b.classList.add('selected');
    });
    document.querySelectorAll('.opt-btn.sound-btn').forEach(b => {
        b.classList.remove('selected');
        if (b.getAttribute('data-sound') === currentSound) b.classList.add('selected');
    });
    document.querySelectorAll('.sfx-btn').forEach(b => {
        b.classList.remove('selected');
        const shouldBeSelected = (sfxEnabled && b.getAttribute('data-sfx') === 'on') || (!sfxEnabled && b.getAttribute('data-sfx') === 'off');
        if (shouldBeSelected) b.classList.add('selected');
    });
}

// Initialize UI when page loads
document.addEventListener('DOMContentLoaded', initializeSettingsUI);
// Also initialize immediately in case DOM is already loaded
if (document.readyState !== 'loading') {
    initializeSettingsUI();
}

// --- SERVICE WORKER REGISTRATION ---
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(e => {
        console.log('Service Worker registration failed:', e);
    });
}
