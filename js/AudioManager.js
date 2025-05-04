// AudioManager.js - Handles all audio for the game
class AudioManager {
    constructor(scene) {
        // Store reference to the game scene
        this.scene = scene;
        
        // Audio resources
        this.bgMusic = null;
        this.victoryMusic = null;
        this.sounds = {};
        
        // Audio state
        this.musicEnabled = true;
        this.soundsEnabled = true;
        this.masterVolume = 0.8;
    }
    
    // Initialize all audio
    initialize() {
        try {
            console.log("Initializing audio manager");
            
            // Check if audio is supported in the browser
            if (!this.scene.sound || !this.scene.sound.context) {
                console.warn("Audio context not available - audio may not work");
            }
            
            // List all available audio assets
            if (this.scene.cache && this.scene.cache.audio) {
                console.log("Available audio assets:", Object.keys(this.scene.cache.audio.entries).join(', '));
            } else {
                console.warn("Audio cache not available");
            }
            
            // Preload common sounds if they're missing
            this.preloadFallbackSounds();
            
            // Start background music with a delay to ensure everything is loaded
            console.log("Setting up delayed call for background music");
            this.scene.time.delayedCall(1500, () => {
                console.log("Delayed call triggered - playing background music");
                this.playBackgroundMusic();
            });
            
            return true;
        } catch (error) {
            console.error("Error initializing audio:", error);
            return false;
        }
    }
    
    // Add fallback sounds if they're missing from the cache
    preloadFallbackSounds() {
        try {
            // Create a list of all required sound effects
            const requiredSounds = [
                'bouncesound',
                'explosion',
                'crack',
                'cracksound',
                'fizzle',
                'bounce',
                'click',
                'blast',
                'victory'
            ];
            
            // Create an explicit mapping for fallback sounds when certain sounds are missing
            const fallbackMap = {
                'fizzle': 'explosion',
                'cracksound': 'crack',
                'crack': 'explosion' // If crack is missing, use explosion as backup
            };
            
            // First, explicitly handle cracksound if it's missing
            if (!this.scene.cache.audio.exists('cracksound')) {
                console.log("cracksound not found - creating explicit fallback");
                if (this.scene.cache.audio.exists('crack')) {
                    // Use crack as a fallback for cracksound
                    this.sounds['cracksound'] = { 
                        fallbackTo: 'crack',
                        placeholder: false
                    };
                    console.log("Using 'crack' as fallback for 'cracksound'");
                } else if (this.scene.cache.audio.exists('explosion')) {
                    // Use explosion as a fallback for cracksound
                    this.sounds['cracksound'] = { 
                        fallbackTo: 'explosion',
                        placeholder: false
                    };
                    console.log("Using 'explosion' as fallback for 'cracksound'");
                } else {
                    // Create a silent placeholder as a last resort
                    try {
                        this.scene.sound.add('cracksound', { volume: 0 });
                        this.sounds['cracksound'] = { placeholder: true };
                        console.log("Created silent placeholder for 'cracksound'");
                    } catch (e) {
                        console.warn("Error creating placeholder for cracksound:", e);
                    }
                }
            }
            
            // Check each required sound and create silent placeholder if missing
            requiredSounds.forEach(soundKey => {
                // Skip cracksound as we've already handled it
                if (soundKey === 'cracksound') return;
                
                if (!this.scene.cache.audio.exists(soundKey)) {
                    console.log(`${soundKey} sound not found in cache, creating placeholder`);
                    try {
                        // Try to use a fallback sound if available
                        const fallbackKey = fallbackMap[soundKey];
                        if (fallbackKey && this.scene.cache.audio.exists(fallbackKey)) {
                            // Clone the fallback sound instead of making a silent placeholder
                            const fallbackData = this.scene.cache.audio.get(fallbackKey);
                            if (fallbackData) {
                                // We can't directly clone it, but we can reference it
                                this.sounds[soundKey] = { 
                                    fallbackTo: fallbackKey,
                                    placeholder: false
                                };
                                console.log(`Using ${fallbackKey} as fallback for ${soundKey}`);
                                return;
                            }
                        }
                        
                        // Create silent placeholder if no fallback
                        this.scene.sound.add(soundKey, { volume: 0 });
                        this.sounds[soundKey] = { placeholder: true };
                    } catch (e) {
                        console.warn(`Error creating placeholder for ${soundKey}:`, e);
                    }
                } else {
                    console.log(`${soundKey} sound found in cache`);
                }
            });

            console.log("Fallback sounds initialized for", Object.keys(this.sounds).join(', '));
        } catch (error) {
            console.error("Error in preloadFallbackSounds:", error);
        }
    }
    
