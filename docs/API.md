# API Reference - Embryo Player v3.0

Complete technical documentation for the Embryo Player API, classes, and methods.

## Table of Contents

- [Core Classes](#core-classes)
- [Audio System](#audio-system)
- [Sequencer System](#sequencer-system)
- [Sample Management](#sample-management)
- [Effects System](#effects-system)
- [Input Handling](#input-handling)
- [Utility Functions](#utility-functions)
- [Configuration](#configuration)

---

## Core Classes

### **EmbrioPlayer Class**

The main application class that orchestrates all functionality.

#### **Constructor**
```javascript
new EmbrioPlayer()
```

#### **Properties**
| Property | Type | Description |
|----------|------|-------------|
| `audioContext` | `AudioContext` | Web Audio API context |
| `samples` | `Object` | Map of loaded audio samples |
| `activeSources` | `Object` | Currently playing audio sources |
| `bpm` | `number` | Current tempo in BPM |
| `currentBank` | `string` | Active sample bank ('A', 'B', 'C', 'D') |
| `isRecording` | `boolean` | Recording state |
| `isPlaying` | `boolean` | Playback state |
| `performanceMode` | `boolean` | Performance optimization mode |

#### **Core Methods**

##### **Audio Initialization**
```javascript
async initAudio()
```
Initializes the Web Audio API system and prepares the player.

**Returns:** `Promise<void>`

**Throws:** `Error` if audio context cannot be created

---

##### **Sample Management**
```javascript
loadAllSamples()
```
Auto-loads GitHub samples into banks A and B.

**Returns:** `Promise<Array>`

---

```javascript
loadUserSample(padNumber, bank, file)
```
Loads a user-provided audio file into a specific pad.

**Parameters:**
- `padNumber` (number): Target pad (1-16)
- `bank` (string): Bank identifier ('A', 'B', 'C', 'D')
- `file` (File): Audio file to load

**Returns:** `Promise<void>`

---

##### **Playback Control**
```javascript
playPad(padNumber, when = 0, offset = 0, duration = undefined)
```
Plays audio from a specific pad with timeline support.

**Parameters:**
- `padNumber` (number): Pad to play (1-16)
- `when` (number): When to start (audio timeline)
- `offset` (number): Offset within sample
- `duration` (number): Duration to play

---

```javascript
stopPadIfPlaying(padNumber)
```
Stops audio playback for a specific pad.

**Parameters:**
- `padNumber` (number): Pad to stop (1-16)

---

##### **Sequencer Control**
```javascript
startRecording()
```
Begins recording a new sequence with metronome count-in.

**Throws:** `Error` if audio not initialized

---

```javascript
playSequence()
```
Starts playing the recorded sequence with deterministic scheduler.

---

```javascript
stopAll()
```
Stops all audio, sequences, and resets system state.

**Returns:** `Promise<void>`

---

### **PadController Class**

Handles all pad interactions including mouse, touch, keyboard, and MIDI.

#### **Constructor**
```javascript
new PadController(embryoPlayer)
```

**Parameters:**
- `embryoPlayer` (EmbrioPlayer): Reference to main player instance

#### **Methods**

##### **Pad Triggering**
```javascript
triggerPad(padNumber, velocity, source)
```
Unified method to trigger any pad from any input source.

**Parameters:**
- `padNumber` (number): Pad to trigger (1-16)
- `velocity` (number): Trigger velocity (0-127)
- `source` (string): Input source ('mouse', 'touch', 'keyboard', 'MIDI')

---

##### **Input Management**
```javascript
setMIDIAvailable(available)
```
Updates MIDI connection status.

**Parameters:**
- `available` (boolean): MIDI availability status

---

```javascript
getKeyForPad(padNumber)
```
Returns the keyboard key mapped to a specific pad.

**Parameters:**
- `padNumber` (number): Pad number (1-16)

**Returns:** `string` - Mapped keyboard key

---

### **BPMController Class**

Manages tempo control, BPM changes, and tap tempo functionality.

#### **Constructor**
```javascript
new BPMController(embryoPlayer)
```

**Parameters:**
- `embryoPlayer` (EmbrioPlayer): Reference to main player instance

#### **Methods**

##### **Tempo Control**
```javascript
changeBPM(direction)
```
Changes the current BPM by the specified amount.

**Parameters:**
- `direction` (number): Amount to change (+1 for increase, -1 for decrease)

---

```javascript
handleTapTempo()
```
Processes tap tempo input and calculates new BPM.

---

---

## Audio System

### **Audio Context Configuration**

```javascript
const audioContextOptions = {
    latencyHint: 'interactive',  // Minimum latency for real-time interaction
    sampleRate: 44100            // Standard sample rate for compatibility
};
```

### **Pre-created Audio Nodes**

The system pre-creates audio nodes for minimum latency:

```javascript
// Pre-created analysers for each pad
this.preCreatedAnalysers = {};
for (let i = 1; i <= 16; i++) {
    this.preCreatedAnalysers[i] = this.audioContext.createAnalyser();
    this.preCreatedAnalysers[i].fftSize = 256;
    this.preCreatedAnalysers[i].smoothingTimeConstant = 0.3;
}

// Pre-created gain nodes for each pad
this.preCreatedGains = {};
for (let i = 1; i <= 16; i++) {
    this.preCreatedGains[i] = this.audioContext.createGain();
    this.preCreatedGains[i].gain.setValueAtTime(1.0, this.audioContext.currentTime);
}
```

### **Audio Source Creation**

```javascript
createAudioSource(padNumber)
```

Creates optimized audio sources with timeline support for non-destructive slicing.

---

## Sequencer System

### **Deterministic Scheduler**

The sequencer uses a deterministic musical scheduler for precise timing:

```javascript
const SCHEDULE_AHEAD_TIME = 0.12;  // Schedule horizon in seconds
const LOOKAHEAD = 0.025;           // Scheduler tick interval in seconds
```

### **Scheduler Methods**

#### **Start Sequence**
```javascript
startSequence()
```
Initiates the deterministic musical scheduler for sequence playback.

#### **Scheduler Tick**
```javascript
schedulerTick()
```
Main scheduler loop that processes scheduled events and advances timeline.

#### **Event Scheduling**
```javascript
triggerScheduled(ev, when)
```
Executes scheduled events with automatic bank switching.

**Parameters:**
- `ev` (Object): Event object with pad and bank information
- `when` (number): When to trigger the event (audio timeline)

---

## Sample Management

### **Sample Loading**

#### **GitHub Auto-loading**
```javascript
loadAllSamples()
```
Automatically loads pre-configured samples from GitHub repository.

**Sample Structure:**
```
samples/
├── A_*.wav    # Bank A samples (88 BPM)
└── B_*.wav    # Bank B samples (135 BPM)
```

#### **User Sample Loading**
```javascript
loadUserSample(padNumber, bank, file)
```
Loads user-provided audio files with validation and error handling.

### **Sample Slicing**

#### **Non-destructive Slicing**
```javascript
createSlices(sourceBuffer, numSlices)
```
Creates slice objects with buffer references and timing offsets.

**Parameters:**
- `sourceBuffer` (AudioBuffer): Source audio buffer
- `numSlices` (number): Number of slices to create

**Returns:** `Array` of slice objects

#### **Slice Distribution**
```javascript
distributeSlices(slices, startPadNumber)
```
Distributes slice objects across available empty pads.

---

## Effects System

### **Master Effects Chain**

The effects chain processes audio in this order:
```
Input → Master Gain → Low-pass Filter → Distortion → Output
```

### **Effects Configuration**

```javascript
this.effectsValues = {
    volume: 100,      // Master volume (0-100%)
    filter: 50,       // Filter cutoff (0-100%)
    distortion: 0,    // Distortion intensity (0-100%)
    resonance: 5      // Filter resonance (0-100%)
};
```

### **Effects Methods**

#### **Apply Master Effect**
```javascript
applyMasterEffect(sliderId, value)
```
Processes slider input and applies corresponding audio effects.

**Parameters:**
- `sliderId` (string): Slider identifier
- `value` (number): Effect value (0-100)

#### **Update Distortion**
```javascript
updateDistortionIntensity(value)
```
Updates distortion curve and gain settings based on intensity value.

---

## Input Handling

### **Multi-input System**

The system supports multiple input methods simultaneously:

- **Mouse**: Click and drag operations
- **Touch**: Touch events for mobile devices
- **Keyboard**: Complete mapping (QWER/ASDF/ZXCV/1234)
- **MIDI**: External controller support

### **Keyboard Mapping**

```
Top Row:     1 2 3 4
Upper Middle: Q W E R
Lower Middle: A S D F
Bottom Row:   Z X C V
```

### **MIDI Integration**

```javascript
onMIDIMessage(message)
```
Processes incoming MIDI messages and triggers corresponding pads.

**MIDI Support:**
- **Channels**: All MIDI channels (OMNI mode)
- **Notes**: Note-on messages trigger pads
- **Velocity**: Velocity affects pad response

---

## Utility Functions

### **Bank Management**

```javascript
selectBank(bank)
```
Switches to the specified sample bank.

**Parameters:**
- `bank` (string): Bank identifier ('A', 'B', 'C', 'D')

### **Pad Management**

```javascript
updatePadBankIndicators()
```
Updates visual indicators showing which pads have samples loaded.

### **File Validation**

```javascript
validateAudioFile(file)
```
Validates audio file format, size, and browser compatibility.

**Returns:** `boolean` - True if file is valid

---

## Configuration

### **Constants**

```javascript
// Audio System
const FFT_SIZE = 256;                    // FFT size for visualization
const BEATS_PER_BAR = 4;                 // Standard 4/4 time signature
const MIN_BPM = 60;                      // Minimum tempo
const MAX_BPM = 200;                     // Maximum tempo

// Sequencer
const PRE_COUNT_BARS = 1;                // Pre-count bars before recording
const BAR_COUNT = 4;                     // Total bars in sequence

// BPM Control
const BPM_LONG_PRESS_DELAY = 200;        // Delay before rapid changes (ms)
const BPM_RAPID_INTERVAL = 200;          // Interval for rapid changes (ms)

// Quantization
const GRID_RESOLUTION = 16;              // 16th notes per bar
const GRID_STEPS_PER_BEAT = 4;           // 4 steps per beat
const QUANTIZE_STRENGTH = 0.5;           // Default quantization strength

// Scheduler
const SCHEDULE_AHEAD_TIME = 0.12;        // Schedule horizon (seconds)
const LOOKAHEAD = 0.025;                 // Scheduler tick interval (seconds)
```

### **Performance Settings**

```javascript
// Performance mode configuration
this.performanceMode = true;              // Enable performance optimizations
this.logThrottleInterval = 250;          // Terminal logging throttle (ms)
```

---

## Error Handling

### **Common Errors**

#### **Audio Context Errors**
```javascript
try {
    await this.initAudio();
} catch (error) {
    if (error.name === 'NotAllowedError') {
        this.logToTerminal('Audio access denied. Please allow audio permissions.', 'error');
    } else {
        this.logToTerminal('Audio initialization failed: ' + error.message, 'error');
    }
}
```

#### **Sample Loading Errors**
```javascript
try {
    await this.loadUserSample(padNumber, bank, file);
} catch (error) {
    if (error.name === 'EncodingError') {
        this.logToTerminal('Unsupported audio format or corrupted file.', 'error');
    } else if (error.name === 'NotSupportedError') {
        this.logToTerminal('Audio format not supported by browser.', 'error');
    }
}
```

---

## Browser Compatibility

### **Web Audio API Support**
- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Mobile**: Touch-optimized interface

### **Web MIDI API Support**
- **Chrome/Edge**: Full support
- **Firefox**: Requires user gesture
- **Safari**: Limited support
- **Mobile**: Not supported

---

## Performance Tips

### **Optimization Strategies**

1. **Use Performance Mode**: Automatically enabled for optimal latency
2. **Pre-created Nodes**: Audio nodes are created in advance
3. **Throttled Logging**: Terminal updates are throttled for smooth operation
4. **Asynchronous Operations**: DOM updates don't block audio processing

### **Memory Management**

```javascript
// Clean up audio sources
stopPadIfPlaying(padNumber);

// Clear visualizers
if (this.visualizers[padNumber]) {
    cancelAnimationFrame(this.visualizers[padNumber]);
    delete this.visualizers[padNumber];
}
```

---

## Examples

### **Basic Usage**

```javascript
// Initialize player
const player = new EmbrioPlayer();

// Start audio system
await player.initAudio();

// Load samples
await player.loadAllSamples();

// Play a pad
player.playPad(1);

// Record a sequence
player.startRecording();
```

### **Advanced Usage**

```javascript
// Custom effects configuration
player.applyMasterEffect('slider-1', 80);  // Volume 80%
player.applyMasterEffect('slider-2', 25);  // Distortion 25%
player.applyMasterEffect('slider-3', 75);  // Filter 75%
player.applyMasterEffect('slider-4', 30);  // Resonance 30%

// Quantization control
player.cycleQuantizeConsolidated();  // Cycle through quantization levels

// Sample slicing
player.showPadSelectorForSlicer();   // Activate slicer mode
```

---

## Related Documentation

- **[Performance Guide](PERFORMANCE.md)** - Detailed performance optimizations
- **[Sample Management](SAMPLES.md)** - Working with audio samples
- **[README](../README.md)** - Project overview and quick start

---

*For additional support, see the [GitHub Issues](https://github.com/sebasdv/embrio-player-v3/issues) page.*
