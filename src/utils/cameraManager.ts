/**
 * Camera Hardware Lifecycle & Privacy Guardian
 * 
 * Guarantees that camera hardware is strictly accessed ONLY when explicitly requested,
 * and physically shuts off all MediaStreamTracks (turning off laptop webcam LEDs)
 * immediately upon modal close, tab switch, or unmount.
 */

// Registry of all active MediaStreams created by getUserMedia
const activeStreams = new Set<MediaStream>();
let isGuardianInstalled = false;

/**
 * Installs the Camera Guardian interceptor on navigator.mediaDevices.getUserMedia.
 * Tracks every created MediaStream so no camera hardware track can leak or stay active
 * in the background.
 */
export function installCameraGuardian(): void {
  if (typeof window === 'undefined' || isGuardianInstalled) return;
  if (!navigator?.mediaDevices?.getUserMedia) return;

  try {
    const originalGetUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);

    navigator.mediaDevices.getUserMedia = async function (
      constraints?: MediaStreamConstraints
    ): Promise<MediaStream> {
      const stream = await originalGetUserMedia(constraints);
      if (stream && typeof stream.getTracks === 'function') {
        activeStreams.add(stream);

        // Auto-remove stream from registry when all its tracks finish
        stream.getTracks().forEach((track) => {
          track.addEventListener('ended', () => {
            const allEnded = stream.getTracks().every((t) => t.readyState === 'ended');
            if (allEnded) {
              activeStreams.delete(stream);
            }
          });
        });
      }
      return stream;
    };

    isGuardianInstalled = true;
  } catch (err) {
    console.warn('Could not install camera guardian:', err);
  }
}

/**
 * Forcibly stops all hardware video/audio tracks across all active media streams,
 * completely turning off the laptop webcam light and releasing the hardware device.
 */
export function stopAllCameraHardware(): void {
  // 1. Forcibly stop every tracked MediaStream
  activeStreams.forEach((stream) => {
    try {
      if (stream && typeof stream.getTracks === 'function') {
        stream.getTracks().forEach((track) => {
          try {
            track.stop();
            track.enabled = false;
          } catch {}
        });
      }
    } catch {}
  });
  activeStreams.clear();

  // 2. Locate all <video> elements in the DOM and kill their attached streams
  if (typeof document !== 'undefined') {
    try {
      const videoElements = document.querySelectorAll('video');
      videoElements.forEach((video) => {
        try {
          const stream = video.srcObject as MediaStream | null;
          if (stream && typeof stream.getTracks === 'function') {
            stream.getTracks().forEach((track) => {
              try {
                track.stop();
                track.enabled = false;
              } catch {}
            });
          }
          video.srcObject = null;
          video.pause();
          video.removeAttribute('src');
          video.load();
        } catch {}
      });
    } catch {}
  }
}

/**
 * Checks if any camera stream is currently active.
 */
export function isAnyCameraActive(): boolean {
  for (const stream of activeStreams) {
    const hasLiveTracks = stream.getTracks().some((t) => t.readyState === 'live');
    if (hasLiveTracks) return true;
  }
  return false;
}

