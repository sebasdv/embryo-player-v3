# Embrio Player v3.0

[![Version](https://img.shields.io/badge/version-3.0.0-blue.svg)](https://github.com/sebasdv/embrio-player-v3)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Web Audio API](https://img.shields.io/badge/Web%20Audio%20API-Supported-brightgreen.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![MIDI](https://img.shields.io/badge/MIDI-Supported-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/API/Web_MIDI_API)

> **Professional Web Sampler & Sequencer with Advanced Audio Features**

A powerful, browser-based audio sampler and sequencer built with modern web technologies. Features a GameBoy-inspired retro aesthetic with professional-grade audio processing capabilities.

## Features

### **Audio System**
- **Web Audio API** optimized for minimum latency
- **Pre-created audio nodes** for instant response
- **Master effects chain**: Volume, Distortion, Filter, Resonance
- **Non-destructive sample slicing** (no buffer copying)
- **Multi-format support**: WAV, MP3, OGG, AAC, M4A, FLAC

### **Sequencer**
- **Deterministic musical scheduler** with look-ahead and horizon
- **Timeline-based playback** for precise timing
- **Configurable quantization** (0% to 100% strength)
- **4-bar recording** with automatic looping
- **Real-time metronome** with count-in

### **Input Methods**
- **Multi-input system**: Mouse, Touch, Keyboard, MIDI
- **Complete keyboard mapping**: QWER/ASDF/ZXCV/1234 → Pads 1-16
- **Long press BPM control** (rapid changes every 200ms)
- **Tap tempo functionality**
- **Active input method indicators**

### **User Interface**
- **GameBoy-inspired retro aesthetic**
- **Enhanced visual feedback** for all interactions
- **Responsive design** for mobile and desktop
- **Unified pad control system**
- **Performance mode** with auto-switching

## Quick Start

### **Live Demo**
Open `index.html` in any modern web browser to start using Embrio Player.

### **Requirements**
- Modern web browser with Web Audio API support
- No installation required - runs entirely in the browser
- MIDI controller support (optional)

### **Getting Started**
1. **Open** `index.html` in your browser
2. **Click "Start"** to initialize the audio system
3. **Samples auto-load** from GitHub (Banks A & B)
4. **Start creating** with the 16-pad grid!

## Project Structure

```
embrio-player-v3/
├── README.md                           # This file
├── CHANGELOG.md                        # Version history
├── LICENSE                             # MIT License
├── index.html                          # Main application (Gold version)
├── enhanced_index.html                 # Enhanced version (backup)
├── samples/                            # Audio sample files
│   ├── A_*.wav                        # Bank A samples (88 BPM)
│   └── B_*.wav                        # Bank B samples (135 BPM)
├── docs/                               # Technical documentation
│   ├── API.md                          # API reference
│   ├── PERFORMANCE.md                  # Performance optimizations
│   └── SAMPLES.md                      # Sample management
└── archive/                            # Legacy versions
    ├── embrio_player_v3_nochoke.html
    ├── embrio_player_v3_quantize.html
    ├── v4_fx.html
    └── embrio_color_palette.html
```

## Use Cases

### **Music Production**
- **Sample-based composition** with real-time triggering
- **Sequencer recording** for loop creation
- **Live performance** with MIDI controllers
- **Sample manipulation** with non-destructive slicing

### **Learning & Education**
- **Music theory practice** with visual feedback
- **Rhythm training** with quantization
- **Audio processing** concepts demonstration
- **Web Audio API** learning resource

### **Mobile & Touch**
- **Touch-friendly interface** for mobile devices
- **Gesture-based control** for intuitive operation
- **Responsive design** for all screen sizes
- **Offline capability** once samples are loaded

## Technical Details

### **Performance Optimizations**
- **Deterministic scheduler** for precise timing
- **Pre-created audio nodes** for minimum latency
- **Performance mode** with auto-switching
- **Terminal logging throttle** for smooth operation

### **Browser Compatibility**
- **Chrome/Edge**: Full support with Web MIDI API
- **Firefox**: Full support (MIDI requires user gesture)
- **Safari**: Full support with Web Audio API
- **Mobile browsers**: Touch-optimized interface

### **Audio Specifications**
- **Sample Rate**: 44.1 kHz
- **Bit Depth**: 16-bit (WAV), Variable (other formats)
- **Channels**: Mono/Stereo support
- **Latency**: <10ms typical, <20ms maximum

## Documentation

- **[API Reference](docs/API.md)** - Complete API documentation
- **[Performance Guide](docs/PERFORMANCE.md)** - Optimization details
- **[Sample Management](docs/SAMPLES.md)** - Working with audio samples

## Contributing

We welcome contributions! Please see our contributing guidelines:

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

### **Development Setup**
```bash
git clone https://github.com/sebasdv/embrio-player-v3.git
cd embrio-player-v3
# Open index.html in your browser
```

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Web Audio API** team for the powerful audio framework
- **GameBoy** aesthetic inspiration for the retro design
- **Open source community** for continuous improvement
- **Contributors** who help make this project better

## Support

- **Issues**: [GitHub Issues](https://github.com/sebasdv/embrio-player-v3/issues)
- **Discussions**: [GitHub Discussions](https://github.com/sebasdv/embrio-player-v3/discussions)
- **Wiki**: [Project Wiki](https://github.com/sebasdv/embrio-player-v3/wiki)

---

**Made with love for the music community**

*Embrio Player v3.0 - Professional Web Sampler & Sequencer*
