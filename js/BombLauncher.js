/**
 * BombLauncher.js
 * Handles all bomb creation, positioning, and launching in the game
 */
class BombLauncher {
    /**
     * Initialize the BombLauncher
     * @param {Phaser.Scene} scene - The game scene this launcher belongs to
     */
    constructor(scene) {
        this.scene = scene;
        this.bomb = null;  // Current active bomb
        this.elasticLines = [];  // Visual slingshot lines
        this.trajectoryDots = [];  // Trajectory prediction dots
        this.trajectoryPoints = [];  // Points for trajectory prediction
        
        // Bomb state tracking
        this.bombState = {
            active: false,
            lastBombFired: 0,
            lastResetTime: 0,
            pendingReset: null
        };
        
        // Constants from the scene
        this.BOW_X = this.scene.BOW_X || 300;
        this.BOW_Y = this.scene.BOW_Y || 540;
        this.MAX_DRAG_DISTANCE = this.scene.MAX_DRAG_DISTANCE || 200;
        this.SHOT_POWER = this.scene.SHOT_POWER || 0.13;
        
        this.debugMode = this.scene.debugMode || false;
        
        // Create a debug text display
        if (this.debugMode) {
            this.debugText = this.scene.add.text(10, 100, 'BombLauncher Debug', { 
                font: '16px Arial', 
                fill: '#00ff00' 
            }).setDepth(1000);
        }
    }
    
    /**
     * Clean up existing visual elements
     */
    clearVisuals() {
        // Clean up elastic lines
        this.elasticLines.forEach(line => {
            if (line && line.scene) {
                line.destroy();
            }
        });
        this.elasticLines = [];
        
        // Clean up trajectory dots
        this.trajectoryDots.forEach(dot => {
            if (dot && dot.scene) {
                dot.destroy();
            }
        });
        this.trajectoryDots = [];
    }

    /**
     * Create a new bomb at the slingshot position
     * @param {string} bombType - The type/texture of bomb to create (defaults to 'bomb')
     * @return {Phaser.Physics.Matter.Image} The created bomb object
     */
    createBomb(bombType = 'bomb') {
        if (this.debugMode) {
            console.log("Creating bomb");
            this.updateDebugText("Creating bomb of type: " + bombType);
        }
        
        // Clean up existing bomb and visuals
        this.cleanupExistingBomb();
        this.clearVisuals();
        
        // Create inactive bomb at slingshot position
        this.bomb = this.scene.matter.add.image(this.BOW_X, this.BOW_Y - 20, bombType);
        
        // Configure bomb physics properties - match original settings
        this.bomb.setCircle(30);
        this.bomb.setStatic(true);
        this.bomb.setVisible(true);
        this.bomb.setDepth(12); // Above slingshot and elastic line
        this.bomb.setDisplaySize(60, 60);
        
        // Add bomb type for reference
        this.bomb.bombType = bombType;
        
        // Reset bomb state
        this.bombState.active = false;
        this.bombState.lastResetTime = Date.now();
        
        // Create initial elastic line
        this.createElasticLine(this.BOW_X, this.BOW_Y - 20);
        
        return this.bomb;
    }
    
    /**
     * Clean up any existing bomb object
     */
    cleanupExistingBomb() {
        if (this.bomb) {
            if (this.debugMode) {
                console.log("Cleaning up existing bomb");
            }
            
            if (this.bomb.scene) {
                this.bomb.destroy();
            }
            this.bomb = null;
        }
    }
    
    /**
     * Create the elastic slingshot line
     */
    createElasticLine(bombX, bombY) {
        // Clear existing lines
        this.clearVisuals();
        
        try {
            // Create the top line
            const topLine = this.scene.add.line(
                0, 0,                      // origin position
                this.BOW_X, this.BOW_Y-40, // start point
                bombX, bombY,              // end point
                0xFFFFFF                   // color
            );
            topLine.setOrigin(0, 0);       // set origin to top-left
            topLine.setLineWidth(3);       // thick line
            topLine.setDepth(11);          // above background, below bomb
            this.elasticLines.push(topLine);
            
            // Create the bottom line
            const bottomLine = this.scene.add.line(
                0, 0,                      // origin position
                bombX, bombY,              // start point
                this.BOW_X, this.BOW_Y+40, // end point
                0xFFFFFF                   // color
            );
            bottomLine.setOrigin(0, 0);    // set origin to top-left
            bottomLine.setLineWidth(3);    // thick line
            bottomLine.setDepth(11);       // above background, below bomb
            this.elasticLines.push(bottomLine);
            
            if (this.debugMode) {
                console.log(`Created elastic lines at ${bombX},${bombY}`);
                this.updateDebugText(`Created elastic line at ${bombX},${bombY}`);
            }
        } catch (error) {
            console.error("Error creating elastic line:", error);
        }
    }

