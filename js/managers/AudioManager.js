// AudioManager.js - Handles all game audio and music
class AudioManager {
    constructor(scene) {
        this.scene = scene;
        this.bgMusic = null;
        this.victoryMusic = null;
        this.soundsEnabled = true;
        this.soundCache = {};
        this.isInitialized = false;
        
        // Check if the sound system is available
        this.hasAudio = this.checkAudioAvailability();
    }
    
    // Check if audio is available in the current environment
    checkAudioAvailability() {
        try {
            return !!(this.scene.sound && this.scene.sound.context);
        } catch (error) {
            console.error("Error checking audio availability:", error);
            return false;
        }
    }
    
    // Initialize the audio system
    initialize() {
        console.log("Initializing AudioManager");
        
        if (!this.hasAudio) {
            console.error("Sound system not available, creating dummy audio manager");
            this.createDummyMethods();
            return false;
        }
        
        try {
            // Check audio context state
            if (this.scene.sound.context.state === 'suspended') {
                console.log("Audio context suspended - waiting for user interaction");
                this.displayClickPrompt();
                return false;
            }
            
            // Create actual audio manager
            this.setupAudioMethods();
            this.isInitialized = true;
            
            console.log("AudioManager initialized successfully");
            return true;
        } catch (error) {
            console.error("Error initializing AudioManager:", error);
            this.createDummyMethods();
            return false;
        }
    }
    
