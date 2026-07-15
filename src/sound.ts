// Проста синтезована звукова хвиля (без зовнішніх файлів)
function playTone(ctx: AudioContext, freq: number, duration: number, type: OscillatorType, volume: number, when?: number) {
  when = when || 0;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  const t0 = ctx.currentTime + when;
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.linearRampToValueAtTime(volume, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.02);
}

// Кудкудакання: короткі сплески фільтрованого шуму ("ко-ко")
function playCluck(ctx: AudioContext, when?: number) {
  when = when || 0;
  const clucks = 2;
  for (let i = 0; i < clucks; i++) {
    const dur = 0.09;
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let j = 0; j < bufferSize; j++) {
      data[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / bufferSize, 2);
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 850 + Math.random() * 400;
    filter.Q.value = 1.3;
    const gain = ctx.createGain();
    gain.gain.value = 0.3;
    noise.connect(filter).connect(gain).connect(ctx.destination);
    const t0 = ctx.currentTime + when + i * 0.1;
    noise.start(t0);
    noise.stop(t0 + dur);
  }
}
