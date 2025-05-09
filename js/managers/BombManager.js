// BombManager.js - Handles all bomb-related functionality
class BombManager {
    constructor(scene) {
        this.scene = scene;
        this.bombsRemaining = {};
        this.currentBombType = null;
        this.activeBombs = [];
        this.bombState = {
            active: false,
            lastResetTime: 0,
            lastBombFired: 0,
            pendingReset: null,
            maxIdleTime: 20000, // Auto-reset if bomb is idle for 20 seconds
            autoResetTimer: null
        };
        
        // Initialize bomb types
        this.BOMB_TYPES = {
            BLAST: 'blast_bomb',
            PIERCER: 'piercer_bomb',
            CLUSTER: 'cluster_bomb',
            STICKY: 'sticky_bomb',
            SHATTERER: 'shatterer_bomb',
            DRILLER: 'driller_bomb',
            RICOCHET: 'ricochet_bomb'
        };
        
        // Bomb names
        this.BOMB_NAMES = {
            [this.BOMB_TYPES.BLAST]: 'Blast Girl',
            [this.BOMB_TYPES.PIERCER]: 'Piercer Girl',
            [this.BOMB_TYPES.CLUSTER]: 'Cluster Girl',
            [this.BOMB_TYPES.STICKY]: 'Sticky Girl',
            [this.BOMB_TYPES.SHATTERER]: 'Shatterer Girl',
            [this.BOMB_TYPES.DRILLER]: 'Driller Girl',
            [this.BOMB_TYPES.RICOCHET]: 'Ricochet Girl'
        };
        
        // Current active bomb
        this.bomb = null;
    }
    
    // Initialize bomb counts for a level
    setupBombs(levelData) {
        try {
            console.log(`Setting up bombs for level ${this.scene.currentLevel}`);
            
            // Reset bomb counts to make sure we don't keep any from previous levels
            Object.keys(this.bombsRemaining).forEach(bombType => {
                this.bombsRemaining[bombType] = 0;
            });
            
            // Setup from level data
            if (levelData && levelData.bombsAvailable) {
                console.log("Setting up bombs from level data:", levelData.bombsAvailable);
                
                Object.keys(levelData.bombsAvailable).forEach(bombType => {
                    // Skip undefined or invalid bomb types
                    if (!bombType || typeof levelData.bombsAvailable[bombType] !== 'number') {
                        return;
                    }
                    
                    // Store original count for debugging
                    const originalCount = levelData.bombsAvailable[bombType];
                    
                    // Double the bomb count for testing
                    this.bombsRemaining[bombType] = originalCount * 2;
                    
                    // Debug log for this specific bomb type
                    console.log(`Doubled bomb count for ${bombType}: ${originalCount} → ${this.bombsRemaining[bombType]}`);
                });
            } else {
                console.warn("No bomb data available for level setup");
                this.setupFallbackBombs(this.scene.currentLevel);
            }
            
            // Always set driller bombs to 6 for testing purposes
            this.bombsRemaining[this.BOMB_TYPES.DRILLER] = 6;
            console.log(`Set driller bomb count to 6 for testing`);
            
            // Make sure we have the ricochet bombs for level 2+
            if (this.scene.currentLevel >= 2) {
                // Ensure ricochet bombs are available
                this.bombsRemaining[this.BOMB_TYPES.RICOCHET] = Math.max(this.bombsRemaining[this.BOMB_TYPES.RICOCHET], 4);
                console.log(`Ensured ricochet bombs are available for level ${this.scene.currentLevel}: ${this.bombsRemaining[this.BOMB_TYPES.RICOCHET]}`);
            }
            
            // Select appropriate bomb type
            this.selectInitialBombType(levelData);
            
            console.log(`Bomb setup complete:`, this.bombsRemaining);
            console.log(`Starting with bomb type: ${this.currentBombType}`);
            
            return true;
        } catch (error) {
            console.error("Error setting up bombs:", error);
            this.setupFallbackBombs(this.scene.currentLevel);
            return false;
        }
    }
    
    // Select the initial bomb type based on level data
    selectInitialBombType(levelData) {
        // Check if there's a newly unlocked bomb to select
        const unlockedBomb = levelData?.unlockedBomb;
        
        if (unlockedBomb && this.bombsRemaining[unlockedBomb] > 0) {
            this.currentBombType = unlockedBomb;
            console.log(`Selected newly unlocked bomb type: ${unlockedBomb}`);
        } else {
            // Otherwise select the first available bomb type
            const availableBombType = Object.keys(this.bombsRemaining).find(type => 
                this.bombsRemaining[type] > 0
            );
            
            if (availableBombType) {
                this.currentBombType = availableBombType;
                console.log(`Selected first available bomb type: ${availableBombType}`);
            } else {
                // Fallback to blast bomb if somehow no bombs are available
                this.currentBombType = this.BOMB_TYPES.BLAST;
                this.bombsRemaining[this.BOMB_TYPES.BLAST] = 6;  // Ensure at least some bombs
                console.warn(`No bomb types available! Falling back to blast bombs.`);
            }
        }
    }
    