    // Display a message prompting user to click for audio
    displayClickPrompt() {
        // Create a text message
        const clickMessage = this.scene.add.text(
            this.scene.cameras.main.centerX, 
            100, 
            "Click anywhere to enable audio", 
            {
                font: '24px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);
        clickMessage.setDepth(1000); // Very high depth
        
        // Make the message blink to attract attention
        this.scene.tweens.add({
            targets: clickMessage,
            alpha: 0.5,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
        
        // Set up one-time event listener for user interaction
        const resumeAudio = () => {
            // Attempt to resume the audio context
            this.scene.sound.context.resume().then(() => {
                console.log("Audio context resumed successfully");
                clickMessage.destroy();
                
                // Continue with audio initialization
                this.setupAudioMethods();
                this.isInitialized = true;
                
                // Play background music after a short delay
                this.scene.time.delayedCall(500, () => {
                    this.playBackgroundMusic();
                });
            }).catch(err => {
                console.error("Failed to resume audio context:", err);
                // Create a dummy audio manager on failure
                this.createDummyMethods();
            });
        };
        
        // Listen for interaction events
        this.scene.input.once('pointerdown', resumeAudio);
        this.scene.input.keyboard.once('keydown', resumeAudio);
    }
    
    // Set up real audio methods
    setupAudioMethods() {
        // Play background music for the current level
        this.playBackgroundMusic = () => {
            try {
                console.log(`Attempting to play background music for level ${this.scene.currentLevel}...`);
                
                // Check if sounds are enabled
                if (!this.soundsEnabled) {
                    console.log("Sounds disabled, skipping background music");
                    return;
                }
                
                // Check if we already have a music instance and stop it properly
                if (this.bgMusic) {
                    try {
                        if (this.bgMusic.isPlaying) {
                            this.bgMusic.stop();
                        }
                        this.bgMusic = null;
                        console.log("Stopped previous background music");
                    } catch (err) {
                        console.warn("Error stopping previous background music:", err);
                        // Continue anyway to try to play new music
                    }
                }
                
                // Try level-specific music first (e.g., bgMusic_level2)
                const levelMusicKey = `bgMusic_level${this.scene.currentLevel}`;
                let musicKey = 'bgMusic'; // Default music key
                
                // First check if the level-specific music exists in cache
                if (this.scene.cache.audio.exists(levelMusicKey)) {
                    console.log(`Found level-specific music: ${levelMusicKey}`);
                    musicKey = levelMusicKey;
                } else {
                    console.log(`No level-specific music found for level ${this.scene.currentLevel}, using default bgMusic`);
                    
                    // Verify that the default music exists
                    if (!this.scene.cache.audio.exists('bgMusic')) {
                        console.error("Default bgMusic asset not found in cache!");
                        return; // Exit if no music is available
                    }
                }
                
                // Create and play background music with error handling
                try {
                    console.log(`Creating audio with key: ${musicKey}`);
                    
                    // Add a try-catch block specifically for sound creation
                    try {
                        this.bgMusic = this.scene.sound.add(musicKey, {
                            volume: 0.4,
                            loop: true
                        });
                    } catch (soundErr) {
                        console.error(`Error creating sound with key ${musicKey}:`, soundErr);
                        return;
                    }
                    
                    if (this.bgMusic) {
                        // Add another try-catch block for playing the sound
                        try {
                            this.bgMusic.play();
                            console.log(`Background music (${musicKey}) started successfully`);
                        } catch (playErr) {
                            console.error(`Error playing sound with key ${musicKey}:`, playErr);
                        }
                    } else {
                        console.error(`Failed to create audio from key: ${musicKey}`);
                    }
                } catch (err) {
                    console.error(`Error playing background music (${musicKey}):`, err);
                    
                    // If level-specific music failed, try fallback to default
                    if (musicKey !== 'bgMusic') {
                        console.log("Trying fallback to default background music");
                        try {
                            this.bgMusic = this.scene.sound.add('bgMusic', {
                                volume: 0.4,
                                loop: true
                            });
                            
                            if (this.bgMusic) {
                                try {
                                    this.bgMusic.play();
                                    console.log("Default background music started successfully as fallback");
                                } catch (fallbackPlayErr) {
                                    console.error("Error playing fallback music:", fallbackPlayErr);
                                }
                            }
                        } catch (fallbackErr) {
                            console.error("Fallback background music also failed:", fallbackErr);
                        }
                    }
                }
            } catch (error) {
                console.error("Error in playBackgroundMusic:", error);
            }
        };
        
        // Play victory music
        this.playVictoryMusic = () => {
            try {
                console.log("Attempting to play victory music...");
                
                // Check if sounds are enabled
                if (!this.soundsEnabled) {
                    console.log("Sounds disabled, skipping victory music");
                    return;
                }
                
                // Stop background music if playing
                if (this.bgMusic) {
                    try {
                        if (this.bgMusic.isPlaying) {
                            this.bgMusic.stop();
                        }
                    } catch (err) {
                        console.warn("Error stopping background music:", err);
                    }
                }
                
                // Check if the victory music exists
                if (!this.scene.cache.audio.exists('victoryMusic')) {
                    console.error("victoryMusic asset not found in cache");
                    return;
                }
                
                // Play victory music with enhanced error handling
                try {
                    this.victoryMusic = this.scene.sound.add('victoryMusic', {
                        volume: 0.6,
                        loop: false
                    });
                    
                    // Make sure it starts playing with a bit of delay
                    this.scene.time.delayedCall(200, () => {
                        if (this.victoryMusic) {
                            try {
                                this.victoryMusic.play();
                                console.log("Victory music started successfully");
                            } catch (playErr) {
                                console.error("Error playing victory music:", playErr);
                            }
                        }
                    });
                } catch (err) {
                    console.error("Failed to create victory music:", err);
                }
            } catch (err) {
                console.error("Error in playVictoryMusic:", err);
            }
        };
        
        // Play a sound effect
        this.playSFX = (key, options = {}) => {
            try {
                // Check if sounds are enabled
                if (!this.soundsEnabled) {
                    console.log(`Sounds disabled, skipping SFX: ${key}`);
                    return;
                }
                
                // Set default options
                const defaultOptions = {
                    volume: 0.5,
                    rate: 1.0
                };
                
                // Merge with provided options
                const finalOptions = { ...defaultOptions, ...options };
                
                // Check if the sound exists
                if (!this.scene.cache.audio.exists(key)) {
                    console.warn(`SFX not found in cache: ${key}`);
                    return;
                }
                
                try {
                    // Create and play the sound effect
                    const sfx = this.scene.sound.add(key, {
                        volume: finalOptions.volume,
                        rate: finalOptions.rate
                    });
                    
                    if (sfx) {
                        try {
                            sfx.play();
                            
                            // Store in cache for cleanup
                            this.soundCache[key] = sfx;
                            
                            // Auto-remove from cache when complete
                            sfx.once('complete', () => {
                                delete this.soundCache[key];
                            });
                        } catch (playErr) {
                            console.error(`Error playing SFX ${key}:`, playErr);
                        }
                    }
                } catch (sfxErr) {
                    console.error(`Error creating SFX ${key}:`, sfxErr);
                }
            } catch (error) {
                console.error(`Error in playSFX(${key}):`, error);
            }
        };
        
        // Stop all audio
        this.stopAll = () => {
            try {
                console.log("Stopping all audio...");
                
                // Stop background music
                if (this.bgMusic) {
                    try {
                        if (typeof this.bgMusic.stop === 'function') {
                            this.bgMusic.stop();
                            console.log("Stopped background music");
                        }
                        this.bgMusic = null;
                    } catch (err) {
                        console.error("Error stopping background music:", err);
                        this.bgMusic = null;
                    }
                }
                
                // Stop victory music
                if (this.victoryMusic) {
                    try {
                        if (typeof this.victoryMusic.stop === 'function') {
                            this.victoryMusic.stop();
                            console.log("Stopped victory music");
                        }
                        this.victoryMusic = null;
                    } catch (err) {
                        console.error("Error stopping victory music:", err);
                        this.victoryMusic = null;
                    }
                }
                
                // Stop all cached sound effects
                Object.keys(this.soundCache).forEach(key => {
                    try {
                        if (this.soundCache[key] && typeof this.soundCache[key].stop === 'function') {
                            this.soundCache[key].stop();
                        }
                    } catch (err) {
                        console.warn(`Error stopping sound ${key}:`, err);
                    }
                });
                
                // Clear the sound cache
                this.soundCache = {};
                
                // Try the global sound stopAll method
                try {
                    if (this.scene.sound && typeof this.scene.sound.stopAll === 'function') {
                        this.scene.sound.stopAll();
                        console.log("Used global stopAll as safety measure");
                    }
                } catch (err) {
                    console.warn("Could not stop all sounds through global method:", err);
                }
                
                console.log("All audio stopped");
            } catch (error) {
                console.error("Error in stopAll:", error);
            }
        };
        
        // Play game over sound
        this.playGameOverSound = () => {
            try {
                console.log("Attempting to play game over sound...");
                
                // Check if sounds are enabled
                if (!this.soundsEnabled) {
                    console.log("Sounds disabled, skipping game over sound");
                    return;
                }
                
                // Check if the game over sound exists
                if (this.scene.cache.audio.exists('gameOverSound')) {
                    this.playSFX('gameOverSound', { volume: 0.6 });
                } else {
                    console.warn("gameOverSound asset not found in cache");
                }
            } catch (err) {
                console.error("Error in playGameOverSound:", err);
            }
        };
        
        // Explosion sound effect
        this.playExplosionSound = () => {
            this.playSFX('explosion', { volume: 0.5 });
        };
        
        // Crack sound effect
        this.playCrackSound = () => {
            this.playSFX('cracksound', { volume: 0.4 });
        };
        
        // Bounce sound effect
        this.playBounceSound = () => {
            this.playSFX('bouncesound', { volume: 0.4 });
        };
    }
    
    // Create dummy methods when audio is not available
    createDummyMethods() {
        this.playBackgroundMusic = () => {
            console.log("Dummy AudioManager: Ignoring background music request");
        };
        
        this.playVictoryMusic = () => {
            console.log("Dummy AudioManager: Ignoring victory music request");
        };
        
        this.playSFX = (key) => {
            console.log(`Dummy AudioManager: Ignoring SFX request for ${key}`);
        };
        
        this.stopAll = () => {
            console.log("Dummy AudioManager: Ignoring stop all request");
        };
        
        this.playGameOverSound = () => {
            console.log("Dummy AudioManager: Ignoring game over sound request");
        };
        
        this.playExplosionSound = () => {
            console.log("Dummy AudioManager: Ignoring explosion sound request");
        };
        
        this.playCrackSound = () => {
            console.log("Dummy AudioManager: Ignoring crack sound request");
        };
        
        this.playBounceSound = () => {
            console.log("Dummy AudioManager: Ignoring bounce sound request");
        };
        
        console.log("Created dummy audio manager methods");
    }
    
    // Enable/disable all sounds
    setEnabled(enabled) {
        this.soundsEnabled = enabled;
        console.log(`Sound ${enabled ? 'enabled' : 'disabled'}`);
        
        // If disabling, stop all current sounds
        if (!enabled) {
            this.stopAll();
        }
    }
    
    // Clean up resources
    cleanup() {
        this.stopAll();
        this.bgMusic = null;
        this.victoryMusic = null;
        this.soundCache = {};
        console.log("AudioManager resources cleaned up");
    }
}

// Export the AudioManager class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AudioManager };
} else {
    // If not in Node.js, add to window object
    window.AudioManager = AudioManager;
} 