    // Play background music
    playBackgroundMusic() {
        try {
            console.log("Attempting to play background music...");
            
            if (!this.musicEnabled) {
                console.log("Music is disabled");
                return;
            }
            
            // Stop any existing background music
            if (this.bgMusic) {
                this.bgMusic.stop();
            }
            
            // Check if the audio system is available
            if (!this.scene.sound || !this.scene.sound.add) {
                console.error("Sound system not available");
                return;
            }
            
            // Check if the music exists in the cache
            if (!this.scene.cache.audio.exists('bgMusic')) {
                console.error("bgMusic asset not found in cache");
                console.log("Available audio:", Object.keys(this.scene.cache.audio.entries).join(', '));
                
                // Try to load it directly
                console.log("Attempting to load background music directly");
                this.scene.load.audio('bgMusic', './assets/audio/background_music.mp3');
                this.scene.load.once('complete', () => {
                    console.log("Background music loaded, now playing");
                    this.startBackgroundMusic();
                });
                this.scene.load.start();
                return;
            }
            
            this.startBackgroundMusic();
        } catch (err) {
            console.error("Error playing background music:", err);
        }
    }
    
    // Helper function to actually start the background music
    startBackgroundMusic() {
        try {
            // Create and play background music
            this.bgMusic = this.scene.sound.add('bgMusic', {
                volume: 0.4 * this.masterVolume,
                loop: true
            });
            
            // Add error handling for the audio
            this.bgMusic.once('looped', () => {
                console.log("Background music looped successfully");
            });
            
            this.bgMusic.once('error', (err) => {
                console.error("Error in background music playback:", err);
            });
            
            // Start playing the music
            this.bgMusic.play();
            console.log("Background music started successfully");
        } catch (err) {
            console.error("Error starting background music:", err);
        }
    }
    
    // Play victory music
    playVictoryMusic() {
        try {
            console.log("Attempting to play victory music...");
            
            if (!this.musicEnabled) {
                console.log("Music is disabled");
                return;
            }
            
            // Stop background music if playing
            if (this.bgMusic) {
                this.bgMusic.stop();
            }
            
            // Check if the victory music exists
            if (!this.scene.cache.audio.exists('victoryMusic')) {
                console.error("victoryMusic asset not found in cache");
                return;
            }
            
            // Play victory music
            this.victoryMusic = this.scene.sound.add('victoryMusic', {
                volume: 0.6 * this.masterVolume,
                loop: false
            });
            
            // Make sure it starts playing with a bit of delay
            this.scene.time.delayedCall(200, () => {
                this.victoryMusic.play();
                console.log("Victory music started successfully");
            });
        } catch (err) {
            console.error("Error playing victory music:", err);
        }
    }
    
    // Play game over sound
    playGameOverSound() {
        try {
            console.log("Attempting to play game over sound...");
            
            if (!this.soundsEnabled) {
                console.log("Sounds are disabled");
                return;
            }
            
            // Check if the game over sound exists
            if (this.scene.cache.audio.exists('gameOverSound')) {
                // Play game over sound
                const sound = this.scene.sound.add('gameOverSound', {
                    volume: 0.7 * this.masterVolume
                });
                sound.play();
                console.log("Game over sound started successfully");
            } else {
                console.warn("gameOverSound asset not found in cache, using fallback sound");
                // Create a fallback sound effect
                if (this.scene.sound && this.scene.sound.context) {
                    // Create a simple descending tone
                    const oscillator = this.scene.sound.context.createOscillator();
                    const gainNode = this.scene.sound.context.createGain();
                    
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.setValueAtTime(440, this.scene.sound.context.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(110, this.scene.sound.context.currentTime + 1.5);
                    
                    gainNode.gain.setValueAtTime(0.3 * this.masterVolume, this.scene.sound.context.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.scene.sound.context.currentTime + 1.5);
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.scene.sound.context.destination);
                    
                    oscillator.start();
                    oscillator.stop(this.scene.sound.context.currentTime + 1.5);
                    
                    console.log("Fallback game over sound created");
                }
            }
        } catch (err) {
            console.error("Error playing game over sound:", err);
        }
    }
    
