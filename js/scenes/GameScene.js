class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        
        this.SLINGSHOT_X = 300;
        this.SLINGSHOT_Y = 800;
        this.MAX_DRAG_DISTANCE = 200;
        this.SHOT_POWER = 0.2;
        this.MAX_SHOTS = 10;
        this.shotsRemaining = this.MAX_SHOTS;
        this.isAiming = false;
        this.revealPercentage = 0;
        this.targetPercentage = 80;
        this.UI_DEPTH = 1000; // Add consistent UI depth value
        this.isLevelComplete = false;
        this.isGameOver = false;
        
        // Audio properties
        this.bgMusic = null;
        this.victoryMusic = null;
        
        // Bomb types with names from Game Design Document
        this.BOMB_TYPES = {
            BLAST: 'blast_bomb',
            PIERCER: 'piercer_bomb',
            CLUSTER: 'cluster_bomb',
            STICKY: 'sticky_bomb',
            SHATTERER: 'shatterer_bomb'
        };
        
        // Bomb names based on Game Design Document
        this.BOMB_NAMES = {
            [this.BOMB_TYPES.BLAST]: 'Blast Girl',
            [this.BOMB_TYPES.PIERCER]: 'Piercer Girl',
            [this.BOMB_TYPES.CLUSTER]: 'Cluster Girl',
            [this.BOMB_TYPES.STICKY]: 'Sticky Girl',
            [this.BOMB_TYPES.SHATTERER]: 'Shatterer Girl'
        };
        
        // Remaining bombs of each type
        this.bombsRemaining = {
            [this.BOMB_TYPES.BLAST]: 10,
            [this.BOMB_TYPES.PIERCER]: 7,
            [this.BOMB_TYPES.CLUSTER]: 5,
            [this.BOMB_TYPES.STICKY]: 3,
            [this.BOMB_TYPES.SHATTERER]: 2
        };
        
        // Current selected bomb type
        this.currentBombType = this.BOMB_TYPES.BLAST;
        
        // Debug mode for testing
        this.debugMode = true;
        
        // Configure the game for better performance with frequent pixel operations
        this.willReadPixelsFrequently = true;
    }

    create() {
        try {
            // Setup world physics
            this.matter.world.setBounds(0, 0, this.cameras.main.width, this.cameras.main.height);
            this.matter.world.setGravity(0, 1);

            // Initialize arrays for game objects
            this.activeStickyBombs = [];
            
            // Create trajectoryPoints for aiming path
            this.trajectoryPoints = [];
            this.trajectoryGraphics = this.add.graphics();
            this.trajectoryGraphics.setDepth(15); // Higher depth than blocks (4) to ensure visibility
            
            // Create game objects
            this.createBackground();
            
            // Add completion veil after background but before ice blocks
            this.completionVeil = this.add.rectangle(
                1920/2,
                1080/2,
                800, // Same width as chibi image max width
                900, // Same height as chibi image max height
                0x0033aa, // Deep blue color instead of white
                0.7
            );
            this.completionVeil.setDepth(2); // Above chibi (1) but below ice blocks (4)
            
            // Add a frost effect to the completion veil
            const frostGraphics = this.add.graphics();
            frostGraphics.lineStyle(2, 0x66aaff, 0.3); // Light blue lines for frost effect
            
            // Add crystalline patterns
            for (let i = 0; i < 50; i++) {
                const x = Phaser.Math.Between(-400, 400);
                const y = Phaser.Math.Between(-450, 450);
                const size = Phaser.Math.Between(20, 60);
                
                // Draw a snowflake-like pattern
                frostGraphics.moveTo(1920/2 + x, 1080/2 + y);
                frostGraphics.lineTo(1920/2 + x + size, 1080/2 + y);
                frostGraphics.moveTo(1920/2 + x, 1080/2 + y);
                frostGraphics.lineTo(1920/2 + x - size/2, 1080/2 + y + size);
                frostGraphics.moveTo(1920/2 + x, 1080/2 + y);
                frostGraphics.lineTo(1920/2 + x - size/2, 1080/2 + y - size);
            }
            
            frostGraphics.setDepth(2);
            this.frostGraphics = frostGraphics;
            
            // Create slingshot
            this.createSlingshot();
            this.createTargets();
            
            // Create UI before resetting bomb
            this.createUI();
            
            // Reset bomb and prepare for first shot
            this.resetBomb();
            
            // Setup input handlers
            this.setupInputHandlers();
            
            // Directly initialize audio (simpler approach)
            this.initializeAudio();
            
            // Debug text display - moved to bottom of screen
            if (this.debugMode) {
                this.debugText = this.add.text(10, this.cameras.main.height - 30, 'Debug: Ready', { 
                    font: '16px Arial', 
                    fill: '#ffffff',
                    backgroundColor: '#333333',
                    padding: { x: 5, y: 2 }
                });
                this.debugText.setDepth(this.UI_DEPTH - 1); // Below UI but above game elements
            }
            
            // Make sure UIScene is running - in case it wasn't started or was stopped
            if (!this.scene.isActive('UIScene')) {
                console.log("Starting UIScene from GameScene");
                this.scene.launch('UIScene');
            }
            
            // Send initial events to update UI
            this.events.emit('updateShots', this.shotsRemaining);
            this.events.emit('updatePercentage', this.revealPercentage);
            
            console.log("GameScene created successfully");
        } catch (error) {
            console.error("Error in create:", error);
        }
    }

    createBackground() {
        try {
            // Create a container with specific depth for layering
            this.backgroundContainer = this.add.container(0, 0);
            this.backgroundContainer.setDepth(0); // Lowest depth for background
            
            // Check if level background was loaded successfully
            let bgImage;
            if (this.textures.exists('levelBackground')) {
                // Use the loaded background image
                bgImage = this.add.image(1920/2, 1080/2, 'levelBackground');
                console.log("Using loaded level background image");
            } else {
                // Fallback to default background
                bgImage = this.add.image(1920/2, 1080/2, 'background');
                console.log("Fallback to default background");
            }
            
            // Set background to lowest depth to ensure it's behind everything
            bgImage.setDepth(0);
            
            // Add the chibi image at the center of play area
            this.chibiImage = this.add.image(1920/2, 1080/2, 'chibi');
            this.chibiImage.setDepth(1); // Lower depth for chibi image
            
            // Scale the image to fit nicely in the play area
            const maxWidth = 800;
            const maxHeight = 900;
            
            // Get the loaded image dimensions
            const imageWidth = this.chibiImage.width;
            const imageHeight = this.chibiImage.height;
            
            // Calculate scale to fit within our desired max dimensions
            // while maintaining aspect ratio
            let scale = 1;
            if (imageWidth > maxWidth || imageHeight > maxHeight) {
                const scaleX = maxWidth / imageWidth;
                const scaleY = maxHeight / imageHeight;
                scale = Math.min(scaleX, scaleY);
            }
            
            this.chibiImage.setScale(scale);
            
            // Set the image to be fully opaque
            this.chibiImage.setAlpha(1);
            
            // Store dimensions for later reference
            const chibiWidth = this.chibiImage.width * scale;
            const chibiHeight = this.chibiImage.height * scale;
            
            // Track total pixels of the chibi image for percentage calculation
            this.totalImagePixels = chibiWidth * chibiHeight;
            this.revealedPixels = 0;
            
            console.log("Background created with chibi image:", 
                        imageWidth, "x", imageHeight,
                        "scaled to:", chibiWidth, "x", chibiHeight);
        } catch (error) {
            console.error("Error in createBackground:", error);
        }
    }

    createIceBlocks() {
        this.iceBlocks = [];
        this.blueVeils = []; // Array to store individual blue veil rectangles
        const blockSize = 60; // Larger block size for higher resolution
        
        // Create a container for ice blocks with depth above chibi but below UI
        const blocksContainer = this.add.container(0, 0);
        blocksContainer.setDepth(2);
        
        // Get the chibi image bounds with scaling applied
        const maxWidth = 800; // Same as in createBackground
        const scale = 1; // Since we designed it at this size, no scaling needed
        const imageWidth = this.chibiImage.width * scale; 
        const imageHeight = this.chibiImage.height * scale;
        
        // Calculate the image boundaries
        const imageX = 1920/2 - imageWidth / 2;
        const imageY = 1080/2 - imageHeight / 2;
        
        // Calculate grid dimensions
        const cols = Math.ceil(imageWidth / blockSize);
        const rows = Math.ceil(imageHeight / blockSize);
        
        console.log(`Creating ice blocks grid: ${cols}x${rows} over image area ${imageWidth}x${imageHeight}`);
        
        // Create a slightly irregular pattern for more interesting gameplay
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Skip some blocks randomly for a more natural look
                if (Math.random() < 0.2) continue;
                
                const x = imageX + col * blockSize + blockSize / 2;
                const y = imageY + row * blockSize + blockSize / 2;
                
                // Create ice block
                const block = this.matter.add.image(x, y, 'iceBlock', null, {
                    isStatic: true,
                    friction: 0.01,
                    restitution: 0.3
                });
                
                // Scale the blocks to match the new size
                block.setScale(blockSize / 40); // Original ice block is 40x40, scale up
                
                // Set a slight random rotation for some blocks
                if (Math.random() < 0.3) {
                    block.setRotation(Math.random() * 0.2 - 0.1);
                }
                
                // Set blocks to appear above the chibi image but below UI
                block.setDepth(4); // Higher than chibi (1) and blocksContainer (2) and blue veils (3)
                block.setAlpha(1.0);
                block.isActive = true;
                
                // Create a blue veil rectangle for this block
                const blueVeil = this.add.rectangle(
                    x, 
                    y, 
                    blockSize, 
                    blockSize, 
                    0xaaddff, // Lighter, more ice-like blue color
                    0.85 // Much less transparent (higher opacity)
                );
                
                // Add an ice-like texture effect with highlights
                blueVeil.setStrokeStyle(2, 0xffffff, 0.3); // Add a subtle white border
                
                // Add a slight random rotation for a more natural ice look
                if (Math.random() < 0.5) {
                    blueVeil.setRotation(Math.random() * 0.2 - 0.1);
                }
                
                // Set the blue veil to appear at the same depth as blocks
                blueVeil.setDepth(3); // Blue veils below blocks but above chibi
                
                // Store reference to its corresponding blue veil in the block
                block.blueVeil = blueVeil;
                
                this.iceBlocks.push(block);
                this.blueVeils.push(blueVeil);
                
                this.createIceTextureEffect(blueVeil);
            }
        }
        
        // Ensure chibi image remains fully opaque after adding blue veils
        this.chibiImage.setAlpha(1);
        
        console.log(`Created ${this.iceBlocks.length} ice blocks with blue veils`);
    }

    createIceTextureEffect(veil) {
        // Add ice-like visual effects to make the veil look more like ice
        
        // Random size variations for the ice blocks (up to 10% variation)
        const sizeVariation = 0.9 + Math.random() * 0.2;
        veil.setScale(sizeVariation);
        
        // Add random inner lines/cracks simulation with slight opacity changes
        // This is simulated by making some veils slightly more transparent in certain parts
        if (Math.random() < 0.3) {
            // Around 30% of blocks will have a slightly different opacity
            veil.setAlpha(veil.alpha * (0.9 + Math.random() * 0.15));
        }
        
        // Apply a random slight tint variation to some blocks for more natural appearance
        if (Math.random() < 0.4) {
            // Apply slightly different tints to some blocks
            const tintOptions = [
                0xc8e0ff, // Very light blue 
                0xa0cfff, // Light blue
                0xb5e0ff, // Pale blue
                0xd0f0ff  // Ice blue
            ];
            const selectedTint = tintOptions[Math.floor(Math.random() * tintOptions.length)];
            veil.setFillStyle(selectedTint, veil.alpha);
        }
        
        // Create a shimmer/highlight effect for some blocks
        if (Math.random() < 0.2) { // Apply to about 20% of blocks
            // Add a highlight reflective effect that slowly moves
            const highlight = this.add.rectangle(
                veil.x,
                veil.y,
                veil.width * 0.8,
                veil.height * 0.2,
                0xffffff,
                0.25
            );
            highlight.setDepth(veil.depth + 0.1); // Just above the veil
            
            // Store a reference to the highlight in the veil
            veil.highlight = highlight;
            
            // Create shimmer animation
            this.tweens.add({
                targets: highlight,
                y: veil.y + veil.height/2,
                alpha: { from: 0.3, to: 0 },
                duration: 3000 + Math.random() * 2000,
                repeat: -1,
                yoyo: false,
                delay: Math.random() * 2000, // Random delay for each block
                onRepeat: () => {
                    highlight.y = veil.y - veil.height/2; // Reset position to top
                    highlight.alpha = 0.3;                // Reset opacity
                }
            });
        }
    }

    createSlingshot() {
        try {
            this.slingshot = this.add.image(this.SLINGSHOT_X, this.SLINGSHOT_Y, 'slingshot');
            this.slingshot.setOrigin(0.5, 0.9); // Adjust origin to bottom center
            this.slingshot.setDepth(10); // Above all game elements but below UI
            
            // Add elastic line for slingshot
            this.elasticLine = this.add.graphics();
            this.elasticLine.setDepth(11); // Above slingshot
        } catch (error) {
            console.error("Error in createSlingshot:", error);
        }
    }

    createBomb() {
        console.log("Creating bomb");
        
        // Create inactive bomb at slingshot position - simple settings
        this.bomb = this.matter.add.image(this.SLINGSHOT_X, this.SLINGSHOT_Y - 20, 'bomb', null);
        
        this.bomb.setCircle();
        this.bomb.setStatic(true);
        this.bomb.setVisible(true);
        this.bomb.setDepth(12); // Above slingshot and elastic line
        
        if (this.debugMode) {
            console.log("Bomb created:", this.bomb);
        }
    }

    setupInput() {
        try {
            // Pointer down event
            this.input.on('pointerdown', (pointer) => {
                try {
                    if (this.shotsRemaining <= 0 || !this.bomb || !this.bomb.visible) return;
                    
                    // Check if click is near the bomb
                    const distance = Phaser.Math.Distance.Between(
                        pointer.x, pointer.y, 
                        this.bomb.x, this.bomb.y
                    );
                    
                    if (distance < 50) {
                        this.isAiming = true;
                        
                        // Keep the bomb static during aiming - we'll manually position it
                        this.bomb.setStatic(true);
                        
                        if (this.debugMode && this.debugText) {
                            console.log('Aiming started');
                            this.debugText.setText(`Aiming started at ${pointer.x},${pointer.y}`);
                        }
                    }
                } catch (error) {
                    console.error("Error in pointerdown handler:", error);
                }
            });
            
            // Pointer move event
            this.input.on('pointermove', (pointer) => {
                try {
                    if (!this.isAiming || !this.bomb) return;
                    
                    // Calculate angle and distance from slingshot
                    const dx = this.SLINGSHOT_X - pointer.x;
                    const dy = this.SLINGSHOT_Y - 30 - pointer.y; // Update to match bomb's initial position
                    const distance = Math.min(
                        this.MAX_DRAG_DISTANCE,
                        Math.sqrt(dx * dx + dy * dy)
                    );
                    
                    // Calculate angle
                    const angle = Math.atan2(dy, dx);
                    
                    // Calculate bomb position
                    const bombX = this.SLINGSHOT_X - distance * Math.cos(angle);
                    const bombY = (this.SLINGSHOT_Y - 30) - distance * Math.sin(angle);
                    
                    // Update bomb position - keep it static while dragging
                    this.bomb.setPosition(bombX, bombY);
                    
                    if (this.debugMode && this.debugText) {
                        this.debugText.setText(`Aiming: position=${bombX.toFixed(1)},${bombY.toFixed(1)} | dx=${dx.toFixed(1)},dy=${dy.toFixed(1)}`);
                    }
                    
                    // Draw elastic line
                    if (this.elasticLine) {
                        this.elasticLine.clear();
                        this.elasticLine.lineStyle(3, 0xFF0000);
                        this.elasticLine.beginPath();
                        this.elasticLine.moveTo(this.SLINGSHOT_X - 10, this.SLINGSHOT_Y - 30);
                        this.elasticLine.lineTo(bombX, bombY);
                        this.elasticLine.moveTo(this.SLINGSHOT_X + 10, this.SLINGSHOT_Y - 30);
                        this.elasticLine.lineTo(bombX, bombY);
                        this.elasticLine.stroke();
                    }
                    
                    // Calculate velocity based on drag distance and angle
                    const forceX = dx * this.SHOT_POWER * 0.01;
                    const forceY = dy * this.SHOT_POWER * 0.01;
                    
                    // Draw trajectory prediction
                    this.drawTrajectory(bombX, bombY, forceX, forceY);
                } catch (error) {
                    console.error("Error in pointermove handler:", error);
                }
            });
            
            // Pointer up event
            this.input.on('pointerup', () => {
                try {
                    if (!this.isAiming || !this.bomb) return;
                    
                    // Calculate force based on distance from slingshot
                    const dx = this.SLINGSHOT_X - this.bomb.x;
                    const dy = (this.SLINGSHOT_Y - 30) - this.bomb.y;
                    
                    // Scale by shot power
                    const forceX = dx * this.SHOT_POWER * 0.01;
                    const forceY = dy * this.SHOT_POWER * 0.01;
                    
                    if (this.debugMode && this.debugText) {
                        console.log('Launching bomb with force:', forceX, forceY);
                        this.debugText.setText(`Launch: force=${forceX.toFixed(3)},${forceY.toFixed(3)}`);
                    }
                    
                    // Clear elastic line
                    if (this.elasticLine) this.elasticLine.clear();
                    
                    // Clear trajectory
                    if (this.trajectoryGraphics) this.trajectoryGraphics.clear();
                    
                    try {
                        // Store current bomb position and type
                        const bombX = this.bomb.x;
                        const bombY = this.bomb.y;
                        const bombType = this.currentBombType;
                        
                        // Remove the old static bomb
                        this.bomb.destroy();
                        
                        // Create a new dynamic bomb at the same position
                        this.createDynamicBomb(bombX, bombY, bombType, forceX, forceY);
                        
                        // Decrement bomb count
                        this.decrementBombCount(bombType);
                        
                        // Decrement shots
                        this.shotsRemaining--;
                        this.events.emit('updateShots', this.shotsRemaining);
                        
                        // Reset aiming flag
                        this.isAiming = false;
                        
                        // Set timeout to create a new bomb if shots remain
                        this.time.delayedCall(3000, () => {
                            if (this.shotsRemaining > 0) {
                                if (!this.bomb) {
                                    this.resetBomb();
                                }
                            } else {
                                // Check level completion or game over if no shots remain
                                this.checkLevelCompletion();
                            }
                        });
                    }
                    catch (error) {
                        console.error("Error launching bomb:", error);
                        if (this.debugText) this.debugText.setText(`ERROR: ${error.message}`);
                        
                        // Try to recover
                        this.resetBomb();
                    }
                } catch (error) {
                    console.error("Error in pointerup handler:", error);
                }
            });
        } catch (error) {
            console.error("Error in setupInput:", error);
        }
    }

    decrementBombCount(bombType) {
        // Decrement the counter for the specific bomb type
        if (this.bombsRemaining[bombType] > 0) {
            this.bombsRemaining[bombType]--;
            
            // Update the counter display
            if (this.bombCounters[bombType]) {
                this.bombCounters[bombType].setText(`x${this.bombsRemaining[bombType]}`);
            }
            
            // If we run out of this bomb type, switch to another available one
            if (this.bombsRemaining[bombType] === 0) {
                // Find another bomb type that has remaining bombs
                const availableBombType = Object.keys(this.bombsRemaining).find(type => 
                    this.bombsRemaining[type] > 0
                );
                
                if (availableBombType) {
                    this.selectBombType(availableBombType);
                }
            }
        }
    }

    setupCollisions() {
        try {
            // Set up collision between bomb and ice blocks
            this.matter.world.on('collisionstart', (event) => {
                if (!event || !event.pairs) {
                    console.error("Invalid collision event:", event);
                    return;
                }
                
                const pairs = event.pairs;
                let hasExploded = false;
                let bombStuck = false;
                
                for (let i = 0; i < pairs.length; i++) {
                    try {
                        const bodyA = pairs[i].bodyA;
                        const bodyB = pairs[i].bodyB;
                        
                        if (!bodyA || !bodyB) continue;
                        
                        // Find the bomb and block objects from the collision
                        let bombBody, blockBody;
                        
                        if (bodyA.gameObject === this.bomb) {
                            bombBody = bodyA;
                            blockBody = bodyB;
                        } else if (bodyB.gameObject === this.bomb) {
                            bombBody = bodyB;
                            blockBody = bodyA;
                        } else {
                            // Neither body is the bomb, so skip this pair
                            continue;
                        }
                        
                        // Make sure blockBody has a gameObject
                        if (!blockBody.gameObject) {
                            continue;
                        }
                        
                        // Check if the other object is an ice block
                        const block = blockBody.gameObject;
                        
                        // Get the bomb type
                        const bombType = this.bomb ? (this.bomb.bombType || this.BOMB_TYPES.BLAST) : this.BOMB_TYPES.BLAST;
                        
                        // Handle different bomb types
                        if (!hasExploded && !bombStuck) {
                            switch(bombType) {
                                case this.BOMB_TYPES.BLAST:
                                    // Standard explosion with radius damage
                                    this.handleBlastBomb(this.bomb.x, this.bomb.y);
                                    hasExploded = true;
                                    break;
                                    
                                case this.BOMB_TYPES.PIERCER:
                                    // Creates a line of destruction in its direction
                                    this.handlePiercerBomb(this.bomb.x, this.bomb.y);
                                    hasExploded = true;
                                    break;
                                    
                                case this.BOMB_TYPES.CLUSTER:
                                    // Creates multiple smaller explosions
                                    this.handleClusterBomb(this.bomb.x, this.bomb.y);
                                    hasExploded = true;
                                    break;
                                    
                                case this.BOMB_TYPES.STICKY:
                                    // Sticks to a block and explodes after delay
                                    if (block && block.isActive && this.iceBlocks.includes(block)) {
                                        // Store bomb for visual retention
                                        const stickyBombVisual = this.bomb;
                                        // Handle sticky behavior
                                        this.handleStickyBomb(this.bomb.x, this.bomb.y, block);
                                        bombStuck = true;
                                    } else {
                                        // If not sticking to a valid target, just explode
                                        this.handleBlastBomb(this.bomb.x, this.bomb.y);
                                        hasExploded = true;
                                    }
                                    break;
                                    
                                case this.BOMB_TYPES.SHATTERER:
                                    // Creates a powerful blast that's effective against tough blocks
                                    this.handleShattererBomb(this.bomb.x, this.bomb.y);
                                    hasExploded = true;
                                    break;
                            }
                            
                            // Destroy the bomb if it exploded (not if it's sticky and stuck)
                            if (hasExploded && this.bomb) {
                                this.bomb.destroy();
                                this.bomb = null;
                            }
                        }
                    } catch (error) {
                        console.error("Error processing collision pair:", error);
                    }
                }
            });
        } catch (error) {
            console.error("Error in setupCollisions:", error);
        }
    }
    
    handleBlastBomb(x, y) {
        // Standard explosion behavior - radius effect
        this.createExplosion(x, y);
        this.destroyBlocksInRadius(x, y, 150);
        
        // Check if any sticky bombs are in range and trigger them
        this.triggerStickyBomb(x, y, 150);
    }
    
    handlePiercerBomb(x, y) {
        // Piercer bomb creates a line of destruction in its travel direction
        const velocity = this.bomb.body.velocity;
        
        // Normalize velocity to get direction
        const magnitude = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        const dirX = magnitude > 0 ? velocity.x / magnitude : 0;
        const dirY = magnitude > 0 ? velocity.y / magnitude : 1;
        
        // Create a narrower but longer explosion effect
        const lineLength = 300;
        
        // Create visual effect - smaller explosion
        this.createExplosion(x, y);
        
        // Create piercing line particles
        const particles = this.add.particles('particle');
        const emitter = particles.createEmitter({
            speed: { min: 20, max: 50 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 500,
            blendMode: 'ADD',
            tint: 0x77aaff // Blue tint to match the bomb
        });
        
        // Emit along the trajectory line
        for (let i = 0; i < lineLength; i += 10) {
            const pointX = x + dirX * i;
            const pointY = y + dirY * i;
            emitter.explode(3, pointX, pointY);
            
            // Destroy blocks along the line
            this.destroyBlocksInRadius(pointX, pointY, 30);
            
            // Check for sticky bombs along the line
            if (i % 50 === 0) { // Check every 50 pixels to avoid too many calculations
                this.triggerStickyBomb(pointX, pointY, 60);
            }
        }
        
        // Clean up particles
        this.time.delayedCall(500, () => {
            particles.destroy();
        });
    }
    
    handleClusterBomb(x, y) {
        // Cluster bomb creates multiple smaller explosions
        
        // Create main explosion (smaller than blast bomb)
        this.createExplosion(x, y);
        this.destroyBlocksInRadius(x, y, 100);
        
        // Check for sticky bombs in primary explosion
        this.triggerStickyBomb(x, y, 100);
        
        // Create 3-5 smaller explosions around the main one
        const numClusters = Phaser.Math.Between(3, 5);
        const clusterRadius = 150;
        
        for (let i = 0; i < numClusters; i++) {
            // Calculate random positions around the main explosion
            const angle = Math.random() * Math.PI * 2;
            const distance = 70 + Math.random() * clusterRadius;
            const clusterX = x + Math.cos(angle) * distance;
            const clusterY = y + Math.sin(angle) * distance;
            
            // Add delay based on distance from center
            const delay = distance * 2;
            
            // Create delayed cluster explosion
            this.time.delayedCall(delay, () => {
                // Create mini explosion
                this.createMiniExplosion(clusterX, clusterY);
                // Destroy blocks in smaller radius
                this.destroyBlocksInRadius(clusterX, clusterY, 70);
                // Check for sticky bombs in mini explosion
                this.triggerStickyBomb(clusterX, clusterY, 70);
            });
        }
    }
    
    createMiniExplosion(x, y) {
        // Create smaller visual explosion effect
        const explosion = this.add.circle(x, y, 40, 0xffdd44, 0.7);
        explosion.setDepth(6); // Same depth as regular explosions, above all game elements
        
        // Animate the explosion
        this.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 1.5,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                explosion.destroy();
            }
        });
        
        // Add some particles for more effect
        const particles = this.add.particles('mini_particle');
        particles.setDepth(6); // Match explosion depth
        
        const emitter = particles.createEmitter({
            speed: { min: 30, max: 150 },
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 600,
            blendMode: 'ADD'
        });
        
        // Emit particles at explosion point
        emitter.explode(20, x, y);
        
        // Destroy the particle system after emissions complete
        this.time.delayedCall(700, () => {
            particles.destroy();
        });
        
        // Add a small camera shake
        this.cameras.main.shake(150, 0.005);
    }

    destroyBlocksInRadius(x, y, radius) {
        if (!this.iceBlocks) return;
        
        // Create a list to track blocks to be destroyed
        const blocksToDestroy = [];
        
        // Check distance of each block from explosion center
        this.iceBlocks.forEach(block => {
            if (block && block.isActive) {
                const distance = Phaser.Math.Distance.Between(x, y, block.x, block.y);
                
                if (distance < radius) {
                    // Calculate delay based on distance (closer blocks explode faster)
                    const delay = (distance / radius) * 100;
                    blocksToDestroy.push({ block, delay });
                }
            }
        });
        
        // Process block destruction with delays
        blocksToDestroy.forEach(({ block, delay }) => {
            this.time.delayedCall(delay, () => {
                if (block && block.isActive) {
                    this.destroyIceBlock(block);
                }
            });
        });
        
        // Clean up the iceBlocks array after a delay
        this.time.delayedCall(1000, () => {
            this.cleanupIceBlocksArray();
        });
    }
    
    cleanupIceBlocksArray() {
        if (!this.iceBlocks) return;
        
        // Filter out inactive blocks
        this.iceBlocks = this.iceBlocks.filter(block => {
            return block && block.isActive;
        });
        
        if (this.debugMode) {
            console.log(`Cleaned up ice blocks array. Remaining blocks: ${this.iceBlocks.length}`);
        }
    }

    destroyIceBlock(block) {
        // Mark block as inactive
        block.isActive = false;
        
        // Create shatter effect
        this.createBlockShatter(block);
        
        // Remove the physics body from the world
        if (block.body) {
            this.matter.world.remove(block.body);
        }
        
        // Hide the original block
        block.setVisible(false);
        
        // Make the blue veil slowly dissipate instead of removing immediately
        if (block.blueVeil) {
            // Also fade out any highlight associated with this veil
            if (block.blueVeil.highlight) {
                this.tweens.add({
                    targets: block.blueVeil.highlight,
                    alpha: 0,
                    duration: 8000, // 8 seconds, matching the veil
                    ease: 'Linear',
                    onComplete: () => {
                        // Remove the highlight when the animation completes
                        if (block.blueVeil.highlight && block.blueVeil.highlight.scene) {
                            block.blueVeil.highlight.destroy();
                        }
                    }
                });
            }
            
            // Start a tween to fade out the blue veil over 8 seconds
            this.tweens.add({
                targets: block.blueVeil,
                alpha: 0,
                duration: 8000, // 8 seconds
                ease: 'Linear',
                onComplete: () => {
                    // Remove the veil when the animation completes
                    if (block.blueVeil && block.blueVeil.scene) {
                        block.blueVeil.destroy();
                    }
                }
            });
        }
        
        // Ensure chibi image remains fully opaque
        this.chibiImage.setAlpha(1);
        
        // Update revealed percentage
        const blockPixels = block.displayWidth * block.displayHeight;
        const previousPercentage = this.revealPercentage;
        this.revealedPixels += blockPixels;
        this.revealPercentage = Math.min(100, Math.floor((this.revealedPixels / this.totalImagePixels) * 100));
        
        // Emit update to UI with more detailed information
        this.events.emit('updatePercentage', this.revealPercentage);
        
        // When percentage reaches key milestones, make the image clearer
        if ((previousPercentage < 20 && this.revealPercentage >= 20) ||
            (previousPercentage < 50 && this.revealPercentage >= 50) ||
            (previousPercentage < 80 && this.revealPercentage >= 80)) {
            // Add a little flash effect to highlight the milestone
            this.cameras.main.flash(300, 255, 255, 255, 0.3);
        }
        
        // Remove the completion veil when we reach 80%
        if (previousPercentage < 80 && this.revealPercentage >= 80) {
            this.removeCompletionVeil();
        }
        
        // Check if level is complete
        if (this.revealPercentage >= this.targetPercentage) {
            this.checkLevelCompletion();
        }
    }
    
    createBlockShatter(block) {
        // Create 4-8 smaller pieces at the block's position
        const numPieces = Phaser.Math.Between(4, 8);
        const blockSize = block.displayWidth / 2; // Pieces are half the size
        
        for (let i = 0; i < numPieces; i++) {
            // Randomize position slightly around the original block
            const offsetX = Phaser.Math.Between(-10, 10);
            const offsetY = Phaser.Math.Between(-10, 10);
            
            // Create a smaller piece
            const piece = this.matter.add.image(
                block.x + offsetX,
                block.y + offsetY,
                'iceBlock',
                null,
                {
                    restitution: 0.8,
                    friction: 0.01,
                    density: 0.001
                }
            );
            
            // Scale down the piece
            piece.setScale(0.3 + Math.random() * 0.2); // Random size between 0.3 and 0.5 of original
            
            // Make sure shattered pieces appear above the chibi image
            piece.setDepth(5); // Higher than blocks (4) and blue veils (3), but lower than UI (100)
            
            // Apply random rotation
            piece.setRotation(Math.random() * Math.PI * 2);
            
            // Apply random velocity
            const velX = Phaser.Math.Between(-5, 5);
            const velY = Phaser.Math.Between(-5, 2);
            piece.setVelocity(velX, velY);
            
            // Make pieces semi-transparent
            piece.setAlpha(0.7);
            
            // Destroy the piece after delay
            this.time.delayedCall(1500 + Math.random() * 1000, () => {
                if (piece && piece.scene) {
                    piece.destroy();
                }
            });
        }
    }
    
    createExplosion(x, y) {
        // Create visual explosion effect
        const explosion = this.add.circle(x, y, 80, 0xff5500, 0.8);
        explosion.setDepth(6); // Higher than ice blocks (4), blue veils (3), and shattered pieces (5)
        
        // Animate the explosion
        this.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 2,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                explosion.destroy();
            }
        });
        
        // Add some particles for more effect
        const particles = this.add.particles('particle');
        particles.setDepth(6); // Same depth as explosion
        
        const emitter = particles.createEmitter({
            speed: { min: 50, max: 200 },
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 800,
            blendMode: 'ADD'
        });
        
        // Emit particles at explosion point
        emitter.explode(30, x, y);
        
        // Create a flash effect
        const flash = this.add.circle(x, y, 100, 0xffffff, 1);
        flash.setDepth(6); // Same depth as explosion
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                flash.destroy();
            }
        });
        
        // Destroy the particle system after emissions complete
        this.time.delayedCall(1000, () => {
            particles.destroy();
        });
        
        // Add a camera shake effect
        this.cameras.main.shake(300, 0.01);
        
        // Add explosion sound if available
        if (this.sound && this.sound.add) {
            try {
                const explosionSound = this.sound.add('explosion');
                explosionSound.play({ volume: 0.5 });
            } catch (e) {
                console.log("Sound not available:", e);
            }
        }
    }

    checkLevelCompletion() {
        if (this.isLevelComplete) return;
        
        if (this.revealPercentage >= this.targetPercentage) {
            console.log("Level complete! Playing victory music...");
            this.isLevelComplete = true;
            
            // Clear any trajectory display
            this.clearTrajectory();
            
            // Play victory music with enhanced error handling
            if (this.audioManager) {
                try {
                    this.audioManager.playVictoryMusic();
                } catch (error) {
                    console.error("Error during victory music playback:", error);
                }
            } else {
                console.error("Audio manager not available for victory music");
            }
            
            // Set full opacity on the chibi image
            this.chibiImage.setAlpha(1);
            
            // Remove the completion veil if it hasn't been removed yet
            if (!this.completionVeilRemoved) {
                this.removeCompletionVeil();
            }
            
            // Clear all remaining blue veils
            if (this.blueVeils) {
                this.blueVeils.forEach(veil => {
                    if (veil && veil.scene) {
                        // Handle any highlight effects
                        if (veil.highlight && veil.highlight.scene) {
                            this.tweens.add({
                                targets: veil.highlight,
                                alpha: 0,
                                duration: 8000, // 8 seconds
                                ease: 'Linear',
                                onComplete: () => {
                                    if (veil.highlight && veil.highlight.scene) {
                                        veil.highlight.destroy();
                                    }
                                }
                            });
                        }
                        
                        // Instead of destroying immediately, fade them out
                        this.tweens.add({
                            targets: veil,
                            alpha: 0,
                            duration: 8000, // 8 seconds
                            ease: 'Linear',
                            onComplete: () => {
                                if (veil && veil.scene) {
                                    veil.destroy();
                                }
                            }
                        });
                    }
                });
                // Create a new array for the next level's veils
                this.blueVeils = [];
            }
            
            // Create a celebratory effect
            this.cameras.main.flash(500, 255, 255, 255, 0.7);
            
            // Add some particles for celebration
            const particles = this.add.particles('particle');
            particles.setDepth(6); // Same depth as explosion effects, above all game elements
            const emitter = particles.createEmitter({
                speed: { min: 100, max: 300 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.5, end: 0 },
                blendMode: 'ADD',
                lifespan: 2000,
                tint: [0xffff00, 0xff00ff, 0x00ffff, 0xff0000],
                on: false
            });
            
            // Emit particles around the chibi image
            emitter.explode(100, this.chibiImage.x, this.chibiImage.y);
            
            // Create victory UI elements with high depth
            const victoryText = this.add.text(
                this.cameras.main.centerX,
                100,
                'Level Complete!',
                {
                    fontSize: '48px',
                    fontFamily: 'Arial',
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 6,
                    shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 5, fill: true }
                }
            ).setOrigin(0.5, 0.5).setDepth(this.UI_DEPTH);
            
            const percentText = this.add.text(
                this.cameras.main.centerX,
                200,
                `${this.revealPercentage}% Revealed!`,
                {
                    fontSize: '32px',
                    fontFamily: 'Arial',
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 4
                }
            ).setOrigin(0.5, 0.5).setDepth(this.UI_DEPTH);
            
            // After a delay, show restart button
            this.time.delayedCall(3000, () => {
                const restartButton = this.add.text(
                    this.cameras.main.centerX,
                    this.cameras.main.height - 100,
                    'Play Again',
                    {
                        fontSize: '36px',
                        fontFamily: 'Arial',
                        color: '#ffffff',
                        backgroundColor: '#1a6dd5',
                        padding: { x: 20, y: 10 }
                    }
                ).setOrigin(0.5, 0.5)
                .setDepth(this.UI_DEPTH)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.scene.restart());
                
                restartButton.on('pointerover', () => restartButton.setStyle({ color: '#ffff00' }));
                restartButton.on('pointerout', () => restartButton.setStyle({ color: '#ffffff' }));
            });
        } else if (this.shotsRemaining <= 0 && !this.isGameOver) {
            // If no shots remain and target percentage not reached, trigger game over
            this.checkGameOver();
        }
    }

    checkGameOver() {
        if (this.isGameOver || this.isLevelComplete) return;
        
        console.log("Game Over! No shots remaining.");
        this.isGameOver = true;
        
        // Clear any trajectory display
        this.clearTrajectory();
        
        // Play game over sound if available
        if (this.audioManager) {
            try {
                this.audioManager.playGameOverSound();
            } catch (error) {
                console.error("Error during game over sound playback:", error);
            }
        }
        
        // Apply a red flash to indicate failure
        this.cameras.main.flash(500, 255, 0, 0, 0.7);
        
        // Fade out any remaining blue veils
        if (this.blueVeils) {
            this.blueVeils.forEach(veil => {
                if (veil && veil.scene) {
                    // Handle any highlight effects
                    if (veil.highlight && veil.highlight.scene) {
                        this.tweens.add({
                            targets: veil.highlight,
                            alpha: 0,
                            duration: 8000, // 8 seconds
                            ease: 'Linear',
                            onComplete: () => {
                                if (veil.highlight && veil.highlight.scene) {
                                    veil.highlight.destroy();
                                }
                            }
                        });
                    }
                    
                    // Instead of destroying immediately, fade them out
                    this.tweens.add({
                        targets: veil,
                        alpha: 0,
                        duration: 8000, // 8 seconds
                        ease: 'Linear',
                        onComplete: () => {
                            if (veil && veil.scene) {
                                veil.destroy();
                            }
                        }
                    });
                }
            });
        }
        
        // Create game over UI elements with high depth
        const gameOverText = this.add.text(
            this.cameras.main.centerX,
            100,
            'Game Over!',
            {
                fontSize: '48px',
                fontFamily: 'Arial',
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 6,
                shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 5, fill: true }
            }
        ).setOrigin(0.5, 0.5).setDepth(this.UI_DEPTH);
        
        const resultText = this.add.text(
            this.cameras.main.centerX,
            200,
            `You revealed ${this.revealPercentage}% of ${this.targetPercentage}% needed`,
            {
                fontSize: '32px',
                fontFamily: 'Arial',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5, 0.5).setDepth(this.UI_DEPTH);
        
        // After a delay, show restart button
        this.time.delayedCall(2000, () => {
            const restartButton = this.add.text(
                this.cameras.main.centerX,
                this.cameras.main.height - 100,
                'Try Again',
                {
                    fontSize: '36px',
                    fontFamily: 'Arial',
                    color: '#ffffff',
                    backgroundColor: '#d51a1a',
                    padding: { x: 20, y: 10 }
                }
            ).setOrigin(0.5, 0.5)
            .setDepth(this.UI_DEPTH)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.restart());
            
            restartButton.on('pointerover', () => restartButton.setStyle({ color: '#ffff00' }));
            restartButton.on('pointerout', () => restartButton.setStyle({ color: '#ffffff' }));
        });
    }

    resetBomb() {
        // Remove any existing bomb
        if (this.bomb) {
            console.log("Destroying existing bomb before creating a new one");
            this.bomb.destroy();
        }
        
        // Clear any trajectory graphics
        if (this.trajectoryGraphics) {
            this.trajectoryGraphics.clear();
        }
        
        console.log("Creating new bomb. Current type:", this.currentBombType);
        
        // Create a new bomb at the slingshot position instead of the corner
        this.bomb = this.matter.add.image(this.SLINGSHOT_X, this.SLINGSHOT_Y - 20, this.currentBombType);
        this.bomb.setDepth(12);
        
        // Set it to be static until the user starts dragging it
        this.bomb.setStatic(true);
        
        // Make it draggable
        this.bomb.setInteractive();
        this.input.setDraggable(this.bomb);
        
        // Visual indicator for bomb selection
        if (this.bombHighlight) {
            this.bombHighlight.destroy();
        }
        
        this.bombHighlight = this.add.circle(this.SLINGSHOT_X, this.SLINGSHOT_Y - 20, 32, 0xffff00, 0.3);
        this.bombHighlight.setDepth(11);
        
        // Update the UI to show the current bomb type and shots remaining
        this.updateBombUI();
        
        // Update debug
        if (this.debugText) {
            this.debugText.setText(`Bomb: ${this.currentBombType} | Shots: ${this.shotsRemaining} | Bomb exists: ${this.bomb ? 'yes' : 'no'}`);
        }
        
        console.log("Bomb reset complete, new bomb created with type:", this.currentBombType);
    }
    
    updateUI() {
        try {
            if (this.ui && typeof this.ui.setTexts === 'function') {
                this.ui.setTexts(`Bombs: ${this.shotsRemaining}`, `Score: ${this.score}`);
            }
        } catch (error) {
            console.error("Error updating UI:", error);
        }
    }
    
    createDynamicBomb(x, y, bombType, forceX, forceY) {
        // Set bomb properties based on type
        let bombProperties = {
            restitution: 0.7,
            friction: 0.05,
            density: 0.002,
            frictionAir: 0.001
        };
        
        // Adjust properties for special bomb types
        switch(bombType) {
            case this.BOMB_TYPES.PIERCER:
                // Piercer has lower friction and higher density
                bombProperties.friction = 0.01;
                bombProperties.frictionAir = 0.0005;
                bombProperties.density = 0.003;
                break;
                
            case this.BOMB_TYPES.CLUSTER:
                // Cluster is a bit lighter
                bombProperties.density = 0.0015;
                break;
        }
        
        // Create the bomb with appropriate properties - use bombType directly as it already contains the correct texture name
        this.bomb = this.matter.add.image(x, y, bombType, null, bombProperties);
        this.bomb.setCircle();
        this.bomb.bombType = bombType; // Store the bomb type for later use
        this.bomb.setDepth(12); // Same depth as static bomb
        
        // Apply impulse (instant force)
        this.matter.body.applyForce(this.bomb.body, 
            { x: x, y: y }, 
            { x: forceX, y: forceY });
        
        // Fallback: try direct velocity set if needed
        if (this.debugMode) {
            this.time.delayedCall(100, () => {
                if (this.bomb && this.bomb.body && 
                    Math.abs(this.bomb.body.velocity.x) < 0.1 && 
                    Math.abs(this.bomb.body.velocity.y) < 0.1) {
                    console.log("Force didn't work, trying velocity directly");
                    const dx = this.SLINGSHOT_X - x;
                    const dy = (this.SLINGSHOT_Y - 30) - y;
                    this.bomb.setVelocity(dx * 0.2, dy * 0.2);
                }
            });
        }
    }

    createTargets() {
        try {
            // Create ice blocks that will serve as targets to break
            this.createIceBlocks();
            
            // Setup collision detection for the targets
            this.setupCollisions();
            
            console.log("Targets created successfully");
        } catch (error) {
            console.error("Error in createTargets:", error);
        }
    }
    
    setupInputHandlers() {
        try {
            // Setup user input for the slingshot and bomb
            this.setupInput();
            
            console.log("Input handlers setup successfully");
        } catch (error) {
            console.error("Error in setupInputHandlers:", error);
        }
    }

    createUI() {
        try {
            this.initializeUI();
            
            // Add bomb selector UI
            this.createBombSelector();
        } catch (error) {
            console.error("Error in createUI:", error);
        }
    }
    
    initializeUI() {
        try {
            // Create UI component with highest depth
            this.ui = new UI(this);
            // UI class will set its own depth in the create method
            this.ui.create();
            this.updateUI();
            console.log("UI created successfully");
        } catch (error) {
            console.error("Error initializing UI:", error);
        }
    }
    
    resetLevel() {
        // Stop all music
        if (this.audioManager) {
            this.audioManager.stopAll();
        }
        
        this.shotsRemaining = this.MAX_SHOTS;
        this.revealPercentage = 0;
        this.revealedPixels = 0;
        
        // Reset bomb counts
        this.bombsRemaining = {
            [this.BOMB_TYPES.BLAST]: 10,
            [this.BOMB_TYPES.PIERCER]: 7,
            [this.BOMB_TYPES.CLUSTER]: 5,
            [this.BOMB_TYPES.STICKY]: 3,
            [this.BOMB_TYPES.SHATTERER]: 2
        };
        
        // Update bomb counter displays
        if (this.bombCounters) {
            Object.keys(this.bombCounters).forEach(bombType => {
                this.bombCounters[bombType].setText(`x${this.bombsRemaining[bombType]}`);
            });
        }
        
        // Restart background music
        this.time.delayedCall(500, () => {
            if (this.audioManager) {
                this.audioManager.playBackgroundMusic();
            }
        });
        
        // Clear existing blue veils
        if (this.blueVeils) {
            this.blueVeils.forEach(veil => {
                if (veil && veil.scene) {
                    // Handle any highlight effects
                    if (veil.highlight && veil.highlight.scene) {
                        this.tweens.add({
                            targets: veil.highlight,
                            alpha: 0,
                            duration: 8000, // 8 seconds
                            ease: 'Linear',
                            onComplete: () => {
                                if (veil.highlight && veil.highlight.scene) {
                                    veil.highlight.destroy();
                                }
                            }
                        });
                    }
                    
                    // Instead of destroying immediately, fade them out
                    this.tweens.add({
                        targets: veil,
                        alpha: 0,
                        duration: 8000, // 8 seconds
                        ease: 'Linear',
                        onComplete: () => {
                            if (veil && veil.scene) {
                                veil.destroy();
                            }
                        }
                    });
                }
            });
            // Create a new array for the next level's veils
            this.blueVeils = [];
        }
        
        // Clear any active sticky bombs
        if (this.activeStickyBombs) {
            this.activeStickyBombs.forEach(stickyBomb => {
                if (stickyBomb.visualEffect && stickyBomb.visualEffect.scene) {
                    stickyBomb.visualEffect.destroy();
                }
                if (stickyBomb.particles && stickyBomb.particles.scene) {
                    stickyBomb.particles.destroy();
                }
                // Destroy the bomb sprite if it exists
                if (stickyBomb.bombSprite && stickyBomb.bombSprite.scene) {
                    stickyBomb.bombSprite.destroy();
                }
            });
            this.activeStickyBombs = [];
        }
        
        // Make sure chibi image is fully opaque
        if (this.chibiImage) {
            this.chibiImage.setAlpha(1);
        }
        
        // Reset bomb
        this.resetBomb();
        
        // Recreate ice blocks (which will also recreate blue veils)
        this.createIceBlocks();
        
        // Recreate the completion veil
        if (this.completionVeil) {
            this.completionVeil.destroy();
        }
        if (this.frostGraphics) {
            this.frostGraphics.destroy();
        }
        
        this.completionVeil = this.add.rectangle(
            1920/2,
            1080/2,
            800,
            900,
            0x0033aa, // Deep blue color instead of white
            0.7
        ).setDepth(2);
        
        // Recreate frost effect
        const frostGraphics = this.add.graphics();
        frostGraphics.lineStyle(2, 0x66aaff, 0.3); // Light blue lines for frost effect
        
        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(-400, 400);
            const y = Phaser.Math.Between(-450, 450);
            const size = Phaser.Math.Between(20, 60);
            
            frostGraphics.moveTo(1920/2 + x, 1080/2 + y);
            frostGraphics.lineTo(1920/2 + x + size, 1080/2 + y);
            frostGraphics.moveTo(1920/2 + x, 1080/2 + y);
            frostGraphics.lineTo(1920/2 + x - size/2, 1080/2 + y + size);
            frostGraphics.moveTo(1920/2 + x, 1080/2 + y);
            frostGraphics.lineTo(1920/2 + x - size/2, 1080/2 + y - size);
        }
        
        frostGraphics.setDepth(2);
        this.frostGraphics = frostGraphics;
        
        // Update UI
        this.events.emit('updateShots', this.shotsRemaining);
        this.events.emit('updatePercentage', this.revealPercentage);
    }
    
    update() {
        try {
            // Skip if the bomb is static or doesn't exist
            if (!this.bomb || this.bomb.isStatic) return;
            
            // Check if bomb is out of bounds
            if (this.bomb.y > 1080 || this.bomb.x < 0 || this.bomb.x > 1920) {
                if (this.debugMode && this.debugText) {
                    console.log("Bomb out of bounds, resetting", this.bomb.x, this.bomb.y);
                    this.debugText.setText(`Bomb out of bounds at ${this.bomb.x.toFixed(1)},${this.bomb.y.toFixed(1)}`);
                }
                
                // Reset for next shot if we have shots remaining
                if (this.shotsRemaining > 0) {
                    this.resetBomb();
                } else {
                    this.checkLevelCompletion(); // This will now also check for game over
                }
                return;
            }
            
            // If bomb is in motion, update debug info
            if (this.debugMode && this.debugText) {
                // Get current velocity
                const velocity = this.bomb.body.velocity;
                
                // Update debug text with position and velocity
                this.debugText.setText(
                    `Bomb: pos=${this.bomb.x.toFixed(1)},${this.bomb.y.toFixed(1)} | ` +
                    `vel=${velocity.x.toFixed(2)},${velocity.y.toFixed(2)}`
                );
                
                // If bomb is very slow/stuck, prod it a bit
                if (Math.abs(velocity.x) < 0.1 && Math.abs(velocity.y) < 0.1 && 
                    !this.bomb.isStatic && this.bomb.y < 580) {
                    console.log("Bomb seems stuck, applying small impulse");
                    this.matter.body.applyForce(this.bomb.body, 
                        { x: this.bomb.x, y: this.bomb.y }, 
                        { x: 0, y: 0.001 });
                }
            }
        } catch (error) {
            console.error("Error in update:", error);
            if (this.debugText) {
                this.debugText.setText(`ERROR: ${error.message}`);
            }
        }
    }
    
    init(data) {
        try {
            // Initialize game state
            this.score = 0;
            this.bombsRemaining = 10;
            this.targetsRemaining = 10;
            this.bombFired = false;
            this.bombReady = false;
            this.isDragging = false;
            this.gameOver = false;
            this.isLevelComplete = false;
            this.isGameOver = false;
            
            // Debug settings
            this.debugMode = true;
            this.debugText = null;
            
            // Store any data passed from previous scene
            this.sceneData = data || {};
            
            // Initialize UI reference
            this.ui = null;
            
            console.log("GameScene initialized with data:", data);
        } catch (error) {
            console.error("Error in init:", error);
        }
    }

    createBombSelector() {
        // Create bomb selection buttons with highest depth
        const buttonY = 920;
        const spacing = 100;
        
        // Create a container for the bomb selector UI
        this.bombSelectorContainer = this.add.container(0, 0);
        this.bombSelectorContainer.setDepth(this.UI_DEPTH);
        
        // Create buttons with high depth
        this.blastButton = this.add.image(this.cameras.main.width - 600, buttonY, 'blast_bomb')
            .setScale(2)
            .setInteractive();
        this.blastButton.on('pointerdown', () => this.selectBombType(this.BOMB_TYPES.BLAST));
        
        this.piercerButton = this.add.image(this.cameras.main.width - 600 + spacing, buttonY, 'piercer_bomb')
            .setScale(2)
            .setInteractive();
        this.piercerButton.on('pointerdown', () => this.selectBombType(this.BOMB_TYPES.PIERCER));
        
        this.clusterButton = this.add.image(this.cameras.main.width - 600 + spacing * 2, buttonY, 'cluster_bomb')
            .setScale(2)
            .setInteractive();
        this.clusterButton.on('pointerdown', () => this.selectBombType(this.BOMB_TYPES.CLUSTER));
        
        this.stickyButton = this.add.image(this.cameras.main.width - 600 + spacing * 3, buttonY, 'sticky_bomb')
            .setScale(2)
            .setInteractive();
        this.stickyButton.on('pointerdown', () => this.selectBombType(this.BOMB_TYPES.STICKY));
        
        this.shattererButton = this.add.image(this.cameras.main.width - 600 + spacing * 4, buttonY, 'shatterer_bomb')
            .setScale(2)
            .setInteractive();
        this.shattererButton.on('pointerdown', () => this.selectBombType(this.BOMB_TYPES.SHATTERER));
        
        // Create name labels for each bomb type
        this.bombLabels = {};
        this.bombCounters = {};
        
        const createBombLabel = (button, bombType) => {
            // Bomb name style
            const nameStyle = {
                font: '16px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            };
            
            // Counter style (smaller)
            const counterStyle = {
                font: '14px Arial',
                fill: '#ffff00',
                stroke: '#000000',
                strokeThickness: 2
            };
            
            // Create the name label
            const nameLabel = this.add.text(
                button.x,
                button.y + 40,
                this.BOMB_NAMES[bombType],
                nameStyle
            ).setOrigin(0.5);
            
            // Create the counter label
            const counterLabel = this.add.text(
                button.x,
                button.y - 40,
                `x${this.bombsRemaining[bombType]}`,
                counterStyle
            ).setOrigin(0.5);
            
            // Add to container
            this.bombSelectorContainer.add(button);
            this.bombSelectorContainer.add(nameLabel);
            this.bombSelectorContainer.add(counterLabel);
            
            // Store references
            this.bombLabels[bombType] = nameLabel;
            this.bombCounters[bombType] = counterLabel;
        };
        
        // Create labels for each bomb
        createBombLabel(this.blastButton, this.BOMB_TYPES.BLAST);
        createBombLabel(this.piercerButton, this.BOMB_TYPES.PIERCER);
        createBombLabel(this.clusterButton, this.BOMB_TYPES.CLUSTER);
        createBombLabel(this.stickyButton, this.BOMB_TYPES.STICKY);
        createBombLabel(this.shattererButton, this.BOMB_TYPES.SHATTERER);
        
        // Default selection
        this.updateBombSelection();
    }
    
    selectBombType(bombType) {
        this.currentBombType = bombType;
        this.updateBombSelection();
        
        // If there's a bomb on the slingshot, update its texture
        if (this.bomb && this.bomb.body && this.bomb.body.isStatic) {
            this.bomb.setTexture(this.currentBombType);
            
            // Make sure the bomb is at the slingshot position
            if (this.isAiming) {
                // If the user is already aiming, don't reposition
            } else {
                this.bomb.setPosition(this.SLINGSHOT_X, this.SLINGSHOT_Y - 20);
                
                // Update the highlight position
                if (this.bombHighlight) {
                    this.bombHighlight.setPosition(this.SLINGSHOT_X, this.SLINGSHOT_Y - 20);
                }
            }
        }
    }
    
    updateBombSelection() {
        // Update button appearances to show selection
        this.blastButton.setScale(this.currentBombType === this.BOMB_TYPES.BLAST ? 1.2 : 1);
        this.piercerButton.setScale(this.currentBombType === this.BOMB_TYPES.PIERCER ? 1.2 : 1);
        this.clusterButton.setScale(this.currentBombType === this.BOMB_TYPES.CLUSTER ? 1.2 : 1);
        this.stickyButton.setScale(this.currentBombType === this.BOMB_TYPES.STICKY ? 1.2 : 1);
        this.shattererButton.setScale(this.currentBombType === this.BOMB_TYPES.SHATTERER ? 1.2 : 1);
        
        // Add glow to selected bomb
        this.blastButton.setTint(this.currentBombType === this.BOMB_TYPES.BLAST ? 0xffffff : 0xaaaaaa);
        this.piercerButton.setTint(this.currentBombType === this.BOMB_TYPES.PIERCER ? 0xffffff : 0xaaaaaa);
        this.clusterButton.setTint(this.currentBombType === this.BOMB_TYPES.CLUSTER ? 0xffffff : 0xaaaaaa);
        this.stickyButton.setTint(this.currentBombType === this.BOMB_TYPES.STICKY ? 0xffffff : 0xaaaaaa);
        this.shattererButton.setTint(this.currentBombType === this.BOMB_TYPES.SHATTERER ? 0xffffff : 0xaaaaaa);
        
        // Update label appearances
        Object.keys(this.bombLabels).forEach(bombType => {
            const isSelected = bombType === this.currentBombType;
            
            // Highlight selected bomb name
            this.bombLabels[bombType].setStyle({
                font: isSelected ? 'bold 16px Arial' : '16px Arial',
                fill: isSelected ? '#ffff00' : '#ffffff',
                stroke: '#000000',
                strokeThickness: isSelected ? 4 : 3
            });
            
            // Highlight selected bomb counter
            this.bombCounters[bombType].setStyle({
                font: isSelected ? 'bold 14px Arial' : '14px Arial',
                fill: isSelected ? '#ffffff' : '#ffff00',
                stroke: '#000000',
                strokeThickness: isSelected ? 4 : 2
            });
        });
    }

    handleStickyBomb(x, y, block) {
        // Create a visual sticky effect to show bomb has stuck, but not exploded
        const stickyEffect = this.add.circle(x, y, 30, 0xff99ff, 0.5);
        stickyEffect.setDepth(15);
        
        // Animate the sticky effect to pulse
        this.tweens.add({
            targets: stickyEffect,
            alpha: 0.2,
            scale: 1.2,
            duration: 800,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1 // Repeat forever until removed
        });
        
        // Add small particles to show it's active
        const particles = this.add.particles('sticky_particle');
        const emitter = particles.createEmitter({
            speed: { min: 10, max: 50 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.7, end: 0 },
            lifespan: 1000,
            blendMode: 'ADD',
            tint: 0xff99ff, // Pink tint for sticky bombs
            frequency: 500, // Emit particles every 500ms
            quantity: 2
        });
        
        // Set particle emission point
        emitter.setPosition(x, y);
        
        // Keep a reference to the original bomb sprite
        let bombSprite = null;
        if (this.bomb) {
            // Fix the bomb in place
            this.bomb.setStatic(true);
            // Store the bomb's position and type
            const bombType = this.bomb.bombType;
            
            // Make the bomb appear at the correct position
            this.bomb.setPosition(x, y);
            
            // Store reference to the bomb sprite
            bombSprite = this.bomb;
            
            // Destroy original bomb reference - but not the visual
            this.bomb = null;
            console.log("Sticky bomb placed, this.bomb reference cleared");
        }
        
        // Create a sticky bomb object to track its state
        const stickyBomb = {
            x: x,
            y: y,
            isActive: true,
            visualEffect: stickyEffect,
            particles: particles,
            bombSprite: bombSprite, // Store the bomb sprite reference
            explosionRadius: 440 // Wider explosion radius than standard bomb (doubled from 220)
        };
        
        // Add the sticky bomb to an array to track all active sticky bombs
        if (!this.activeStickyBombs) {
            this.activeStickyBombs = [];
        }
        this.activeStickyBombs.push(stickyBomb);
        
        // Play a sticking sound if available
        try {
            this.sound.play('explosion', { volume: 0.2, rate: 1.5 }); // Higher pitch for sticking sound
        } catch (e) {
            console.log("Sound not available:", e);
        }
        
        // Check if we need to reset the bomb after a delay to allow for the next shot
        this.time.delayedCall(2000, () => {
            if (this.shotsRemaining > 0 && !this.bomb) {
                console.log("Creating new bomb after placing sticky bomb");
                this.resetBomb();
            } else {
                this.checkLevelCompletion();
            }
        });
        
        // Log that a sticky bomb has been placed
        console.log("Sticky bomb placed at", x, y);
    }
    
    // Add a new method to trigger sticky bombs
    triggerStickyBomb(x, y, radius) {
        if (!this.activeStickyBombs || this.activeStickyBombs.length === 0) return;
        
        // Check if any sticky bombs are within the explosion radius
        const triggeredBombs = [];
        
        this.activeStickyBombs.forEach(stickyBomb => {
            if (stickyBomb.isActive) {
                const distance = Phaser.Math.Distance.Between(x, y, stickyBomb.x, stickyBomb.y);
                if (distance < radius) {
                    // This sticky bomb is triggered
                    triggeredBombs.push(stickyBomb);
                }
            }
        });
        
        // Process triggered bombs
        triggeredBombs.forEach(stickyBomb => {
            // Mark as inactive
            stickyBomb.isActive = false;
            
            // Remove from active array
            this.activeStickyBombs = this.activeStickyBombs.filter(bomb => bomb !== stickyBomb);
            
            // Clean up visual effects
            if (stickyBomb.visualEffect) stickyBomb.visualEffect.destroy();
            if (stickyBomb.particles) stickyBomb.particles.destroy();
            
            // Destroy the bomb sprite if it exists
            if (stickyBomb.bombSprite && stickyBomb.bombSprite.scene) {
                stickyBomb.bombSprite.destroy();
            }
            
            // Create bigger explosion
            this.createLargeExplosion(stickyBomb.x, stickyBomb.y);
            
            // Destroy blocks in a wider radius
            this.destroyBlocksInRadius(stickyBomb.x, stickyBomb.y, stickyBomb.explosionRadius);
        });
    }
    
    createLargeExplosion(x, y) {
        // Create a larger explosion effect for sticky bombs
        const explosion = this.add.circle(x, y, 120, 0xff77cc, 0.8);
        explosion.setDepth(6);
        
        // Animate the explosion
        this.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 3, // Larger scale
            duration: 500, // Longer duration
            ease: 'Power2',
            onComplete: () => {
                explosion.destroy();
            }
        });
        
        // Add more particles for a bigger effect
        const particles = this.add.particles('particle');
        particles.setDepth(6);
        
        const emitter = particles.createEmitter({
            speed: { min: 80, max: 250 }, // Faster particles
            scale: { start: 1.5, end: 0 }, // Larger particles
            alpha: { start: 1, end: 0 },
            lifespan: 1000,
            blendMode: 'ADD',
            tint: 0xff77cc // Pink tint for sticky bomb explosions
        });
        
        // Emit more particles
        emitter.explode(50, x, y);
        
        // Add a larger flash effect
        const flash = this.add.circle(x, y, 150, 0xffffff, 1);
        flash.setDepth(6);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                flash.destroy();
            }
        });
        
        // Clean up particles after use
        this.time.delayedCall(1000, () => {
            particles.destroy();
        });
        
        // Add a stronger camera shake
        this.cameras.main.shake(400, 0.015);
        
        // Add explosion sound with lower pitch for bigger boom
        if (this.sound && this.sound.add) {
            try {
                const explosionSound = this.sound.add('explosion');
                explosionSound.play({ volume: 0.6, rate: 0.6 });
            } catch (e) {
                console.log("Sound not available:", e);
            }
        }
    }
    
    handleShattererBomb(x, y) {
        // Shatterer bomb creates a powerful impact explosion
        
        // Create a large red explosion
        const explosion = this.add.circle(x, y, 100, 0xcc3333, 0.8);
        
        // Shockwave effect
        const shockwave = this.add.circle(x, y, 10, 0xffffff, 0.8);
        this.tweens.add({
            targets: shockwave,
            radius: 150,
            alpha: 0,
            duration: 600,
            ease: 'Power2',
            onComplete: () => {
                shockwave.destroy();
            },
            onUpdate: (tween) => {
                // Manually update the circle size since radius isn't a standard property
                const radius = 10 + (150 - 10) * tween.progress;
                shockwave.setRadius(radius);
            }
        });
        
        // Animate the explosion
        this.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 2.5,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                explosion.destroy();
            }
        });
        
        // Add particles for impact effect
        const particles = this.add.particles('impact_particle');
        const emitter = particles.createEmitter({
            speed: { min: 100, max: 300 },
            scale: { start: 1.5, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 1000,
            blendMode: 'ADD',
            angle: { min: 0, max: 360 },
            quantity: 50
        });
        
        // Emit particles in a single burst
        emitter.explode(50, x, y);
        
        // Destroy blocks in a wide radius with higher intensity
        this.destroyBlocksInRadius(x, y, 250);
        
        // Check for sticky bombs in a wide radius with high chance to trigger
        this.triggerStickyBomb(x, y, 300);
        
        // Add a stronger camera shake
        this.cameras.main.shake(500, 0.02);
        
        // Destroy the particle system after emissions complete
        this.time.delayedCall(1000, () => {
            particles.destroy();
        });
        
        // Add explosion sound if available
        if (this.sound && this.sound.add) {
            try {
                const explosionSound = this.sound.add('explosion');
                explosionSound.play({ volume: 0.8, rate: 0.7 }); // Lower pitch for heavier sound
            } catch (e) {
                console.log("Sound not available:", e);
            }
        }
    }

    initializeAudio() {
        console.log("Setting up audio for game level");
        
        try {
            // Check if sound system is available
            if (!this.sound || !this.sound.context) {
                console.error("Sound system not available!");
                return;
            }
            
            // Log audio context state
            console.log("Audio context state:", this.sound.context.state);
            
            // Handle autoplay restrictions in modern browsers
            if (this.sound.context.state === 'suspended') {
                console.log("Audio context suspended - waiting for user interaction");
                
                // Display a message to the user
                const clickMessage = this.add.text(
                    this.cameras.main.centerX, 
                    100, 
                    "Click anywhere to enable audio", 
                    {
                        font: '24px Arial',
                        fill: '#ffffff',
                        stroke: '#000000',
                        strokeThickness: 4
                    }
                ).setOrigin(0.5);
                clickMessage.setDepth(this.UI_DEPTH + 10);
                
                // Make the message blink to attract attention
                this.tweens.add({
                    targets: clickMessage,
                    alpha: 0.5,
                    duration: 500,
                    yoyo: true,
                    repeat: -1
                });
                
                // Set up one-time event listener for user interaction
                const resumeAudio = () => {
                    // Attempt to resume the audio context
                    this.sound.context.resume().then(() => {
                        console.log("Audio context resumed successfully");
                        clickMessage.destroy();
                        
                        // Continue with audio initialization
                        this.createAudioManager();
                    }).catch(err => {
                        console.error("Failed to resume audio context:", err);
                    });
                };
                
                // Listen for interaction events
                this.input.once('pointerdown', resumeAudio);
                this.input.keyboard.once('keydown', resumeAudio);
            } else {
                // Audio context is already running, proceed normally
                this.createAudioManager();
            }
        } catch (error) {
            console.error("Error initializing audio:", error);
        }
    }
    
    createAudioManager() {
        // Create a simple audio manager
        this.audioManager = {
            bgMusic: null,
            victoryMusic: null,
            
            playBackgroundMusic: () => {
                try {
                    console.log("Attempting to play background music...");
                    
                    // Check if we already have a music instance
                    if (this.audioManager.bgMusic) {
                        this.audioManager.bgMusic.stop();
                    }
                    
                    // Check if the sound exists
                    if (!this.cache.audio.exists('bgMusic')) {
                        console.error("bgMusic asset not found in cache");
                        return;
                    }
                    
                    // Create and play background music
                    this.audioManager.bgMusic = this.sound.add('bgMusic', {
                        volume: 0.4,
                        loop: true
                    });
                    
                    this.audioManager.bgMusic.play();
                    console.log("Background music started successfully");
                } catch (err) {
                    console.error("Error playing background music:", err);
                }
            },
            
            playVictoryMusic: () => {
                try {
                    console.log("Attempting to play victory music...");
                    
                    // Stop background music if playing
                    if (this.audioManager.bgMusic) {
                        this.audioManager.bgMusic.stop();
                    }
                    
                    // Check if the victory music exists
                    if (!this.cache.audio.exists('victoryMusic')) {
                        console.error("victoryMusic asset not found in cache");
                        return;
                    }
                    
                    // Play victory music
                    this.audioManager.victoryMusic = this.sound.add('victoryMusic', {
                        volume: 0.6,
                        loop: false
                    });
                    
                    // Make sure it starts playing with a bit of delay
                    this.time.delayedCall(200, () => {
                        this.audioManager.victoryMusic.play();
                        console.log("Victory music started successfully");
                    });
                } catch (err) {
                    console.error("Error playing victory music:", err);
                }
            },
            
            stopAll: () => {
                if (this.audioManager.bgMusic) {
                    this.audioManager.bgMusic.stop();
                }
                if (this.audioManager.victoryMusic) {
                    this.audioManager.victoryMusic.stop();
                }
            },
            
            playGameOverSound: () => {
                try {
                    console.log("Attempting to play game over sound...");
                    
                    // Check if the game over sound exists
                    if (this.cache.audio.exists('gameOverSound')) {
                        // Play game over sound
                        this.sound.add('gameOverSound').play();
                        console.log("Game over sound started successfully");
                    } else {
                        console.warn("gameOverSound asset not found in cache, using fallback sound");
                        // Create a fallback sound effect
                        if (this.sound && this.sound.context) {
                            // Create a simple descending tone
                            const oscillator = this.sound.context.createOscillator();
                            const gainNode = this.sound.context.createGain();
                            
                            oscillator.type = 'sawtooth';
                            oscillator.frequency.setValueAtTime(440, this.sound.context.currentTime);
                            oscillator.frequency.exponentialRampToValueAtTime(110, this.sound.context.currentTime + 1.5);
                            
                            gainNode.gain.setValueAtTime(0.3, this.sound.context.currentTime);
                            gainNode.gain.exponentialRampToValueAtTime(0.01, this.sound.context.currentTime + 1.5);
                            
                            oscillator.connect(gainNode);
                            gainNode.connect(this.sound.context.destination);
                            
                            oscillator.start();
                            oscillator.stop(this.sound.context.currentTime + 1.5);
                            
                            console.log("Fallback game over sound created");
                        }
                    }
                } catch (err) {
                    console.error("Error playing game over sound:", err);
                }
            }
        };
        
        // Add a short delay before playing music to ensure everything is loaded
        this.time.delayedCall(1000, () => {
            this.audioManager.playBackgroundMusic();
        });
    }

    // Add the missing updateBombUI method
    updateBombUI() {
        try {
            // Update the text displays for bombs remaining
            if (this.debugText) {
                this.debugText.setText(`Bomb: ${this.currentBombType} | Shots: ${this.shotsRemaining}`);
            }
            
            // Make sure bomb selection is visually updated
            this.updateBombSelection();
            
            // Update the main UI with shot count
            this.updateUI();
        } catch (error) {
            console.error("Error updating bomb UI:", error);
        }
    }

    drawTrajectory(startX, startY, velocityX, velocityY) {
        try {
            // Add debug logging
            if (this.debugMode) {
                console.log("Drawing trajectory from:", startX, startY, "with velocity:", velocityX, velocityY);
            }
            
            // Check if trajectoryGraphics exists
            if (!this.trajectoryGraphics) {
                console.error("trajectoryGraphics is not initialized");
                this.trajectoryGraphics = this.add.graphics();
                this.trajectoryGraphics.setDepth(11);
            }
            
            // Clear previous trajectory
            this.trajectoryGraphics.clear();
            
            // Number of points to predict - greatly increased for much longer trajectory
            const numPoints = 100; // Increased from 35 to 100 for a trajectory 3x longer
            
            // Time step for each predicted point (in seconds)
            const timeStep = 0.1; // Reduced time step to make points closer together
            
            // Get physics properties based on current bomb type
            let density = 0.002; // Default density
            let frictionAir = 0.001; // Default air friction
            
            // Adjust properties for special bomb types to match their actual physics
            switch(this.currentBombType) {
                case this.BOMB_TYPES.PIERCER:
                    density = 0.003;
                    frictionAir = 0.0005;
                    break;
                case this.BOMB_TYPES.CLUSTER:
                    density = 0.0015;
                    break;
            }
            
            // Gravity from the physics world - safely access with fallback value
            let gravityY = 1; // Default gravity
            try {
                gravityY = this.matter.world.localWorld.gravity.y || 1;
            } catch (error) {
                console.warn("Could not access physics world gravity, using default:", error);
            }
            
            // Scale factor for velocity - safely access with fallback value
            let forceScale = 60; // Default scale
            try {
                forceScale = (this.matter.world.localWorld.body?.global?.translateForceToPts || 1) * 60;
            } catch (error) {
                console.warn("Could not access physics force scale, using default:", error);
            }
            
            // Current position and velocity
            let x = startX;
            let y = startY;
            let vx = velocityX * forceScale;
            let vy = velocityY * forceScale;
            
            // Store calculated trajectory points
            this.trajectoryPoints = [];
            
            // Calculate trajectory points with extended prediction
            for (let i = 0; i < numPoints; i++) {
                // Add current point to array
                this.trajectoryPoints.push({ x, y });
                
                // Calculate next position using physics formulas
                x += vx * timeStep;
                y += vy * timeStep;
                
                // Update velocity due to gravity and air friction
                vx *= (1 - frictionAir * timeStep); // Scale air friction by timeStep
                vy *= (1 - frictionAir * timeStep); // Scale air friction by timeStep
                vy += gravityY * timeStep * 150 * density; // Apply gravity scaled by density
                
                // Skip if point is out of bounds - allow more vertical room for longer trajectories
                if (x < -500 || x > this.cameras.main.width + 500 || y < -500 || y > this.cameras.main.height + 1000) {
                    break;
                }
            }
            
            // Draw dotted line connecting trajectory points - skip some points for better performance
            if (this.trajectoryPoints.length >= 2) {
                // We'll draw fewer dots for better performance, approximately every 2-3 points
                const skipFactor = Math.ceil(this.trajectoryPoints.length / 50); // Don't draw more than ~50 dots
                
                for (let i = 0; i < this.trajectoryPoints.length; i += skipFactor) {
                    const point = this.trajectoryPoints[i];
                    const alpha = 0.95 - (i / this.trajectoryPoints.length * 0.5); // Fading alpha for distant points (more visible)
                    const radius = 7 - (i / this.trajectoryPoints.length) * 4; // Larger dots that decrease in size
                    
                    // All dots are green
                    const dotColor = 0x00ff00; // Bright green color
                    
                    // Draw a colored dot with black border - make it more visible
                    this.trajectoryGraphics.fillStyle(dotColor, alpha);
                    this.trajectoryGraphics.fillCircle(point.x, point.y, radius);
                    this.trajectoryGraphics.lineStyle(1.5, 0x000000, alpha * 0.8);
                    this.trajectoryGraphics.strokeCircle(point.x, point.y, radius);
                }
                
                if (this.debugMode) {
                    console.log(`Drew trajectory with ${this.trajectoryPoints.length} points calculated, ${Math.ceil(this.trajectoryPoints.length / skipFactor)} dots shown`);
                }
            }
        } catch (error) {
            console.error("Error drawing trajectory:", error);
        }
    }

    clearTrajectory() {
        if (this.trajectoryGraphics) {
            this.trajectoryGraphics.clear();
        }
        this.trajectoryPoints = [];
    }

    // Add new method to handle veil removal separately from level completion
    removeCompletionVeil() {
        if (this.completionVeil && !this.completionVeilRemoved) {
            console.log("Removing completion veil at " + this.revealPercentage + "% revealed");
            this.completionVeilRemoved = true;
            
            // Remove the completion veil with a nice effect
            this.tweens.add({
                targets: [this.completionVeil, this.frostGraphics],
                alpha: 0,
                duration: 1500,
                ease: 'Power2',
                onComplete: () => {
                    if (this.completionVeil && this.completionVeil.scene) {
                        this.completionVeil.destroy();
                    }
                    if (this.frostGraphics && this.frostGraphics.scene) {
                        this.frostGraphics.destroy();
                    }
                }
            });
            
            // Add sparkle particles where the veil was
            const particles = this.add.particles('particle');
            const emitter = particles.createEmitter({
                x: 1920/2,
                y: 1080/2,
                speed: { min: 100, max: 200 },
                scale: { start: 0.5, end: 0 },
                alpha: { start: 1, end: 0 },
                lifespan: 2000,
                blendMode: 'ADD',
                tint: [0x66aaff, 0x0033aa, 0xffffff], // Blue and white ice particles
                quantity: 50,
                angle: { min: 0, max: 360 }
            });
            
            // Stop the emitter after a short duration
            this.time.delayedCall(2000, () => {
                emitter.stop();
                this.time.delayedCall(2000, () => {
                    particles.destroy();
                });
            });
        }
    }
}