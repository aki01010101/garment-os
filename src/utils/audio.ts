/**
 * Web Audio API scanner beep sound generator.
 * Produces crisp, pleasant retail barcode scanner feedback without external audio files.
 */
let audioCtx: AudioContext | null = null;

export function playBarcodeBeep() {
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }

    if (!audioCtx) return;

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sine';
    // 1750 Hz standard barcode scanner tone
    osc.frequency.setValueAtTime(1750, audioCtx.currentTime);

    // Fast 70ms chime
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.07);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.07);
  } catch (e) {
    // Audio context may be restricted by autoplay policy until user gesture
  }
}
