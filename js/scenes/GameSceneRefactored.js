// GameSceneRefactored.js - Refactored main game scene using manager architecture
class GameSceneRefactored extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        
        // Constants
        this.SLINGSHOT_X = 300;
        this.SLINGSHOT_Y = 800;
        this.MAX_DRAG_DISTANCE = 200;
        this.SHOT_POWER = 0.13;
        this.MAX_SHOTS = 20;
        this.UI_DEPTH = 1000;
        
        // Game state
        this.shotsRemaining = this.MAX_SHOTS;
        this.isAiming = false;
        this.bombFired = false;
        this.bombReady = false;
        this.isDragging = false;
        this.gameOver = false;
        this.isLevelComplete = false;
        this.isGameOver = false;
        this.revealPercentage = 0;
        this.targetPercentage = 85;
        this.currentLevel = 1;
        
        // Tracking arrays
        this.iceBlocks = [];
        this.blueVeils = [];
        this.activeStickyBombs = [];
        this.trajectoryPoints = [];
        
        // Debug mode
        this.debugMode = true;
        this.debugText = null;
        
        // Performance configuration
        this.willReadPixelsFrequently = true;
    }

    // Initialize scene with data
    init(data) {
        try {
            // Store any data passed from previous scene
            this.sceneData = data || {};
            
            // Get level number from data or default to 1
            this.currentLevel = data?.level || 1;
            console.log(`Initializing GameScene for level ${this.currentLevel}`);
            
            // Reset shots
            this.shotsRemaining = this.MAX_SHOTS;
            
            // Reset game state flags
            this.isAiming = false;
            this.bombFired = false;
            this.bombReady = false;
            this.isDragging = false;
            this.gameOver = false;
            this.isLevelComplete = false;
            this.isGameOver = false;
            
            // Reset tracking metrics
            this.revealPercentage = 0;
            this.score = 0;
            this.totalIceBlocks = 0;
            this.clearedIceBlocks = 0;
            
            // Clear tracking arrays
            this.iceBlocks = [];
            this.blueVeils = [];
            this.activeStickyBombs = [];
            this.trajectoryPoints = [];
        } catch (error) {
            console.error("Error in init:", error);
        }
    }

    // Create game objects and setup scene
    create() {
        try {
            console.log(`GameScene: Creating scene for level ${this.currentLevel}`);
            
            // Setup managers in correct order
            this.initializeManagers();
            
            // Setup world physics and camera
            this.setupCamera();
            this.matter.world.setGravity(0, 0);
            
            // Setup game elements
            this.createBackground();
            this.createIceBlocks();
            this.createSlingshot();
            this.setupCollisions();
            
            // Initialize UI
            this.uiManager.createMainUI();
            this.uiManager.createBombSelector(this.bombManager);
            
            // Setup game events
            this.setupEvents();
            
            // Start background music
            this.audioManager.playBackgroundMusic();
            
            // Initialize game state
            this.stateManager.setState('playing');
            
            console.log("GameScene creation complete");
        } catch (error) {
            console.error("Error in create function:", error);
        }
    }
    
    // Initialize all managers
    initializeManagers() {
        // Create the block utilities
        this.blockUtils = new BlockUtils(this);
        this.blockTypes = new BlockTypes();
        
        // Create the bomb utilities
        this.bombUtils = new BombUtils(this);
        
        // Initialize AudioManager
        this.audioManager = new AudioManager(this);
        this.audioManager.initialize();
        
        // Initialize UIManager
        this.uiManager = new UIManager(this);
        this.uiManager.initialize();
        
        // Initialize BombManager
        this.bombManager = new BombManager(this);
        
        // Initialize BlockManager
        this.blockManager = new BlockManager(this);
        
        // Initialize StateManager
        this.stateManager = new StateManager(this);
        
        // Register game states
        this.stateManager.registerState('playing', new PlayingState(this));
        this.stateManager.registerState('levelComplete', new LevelCompleteState(this));
        this.stateManager.registerState('gameOver', new GameOverState(this));
        
        // Initialize LevelManager
        this.initializeLevelManager().then(() => {
            // Set up bombs based on level configuration
            this.bombManager.setupBombs(this.levelManager.getCurrentLevelData());
        }).catch(error => {
            console.error("Error initializing level manager:", error);
            // Use fallback bomb setup
            this.bombManager.setupFallbackBombs(this.currentLevel);
        });
    }
    
    // Initialize level manager
    async initializeLevelManager() {
        try {
            console.log("Initializing level manager...");
            
            // Create level manager if it doesn't exist
            if (!this.levelManager) {
                this.levelManager = new LevelManager(this);
                console.log(`LevelManager created for level ${this.currentLevel}`);
            }
            
            // Load level data
            await this.levelManager.loadLevel(this.currentLevel);
            
            // Get target percentage for this level
            const levelData = this.levelManager.getCurrentLevelData();
            this.targetPercentage = levelData?.targetPercentage || 85;
            
            console.log(`Level ${this.currentLevel} initialized with target percentage ${this.targetPercentage}%`);
            return true;
        } catch (error) {
            console.error("Error initializing level manager:", error);
            
            // Set default target percentage as fallback
            this.targetPercentage = 85;
            console.log(`Using fallback target percentage of ${this.targetPercentage}%`);
            
            return false;
        }
    }
    
    // Setup event handlers
    setupEvents() {
        // Bomb selection event
        this.events.on('selectBombType', this.handleBombSelection, this);
        
        // Level transition events
        this.events.on('goToNextLevel', this.goToNextLevel, this);
        
        // Input events
        this.input.on('pointerdown', this.onPointerDown, this);
        this.input.on('pointermove', this.onPointerMove, this);
        this.input.on('pointerup', this.onPointerUp, this);
        this.input.on('dragstart', this.onDragStart, this);
        this.input.on('drag', this.onDrag, this);
        this.input.on('dragend', this.onDragEnd, this);
    }
    
    // Handle bomb selection
    handleBombSelection(bombType) {
        // Use the bomb manager to select the new bomb type
        if (this.bombManager.selectBombType(bombType)) {
            // Update UI if selection succeeded
            this.uiManager.updateBombSelection(bombType);
            
            // Reset current bomb if needed
            if (this.bombManager.bomb && !this.bombManager.bomb.isLaunched) {
                // Destroy current bomb and create a new one of the selected type
                this.bombManager.createBomb(this.SLINGSHOT_X, this.SLINGSHOT_Y - 20);
            }
        }
    }
    
    // Setup camera
    setupCamera() {
        const gameWidth = 1920;
        const gameHeight = 1080;
        
        // Main camera setup
        this.cameras.main.setBounds(0, 0, gameWidth, gameHeight);
        this.cameras.main.setBackgroundColor('#000000');
        
        // Set up physics world with larger bounds than camera
        this.matter.world.setBounds(-2000, -2000, gameWidth + 4000, gameHeight + 4000);
        
        if (this.debugMode) {
            console.log(`Camera setup: ${gameWidth}x${gameHeight}`);
            console.log(`Physics world bounds: -2000, -2000, ${gameWidth + 4000}, ${gameHeight + 4000}`);
        }
    }
    
    // Create game background
    createBackground() {
        try {
            // Get background image key
            const backgroundKey = `background${this.currentLevel}`;
            
            // Create background image
            if (this.textures.exists(backgroundKey)) {
                this.backgroundImage = this.add.image(1920/2, 1080/2, backgroundKey);
                console.log(`Created background with key: ${backgroundKey}`);
            } else {
                console.warn(`Background texture ${backgroundKey} not found, creating fallback`);
                this.backgroundImage = this.add.rectangle(1920/2, 1080/2, 1920, 1080, 0x87CEEB);
            }
            this.backgroundImage.setDepth(0);
            
            // Get chibi image key
            const chibiKey = `chibi_girl${this.currentLevel}`;
            
            // Position chibi on right side
            const chibiX = Math.floor(1920 * 0.7);
            const chibiY = 1080/2;
            
            // Create chibi image
            if (this.textures.exists(chibiKey)) {
                this.chibiImage = this.add.image(chibiX, chibiY, chibiKey);
                console.log(`Created chibi with key: ${chibiKey}`);
            } else {
                console.warn(`Chibi texture ${chibiKey} not found, creating placeholder`);
                const graphics = this.add.graphics();
                graphics.fillStyle(0xff00ff, 0.5);
                graphics.fillRect(0, 0, 300, 600);
                graphics.generateTexture('placeholder_chibi', 300, 600);
                graphics.clear();
                
                this.chibiImage = this.add.image(chibiX, chibiY, 'placeholder_chibi');
            }
            this.chibiImage.setDepth(1);
            
        } catch (error) {
            console.error("Error creating background:", error);
        }
    }
    
    // Create ice blocks covering the chibi image
    createIceBlocks() {
        try {
            // Get the chibi image bounds
            const chibiImage = this.chibiImage;
            const imageWidth = chibiImage.width;
            const imageHeight = chibiImage.height;
            const imageX = chibiImage.x - imageWidth / 2;
            const imageY = chibiImage.y - imageHeight / 2;
            
            // Use BlockManager to create ice blocks
            const result = this.blockManager.createIceBlocksOverImage(
                chibiImage,
                imageX,
                imageY,
                imageWidth,
                imageHeight
            );
            
            // Store references to the created blocks
            this.iceBlocks = result.blocks;
            this.blueVeils = result.veils;
            this.totalIceBlocks = this.iceBlocks.length;
            this.clearedIceBlocks = 0;
            
            console.log(`Created ${this.totalIceBlocks} ice blocks using BlockManager`);
        } catch (error) {
            console.error("Error creating ice blocks:", error);
        }
    }
    
    // Create slingshot
    createSlingshot() {
        // Create slingshot base
        this.slingshotBase = this.add.image(this.SLINGSHOT_X, this.SLINGSHOT_Y, 'slingshot');
        this.slingshotBase.setDepth(10);
        this.slingshotBase.setDisplaySize(120, 200);
        
        // Create elastic line with graphics
        this.elasticLine = this.add.graphics();
        this.elasticLine.setDepth(11);
        
        // Create initial bomb at slingshot position
        this.bombManager.createBomb(this.SLINGSHOT_X, this.SLINGSHOT_Y - 20);
    }
    
    // Setup collision handlers
    setupCollisions() {
        // Matter.js collision event handler
        this.matter.world.on('collisionstart', (event) => {
            const pairs = event.pairs;
            
            for (let i = 0; i < pairs.length; i++) {
                const bodyA = pairs[i].bodyA;
                const bodyB = pairs[i].bodyB;
                
                const gameObjectA = bodyA.gameObject;
                const gameObjectB = bodyB.gameObject;
                
                // Skip if either object is missing
                if (!gameObjectA || !gameObjectB) continue;
                
                // Handle bomb collisions
                if (gameObjectA.bombType || gameObjectB.bombType) {
                    const bomb = gameObjectA.bombType ? gameObjectA : gameObjectB;
                    const otherObject = gameObjectA.bombType ? gameObjectB : gameObjectA;
                    
                    // Only process first collision for some bomb types
                    if (bomb.hasHitIceBlock) {
                        continue;
                    }
                    
                    // Mark bomb as having hit an ice block
                    bomb.hasHitIceBlock = true;
                    
                    // Handle different bomb types
                    if (otherObject.blockType) {
                        // We hit an ice block
                        const hitBlock = otherObject;
                        
                        // Play impact sound
                        this.audioManager.playCrackSound();
                        
                        // Create hit effect
                        if (this.bombUtils) {
                            this.bombUtils.createHitEffect(bomb.x, bomb.y);
                        }
                        
                        // Process based on bomb type
                        switch (bomb.bombType) {
                            case this.bombManager.BOMB_TYPES.BLAST:
                                this.handleBlastBomb(bomb.x, bomb.y);
                                break;
                            case this.bombManager.BOMB_TYPES.PIERCER:
                                this.handlePiercerBomb(bomb.x, bomb.y);
                                break;
                            case this.bombManager.BOMB_TYPES.CLUSTER:
                                this.handleClusterBomb(bomb.x, bomb.y);
                                break;
                            case this.bombManager.BOMB_TYPES.STICKY:
                                this.handleStickyBomb(bomb.x, bomb.y, hitBlock);
                                break;
                            case this.bombManager.BOMB_TYPES.SHATTERER:
                                this.handleShattererBomb(bomb.x, bomb.y);
                                break;
                            case this.bombManager.BOMB_TYPES.DRILLER:
                                this.handleDrillerBomb(bomb.x, bomb.y, hitBlock);
                                break;
                            case this.bombManager.BOMB_TYPES.RICOCHET:
                                this.handleRicochetBomb(bomb, hitBlock);
                                break;
                        }
                    } else if (otherObject.isBoundaryBlock) {
                        // Handle boundary collisions
                        if (bomb.bombType === this.bombManager.BOMB_TYPES.RICOCHET) {
                            if (this.bombUtils) {
                                this.bombUtils.handleRicochetBoundaryHit(bomb);
                            }
                        } else {
                            // Create bounce effect
                            if (this.bombUtils) {
                                this.bombUtils.createBoundaryHitEffect(bomb.x, bomb.y);
                            }
                        }
                        
                        // Play bounce sound
                        this.audioManager.playBounceSound();
                    }
                }
            }
        });
    }
    
    // Bomb type handlers - these delegate to the BombUtils
    handleBlastBomb(x, y) {
        if (this.bombUtils) {
            this.bombUtils.handleBlastBomb(x, y);
        }
    }
    
    handlePiercerBomb(x, y) {
        if (this.bombUtils) {
            this.bombUtils.handlePiercerBomb(x, y);
        }
    }
    
    handleClusterBomb(x, y) {
        if (this.bombUtils) {
            this.bombUtils.handleClusterBomb(x, y);
        }
    }
    
    handleStickyBomb(x, y, block) {
        if (this.bombUtils) {
            this.bombUtils.handleStickyBomb(x, y, block);
        }
    }
    
    handleShattererBomb(x, y) {
        if (this.bombUtils) {
            this.bombUtils.handleShattererBomb(x, y);
        }
    }
    
    handleDrillerBomb(x, y, block) {
        if (this.bombUtils) {
            this.bombUtils.handleDrillerBomb(x, y, block);
        }
    }
    
    handleRicochetBomb(bomb, block) {
        if (this.bombUtils) {
            this.bombUtils.handleRicochetBomb(bomb, block);
        }
    }
    
    // Go to next level
    goToNextLevel() {
        // Check if next level exists
        if (this.levelManager && this.levelManager.hasNextLevel()) {
            // Get next level number
            const nextLevel = this.currentLevel + 1;
            
            console.log(`Advancing to level ${nextLevel}`);
            
            // Clean up current level
            this.cleanup();
            
            // Start next level
            this.scene.start('LoadingScene', { 
                level: nextLevel,
                fromScene: 'GameScene'
            });
        } else {
            console.log("No next level available, restarting current level");
            this.scene.restart();
        }
    }
    
    // Pointer down handler
    onPointerDown(pointer) {
        // Only process input in playing state
        if (this.stateManager.getCurrentStateName() !== 'playing') {
            return;
        }
        
        // Check if we have a bomb and if it's not launched
        if (this.bombManager.bomb && !this.bombManager.bomb.isLaunched) {
            // Start aiming if pointer is near the bomb
            const dist = Phaser.Math.Distance.Between(
                pointer.x, pointer.y,
                this.bombManager.bomb.x, this.bombManager.bomb.y
            );
            
            if (dist < 50) {
                this.isAiming = true;
                this.drawTrajectory(
                    this.SLINGSHOT_X, 
                    this.SLINGSHOT_Y - 20,
                    0, 0
                );
            }
        }
    }
    
    // Pointer move handler
    onPointerMove(pointer) {
        // Only process input in playing state
        if (this.stateManager.getCurrentStateName() !== 'playing') {
            return;
        }
        
        if (this.isAiming && this.bombManager.bomb && !this.bombManager.bomb.isLaunched) {
            // Calculate pull direction and distance
            const dx = this.SLINGSHOT_X - pointer.x;
            const dy = (this.SLINGSHOT_Y - 20) - pointer.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Limit drag distance
            const limitedDistance = Math.min(distance, this.MAX_DRAG_DISTANCE);
            const angle = Math.atan2(dy, dx);
            
            // Calculate new position
            const newX = this.SLINGSHOT_X - Math.cos(angle) * limitedDistance;
            const newY = (this.SLINGSHOT_Y - 20) - Math.sin(angle) * limitedDistance;
            
            // Update bomb position
            this.bombManager.bomb.setPosition(newX, newY);
            
            // Update elastic line
            this.updateElasticLine(newX, newY);
            
            // Update trajectory
            this.drawTrajectory(
                newX, newY,
                dx * this.SHOT_POWER,
                dy * this.SHOT_POWER
            );
        }
    }
    
    // Pointer up handler
    onPointerUp(pointer) {
        // Only process input in playing state
        if (this.stateManager.getCurrentStateName() !== 'playing') {
            return;
        }
        
        if (this.isAiming && this.bombManager.bomb && !this.bombManager.bomb.isLaunched) {
            // Calculate launch direction and force
            const dx = this.SLINGSHOT_X - pointer.x;
            const dy = (this.SLINGSHOT_Y - 20) - pointer.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Only launch if pulled back far enough
            if (distance > 20) {
                // Launch the bomb
                this.bombManager.launchBomb(
                    this.bombManager.bomb.x,
                    this.bombManager.bomb.y,
                    dx * this.SHOT_POWER,
                    dy * this.SHOT_POWER
                );
                
                // Decrement shots
                this.shotsRemaining--;
                
                // Update UI
                this.uiManager.updateShotsDisplay(this.shotsRemaining);
                
                // Clear trajectory and elastic
                this.clearTrajectory();
                this.elasticLine.clear();
                
                // Check game completion
                if (this.shotsRemaining <= 0) {
                    this.checkLevelCompletion();
                }
            }
            
            // Reset aiming state
            this.isAiming = false;
        }
    }
    
    // Drag start handler for draggable bomb
    onDragStart(pointer, gameObject) {
        // Only allow drag in playing state and for bombs
        if (this.stateManager.getCurrentStateName() !== 'playing' || 
            !gameObject.bombType || gameObject.isLaunched) {
            return;
        }
        
        this.isDragging = true;
        this.drawTrajectory(
            this.SLINGSHOT_X, 
            this.SLINGSHOT_Y - 20,
            0, 0
        );
    }
    
    // Drag handler for draggable bomb
    onDrag(pointer, gameObject, dragX, dragY) {
        // Only allow drag in playing state and for bombs
        if (this.stateManager.getCurrentStateName() !== 'playing' || 
            !gameObject.bombType || gameObject.isLaunched) {
            return;
        }
        
        // Calculate direction and distance from slingshot
        const dx = this.SLINGSHOT_X - dragX;
        const dy = (this.SLINGSHOT_Y - 20) - dragY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Limit drag distance
        const limitedDistance = Math.min(distance, this.MAX_DRAG_DISTANCE);
        const angle = Math.atan2(dy, dx);
        
        // Calculate new position
        const newX = this.SLINGSHOT_X - Math.cos(angle) * limitedDistance;
        const newY = (this.SLINGSHOT_Y - 20) - Math.sin(angle) * limitedDistance;
        
        // Update gameObject position
        gameObject.setPosition(newX, newY);
        
        // Update elastic line
        this.updateElasticLine(newX, newY);
        
        // Update trajectory
        this.drawTrajectory(
            newX, newY,
            dx * this.SHOT_POWER,
            dy * this.SHOT_POWER
        );
    }
    
    // Drag end handler for draggable bomb
    onDragEnd(pointer, gameObject) {
        // Only allow drag in playing state and for bombs
        if (this.stateManager.getCurrentStateName() !== 'playing' || 
            !gameObject.bombType || gameObject.isLaunched) {
            return;
        }
        
        // Calculate launch direction and force
        const dx = this.SLINGSHOT_X - gameObject.x;
        const dy = (this.SLINGSHOT_Y - 20) - gameObject.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Only launch if pulled back far enough
        if (distance > 20) {
            // Launch the bomb
            this.bombManager.launchBomb(
                gameObject.x,
                gameObject.y,
                dx * this.SHOT_POWER,
                dy * this.SHOT_POWER
            );
            
            // Decrement shots
            this.shotsRemaining--;
            
            // Update UI
            this.uiManager.updateShotsDisplay(this.shotsRemaining);
            
            // Clear trajectory and elastic
            this.clearTrajectory();
            this.elasticLine.clear();
            
            // Check game completion
            if (this.shotsRemaining <= 0) {
                this.checkLevelCompletion();
            }
        } else {
            // Not enough drag, just reset
            gameObject.setPosition(this.SLINGSHOT_X, this.SLINGSHOT_Y - 20);
            this.clearTrajectory();
            this.elasticLine.clear();
        }
        
        this.isDragging = false;
    }
    
    // Update elastic line graphics
    updateElasticLine(bombX, bombY) {
        this.elasticLine.clear();
        this.elasticLine.lineStyle(4, 0x8B4513); // Brown color
        
        // Draw line from slingshot anchor to bomb
        this.elasticLine.beginPath();
        this.elasticLine.moveTo(this.SLINGSHOT_X - 20, this.SLINGSHOT_Y - 50);
        this.elasticLine.lineTo(bombX, bombY);
        this.elasticLine.moveTo(this.SLINGSHOT_X + 20, this.SLINGSHOT_Y - 50);
        this.elasticLine.lineTo(bombX, bombY);
        this.elasticLine.strokePath();
    }
    
    // Draw trajectory prediction line
    drawTrajectory(startX, startY, velocityX, velocityY) {
        // Clear existing trajectory
        this.clearTrajectory();
        
        // Create trajectory line
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0xffffff, 0.3);
        
        // Start position
        let x = startX;
        let y = startY;
        
        // Physics simulation values
        const steps = 60;
        const timeStep = 1 / 60; // 60 fps simulation
        
        // Initial velocity
        let vx = velocityX;
        let vy = velocityY;
        
        // Physics constants
        const airFriction = 0.001; // Very low air friction in space-like environment
        
        // Draw line segments
        graphics.beginPath();
        graphics.moveTo(x, y);
        
        // Store the points for cleanup
        this.trajectoryPoints.push(graphics);
        
        // Simulation
        for (let i = 0; i < steps; i++) {
            // Update velocities with air friction
            vx *= (1 - airFriction);
            vy *= (1 - airFriction);
            
            // Update position
            x += vx;
            y += vy;
            
            // Draw line segment
            graphics.lineTo(x, y);
            
            // Create small dot every 5 steps
            if (i % 5 === 0) {
                const dot = this.add.circle(x, y, 2, 0xffffff, 0.5);
                this.trajectoryPoints.push(dot);
            }
        }
        
        graphics.strokePath();
    }
    
    // Clear trajectory prediction
    clearTrajectory() {
        // Destroy all trajectory elements
        this.trajectoryPoints.forEach(point => {
            if (point && point.scene) {
                point.destroy();
            }
        });
        this.trajectoryPoints = [];
    }
    
    // Check if level is complete
    checkLevelCompletion() {
        // Use BlockManager to calculate percentage of blocks cleared
        this.revealPercentage = this.blockManager.getRevealPercentage();
        this.clearedIceBlocks = this.blockManager.clearedBlocks;
        
        // Update UI
        this.uiManager.updatePercentageDisplay(this.revealPercentage, this.targetPercentage);
        
        // Check if target percentage is reached
        if (this.revealPercentage >= this.targetPercentage) {
            // Level complete
            this.isLevelComplete = true;
            
            // Switch to level complete state
            this.stateManager.setState('levelComplete');
            
            return true;
        } else if (this.shotsRemaining <= 0) {
            // Out of shots and didn't reach target
            this.isGameOver = true;
            
            // Switch to game over state
            this.stateManager.setState('gameOver');
            
            return false;
        }
        
        return false;
    }
    
    // Cleanup resources
    cleanup() {
        // Stop audio
        if (this.audioManager) {
            this.audioManager.cleanup();
        }
        
        // Clean up UI
        if (this.uiManager) {
            this.uiManager.cleanup();
        }
        
        // Clean up bomb manager
        if (this.bombManager) {
            this.bombManager.cleanup();
        }
        
        // Clean up block manager
        if (this.blockManager) {
            this.blockManager.cleanup();
        }
        
        // Clean up state manager
        if (this.stateManager) {
            this.stateManager.cleanup();
        }
        
        // Clear any tweens
        this.tweens.killAll();
        
        // Clear any timers
        this.time.removeAllEvents();
        
        // Remove event listeners
        this.events.off('selectBombType', this.handleBombSelection, this);
        this.events.off('goToNextLevel', this.goToNextLevel, this);
        
        console.log("GameScene cleanup complete");
    }
    
    // Update method called every frame
    update(time, delta) {
        // Update the current state
        if (this.stateManager) {
            this.stateManager.update(time, delta);
        }
        
        // Update debug info if needed
        if (this.debugMode && this.debugText) {
            this.updateDebugText();
        }
    }
    
    // Update debug text
    updateDebugText() {
        if (!this.debugText) {
            this.debugText = this.add.text(10, 50, '', { 
                font: '14px Arial', 
                fill: '#ffffff',
                backgroundColor: '#000000' 
            });
            this.debugText.setDepth(this.UI_DEPTH);
        }
        
        // Format debug info
        const debugInfo = [
            `Level: ${this.currentLevel}`,
            `Shots: ${this.shotsRemaining}/${this.MAX_SHOTS}`,
            `Revealed: ${this.revealPercentage}%`,
            `Target: ${this.targetPercentage}%`,
            `Blocks: ${this.blockManager ? this.blockManager.clearedBlocks : 0}/${this.blockManager ? this.blockManager.totalBlocks : 0}`,
            `Dynamite Blocks: ${this.blockManager ? this.blockManager.dynamiteBlocks.length : 0}`,
            `State: ${this.stateManager ? this.stateManager.getCurrentStateName() : 'unknown'}`,
            `Selected Bomb: ${this.bombManager ? this.bombManager.currentBombType : 'none'}`
        ];
        
        this.debugText.setText(debugInfo);
    }
    
    // Shutdown method
    shutdown() {
        this.cleanup();
        super.shutdown();
    }
}

// Export the GameSceneRefactored class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameSceneRefactored };
} else {
    // If not in Node.js, add to window object
    window.GameSceneRefactored = GameSceneRefactored;
} 