    /**
     * Draw trajectory prediction dots
     */
    createTrajectoryDots(startX, startY, velocityX, velocityY) {
        // Clean up existing dots
        this.trajectoryDots.forEach(dot => {
            if (dot && dot.scene) {
                dot.destroy();
            }
        });
        this.trajectoryDots = [];
        
        if (this.debugMode) {
            console.log("Creating trajectory dots:", startX, startY, velocityX, velocityY);
            this.updateDebugText(`Creating trajectory from ${startX},${startY}`);
        }
        
        try {
            // Calculate trajectory points
            this.calculateTrajectoryPoints(startX, startY, velocityX, velocityY);
            
            // Create dots for visualizing trajectory
            if (this.trajectoryPoints.length > 0) {
                // Show fewer dots for performance (about 20-30 dots)
                const skipFactor = Math.ceil(this.trajectoryPoints.length / 25);
                
                for (let i = 0; i < this.trajectoryPoints.length; i += skipFactor) {
                    const point = this.trajectoryPoints[i];
                    
                    // Create a circle for each point
                    const dot = this.scene.add.circle(
                        point.x, point.y,     // position
                        5,                    // radius
                        0x00FF00,             // fill color
                        0.8                   // alpha
                    );
                    dot.setStrokeStyle(2, 0x000000); // black outline
                    dot.setDepth(10);         // above background
                    this.trajectoryDots.push(dot);
                }
                
                if (this.debugMode) {
                    console.log(`Created ${this.trajectoryDots.length} trajectory dots`);
                }
            }
        } catch (error) {
            console.error("Error creating trajectory dots:", error);
        }
    }
    
    /**
     * Calculate trajectory points without drawing
     */
    calculateTrajectoryPoints(startX, startY, velocityX, velocityY) {
        // Number of points to calculate
        const numPoints = 200;
        const timeStep = 0.1;
        
        // Physics properties
        let density = 0.0003;
        let frictionAir = 0.008;
        
        // Get the current bomb type
        const bombType = this.scene.currentBombType || 'bomb';
        
        // Adjust properties for special bomb types
        const BOMB_TYPES = this.scene.BOMB_TYPES || {
            BLAST: 'bomb',
            PIERCER: 'piercer',
            CLUSTER: 'cluster',
            STICKY: 'sticky',
            SHATTERER: 'shatterer',
            DRILLER: 'driller',
            RICOCHET: 'ricochet'
        };
        
        // Gravity and scaling
        let gravityY = 0.008;
        let forceScale = 40;
        
        // Initial position and velocity
        let x = startX;
        let y = startY;
        let vx = velocityX * forceScale;
        let vy = velocityY * forceScale;
        
        // Reset trajectory points
        this.trajectoryPoints = [];
        
        // Calculate trajectory points
        for (let i = 0; i < numPoints; i++) {
            // Save current point
            this.trajectoryPoints.push({ x, y });
            
            // Calculate next position
            x += vx * timeStep;
            y += vy * timeStep;
            
            // Update velocity with physics
            vx *= (1 - frictionAir * timeStep);
            vy *= (1 - frictionAir * timeStep);
            vy += gravityY * timeStep * 150 * density;
            
            // Stop if out of bounds
            if (x < -500 || x > this.scene.cameras.main.width + 500 || 
                y < -500 || y > this.scene.cameras.main.height + 1000) {
                break;
            }
        }
        
        if (this.debugMode) {
            console.log(`Calculated ${this.trajectoryPoints.length} trajectory points`);
        }
    }
    
    /**
     * Update the debug text display
     */
    updateDebugText(message) {
        if (this.debugMode && this.debugText) {
            this.debugText.setText(message);
        }
    }

