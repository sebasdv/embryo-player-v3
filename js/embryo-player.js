         * ============================================================================
                          * EMBRYO PLAYER v3.0
         * ============================================================================
         * 
         * @version 3.0.0
         * @author [Tu nombre]
         * @license MIT
         * @description Professional Web Sampler & Sequencer with Advanced Audio Features
         * 
         * ============================================================================
         * FEATURES & CAPABILITIES
         * ============================================================================
         * 
         * AUDIO SYSTEM:
         * - Web Audio API optimized for minimum latency
         * - Pre-created audio nodes for instant response
         * - Master effects chain (Volume, Distortion, Filter, Resonance)
         * - Non-destructive sample slicing
         * - Multi-format audio support with validation
         * 
         * 🎛️ SEQUENCER:
         * - Deterministic musical scheduler (look-ahead + horizon)
         * - Timeline-based playback (source.start(when, offset, duration))
         * - Timeline-based metronome (no setTimeout)
         * - Configurable quantization system (0% to 100% strength)
         * - 4-bar recording with automatic looping
         * 
         * 🎹 INPUT METHODS:
         * - Multi-input system (Mouse + Touch + Keyboard + MIDI)
         * - Complete keyboard mapping (QWER/ASDF/ZXCV/1234)
         * - Long press BPM control (rapid changes every 200ms)
         * - Tap tempo functionality
         * - Active input method indicators
         * 
         * 🎨 USER INTERFACE:
         * - GameBoy-inspired retro aesthetic
         * - Enhanced visual feedback for all interactions
         * - Responsive design for mobile and desktop
         * - Unified pad control system
         * - Performance mode with auto-switching
         * 
         * ============================================================================
         * PERFORMANCE OPTIMIZATIONS IMPLEMENTED
         * ============================================================================
         * Deterministic musical scheduler (look-ahead + horizon)
         * Timeline-based audio playback (source.start(when, offset, duration))
         * Timeline-based metronome (no setTimeout delays)
         * Terminal logging throttle in performance mode
         * Non-destructive sample slicing (no buffer copying)
         * Audio format compatibility with canPlayType()
         * Enhanced resource management and cleanup
         * Pre-created audio nodes for minimum latency
         * Auto-switching performance modes
         */
        
        // ============================================================================
        // CONSTANTS & CONFIGURATION
        // ============================================================================
        
        // GitHub Repository Configuration
        const GITHUB_SAMPLES_URL = 'https://raw.githubusercontent.com/sebasdv/embrio-player-v3/master/samples/';
        const GITHUB_VERSION = '?v=' + Date.now(); // Cache busting for fresh samples
        
        // Audio System Configuration
        const FFT_SIZE = 256;                    // Fast Fourier Transform size for visualization
        const BEATS_PER_BAR = 4;                 // Standard 4/4 time signature
        const MIN_BPM = 60;                      // Minimum tempo (60 BPM)
        const MAX_BPM = 200;                     // Maximum tempo (200 BPM)
        const PRE_COUNT_BARS = 1;                // Pre-count bars before recording
        const BAR_COUNT = 4;                     // Total bars in sequence (4-bar loop)
        
        // BPM Control Configuration
        const BPM_LONG_PRESS_DELAY = 200;        // Delay before rapid BPM changes (ms)
        const BPM_RAPID_INTERVAL = 200;          // Interval for rapid BPM changes (ms)
        
        // Quantization System Configuration
        const GRID_RESOLUTION = 16;              // 16th notes per bar (4 beats × 4 subdivisions)
        const GRID_STEPS_PER_BEAT = 4;           // 4 steps per beat (16th notes)
        const QUANTIZE_STRENGTH = 0.5;           // Quantization strength (0.0 = off, 1.0 = full)
        const QUANTIZE_THRESHOLD = 0.125;        // Quantization threshold (in beats)
        
        // Deterministic Scheduler Configuration (Performance Optimization)
        const SCHEDULE_AHEAD_TIME = 0.12;        // Schedule horizon in seconds
        const LOOKAHEAD = 0.025;                 // Scheduler tick interval in seconds

        // ============================================================================
        // SAMPLE FILES CONFIGURATION
        // ============================================================================
        
        // Unified sample files list with bank prefixes (clean names without spaces)
        const allSampleFiles = [
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
        function getBankFromFileName(fileName) {
            if (!fileName || typeof fileName !== 'string') return null;
            
            const firstChar = fileName.charAt(0).toUpperCase();
            if (firstChar === 'A') return 'A';
            if (firstChar === 'B') return 'B';
            
            return null; // Invalid bank prefix
        }
        
        // ============================================================================
        // CORE CLASSES
        // ============================================================================
        
        /**
         * Pad Controller Class - Unified Input Control System
         * 
         * @class PadController
         * @description Handles all pad interactions including mouse, touch, keyboard, and MIDI
         * 
         * @property {EmbrioPlayer} embryoPlayer - Reference to main player instance
         * @property {Map} pads - Map of pad elements and their states
         * @property {boolean} midiAvailable - MIDI connection status
         * @property {Object} keyToPad - Keyboard mapping configuration
         * @property {Set} pressedKeys - Currently pressed keyboard keys
         * 
         * @example
         * const padController = new PadController(embryoPlayer);
         * padController.triggerPad(1, 127, 'keyboard');
         */
        class PadController {
            constructor(embryoPlayer) {
                this.embryoPlayer = embryoPlayer;
                this.pads = new Map();
                this.midiAvailable = false;
                
                        // NEW: Key mapping to pads (customizable)
        this.keyToPad = {
            // Top row: 1234
            '1': 1, '2': 2, '3': 3, '4': 4,
            // Upper middle row: QWER
            'q': 5, 'w': 6, 'e': 7, 'r': 8,
            // Lower middle row: ASDF
            'a': 9, 's': 10, 'd': 11, 'f': 12,
            // Bottom row: ZXCV
            'z': 13, 'x': 14, 'c': 15, 'v': 16
        };
                
                this.pressedKeys = new Set();
                this.init();
            }
            
            init() {
                this.setupKeyboardControl();
                this.updateInputStatus();
            }
            
            // Unified method to trigger any pad
            triggerPad(padNumber, velocity, source) {
                velocity = velocity || 127;
                source = source || 'unknown';
                console.log('Pad ' + padNumber + ' triggered from ' + source + ' - Velocity: ' + velocity);
                
                // Play sample
                this.embryoPlayer.playPad(padNumber);
                
                // Unified visual feedback
                this.showPadFeedback(padNumber);
            }
            
            // Feedback visual para pads
            showPadFeedback(padNumber) {
                const padElement = document.querySelector('.pad[data-number="' + padNumber + '"]');
                if (padElement) {
                    padElement.classList.add('pad-active');
                    setTimeout(function() {
                        padElement.classList.remove('pad-active');
                    }, 150);
                }
            }
            
            // Setup keyboard control
            setupKeyboardControl() {
                const self = this;
                
                document.addEventListener('keydown', function(e) {
                    const key = e.key.toLowerCase();
                    
                    // Avoid repetition if key is held down
                    if (self.pressedKeys.has(key)) return;
                    
                    // Only process if not a text input
                    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
                    
                    self.pressedKeys.add(key);
                    
                    // NEW: ESC key to exit edit mode
                    if (key === 'escape') {
                        e.preventDefault();
                        if (self.isEditMode) {
                            self.exitEditMode();
                        }
                        return;
                    }
                    
                    if (self.keyToPad[key]) {
                        e.preventDefault();
                        self.triggerPad(self.keyToPad[key], 127, 'keyboard');
                    }
                });
                
                document.addEventListener('keyup', function(e) {
                    const key = e.key.toLowerCase();
                    self.pressedKeys.delete(key);
                });
                
                // Clear pressed keys when window loses focus
                window.addEventListener('blur', function() {
                    self.pressedKeys.clear();
                });
                
                // NEW: Click outside to exit edit mode
                document.addEventListener('click', function(e) {
                    if (self.isEditMode && !e.target.closest('.pad') && !e.target.closest('#edit-sample')) {
                        self.exitEditMode();
                    }
                });
            }
            
            // Setup MIDI connection
            setMIDIAvailable(available) {
                this.midiAvailable = available;
                this.updateInputStatus();
            }
            
            // Update input methods indicator
            updateInputStatus() {
                const statusDiv = document.getElementById('input-status');
                const methods = [];
                
                methods.push('[MOUSE] Mouse/Touch');
                methods.push('[KEY] Keyboard');
                
                if (this.midiAvailable) {
                    methods.push('[MIDI] MIDI (connected)');
                } else {
                    methods.push('[MIDI] MIDI (disconnected)');
                }
                
                statusDiv.innerHTML = 'Active methods: ' + methods.join(' • ');
            }
            
            // Obtener tecla para un pad específico
            getKeyForPad(padNumber) {
                for (const key in this.keyToPad) {
                    if (this.keyToPad[key] === padNumber) {
                        return key.toUpperCase();
                    }
                }
                return '';
            }
        }

        /**
         * BPM Controller Class - Tempo Management System
         * 
         * @class BPMController
         * @description Handles tempo control, BPM changes, and tap tempo functionality
         * 
         * @property {EmbrioPlayer} embryoPlayer - Main player instance
         * @property {number} longPressTimer - Timer for long press functionality
         * @property {number} rapidTimer - Timer for rapid BPM changes
         * @property {boolean} isLongPressing - Long press state indicator
         * @property {Array<number>} tapTimes - Array of tap timestamps for tap tempo calculation
         * @property {number} maxTaps - Maximum number of taps to consider for BPM calculation
         * 
         * @example
         * const bpmController = new BPMController(embryoPlayer);
         * bpmController.changeBPM(1);        // Increase BPM by 1
         * bpmController.handleTapTempo();    // Handle tap tempo input
         */
        class BPMController {
            constructor(embryoPlayer) {
                this.embryoPlayer = embryoPlayer;
                this.longPressTimer = null;
                this.rapidTimer = null;
                this.isLongPressing = false;
                this.tapTimes = [];
                this.maxTaps = 4;
                this.init();
            }
            
            init() {
                this.setupBPMButtons();
            }
            
            // Setup BPM buttons with long press
            setupBPMButtons() {
                const bpmUpBtn = document.getElementById('tempo-up');
                const bpmDownBtn = document.getElementById('tempo-down');
                const tapTempoBtn = document.getElementById('tempo-display');
                
                // BPM increase button
                this.setupBPMButton(bpmUpBtn, 1);
                
                // BPM decrease button
                this.setupBPMButton(bpmDownBtn, -1);
                
                // Tap tempo button
                this.setupTapTempoButton(tapTempoBtn);
            }
            
            // Setup individual BPM button
            setupBPMButton(button, direction) {
                const self = this;
                
                // Mouse events
                button.addEventListener('mousedown', function(e) {
                    e.preventDefault();
                    self.startBPMLongPress(direction, button);
                });
                
                button.addEventListener('mouseup', function(e) {
                    e.preventDefault();
                    self.stopBPMLongPress(button);
                });
                
                button.addEventListener('mouseleave', function(e) {
                    self.stopBPMLongPress(button);
                });
                
                // Touch events
                button.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    self.startBPMLongPress(direction, button);
                });
                
                button.addEventListener('touchend', function(e) {
                    e.preventDefault();
                    self.stopBPMLongPress(button);
                });
                
                button.addEventListener('touchcancel', function(e) {
                    e.preventDefault();
                    self.stopBPMLongPress(button);
                });
            }
            
            // Setup tap tempo button
            setupTapTempoButton(button) {
                const self = this;
                
                // Mouse events
                button.addEventListener('click', function(e) {
                    e.preventDefault();
                    self.handleTapTempo();
                });
                
                // Touch events
                button.addEventListener('touchstart', function(e) {
                    e.preventDefault();
                    self.handleTapTempo();
                });
            }
            
            // Start BPM long press
            startBPMLongPress(direction, button) {
                const self = this;
                
                // Immediate change (single click)
                this.changeBPM(direction);
                
                // Start long press after delay
                this.longPressTimer = setTimeout(function() {
                    self.isLongPressing = true;
                    button.classList.add('long-pressing');
                    
                    // Rapid changes every specified interval
                    self.rapidTimer = setInterval(function() {
                        if (self.isLongPressing) {
                            self.changeBPM(direction);
                        } else {
                            clearInterval(self.rapidTimer);
                            self.rapidTimer = null;
                        }
                    }, BPM_RAPID_INTERVAL);
                }, BPM_LONG_PRESS_DELAY);
            }
            
            // Stop BPM long press
            stopBPMLongPress(button) {
                if (this.longPressTimer) {
                    clearTimeout(this.longPressTimer);
                    this.longPressTimer = null;
                }
                
                if (this.rapidTimer) {
                    clearInterval(this.rapidTimer);
                    this.rapidTimer = null;
                }
                
                this.isLongPressing = false;
                button.classList.remove('long-pressing');
            }
            
            // Change BPM
            changeBPM(direction) {
                this.embryoPlayer.changeTempo(direction);
            }
            
            // Handle tap tempo
            handleTapTempo() {
                const now = Date.now();
                const button = document.getElementById('tempo-display');
                
                // Add visual feedback
                button.classList.add('tapping');
                
                // Add current tap time
                this.tapTimes.push(now);
                
                // Keep only the last maxTaps taps
                if (this.tapTimes.length > this.maxTaps) {
                    this.tapTimes.shift();
                }
                
                // Calculate BPM if we have at least 2 taps
                if (this.tapTimes.length >= 2) {
                    const intervals = [];
                    for (let i = 1; i < this.tapTimes.length; i++) {
                        intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
                    }
                    
                    // Calculate average interval in milliseconds
                    const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
                    
                    // Convert to BPM (60000ms / interval = BPM)
                    const newBPM = Math.round(60000 / avgInterval);
                    
                    // Clamp to valid BPM range
                    const clampedBPM = Math.max(MIN_BPM, Math.min(MAX_BPM, newBPM));
                    
                    // Update BPM if it's different
                    if (clampedBPM !== this.embryoPlayer.bpm) {
                        const oldBPM = this.embryoPlayer.bpm;
                        this.embryoPlayer.bpm = clampedBPM;
                        this.embryoPlayer.updateTempoDisplay();
                        this.embryoPlayer.logToTerminal(`Tap tempo: ${clampedBPM} BPM`, 'info');
                        
                        // NEW: Recalculate sequence timing if we have a recorded sequence
                        if (this.embryoPlayer.hasRecordedSequence()) {
                            this.embryoPlayer.recalculateSequenceTiming(oldBPM, clampedBPM);
                        }
                    }
                }
                
                // Remove visual feedback after a short delay
                setTimeout(() => {
                    button.classList.remove('tapping');
                }, 150);
                
                // Clear old taps after 3 seconds of inactivity
                setTimeout(() => {
                    if (this.tapTimes.length > 0 && Date.now() - this.tapTimes[this.tapTimes.length - 1] > 3000) {
                        this.tapTimes = [];
                    }
                }, 3000);
            }
        }



        /**
         * Main Player Class - Core Application Logic
         * 
         * @class EmbrioPlayer
         * @description Handles the main player logic, including audio, sequencer, UI, and all core functionality
         * 
         * @property {AudioContext} audioContext - Web Audio API audio context
         * @property {Object} samples - Map of loaded audio samples
         * @property {Object} activeSources - Currently playing audio sources
         * @property {Object} visualizers - Audio visualization components
         * @property {Set} touchedPads - Currently touched/active pads
         * @property {boolean} isAudioInitialized - Audio system initialization state
         * @property {boolean} isRecording - Sequence recording state
         * @property {boolean} isPlaying - Sequence playback state
         * @property {number} bpm - Current tempo in BPM
         * @property {number} currentBar - Current bar position (0-3)
         * @property {number} currentBeat - Current beat position (1-4)
         * @property {Array} sequence - Recorded sequence data structure
         * @property {Object} bankSamples - Samples organized by bank (A, B, C, D)
         * @property {Object} sampleNames - Sample names organized by bank
         * @property {boolean} slicerMode - Sample slicer mode state
         * @property {boolean} quantizeMode - Quantization system state
         * @property {boolean} performanceMode - Performance optimization mode
         * 
         * @example
         * const player = new EmbrioPlayer();
         * await player.initAudio();
         * player.loadAllSamples();
         */
        class EmbrioPlayer {
            constructor() {
                // Audio
                this.audioContext = null;
                this.samples = {
                    'A': {}, 'B': {}, 'C': {}, 'D': {}
                };
                this.activeSources = {};
                this.visualizers = {};
                
                // Estado de la UI
                this.touchedPads = new Set();
                this.isAudioInitialized = false;
                
                // Secuenciador
                this.isRecording = false;
                this.isOverdubbing = false; // NEW: Overdub mode flag
                this.overdubStartTime = 0; // NEW: Start time for overdub sessions
                this.isPlaying = false;
                this.bpm = 120;
                this.currentBar = 0;
                this.currentBeat = 1;
                this.sequence = Array(BAR_COUNT).fill().map(function() { return []; });
                this.sequenceStartTime = 0;
                this.metronomeInterval = null;
                this.beatInterval = null;
                this.barAdvancementInterval = null;
                
                // NEW: SCHEDULER DETERMINISTA (Cuellos de botella fix)
                this.nextNoteTime = 0;
                this.schedulerTimer = null;
                
                // MIDI
                this.midiAccess = null;
                
                // Bancos de sonidos
                this.currentBank = 'A';
                this.bankSamples = {
                    'A': {}, 'B': {}, 'C': {}, 'D': {}
                };

                // Nombres de los samples
                this.sampleNames = {
                    'A': {}, 'B': {}, 'C': {}, 'D': {}
                };

                // Sample Slicer
                this.slicerSourcePad = null;
                this.slicerSourceBuffer = null;
                this.slices = {};
                this.slicerMode = false; // Slicer mode state
                
                // NEW: Prevent duplicate event scheduling
                this.scheduledEvents = new Set(); // Track scheduled events to prevent duplicates
                
                // NEW: Delete Pad Mode
                this.deletePadMode = false; // Toggle mode for deleting individual pads
                
                // QUANTIZATION SYSTEM
                this.quantizeMode = true; // Enable quantization by default
                this.quantizeStrength = QUANTIZE_STRENGTH;
                this.gridResolution = GRID_RESOLUTION;
                this.gridStepsPerBeat = GRID_STEPS_PER_BEAT;
                
                // Initialize QT button state after DOM is ready
                setTimeout(() => {
                    this.initializeQTButton();
                }, 100);
                
                // Latency configuration
                this.performanceMode = true; // true = perf mode (low latency) by default, visualization only when sequence is playing
                this.preCreatedAnalysers = {};
                this.preCreatedGains = {};
                
                // NEW: Terminal throttle system (Cuellos de botella fix)
                this.lastLogAt = 0;
                this.logThrottleInterval = 250; // ms entre logs en performance mode

                // MASTER AUDIO EFFECTS ARCHITECTURE
                this.masterGain = null;          // Control de volumen master
                this.masterFilter = null;        // Filtro low-pass master
                this.masterDistortion = null;   // Distortion/Saturation master
                
                // Estado de efectos master
                this.effectsEnabled = {
                    volume: true,
                    filter: false,
                    distortion: false
                };
                
                // Valores actuales de efectos
                this.effectsValues = {
                    volume: 100,
                    filter: 50,
                    distortion: 0,
                    resonance: 5
                };

                // NEW: Microphone Recording System
                this.microphoneStream = null;
                this.hasMicrophoneAccess = false;
                this.isMicrophoneRecording = false;
                this.recordingPadId = null;
                this.recordingStartTime = null;
                this.recordingChunks = [];
                this.mediaRecorder = null;
                this.maxRecordingTimer = null;
                this.isShiftActive = false; // Mantener para compatibilidad
                this.isMicrophoneMode = false; // NUEVO: Modo micrófono independiente
                
                // NEW: Audio Editor System
                this.isEditMode = false;
                this.currentEditPad = null;
                this.editSelection = { start: 0, end: 1 };
                this.audioEditor = null;

                
                // ============================================================================
                // CONTROLLER INITIALIZATION
                // ============================================================================
                
                // Initialize specialized controllers
                console.log('[INIT] Creating PadController...');
                this.padController = new PadController(this);
                
                console.log('[INIT] Creating BPMController...');
                this.bpmController = new BPMController(this);
                
                // ============================================================================
                // SYSTEM INITIALIZATION
                // ============================================================================
                
                // Initialize core systems
                console.log('[INIT] Setting up event listeners...');
                this.initEventListeners();
                
                console.log('[INIT] Loading sample information from storage...');
                this.loadSampleInfoFromStorage();
                
                // Initialize MIDI system (works before audio starts)
                console.log('[INIT] Initializing MIDI system...');
                this.initMIDI();
                
                // Create UI components after controllers are ready
                console.log('[INIT] Creating pad grid interface...');
                this.createPadGrid();
                
                // SHIFT button will be initialized in DOMContentLoaded
                console.log('[INIT] SHIFT button initialization scheduled for DOM ready');
                
                console.log('[INIT] EmbrioPlayer constructor completed successfully');
                

            }
            
            // ============================================================================
            // INITIALIZATION & CONFIGURATION METHODS
            // ============================================================================
            
            /**
             * Load sample information from browser's local storage
             * @method loadSampleInfoFromStorage
             * @description Retrieves saved sample names and configurations from localStorage
             */
            loadSampleInfoFromStorage() {
                try {
                    const savedInfo = localStorage.getItem('embryoPlayerSamples');
                    if (savedInfo) {
                        const info = JSON.parse(savedInfo);
                        if (info.sampleNames) {
                            this.sampleNames = info.sampleNames;
                        }
                    }
                } catch (e) {
                    console.error('Error loading saved information:', e);
                }
            }
            
            /**
             * Save sample information to browser's local storage
             * @method saveSampleInfo
             * @description Persists sample names and configurations to localStorage
             */
            saveSampleInfo() {
                try {
                    const info = {
                        sampleNames: this.sampleNames
                    };
                    localStorage.setItem('embryoPlayerSamples', JSON.stringify(info));
                } catch (e) {
                    console.error('Error saving information:', e);
                }
            }
            
            /**
             * Initialize all event listeners for user interactions
             * @method initEventListeners
             * @description Sets up event handlers for buttons, controls, and UI elements
             */
            initEventListeners() {
                const self = this;
                
                // Main buttons
                document.getElementById('start-audio').addEventListener('click', function() { self.initAudio(); });
                document.getElementById('help-button').addEventListener('click', function() {
                    document.getElementById('help-modal').style.display = 'block';
                });
                document.querySelector('.close-help').addEventListener('click', function() {
                    document.getElementById('help-modal').style.display = 'none';
                });
                // NEW: Transform REC button to MIC when SHIFT is active
                document.getElementById('record-sequence').addEventListener('click', function() { 
                    if (self.isShiftActive) {
                        // SHIFT active: Show microphone recording info
                        self.logToTerminal('SHIFT + click empty pad to record from microphone', 'info');
                    } else {
                        // SHIFT inactive: Normal sequence recording
                        self.toggleRecording(); 
                    }
                });
                
                // NEW: Overdub button for adding to existing sequences
                document.getElementById('overdub-sequence').addEventListener('click', function() { 
                    self.toggleOverdub(); 
                });
                
                document.getElementById('play-sequence').addEventListener('click', function() { self.playSequence(); });
                document.getElementById('stop-sequence').addEventListener('click', function() { self.stopAll(); });
                document.getElementById('clear-sequence').addEventListener('click', function() { self.clearSequence(); });
                
                // Bank selection buttons
                document.getElementById('bank-a').addEventListener('click', function() { self.selectBank('A'); });
                document.getElementById('bank-b').addEventListener('click', function() { self.selectBank('B'); });
                document.getElementById('bank-c').addEventListener('click', function() { self.selectBank('C'); });
                document.getElementById('bank-d').addEventListener('click', function() { self.selectBank('D'); });
                document.getElementById('bank-e').addEventListener('click', function() { self.cycleQuantizeConsolidated(); });
                document.getElementById('bank-f').addEventListener('click', function() { self.loadMultipleSamples(); });
                document.getElementById('bank-g').addEventListener('click', function() { self.toggleDeletePadMode(); });
                document.getElementById('bank-h').addEventListener('click', function() { 
                    if (self.slicerMode) {
                        self.deactivateSlicerMode();
                        self.logToTerminal('Slicer mode deactivated', 'info');
                    } else {
                        self.showPadSelectorForSlicer(); 
                    }
                });
                

                

                

                

                

                
                // Responsive
                window.addEventListener('resize', function() { self.resizeCanvases(); });
            }
            
            /**
             * Initialize the Web Audio API system
             * @method initAudio
             * @description Creates the audio context and prepares the player for audio processing
             * @throws {Error} If audio context cannot be created or initialized
             * @returns {Promise} Promise that resolves when audio system is ready
             */
            async initAudio() {
                const self = this;
                
                if (this.audioContext) {
                    this.logToTerminal('Audio is already started.', 'info');
                    return;
                }
                
                try {
                    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                    
                    // OPTIMIZACIÓN: Configurar AudioContext para latencia mínima
                    const audioContextOptions = {
                        latencyHint: 'interactive', // Latencia mínima para interacción en tiempo real
                        sampleRate: 44100 // Sample rate estándar para mejor compatibilidad
                    };
                    
                    this.audioContext = new AudioContextClass(audioContextOptions);
                    
                    // Check audioWorklet compatibility after creating the instance
                    try {
                        if (this.audioContext && typeof this.audioContext.audioWorklet !== 'undefined') {
                            console.log('[OK] audioWorklet available for latency optimization');
                        } else {
                            console.log('[WARN] audioWorklet not available, using standard configuration');
                        }
                    } catch (e) {
                        console.log('[WARN] audioWorklet not available in this browser:', e.message);
                    }
                    
                    // OPTIMIZATION: Configure context for minimum latency
                    if (this.audioContext.state === 'suspended') {
                        await this.audioContext.resume();
                    }
                    
                    // OPTIMIZATION: Pre-create audio nodes to reduce latency
                    this.preCreateAudioNodes();
                    
                    // NEW: Request microphone permissions for recording functionality
                    try {
                        console.log('[DEBUG] Requesting microphone permission...');
                        await this.requestMicrophonePermission();
                        console.log('[DEBUG] Microphone permission granted');
                        this.logToTerminal('Microphone access granted for recording.', 'info');
                        this.logToTerminal('SHIFT + click empty pad: click to start recording, click again to stop', 'info');
                    } catch (error) {
                        console.error('[DEBUG] Microphone permission error:', error);
                        this.logToTerminal('Microphone access denied. Recording will not be available.', 'warning');
                    }
                    
                    this.isAudioInitialized = true;
                    
                    // Update UI
                    document.getElementById('start-audio').disabled = true;
                    
                    this.logToTerminal('Audio started. Loading GitHub samples automatically...', 'info');
                    
                    // NEW: Log effects system status
                    this.logEffectsStatus();
                    
                    // Initialize components
                    this.createPadGrid();
                    // AUTO-LOAD: Load GitHub samples into banks A and B
                    console.log('[DEBUG] About to call loadAllSamples()...');
                    this.loadAllSamples().then(function() {
                        console.log('[DEBUG] loadAllSamples() completed successfully');
                        
                        // Synchronize samples with bankSamples after loading
                        console.log('[DEBUG] Before synchronization:');
                        console.log('[DEBUG] currentBank:', self.currentBank);
                        console.log('[DEBUG] bankSamples[A]:', self.bankSamples['A']);
                        console.log('[DEBUG] samples[A]:', self.samples);
                        
                        // CORREGIDO: Sincronizar samples con bankSamples sin usar JSON (preserva AudioBuffer)
                        self.samples = {};
                        for (const bank in self.bankSamples) {
                            self.samples[bank] = {};
                            for (const padNumber in self.bankSamples[bank]) {
                                self.samples[bank][padNumber] = self.bankSamples[bank][padNumber];
                            }
                        }
                        
                        console.log('[DEBUG] After synchronization:');
                        console.log('[DEBUG] samples object:', self.samples);
                        console.log('[DEBUG] samples[A]:', self.samples['A']);
                        console.log('[DEBUG] samples[B]:', self.samples['B']);
                        
                        // VERIFICACIÓN: Comprobar que los AudioBuffer se preservaron correctamente
                        console.log('[DEBUG] Verification - Bank A Pad 1:');
                        console.log('[DEBUG]   bankSamples[A][1]:', self.bankSamples['A'][1]);
                        console.log('[DEBUG]   samples[A][1]:', self.samples['A'][1]);
                        console.log('[DEBUG]   samples[A][1] constructor:', self.samples['A'][1] ? self.samples['A'][1].constructor.name : 'undefined');
                        console.log('[DEBUG]   samples[A][1] has getChannelData:', self.samples['A'][1] ? typeof self.samples['A'][1].getChannelData : 'undefined');
                        
                        self.logToTerminal('All samples loaded. Ready to play.', 'info');
                        self.logToTerminal('EDITOR FIXED: Samples can now be edited (GitHub + Microphone)', 'info');
                    }).catch(function(error) {
                        console.error('[DEBUG] Error in loadAllSamples():', error);
                    });
                    
                } catch (error) {
                    console.error('Error starting audio:', error);
                            this.logToTerminal('Error starting audio: ' + error.message + '. Please reload the page.', 'error');
                }
            }
            
            /**
             * Pre-create audio nodes to minimize latency
             * @method preCreateAudioNodes
             * @description Creates and configures audio nodes in advance for instant response
             */
            preCreateAudioNodes() {
                // Pre-create analysers for each pad
                this.preCreatedAnalysers = {};
                for (let i = 1; i <= 16; i++) {
                    this.preCreatedAnalysers[i] = this.audioContext.createAnalyser();
                    this.preCreatedAnalysers[i].fftSize = FFT_SIZE;
                    this.preCreatedAnalysers[i].smoothingTimeConstant = 0.3; // Reduce smoothing for lower latency
                }
                
                // Pre-create gain nodes for each pad
                this.preCreatedGains = {};
                for (let i = 1; i <= 16; i++) {
                    this.preCreatedGains[i] = this.audioContext.createGain();
                    this.preCreatedGains[i].gain.setValueAtTime(1.0, this.audioContext.currentTime);
                }
                
                // Create master effects chain
                this.createMasterEffectsChain();
                
                console.log('[AUDIO] Audio nodes pre-created for minimum latency');
                console.log('[AUDIO] Master effects chain created');
            }
            
            /**
             * Create the master audio effects processing chain
             * @method createMasterEffectsChain
             * @description Sets up the main effects chain: Master Output → Volume → Filter → Distortion → Destination
             */
            createMasterEffectsChain() {
                // Crear nodos de efectos en orden de procesamiento

                this.masterGain = this.audioContext.createGain();
                this.masterFilter = this.audioContext.createBiquadFilter();
                this.masterDistortion = this.audioContext.createWaveShaper(); // Nodo principal para Distortion
                
                // Configurar filtro inicial
                this.masterFilter.type = 'lowpass';
                this.masterFilter.frequency.value = 20000; // Frecuencia máxima inicial
                this.masterFilter.Q.value = 1.0;
                
                // Configurar Distortion con curvas dinámicas
                this.setupDistortionChain();
                
                // Conectar cadena de efectos: Master Output → Master Gain → Master Filter → PreGain → Master Distortion → PostGain → Destination

                this.masterGain.connect(this.masterFilter);
                this.masterFilter.connect(this.distortionPreGain);
                this.distortionPreGain.connect(this.masterDistortion);
                this.masterDistortion.connect(this.distortionPostGain);
                this.distortionPostGain.connect(this.audioContext.destination);
                
                // Aplicar valores iniciales de efectos
                this.applyInitialEffectsValues();
                
                console.log('[EFFECTS] Master effects chain initialized with Distortion');
            }
            
            /**
             * Setup the distortion effects chain with dynamic curves
             * @method setupDistortionChain
             * @description Configures WaveShaper nodes and gain controls for distortion effects
             */
            setupDistortionChain() {
                // Configurar WaveShaper inicial
                this.masterDistortion.curve = this.createDistortionCurve(0);
                
                // Pre-gain para control de entrada
                this.distortionPreGain = this.audioContext.createGain();
                this.distortionPreGain.gain.value = 1.0;
                
                // Post-gain para control de salida
                this.distortionPostGain = this.audioContext.createGain();
                this.distortionPostGain.gain.value = 1.0;
                
                // Conectar pre-gain y post-gain
                this.masterDistortion.connect(this.distortionPostGain);
                
                // Aplicar configuración inicial
                this.updateDistortionIntensity(0);

                console.log('[DISTORTION] Distortion chain initialized with dynamic curves');
            }
            
            /**
             * Create dynamic distortion curve for WaveShaper node
             * @method createDistortionCurve
             * @param {number} amount - Distortion intensity (0-100)
             * @returns {Float32Array} Distortion curve for WaveShaper
             * @description Generates a distortion curve that intensifies with the amount parameter
             */
            createDistortionCurve(amount) {
                const k = typeof amount === 'number' ? amount : 50;
                const n_samples = 44100;
                const curve = new Float32Array(n_samples);
                const deg = Math.PI / 180;
                
                for (let i = 0; i < n_samples; ++i) {
                    const x = (i * 2) / n_samples - 1;
                    
                    if (amount === 0) {
                        // Sin distorsión - curva lineal
                        curve[i] = x;
                    } else {
                        // Curva de distorsión suave que se intensifica con el valor
                        curve[i] = (3 + k) * x * 20 * deg / (Math.PI + k * Math.abs(x));
                    }
                }
                
                return curve;
            }
            
            /**
             * Apply initial effects values to the audio chain
             * @method applyInitialEffectsValues
             * @description Sets up the initial state of all master effects (volume, filter, distortion, resonance)
             */
            applyInitialEffectsValues() {
                try {
                    if (this.masterGain && typeof this.effectsValues.volume === 'number' && isFinite(this.effectsValues.volume)) {
                        const volumeValue = Math.max(0, Math.min(100, this.effectsValues.volume)) / 100;
                        this.masterGain.gain.setValueAtTime(volumeValue, this.audioContext.currentTime);
                    }
                    if (this.masterFilter && typeof this.effectsValues.filter === 'number' && isFinite(this.effectsValues.filter)) {
                        const filterValue = Math.max(0, Math.min(100, this.effectsValues.filter));
                        const freq = Math.exp(Math.log(20) + (filterValue / 100) * Math.log(20000/20));
                        this.masterFilter.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                        
                        if (typeof this.effectsValues.resonance === 'number' && isFinite(this.effectsValues.resonance)) {
                            const resonanceValue = Math.max(0, Math.min(100, this.effectsValues.resonance)) / 10;
                            this.masterFilter.Q.setValueAtTime(resonanceValue, this.audioContext.currentTime);
                        }
                    }
                    if (this.masterDistortion && typeof this.effectsValues.distortion === 'number' && isFinite(this.effectsValues.distortion)) {
                        this.updateDistortionIntensity(this.effectsValues.distortion);
                    }
                } catch (error) {
                    console.error('Error applying initial effects values:', error);
                }
            }
            
            /**
             * Update distortion intensity for saturation effects
             * @method updateDistortionIntensity
             * @param {number} value - Distortion intensity (0-100)
             * @description Updates the distortion curve and gain settings based on intensity value
             */
            updateDistortionIntensity(value) {
                if (!this.masterDistortion) return;

                // Clamp para evitar valores fuera de rango
                const distortionIntensity = Math.min(Math.max(value / 100, 0), 1);

                if (distortionIntensity === 0) {
                    // Sin distorsión - curva lineal (paso directo)
                    this.masterDistortion.curve = this.createDistortionCurve(0);
                    console.log('[DISTORTION] Bypass mode - clean signal');
                } else {
                    // Con distorsión - curva dinámica basada en intensidad
                    const curveAmount = Math.floor(distortionIntensity * 100);
                    this.masterDistortion.curve = this.createDistortionCurve(curveAmount);
                    
                    // Control de pre-gain para saturación
                    if (this.distortionPreGain) {
                        const preGain = 1.0 + (distortionIntensity * 2); // 1x a 3x
                        this.distortionPreGain.gain.setValueAtTime(preGain, this.audioContext.currentTime);
                    }
                    
                    // Control de post-gain para compensar
                    if (this.distortionPostGain) {
                        const postGain = 1.0 / (1.0 + (distortionIntensity * 0.5)); // 1x a 0.67x
                        this.distortionPostGain.gain.setValueAtTime(postGain, this.audioContext.currentTime);
                    }
                    
                    console.log(`[DISTORTION] Active mode: ${value}% | Curve: ${curveAmount} | PreGain: ${(1.0 + (distortionIntensity * 2)).toFixed(1)}x | PostGain: ${(1.0 / (1.0 + (distortionIntensity * 0.5))).toFixed(2)}x`);
                }
            }
            
            /**
             * Apply master effects from slider controls
             * @method applyMasterEffect
             * @param {string} sliderId - Identifier of the slider (slider-1, slider-2, etc.)
             * @param {number} value - Effect value (0-100)
             * @description Processes slider input and applies corresponding audio effects
             */
            applyMasterEffect(sliderId, value) {
                try {
                    // Validate input value
                    if (typeof value !== 'number' || !isFinite(value)) {
                        console.error('Invalid effect value:', value);
                        return;
                    }
                    
                    // Clamp value to valid range
                    const clampedValue = Math.max(0, Math.min(100, value));
                    
                    switch(sliderId) {
                        case 'slider-1': // VOL
                            if (this.masterGain) {
                                this.effectsValues.volume = clampedValue;
                                this.masterGain.gain.setValueAtTime(clampedValue / 100, this.audioContext.currentTime);
                                this.logToTerminal(`VOL ${clampedValue}%`, 'info');
                            }
                            break;
                            
                        case 'slider-2': // DISTORTION
                            if (this.masterDistortion) {
                                this.effectsValues.distortion = clampedValue;
                                this.updateDistortionIntensity(clampedValue);
                                this.logToTerminal(`DISTORTION ${clampedValue}%`, 'info');
                            }
                            break;
                            
                        case 'slider-3': // FILT
                            if (this.masterFilter) {
                                this.effectsValues.filter = clampedValue;
                                // Mapeo logarítmico para mejor control (20Hz - 20kHz)
                                const freq = Math.exp(Math.log(20) + (clampedValue / 100) * Math.log(20000/20));
                                this.masterFilter.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                                this.logToTerminal(`FILT ${clampedValue}%`, 'info');
                            }
                            break;
                            
                        case 'slider-4': // RES
                            if (this.masterFilter) {
                                this.effectsValues.resonance = clampedValue;
                                this.masterFilter.Q.setValueAtTime(clampedValue / 10, this.audioContext.currentTime);
                                this.logToTerminal(`RES ${clampedValue}%`, 'info');
                            }
                            break;
                    }
                } catch (error) {
                    console.error('Error applying master effect:', error);
                }
            }
            
            /**
             * Get current effects system status for debugging
             * @method getEffectsStatus
             * @returns {Object} Current effects configuration and node status
             * @description Returns the current state of all effects for monitoring and debugging
             */
            getEffectsStatus() {
                return {
                    enabled: this.effectsEnabled,
                    values: this.effectsValues,
                    nodes: {
    
                        masterGain: !!this.masterGain,
                        masterFilter: !!this.masterFilter,
                        masterDistortion: !!this.masterDistortion
                    }
                };
            }
            
            /**
             * Log effects system status to terminal for debugging
             * @method logEffectsStatus
             * @description Outputs current effects configuration to the terminal for user monitoring
             */
            logEffectsStatus() {
                const status = this.getEffectsStatus();
                console.log('[EFFECTS] Current effects status:', status);
                this.logToTerminal('Effects system ready - VOL: ' + status.values.volume + '%, DISTORTION: ' + status.values.distortion + '%, FILT: ' + status.values.filter + '%, RES: ' + status.values.resonance + '%', 'info');
            }
            
            /**
             * Create the main pad grid interface
             * @method createPadGrid
             * @description Generates the 4x4 pad grid with all necessary UI elements and event handlers
             */
            createPadGrid() {
                try {
                    const grid = document.getElementById('pad-grid');
                    if (!grid) {
                        console.error('Pad grid element not found!');
                        return;
                    }
                    
                    console.log('Creating pad grid...');
                    grid.innerHTML = '';
                    
                    for (let i = 1; i <= 16; i++) {
                        const pad = document.createElement('div');
                        pad.className = 'pad';
                        pad.dataset.number = i;
                        
                        // Create canvas for visualizer
                        const visualizer = document.createElement('canvas');
                        visualizer.className = 'visualizer';
                        pad.appendChild(visualizer);
                        
                        // Create drop indicator
                        const dropIndicator = document.createElement('div');
                        dropIndicator.className = 'drop-indicator';
                        dropIndicator.textContent = 'Drop here';
                        pad.appendChild(dropIndicator);
                        
                        // Create bank indicator
                        const sampleIndicator = document.createElement('div');
                        sampleIndicator.className = 'sample-indicator';
                        sampleIndicator.style.display = 'none';
                        pad.appendChild(sampleIndicator);
                        
                        // Create label for sample name
                        const nameLabel = document.createElement('div');
                        nameLabel.className = 'sample-name';
                        nameLabel.style.display = 'none';
                        pad.appendChild(nameLabel);
                        
                        // Create slice indicator
                        const sliceIndicator = document.createElement('div');
                        sliceIndicator.className = 'slice-indicator';
                        sliceIndicator.style.display = 'none';
                        pad.appendChild(sliceIndicator);
                        
                        // Create keyboard indicator
                        const keyboardIndicator = document.createElement('div');
                        keyboardIndicator.className = 'keyboard-indicator';
                        keyboardIndicator.textContent = this.padController.getKeyForPad(i);
                        keyboardIndicator.style.display = 'none';
                        pad.appendChild(keyboardIndicator);
                        
                        // Create button to delete sample
                        const deleteBtn = document.createElement('button');
                        deleteBtn.className = 'delete-pad-btn';
                        deleteBtn.innerHTML = '×';
                        deleteBtn.title = 'Delete sample';
                        
                        // Event listeners for delete
                        const self = this;
                        deleteBtn.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            e.stopImmediatePropagation();
                            self.deletePadSample(i);
                        });
                        
                        deleteBtn.addEventListener('mousedown', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            e.stopImmediatePropagation();
                        });
                        
                        deleteBtn.addEventListener('touchstart', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            e.stopImmediatePropagation();
                        });
                        
                        pad.appendChild(deleteBtn);
                        
                        // NEW IMPROVED EVENT LISTENERS
                        this.setupPadEventListeners(pad, i);
                        this.setupDragAndDrop(pad, i);
                        
                        grid.appendChild(pad);
                    }
                    
                    console.log('Pad grid created successfully with', grid.children.length, 'pads');
                    this.resizeCanvases();
                } catch (error) {
                    console.error('Error creating pad grid:', error);
                }
            }
            
            /**
             * Setup event listeners for individual pad interactions
             * @method setupPadEventListeners
             * @param {HTMLElement} pad - The pad DOM element
             * @param {number} padNumber - The pad number (1-16)
             * @description Configures mouse and touch events for pad interaction
             */
            setupPadEventListeners(pad, padNumber) {
                const self = this;
                
                // Mouse events
                pad.addEventListener('click', function(e) {
                    if (e.target.classList.contains('delete-pad-btn')) return;
                    e.preventDefault();
                    
                    console.log('[DEBUG] Pad clicked:', padNumber);
                    console.log('[DEBUG] isShiftActive:', self.isShiftActive);
                    console.log('[DEBUG] currentBank:', self.currentBank);
                    console.log('[DEBUG] samples object:', self.samples);
                    console.log('[DEBUG] samples[currentBank]:', self.samples[self.currentBank]);
                    console.log('[DEBUG] bankSamples[currentBank]:', self.bankSamples[self.currentBank]);
                    console.log('[DEBUG] hasSample in pad:', !!self.samples[self.currentBank] && !!self.samples[self.currentBank][padNumber]);
                    console.log('[DEBUG] isMicrophoneRecording:', self.isMicrophoneRecording);
                    
                            // Check if slicer mode is active
        if (self.slicerMode && self.samples[self.currentBank] && self.samples[self.currentBank][padNumber]) {
            self.selectPadForSlicing(padNumber);
        } else if (self.deletePadMode && self.samples[self.currentBank] && self.samples[self.currentBank][padNumber]) {
            // DELETE mode: Delete the selected pad
            self.deletePadSample(padNumber);
            self.deactivateDeletePadMode(); // Auto-deactivate after deletion
        } else if (self.isEditMode) {
            // EDIT mode: Select pad for editing
            console.log('[DEBUG] EDIT mode active - selecting pad for editing');
            self.selectPadForEditing(padNumber);
        } else {
                                        // NEW: Improved MIC button + pad recording system (replaces SHIFT)
                            if (self.isMicrophoneMode) {
                                console.log('[DEBUG] MIC mode active - checking if pad is empty for recording');
                                console.log('[DEBUG] Pad number:', padNumber);
                                console.log('[DEBUG] Current bank:', self.currentBank);
                                console.log('[DEBUG] Samples in current bank:', self.samples[self.currentBank]);
                                console.log('[DEBUG] Sample in this pad:', self.samples[self.currentBank][padNumber]);
                                
                                // Check if pad is empty (no sample assigned)
                                const padIsEmpty = !self.samples[self.currentBank] || !self.samples[self.currentBank][padNumber];
                                console.log('[DEBUG] Pad is empty:', padIsEmpty);
                                
                                if (padIsEmpty) {
                                    console.log('[DEBUG] MIC mode active and pad empty - attempting recording');
                                    // Toggle recording: click to start, click again to stop
                                    if (self.isMicrophoneRecording && self.recordingPadId === padNumber) {
                                        console.log('[DEBUG] Stopping recording on pad:', padNumber);
                                        // Stop recording if already recording on this pad
                                        self.stopMicrophoneRecording();
                                    } else if (!self.isMicrophoneRecording) {
                                        console.log('[DEBUG] Starting recording on pad:', padNumber);
                                        // Start recording on this pad
                                        self.startMicrophoneRecording(padNumber);
                                    }
                                } else {
                                    console.log('[DEBUG] MIC mode active but pad has sample - playing sample instead');
                                    self.padController.triggerPad(padNumber, 127, 'mouse');
                                }
                            } else {
                                // MIC mode not active - normal pad behavior
                                self.padController.triggerPad(padNumber, 127, 'mouse');
                            }
        }
                });
                
                // Touch events
                pad.addEventListener('touchstart', function(e) {
                    if (e.target.classList.contains('delete-pad-btn')) return;
                    e.preventDefault();
                    
                                    // Check if slicer mode is active
                if (self.slicerMode && self.samples[self.currentBank] && self.samples[self.currentBank][padNumber]) {
                    self.selectPadForSlicing(padNumber);
                } else if (self.deletePadMode && self.samples[self.currentBank] && self.samples[self.currentBank][padNumber]) {
                    // DELETE mode: Delete the selected pad
                    self.deletePadSample(padNumber);
                    self.deactivateDeletePadMode(); // Auto-deactivate after deletion
                } else if (self.isEditMode) {
                    // EDIT mode: Select pad for editing
                    self.selectPadForEditing(padNumber);
                } else {
                    // NEW: Improved MIC button + pad recording system for touch (replaces SHIFT)
                    if (self.isMicrophoneMode) {
                        console.log('[DEBUG] MIC mode active (touch) - checking if pad is empty for recording');
                        console.log('[DEBUG] Pad number:', padNumber);
                        console.log('[DEBUG] Current bank:', self.currentBank);
                        console.log('[DEBUG] Samples in current bank:', self.samples[self.currentBank]);
                        console.log('[DEBUG] Sample in this pad:', self.samples[self.currentBank][padNumber]);
                        
                        // Check if pad is empty (no sample assigned)
                        const padIsEmpty = !self.samples[self.currentBank] || !self.samples[self.currentBank][padNumber];
                        console.log('[DEBUG] Pad is empty (touch):', padIsEmpty);
                        
                        if (padIsEmpty) {
                            console.log('[DEBUG] MIC mode active and pad empty (touch) - attempting recording');
                            // Toggle recording: touch to start, touch again to stop
                            if (self.isMicrophoneRecording && self.recordingPadId === padNumber) {
                                // Stop recording if already recording on this pad
                                self.stopMicrophoneRecording();
                            } else if (!self.isMicrophoneRecording) {
                                // Start recording on this pad
                                self.startMicrophoneRecording(padNumber);
                            }
                        } else {
                            console.log('[DEBUG] MIC mode active but pad has sample (touch) - playing sample instead');
                            self.padController.triggerPad(padNumber, 127, 'touch');
                            self.touchedPads.add(padNumber);
                        }
                    } else {
                        // MIC mode not active - normal pad behavior
                        self.padController.triggerPad(padNumber, 127, 'touch');
                        self.touchedPads.add(padNumber);
                    }
                }
                });
                
                pad.addEventListener('touchend', function(e) {
                    if (e.target.classList.contains('delete-pad-btn')) return;
                    self.touchedPads.delete(padNumber);
                });
                
                pad.addEventListener('touchcancel', function(e) {
                    self.touchedPads.delete(padNumber);
                });
            }
            
            /**
             * Play audio sample from a specific pad
             * @method playPad
             * @param {number} padNumber - The pad number to play (1-16)
             * @param {number} when - When to start playback (audio timeline)
             * @param {number} offset - Offset within the sample to start from
             * @param {number} duration - Duration to play (optional)
             * @description Optimized audio playback with timeline support and minimum latency
             */
            playPad(padNumber, when = 0, offset = 0, duration = undefined) {
                if (!this.validatePlayback(padNumber)) return;
                
                // NEW: Debug logging to track duplicate calls
                const timestamp = this.audioContext ? this.audioContext.currentTime.toFixed(3) : '0.000';
                console.log(`[DEBUG] playPad called: Pad ${padNumber}, when: ${when}, currentTime: ${timestamp}`);
                
                // Use pre-created nodes to reduce latency
                const source = this.createAudioSource(padNumber);
                const analyser = this.preCreatedAnalysers[padNumber];
                const gain = this.preCreatedGains[padNumber];
                
                // Connect audio through master effects chain
                source.connect(gain);
                gain.connect(analyser);
                analyser.connect(this.masterGain);
                
                // NEW: Timeline-based playback (Cuellos de botella fix)
                const startAt = when || this.audioContext.currentTime;
                
                // NEW: Handle slice parameters if this is a slice
                const sample = this.samples[this.currentBank] && this.samples[this.currentBank][padNumber];
                if (sample && sample.offset !== undefined && sample.duration !== undefined) {
                    // This is a slice - use slice offset and duration
                    source.start(startAt, sample.offset, sample.duration);
                } else {
                    // This is a regular sample - use provided parameters or defaults
                    source.start(startAt, offset, duration);
                }
                
                this.activeSources[padNumber] = source;
                
                // Update UI asynchronously to not block audio
                requestAnimationFrame(() => {
                    this.updatePadUI(padNumber, source);
                });
                
                // Optional visualization (can be disabled for maximum latency)
                if (!this.performanceMode) {
                    const canvas = document.querySelector('.pad[data-number="' + padNumber + '"] .visualizer');
                    console.log(`[DEBUG] Visualization check: performanceMode=${this.performanceMode}, canvas=${!!canvas}, analyser=${!!analyser}`);
                    if (canvas) {
                        console.log(`[DEBUG] Starting visualization for Pad ${padNumber}`);
                        this.visualize(padNumber, analyser, canvas);
                    } else {
                        console.log(`[DEBUG] Canvas not found for Pad ${padNumber}`);
                    }
                } else {
                    console.log(`[DEBUG] Visualization disabled: performanceMode=${this.performanceMode}`);
                }
                
                // Background recording
                if (this.isRecording) {
                    requestAnimationFrame(() => {
                        this.recordPadEvent(padNumber);
                    });
                }
                
                // Asynchronous status update
                requestAnimationFrame(() => {
                            this.logToTerminal('Playing Pad ' + padNumber + ' (Bank ' + this.currentBank + ')', 'info');
                });
            }
            
            /**
             * Validate if a pad can be played
             * @method validatePlayback
             * @param {number} padNumber - The pad number to validate
             * @returns {boolean} True if playback is valid, false otherwise
             * @description Checks audio context and sample availability before playback
             */
            validatePlayback(padNumber) {
                if (!this.audioContext) {
                    this.logToTerminal('Please start audio before playing samples.', 'warning');
                    return false;
                }
                
                if (!this.samples[this.currentBank] || !this.samples[this.currentBank][padNumber]) {
                    this.logToTerminal('No audio assigned to Pad ' + padNumber + ' in Bank ' + this.currentBank, 'warning');
                    return false;
                }
                
                return true;
            }
            
            /**
             * Stop audio playback for a specific pad
             * @method stopPadIfPlaying
             * @param {number} padNumber - The pad number to stop (1-16)
             * @description Stops and cleans up audio sources for the specified pad
             */
            stopPadIfPlaying(padNumber) {
                const source = this.activeSources[padNumber];
                if (source) {
                    try { 
                        source.stop(); 
                    } catch(e) {
                        console.warn('Error stopping audio source:', e);
                    }
                    try { 
                        source.disconnect(); 
                    } catch(e) {
                        console.warn('Error disconnecting audio source:', e);
                    }
                    delete this.activeSources[padNumber];
                }
            }
            
            /**
             * Create an audio source for playback
             * @method createAudioSource
             * @param {number} padNumber - The pad number for the audio source
             * @returns {AudioBufferSourceNode} Configured audio source node
             * @description Creates and configures audio source with optimized settings for minimum latency
             */
            createAudioSource(padNumber) {
                // Create audio source with optimized configuration
                const source = this.audioContext.createBufferSource();
                
                // NEW: Handle non-destructive slices (Cuellos de botella fix)
                const sample = this.samples[this.currentBank] && this.samples[this.currentBank][padNumber];
                if (sample && sample.buffer && sample.offset !== undefined) {
                    // This is a slice - use offset and duration
                    source.buffer = sample.buffer;
                    // Note: offset and duration will be used in playPad(when, offset, duration)
                } else if (sample && sample.buffer) {
                    // This is a regular sample
                    source.buffer = sample.buffer;
                } else {
                    // Fallback for backward compatibility
                    source.buffer = sample;
                }
                
                // Configure for minimum latency
                if (source.playbackRate) {
                    source.playbackRate.setValueAtTime(1.0, this.audioContext.currentTime);
                }
                
                return source;
            }
            
            /**
             * Create an audio analyser node for visualization
             * @method createAnalyser
             * @returns {AnalyserNode} Configured analyser node
             * @description Creates an analyser node with optimized FFT settings for real-time visualization
             */
            createAnalyser() {
                const analyser = this.audioContext.createAnalyser();
                analyser.fftSize = FFT_SIZE;
                return analyser;
            }
            
            /**
             * Update pad UI state during playback
             * @method updatePadUI
             * @param {number} padNumber - The pad number to update
             * @param {AudioBufferSourceNode} source - The audio source node
             * @description Updates visual feedback and manages playback state for the pad
             */
            updatePadUI(padNumber, source) {
                const self = this;
                const pad = document.querySelector('.pad[data-number="' + padNumber + '"]');
                if (!pad) return;
                
                // Only add playing class and set onended if source exists
                if (source) {
                    pad.classList.add('playing');
                    
                    source.onended = function() {
                        pad.classList.remove('playing');
                        delete self.activeSources[padNumber];
                        
                        if (self.visualizers[padNumber]) {
                            cancelAnimationFrame(self.visualizers[padNumber]);
                            delete self.visualizers[padNumber];
                        }
                    };
                } else {
                    // For microphone recordings, just update the pad display
                    console.log('[DEBUG] updatePadUI called with null source for pad:', padNumber);
                }
            }
            
            /**
             * Initialize MIDI system for external controller support
             * @method initMIDI
             * @description Sets up Web MIDI API connection and event handling
             */
            initMIDI() {
                try {
                    console.log('Initializing MIDI...');
                    const self = this;
                    
                    if (navigator.requestMIDIAccess) {
                        console.log('Web MIDI API available, requesting access...');
                        navigator.requestMIDIAccess()
                            .then(function(midiAccess) { 
                                console.log('MIDI access granted');
                                self.onMIDISuccess(midiAccess); 
                            })
                            .catch(function(error) { 
                                console.error('MIDI access failed:', error);
                                self.onMIDIFailure(error); 
                            });
                    } else {
                        console.warn('Web MIDI API not supported in this browser');
                        this.logToTerminal('Web MIDI API not supported in this browser.', 'warning');
                    }
                } catch (error) {
                    console.error('Error initializing MIDI:', error);
                }
            }
            
            /**
             * Handle successful MIDI access
             * @method onMIDISuccess
             * @param {MIDIAccess} midiAccess - MIDI access object from Web MIDI API
             * @description Configures MIDI input handling and updates connection status
             */
            onMIDISuccess(midiAccess) {
                const self = this;
                this.midiAccess = midiAccess;
                this.padController.setMIDIAvailable(true);
                
                const inputs = midiAccess.inputs.values();
                
                for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
                    input.value.onmidimessage = function(msg) { self.onMIDIMessage(msg); };
                }
                
                        this.logToTerminal('MIDI connected (OMNI - all channels). MIDI controller ready.', 'info');
            }
            
            /**
             * Handle MIDI access failure
             * @method onMIDIFailure
             * @param {Error} error - Error object from failed MIDI access
             * @description Logs MIDI connection errors and updates status
             */
            onMIDIFailure(error) {
                console.error('Error accessing MIDI:', error);
                this.padController.setMIDIAvailable(false);
                        this.logToTerminal('Error connecting MIDI. You can continue using mouse, touch or keyboard.', 'warning');
            }
            
            /**
             * Handle incoming MIDI messages
             * @method onMIDIMessage
             * @param {MIDIMessageEvent} message - MIDI message event from controller
             * @description Processes MIDI note-on messages and triggers corresponding pads
             */
            onMIDIMessage(message) {
                const data = message.data;
                const status = data[0];
                const note = data[1]; 
                const velocity = data[2];
                
                // Detect Note On in any MIDI channel (144-159 = 0x90-0x9F)
                if ((status >= 144 && status <= 159) && velocity > 0) {
                    const padNumber = note % 16 + 1;
                    
                    // MIDI uses the unified system
                    this.padController.triggerPad(padNumber, velocity, 'MIDI');
                    
                    console.log('MIDI: Channel ' + ((status & 0x0F) + 1) + ', Note ' + note + ', Velocity ' + velocity + ' → Pad ' + padNumber);
                }
            }
            

            

            

            

            

            
            /**
             * Change the current tempo/BPM
             * @method changeTempo
             * @param {number} change - Amount to change BPM (positive or negative)
             * @description Updates BPM within valid range and restarts timers if needed
             */
            changeTempo(change) {
                const oldBPM = this.bpm;
                this.bpm = Math.max(MIN_BPM, Math.min(MAX_BPM, this.bpm + change));
                this.updateTempoDisplay();
                
                // Log BPM change to terminal
                this.logToTerminal(`BPM changed from ${oldBPM} to ${this.bpm}`, 'info');
                
                // NEW: Recalculate sequence timing if we have a recorded sequence
                if (this.hasRecordedSequence()) {
                    this.recalculateSequenceTiming(oldBPM, this.bpm);
                }
                
                if (this.isRecording || this.isPlaying) {
                    this.restartTimers();
                }
            }
            
            /**
             * Check if there's a recorded sequence with data
             * @method hasRecordedSequence
             * @returns {boolean} True if there's a recorded sequence with events
             * @description Determines if there's a recorded sequence that needs timing recalculation
             */
            hasRecordedSequence() {
                return this.sequence && this.sequence.some(bar => bar && bar.length > 0);
            }
            
            /**
             * Recalculate sequence timing when BPM changes
             * @method recalculateSequenceTiming
             * @param {number} oldBPM - Previous BPM value
             * @param {number} newBPM - New BPM value
             * @description Converts all sequence event times from old BPM to new BPM
             */
            recalculateSequenceTiming(oldBPM, newBPM) {
                if (oldBPM === newBPM) return;
                
                const bpmRatio = oldBPM / newBPM;
                let eventsRecalculated = 0;
                
                this.sequence.forEach((bar, barIndex) => {
                    if (bar && bar.length > 0) {
                        bar.forEach(event => {
                            // Convert time from old BPM to new BPM
                            const oldTime = event.time;
                            event.time = oldTime * bpmRatio;
                            
                            // Also convert originalTime if it exists (for quantization)
                            if (event.originalTime !== undefined) {
                                event.originalTime = event.originalTime * bpmRatio;
                            }
                            
                            eventsRecalculated++;
                        });
                    }
                });
                
                if (eventsRecalculated > 0) {
                    this.logToTerminal(`Recalculated timing for ${eventsRecalculated} sequence events (${oldBPM} → ${newBPM} BPM)`, 'info');
                    
                    // If sequence is currently playing, restart it with new timing
                    if (this.isPlaying) {
                        this.logToTerminal('Restarting sequence playback with new BPM...', 'info');
                        this.stopSequence();
                        setTimeout(() => {
                            this.startSequence();
                        }, 100);
                    }
                }
            }
            
            /**
             * Update the tempo display in the UI
             * @method updateTempoDisplay
             * @description Updates the BPM display button with current tempo value
             */
            updateTempoDisplay() {
                document.getElementById('tempo-display').textContent = this.bpm + ' BPM';
            }
            
            /**
             * Restart all active timers with new BPM
             * @method restartTimers
             * @description Restarts metronome and bar advancement timers when tempo changes
             */
            restartTimers() {
                this.stopTimers();
                
                if (this.isRecording || this.isPlaying) {
                    if (this.isRecording) {
                        this.startMetronome();
                    }
                    this.startBarAdvancement();
                }
            }
            
            /**
             * Stop all active timers
             * @method stopTimers
             * @description Clears all interval timers and logs the number of timers stopped
             */
            stopTimers() {
                let timersStopped = 0;
                
                if (this.metronomeInterval) {
                    clearInterval(this.metronomeInterval);
                    this.metronomeInterval = null;
                    timersStopped++;
                }
                
                if (this.beatInterval) {
                    clearInterval(this.beatInterval);
                    this.beatInterval = null;
                    timersStopped++;
                }
                
                if (this.barAdvancementInterval) {
                    clearInterval(this.barAdvancementInterval);
                    this.barAdvancementInterval = null;
                    timersStopped++;
                }
                
                if (timersStopped > 0) {
                    this.logToTerminal('Stopped ' + timersStopped + ' active timers', 'info');
                }
            }
            
            /**
             * Select and activate a sample bank
             * @method selectBank
             * @param {string} bank - Bank identifier ('A', 'B', 'C', 'D')
             * @description Switches to the specified bank and updates UI indicators
             */
            selectBank(bank) {
                if (this.currentBank === bank) return;
                
                this.currentBank = bank;
                
                document.querySelectorAll('.bank-btn').forEach(function(btn) {
                    btn.classList.remove('bank-active');
                });
                document.getElementById('bank-' + bank.toLowerCase()).classList.add('bank-active');
                
                // Don't overwrite the entire samples structure, just ensure the current bank is available
                if (!this.samples[bank]) {
                    this.samples[bank] = this.bankSamples[bank] || {};
                }
                
                console.log('[DEBUG] After selectBank:');
                console.log('[DEBUG] currentBank:', this.currentBank);
                console.log('[DEBUG] samples object:', this.samples);
                console.log('[DEBUG] samples[A]:', this.samples['A']);
                console.log('[DEBUG] samples[B]:', this.samples['B']);
                
                this.updatePadBankIndicators();
                
                // Show bank status when selecting
                this.showBankStatus();
                
                // NEW: Deactivate delete mode when changing banks
                if (this.deletePadMode) {
                    this.deactivateDeletePadMode();
                }
                
                // NEW: Deactivate edit mode when changing banks
                if (this.isEditMode) {
                    this.exitEditMode();
                }
                
                this.logToTerminal('Bank ' + bank + ' selected.', 'info');
            }

            /**
             * Update pad indicators for the current bank
             * @method updatePadBankIndicators
             * @description Updates visual indicators showing which pads have samples loaded
             */
            updatePadBankIndicators() {
                for (let i = 1; i <= 16; i++) {
                    const pad = document.querySelector('.pad[data-number="' + i + '"]');
                    if (!pad) continue;
                    
                    // Indicadores existentes
                    let nameLabel = pad.querySelector('.sample-name');
                    let sliceIndicator = pad.querySelector('.slice-indicator');
                    let deleteBtn = pad.querySelector('.delete-pad-btn');
                    let keyboardIndicator = pad.querySelector('.keyboard-indicator');
                    
                    // Crear indicadores si no existen
                    if (!nameLabel) {
                        nameLabel = document.createElement('div');
                        nameLabel.className = 'sample-name';
                        pad.appendChild(nameLabel);
                    }
                    
                    if (!sliceIndicator) {
                        sliceIndicator = document.createElement('div');
                        sliceIndicator.className = 'slice-indicator';
                        pad.appendChild(sliceIndicator);
                    }
                    
                    if (!keyboardIndicator) {
                        keyboardIndicator = document.createElement('div');
                        keyboardIndicator.className = 'keyboard-indicator';
                        keyboardIndicator.textContent = this.padController.getKeyForPad(i);
                        pad.appendChild(keyboardIndicator);
                    }
                    
                    if (!deleteBtn) {
                        deleteBtn = document.createElement('button');
                        deleteBtn.className = 'delete-pad-btn';
                        deleteBtn.innerHTML = '×';
                        deleteBtn.title = 'Eliminar sample';
                        
                        const self = this;
                        deleteBtn.addEventListener('click', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            e.stopImmediatePropagation();
                            self.deletePadSample(i);
                        });
                        
                        deleteBtn.addEventListener('mousedown', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            e.stopImmediatePropagation();
                        });
                        
                        deleteBtn.addEventListener('touchstart', function(e) {
                            e.preventDefault();
                            e.stopPropagation();
                            e.stopImmediatePropagation();
                        });
                        
                        pad.appendChild(deleteBtn);
                    }
                    
                    // Verificar si hay sample en este pad
                    const hasSample = !!this.bankSamples[this.currentBank][i];
                    
                    if (hasSample) {
                        pad.classList.add('loaded');
                        pad.classList.remove('full-bank');
                        
                        const name = this.sampleNames[this.currentBank][i] || ('Sample ' + i);
                        nameLabel.textContent = name;
                        nameLabel.style.display = 'block';
                        
                        deleteBtn.style.display = 'flex';
                        keyboardIndicator.style.display = 'block';
                        
                        if (name.indexOf('-') === -1) {
                            sliceIndicator.style.display = 'none';
                        }
                    } else {
                        pad.classList.remove('loaded');
                        nameLabel.style.display = 'none';
                        sliceIndicator.style.display = 'none';
                        deleteBtn.style.display = 'none';
                        keyboardIndicator.style.display = 'none';
                    }
                }
                
                // Check if bank is full and apply visual indicator
                const emptyPads = this.findEmptyPads();
                if (emptyPads.length === 0) {
                    // Bank is full, show visual indicator
                    document.querySelectorAll('.pad').forEach(pad => {
                        if (!pad.classList.contains('loaded')) {
                            pad.classList.add('full-bank');
                        }
                    });
                } else {
                    // Bank has empty pads, remove full indicator
                    document.querySelectorAll('.pad.full-bank').forEach(pad => {
                        pad.classList.remove('full-bank');
                    });
                }
            }
            
            /**
             * Load multiple audio samples from file selection
             * @method loadMultipleSamples
             * @description Opens file dialog for multiple audio file selection and loading
             */
            loadMultipleSamples() {
                if (!this.audioContext) {
                    this.logToTerminal('Please start audio first', 'warning');
                    return;
                }
                
                // Show current bank status first
                const bankStatus = this.showBankStatus();
                
                if (bankStatus.emptyPads.length === 0) {
                    this.showFullBankError('load samples');
                    return;
                }
                
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'audio/*';
                input.multiple = true;
                
                const self = this;
                input.onchange = function(e) {
                    const files = Array.from(e.target.files);
                    if (files.length === 0) return;
                    
                    const filesToLoad = files.slice(0, 16);
                    
                    self.logToTerminal('Attempting to load ' + filesToLoad.length + ' samples in Bank ' + self.currentBank + '...', 'info');
                    
                    // Find empty pads first
                    const emptyPads = self.findEmptyPads();
                    
                    if (emptyPads.length === 0) {
                        self.showFullBankError('load samples');
                        return;
                    }
                    
                    if (emptyPads.length < filesToLoad.length) {
                        self.logToTerminal('Only ' + emptyPads.length + ' empty pads available. Loading ' + emptyPads.length + ' samples.', 'warning');
                        filesToLoad.splice(emptyPads.length);
                    }
                    
                    self.logToTerminal('Loading samples into pads: ' + emptyPads.slice(0, filesToLoad.length).join(', '), 'info');
                    
                    // Load files into empty pads
                    filesToLoad.forEach(function(file, index) {
                        const padNumber = emptyPads[index];
                        if (self.validateAudioFile(file)) {
                            self.loadUserSample(padNumber, self.currentBank, file);
                        }
                    });
                };
                
                input.click();
            }
            
            /**
             * Find empty pads in the current bank
             * @method findEmptyPads
             * @returns {Array<number>} Array of empty pad numbers
             * @description Identifies which pads are available for loading new samples
             */
            findEmptyPads() {
                const emptyPads = [];
                for (let i = 1; i <= 16; i++) {
                    if (!this.bankSamples[this.currentBank][i]) {
                        emptyPads.push(i);
                    }
                }
                return emptyPads;
            }
            
            /**
             * Show current bank status information
             * @method showBankStatus
             * @returns {Object} Bank status with empty and loaded pad counts
             * @description Displays information about the current bank's sample loading status
             */
            showBankStatus() {
                const emptyPads = this.findEmptyPads();
                const loadedPads = 16 - emptyPads.length;
                
                let statusMessage = `Bank ${this.currentBank}: ${loadedPads}/16 pads loaded`;
                if (emptyPads.length > 0) {
                    statusMessage += ` (${emptyPads.length} empty)`;
                } else {
                    statusMessage += ' (FULL - no empty pads)';
                }
                
                this.logToTerminal(statusMessage, 'info');
                
                if (emptyPads.length === 0) {
                    this.logToTerminal('Bank is full. Use "Clear Bank" or delete individual samples to free space.', 'warning');
                } else {
                    this.logToTerminal(`Empty pads available: ${emptyPads.join(', ')}`, 'info');
                }
                
                return { emptyPads, loadedPads };
            }
            
            /**
             * Show enhanced error message for full bank
             * @method showFullBankError
             * @param {string} action - The action that cannot be performed
             * @description Displays detailed error message and available actions when bank is full
             */
            showFullBankError(action = 'load samples') {
                this.logToTerminal(`Cannot ${action}: Bank ${this.currentBank} is FULL`, 'error');
                this.logToTerminal('Available actions:', 'info');
                this.logToTerminal('• Use "Clear Bank" to remove all samples', 'info');
                this.logToTerminal('• Delete individual samples using the × button', 'info');
                this.logToTerminal('• Switch to another bank with available space', 'info');
            }

            /**
             * Clear all samples from the current bank
             * @method clearCurrentBank
             * @description Removes all samples and resets the current bank to empty state
             */
            clearCurrentBank() {
                const bank = this.currentBank;
                
                if (confirm('Are you sure you want to clear all samples from Bank ' + bank + '?')) {
                    this.bankSamples[bank] = {};
                    this.samples = {};
                    this.sampleNames[bank] = {};
                    
                    this.updatePadBankIndicators();
                    this.saveSampleInfo();
                    
                    this.logToTerminal('All samples from Bank ' + bank + ' have been cleared.', 'info');
                }
            }
            
            /**
             * Delete a sample from a specific pad
             * @method deletePadSample
             * @param {number} padNumber - The pad number to clear (1-16)
             * @description Removes sample from pad and updates UI indicators
             */
            deletePadSample(padNumber) {
                const bank = this.currentBank;
                const sampleName = this.sampleNames[bank][padNumber] || ('Pad ' + padNumber);
                
                this.stopPadIfPlaying(padNumber);
                
                // CORREGIDO: Limpiar correctamente tanto en bankSamples como en samples
                delete this.bankSamples[bank][padNumber];
                delete this.samples[bank][padNumber]; // CORREGIDO: Usar bank[padNumber] en lugar de samples[padNumber]
                delete this.sampleNames[bank][padNumber];
                
                const pad = document.querySelector('.pad[data-number="' + padNumber + '"]');
                if (pad) {
                    pad.classList.remove('loaded');
                    
                    const sampleIndicator = pad.querySelector('.sample-indicator');
                    const nameLabel = pad.querySelector('.sample-name');
                    const sliceIndicator = pad.querySelector('.slice-indicator');
                    const deleteBtn = pad.querySelector('.delete-pad-btn');
                    const keyboardIndicator = pad.querySelector('.keyboard-indicator');
                    
                    if (sampleIndicator) sampleIndicator.style.display = 'none';
                    if (nameLabel) nameLabel.style.display = 'none';
                    if (sliceIndicator) sliceIndicator.style.display = 'none';
                    if (deleteBtn) deleteBtn.style.display = 'none';
                    if (keyboardIndicator) keyboardIndicator.style.display = 'none';
                }
                
                this.saveSampleInfo();
                
                this.logToTerminal('"' + sampleName + '" deleted from Pad ' + padNumber, 'info');
            }
            
            /**
             * Show visual effect when sample is loaded
             * @method showLoadedEffect
             * @param {HTMLElement} pad - The pad DOM element
             * @description Provides visual feedback when a sample is successfully loaded
             */
            showLoadedEffect(pad) {
                const originalBoxShadow = pad.style.boxShadow;
                pad.style.boxShadow = '0 0 30px rgba(255, 255, 255, 0.8)';
                
                setTimeout(function() {
                    pad.style.boxShadow = originalBoxShadow;
                }, 500);
            }
            
            /**
             * Setup drag and drop functionality for a pad
             * @method setupDragAndDrop
             * @param {HTMLElement} pad - The pad DOM element
             * @param {number} padNumber - The pad number (1-16)
             * @description Configures drag and drop event handlers for sample loading
             */
            setupDragAndDrop(pad, padNumber) {
                const self = this;
                pad.addEventListener('dragenter', function(e) { self.handleDragEnter(e, padNumber); }, false);
                pad.addEventListener('dragover', function(e) { self.handleDragOver(e, padNumber); }, false);
                pad.addEventListener('dragleave', function(e) { self.handleDragLeave(e, padNumber); }, false);
                pad.addEventListener('drop', function(e) { self.handleDrop(e, padNumber); }, false);
            }
            
            /**
             * Handle drag enter event for a pad
             * @method handleDragEnter
             * @param {DragEvent} e - Drag event object
             * @param {number} padNumber - The pad number being dragged over
             * @description Provides visual feedback when dragging files over a pad
             */
            handleDragEnter(e, padNumber) {
                e.preventDefault();
                e.stopPropagation();
                
                const pad = e.currentTarget;
                const files = Array.from(e.dataTransfer.files);
                
                if (files.length > 0) {
                    const self = this;
                    const validFiles = files.filter(function(file) { return self.validateAudioFile(file); });
                    
                    if (validFiles.length > 0) {
                        pad.classList.add('drag-over', 'drag-valid');
                        const indicator = pad.querySelector('.drop-indicator');
                        
                        if (files.length === 1) {
                            indicator.textContent = '[FILE] ' + files[0].name;
                        } else {
                            indicator.textContent = '[FILE] ' + validFiles.length + ' files';
                        }
                    } else {
                        pad.classList.add('drag-over', 'drag-invalid');
                        const indicator = pad.querySelector('.drop-indicator');
                        indicator.textContent = '[ERROR] Invalid format';
                    }
                }
            }
            
            /**
             * Handle drag over event for a pad
             * @method handleDragOver
             * @param {DragEvent} e - Drag event object
             * @param {number} padNumber - The pad number being dragged over
             * @description Sets drop effect and prevents default behavior
             */
            handleDragOver(e, padNumber) {
                e.preventDefault();
                e.stopPropagation();
                e.dataTransfer.dropEffect = 'copy';
            }
            
            /**
             * Handle drag leave event for a pad
             * @method handleDragLeave
             * @param {DragEvent} e - Drag event object
             * @param {number} padNumber - The pad number being left
             * @description Removes visual feedback when dragging away from a pad
             */
            handleDragLeave(e, padNumber) {
                if (!e.currentTarget.contains(e.relatedTarget)) {
                    const pad = e.currentTarget;
                    pad.classList.remove('drag-over', 'drag-valid', 'drag-invalid');
                    
                    const indicator = pad.querySelector('.drop-indicator');
                    indicator.textContent = 'Soltar aquí';
                }
            }
            
            /**
             * Handle file drop event for a pad
             * @method handleDrop
             * @param {DragEvent} e - Drop event object
             * @param {number} padNumber - The pad number receiving the drop
             * @description Processes dropped audio files and loads them into the pad
             */
            handleDrop(e, padNumber) {
                e.preventDefault();
                e.stopPropagation();
                
                const pad = e.currentTarget;
                pad.classList.remove('drag-over', 'drag-valid', 'drag-invalid');
                
                const files = Array.from(e.dataTransfer.files);
                
                if (files.length > 0) {
                    if (!this.audioContext) {
                        this.logToTerminal('Please start audio before loading samples', 'warning');
                        return;
                    }
                    
                    const self = this;
                    const validFiles = files.filter(function(file) { return self.validateAudioFile(file); });
                    
                    if (validFiles.length === 0) {
                        this.logToTerminal('No valid audio files found', 'error');
                        return;
                    }
                    
                    if (validFiles.length === 1) {
                        const file = validFiles[0];
                        // Check if target pad is empty
                        if (this.bankSamples[this.currentBank][padNumber]) {
                            this.logToTerminal('Pad ' + padNumber + ' already has a sample. Please drop on an empty pad.', 'warning');
                            return;
                        }
                        this.logToTerminal('Loading "' + file.name + '" in Pad ' + padNumber + '...', 'info');
                        this.loadUserSample(padNumber, this.currentBank, file);
                    } else {
                        // NEW: For multiple files, find empty pads starting from target
                        this.loadMultipleFilesToPads(validFiles, padNumber);
                    }
                }
                
                const indicator = pad.querySelector('.drop-indicator');
                indicator.textContent = 'Drop here';
            }
            
            /**
             * Load multiple audio files into consecutive empty pads
             * @method loadMultipleFilesToPads
             * @param {Array<File>} files - Array of audio files to load
             * @param {number} startPadNumber - Starting pad number for loading
             * @description Distributes multiple audio files across available empty pads
             */
            loadMultipleFilesToPads(files, startPadNumber) {
                this.logToTerminal('Loading ' + files.length + ' files from Pad ' + startPadNumber + '...', 'info');
                
                // NEW: Find empty pads starting from the target pad
                const emptyPads = [];
                for (let i = startPadNumber; i <= 16; i++) {
                    if (!this.bankSamples[this.currentBank][i]) {
                        emptyPads.push(i);
                    }
                }
                
                // Also check earlier pads if we need more space
                if (emptyPads.length < files.length) {
                    for (let i = 1; i < startPadNumber; i++) {
                        if (!this.bankSamples[this.currentBank][i]) {
                            emptyPads.push(i);
                        }
                        if (emptyPads.length >= files.length) break;
                    }
                }
                
                if (emptyPads.length === 0) {
                    this.showFullBankError('load multiple files');
                    return;
                }
                
                const filesToLoad = files.slice(0, emptyPads.length);
                
                if (emptyPads.length < files.length) {
                    this.logToTerminal('Only ' + emptyPads.length + ' empty pads available. Loading ' + emptyPads.length + ' samples.', 'warning');
                }
                
                const self = this;
                filesToLoad.forEach(function(file, index) {
                    const targetPad = emptyPads[index];
                    if (targetPad <= 16) {
                        setTimeout(function() {
                            self.loadUserSample(targetPad, self.currentBank, file);
                        }, index * 100);
                    }
                });
                
                const totalLoaded = Math.min(filesToLoad.length, emptyPads.length);
                this.logToTerminal('Loading ' + totalLoaded + ' samples in available empty pads...', 'info');
            }
            
            /**
             * Validate audio file format and size
             * @method validateAudioFile
             * @param {File} file - File object to validate
             * @returns {boolean} True if file is valid, false otherwise
             * @description Checks file format, size, and browser compatibility
             */
            validateAudioFile(file) {
                if (!file) return false;
                
                // NEW: Enhanced format validation with canPlayType (Cuellos de botella fix)
                const validTypes = [
                    'audio/wav', 'audio/x-wav', 'audio/mp3', 'audio/mpeg', 
                    'audio/ogg', 'audio/aac', 'audio/m4a', 'audio/flac'
                ];
                
                const fileName = file.name.toLowerCase();
                const extension = fileName.split('.').pop();
                const validExtensions = ['wav', 'mp3', 'ogg', 'aac', 'm4a', 'flac'];
                
                // Check if browser can actually play this format
                const el = document.createElement('audio');
                const canPlay = ext => !!el.canPlayType(`audio/${ext}`);
                
                // Validate extension and browser support
                const isValidType = validTypes.includes(file.type) || 
                                   validExtensions.includes(extension);
                
                if (!isValidType) {
                    return false;
                }
                
                // Check browser support for specific formats
                if (extension === 'flac' && !canPlay('flac')) {
                    console.warn('FLAC format not supported by browser, but will attempt to load');
                }
                
                if ((extension === 'aac' || extension === 'm4a') && !canPlay('aac')) {
                    console.warn('AAC/M4A format not supported by browser, but will attempt to load');
                }
                
                if (file.size > 50 * 1024 * 1024) { // 50MB
                    return false;
                }
                
                return true;
            }
            
            /**
             * Load user-provided audio sample into a pad
             * @method loadUserSample
             * @param {number} padNumber - The pad number to load into (1-16)
             * @param {string} bank - The bank identifier ('A', 'B', 'C', 'D')
             * @param {File} file - The audio file to load
             * @description Processes and loads user audio files with error handling
             */
            loadUserSample(padNumber, bank, file) {
                try {
                    // Enhanced validations
                    if (!this.audioContext) {
                        throw new Error('Audio not initialized. Please start audio first.');
                    }
                    
                    if (!file || file.size === 0) {
                        throw new Error('Invalid or empty file.');
                    }
                    
                    if (file.size > 50 * 1024 * 1024) {
                        throw new Error('File too large. Maximum 50MB.');
                    }
                    
                    const pad = document.querySelector('.pad[data-number="' + padNumber + '"]');
                    if (pad) {
                        pad.classList.add('loading');
                    }
                    
                    const reader = new FileReader();
                    const self = this;
                
                reader.onload = function(e) {
                    self.audioContext.decodeAudioData(e.target.result).then(function(audioBuffer) {
                        self.bankSamples[bank][padNumber] = audioBuffer;
                        
                        if (bank === self.currentBank) {
                            self.samples[bank][padNumber] = audioBuffer;
                        }
                        
                        const fileName = file.name;
                        const nameWithoutExt = fileName.split('.').slice(0, -1).join('.');
                        self.sampleNames[bank][padNumber] = nameWithoutExt;
                        
                        if (pad) {
                            pad.classList.remove('loading');
                            pad.classList.add('loaded');
                            
                            const sampleIndicator = pad.querySelector('.sample-indicator');
                            if (sampleIndicator) {
                                sampleIndicator.textContent = 'Bank ' + bank;
                                sampleIndicator.style.display = 'block';
                            }
                            
                            const nameLabel = pad.querySelector('.sample-name');
                            if (nameLabel) {
                                nameLabel.textContent = nameWithoutExt;
                                nameLabel.style.display = 'block';
                            }
                            
                            const keyboardIndicator = pad.querySelector('.keyboard-indicator');
                            if (keyboardIndicator) {
                                keyboardIndicator.style.display = 'block';
                            }
                            
                            self.showLoadedEffect(pad);
                            
                            // NEW: Tactile feedback when loading user sample

                        }
                        
                        self.saveSampleInfo();
                        
                        self.logToTerminal('"' + nameWithoutExt + '" loaded in Pad ' + padNumber + ' (Bank ' + padNumber + ')', 'info');
                    }).catch(function(error) {
                        console.error('Error decoding audio:', error);
                        
                        if (pad) {
                            pad.classList.remove('loading');
                        }
                        
                        // More specific error message
                        let errorMessage = 'Error processing audio file.';
                        if (error.name === 'EncodingError') {
                            errorMessage = 'Unsupported audio format or corrupted file.';
                        } else if (error.name === 'NotSupportedError') {
                            errorMessage = 'Audio format not supported by browser.';
                        }
                        
                        self.logToTerminal(errorMessage, 'error');
                    });
                };
                
                reader.onerror = function(error) {
                    console.error('Error reading file:', error);
                    
                    if (pad) {
                        pad.classList.remove('loading');
                    }
                    
                    self.logToTerminal('Error reading file. Verify that the file is not corrupted.', 'error');
                };
                
                reader.readAsArrayBuffer(file);
                
            } catch (error) {
                console.error('Error in loadUserSample:', error);
                
                // Clean pad state in case of error
                const pad = document.querySelector('.pad[data-number="' + padNumber + '"]');
                if (pad) {
                    pad.classList.remove('loading');
                }
                
                this.logToTerminal('Error: ' + error.message, 'error');
            }
            }
            
            /**
             * Auto-load GitHub samples into banks A and B
             * @method loadAllSamples
             * @returns {Promise} Promise that resolves when all samples are loaded
             * @description Automatically loads pre-configured samples from GitHub repository
             */
            loadAllSamples() {
                this.logToTerminal('Loading GitHub samples using unified approach...', 'info');
                this.logToTerminal('Samples URL: ' + GITHUB_SAMPLES_URL, 'info');
                this.logToTerminal('Total files to load: ' + allSampleFiles.length, 'info');
                this.logToTerminal('Bank A files: ' + allSampleFiles.filter(f => f.startsWith('A_')).length + ' samples', 'info');
                this.logToTerminal('Bank B files: ' + allSampleFiles.filter(f => f.startsWith('B_')).length + ' samples', 'info');
                
                // Clear both banks to ensure clean loading
                this.bankSamples['A'] = {};
                this.bankSamples['B'] = {};
                this.sampleNames['A'] = {};
                this.sampleNames['B'] = {};
                
                const loadPromises = [];
                const self = this;
                
                // Bank A: Load 8 samples (88 BPM) into pads 1-8
                const bankAPads = [1, 2, 3, 4, 5, 6, 7, 8];
                this.logToTerminal('Loading Bank A: 8 samples (88 BPM) into pads ' + bankAPads.join(', '), 'info');
                this.logToTerminal('Samples URL: ' + GITHUB_SAMPLES_URL, 'info');
                
                allSampleFiles.filter(f => f.startsWith('A_')).forEach(function(file, index) {
                    const padNumber = bankAPads[index];
                    const pad = document.querySelector('.pad[data-number="' + padNumber + '"]');
                    
                    if (pad) {
                        pad.classList.add('loading');
                    }
                    
                    const promise = self.loadAudioForPad(padNumber, file, 'A')
                        .then(function() {
                            if (pad) {
                                pad.classList.remove('loading');
                                pad.classList.add('loaded');
                                
                                const nameWithoutExt = file.split('.').slice(0, -1).join('.');
                                self.sampleNames['A'][padNumber] = nameWithoutExt;
                                
                                self.showLoadedEffect(pad);
                                self.logToTerminal('Bank A: ' + nameWithoutExt + ' loaded in Pad ' + padNumber, 'info');
                            }
                        })
                        .catch(function(error) {
                            if (pad) {
                                pad.classList.remove('loading');
                            }
                            console.error('Error loading Bank A sample ' + padNumber + ':', error);
                            self.logToTerminal('❌ Bank A: Error loading ' + file + ' in Pad ' + padNumber + ': ' + error.message, 'error');
                        });
                    
                    loadPromises.push(promise);
                });
                
                // Bank B: Load 7 samples (135 BPM) into pads 1-7
                const bankBPads = [1, 2, 3, 4, 5, 6, 7];
                this.logToTerminal('Loading Bank B: 7 samples (135 BPM) into pads ' + bankBPads.join(', '), 'info');
                this.logToTerminal('Bank B files: ' + allSampleFiles.filter(f => f.startsWith('B_')).join(', '), 'info');
                
                allSampleFiles.filter(f => f.startsWith('B_')).forEach(function(file, index) {
                    const padNumber = bankBPads[index];
                    const pad = document.querySelector('.pad[data-number="' + padNumber + '"]');
                    
                    if (pad) {
                        pad.classList.add('loading');
                    }
                    
                    const promise = self.loadAudioForPad(padNumber, file, 'B')
                        .then(function() {
                            if (pad) {
                                pad.classList.remove('loading');
                                pad.classList.add('loaded');
                                
                                const nameWithoutExt = file.split('.').slice(0, -1).join('.');
                                self.sampleNames['B'][padNumber] = nameWithoutExt;
                                
                                self.showLoadedEffect(pad);
                                self.logToTerminal('Bank B: ' + nameWithoutExt + ' loaded in Pad ' + padNumber, 'info');
                            }
                        })
                        .catch(function(error) {
                            if (pad) {
                                pad.classList.remove('loading');
                            }
                            console.error('Error loading Bank B sample ' + padNumber + ':', error);
                            self.logToTerminal('❌ Bank B: Error loading ' + file + ' in Pad ' + padNumber + ': ' + error.message, 'error');
                        });
                    
                    loadPromises.push(promise);
                });
                
                return Promise.allSettled(loadPromises).then(function(results) {
                    // Update UI for both banks
                    self.updatePadBankIndicators();
                    self.saveSampleInfo();
                    
                    // Verify both banks loaded correctly
                    const bankACount = Object.keys(self.bankSamples['A']).length;
                    const bankBCount = Object.keys(self.bankSamples['B']).length;
                    
                                            self.logToTerminal('Bank A: ' + bankACount + ' samples loaded (88 BPM, pads 1-8)', 'info');
                        self.logToTerminal('Bank B: ' + bankBCount + ' samples loaded (135 BPM, pads 1-7)', 'info');
                        self.logToTerminal('Total: ' + (bankACount + bankBCount) + ' samples ready to play!', 'info');
                    
                    // Debug info
                    console.log('[BANK A] Samples:', self.bankSamples['A']);
                    console.log('[BANK B] Samples:', self.bankSamples['B']);
                    
                    // Return a resolved promise so the .then() callback executes
                    return Promise.resolve();
                });
            }
            
            /**
             * Load audio sample from GitHub into a specific pad
             * @method loadAudioForPad
             * @param {number} padNumber - The pad number to load into (1-16)
             * @param {string} audioName - The audio filename to load
             * @param {string} bank - The bank identifier ('A', 'B', 'C', 'D')
             * @returns {Promise<AudioBuffer>} Promise that resolves to the loaded audio buffer
             * @description Fetches and decodes audio from GitHub repository
             */
            loadAudioForPad(padNumber, audioName, bank) {
                const self = this;
                bank = bank || 'A';
                
                if (!this.audioContext) return Promise.reject(new Error('Contexto de audio no inicializado'));
                
                // Use unified samples URL with cache busting
                const audioUrl = GITHUB_SAMPLES_URL + audioName + GITHUB_VERSION;
                
                // Debug: Log the generated URL
                console.log(`Loading Bank ${bank} Pad ${padNumber}: ${audioUrl}`);
                return fetch(audioUrl)
                    .then(function(response) {
                        if (!response.ok) {
                            throw new Error('HTTP error! status: ' + response.status);
                        }
                        return response.arrayBuffer();
                    })
                    .then(function(arrayBuffer) {
                        return self.audioContext.decodeAudioData(arrayBuffer);
                    })
                    .then(function(audioBuffer) {
                        self.bankSamples[bank][padNumber] = audioBuffer;
                        
                        if (bank === self.currentBank) {
                            self.samples[bank][padNumber] = audioBuffer;
                        }
                        
                        const nameWithoutExt = audioName.split('.').slice(0, -1).join('.');
                        self.sampleNames[bank][padNumber] = nameWithoutExt;
                        
                                self.logToTerminal('Audio "' + audioName + '" loaded in Pad ' + padNumber + ' (Bank ' + bank + ')', 'info');
                        
                        return audioBuffer;
                    })
                    .catch(function(error) {
                                self.logToTerminal('Error loading audio for Pad ' + padNumber + ' (Bank ' + bank + ')', 'error');
                        throw error;
                    });
            }
            
            /**
             * Record a pad event during sequence recording
             * @method recordPadEvent
             * @param {number} padNumber - The pad number that was triggered
             * @description Records pad triggers with timing and applies quantization if enabled
             */
            recordPadEvent(padNumber) {
                const currentTime = this.audioContext.currentTime;
                
                // NEW: Calculate relative time based on mode
                let relativeTime;
                if (this.isOverdubbing) {
                    // In overdub mode, calculate time from overdub start
                    relativeTime = (currentTime - this.overdubStartTime) % (60 / this.bpm * BEATS_PER_BAR);
                } else {
                    // In normal recording mode, calculate time from sequence start
                    relativeTime = (currentTime - this.sequenceStartTime) % (60 / this.bpm * BEATS_PER_BAR);
                }
                
                // NEW: Apply quantization if enabled
                let quantizedTime = relativeTime;
                if (this.quantizeMode) {
                    quantizedTime = this.quantizeTime(relativeTime);
                }
                
                // NEW: Handle overdub mode differently
                if (this.isOverdubbing) {
                    // In overdub mode, add to existing sequence without clearing
                    this.sequence[this.currentBar].push({
                        pad: padNumber,
                        time: quantizedTime,
                        bank: this.currentBank,
                        originalTime: relativeTime,
                        quantized: this.quantizeMode,
                        overdubbed: true // NEW: Flag to indicate this was added via overdub
                    });
                    
                    const timingInfo = this.quantizeMode ? 
                        `(Original: ${relativeTime.toFixed(3)}s → Quantized: ${quantizedTime.toFixed(3)}s)` :
                        `(Time: ${relativeTime.toFixed(3)}s)`;
                    
                    console.log('Overdubbed in bar ' + (this.currentBar+1) + ', ' + timingInfo + ', bank: ' + this.currentBank);
                    console.log('[DEBUG] Overdub timing - currentTime:', currentTime.toFixed(3), 'overdubStartTime:', this.overdubStartTime.toFixed(3), 'relativeTime:', relativeTime.toFixed(3));
                } else {
                    // Normal recording mode
                    this.sequence[this.currentBar].push({
                        pad: padNumber,
                        time: quantizedTime,
                        bank: this.currentBank,
                        originalTime: relativeTime,
                        quantized: this.quantizeMode
                    });
                    
                    const timingInfo = this.quantizeMode ? 
                        `(Original: ${relativeTime.toFixed(3)}s → Quantized: ${quantizedTime.toFixed(3)}s)` :
                        `(Time: ${relativeTime.toFixed(3)}s)`;
                    
                    console.log('Recorded in bar ' + (this.currentBar+1) + ', ' + timingInfo + ', bank: ' + this.currentBank);
                    console.log('[DEBUG] Normal recording timing - currentTime:', currentTime.toFixed(3), 'sequenceStartTime:', this.sequenceStartTime.toFixed(3), 'relativeTime:', relativeTime.toFixed(3));
                }
            }
            
            // NEW: QUANTIZATION SYSTEM FUNCTIONS
            
            /**
             * Quantize time to the nearest grid step
             * @method quantizeTime
             * @param {number} time - Time in seconds
             * @returns {number} Quantized time in seconds
             * @description Applies quantization to timing values based on current grid resolution
             */
            quantizeTime(time) {
                const beatDuration = 60 / this.bpm; // Duration of one beat in seconds
                const stepDuration = beatDuration / this.gridStepsPerBeat; // Duration of one grid step
                
                // Calculate which grid step this time falls into
                const stepIndex = Math.round(time / stepDuration);
                
                // Calculate the quantized time
                const quantizedTime = stepIndex * stepDuration;
                
                // Apply quantization strength (blend between original and quantized)
                const finalTime = time + (quantizedTime - time) * this.quantizeStrength;
                
                // Ensure time stays within the bar
                return finalTime % (beatDuration * BEATS_PER_BAR);
            }
            
            /**
             * Get grid step information for a given time
             * @method getGridStepInfo
             * @param {number} time - Time in seconds
             * @returns {Object} Grid step info with step index, beat index, and timing
             * @description Calculates grid position and timing information for quantization
             */
            getGridStepInfo(time) {
                const beatDuration = 60 / this.bpm;
                const stepDuration = beatDuration / this.gridStepsPerBeat;
                const stepIndex = Math.round(time / stepDuration);
                const beatIndex = Math.floor(time / beatDuration);
                const stepInBeat = stepIndex % this.gridStepsPerBeat;
                
                return {
                    stepIndex: stepIndex,
                    beatIndex: beatIndex,
                    stepInBeat: stepInBeat,
                    stepDuration: stepDuration,
                    quantizedTime: stepIndex * stepDuration
                };
            }
            
            /**
             * Cycle through quantization strength levels
             * @method cycleQuantizeConsolidated
             * @description Cycles through quantization settings: OFF (0%), 25%, 50%, 75%, 100%
             */
            cycleQuantizeConsolidated() {
                const strengths = [0.0, 0.25, 0.5, 0.75, 1.0];
                const currentIndex = strengths.indexOf(this.quantizeStrength);
                const nextIndex = (currentIndex + 1) % strengths.length;
                this.quantizeStrength = strengths[nextIndex];
                
                // Update quantizeMode based on strength (0.0 = OFF, any other value = ON)
                this.quantizeMode = this.quantizeStrength > 0.0;
                
                // Update the QT button text and styling
                const qtBtn = document.getElementById('bank-e');
                const percentage = Math.round(this.quantizeStrength * 100);
                
                if (this.quantizeStrength === 0.0) {
                    qtBtn.textContent = 'QT OFF';
                    qtBtn.classList.remove('quantize-active');
                    qtBtn.classList.add('btn-quantize');
                    this.logToTerminal('Quantization DISABLED - Free timing recording', 'info');
                } else {
                    qtBtn.textContent = `QT ${percentage}%`;
                    qtBtn.classList.add('quantize-active');
                    qtBtn.classList.add('btn-quantize');
                    
                    let strengthDesc = '';
                    if (this.quantizeStrength === 0.25) strengthDesc = 'Light quantization';
                    else if (this.quantizeStrength === 0.5) strengthDesc = 'Medium quantization';
                    else if (this.quantizeStrength === 0.75) strengthDesc = 'Strong quantization';
                    else if (this.quantizeStrength === 1.0) strengthDesc = 'Full quantization';
                    
                    this.logToTerminal(`Quantization ENABLED - ${percentage}% - ${strengthDesc}`, 'info');
                }
                
                console.log('[QUANTIZE] Mode:', this.quantizeMode ? 'ENABLED' : 'DISABLED', 'Strength:', this.quantizeStrength);
            }
            
            /**
             * Initialize the QT button with current quantization state
             * @method initializeQTButton
             * @description Sets up the quantization button text and styling on initialization
             */
            initializeQTButton() {
                const qtBtn = document.getElementById('bank-e');
                if (!qtBtn) return;
                
                const percentage = Math.round(this.quantizeStrength * 100);
                
                if (this.quantizeStrength === 0.0) {
                    qtBtn.textContent = 'QT OFF';
                    qtBtn.classList.remove('quantize-active');
                    qtBtn.classList.add('btn-quantize');
                } else {
                    qtBtn.textContent = `QT ${percentage}%`;
                    qtBtn.classList.add('quantize-active');
                    qtBtn.classList.add('btn-quantize');
                }
            }
            
            /**
             * Show quantization grid information in terminal
             * @method showGridInfo
             * @description Displays current grid resolution and timing information for user reference
             */
            showGridInfo() {
                const beatDuration = 60 / this.bpm;
                const stepDuration = beatDuration / this.gridStepsPerBeat;
                
                this.logToTerminal(`Grid Info: ${this.gridResolution} steps per bar, ${this.gridStepsPerBeat} steps per beat`, 'info');
                this.logToTerminal(`Step duration: ${(stepDuration * 1000).toFixed(1)}ms, Beat duration: ${(beatDuration * 1000).toFixed(1)}ms`, 'info');
                
                // Show grid visualization
                let gridVisual = 'Grid: ';
                for (let beat = 0; beat < BEATS_PER_BAR; beat++) {
                    gridVisual += '|';
                    for (let step = 0; step < this.gridStepsPerBeat; step++) {
                        gridVisual += step === 0 ? '1' : '&';
                    }
                }
                gridVisual += '|';
                
                this.logToTerminal(gridVisual, 'info');
            }
            
            /**
             * Visualize audio waveform for a pad
             * @method visualize
             * @param {number} padNumber - The pad number to visualize
             * @param {AnalyserNode} analyser - Audio analyser node
             * @param {HTMLCanvasElement} canvas - Canvas element for drawing
             * @description Creates real-time audio visualization with optimized performance
             */
            visualize(padNumber, analyser, canvas) {
                console.log(`[DEBUG] visualize() called for Pad ${padNumber}: canvas=${!!canvas}, performanceMode=${this.performanceMode}`);
                
                if (!canvas || this.performanceMode) {
                    console.log(`[DEBUG] visualize() early return: canvas=${!!canvas}, performanceMode=${this.performanceMode}`);
                    return;
                }
                
                const canvasCtx = canvas.getContext('2d');
                const width = canvas.width;
                const height = canvas.height;
                const bufferLength = analyser.frequencyBinCount;
                
                console.log(`[DEBUG] Canvas dimensions: ${width}x${height}, bufferLength: ${bufferLength}`);
                
                // OPTIMIZATION: Reuse arrays to avoid garbage collection
                if (!this.waveformDataArrays) {
                    this.waveformDataArrays = {};
                }
                if (!this.waveformDataArrays[padNumber]) {
                    this.waveformDataArrays[padNumber] = new Uint8Array(bufferLength);
                }
                const waveformDataArray = this.waveformDataArrays[padNumber];
                
                if (this.visualizers[padNumber]) {
                    cancelAnimationFrame(this.visualizers[padNumber]);
                }
                
                const padColors = this.getPadColors(padNumber);
                const self = this;
                
                function draw() {
                    self.visualizers[padNumber] = requestAnimationFrame(draw);
                    
                    // OPTIMIZATION: Use more efficient getByteTimeDomainData
                    analyser.getByteTimeDomainData(waveformDataArray);
                    
                    // OPTIMIZATION: Simplified energy calculation
                    let sum = 0;
                    for (let i = 0; i < bufferLength; i += 4) { // Sample every 4 samples
                        sum += Math.abs(waveformDataArray[i] - 128);
                    }
                    const energy = (sum / (bufferLength / 4)) / 128;
                    
                    // OPTIMIZATION: Clear only the necessary area
                    canvasCtx.clearRect(0, 0, width, height);
                    
                    // OPTIMIZATION: Draw only if there is significant energy
                    if (energy > 0.01) {
                        self.drawWaveform(canvasCtx, waveformDataArray, width, height, padColors, energy);
                    }
                }
                
                draw();
            }
            
            /**
             * Draw waveform visualization on canvas
             * @method drawWaveform
             * @param {CanvasRenderingContext2D} ctx - Canvas 2D context
             * @param {Uint8Array} dataArray - Audio waveform data
             * @param {number} width - Canvas width
             * @param {number} height - Canvas height
             * @param {Object} colors - Color configuration object
             * @param {number} energy - Audio energy level (0-1)
             * @description Renders audio waveform with smooth curves and visual effects
             */
            drawWaveform(ctx, dataArray, width, height, colors, energy) {
                const bufferLength = dataArray.length;
                const sliceWidth = width / bufferLength;
                
                // Center line
                ctx.beginPath();
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.lineWidth = 1;
                ctx.moveTo(0, height / 2);
                ctx.lineTo(width, height / 2);
                ctx.stroke();
                
                // Configure main line
                ctx.lineWidth = 2 + energy * 5;
                ctx.strokeStyle = colors.primary;
                ctx.shadowColor = colors.primary;
                ctx.shadowBlur = 10 * energy;
                
                // Draw main waveform
                ctx.beginPath();
                
                let x = 0;
                for (let i = 0; i < bufferLength; i++) {
                    const v = dataArray[i] / 128.0;
                    const y = v * height / 2;
                    
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        const prevX = x - sliceWidth;
                        const prevY = dataArray[i - 1] / 128.0 * height / 2;
                        const cpx1 = prevX + sliceWidth / 3;
                        const cpx2 = x - sliceWidth / 3;
                        
                        if (Math.abs(y - prevY) > height * 0.1) {
                            ctx.lineTo(x, y);
                        } else {
                            ctx.bezierCurveTo(cpx1, prevY, cpx2, y, x, y);
                        }
                    }
                    
                    x += sliceWidth;
                }
                
                ctx.stroke();
                ctx.shadowBlur = 0;
                
                // Reflection line
                ctx.lineWidth = 1 + energy * 2;
                ctx.strokeStyle = colors.secondary;
                ctx.globalAlpha = 0.3;
                
                ctx.beginPath();
                x = 0;
                
                for (let i = 0; i < bufferLength; i++) {
                    const v = dataArray[i] / 128.0;
                    const y = height - (v * height / 2);
                    
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                    
                    x += sliceWidth;
                }
                
                ctx.stroke();
                ctx.globalAlpha = 1.0;
            }
            
            /**
             * Get color scheme for pad visualization
             * @method getPadColors
             * @param {number} padNumber - The pad number (1-16)
             * @returns {Object} Color configuration object
             * @description Returns color scheme for waveform visualization
             */
            getPadColors(padNumber) {
                return {
                    primary: 'var(--shadow-color-dark)',    // Dark GameBoy green
                    secondary: 'var(--shadow-color-light)'  // Light GameBoy green
                };
            }
            
            /**
             * Resize all pad visualization canvases
             * @method resizeCanvases
             * @description Adjusts canvas dimensions to match pad sizes for proper visualization
             */
            resizeCanvases() {
                const pads = document.querySelectorAll('.pad');
                console.log(`[DEBUG] resizeCanvases: Found ${pads.length} pads`);
                pads.forEach(function(pad, index) {
                    const canvas = pad.querySelector('.visualizer');
                    if (canvas) {
                        canvas.width = pad.offsetWidth;
                        canvas.height = pad.offsetHeight;
                        console.log(`[DEBUG] Pad ${index + 1}: Canvas resized to ${canvas.width}x${canvas.height}`);
                    } else {
                        console.log(`[DEBUG] Pad ${index + 1}: No canvas found`);
                    }
                });
            }
            
            /**
             * Open the sample slicer modal for a specific pad
             * @method openSlicerModal
             * @param {number} padNumber - The pad number containing the sample to slice
             * @param {number} maxAvailableSlices - Maximum number of slices that can be created
             * @description Opens the slicer interface for sample manipulation
             */
            openSlicerModal(padNumber, maxAvailableSlices = null) {
                if (!this.samples[this.currentBank] || !this.samples[this.currentBank][padNumber]) {
                    this.logToTerminal('No sample in this pad to slice', 'error');
                    return;
                }
                
                const duration = this.samples[this.currentBank][padNumber].duration;
                if (duration < 1) {
                    this.logToTerminal('Sample is too short to slice', 'error');
                    return;
                }
                
                this.slicerSourcePad = padNumber;
                this.slicerSourceBuffer = this.samples[this.currentBank][padNumber];
                
                const sampleName = this.sampleNames[this.currentBank][padNumber] || ('Sample ' + padNumber);
                const durationText = duration.toFixed(2) + 's';
                
                // Use provided maxSlices or calculate based on available space
                const maxSlices = maxAvailableSlices || this.calculateAvailablePadsForSlicing(padNumber).length;
                let infoText = 'Slice "' + sampleName + '" (' + durationText + ')';
                infoText += '\nSlices from Pad ' + padNumber;
                infoText += '\nAvailable space: ' + maxSlices + ' slices';
                
                document.getElementById('slicer-info').textContent = infoText;
                this.updateSlicerButtons(maxSlices);
                document.getElementById('slicer-modal').style.display = 'flex';
                
                this.logToTerminal('Slicer opened for Pad ' + padNumber + ' with ' + maxSlices + ' available slices', 'info');
            }
            
            /**
             * Update slicer modal buttons based on available space
             * @method updateSlicerButtons
             * @param {number} maxSlices - Maximum number of slices that can be created
             * @description Configures slicer buttons based on available pad space
             */
            updateSlicerButtons(maxSlices) {
                const buttonsContainer = document.getElementById('slicer-buttons');
                buttonsContainer.innerHTML = '';
                
                const sliceOptions = [
                    { count: 4, label: '4 Slices' },
                    { count: 8, label: '8 Slices' },
                    { count: 16, label: '16 Slices' }
                ];
                
                const self = this;
                sliceOptions.forEach(function(option) {
                    const button = document.createElement('button');
                    button.className = 'slicer-btn';
                    button.textContent = option.label;
                    
                    if (option.count <= maxSlices) {
                        button.onclick = function() { self.applySlicer(option.count); };
                    } else {
                        button.disabled = true;
                        button.style.opacity = '0.5';
                        button.style.cursor = 'not-allowed';
                        button.textContent = option.label + ' (no space)';
                    }
                    
                    buttonsContainer.appendChild(button);
                });
            }
            
            /**
             * Close the sample slicer modal
             * @method closeSlicerModal
             * @description Closes the slicer interface and resets related state
             */
            closeSlicerModal() {
                document.getElementById('slicer-modal').style.display = 'none';
                this.slicerSourcePad = null;
                this.slicerSourceBuffer = null;
                this.logToTerminal('Slicer cancelled', 'info');
            }
            
            /**
             * Apply slicing to create multiple sample slices
             * @method applySlicer
             * @param {number} numSlices - Number of slices to create (4, 8, or 16)
             * @description Creates and distributes sample slices across available pads
             */
            applySlicer(numSlices) {
                if (!this.slicerSourceBuffer || !this.slicerSourcePad) {
                    this.logToTerminal('Error: No sample to slice', 'error');
                    return;
                }
                
                try {
                    this.logToTerminal('Slicing into ' + numSlices + ' parts...', 'info');
                    
                    const slices = this.createSlices(this.slicerSourceBuffer, numSlices);
                    this.distributeSlices(slices, this.slicerSourcePad);
                    
                    this.closeSlicerModal();
                    
                    const endPad = this.slicerSourcePad + numSlices - 1;
                    
                    // NEW: Tactile feedback when creating slices

                    
                    this.logToTerminal(numSlices + ' slices: Pads ' + this.slicerSourcePad + '-' + Math.min(endPad, 16), 'info');
                    
                } catch (error) {
                    console.error('Error in slicer:', error);
                    this.logToTerminal('Error creating slices', 'error');
                }
            }
            
            /**
             * Create sample slices from source buffer
             * @method createSlices
             * @param {AudioBuffer} sourceBuffer - Source audio buffer to slice
             * @param {number} numSlices - Number of slices to create
             * @returns {Array} Array of slice objects with buffer references
             * @description Creates non-destructive slices using buffer references and timing offsets
             */
            createSlices(sourceBuffer, numSlices) {
                // NEW: Non-destructive slicing (Cuellos de botella fix)
                const slices = [];
                const totalFrames = sourceBuffer.length;
                const framesPerSlice = Math.floor(totalFrames / numSlices);
                const sampleRate = sourceBuffer.sampleRate;
                const numberOfChannels = sourceBuffer.numberOfChannels;
                
                for (let i = 0; i < numSlices; i++) {
                    const startFrame = i * framesPerSlice;
                    const endFrame = Math.min(startFrame + framesPerSlice, totalFrames);
                    const sliceLength = endFrame - startFrame;
                    
                    // Crear slice como referencia al buffer original + offset + duration
                    const slice = {
                        buffer: sourceBuffer,
                        offset: startFrame / sampleRate,
                        duration: sliceLength / sampleRate,
                        startFrame: startFrame,
                        endFrame: endFrame
                    };
                    
                    slices.push(slice);
                }
                
                return slices;
            }
            
            /**
             * Distribute sample slices across available pads
             * @method distributeSlices
             * @param {Array} slices - Array of slice objects to distribute
             * @param {number} startPadNumber - Starting pad number for distribution
             * @description Places slice objects into available pads and updates UI indicators
             */
            distributeSlices(slices, startPadNumber) {
                const sourcePadName = this.sampleNames[this.currentBank][this.slicerSourcePad] || 
                                     ('Sample ' + this.slicerSourcePad);
                
                // NEW: Find available empty pads starting from the next available pad
                const availablePads = this.findAvailablePadsForSlicing(startPadNumber);
                
                // Check if this is the special case (only 1 sample in bank)
                const totalSamples = Object.keys(this.samples[this.currentBank] || {}).length;
                const isSpecialCase = totalSamples === 1;
                
                if (isSpecialCase) {
                    this.logToTerminal('Special case: Only 1 sample in bank. Creating ' + slices.length + ' slices (will overwrite pad 1)', 'warning');
                } else if (availablePads.length < slices.length) {
                    this.logToTerminal('Warning: Only ' + availablePads.length + ' empty pads available for ' + slices.length + ' slices', 'warning');
                }
                
                const self = this;
                slices.forEach(function(slice, index) {
                    if (index < availablePads.length) {
                        const targetPad = availablePads[index];
                        
                        // NEW: Store slice reference instead of copied buffer
                        self.bankSamples[self.currentBank][targetPad] = slice;
                        self.samples[self.currentBank][targetPad] = slice;
                        
                        const sliceNumber = (index + 1).toString().padStart(2, '0');
                        const sliceName = sourcePadName + '-Slice' + sliceNumber;
                        self.sampleNames[self.currentBank][targetPad] = sliceName;
                        
                        const pad = document.querySelector('.pad[data-number="' + targetPad + '"]');
                        if (pad) {
                            pad.classList.add('loaded');
                            
                            const sliceIndicator = pad.querySelector('.slice-indicator');
                            if (sliceIndicator) {
                                sliceIndicator.textContent = sliceNumber + '/' + slices.length.toString().padStart(2, '0');
                                sliceIndicator.style.display = 'block';
                            }
                        }
                    }
                });
                
                this.updatePadBankIndicators();
                this.saveSampleInfo();
                
                const usedPads = Math.min(slices.length, availablePads.length);
                this.logToTerminal(usedPads + ' slices distributed in pads: ' + availablePads.slice(0, usedPads).join(', '), 'info');
            }
            
            /**
             * Find available empty pads for slicing operations
             * @method findAvailablePadsForSlicing
             * @param {number} sourcePad - Source pad number (excluded from results)
             * @returns {Array<number>} Array of available empty pad numbers
             * @description Identifies empty pads available for placing slice results
             * Special case: When only 1 sample exists, allows 16 slices by including pad 1
             */
            findAvailablePadsForSlicing(sourcePad) {
                const availablePads = [];
                
                // Count total samples in current bank
                const totalSamples = Object.keys(this.samples[this.currentBank] || {}).length;
                
                // Special case: If only 1 sample exists in the bank, allow 16 slices
                // This will overwrite the first pad with the first slice
                if (totalSamples === 1) {
                    for (let i = 1; i <= 16; i++) {
                        availablePads.push(i);
                    }
                    return availablePads;
                }
                
                // Start from the next pad after the source pad
                for (let i = sourcePad + 1; i <= 16; i++) {
                    if (!this.samples[this.currentBank] || !this.samples[this.currentBank][i]) {
                        availablePads.push(i);
                    }
                }
                
                // If we don't have enough pads after the source, look for any empty pads
                if (availablePads.length === 0) {
                    for (let i = 1; i <= 16; i++) {
                        if (i !== sourcePad && (!this.samples[this.currentBank] || !this.samples[this.currentBank][i])) {
                            availablePads.push(i);
                        }
                    }
                }
                
                return availablePads;
            }
            
            /**
             * Create metronome click sound
             * @method createMetronomeSound
             * @param {boolean} isAccented - Whether this is an accented beat (first beat of bar)
             * @description Generates metronome audio feedback for timing reference
             */
            createMetronomeSound(isAccented) {
                isAccented = isAccented || false;
                if (!this.audioContext) return;
                
                const oscillator = this.audioContext.createOscillator();
                oscillator.type = 'sine';
                
                oscillator.frequency.setValueAtTime(
                    isAccented ? 880 : 440, 
                    this.audioContext.currentTime
                );
                
                const gainNode = this.audioContext.createGain();
                gainNode.gain.setValueAtTime(
                    isAccented ? 0.2 : 0.1, 
                    this.audioContext.currentTime
                );
                gainNode.gain.exponentialRampToValueAtTime(
                    0.001, 
                    this.audioContext.currentTime + 0.1
                );
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.1);
            }
            
            /**
             * Create accented metronome sound for first beat
             * @method createAccentedMetronomeSound
             * @description Generates accented metronome click for bar start indication
             */
            createAccentedMetronomeSound() {
                this.createMetronomeSound(true);
            }
            
            /**
             * Start the metronome system
             * @method startMetronome
             * @description Initiates metronome timing with visual and audio feedback
             */
            startMetronome() {
                if (this.metronomeInterval) {
                    clearInterval(this.metronomeInterval);
                }
                
                const beatDuration = 60000 / this.bpm;
                let tickCount = 0;
                
                this.currentBeat = 1;
                this.currentBar = 0; // Aseguramos que empezamos en el compás 1
                this.updateBarBeatDisplay();
                
                this.createAccentedMetronomeSound();
                
                const self = this;
                this.metronomeInterval = setInterval(function() {
                    tickCount++;
                    
                    // Actualizar el pulso basado en el tick
                    self.currentBeat = (tickCount % BEATS_PER_BAR) + 1;
                    
                    // Actualizar el compás cuando completamos un ciclo de pulsos
                    if (self.currentBeat === 1) {
                        self.currentBar = Math.floor(tickCount / BEATS_PER_BAR) % BAR_COUNT;
                    }
                    
                    // Actualizar la UI
                    self.updateBarBeatDisplay();
                    
                    // Reproducir sonido del metrónomo
                    if (self.currentBeat === 1) {
                        self.createAccentedMetronomeSound();
                    } else {
                        self.createMetronomeSound();
                    }
                }, beatDuration);
            }
            
            /**
             * Stop the metronome system
             * @method stopMetronome
             * @description Stops metronome timing and clears interval
             */
            stopMetronome() {
                if (this.metronomeInterval) {
                    clearInterval(this.metronomeInterval);
                    this.metronomeInterval = null;
                }
            }
            
            /**
             * Update bar and beat display in the UI
             * @method updateBarBeatDisplay
             * @description Updates the current bar and beat indicators
             */
            updateBarBeatDisplay() {
                document.getElementById('current-bar').textContent = this.currentBar + 1;
                document.getElementById('current-beat').textContent = this.currentBeat;
            }
            
            /**
             * Start bar advancement system for recording and playback
             * @method startBarAdvancement
             * @description Manages bar progression and automatic playback after recording
             */
            startBarAdvancement() {
                if (this.beatInterval) {
                    clearInterval(this.beatInterval);
                }
                
                let totalBarsRecorded = 0;
                let tickCount = 0;
                const self = this;
                const beatDuration = 60000 / this.bpm;
                
                // Inicializar contadores
                this.currentBar = 0;
                this.currentBeat = 1;
                this.updateBarBeatDisplay();
                
                this.beatInterval = setInterval(function() {
                    if (self.isRecording) {
                        tickCount++;
                        
                        // Actualizar el pulso basado en el tick
                        self.currentBeat = (tickCount % BEATS_PER_BAR) + 1;
                        document.getElementById('current-beat').textContent = self.currentBeat;
                        
                        // Si completamos un compás
                        if (self.currentBeat === 1) {
                            // Durante la grabación, avanzar secuencialmente (0 a 3)
                            self.currentBar = Math.floor(tickCount / BEATS_PER_BAR) % BAR_COUNT;
                            document.getElementById('current-bar').textContent = self.currentBar + 1;
                            
                            totalBarsRecorded++;
                            
                            if (totalBarsRecorded >= BAR_COUNT) {
                                self.isRecording = false;
                                self.isPlaying = true;
                                
                                self.stopMetronome();
                                
                                document.getElementById('record-sequence').textContent = "REC";
                                document.getElementById('record-sequence').classList.remove('active');
                                
                                // AUTO: Activate play button to show sequence is playing
                                document.getElementById('play-sequence').classList.add('active');
                                
                                self.logToTerminal('Recording completed. Starting playback with deterministic scheduler...', 'info');
                                
                                // AUTO: Start the deterministic scheduler instead of old system
                                self.startSequence();
                            }
                            else {
                                const statusMsg = 'Recording bar ' + (self.currentBar + 1) + '... (' + totalBarsRecorded + '/' + BAR_COUNT + ')';
                                self.logToTerminal(statusMsg, 'info');
                            }
                        }
                    } else {
                        self.stopTimers();
                    }
                }, beatDuration);
            }
            
            /**
             * Show quantization statistics after recording
             * @method showQuantizationStats
             * @description Displays timing accuracy statistics for recorded events
             */
            showQuantizationStats() {
                if (!this.quantizeMode) return;
                
                let totalHits = 0;
                let quantizedHits = 0;
                let totalQuantizationError = 0;
                
                this.sequence.forEach((bar, barIndex) => {
                    bar.forEach(event => {
                        if (event.quantized && event.originalTime !== undefined) {
                            totalHits++;
                            quantizedHits++;
                            const error = Math.abs(event.time - event.originalTime);
                            totalQuantizationError += error;
                        }
                    });
                });
                
                if (quantizedHits > 0) {
                    const avgError = totalQuantizationError / quantizedHits;
                    const avgErrorMs = avgError * 1000;
                    
                    this.logToTerminal(`Quantization Stats: ${quantizedHits} hits quantized`, 'info');
                    this.logToTerminal(`Average timing error: ${avgErrorMs.toFixed(1)}ms`, 'info');
                    
                    if (avgErrorMs < 10) {
                        this.logToTerminal('Excellent timing precision!', 'info');
                    } else if (avgErrorMs < 25) {
                        this.logToTerminal('Good timing precision', 'info');
                    } else {
                        this.logToTerminal('Consider increasing quantization strength', 'warning');
                    }
                }
            }
            
            // NEW: SCHEDULER DETERMINISTA FUNCTIONS (Cuellos de botella fix)
            
            /**
             * Start sequence playback with deterministic scheduler
             * @method startSequence
             * @description Initiates the deterministic musical scheduler for sequence playback
             */
            startSequence() {
                // Clean up any existing audio sources before starting new sequence
                this.cleanupActiveSources();
                
                this.isPlaying = true;
                this.sequenceStartTime = this.audioContext.currentTime + 0.05; // pequeño offset
                this.nextNoteTime = this.sequenceStartTime;
                this.currentBar = 0; // Reset to start of sequence
                this.currentBeat = 1;
                this.updateBarBeatDisplay();
                
                this.logToTerminal('Starting deterministic scheduler with loop', 'info');
                this.schedulerTimer = setInterval(() => this.schedulerTick(), LOOKAHEAD * 1000);
            }
            
            /**
             * Scheduler tick - processes events in timeline
             * @method schedulerTick
             * @description Main scheduler loop that processes scheduled events and advances timeline
             */
            schedulerTick() {
                const now = this.audioContext.currentTime;
                const loopDuration = this.barDuration() * BAR_COUNT;
                
                // Update current bar based on elapsed time since sequence start
                if (this.sequenceStartTime > 0) {
                    const elapsedTime = now - this.sequenceStartTime;
                    const currentCycle = Math.floor(elapsedTime / loopDuration);
                    const timeInCurrentCycle = elapsedTime % loopDuration;
                    this.currentBar = Math.floor(timeInCurrentCycle / this.barDuration());
                    this.currentBeat = Math.floor((timeInCurrentCycle % this.barDuration()) / this.beatDuration()) + 1;
                    this.updateBarBeatDisplay();
                    
                    // Log loop completion
                    if (this.currentBar === 0 && this.currentBeat === 1) {
                        this.logToTerminal(`Loop ${currentCycle + 1}: Starting new sequence cycle`, 'info');
                    }
                }
                
                // Schedule events for the look-ahead horizon
                while (this.nextNoteTime < now + SCHEDULE_AHEAD_TIME) {
                    // Calculate which cycle and bar this time represents
                    const timeFromStart = this.nextNoteTime - this.sequenceStartTime;
                    const cycle = Math.floor(timeFromStart / loopDuration);
                    const timeInCycle = timeFromStart % loopDuration;
                    const barIndex = Math.floor(timeInCycle / this.barDuration());
                    
                    // Get events from the calculated bar
                    const bar = this.sequence[barIndex];
                    if (bar && bar.length > 0) {
                        for (const ev of bar) {
                            const when = this.sequenceStartTime + (cycle * loopDuration) + (barIndex * this.barDuration()) + ev.time;
                            // NEW: Prevent scheduling events that are too close to current time
                            if (when >= now + 0.01 && when < now + SCHEDULE_AHEAD_TIME) {
                                this.logToTerminal(`Scheduling event: Pad ${ev.pad} at ${when.toFixed(3)}s (Bar ${barIndex + 1}, Cycle ${cycle + 1})`, 'info');
                                this.triggerScheduled(ev, when);
                            } else if (when < now + 0.01) {
                                console.log(`[DEBUG] Skipping event too close to current time: Pad ${ev.pad} at ${when.toFixed(3)}s (current: ${now.toFixed(3)}s)`);
                            }
                        }
                    }
                    
                    // Advance to next grid step
                    this.nextNoteTime += this.beatDuration() / GRID_STEPS_PER_BEAT;
                }
            }
            
            /**
             * Trigger scheduled event with bank switching
             * @method triggerScheduled
             * @param {Object} ev - Event object with pad and bank information
             * @param {number} when - When to trigger the event (audio timeline)
             * @description Executes scheduled events with automatic bank switching
             */
            triggerScheduled(ev, when) {
                // NEW: Prevent duplicate event execution
                const eventKey = `${ev.pad}-${ev.bank || this.currentBank}-${when.toFixed(3)}`;
                if (this.scheduledEvents.has(eventKey)) {
                    console.log(`[DEBUG] Duplicate event prevented: ${eventKey}`);
                    return;
                }
                
                // Mark this event as scheduled
                this.scheduledEvents.add(eventKey);
                
                // Clean up old events after a reasonable time
                setTimeout(() => {
                    this.scheduledEvents.delete(eventKey);
                }, 1000); // Keep for 1 second to prevent duplicates
                
                const originalBank = this.currentBank;
                if (ev.bank && ev.bank !== originalBank) this.selectBank(ev.bank);
                this.playPad(ev.pad, when); // <-- usa la nueva firma con when
                if (ev.bank && ev.bank !== originalBank) setTimeout(() => this.selectBank(originalBank), 0);
            }
            
            /**
             * Queue bar for scheduler processing
             * @method queueBar
             * @param {number} barIndex - Index of the bar to queue (0-3)
             * @description Prepares the next bar for scheduler processing
             */
            queueBar(barIndex) {
                // Preparar la siguiente barra para el scheduler
                if (barIndex < BAR_COUNT && this.sequence[barIndex]) {
                    this.logToTerminal(`Bar ${barIndex + 1} queued for scheduler`, 'info');
                }
            }
            
            /**
             * Calculate bar duration in seconds
             * @method barDuration
             * @returns {number} Duration of one bar in seconds
             * @description Calculates the time duration of a complete bar based on current BPM
             */
            barDuration() { 
                return (60 / this.bpm) * BEATS_PER_BAR; 
            }
            
            /**
             * Calculate beat duration in seconds
             * @method beatDuration
             * @returns {number} Duration of one beat in seconds
             * @description Calculates the time duration of one beat based on current BPM
             */
            beatDuration() { 
                return 60 / this.bpm; 
            }
            
            /**
             * Clean up all active audio sources to prevent double playback
             * @method cleanupActiveSources
             * @description Stops and disconnects all active audio sources to ensure clean state
             */
            cleanupActiveSources() {
                let sourcesCleaned = 0;
                const activeSourceKeys = Object.keys(this.activeSources);
                
                activeSourceKeys.forEach(padNumber => {
                    if (this.activeSources[padNumber]) {
                        try {
                            this.activeSources[padNumber].stop();
                            this.activeSources[padNumber].disconnect();
                            delete this.activeSources[padNumber];
                            sourcesCleaned++;
                        } catch (error) {
                            console.warn('Error cleaning up audio source for pad', padNumber, error);
                        }
                    }
                });
                
                // NEW: Clear scheduled events to prevent duplicates
                this.scheduledEvents.clear();
                
                if (sourcesCleaned > 0) {
                    this.logToTerminal(`Cleaned up ${sourcesCleaned} active audio sources`, 'info');
                }
            }
            
            /**
             * Stop sequence playback and scheduler
             * @method stopSequence
             * @description Stops sequence playback, cleans up all timers and resets state
             */
            stopSequence() {
                this.logToTerminal('Stopping sequence playback...', 'info');
                
                // Stop deterministic scheduler
                if (this.schedulerTimer) {
                    clearInterval(this.schedulerTimer);
                    this.schedulerTimer = null;
                }
                
                this.isPlaying = false;
                this.isRecording = false; // Also stop recording if active
                
                this.stopTimers();
                
                // Clean up all active audio sources to prevent double playback
                this.cleanupActiveSources();
                
                // NEW: Clear scheduled events when stopping sequence
                this.scheduledEvents.clear();
                
                // NEW: Deactivate edit mode when stopping sequence
                if (this.isEditMode) {
                    this.exitEditMode();
                }
                
                // Reset UI buttons
                const playBtn = document.getElementById('play-sequence');
                const recordBtn = document.getElementById('record-sequence');
                
                if (playBtn) playBtn.classList.remove('active');
                if (recordBtn) {
                    recordBtn.classList.remove('active');
                    recordBtn.textContent = 'REC';
                }
                
                // Reset counters
                this.currentBar = 0;
                this.currentBeat = 1;
                this.updateBarBeatDisplay();
                
                // AUTO: Return to performance mode when sequence stops
                console.log(`[DEBUG] Before sequence stop: performanceMode=${this.performanceMode}`);
                if (!this.performanceMode) {
                    this.performanceMode = true;
                    console.log(`[DEBUG] Switched back to performance mode: performanceMode=${this.performanceMode}`);
                    this.logToTerminal('Auto-switched back to performance mode (minimum latency)', 'info');
                } else {
                    console.log(`[DEBUG] Already in performance mode: performanceMode=${this.performanceMode}`);
                }
                
                this.logToTerminal('Sequence playback stopped and reset', 'info');
            }
            
            /**
             * Toggle recording state
             * @method toggleRecording
             * @description Switches between recording and stopped states
             */
            toggleRecording() {
                if (this.isRecording) {
                    this.stopRecording();
                } else {
                    this.startRecording();
                }
            }
            
            /**
             * Toggle overdub state
             * @method toggleOverdub
             * @description Switches between overdub and stopped states
             */
            toggleOverdub() {
                if (this.isRecording) {
                    this.stopRecording();
                } else {
                    this.startOverdub();
                }
            }
            
            /**
             * Start sequence recording
             * @method startRecording
             * @description Begins recording a new sequence with metronome count-in
             * @throws {Error} If audio system is not initialized
             */
            startRecording() {
                if (!this.audioContext) {
                    this.logToTerminal('Please start audio before recording.', 'warning');
                    return;
                }
                
                if (this.isPlaying) {
                    this.isPlaying = false;
                    document.getElementById('play-sequence').classList.remove('active');
                }
                
                this.isRecording = true;
                this.sequence = Array(BAR_COUNT).fill().map(function() { return []; });
                this.currentBar = 0;
                this.currentBeat = 1;
                
                const recordBtn = document.getElementById('record-sequence');
                recordBtn.textContent = "STOP";
                recordBtn.classList.add('active');
                this.updateBarBeatDisplay();
                
                // NEW: Show quantization and grid information
                if (this.quantizeMode) {
                    this.logToTerminal('Preparing to record with QUANTIZATION...', 'info');
                    this.showGridInfo();
                } else {
                    this.logToTerminal('Preparing to record (FREE TIMING)...', 'info');
                }
                
                this.startPrecount();
            }
            
            /**
             * Start sequence overdub (add to existing sequence)
             * @method startOverdub
             * @description Begins overdubbing to add events to existing sequence
             * @throws {Error} If audio system is not initialized or no sequence exists
             */
            startOverdub() {
                if (!this.audioContext) {
                    this.logToTerminal('Please start audio before overdubbing.', 'warning');
                    return;
                }
                
                // Check if there's an existing sequence to overdub
                if (!this.hasRecordedSequence()) {
                    this.logToTerminal('No existing sequence to overdub. Use REC to create a new sequence first.', 'warning');
                    return;
                }
                
                if (this.isPlaying) {
                    this.isPlaying = false;
                    document.getElementById('play-sequence').classList.remove('active');
                }
                
                this.isRecording = true;
                this.isOverdubbing = true; // NEW: Flag to indicate overdub mode
                this.currentBar = 0;
                this.currentBeat = 1;
                
                // NEW: Store the original sequence start time for overdub
                this.overdubStartTime = this.audioContext.currentTime;
                
                const overdubBtn = document.getElementById('overdub-sequence');
                overdubBtn.textContent = "STOP";
                overdubBtn.classList.add('active');
                this.updateBarBeatDisplay();
                
                // NEW: Show quantization and grid information for overdub
                if (this.quantizeMode) {
                    this.logToTerminal('Preparing to overdub with QUANTIZATION...', 'info');
                    this.showGridInfo();
                } else {
                    this.logToTerminal('Preparing to overdub (FREE TIMING)...', 'info');
                }
                
                this.logToTerminal('Overdub mode: Adding to existing sequence...', 'info');
                this.startPrecount();
            }
            
            /**
             * Start pre-count metronome before recording
             * @method startPrecount
             * @description Provides count-in beats before actual recording begins
             */
            startPrecount() {
                let preCountRemaining = PRE_COUNT_BARS * BEATS_PER_BAR;
                this.startMetronome();
                
                // NEW: Timeline-based pre-count (Cuellos de botella fix)
                const self = this;
                const beatDuration = 60 / this.bpm;
                
                function preCount() {
                    if (preCountRemaining > 0) {
                        self.logToTerminal('Pre-count: ' + Math.ceil(preCountRemaining / BEATS_PER_BAR), 'info');
                        preCountRemaining--;
                        
                        // Programar el siguiente click en la timeline
                        const nextClickTime = self.audioContext.currentTime + beatDuration;
                        self.scheduleMetronomeClick(nextClickTime, preCountRemaining === 0);
                        
                        // Programar la siguiente función preCount
                        setTimeout(preCount, beatDuration * 1000);
                    } else {
                        // NEW: Handle overdub mode differently
                        if (self.isOverdubbing) {
                            // In overdub mode, don't change sequenceStartTime
                            self.logToTerminal('Overdubbing sequence...', 'info');
                        } else {
                            // In normal recording mode, set new sequence start time
                            self.sequenceStartTime = self.audioContext.currentTime;
                            self.logToTerminal('Recording sequence...', 'info');
                        }
                        self.startBarAdvancement();
                    }
                }
                
                preCount();
            }
            
            /**
             * Schedule metronome click in audio timeline
             * @method scheduleMetronomeClick
             * @param {number} when - When to play the click (audio timeline)
             * @param {boolean} isAccented - Whether this is an accented beat
             * @description Schedules metronome clicks directly on the Web Audio timeline
             */
            scheduleMetronomeClick(when, isAccented) {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(
                    isAccented ? 880 : 440, 
                    when
                );
                
                gainNode.gain.setValueAtTime(
                    isAccented ? 0.2 : 0.1, 
                    when
                );
                gainNode.gain.exponentialRampToValueAtTime(
                    0.001, 
                    when + 0.1
                );
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.start(when);
                oscillator.stop(when + 0.1);
            }
            
            /**
             * Stop sequence recording
             * @method stopRecording
             * @description Stops recording and switches to playback mode
             */
            stopRecording() {
                this.isRecording = false;
                
                // NEW: Handle overdub mode differently
                if (this.isOverdubbing) {
                    this.isOverdubbing = false;
                    const overdubBtn = document.getElementById('overdub-sequence');
                    overdubBtn.textContent = "DUB";
                    overdubBtn.classList.remove('active');
                    this.logToTerminal('Overdub stopped - sequence updated', 'info');
                } else {
                    const recordBtn = document.getElementById('record-sequence');
                    recordBtn.textContent = "REC";
                    recordBtn.classList.remove('active');
                    this.logToTerminal('Recording stopped', 'info');
                }
                
                this.stopTimers();
                
                // AUTO: Return to performance mode when recording stops
                if (!this.performanceMode) {
                    this.performanceMode = true;
                    this.logToTerminal('Auto-switched back to performance mode (minimum latency)', 'info');
                }
            }
            
            /**
             * Start sequence playback
             * @method playSequence
             * @description Begins playing the recorded sequence with deterministic scheduler
             */
            playSequence() {
                if (this.isPlaying) return;
                
                if (!this.audioContext) {
                    this.logToTerminal('Please start audio before playing.', 'warning');
                    return;
                }
                
                const hasSequenceData = this.sequence.some(function(bar) { return bar.length > 0; });
                if (!hasSequenceData) {
                    this.logToTerminal('No recorded sequence to play.', 'warning');
                    return;
                }
                
                this.isPlaying = true;
                this.currentBar = 0;
                this.currentBeat = 1;
                this.updateBarBeatDisplay();
                
                document.getElementById('play-sequence').classList.add('active');
                
                // AUTO: Activate visualization mode when sequence starts playing
                console.log(`[DEBUG] Before sequence start: performanceMode=${this.performanceMode}`);
                if (this.performanceMode) {
                    this.performanceMode = false;
                    console.log(`[DEBUG] Switched to visualization mode: performanceMode=${this.performanceMode}`);
                    this.logToTerminal('Auto-switched to visualization mode for sequence playback', 'info');
                } else {
                    console.log(`[DEBUG] Already in visualization mode: performanceMode=${this.performanceMode}`);
                }
                
                this.logToTerminal('Playing sequence with deterministic scheduler', 'info');
                
                // NEW: Use deterministic scheduler instead of old system
                this.startSequence();
            }
            
            /**
             * Play the current bar of the sequence (Legacy method - now uses deterministic scheduler)
             * @method playCurrentBar
             * @description This method is kept for compatibility but the main playback now uses the deterministic scheduler
             */
            playCurrentBar() {
                // This method is deprecated - the deterministic scheduler handles all playback
                // Keeping it for backward compatibility but it should not be used for main sequence playback
                this.logToTerminal('Warning: playCurrentBar is deprecated. Use startSequence() instead.', 'warning');
                
                if (!this.isPlaying) return;
                
                // For manual play button, start the deterministic scheduler
                this.startSequence();
            }
            

            
            /**
             * Stop all audio and sequences
             * @method stopAll
             * @description Stops all audio playback, sequences, and resets system state
             */
            async stopAll() {
                this.logToTerminal('Stopping all audio and sequences...', 'info');
                
                // Stop sequence playback with new scheduler
                this.stopSequence();
                
                // Stop all active audio samples
                let stoppedSamples = 0;
                const activeSourceKeys = Object.keys(this.activeSources);
                
                if (activeSourceKeys.length === 0) {
                    this.logToTerminal('No active audio sources to stop', 'info');
                } else {
                    this.logToTerminal('Stopping ' + activeSourceKeys.length + ' active audio sources...', 'info');
                    
                    activeSourceKeys.forEach(padNumber => {
                        if (this.activeSources[padNumber]) {
                            try {
                                this.activeSources[padNumber].stop();
                                this.activeSources[padNumber].disconnect();
                                delete this.activeSources[padNumber];
                                stoppedSamples++;
                                
                                // Remove playing state from pad UI
                                const pad = document.querySelector('.pad[data-number="' + padNumber + '"]');
                                if (pad) {
                                    pad.classList.remove('playing');
                                    pad.classList.remove('pad-active');
                                }
                                
                                this.logToTerminal('Stopped audio source for Pad ' + padNumber, 'info');
                            } catch (e) {
                                console.warn('Error stopping audio source for pad ' + padNumber + ':', e);
                                this.logToTerminal('Error stopping Pad ' + padNumber + ': ' + e.message, 'warning');
                            }
                        }
                    });
                }
                
                // Clear any active visualizers
                if (this.visualizers) {
                    const visualizerKeys = Object.keys(this.visualizers);
                    if (visualizerKeys.length > 0) {
                        this.logToTerminal('Clearing ' + visualizerKeys.length + ' active visualizers...', 'info');
                        
                        visualizerKeys.forEach(padNumber => {
                            if (this.visualizers[padNumber]) {
                                cancelAnimationFrame(this.visualizers[padNumber]);
                                delete this.visualizers[padNumber];
                            }
                        });
                    }
                }
                
                // Note: Audio context remains active for new samples
                if (this.audioContext && this.audioContext.state === 'running') {
                    this.logToTerminal('Audio context remains active for new samples', 'info');
                }
                
                // Reset all pad states
                document.querySelectorAll('.pad').forEach(pad => {
                    pad.classList.remove('playing', 'pad-active');
                });
                
                // Ensure audio context is ready for new samples
                if (this.audioContext && this.audioContext.state === 'suspended') {
                    try {
                        await this.audioContext.resume();
                        this.logToTerminal('Audio context resumed for new samples', 'info');
                    } catch (e) {
                        console.warn('Error resuming audio context:', e);
                    }
                }
                
                this.logToTerminal(`STOP ALL completed: ${stoppedSamples} samples stopped + sequence stopped`, 'info');
                this.logToTerminal('Audio context remains active - new samples can be played', 'info');
            }
            
            /**
             * Force stop audio for a specific pad
             * @method forceStopPad
             * @param {number} padNumber - The pad number to force stop
             * @returns {boolean} True if pad was stopped, false if already stopped
             * @description Immediately stops audio playback for a specific pad
             */
            forceStopPad(padNumber) {
                if (this.activeSources[padNumber]) {
                    try {
                        this.activeSources[padNumber].stop();
                        this.activeSources[padNumber].disconnect();
                        delete this.activeSources[padNumber];
                        
                        const pad = document.querySelector('.pad[data-number="' + padNumber + '"]');
                        if (pad) {
                            pad.classList.remove('playing', 'pad-active');
                        }
                        
                        this.logToTerminal('Force stopped Pad ' + padNumber, 'info');
                        return true;
                    } catch (e) {
                        console.warn('Error force stopping pad ' + padNumber + ':', e);
                        return false;
                    }
                }
                return false;
            }
            
            /**
             * Clear the recorded sequence
             * @method clearSequence
             * @description Removes all recorded events and resets sequence state
             */
            clearSequence() {
                this.sequence = Array(BAR_COUNT).fill().map(function() { return []; });
                this.currentBar = 0;
                this.updateBarBeatDisplay();
                this.logToTerminal('Sequence cleared', 'info');
            }
            

            
            /**
             * Show latency statistics for performance monitoring
             * @method showLatencyStats
             * @description Displays current latency statistics and performance mode status
             */
            showLatencyStats() {
                const stats = this.getLatencyStats();
                console.log('[STATS] Latency Statistics:');
                console.log('   - Estimated minimum latency:', stats.minLatency + 'ms');
                console.log('   - Average latency:', stats.avgLatency + 'ms');
                console.log('   - Perf mode:', this.performanceMode ? 'ACTIVATED (low latency)' : 'DEACTIVATED (visualization)');
                console.log('   - Pre-created nodes:', Object.keys(this.preCreatedAnalysers).length);
            }
            

            
            /**
             * Get current latency statistics
             * @method getLatencyStats
             * @returns {Object} Latency statistics object
             * @description Calculates and returns current latency performance metrics
             */
            getLatencyStats() {
                const baseLatency = 5; // Web Audio API base latency
                const visualLatency = this.performanceMode ? 0 : 15; // Additional visualization latency
                const nodeLatency = 2; // Pre-created nodes latency
                
                return {
                    minLatency: baseLatency + nodeLatency,
                    avgLatency: baseLatency + nodeLatency + visualLatency,
                    maxLatency: baseLatency + nodeLatency + visualLatency + 10
                };
            }
            
            /**
             * Measure real-time audio latency
             * @method measureRealTimeLatency
             * @returns {number} Measured latency in milliseconds
             * @description Measures actual audio latency by playing a test tone
             */
            measureRealTimeLatency() {
                if (!this.audioContext) return;
                
                const startTime = performance.now();
                const audioStartTime = this.audioContext.currentTime;
                
                // Create a test beep
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.frequency.setValueAtTime(1000, this.audioContext.currentTime);
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.1);
                
                // Measure latency
                const endTime = performance.now();
                const latency = endTime - startTime;
                
                console.log('[LATENCY] Real measured latency:', latency.toFixed(2) + 'ms');
                return latency;
            }
            
            /**
             * Show pad selector interface for slicer mode
             * @method showPadSelectorForSlicer
             * @description Activates slicer mode and shows available pads for sample selection
             */
            showPadSelectorForSlicer() {
                if (!this.audioContext) {
                    this.logToTerminal('Please start audio before using the slicer.', 'error');
                    return;
                }
                
                // Check if any samples are loaded in the current bank
                let hasSamples = false;
                for (let i = 1; i <= 16; i++) {
                    if (this.samples[this.currentBank] && this.samples[this.currentBank][i]) {
                        hasSamples = true;
                        break;
                    }
                }
                
                if (!hasSamples) {
                    this.logToTerminal('No samples loaded to use the slicer.', 'error');
                    return;
                }
                
                // Activate slicer mode
                this.activateSlicerMode();
                this.logToTerminal('Slicer mode activated! Click on any pad with a sample to select it for slicing.', 'info');
                this.logToTerminal('Available pads: ' + this.getLoadedPadsList(), 'info');
            }
            
            /**
             * Activate slicer mode for sample manipulation
             * @method activateSlicerMode
             * @description Enables slicer mode with visual feedback on selectable pads
             */
            activateSlicerMode() {
                this.slicerMode = true;
                
                // Add visual feedback to pads with samples
                for (let i = 1; i <= 16; i++) {
                    const pad = document.querySelector('.pad[data-number="' + i + '"]');
                    if (pad && this.samples[this.currentBank] && this.samples[this.currentBank][i]) {
                        pad.classList.add('slicer-selectable');
                        pad.style.cursor = 'pointer';
                    }
                }
                
                // Change button appearance
                const slicerBtn = document.getElementById('bank-h');
                slicerBtn.classList.add('slicer-active');
                slicerBtn.textContent = 'CNL';
            }
            
            /**
             * Deactivate slicer mode
             * @method deactivateSlicerMode
             * @description Disables slicer mode and removes visual feedback
             */
            deactivateSlicerMode() {
                this.slicerMode = false;
                
                // Remove visual feedback from all pads
                document.querySelectorAll('.pad.slicer-selectable').forEach(pad => {
                    pad.classList.remove('slicer-selectable');
                    pad.style.cursor = '';
                });
                
                // Restore button appearance
                const slicerBtn = document.getElementById('bank-h');
                slicerBtn.classList.remove('slicer-active');
                slicerBtn.textContent = 'SLCR';
            }
            
            /**
             * Toggle delete pad mode for individual pad deletion
             * @method toggleDeletePadMode
             * @description Activates/deactivates delete mode for individual pad selection
             */
            toggleDeletePadMode() {
                if (this.deletePadMode) {
                    this.deactivateDeletePadMode();
                } else {
                    this.activateDeletePadMode();
                }
            }
            
            /**
             * Activate delete pad mode
             * @method activateDeletePadMode
             * @description Enables delete mode with visual feedback on deletable pads
             */
            activateDeletePadMode() {
                // Deactivate other modes first
                if (this.slicerMode) {
                    this.deactivateSlicerMode();
                }
                if (this.isEditMode) {
                    this.deactivateEditMode();
                }
                
                this.deletePadMode = true;
                
                // Add visual feedback to pads with samples
                for (let i = 1; i <= 16; i++) {
                    const pad = document.querySelector('.pad[data-number="' + i + '"]');
                    if (pad && this.samples[this.currentBank] && this.samples[this.currentBank][i]) {
                        pad.classList.add('delete-selectable');
                        pad.style.cursor = 'pointer';
                    }
                }
                
                // Change button appearance
                const deleteBtn = document.getElementById('bank-g');
                deleteBtn.classList.add('delete-active');
                deleteBtn.textContent = 'CNL';
                
                this.logToTerminal('Delete mode activated! Click on any pad with a sample to delete it.', 'info');
            }
            
            /**
             * Deactivate delete pad mode
             * @method deactivateDeletePadMode
             * @description Disables delete mode and removes visual feedback
             */
            deactivateDeletePadMode() {
                this.deletePadMode = false;
                
                // Remove visual feedback from all pads
                document.querySelectorAll('.pad.delete-selectable').forEach(pad => {
                    pad.classList.remove('delete-selectable');
                    pad.style.cursor = '';
                });
                
                // Restore button appearance
                const deleteBtn = document.getElementById('bank-g');
                deleteBtn.classList.remove('delete-active');
                deleteBtn.textContent = 'DEL';
                
                this.logToTerminal('Delete mode deactivated', 'info');
            }
            
            /**
             * Get list of loaded pads for slicer mode
             * @method getLoadedPadsList
             * @returns {string} Comma-separated list of loaded pad numbers
             * @description Returns a formatted list of pads with samples for slicer selection
             */
            getLoadedPadsList() {
                const loadedPads = [];
                for (let i = 1; i <= 16; i++) {
                    if (this.samples[this.currentBank] && this.samples[this.currentBank][i]) {
                        loadedPads.push(i);
                    }
                }
                return loadedPads.join(', ');
            }
            
            /**
             * Select a pad for slicing operations
             * @method selectPadForSlicing
             * @param {number} padNumber - The pad number to select for slicing
             * @description Processes pad selection and opens slicer modal with available options
             */
            selectPadForSlicing(padNumber) {
                if (!this.samples[this.currentBank] || !this.samples[this.currentBank][padNumber]) {
                    this.logToTerminal('Pad ' + padNumber + ' has no sample to slice', 'warning');
                    return;
                }
                
                // Calculate available space for slices
                const availablePads = this.calculateAvailablePadsForSlicing(padNumber);
                
                if (availablePads.length === 0) {
                    this.logToTerminal('No space available for slicing. Need at least 1 empty pad after Pad ' + padNumber, 'warning');
                    return;
                }
                
                // Deactivate slicer mode
                this.deactivateSlicerMode();
                
                // Open slicer with calculated options
                this.openSlicerModal(padNumber, availablePads.length);
                
                this.logToTerminal('Pad ' + padNumber + ' selected for slicing. Available slices: ' + availablePads.length, 'info');
            }
            
            /**
             * Calculate available pads for slicing operations
             * @method calculateAvailablePadsForSlicing
             * @param {number} startPad - Starting pad number for calculation
             * @returns {Array<number>} Array of available empty pad numbers
             * @description Determines how many slices can be created based on available space
             * Special case: When only 1 sample exists, allows 16 slices by including pad 1
             */
            calculateAvailablePadsForSlicing(startPad) {
                const availablePads = [];
                
                // Count total samples in current bank
                const totalSamples = Object.keys(this.samples[this.currentBank] || {}).length;
                
                // Special case: If only 1 sample exists in the bank, allow 16 slices
                // This will overwrite the first pad with the first slice
                if (totalSamples === 1) {
                    for (let i = 1; i <= 16; i++) {
                        availablePads.push(i);
                    }
                    return availablePads;
                }
                
                // Check pads from startPad + 1 to 16 (preferred order)
                for (let i = startPad + 1; i <= 16; i++) {
                    if (!this.samples[this.currentBank] || !this.samples[this.currentBank][i]) {
                        availablePads.push(i);
                    }
                }
                
                // If we don't have enough pads after the source, look for any empty pads
                if (availablePads.length === 0) {
                    for (let i = 1; i <= 16; i++) {
                        if (i !== startPad && (!this.samples[this.currentBank] || !this.samples[this.currentBank][i])) {
                            availablePads.push(i);
                        }
                    }
                }
                
                return availablePads;
            }

            /**
             * Update terminal display with message
             * @method updateTerminal
             * @param {string} message - Message to display
             * @param {string} type - Message type ('info', 'warning', 'error')
             * @description Updates the terminal footer with formatted messages and timestamps
             */
            updateTerminal(message, type = 'info') {
                const terminalText = document.getElementById('terminal-text');
                const terminalFooter = document.getElementById('terminal-footer');
                
                if (terminalText && terminalFooter) {
                    // Remove previous type classes
                    terminalFooter.classList.remove('info', 'warning', 'error');
                    
                    // Add new type class
                    if (type !== 'info') {
                        terminalFooter.classList.add(type);
                    }
                    
                    // Update text with timestamp
                    const timestamp = new Date().toLocaleTimeString();
                    terminalText.textContent = `[${timestamp}] ${message}`;
                    
                    // Auto-clear after 5 seconds for info messages
                    if (type === 'info') {
                        setTimeout(() => {
                            if (terminalText.textContent.includes(message)) {
                                terminalText.textContent = 'Waiting Input...';
                                terminalFooter.classList.remove('info', 'warning', 'error');
                            }
                        }, 5000);
                    }
                }
            }
            
            /**
             * Log message to terminal with throttling
             * @method logToTerminal
             * @param {string} message - Message to log
             * @param {string} type - Message type ('info', 'warning', 'error')
             * @description Logs messages to terminal with performance throttling in performance mode
             */
            logToTerminal(message, type = 'info') {
                // NEW: Throttle logging in performance mode (Cuellos de botella fix)
                if (this.performanceMode && type === 'info') {
                    const now = Date.now();
                    if (now - this.lastLogAt < this.logThrottleInterval) {
                        // Skip logging if too soon, but always log to console
                        console.log(`[TERMINAL-THROTTLED] ${message}`);
                        return;
                    }
                    this.lastLogAt = now;
                }
                
                this.updateTerminal(message, type);
                console.log(`[TERMINAL] ${message}`);
            }

            /**
             * Request microphone permission for recording functionality
             * @method requestMicrophonePermission
             * @description Requests access to microphone and stores the MediaStream
             * @returns {Promise<MediaStream>} Promise that resolves with the audio stream
             */
            async requestMicrophonePermission() {
                try {
                    const stream = await navigator.mediaDevices.getUserMedia({ 
                        audio: {
                            echoCancellation: false,
                            noiseSuppression: false,
                            autoGainControl: false,
                            sampleRate: 44100,
                            channelCount: 1
                        } 
                    });
                    
                    this.microphoneStream = stream;
                    this.hasMicrophoneAccess = true;
                    return stream;
                } catch (error) {
                    this.hasMicrophoneAccess = false;
                    throw new Error('Microphone access denied: ' + error.message);
                }
            }

            /**
             * Start microphone recording for a specific pad
             * @method startMicrophoneRecording
             * @param {number} padId - ID of the pad to record to
             * @description Starts recording from microphone to the specified pad
             */
            startMicrophoneRecording(padId) {
                console.log('[DEBUG] startMicrophoneRecording called with padId:', padId);
                console.log('[DEBUG] hasMicrophoneAccess:', this.hasMicrophoneAccess);
                console.log('[DEBUG] microphoneStream:', this.microphoneStream);
                console.log('[DEBUG] isMicrophoneMode:', this.isMicrophoneMode);
                
                if (!this.hasMicrophoneAccess || !this.microphoneStream) {
                    this.logToTerminal('Microphone not available. Press START first.', 'warning');
                    return;
                }

                if (this.isMicrophoneRecording) {
                    this.logToTerminal('Already recording. Stop current recording first.', 'warning');
                    return;
                }

                this.isMicrophoneRecording = true;
                this.recordingPadId = padId;
                this.recordingStartTime = Date.now();
                this.recordingChunks = [];

                // Create MediaRecorder with compatible format
                const options = { mimeType: 'audio/webm;codecs=opus' };
                this.mediaRecorder = new MediaRecorder(this.microphoneStream, options);

                this.mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        this.recordingChunks.push(event.data);
                    }
                };

                this.mediaRecorder.onstop = () => {
                    this.finishRecording();
                };

                // Start recording
                this.mediaRecorder.start(100); // Collect data every 100ms
                this.logToTerminal(`Recording started on pad ${padId}. Click pad again to stop recording (max 10s).`, 'info');
                
                // Start VU meter
                this.startVUMeter();
                
                // Set maximum recording time (10 seconds)
                this.maxRecordingTimer = setTimeout(() => {
                    if (this.isMicrophoneRecording) {
                        this.stopMicrophoneRecording();
                    }
                }, 10000);
            }

            /**
             * Stop microphone recording
             * @method stopMicrophoneRecording
             * @description Stops the current recording and processes the audio
             */
            stopMicrophoneRecording() {
                if (!this.isMicrophoneRecording || !this.mediaRecorder) {
                    return;
                }

                clearTimeout(this.maxRecordingTimer);
                this.isMicrophoneRecording = false;
                
                if (this.mediaRecorder.state === 'recording') {
                    this.mediaRecorder.stop();
                }
                
                this.stopVUMeter();
                this.logToTerminal('Recording stopped. Processing audio...', 'info');
            }

            /**
             * Finish recording and save to pad
             * @method finishRecording
             * @description Processes recorded audio and saves it to the specified pad
             */
            async finishRecording() {
                if (this.recordingChunks.length === 0) {
                    this.logToTerminal('No audio recorded.', 'warning');
                    return;
                }

                try {
                    // Create blob with correct MIME type (webm since that's what we're recording)
                    const audioBlob = new Blob(this.recordingChunks, { type: 'audio/webm;codecs=opus' });
                    const arrayBuffer = await audioBlob.arrayBuffer();
                    
                    // Decode audio data
                    const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
                    
                    // Create sample name
                    const timestamp = new Date().toISOString().slice(11, 19).replace(/:/g, '-');
                    const sampleName = `MIC_${this.currentBank}_${this.recordingPadId}_${timestamp}`;
                    
                    // Save to current bank and pad
                    if (!this.samples[this.currentBank]) {
                        this.samples[this.currentBank] = {};
                    }
                    if (!this.bankSamples[this.currentBank]) {
                        this.bankSamples[this.currentBank] = {};
                    }
                    
                    this.samples[this.currentBank][this.recordingPadId] = {
                        name: sampleName,
                        buffer: audioBuffer,
                        duration: audioBuffer.duration,
                        source: 'microphone'
                    };

                    // Also save to bankSamples for consistency
                    this.bankSamples[this.currentBank][this.recordingPadId] = {
                        name: sampleName,
                        buffer: audioBuffer,
                        duration: audioBuffer.duration,
                        source: 'microphone'
                    };

                    // Update sample names for the bank
                    if (!this.sampleNames[this.currentBank]) {
                        this.sampleNames[this.currentBank] = {};
                    }
                    this.sampleNames[this.currentBank][this.recordingPadId] = sampleName;

                    this.logToTerminal(`Sample "${sampleName}" saved to pad ${this.recordingPadId} (${audioBuffer.duration.toFixed(2)}s)`, 'info');
                    
                    // Update pad display using the correct function
                    this.updatePadUI(this.recordingPadId, null);
                    this.updatePadBankIndicators();
                    
                    // Save sample info to storage
                    this.saveSampleInfo();
                    
                } catch (error) {
                    this.logToTerminal('Error processing recorded audio: ' + error.message, 'error');
                }

                // Reset recording state
                this.recordingChunks = [];
                this.recordingPadId = null;
                this.recordingStartTime = null;
            }

            /**
             * Start VU meter visualization
             * @method startVUMeter
             * @description Starts real-time VU meter display during recording
             */
            startVUMeter() {
                if (!this.microphoneStream) return;

                try {
                    // Use existing audio context if available, otherwise create new one
                    const vuAudioContext = this.audioContext || new AudioContext();
                    const source = vuAudioContext.createMediaStreamSource(this.microphoneStream);
                    const analyser = vuAudioContext.createAnalyser();
                    
                    source.connect(analyser);
                    analyser.fftSize = 256;
                    
                    const bufferLength = analyser.frequencyBinCount;
                    const dataArray = new Uint8Array(bufferLength);
                    
                    const updateVUMeter = () => {
                        if (!this.isMicrophoneRecording) return;
                        
                        try {
                            analyser.getByteFrequencyData(dataArray);
                            const average = dataArray.reduce((a, b) => a + b) / bufferLength;
                            const level = Math.min(Math.floor(average / 25), 10); // Scale to 0-10
                            
                            // Update terminal with VU meter
                            const vuBar = '█'.repeat(level) + '░'.repeat(10 - level);
                            const recordingTime = Math.min((Date.now() - this.recordingStartTime) / 1000, 10);
                            const timeDisplay = recordingTime.toFixed(1);
                            
                            this.updateTerminal(`REC MIC [${vuBar}] TIME: ${timeDisplay}s`, 'info');
                            
                            if (this.isMicrophoneRecording) {
                                requestAnimationFrame(updateVUMeter);
                            }
                        } catch (error) {
                            console.warn('[DEBUG] VU meter update error:', error);
                            // Stop VU meter on error
                            return;
                        }
                    };
                    
                    updateVUMeter();
                } catch (error) {
                    console.warn('[DEBUG] VU meter initialization error:', error);
                    // Continue without VU meter if there's an error
                }
            }

            /**
             * Stop VU meter visualization
             * @method stopVUMeter
             * @description Stops VU meter display
             */
            stopVUMeter() {
                // VU meter stops automatically when isRecording becomes false
            }
            
            // ============================================================================
            // AUDIO EDITOR METHODS
            // ============================================================================
            
            /**
             * Manejar sliders en modo EDIT
             */
            handleEditSlider(sliderId, value) {
                if (!this.currentEditPad || !this.audioEditor) return;
                
                const normalizedValue = value / 100; // Convertir 0-100 a 0-1
                
                switch(sliderId) {
                    case 'slider-1': // VOL → START POINT
                        this.editSelection.start = normalizedValue;
                        this.audioEditor.selectionStart = normalizedValue * this.audioEditor.audioBuffer.duration;
                        this.audioEditor.drawSelection();
                        this.audioEditor.updateSelectionDisplay();
                        this.logToTerminal(`EDIT: Start point set to ${(normalizedValue * 100).toFixed(1)}%`, 'info');
                        break;
                        
                    case 'slider-2': // DISTORTION → END POINT  
                        this.editSelection.end = normalizedValue;
                        this.audioEditor.selectionEnd = normalizedValue * this.audioEditor.audioBuffer.duration;
                        this.audioEditor.drawSelection();
                        this.audioEditor.updateSelectionDisplay();
                        this.logToTerminal(`EDIT: End point set to ${(normalizedValue * 100).toFixed(1)}%`, 'info');
                        break;
                        
                    case 'slider-3': // FILT → ZOOM
                        this.audioEditor.setZoom(normalizedValue);
                        this.logToTerminal(`EDIT: Zoom set to ${(normalizedValue * 100).toFixed(1)}%`, 'info');
                        break;
                        
                    case 'slider-4': // RES → PLAYBACK SPEED
                        const speed = 0.5 + (normalizedValue * 1.5); // 0.5x a 2.0x
                        this.audioEditor.setPlaybackSpeed(speed);
                        this.logToTerminal(`EDIT: Playback speed set to ${speed.toFixed(1)}x`, 'info');
                        break;
                }
            }
            
            /**
             * Toggle del modo EDIT (activar/desactivar)
             */
            toggleEditMode() {
                if (this.isEditMode) {
                    this.exitEditMode();
                } else {
                    this.enterEditMode();
                }
            }
            
            /**
             * Entrar en modo EDIT
             */
            enterEditMode() {
                if (!this.audioContext) {
                    this.logToTerminal('Please start audio before editing samples.', 'warning');
                    return;
                }
                
                // Desactivar otros modos primero
                if (this.slicerMode) {
                    this.deactivateSlicerMode();
                }
                if (this.deletePadMode) {
                    this.deactivateDeletePadMode();
                }
                
                // Activar modo EDIT
                this.isEditMode = true;
                
                // Cambiar etiquetas de sliders
                this.updateSliderLabelsForEdit();
                
                // Mostrar instrucciones
                this.logToTerminal('EDIT MODE: Click on any pad with a sample to edit it', 'info');
                this.logToTerminal('Sliders: START | END | ZOOM | SPEED', 'info');
                this.logToTerminal('Press EDIT again or click outside to exit', 'info');
                
                // Activar selección de pads para edición
                this.activateEditPadSelection();
                
                // Cambiar apariencia del botón
                const editBtn = document.getElementById('edit-sample');
                editBtn.classList.add('edit-active');
                editBtn.textContent = 'CNL';
            }
            
            /**
             * Salir del modo EDIT
             */
            exitEditMode() {
                this.isEditMode = false;
                
                // Restaurar etiquetas de sliders normales
                this.restoreSliderLabels();
                
                // Desactivar selección de pads para edición
                this.deactivateEditPadSelection();
                
                // Restaurar apariencia del botón
                const editBtn = document.getElementById('edit-sample');
                editBtn.classList.remove('edit-active');
                editBtn.textContent = 'EDIT';
                
                this.logToTerminal('EDIT mode deactivated', 'info');
            }
            
            /**
             * Actualizar etiquetas de sliders para modo EDIT
             * CORREGIDO: No crear etiquetas de texto no solicitadas
             */
            updateSliderLabelsForEdit() {
                // CORREGIDO: No crear etiquetas de texto - solo cambiar el comportamiento de los sliders
                this.logToTerminal('EDIT MODE: Sliders now control START/END/ZOOM/SPEED', 'info');
            }
            
            /**
             * Restaurar etiquetas de sliders normales
             * CORREGIDO: No restaurar etiquetas que no existen
             */
            restoreSliderLabels() {
                // CORREGIDO: No restaurar etiquetas que no existen
                this.logToTerminal('Normal mode: Sliders control VOL/DISTORTION/FILT/RES', 'info');
            }
            
            /**
             * Activar selección de pads para edición
             * CORREGIDO: Usar fallback a bankSamples si samples no tiene la muestra
             */
            activateEditPadSelection() {
                // Hacer todos los pads con samples seleccionables para edición
                for (let i = 1; i <= 16; i++) {
                    const pad = document.querySelector(`.pad[data-number="${i}"]`);
                    // Verificar si hay muestra en samples o en bankSamples
                    const hasSample = (this.samples[this.currentBank] && this.samples[this.currentBank][i]) || 
                                    (this.bankSamples[this.currentBank] && this.bankSamples[this.currentBank][i]);
                    
                    if (pad && hasSample) {
                        pad.classList.add('edit-selectable');
                        pad.style.cursor = 'pointer';
                        console.log(`[DEBUG] Pad ${i} made editable - has sample`);
                    }
                }
            }
            
            /**
             * Desactivar selección de pads para edición
             */
            deactivateEditPadSelection() {
                document.querySelectorAll('.pad.edit-selectable').forEach(pad => {
                    pad.classList.remove('edit-selectable');
                    pad.style.cursor = '';
                });
            }
            
            /**
             * Seleccionar pad para edición
             * CORREGIDO: Mejor logging y verificación para muestras precargadas
             */
            selectPadForEditing(padNumber) {
                console.log('[DEBUG] selectPadForEditing called for pad:', padNumber);
                console.log('[DEBUG] currentBank:', this.currentBank);
                console.log('[DEBUG] samples[currentBank]:', this.samples[this.currentBank]);
                console.log('[DEBUG] sample in pad:', this.samples[this.currentBank] ? this.samples[this.currentBank][padNumber] : 'undefined');
                
                // VERIFICACIÓN ADICIONAL: Comprobar también bankSamples como fallback
                if (!this.samples[this.currentBank] || !this.samples[this.currentBank][padNumber]) {
                    console.log('[DEBUG] Sample not found in samples, checking bankSamples...');
                    if (this.bankSamples[this.currentBank] && this.bankSamples[this.currentBank][padNumber]) {
                        console.log('[DEBUG] Sample found in bankSamples, using that instead');
                        // Usar bankSamples como fallback si samples no tiene la muestra
                        const sample = this.bankSamples[this.currentBank][padNumber];
                        this.currentEditPad = padNumber;
                        
                        console.log('[DEBUG] Fallback sample object:', sample);
                        console.log('[DEBUG] Fallback sample constructor:', sample ? sample.constructor.name : 'undefined');
                        console.log('[DEBUG] Fallback has getChannelData:', sample ? typeof sample.getChannelData : 'undefined');
                        
                        // Abrir modal del editor con la muestra de bankSamples
                        this.openAudioEditor(padNumber, sample);
                        this.logToTerminal('Pad ' + padNumber + ' selected for editing (using bankSamples)', 'info');
                        return;
                    } else {
                        this.logToTerminal('Pad ' + padNumber + ' has no sample to edit', 'warning');
                        return;
                    }
                }
                
                this.currentEditPad = padNumber;
                const sample = this.samples[this.currentBank][padNumber];
                
                console.log('[DEBUG] Sample object for editing:', sample);
                console.log('[DEBUG] Sample type:', typeof sample);
                console.log('[DEBUG] Sample constructor:', sample ? sample.constructor.name : 'undefined');
                console.log('[DEBUG] Has getChannelData:', sample ? typeof sample.getChannelData : 'undefined');
                
                // Abrir modal del editor
                this.openAudioEditor(padNumber, sample);
                
                this.logToTerminal('Pad ' + padNumber + ' selected for editing', 'info');
            }
            
            /**
             * Abrir el editor de audio
             * CORREGIDO: Maneja tanto muestras precargadas (AudioBuffer) como grabadas (objetos)
             */
            openAudioEditor(padNumber, sample) {
                const modal = document.getElementById('audio-editor-modal');
                const padNumberSpan = document.getElementById('edit-pad-number');
                const sampleNameSpan = document.getElementById('edit-sample-name');
                
                // Actualizar información del modal
                padNumberSpan.textContent = padNumber;
                sampleNameSpan.textContent = this.sampleNames[this.currentBank][padNumber] || 'Sample ' + padNumber;
                
                // CORREGIDO: Manejar diferentes tipos de muestras
                let audioBuffer;
                let sampleDuration;
                
                if (sample && typeof sample === 'object' && sample.buffer) {
                    // Es un sample con metadatos (como los grabados con micrófono)
                    audioBuffer = sample.buffer;
                    sampleDuration = sample.duration || audioBuffer.duration;
                    console.log('[DEBUG] Sample con metadatos - Duration:', sampleDuration);
                } else if (sample && typeof sample.getChannelData === 'function') {
                    // Es un AudioBuffer directo (como las muestras precargadas de GitHub)
                    audioBuffer = sample;
                    sampleDuration = sample.duration;
                    console.log('[DEBUG] AudioBuffer directo - Duration:', sampleDuration);
                } else {
                    // Fallback para compatibilidad
                    audioBuffer = sample;
                    sampleDuration = sample ? sample.duration : 0;
                    console.log('[DEBUG] Fallback - Duration:', sampleDuration);
                }
                
                console.log('[DEBUG] Sample object:', sample);
                console.log('[DEBUG] AudioBuffer:', audioBuffer);
                console.log('[DEBUG] AudioBuffer type:', typeof audioBuffer);
                console.log('[DEBUG] AudioBuffer constructor:', audioBuffer.constructor.name);
                console.log('[DEBUG] Has getChannelData:', typeof audioBuffer.getChannelData === 'function');
                console.log('[DEBUG] Sample duration:', sampleDuration);
                
                if (!audioBuffer || typeof audioBuffer.getChannelData !== 'function') {
                    this.logToTerminal('Error: Invalid audio buffer for editing', 'error');
                    console.error('[DEBUG] Invalid audio buffer:', audioBuffer);
                    return;
                }
                
                // CORREGIDO: Crear editor con información de duración
                try {
                    console.log('[DEBUG] Creating AudioWaveformEditor...');
                    this.audioEditor = new AudioWaveformEditor(audioBuffer, document.getElementById('waveform-container'), this.audioContext);
                    console.log('[DEBUG] AudioWaveformEditor created successfully');
                    
                    // Mostrar modal
                    modal.style.display = 'flex';
                    console.log('[DEBUG] Modal displayed');
                    
                    // Configurar event listeners del editor
                    this.setupEditorEventListeners();
                    console.log('[DEBUG] Editor event listeners configured');
                    
                    this.logToTerminal(`Audio editor opened for Pad ${padNumber} - Duration: ${sampleDuration.toFixed(2)}s`, 'info');
                } catch (error) {
                    console.error('[DEBUG] Error creating audio editor:', error);
                    this.logToTerminal('Error creating audio editor: ' + error.message, 'error');
                }
            }
            
            /**
             * Configurar event listeners del editor
             */
            setupEditorEventListeners() {
                document.getElementById('play-selection').addEventListener('click', () => {
                    this.audioEditor.playSelection();
                });
                
                document.getElementById('play-full').addEventListener('click', () => {
                    this.audioEditor.playFull();
                });
                
                document.getElementById('reset-selection').addEventListener('click', () => {
                    this.audioEditor.resetSelection();
                });
                
                document.getElementById('apply-trim').addEventListener('click', () => {
                    this.applyTrimToSample();
                });
                
                document.getElementById('cancel-editing').addEventListener('click', () => {
                    this.closeAudioEditor();
                });
            }
            
            /**
             * Aplicar trim a la muestra
             */
            async applyTrimToSample() {
                if (!this.audioEditor || !this.currentEditPad) return;
                
                try {
                    const trimmedBuffer = this.audioEditor.getTrimmedAudio();
                    
                    // Obtener el sample original para preservar metadatos
                    const originalSample = this.samples[this.currentBank][this.currentEditPad];
                    
                    // Si el sample original es un objeto con metadatos, preservarlos
                    if (originalSample && typeof originalSample === 'object' && originalSample.buffer) {
                        // Es un sample con metadatos (como los grabados con micrófono)
                        this.samples[this.currentBank][this.currentEditPad] = {
                            ...originalSample,
                            buffer: trimmedBuffer,
                            duration: trimmedBuffer.duration
                        };
                        this.bankSamples[this.currentBank][this.currentEditPad] = {
                            ...originalSample,
                            buffer: trimmedBuffer,
                            duration: trimmedBuffer.duration
                        };
                    } else {
                        // Es un AudioBuffer directo (como los samples de GitHub)
                        this.samples[this.currentBank][this.currentEditPad] = trimmedBuffer;
                        this.bankSamples[this.currentBank][this.currentEditPad] = trimmedBuffer;
                    }
                    
                    // Actualizar nombre de la muestra
                    const originalName = this.sampleNames[this.currentBank][this.currentEditPad];
                    this.sampleNames[this.currentBank][this.currentEditPad] = originalName + '_TRIMMED';
                    
                    // Guardar cambios
                    this.saveSampleInfo();
                    this.updatePadBankIndicators();
                    
                    this.logToTerminal(`Sample trimmed and saved to Pad ${this.currentEditPad}`, 'info');
                    
                    // Cerrar editor
                    this.closeAudioEditor();
                    
                } catch (error) {
                    this.logToTerminal('Error applying trim: ' + error.message, 'error');
                }
            }
            
            /**
             * Cerrar el editor de audio
             */
            closeAudioEditor() {
                const modal = document.getElementById('audio-editor-modal');
                modal.style.display = 'none';
                
                // Limpiar editor
                if (this.audioEditor) {
                    this.audioEditor.destroy();
                    this.audioEditor = null;
                }
                
                this.currentEditPad = null;
                this.isEditMode = false;
                
                // Restaurar etiquetas de sliders
                this.restoreSliderLabels();
                
                // Desactivar selección de pads para edición
                this.deactivateEditPadSelection();
                
                this.logToTerminal('Audio editor closed', 'info');
            }

        }
        
        // ============================================================================
        // AUDIO WAVEFORM EDITOR CLASS
        // ============================================================================
        
        /**
         * Audio Waveform Editor for Microphone Samples
         * Permite editar muestras de micrófono con control visual
         */
        class AudioWaveformEditor {
            constructor(audioBuffer, container, audioContext) {
                console.log('[DEBUG] AudioWaveformEditor constructor called');
                console.log('[DEBUG] audioBuffer:', audioBuffer);
                console.log('[DEBUG] container:', container);
                console.log('[DEBUG] audioContext:', audioContext);
                
                this.audioBuffer = audioBuffer;
                this.container = container;
                this.audioContext = audioContext;
                this.canvas = null;
                this.ctx = null;
                this.isDragging = false;
                this.selectionStart = 0;
                this.selectionEnd = audioBuffer.duration;
                this.zoomLevel = 1;
                this.playbackSpeed = 1;
                
                console.log('[DEBUG] AudioWaveformEditor properties set, calling init()');
                this.init();
            }
            
            init() {
                try {
                    console.log('[DEBUG] AudioWaveformEditor init() called');
                    this.createCanvas();
                    console.log('[DEBUG] Canvas created');
                    this.renderWaveform();
                    console.log('[DEBUG] Waveform rendered');
                    this.setupEventListeners();
                    console.log('[DEBUG] Event listeners set up');
                    this.drawSelection();
                    console.log('[DEBUG] Selection drawn');
                    console.log('[DEBUG] AudioWaveformEditor initialization completed successfully');
                } catch (error) {
                    console.error('[DEBUG] Error in AudioWaveformEditor init():', error);
                    throw error;
                }
            }
            
            createCanvas() {
                this.canvas = document.createElement('canvas');
                
                // Asegurar que el canvas tenga dimensiones apropiadas
                const containerWidth = this.container.offsetWidth || 400;
                this.canvas.width = containerWidth;
                this.canvas.height = 200;
                
                // Estilos del canvas
                this.canvas.style.border = '2px solid var(--shadow-color-dark)';
                this.canvas.style.cursor = 'crosshair';
                this.canvas.style.backgroundColor = 'var(--shadow-color-dark)';
                this.canvas.style.display = 'block';
                this.canvas.style.width = '100%';
                this.canvas.style.height = '200px';
                
                // Agregar al contenedor
                this.container.appendChild(this.canvas);
                
                // Obtener contexto 2D
                this.ctx = this.canvas.getContext('2d');
                
                // Configurar contexto para mejor calidad
                this.ctx.imageSmoothingEnabled = false;
                this.ctx.imageSmoothingQuality = 'high';
                
                console.log('[CANVAS] Canvas created:', {
                    width: this.canvas.width,
                    height: this.canvas.height,
                    containerWidth: containerWidth
                });
            }
            
            renderWaveform() {
                try {
                    console.log('[DEBUG] renderWaveform() called');
                    console.log('[DEBUG] Canvas dimensions:', { width: this.canvas.width, height: this.canvas.height });
                    console.log('[DEBUG] AudioBuffer info:', {
                        duration: this.audioBuffer.duration,
                        sampleRate: this.audioBuffer.sampleRate,
                        numberOfChannels: this.audioBuffer.numberOfChannels
                    });
                    
                    const { width, height } = this.canvas;
                    const data = this.audioBuffer.getChannelData(0);
                    console.log('[DEBUG] Channel data length:', data.length);
                    
                    const step = Math.ceil(data.length / width);
                    const amp = height / 2;
                    
                    console.log('[DEBUG] Step size:', step, 'Amplitude:', amp);
                    
                    // Limpiar canvas
                    this.ctx.clearRect(0, 0, width, height);
                    
                    // Configurar estilo de línea
                    this.ctx.strokeStyle = 'var(--gb-primary)';
                    this.ctx.lineWidth = 2;
                    this.ctx.lineCap = 'round';
                    
                    // Dibujar línea central
                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, height / 2);
                    this.ctx.lineTo(width, height / 2);
                    this.ctx.stroke();
                    
                    // Dibujar forma de onda
                    this.ctx.strokeStyle = 'var(--gb-primary)';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    
                    for (let i = 0; i < width; i++) {
                        let min = 1.0;
                        let max = -1.0;
                        
                        // Calcular min/max para este paso
                        for (let j = 0; j < step; j++) {
                            const index = (i * step) + j;
                            if (index < data.length) {
                                const datum = data[index];
                                if (datum < min) min = datum;
                                if (datum > max) max = datum;
                            }
                        }
                        
                        // Convertir coordenadas de audio (-1 a 1) a coordenadas de canvas (0 a height)
                        const y1 = (height / 2) + (min * amp);
                        const y2 = (height / 2) + (max * amp);
                        
                        // Dibujar línea vertical para este punto
                        this.ctx.moveTo(i, y1);
                        this.ctx.lineTo(i, y2);
                    }
                    
                    this.ctx.stroke();
                    
                    // Debug: mostrar información de la forma de onda
                    console.log('[WAVEFORM] Rendered waveform:', {
                        width: width,
                        height: height,
                        dataLength: data.length,
                        step: step,
                        duration: this.audioBuffer.duration,
                        sampleRate: this.audioBuffer.sampleRate
                    });
                    
                    console.log('[DEBUG] renderWaveform() completed successfully');
                } catch (error) {
                    console.error('[DEBUG] Error in renderWaveform():', error);
                    throw error;
                }
            }
            
            setupEventListeners() {
                this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
                this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
                this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
                
                // Touch events para móviles
                this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
                this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
                this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
            }
            
            onMouseDown(e) {
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                this.isDragging = true;
                this.selectionStart = (x / this.canvas.width) * this.audioBuffer.duration;
                this.drawSelection();
                this.updateSelectionDisplay();
            }
            
            onMouseMove(e) {
                if (!this.isDragging) return;
                
                const rect = this.canvas.getBoundingClientRect();
                const x = e.clientX - rect.left;
                this.selectionEnd = (x / this.canvas.width) * this.audioBuffer.duration;
                this.drawSelection();
                this.updateSelectionDisplay();
            }
            
            onMouseUp() {
                this.isDragging = false;
            }
            
            onTouchStart(e) {
                e.preventDefault();
                const rect = this.canvas.getBoundingClientRect();
                const touch = e.touches[0];
                const x = touch.clientX - rect.left;
                this.isDragging = true;
                this.selectionStart = (x / this.canvas.width) * this.audioBuffer.duration;
                this.drawSelection();
                this.updateSelectionDisplay();
            }
            
            onTouchMove(e) {
                e.preventDefault();
                if (!this.isDragging) return;
                
                const rect = this.canvas.getBoundingClientRect();
                const touch = e.touches[0];
                const x = touch.clientX - rect.left;
                this.selectionEnd = (x / this.canvas.width) * this.audioBuffer.duration;
                this.drawSelection();
                this.updateSelectionDisplay();
            }
            
            onTouchEnd(e) {
                e.preventDefault();
                this.isDragging = false;
            }
            
            drawSelection() {
                const { width, height } = this.canvas;
                const startX = (this.selectionStart / this.audioBuffer.duration) * width;
                const endX = (this.selectionEnd / this.audioBuffer.duration) * width;
                
                // Limpiar selección anterior
                this.renderWaveform();
                
                // Dibujar nueva selección
                this.ctx.fillStyle = 'rgba(155, 188, 15, 0.3)';
                this.ctx.fillRect(startX, 0, endX - startX, height);
                
                // Marcadores de inicio y fin
                this.ctx.strokeStyle = 'var(--gb-active)';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.moveTo(startX, 0);
                this.ctx.lineTo(startX, height);
                this.ctx.moveTo(endX, 0);
                this.ctx.lineTo(endX, height);
                this.ctx.stroke();
            }
            
            updateSelectionDisplay() {
                const selectionTimeSpan = document.getElementById('edit-selection-time');
                if (selectionTimeSpan) {
                    const startTime = this.selectionStart.toFixed(2);
                    const endTime = this.selectionEnd.toFixed(2);
                    selectionTimeSpan.textContent = `${startTime}s - ${endTime}s`;
                }
            }
            
            playSelection() {
                if (!this.audioContext) return;
                
                const source = this.audioContext.createBufferSource();
                source.buffer = this.audioBuffer;
                
                const gainNode = this.audioContext.createGain();
                gainNode.gain.value = 0.5;
                
                source.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                source.start(0, this.selectionStart, this.selectionEnd - this.selectionStart);
                
                // Log de reproducción
                if (window.embryoPlayer) {
                    window.embryoPlayer.logToTerminal(`Playing selection: ${this.selectionStart.toFixed(2)}s - ${this.selectionEnd.toFixed(2)}s`, 'info');
                }
            }
            
            playFull() {
                if (!this.audioContext) return;
                
                const source = this.audioContext.createBufferSource();
                source.buffer = this.audioBuffer;
                
                const gainNode = this.audioContext.createGain();
                gainNode.gain.value = 0.5;
                
                source.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                source.start();
                
                // Log de reproducción
                if (window.embryoPlayer) {
                    window.embryoPlayer.logToTerminal('Playing full sample', 'info');
                }
            }
            
            resetSelection() {
                this.selectionStart = 0;
                this.selectionEnd = this.audioBuffer.duration;
                this.drawSelection();
                this.updateSelectionDisplay();
                
                if (window.embryoPlayer) {
                    window.embryoPlayer.logToTerminal('Selection reset to full sample', 'info');
                }
            }
            
            setZoom(zoomLevel) {
                this.zoomLevel = zoomLevel;
                // Implementar zoom en la visualización
                this.renderWaveform();
            }
            
            setPlaybackSpeed(speed) {
                this.playbackSpeed = speed;
                // La velocidad se aplica al reproducir
            }
            
            getTrimmedAudio() {
                const startSample = Math.floor(this.selectionStart * this.audioBuffer.sampleRate);
                const endSample = Math.floor(this.selectionEnd * this.audioBuffer.sampleRate);
                const length = endSample - startSample;
                
                const trimmedBuffer = this.audioContext.createBuffer(
                    this.audioBuffer.numberOfChannels,
                    length,
                    this.audioBuffer.sampleRate
                );
                
                for (let channel = 0; channel < this.audioBuffer.numberOfChannels; channel++) {
                    const channelData = this.audioBuffer.getChannelData(channel);
                    const trimmedData = trimmedBuffer.getChannelData(channel);
                    
                    for (let i = 0; i < length; i++) {
                        trimmedData[i] = channelData[startSample + i];
                    }
                }
                
                return trimmedBuffer;
            }
            
            destroy() {
                if (this.canvas && this.canvas.parentNode) {
                    this.canvas.parentNode.removeChild(this.canvas);
                }
                this.canvas = null;
                this.ctx = null;
            }
        }
        
        // ============================================================================
        // MIC AND EDIT BUTTONS INITIALIZATION (REPLACES SHIFT)
        // ============================================================================
        
        /**
 * Initialize MIC and EDIT buttons for microphone recording and editing functionality
 * @function initializeMicAndEditButtons
 * @description Sets up event listeners for MIC and EDIT buttons
 */