    // Play a sound effect
    playSound(key, options = {}) {
        try {
            if (!this.soundsEnabled) {
                return null;
            }
            
            // Set default options
            const defaultOptions = {
                volume: 0.5 * this.masterVolume,
                rate: 1.0
            };
            
            // Merge provided options with defaults
            const soundOptions = { ...defaultOptions, ...options };
            
            // Check if we have a fallback mapping for this sound
            if (this.sounds[key] && this.sounds[key].fallbackTo) {
                // Use the fallback sound instead
                const fallbackKey = this.sounds[key].fallbackTo;
                console.log(`Using fallback sound ${fallbackKey} instead of ${key}`);
                return this.playSound(fallbackKey, soundOptions);
            }
            
            // First try to get the sound from our stored sounds
            if (this.sounds[key] && !this.sounds[key].placeholder) {
                return this.sounds[key].play(soundOptions);
            }
            
            // Check if the sound exists in cache
            if (this.scene.cache.audio.exists(key)) {
                try {
                    // Play the sound
                    const sound = this.scene.sound.add(key, soundOptions);
                    sound.play();
                    
                    // Store for future use
                    this.sounds[key] = sound;
                    
                    // Stop the sound after it plays to clean up resources
                    sound.once('complete', () => {
                        // Don't destroy, just keep for reuse
                        if (this.sounds[key] === sound) {
                            sound.stop();
                        }
                    });
                    
                    return sound;
                } catch (e) {
                    console.warn(`Error playing sound ${key}:`, e);
                    return null;
                }
            } else {
                // If we don't have the sound, use a fallback
                console.warn(`Sound ${key} not found in cache, trying to create placeholder`);
                
                // Create placeholder if it doesn't exist
                if (!this.sounds[key]) {
                    try {
                        const placeholder = this.scene.sound.add(key, { volume: 0 });
                        this.sounds[key] = { placeholder: true };
                    } catch (e) {
                        console.warn(`Error creating placeholder for ${key}:`, e);
                    }
                }
                
                // Try to use an explosion sound as a generic fallback
                if (key !== 'explosion' && this.scene.cache.audio.exists('explosion')) {
                    console.log(`Using explosion sound as fallback for ${key}`);
                    const fallbackOptions = { ...soundOptions, volume: 0.3 };
                    return this.playSound('explosion', fallbackOptions);
                }
                
                return null;
            }
        } catch (error) {
            console.error(`Error in playSound(${key}):`, error);
            return null;
        }
    }
    
    // Toggle music on/off
    toggleMusic() {
        this.musicEnabled = !this.musicEnabled;
        
        if (!this.musicEnabled) {
            // Stop all music
            if (this.bgMusic) this.bgMusic.stop();
            if (this.victoryMusic) this.victoryMusic.stop();
        } else {
            // Resume music
            this.playBackgroundMusic();
        }
        
        return this.musicEnabled;
    }
    
    // Toggle sound effects on/off
    toggleSounds() {
        this.soundsEnabled = !this.soundsEnabled;
        return this.soundsEnabled;
    }
    
    // Set master volume
    setMasterVolume(volume) {
        this.masterVolume = Phaser.Math.Clamp(volume, 0, 1);
        
        // Update existing sounds
        if (this.bgMusic) {
            this.bgMusic.setVolume(0.4 * this.masterVolume);
        }
        
        if (this.victoryMusic) {
            this.victoryMusic.setVolume(0.6 * this.masterVolume);
        }
        
        return this.masterVolume;
    }
    
    // Stop all audio
    stopAll() {
        if (this.bgMusic) {
            this.bgMusic.stop();
        }
        if (this.victoryMusic) {
            this.victoryMusic.stop();
        }
        
        // Stop all other sound effects
        this.scene.sound.stopAll();
    }
    
    // Clean up resources
    cleanup() {
        this.stopAll();
        
        // Clear references
        this.bgMusic = null;
        this.victoryMusic = null;
        this.sounds = {};
    }
}

// Export the AudioManager class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioManager };
} else {
    // If not in Node.js, add to window object
    window.AudioManager = AudioManager;
} 