    /**
     * Update bomb position during dragging
     * @param {Phaser.Input.Pointer} pointer - The pointer (mouse/touch) position
     */
    updateBombPosition(pointer) {
        if (!this.bomb || !pointer) return;
        
        try {
            // Ensure pointer has valid x and y coordinates
            if (pointer.x === undefined || pointer.y === undefined) {
                console.warn("Invalid pointer coordinates in updateBombPosition");
                return;
            }
            
            // Use the drawTrajectoryFromPointer method for consistent handling
            this.drawTrajectoryFromPointer(pointer);
        } catch (error) {
            console.error("Error in BombLauncher.updateBombPosition:", error);
        }
    }

    /**
     * Calculate the force to apply based on pointer position
     * @param {Phaser.Input.Pointer} pointer - The pointer (mouse/touch) position
     * @return {Object} Object containing forceX and forceY values
     */
    calculateForce(pointer) {
        // Calculate direction from slingshot
        const dx = this.BOW_X - pointer.x;
        const dy = this.BOW_Y - 30 - pointer.y;
        
        // Scale by shot power - match original scaling
        const forceX = dx * this.SHOT_POWER * 0.01;
        const forceY = dy * this.SHOT_POWER * 0.01;
        
        return { forceX, forceY };
    }

    /**
     * Create visual trajectory from pointer for preview
     * @param {Phaser.Input.Pointer} pointer - The pointer position
     */
    drawTrajectoryFromPointer(pointer) {
        try {
            if (!pointer || pointer.x === undefined || pointer.y === undefined) {
                return;
            }
            
            // Calculate angle and distance from slingshot
            const dx = this.BOW_X - pointer.x;
            const dy = this.BOW_Y - 30 - pointer.y;
            
            // Limit distance by MAX_DRAG_DISTANCE
            const distance = Math.min(
                this.MAX_DRAG_DISTANCE,
                Math.sqrt(dx * dx + dy * dy)
            );
            
            // Calculate angle
            const angle = Math.atan2(dy, dx);
            
            // Calculate bomb position
            const bombX = this.BOW_X - distance * Math.cos(angle);
            const bombY = (this.BOW_Y - 30) - distance * Math.sin(angle);
            
            // Update bomb position if it exists
            if (this.bomb) {
                this.bomb.setPosition(bombX, bombY);
            }
            
            // Update elastic line
            this.createElasticLine(bombX, bombY);
            
            // Calculate velocity for trajectory
            const forceX = dx * this.SHOT_POWER * 0.01;
            const forceY = dy * this.SHOT_POWER * 0.01;
            
            // Create trajectory dots
            this.createTrajectoryDots(bombX, bombY, forceX, forceY);
            
            if (this.debugMode) {
                this.updateDebugText(`Drawing at ${bombX},${bombY} with force ${forceX},${forceY}`);
            }
        } catch (error) {
            console.error("Error in drawTrajectoryFromPointer:", error);
            this.updateDebugText(`Error: ${error.message}`);
        }
    }