function initializeMicAndEditButtons() {
    const micButton = document.getElementById('mic-button');
    const editButton = document.getElementById('edit-sample');
    
    if (micButton) {
        micButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (window.embryoPlayer) {
                // Toggle MIC mode
                const newState = !window.embryoPlayer.isMicrophoneMode;
                window.embryoPlayer.isMicrophoneMode = newState;
                
                console.log('[DEBUG] MIC button clicked, new state:', newState);
                
                // Update button appearance
                if (newState) {
                    this.style.background = 'var(--gb-active)';
                    this.style.color = 'var(--gb-text-inverse)';
                    this.textContent = 'MIC ON';
                    
                    window.embryoPlayer.logToTerminal('MIC MODE ACTIVE - Click empty pad to record (0-10s)', 'info');
                } else {
                    this.style.background = 'var(--bg-color)';
                    this.style.color = 'var(--text-color)';
                    this.textContent = 'MIC';
                    
                    window.embryoPlayer.logToTerminal('MIC mode deactivated', 'info');
                }
            }
        });
        
        console.log('[MIC] MIC button initialized for microphone recording');
    } else {
        console.warn('[MIC] MIC button not found in DOM');
    }
    
    if (editButton) {
        editButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            if (window.embryoPlayer) {
                window.embryoPlayer.toggleEditMode();
            }
        });
        
        console.log('[EDIT] EDIT button initialized for sample editing');
    } else {
        console.warn('[EDIT] EDIT button not found in DOM');
    }
}
        
        // ============================================================================
        // AUDIO SLIDERS INITIALIZATION
        // ============================================================================
        
        /**
 * Initialize audio control sliders
 * @function initializeAudioSliders
 * @description Sets up event listeners for master effects control sliders
 */
