let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

export function playNotificationSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(0.35, now);
  masterGain.gain.linearRampToValueAtTime(0, now + 1.2);

  const notes = [
    { freq: 587.33, start: 0, duration: 0.15, type: 'sine' as OscillatorType },
    { freq: 784.0, start: 0.12, duration: 0.15, type: 'sine' as OscillatorType },
    { freq: 1046.5, start: 0.25, duration: 0.25, type: 'sine' as OscillatorType },
  ];

  notes.forEach(({ freq, start, duration, type }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(masterGain);

    osc.type = type;
    osc.frequency.setValueAtTime(freq, now + start);

    gain.gain.setValueAtTime(0, now + start);
    gain.gain.linearRampToValueAtTime(0.7, now + start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.01, now + start + duration);

    osc.start(now + start);
    osc.stop(now + start + duration + 0.1);
  });
}

export function playAlertSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(0.4, now);

  const notes = [
    { freq: 880, start: 0, duration: 0.12 },
    { freq: 1100, start: 0.1, duration: 0.12 },
    { freq: 880, start: 0.22, duration: 0.12 },
    { freq: 1100, start: 0.32, duration: 0.2 },
  ];

  notes.forEach(({ freq, start, duration }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(masterGain);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + start);

    gain.gain.setValueAtTime(0, now + start);
    gain.gain.linearRampToValueAtTime(0.8, now + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, now + start + duration);

    osc.start(now + start);
    osc.stop(now + start + duration + 0.05);
  });
}

export function playPanicSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(0.5, now);

  for (let i = 0; i < 4; i++) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(masterGain);

    osc.type = 'square';
    osc.frequency.setValueAtTime(900, now + i * 0.25);
    osc.frequency.linearRampToValueAtTime(450, now + i * 0.25 + 0.12);

    gain.gain.setValueAtTime(0.7, now + i * 0.25);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.25 + 0.2);

    osc.start(now + i * 0.25);
    osc.stop(now + i * 0.25 + 0.25);
  }
}

export function playSuccessSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(0.3, now);

  const notes = [
    { freq: 523.25, start: 0, duration: 0.12 },
    { freq: 659.25, start: 0.1, duration: 0.12 },
    { freq: 783.99, start: 0.2, duration: 0.25 },
  ];

  notes.forEach(({ freq, start, duration }) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(masterGain);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now + start);

    gain.gain.setValueAtTime(0, now + start);
    gain.gain.linearRampToValueAtTime(0.7, now + start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.01, now + start + duration);

    osc.start(now + start);
    osc.stop(now + start + duration + 0.05);
  });
}

export function playMessageSound() {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  const masterGain = ctx.createGain();
  masterGain.connect(ctx.destination);
  masterGain.gain.setValueAtTime(0.25, now);

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(masterGain);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(1200, now);
  osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);

  gain.gain.setValueAtTime(0.6, now);
  gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

  osc.start(now);
  osc.stop(now + 0.25);
}