    // Fallback bomb settings if level data is missing
    setupFallbackBombs(levelNumber) {
        console.log("Using fallback bomb setup for level", levelNumber);
        
        // Set fallback bomb counts based on level
        switch (levelNumber) {
            case 2:
                // Level 2 adds the piercer and ricochet bombs
                this.bombsRemaining = {
                    [this.BOMB_TYPES.BLAST]: 6,     // Doubled from 3
                    [this.BOMB_TYPES.PIERCER]: 4,   // Doubled from 2
                    [this.BOMB_TYPES.CLUSTER]: 0,
                    [this.BOMB_TYPES.STICKY]: 0,
                    [this.BOMB_TYPES.SHATTERER]: 0,
                    [this.BOMB_TYPES.DRILLER]: 6,   // Always 6 for testing
                    [this.BOMB_TYPES.RICOCHET]: 4   // Doubled from 2
                };
                // Select piercer bomb by default
                this.currentBombType = this.BOMB_TYPES.PIERCER;
                break;
            case 3:
                // Level 3 adds the cluster bomb
                this.bombsRemaining = {
                    [this.BOMB_TYPES.BLAST]: 6,     // Doubled from 3
                    [this.BOMB_TYPES.PIERCER]: 6,   // Doubled from 3
                    [this.BOMB_TYPES.CLUSTER]: 4,   // Doubled from 2
                    [this.BOMB_TYPES.STICKY]: 0,
                    [this.BOMB_TYPES.SHATTERER]: 0,
                    [this.BOMB_TYPES.DRILLER]: 6,   // Always 6 for testing
                    [this.BOMB_TYPES.RICOCHET]: 4   // Doubled from 2
                };
                // Select cluster bomb by default
                this.currentBombType = this.BOMB_TYPES.CLUSTER;
                break;
            case 4:
                // Level 4 adds the sticky bomb
                this.bombsRemaining = {
                    [this.BOMB_TYPES.BLAST]: 6,     // Doubled from 3
                    [this.BOMB_TYPES.PIERCER]: 6,   // Doubled from 3
                    [this.BOMB_TYPES.CLUSTER]: 4,   // Doubled from 2
                    [this.BOMB_TYPES.STICKY]: 4,    // Doubled from 2
                    [this.BOMB_TYPES.SHATTERER]: 0,
                    [this.BOMB_TYPES.DRILLER]: 6,   // Always 6 for testing
                    [this.BOMB_TYPES.RICOCHET]: 4   // Doubled from 2
                };
                // Select sticky bomb by default
                this.currentBombType = this.BOMB_TYPES.STICKY;
                break;
            case 5:
                // Level 5 adds all bomb types
                this.bombsRemaining = {
                    [this.BOMB_TYPES.BLAST]: 6,     // Doubled from 3
                    [this.BOMB_TYPES.PIERCER]: 6,   // Doubled from 3
                    [this.BOMB_TYPES.CLUSTER]: 4,   // Doubled from 2
                    [this.BOMB_TYPES.STICKY]: 4,    // Doubled from 2
                    [this.BOMB_TYPES.SHATTERER]: 2, // Doubled from 1
                    [this.BOMB_TYPES.DRILLER]: 6,   // Always 6 for testing
                    [this.BOMB_TYPES.RICOCHET]: 4   // Doubled from 2
                };
                // Select shatterer bomb by default
                this.currentBombType = this.BOMB_TYPES.SHATTERER;
                break;
            default:
                // Level 1 (default)
                this.bombsRemaining = {
                    [this.BOMB_TYPES.BLAST]: 6,     // Doubled from 3
                    [this.BOMB_TYPES.PIERCER]: 0,
                    [this.BOMB_TYPES.CLUSTER]: 2,   // Doubled from 1
                    [this.BOMB_TYPES.STICKY]: 10,   // Doubled from 5
                    [this.BOMB_TYPES.SHATTERER]: 2, // Doubled from 1
                    [this.BOMB_TYPES.DRILLER]: 6,   // Always 6 for testing
                    [this.BOMB_TYPES.RICOCHET]: 0
                };
                // Select blast bomb by default
                this.currentBombType = this.BOMB_TYPES.BLAST;
        }
        
        console.log(`Fallback bomb counts set for level ${levelNumber}:`, this.bombsRemaining);
    }
    
    // Create a new static bomb at the slingshot position
    createBomb(x, y) {
        try {
            console.log("Creating new static bomb");
            
            // Update bomb state tracking
            this.bombState.lastResetTime = Date.now();
            
            // Create inactive bomb at provided position
            this.bomb = this.scene.matter.add.image(x, y, this.currentBombType, null);
            
            this.bomb.setCircle(30); // Set physics circle radius
            this.bomb.setStatic(true);
            this.bomb.setVisible(true);
            this.bomb.setDepth(12); // Above slingshot and elastic line
            
            // Set bomb size
            this.bomb.setDisplaySize(60, 60);
            
            // Mark this bomb as not launched (static at slingshot)
            this.bomb.isLaunched = false;
            this.bomb.hasHitIceBlock = false;
            this.bomb.bombType = this.currentBombType;
            
            // Make it draggable
            this.bomb.setInteractive();
            this.scene.input.setDraggable(this.bomb);
            
            // Update bomb state
            this.bombState.active = true;
            
            console.log(`Created bomb of type ${this.currentBombType}`);
            
            return this.bomb;
        } catch (error) {
            console.error("Error creating bomb:", error);
            return null;
        }
    }
    