function initializeAudioSliders() {
    const sliders = document.querySelectorAll('.audio-slider');
    
    sliders.forEach(slider => {
        // Apply audio effects based on slider type
        slider.addEventListener('input', function() {
            const sliderId = this.id;
            const value = parseFloat(this.value);
            
            if (window.embryoPlayer) {
                if (window.embryoPlayer.isEditMode) {
                    // MODO EDIT: Los sliders controlan la edición de audio
                    window.embryoPlayer.handleEditSlider(sliderId, value);
                } else {
                    // MODO NORMAL: Los sliders controlan efectos de audio
                    window.embryoPlayer.applyMasterEffect(sliderId, value);
                }
            }
        });
        
        // Clear terminal footer when slider is no longer being used
        slider.addEventListener('change', function() {
            setTimeout(() => {
                if (window.embryoPlayer && window.embryoPlayer.updateTerminal) {
                    window.embryoPlayer.updateTerminal('Waiting Input...', 'info');
                }
            }, 1000);
        });
    });
    
    console.log('[SLIDERS] Audio control sliders initialized with dual-mode system (effects + editing)');
}
        
        // ============================================================================
        // APPLICATION INITIALIZATION
        // ============================================================================
        
        /**
         * Main application initialization
         * @event DOMContentLoaded
         * @description Initializes the Embryo Player when DOM is ready
         */
        document.addEventListener('DOMContentLoaded', function() {
            window.embryoPlayer = new EmbrioPlayer();
            
            // Initialize audio control sliders
            initializeAudioSliders();
            
                    // NEW: Initialize MIC and EDIT buttons (replaces SHIFT functionality)
        initializeMicAndEditButtons();
            
            // NEW: Initialize EDIT button (already handled in initializeMicAndEditButtons)
            // const editButton = document.getElementById('edit-sample');
            // if (editButton) {
            //     editButton.addEventListener('click', function() {
            //         if (window.embryoPlayer) {
            //             window.embryoPlayer.enterEditMode();
            //         }
            //     });
            // }
            
            // ============================================================================
            // WELCOME MESSAGE & STATUS
            // ============================================================================
            
            // Welcome message in terminal
            setTimeout(() => {
                if (window.embryoPlayer && window.embryoPlayer.logToTerminal) {
                    window.embryoPlayer.logToTerminal('Embryo Player v3.0 Started', 'info');
                    window.embryoPlayer.logToTerminal('Auto-loading 15 GitHub samples into banks A and B...', 'info');
                    window.embryoPlayer.logToTerminal('NEW: Press START to enable microphone recording', 'info');
                    window.embryoPlayer.logToTerminal('NEW: Click MIC button, then click empty pad to record (0-10s)', 'info');
                }
            }, 100);
            
            // ============================================================================
            // INITIALIZATION LOG
            // ============================================================================
            
            console.log('[INIT] Embryo Player v3.0 Started');
            console.log('[FEATURES] New features:');
            console.log('   - Long Press BPM (rapid changes every 200ms)');
            console.log('   - Tap Tempo button (click to set BPM)');
            console.log('   - Multiple input system (Mouse + Touch + Keyboard + MIDI)');
            console.log('   - Keyboard mapping: QWER/ASDF/ZXCV/1234 → Pads 1-16');
            console.log('   - Active input method indicators');
            console.log('   - Enhanced visual feedback');
            console.log('   - Unified pad control system');
            console.log('   - Touch button for mobile slicer');
            console.log('   - NEW: Microphone recording with MIC button + pad (0-10s)');
            console.log('   - NEW: Real-time VU meter during recording');
            console.log('   - NEW: WAV format output for recorded samples');
            
            console.log('[LATENCY] LATENCY OPTIMIZATIONS:');
            console.log('   - AudioContext configured for minimum latency');
            console.log('   - Pre-created audio nodes');
            console.log('   - Auto performance mode (visualization only during sequence playback)');
            console.log('   - Asynchronous DOM operations');
            
            console.log('[READY] Ready to use - Start audio to begin (GitHub samples will auto-load)');
