# Sample Management - Embryo Player v3.0

Complete guide to working with audio samples in Embryo Player v3.0.

## Table of Contents

- [Sample Overview](#sample-overview)
- [GitHub Auto-loading](#github-auto-loading)
- [User Sample Loading](#user-sample-loading)
- [Sample Slicing](#sample-slicing)
- [Bank Management](#bank-management)
- [Sample Validation](#sample-validation)
- [Storage & Persistence](#storage--persistence)
- [Best Practices](#best-practices)

---

## Sample Overview

### **Sample System Architecture**

Embryo Player uses a sophisticated sample management system with:

- **16 Pads**: Each pad can hold one sample
- **4 Banks**: A, B, C, D for organization
- **Auto-loading**: GitHub samples load automatically
- **User samples**: Drag & drop or file selection
- **Non-destructive slicing**: Create variations without copying

### **Sample Types Supported**

| Format | Extension | Quality | Size | Browser Support |
|--------|-----------|---------|------|-----------------|
| **WAV** | `.wav` | Lossless | Large | Excellent |
| **MP3** | `.mp3` | Lossy | Small | Excellent |
| **OGG** | `.ogg` | Lossy | Small | Good |
| **AAC** | `.aac` | Lossy | Small | Good |
| **M4A** | `.m4a` | Lossy | Small | Good |
| **FLAC** | `.flac` | Lossless | Large | Limited |

---

## GitHub Auto-loading

### **Automatic Sample Loading**

The application automatically loads 15 curated samples from GitHub:

```javascript
// Auto-load GitHub samples using unified approach
loadAllSamples() {
    this.logToTerminal('Loading GitHub samples using unified approach...', 'info');
    
    // Load samples for both banks
    const promises = [];
    
    // Bank A samples (8 samples, 88 BPM)
    for (let i = 0; i < 8; i++) {
        const fileName = allSampleFiles[i];
        const bank = getBankFromFileName(fileName);
        const padNumber = i + 1;
        
        promises.push(
            this.loadAudioForPad(padNumber, fileName, bank)
                .then(() => {
                    this.logToTerminal(`Bank A: Loaded ${fileName} in Pad ${padNumber}`, 'success');
                })
                .catch(error => {
                    this.logToTerminal(`Bank A: Error loading ${fileName} in Pad ${padNumber}: ${error.message}`, 'error');
                })
        );
    }
    
    // Bank B samples (7 samples, 135 BPM)
    for (let i = 8; i < 15; i++) {
        const fileName = allSampleFiles[i];
        const bank = getBankFromFileName(fileName);
        const padNumber = i - 7; // Bank B uses pads 1-7
        
        promises.push(
            this.loadAudioForPad(padNumber, fileName, bank)
                .then(() => {
                    this.logToTerminal(`Bank B: Loaded ${fileName} in Pad ${padNumber}`, 'success');
                })
                .catch(error => {
                    this.logToTerminal(`Bank B: Error loading ${fileName} in Pad ${padNumber}: ${error.message}`, 'error');
                })
        );
    }
    
    return Promise.allSettled(promises);
}
```

### **GitHub Sample Structure**

```
samples/
├── A_01-Pad_88_BPM.wav      # Ambient pad (88 BPM)
├── A_02-Bass_88_BPM.wav     # Bass line (88 BPM)
├── A_03-Arp_88_BPM.wav      # Arpeggiated sequence (88 BPM)
├── A_04-BD_SN_HH_OH_Slice.wav # Drum kit slice (88 BPM)
├── A_05-Kick_88.wav         # Kick drum (88 BPM)
├── A_06-Snare_88.wav        # Snare drum (88 BPM)
├── A_07-HH_88.wav           # Hi-hat (88 BPM)
├── A_08-Shaker_88.wav       # Shaker percussion (88 BPM)
├── B_01-FM_Pads_135_BPM.wav # FM synthesis pads (135 BPM)
├── B_02-Reese_Bass_135_BPM.wav # Reese bass (135 BPM)
├── B_03-You_are_135_BPM.wav # Vocal sample (135 BPM)
├── B_04-Multi_Drum_135_BPM.wav # Multi-layered drums (135 BPM)
├── B_05-Kick_4-4_135_BPM.wav # 4/4 kick pattern (135 BPM)
├── B_06-Hi_Hats_135_BPM.wav # Hi-hats pattern (135 BPM)
└── B_07-Claps_135_BPM.wav   # Clap samples (135 BPM)
```

### **Sample Characteristics**

#### **Bank A (88 BPM) - Electronic/Ambient**
- **Tempo**: 88 BPM (slower, atmospheric)
- **Style**: Electronic, ambient, downtempo
- **Use case**: Background music, atmospheric compositions

#### **Bank B (135 BPM) - Electronic/Dance**
- **Tempo**: 135 BPM (faster, energetic)
- **Style**: Electronic, dance, house
- **Use case**: Upbeat tracks, dance music

---

## User Sample Loading

### **Loading Methods**

#### **1. Drag & Drop**
```javascript
// Drag and drop event handlers
setupDragAndDrop(pad, padNumber) {
    pad.addEventListener('dragover', (e) => this.handleDragOver(e, padNumber));
    pad.addEventListener('dragenter', (e) => this.handleDragEnter(e, padNumber));
    pad.addEventListener('dragleave', (e) => this.handleDragLeave(e, padNumber));
    pad.addEventListener('drop', (e) => this.handleDrop(e, padNumber));
}
```

**Usage:**
1. Drag audio file from file explorer
2. Drop onto desired pad
3. File automatically loads and validates

#### **2. File Selection Dialog**
```javascript
loadMultipleSamples() {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'audio/*';
    
    input.onchange = (e) => {
        const files = Array.from(e.target.files);
        this.processMultipleFiles(files);
    };
    
    input.click();
}
```

**Usage:**
1. Click "Load Samples" button
2. Select multiple audio files
3. Files distributed across empty pads

### **File Processing**

```javascript
processMultipleFiles(files) {
    const validFiles = files.filter(file => this.validateAudioFile(file));
    
    if (validFiles.length === 0) {
        this.logToTerminal('No valid audio files selected.', 'warning');
        return;
    }
    
    // Find empty pads in current bank
    const emptyPads = this.findEmptyPads();
    
    if (emptyPads.length < validFiles.length) {
        this.showFullBankError('load ' + validFiles.length + ' samples');
        return;
    }
    
    // Load files into consecutive empty pads
    this.loadMultipleFilesToPads(validFiles, emptyPads[0]);
}
```

---

## Sample Slicing

### **Non-destructive Slicing System**

The slicing system creates variations without copying audio data:

```javascript
createSlices(sourceBuffer, numSlices) {
    const slices = [];
    const totalFrames = sourceBuffer.length;
    const framesPerSlice = Math.floor(totalFrames / numSlices);
    const sampleRate = sourceBuffer.sampleRate;
    
    for (let i = 0; i < numSlices; i++) {
        const startFrame = i * framesPerSlice;
        const endFrame = Math.min(startFrame + framesPerSlice, totalFrames);
        const sliceLength = endFrame - startFrame;
        
        // Create slice as reference + offset + duration
        const slice = {
            buffer: sourceBuffer,           // Reference to original
            offset: startFrame / sampleRate, // Start time
            duration: sliceLength / sampleRate, // Duration
            startFrame: startFrame,
            endFrame: endFrame
        };
        
        slices.push(slice);
    }
    
    return slices;
}
```

### **Slicing Options**

#### **4 Slices**
- **Use case**: Basic rhythm patterns
- **Result**: 4 equal-length segments
- **Pads used**: 4 consecutive empty pads

#### **8 Slices**
- **Use case**: Detailed rhythm breakdown
- **Result**: 8 equal-length segments
- **Pads used**: 8 consecutive empty pads

#### **16 Slices**
- **Use case**: Granular sample manipulation
- **Result**: 16 equal-length segments
- **Pads used**: 16 consecutive empty pads

### **Slicing Workflow**

1. **Activate Slicer Mode**
   ```javascript
   showPadSelectorForSlicer() {
       this.activateSlicerMode();
       this.logToTerminal('SLICER MODE ACTIVATED - Select a pad with a sample to slice', 'info');
       this.logToTerminal('Available loaded pads: ' + this.getLoadedPadsList(), 'info');
   }
   ```

2. **Select Source Pad**
   - Click on any pad with a loaded sample
   - Slicer modal opens with available options

3. **Choose Slice Count**
   - Select 4, 8, or 16 slices
   - System calculates available space

4. **Apply Slicing**
   - Slices created and distributed
   - Original sample preserved
   - New slices available in consecutive pads

---

## Bank Management

### **Bank System Overview**

The application supports 4 sample banks (A, B, C, D):

```javascript
// Bank selection
selectBank(bank) {
    if (this.currentBank === bank) return;
    
    this.currentBank = bank;
    this.updatePadBankIndicators();
    this.logToTerminal('Switched to Bank ' + bank, 'info');
    
    // Update bank buttons
    document.querySelectorAll('.bank-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector('.bank-btn[data-bank="' + bank + '"]').classList.add('active');
}
```

### **Bank Operations**

#### **Switch Banks**
- **Bank A**: Electronic/Ambient (88 BPM)
- **Bank B**: Electronic/Dance (135 BPM)
- **Bank C**: User samples (custom)
- **Bank D**: User samples (custom)

#### **Bank Status**
```javascript
showBankStatus() {
    const emptyPads = this.findEmptyPads();
    const loadedPads = 16 - emptyPads.length;
    
    this.logToTerminal(`Bank ${this.currentBank} Status:`, 'info');
    this.logToTerminal(`   - Loaded: ${loadedPads} samples`, 'info');
    this.logToTerminal(`   - Empty: ${emptyPads.length} pads`, 'info');
    this.logToTerminal(`   - Empty pad numbers: ${emptyPads.join(', ')}`, 'info');
    
    return { loaded: loadedPads, empty: emptyPads.length, emptyPads };
}
```

#### **Clear Bank**
```javascript
clearCurrentBank() {
    const bank = this.currentBank;
    
    for (let i = 1; i <= 16; i++) {
        if (this.samples[i]) {
            delete this.samples[i];
            delete this.sampleNames[bank][i];
            this.updatePadIndicator(i, false);
        }
    }
    
    this.logToTerminal(`Bank ${bank} cleared`, 'success');
    this.saveSampleInfo();
}
```

---

## Sample Validation

### **File Validation System**

```javascript
validateAudioFile(file) {
    if (!file) return false;
    
    // Enhanced format validation with canPlayType
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
    
    // File size limit (50MB)
    if (file.size > 50 * 1024 * 1024) {
        return false;
    }
    
    return true;
}
```

### **Validation Checks**

| Check | Description | Action |
|-------|-------------|---------|
| **File Type** | MIME type and extension | Reject invalid formats |
| **Browser Support** | `canPlayType()` check | Warn for unsupported formats |
| **File Size** | Maximum 50MB | Reject oversized files |
| **File Integrity** | File object validity | Reject corrupted files |

### **Error Handling**

```javascript
loadUserSample(padNumber, bank, file) {
    try {
        // Validate file
        if (!this.validateAudioFile(file)) {
            throw new Error('Invalid audio file format or size');
        }
        
        // Load and decode audio
        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        
        // Store sample
        this.samples[padNumber] = audioBuffer;
        this.sampleNames[bank][padNumber] = file.name;
        
        // Update UI
        this.updatePadIndicator(padNumber, true);
        this.showLoadedEffect(document.querySelector(`[data-number="${padNumber}"]`));
        
        this.logToTerminal(`Sample loaded: ${file.name} in Pad ${padNumber}`, 'success');
        
    } catch (error) {
        this.logToTerminal(`Error loading sample: ${error.message}`, 'error');
        throw error;
    }
}
```

---

## Storage & Persistence

### **Local Storage Integration**

Sample information is automatically saved to browser storage:

```javascript
saveSampleInfo() {
    try {
        const sampleInfo = {
            bankA: this.sampleNames.A || {},
            bankB: this.sampleNames.B || {},
            bankC: this.sampleNames.C || {},
            bankD: this.sampleNames.D || {},
            lastSaved: new Date().toISOString()
        };
        
        localStorage.setItem('embrioPlayerSamples', JSON.stringify(sampleInfo));
        console.log('Sample information saved to localStorage');
        
    } catch (error) {
        console.error('Error saving sample info:', error);
    }
}
```

### **Auto-save Triggers**

Samples are automatically saved when:
- Loading new samples
- Deleting samples
- Clearing banks
- Switching banks

### **Data Structure**

```javascript
// Stored sample information
{
    "bankA": {
        "1": "A_01-Pad_88_BPM.wav",
        "2": "A_02-Bass_88_BPM.wav",
        "3": "A_03-Arp_88_BPM.wav"
    },
    "bankB": {
        "1": "B_01-FM_Pads_135_BPM.wav",
        "2": "B_02-Reese_Bass_135_BPM.wav"
    },
    "bankC": {},
    "bankD": {},
    "lastSaved": "2025-08-18T23:45:00.000Z"
}
```

---

## Best Practices

### **Sample Organization**

#### **1. Naming Convention**
- **Descriptive names**: Include BPM, style, or instrument
- **Consistent format**: Use underscores instead of spaces
- **Version control**: Include version numbers for variations

#### **2. File Format Selection**
- **WAV**: For high-quality, lossless audio
- **MP3**: For smaller file sizes, web distribution
- **OGG**: For open-source projects
- **AAC/M4A**: For Apple ecosystem compatibility

#### **3. Sample Quality**
- **Sample Rate**: 44.1 kHz for compatibility
- **Bit Depth**: 16-bit for web, 24-bit for production
- **Normalization**: Consistent levels across samples

### **Performance Optimization**

#### **1. File Size Management**
- **Compress long samples**: Use MP3 for extended audio
- **Trim silence**: Remove unnecessary audio data
- **Optimize loops**: Ensure seamless loop points

#### **2. Memory Management**
- **Monitor usage**: Check browser memory consumption
- **Clear unused**: Remove samples from inactive banks
- **Restart browser**: If memory usage becomes high

### **Workflow Tips**

#### **1. Sample Preparation**
- **Organize samples**: Group by style, tempo, or instrument
- **Test compatibility**: Verify playback in target browsers
- **Backup samples**: Keep original files in separate location

#### **2. Bank Organization**
- **Bank A**: Core samples (always loaded)
- **Bank B**: Genre-specific samples
- **Bank C**: User samples, variations
- **Bank D**: Experimental samples, effects

---

## Troubleshooting

### **Common Issues**

#### **Sample Won't Load**
- **Check format**: Ensure supported audio format
- **File size**: Verify under 50MB limit
- **Browser support**: Test in different browsers
- **File corruption**: Try re-downloading

#### **Playback Issues**
- **Audio context**: Ensure audio system initialized
- **Sample format**: Check for encoding issues
- **Browser permissions**: Allow audio access
- **System audio**: Check volume and output

#### **Memory Problems**
- **Sample count**: Limit samples per bank
- **File sizes**: Use compressed formats
- **Browser restart**: Clear memory cache
- **Sample cleanup**: Remove unused samples

### **Debug Commands**

```javascript
// Check sample status
embryoPlayer.showBankStatus();

// Validate specific file
embryoPlayer.validateAudioFile(fileObject);

// Check storage
console.log('Stored samples:', localStorage.getItem('embrioPlayerSamples'));

// Monitor memory
console.log('Active samples:', Object.keys(embryoPlayer.samples).length);
console.log('Sample names:', embryoPlayer.sampleNames);
```

---

## Future Features

### **Planned Enhancements**

- **Sample Library**: Cloud-based sample storage
- **Advanced Slicing**: Beat-sync slicing, transient detection
- **Sample Effects**: Real-time sample manipulation
- **Collaboration**: Share sample libraries between users

### **Research Areas**

- **AI Sample Generation**: Machine learning for sample creation
- **Format Conversion**: Automatic format optimization
- **Quality Analysis**: Sample quality assessment tools
- **Streaming**: Progressive sample loading

---

## Related Documentation

- **[API Reference](API.md)** - Complete API documentation
- **[Performance Guide](PERFORMANCE.md)** - Performance optimizations
- **[README](../README.md)** - Project overview and quick start

---

*For sample-related issues or suggestions, please create a [GitHub Issue](https://github.com/sebasdv/embrio-player-v3/issues).*