    // Launch a bomb with physics
    launchBomb(x, y, forceX, forceY) {
        try {
            // Update bomb state tracking
            this.bombState.lastBombFired = Date.now();
            
            // Store the current bomb's position and type
            const bombX = x;
            const bombY = y;
            const bombType = this.currentBombType;
            
            // Set bomb properties based on type
            let bombProperties = {
                restitution: 0.9, // Increased for better bouncing in ultra-low gravity
                friction: 0.01, // Reduced for less surface friction
                density: 0.0003, // Base density
                frictionAir: 0.001 // Reduced for less air resistance
            };
            
            // Adjust properties for special bomb types
            switch(bombType) {
                case this.BOMB_TYPES.PIERCER:
                    bombProperties.friction = 0.002;
                    bombProperties.frictionAir = 0.0008;
                    bombProperties.density = 0.0005;
                    break;
                case this.BOMB_TYPES.CLUSTER:
                    bombProperties.density = 0.0002;
                    bombProperties.frictionAir = 0.001;
                    break;
                case this.BOMB_TYPES.STICKY:
                    bombProperties.density = 0.0003;
                    bombProperties.frictionAir = 0.001;
                    break;
                case this.BOMB_TYPES.SHATTERER:
                    bombProperties.density = 0.0004;
                    bombProperties.frictionAir = 0.0009;
                    break;
                case this.BOMB_TYPES.DRILLER:
                    bombProperties.density = 0.0004;
                    bombProperties.frictionAir = 0.0008;
                    break;
            }
            
            // Remove the old static bomb
            if (this.bomb) {
                this.bomb.destroy();
            }
            
            // Create a new dynamic bomb with physics properties
            this.bomb = this.scene.matter.add.image(bombX, bombY, bombType, null, bombProperties);
            this.bomb.setCircle(30);
            this.bomb.bombType = bombType;
            this.bomb.setDepth(12);
            this.bomb.setDisplaySize(60, 60);
            
            // Mark as a launched bomb (not static at slingshot)
            this.bomb.isLaunched = true;
            
            // Update bomb state
            this.bombState.active = true;
            
            // Apply impulse (instant force)
            this.scene.matter.body.applyForce(this.bomb.body, 
                { x: bombX, y: bombY }, 
                { x: forceX, y: forceY });
            
            // Track when the bomb was launched
            this.bomb.launchTime = this.scene.time.now;
            this.bomb.hasHitIceBlock = false;
            
            // Decrement the bomb count
            this.decrementBombCount(bombType);
            
            return this.bomb;
        } catch (error) {
            console.error("Error launching bomb:", error);
            return null;
        }
    }
    
    // Decrement the counter for a specific bomb type
    decrementBombCount(bombType) {
        // Decrement the counter for the specific bomb type
        if (this.bombsRemaining[bombType] > 0) {
            this.bombsRemaining[bombType]--;
            console.log(`Decremented ${bombType} count to ${this.bombsRemaining[bombType]}`);
            
            // Emit an event for UI to update
            this.scene.events.emit('bombCountUpdated', bombType, this.bombsRemaining[bombType]);
            
            // If we run out of this bomb type, switch to another available one
            if (this.bombsRemaining[bombType] === 0) {
                // Find another bomb type that has remaining bombs
                const availableBombType = Object.keys(this.bombsRemaining).find(type => 
                    this.bombsRemaining[type] > 0
                );
                
                if (availableBombType) {
                    this.selectBombType(availableBombType);
                    console.log(`Switched to ${availableBombType} because ${bombType} is depleted`);
                }
            }
        }
    }
    
    // Change the selected bomb type
    selectBombType(bombType) {
        if (this.bombsRemaining[bombType] > 0) {
            this.currentBombType = bombType;
            console.log(`Selected bomb type: ${bombType}`);
            
            // Emit an event for UI to update
            this.scene.events.emit('bombTypeSelected', bombType);
            
            return true;
        } else {
            console.log(`Cannot select ${bombType} - none remaining`);
            return false;
        }
    }
    
    // Clean up all bomb resources
    cleanup() {
        // Clear any active bomb
        if (this.bomb) {
            this.bomb.destroy();
            this.bomb = null;
        }
        
        // Clear any timeouts
        if (this.bombState.autoResetTimer) {
            clearTimeout(this.bombState.autoResetTimer);
            this.bombState.autoResetTimer = null;
        }
        
        if (this.bombState.pendingReset) {
            clearTimeout(this.bombState.pendingReset);
            this.bombState.pendingReset = null;
        }
        
        console.log("BombManager resources cleaned up");
    }
}

// Export the BombManager class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BombManager };
} else {
    // If not in Node.js, add to window object
    window.BombManager = BombManager;
} 