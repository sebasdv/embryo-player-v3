/**
 * ============================================================================
 * CONSTANTS & CONFIGURATION
 * ============================================================================
 */

// GitHub Repository Configuration
export const GITHUB_SAMPLES_URL = 'https://raw.githubusercontent.com/sebasdv/embrio-player-v3/master/samples/';
export const GITHUB_VERSION = '?v=' + Date.now(); // Cache busting for fresh samples

// Audio System Configuration
export const FFT_SIZE = 256;                    // Fast Fourier Transform size for visualization
export const BEATS_PER_BAR = 4;                 // Standard 4/4 time signature
export const MIN_BPM = 60;                      // Minimum tempo (60 BPM)
export const MAX_BPM = 200;                     // Maximum tempo (200 BPM)
export const PRE_COUNT_BARS = 1;                // Pre-count bars before recording
export const BAR_COUNT = 4;                     // Total bars in sequence (4-bar loop)

// BPM Control Configuration
export const BPM_LONG_PRESS_DELAY = 200;        // Delay before rapid BPM changes (ms)
export const BPM_RAPID_INTERVAL = 200;          // Interval for rapid BPM changes (ms)

// Quantization System Configuration
export const GRID_RESOLUTION = 16;              // 16th notes per bar (4 beats × 4 subdivisions)
export const GRID_STEPS_PER_BEAT = 4;           // 4 steps per beat (16th notes)
export const QUANTIZE_STRENGTH = 0.5;           // Quantization strength (0.0 = off, 1.0 = full)
export const QUANTIZE_THRESHOLD = 0.125;        // Quantization threshold (in beats)

// Deterministic Scheduler Configuration (Performance Optimization)
export const SCHEDULE_AHEAD_TIME = 0.12;        // Schedule horizon in seconds
export const LOOKAHEAD = 0.025;                 // Scheduler tick interval in seconds

// ============================================================================
// SAMPLE FILES CONFIGURATION
// ============================================================================

// Unified sample files list with bank prefixes (clean names without spaces)
export const allSampleFiles = [
    // Bank A (88 BPM) - 8 samples for electronic/ambient music
    'A_01-Pad_88_BPM.wav',      // Ambient pad
    'A_02-Bass_88_BPM.wav',     // Bass line
    'A_03-Arp_88_BPM.wav',      // Arpeggiated sequence
    'A_04-BD_SN_HH_OH_Slice.wav', // Drum kit slice
    'A_05-Kick_88.wav',         // Kick drum
    'A_06-Snare_88.wav',        // Snare drum
    'A_07-HH_88.wav',           // Hi-hat
    'A_08-Shaker_88.wav',       // Shaker percussion

    // Bank B (135 BPM) - 7 samples for electronic/dance music
    'B_01-FM_Pads_135_BPM.wav', // FM synthesis pads
    'B_02-Reese_Bass_135_BPM.wav', // Reese bass (electronic)
    'B_03-You_are_135_BPM.wav', // Vocal sample
    'B_04-Multi_Drum_135_BPM.wav', // Multi-layered drums
    'B_05-Kick_4-4_135_BPM.wav', // 4/4 kick pattern
    'B_06-Hi_Hats_135_BPM.wav', // Hi-hats pattern
    'B_07-Claps_135_BPM.wav'    // Clap samples
];

/**
 * Utility function to detect bank from filename prefix
 * @param {string} fileName - The filename to analyze
 * @returns {string|null} Bank identifier ('A', 'B') or null if invalid
 */
export function getBankFromFileName(fileName) {
    if (!fileName || typeof fileName !== 'string') return null;

    const firstChar = fileName.charAt(0).toUpperCase();
    if (firstChar === 'A') return 'A';
    if (firstChar === 'B') return 'B';

    return null; // Invalid bank prefix
}
