let ctx: AudioContext | undefined;
let timer: ReturnType<typeof setInterval> | undefined;
let silent = false;
let step = 0;
export function tone(freq: number, duration = 0.2, volume = 0.035) {
  if (!ctx || silent) return;
  const o = ctx.createOscillator(),
    g = ctx.createGain();
  o.type = "sine";
  o.frequency.value = freq;
  g.gain.setValueAtTime(volume, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  o.connect(g).connect(ctx.destination);
  o.start();
  o.stop(ctx.currentTime + duration);
}
export function audioStart(muted: boolean) {
  silent = muted;
  ctx ??= new AudioContext();
  void ctx.resume();
  if (!timer)
    timer = setInterval(() => {
      const notes = [261.63, 329.63, 392, 523.25, 440, 392, 329.63, 293.66];
      tone(notes[step++ % notes.length], 1.5, 0.015);
    }, 650);
}
export function mute(v: boolean) {
  silent = v;
}
export function chime() {
  [523, 659, 784, 1046].forEach((n, i) =>
    setTimeout(() => tone(n, 0.5, 0.045), i * 100),
  );
}
