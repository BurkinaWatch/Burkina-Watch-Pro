const audioContext = typeof window !== 'undefined' ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

export function playNotificationSound() {
  if (!audioContext) return;
  
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  const now = audioContext.currentTime;
  
  const masterGain = audioContext.createGain();
  masterGain.connect(audioContext.destination);
  masterGain.gain.setValueAtTime(0.3, now);

  const notes = [
    { freq: 880, start: 0, duration: 0.1 },
    { freq: 1100, start: 0.1, duration: 0.1 },
    { freq: 1320, start: 0.2, duration: 0.15 },
    { freq: 880, start: 0.4, duration: 0.08 },
    { freq: 1320, start: 0.5, duration: 0.2 },
  ];

  notes.forEach(({ freq, start, duration }) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now + start);
    
    gain.gain.setValueAtTime(0, now + start);
    gain.gain.linearRampToValueAtTime(0.8, now + start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, now + start + duration);
    
    osc.start(now + start);
    osc.stop(now + start + duration + 0.05);
  });
}

export function playPanicSound() {
  if (!audioContext) return;
  
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  const now = audioContext.currentTime;
  
  const masterGain = audioContext.createGain();
  masterGain.connect(audioContext.destination);
  masterGain.gain.setValueAtTime(0.4, now);

  for (let i = 0; i < 3; i++) {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(masterGain);
    
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now + i * 0.3);
    osc.frequency.linearRampToValueAtTime(400, now + i * 0.3 + 0.15);
    
    gain.gain.setValueAtTime(0.6, now + i * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.3 + 0.25);
    
    osc.start(now + i * 0.3);
    osc.stop(now + i * 0.3 + 0.3);
  }
}

export function playSuccessSound() {
  if (!audioContext) return;
  
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }

  const now = audioContext.currentTime;
  
  const masterGain = audioContext.createGain();
  masterGain.connect(audioContext.destination);
  masterGain.gain.setValueAtTime(0.25, now);

  const notes = [
    { freq: 523.25, start: 0, duration: 0.12 },
    { freq: 659.25, start: 0.1, duration: 0.12 },
    { freq: 783.99, start: 0.2, duration: 0.2 },
  ];

  notes.forEach(({ freq, start, duration }) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    
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