    /**
     * Launch the bomb based on pointer position
     * @param {Phaser.Input.Pointer} pointer - The pointer (mouse/touch) position
     * @return {boolean} True if the bomb was launched successfully
     */
    launchBomb(pointer) {
        if (!this.bomb || this.isBombActive() || !pointer) return false;
        
        try {
            // Ensure pointer has valid x and y coordinates
            if (pointer.x === undefined || pointer.y === undefined) {
                console.warn("Invalid pointer coordinates in launchBomb");
                return false;
            }
            
            // Calculate angle and distance from slingshot
            const dx = this.BOW_X - pointer.x;
            const dy = this.BOW_Y - 30 - pointer.y;
            
            // Minimum drag distance required to fire (prevents accidental taps)
            const minDragDistance = 20;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDragDistance) {
                // Too small a drag, reset the bomb position
                this.createBomb(this.bomb.texture.key);
                return false;
            }
            
            // Calculate force based on drag - match original calculation
            const { forceX, forceY } = this.calculateForce(pointer);
            
            if (this.debugMode) {
                console.log('Launching bomb with force:', forceX, forceY, 'distance:', distance);
                this.updateDebugText(`Launching with force ${forceX},${forceY}`);
            }
            
            // Clean up all visuals
            this.clearVisuals();

            // Store current position and type
            const bombX = this.bomb.x;
            const bombY = this.bomb.y;
            const bombType = this.bomb.texture.key;

            // Clean up the static bomb
            this.bomb.destroy();
            
            // Set bomb properties based on type - match original settings
            let bombProperties = {
                restitution: 0.9,     // Increased for better bouncing
                friction: 0.01,       // Reduced for less surface friction
                density: 0.0003,      // Original density value
                frictionAir: 0.001    // Original air friction - very low
            };
            
            // Create a new dynamic bomb with the right physics properties
            this.bomb = this.scene.matter.add.image(bombX, bombY, bombType, null, bombProperties);
            this.bomb.setCircle(30);
            this.bomb.bombType = bombType;
            this.bomb.setDepth(12);
            this.bomb.setDisplaySize(60, 60);
            this.bomb.setFixedRotation(false);
            this.bomb.setAngularVelocity(0.1); // Slight rotation
            
            // Apply force to the bomb - use matter body apply force for consistent behavior
            this.scene.matter.body.applyForce(
                this.bomb.body, 
                { x: bombX, y: bombY },
                { x: forceX, y: forceY }
            );
            
            // Mark the bomb as launched
            this.bomb.isLaunched = true;
            this.bomb.isAtSlingshot = false;
            this.bomb.hasHitIceBlock = false;
            
            // Add special properties for sticky and driller bombs
            const BOMB_TYPES = this.scene.BOMB_TYPES || {
                STICKY: 'sticky',
                DRILLER: 'driller'
            };
            
            // Add special properties for specific bomb types
            if (bombType === BOMB_TYPES.STICKY) {
                this.bomb.isSticky = true;
                console.log("Sticky bomb launched");
            } else if (bombType === BOMB_TYPES.DRILLER) {
                this.bomb.isDriller = true;
                console.log("Driller bomb launched");
            }
            
            // Update bomb state tracking
            this.bombState.active = true;
            this.bombState.lastBombFired = Date.now();
            
            // Decrease bomb count in the scene if needed
            this.decrementBombCount(bombType);
            
            return true;
        } catch (error) {
            console.error("Error in BombLauncher.launchBomb:", error);
            this.updateDebugText(`Launch error: ${error.message}`);
            
            // Attempt recovery by creating a new bomb
            try {
                if (this.bomb) {
                    const bombType = this.bomb.texture.key;
                    this.createBomb(bombType);
                }
            } catch (e) {
                console.error("Error in recovery attempt:", e);
            }
            
            return false;
        }
    }
    
    /**
     * Decrement bomb count in the scene and update UI
     * @param {string} bombType - The type of bomb to decrement
     */
    decrementBombCount(bombType) {
        try {
            // Check if the scene has the decrementBombCount method
            if (this.scene.decrementBombCount) {
                this.scene.decrementBombCount(bombType);
            } else if (this.scene.bombsRemaining && this.scene.bombsRemaining[bombType] !== undefined) {
                // Otherwise try to directly update the bombs remaining
                this.scene.bombsRemaining[bombType]--;
                
                // Update UI if possible
                if (this.scene.updateBombUI) {
                    this.scene.updateBombUI();
                }
            }
        } catch (error) {
            console.error("Error decrementing bomb count:", error);
        }
    }
    
    /**
     * Check if a bomb is currently active (in motion)
     * @returns {boolean} True if a bomb is currently in motion
     */
    isBombActive() {
        // Consider a bomb active if:
        // 1. The active flag is set (a bomb was fired) OR
        // 2. A dynamic bomb exists and is visible
        if (this.bombState.active) return true;
        
        // Check if we have a dynamic bomb in the scene
        try {
            return this.bomb && !this.bomb.isStatic && this.bomb.visible;
        } catch (error) {
            console.error("Error checking bomb active state:", error);
            return false;
        }
    }
    
    /**
     * Check if the active bomb has gone out of bounds and handle it
     * 
     * This should be called in the scene's update method
     */
    checkForMissedBombs() {
        try {
            // Skip if no bomb or bomb is not active
            if (!this.bomb || !this.bombState.active) return;
            
            // Check if bomb is out of bounds
            const outOfBounds = this.bomb.x < -100 || 
                                this.bomb.x > this.scene.sys.game.config.width + 100 ||
                                this.bomb.y < -100 || 
                                this.bomb.y > this.scene.sys.game.config.height + 100;
            
            if (outOfBounds) {
                if (this.debugMode) {
                    console.log(`Bomb out of bounds (${this.bomb.x}, ${this.bomb.y}), destroying it`);
                    this.updateDebugText(`Bomb out of bounds (${this.bomb.x}, ${this.bomb.y})`);
                }
                
                // Create a fizzle effect at last known position
                if (this.scene.createFizzleEffect) {
                    this.scene.createFizzleEffect(this.bomb.x, this.bomb.y);
                }
                
                // Destroy the bomb
                if (this.bomb.scene) {
                    this.bomb.destroy();
                }
                this.bomb = null;
                
                // Update bomb state
                this.bombState.active = false;
                
                // Schedule a reset for the next bomb
                this.scene.time.delayedCall(1000, () => {
                    if (this.scene.shotsRemaining > 0) {
                        this.createBomb(this.scene.currentBombType || 'bomb');
                    } else {
                        // Check level completion if no shots remain
                        if (this.scene.checkLevelCompletion) {
                            this.scene.checkLevelCompletion();
                        }
                    }
                });
                
                return true; // Bomb was handled
            }
            
            return false; // No bombs were handled
        } catch (error) {
            console.error("Error in BombLauncher.checkForMissedBombs:", error);
            this.updateDebugText(`Error: ${error.message}`);
            return false;
        }
    }
    
    /**
     * Check if the active bomb has stopped moving and hasn't hit any blocks
     * If so, explode it to match the behavior of the previous version
     * 
     * This should be called in the scene's update method
     */
    checkForStoppedBombs() {
        try {
            // Skip if no bomb, bomb is not active, or bomb is a special type that shouldn't auto-explode
            if (!this.bomb || !this.bombState.active) return false;
            
            // Get the bomb type safely with proper fallbacks
            const bombType = this.bomb.bombType || this.scene.currentBombType || 'blast_bomb';
            
            // Get BOMB_TYPES safely from scene
            const BOMB_TYPES = this.scene.BOMB_TYPES || {
                STICKY: 'sticky_bomb',
                DRILLER: 'driller_bomb',
                RICOCHET: 'ricochet_bomb'
            };
            
            // Skip special bomb types that shouldn't auto-explode when stopped
            if (bombType === BOMB_TYPES.STICKY || 
                bombType === BOMB_TYPES.DRILLER || 
                bombType === BOMB_TYPES.RICOCHET) {
                return false;
            }
            
            // Skip if the bomb has hit an ice block already
            if (this.bomb.hasHitIceBlock) return false;
            
            // Check if bomb is moving very slowly (almost stopped)
            if (this.bomb.body && this.bomb.body.velocity) {
                const velocity = this.bomb.body.velocity;
                const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
                
                // If speed is below threshold and bomb has been active for at least 1 second
                const minActiveTime = 1000; // 1 second minimum to avoid premature explosions
                const timeSinceActivation = Date.now() - this.bombState.lastBombFired;
                
                // Very low speed threshold indicates the bomb has essentially stopped
                const speedThreshold = 0.2;
                
                if (speed < speedThreshold && timeSinceActivation > minActiveTime) {
                    console.log(`Bomb stopped moving (speed: ${speed.toFixed(2)}), triggering explosion`);
                    
                    // Get bomb position for explosion
                    const bombX = this.bomb.x;
                    const bombY = this.bomb.y;
                    
                    // Use a try/catch block to handle each explosion type separately
                    try {
                        // Handle explosion based on bomb type
                        if (this.scene.bombUtils) {
                            // Use BombUtils for explosion handling
                            switch(bombType) {
                                case 'blast_bomb':
                                case 'bomb':
                                    this.scene.bombUtils.handleBlastBomb(bombX, bombY);
                                    break;
                                case 'piercer_bomb':
                                    // Special handling for piercer bombs without velocity
                                    // Use default downward direction if velocity is unavailable
                                    this.scene.bombUtils.handlePiercerBomb(bombX, bombY, {x: 0, y: 1});
                                    break;
                                case 'cluster_bomb':
                                    this.scene.bombUtils.handleClusterBomb(bombX, bombY);
                                    break;
                                case 'shatterer_bomb':
                                    this.scene.bombUtils.handleShattererBomb(bombX, bombY);
                                    break;
                                default:
                                    // Fallback to standard explosion
                                    this.scene.bombUtils.handleBlastBomb(bombX, bombY);
                                    break;
                            }
                        } else {
                            // Fallback to scene's explosion handlers
                            switch(bombType) {
                                case 'blast_bomb':
                                case 'bomb':
                                    this.scene.handleBlastBomb(bombX, bombY);
                                    break;
                                case 'piercer_bomb':
                                    // Provide default direction for piercer bombs
                                    if (this.scene.handlePiercerBomb.length > 2) {
                                        // If the method accepts a velocity parameter
                                        this.scene.handlePiercerBomb(bombX, bombY, {x: 0, y: 1});
                                    } else {
                                        // If it only takes x and y
                                        this.scene.handlePiercerBomb(bombX, bombY);
                                    }
                                    break;
                                case 'cluster_bomb':
                                    this.scene.handleClusterBomb(bombX, bombY);
                                    break;
                                case 'shatterer_bomb':
                                    this.scene.handleShattererBomb(bombX, bombY);
                                    break;
                                default:
                                    // Fallback to standard explosion
                                    this.scene.handleBlastBomb(bombX, bombY);
                                    break;
                            }
                        }
                    } catch (explosionError) {
                        console.error(`Error handling ${bombType} explosion:`, explosionError);
                        
                        // Fallback - try to use a simple blast explosion if specific handler failed
                        try {
                            if (this.scene.bombUtils) {
                                this.scene.bombUtils.handleBlastBomb(bombX, bombY);
                            } else if (this.scene.handleBlastBomb) {
                                this.scene.handleBlastBomb(bombX, bombY);
                            } else if (this.scene.createExplosion) {
                                this.scene.createExplosion(bombX, bombY);
                            }
                        } catch (fallbackError) {
                            console.error("Fallback explosion also failed:", fallbackError);
                        }
                    }
                    
                    // Mark bomb as exploded
                    this.bomb.hasExploded = true;
                    
                    // Destroy the bomb
                    if (this.bomb.scene) {
                        this.bomb.destroy();
                    }
                    this.bomb = null;
                    
                    // Update bomb state
                    this.bombState.active = false;
                    
                    // Schedule a reset for the next bomb
                    this.scene.time.delayedCall(1000, () => {
                        if (this.scene.shotsRemaining > 0) {
                            this.createBomb(this.scene.currentBombType || 'bomb');
                        } else {
                            // Check level completion if no shots remain
                            if (this.scene.checkLevelCompletion) {
                                this.scene.checkLevelCompletion();
                            }
                        }
                    });
                    
                    return true; // Bomb was handled
                }
            }
            
            return false; // Bomb is still moving or conditions not met
        } catch (error) {
            console.error("Error in BombLauncher.checkForStoppedBombs:", error);
            return false;
        }
    }

    /**
     * Toggle debug mode on/off
     * @param {boolean} [value] - Optional explicit value to set, otherwise toggles current state
     * @returns {boolean} The new debug mode state
     */
    toggleDebugMode(value) {
        // If value is provided, use it, otherwise toggle current state
        this.debugMode = value !== undefined ? value : !this.debugMode;
        
        if (this.debugMode) {
            // Create debug text if it doesn't exist
            if (!this.debugText) {
                this.debugText = this.scene.add.text(10, 100, 'BombLauncher Debug', { 
                    font: '16px Arial', 
                    fill: '#00ff00' 
                }).setDepth(1000);
            }
            console.log("BombLauncher debug mode enabled");
            this.updateDebugText("Debug mode enabled");
        } else {
            // Remove debug text if debug mode is turned off
            if (this.debugText && this.debugText.scene) {
                this.debugText.destroy();
                this.debugText = null;
            }
            console.log("BombLauncher debug mode disabled");
        }
        
        return this.debugMode;
    }
} 