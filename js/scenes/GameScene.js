class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        
        // Reposition bow to middle left side of screen
        this.BOW_X = 300; // Keep at 300 (positioned on left side)
        this.BOW_Y = 540; // Changed from 800 to 540 (middle height of 1080px screen)
        this.MAX_DRAG_DISTANCE = 200;
        this.SHOT_POWER = 0.13; // Increased shot power (from 0.07)
        this.MAX_SHOTS = 20; // Doubled from 10 for testing
        this.shotsRemaining = this.MAX_SHOTS;
        this.isAiming = false;
        this.revealPercentage = 0;
        this.targetPercentage = 85;
        this.UI_DEPTH = 1000; // UI depth for consistent layering
        
        // Voice congratulation messages
        this.voiceMessages = [
            "fantastic",
            "great_aim",
            "marvelous",
            "superb",
            "amazing",
            "wonderful",
            "nice_shot",
            "incredible"
        ];
        this.lastRevealPercentage = 0; // Track previous percentage for voice triggers
        this.voiceThreshold = 10; // Changed from 30 to 10 - percentage change needed to trigger voice message
        
        // We'll delegate these properties to the GameStateManager
        // But we keep references here for compatibility
        this.isLevelComplete = false;
        this.isGameOver = false;
        
        // Level management
        this.currentLevel = 1;
        
        // Initialize BlockTypes
        this.blockTypes = new BlockTypes();
        
        // Add bomb state tracking to prevent stuck game state
        this.bombState = {
            active: false,
            lastResetTime: 0,
            lastBombFired: 0,
            pendingReset: null,
            maxIdleTime: 20000, // Auto-reset if bomb is idle for 20 seconds
            autoResetTimer: null
        };
        
        // Add developer method to refresh UI
        if (window) {
            window.refreshGameUI = () => {
                console.log('Forcing UI refresh...');
                if (this.bombSelectorContainer) {
                    this.bombSelectorContainer.destroy();
                    this.bombSelectorContainer = null;
                }
                this.createBombSelector();
                console.log('UI refreshed!');
                return 'UI refreshed successfully!';
            };
        }
        
        // Audio properties
        this.bgMusic = null;
        this.victoryMusic = null;
        
        // Bomb types with names from Game Design Document
        this.BOMB_TYPES = {
            BLAST: 'blast_bomb',
            PIERCER: 'piercer_bomb',
            CLUSTER: 'cluster_bomb',
            STICKY: 'sticky_bomb',
            SHATTERER: 'shatterer_bomb',
            DRILLER: 'driller_bomb',  // Add Driller Girl bomb type
            RICOCHET: 'ricochet_bomb' // Add Ricochet bomb for level 2
        };
        
        // Bomb names based on Game Design Document
        this.BOMB_NAMES = {
            [this.BOMB_TYPES.BLAST]: 'Blast Girl',
            [this.BOMB_TYPES.PIERCER]: 'Piercer Girl',
            [this.BOMB_TYPES.CLUSTER]: 'Cluster Girl',
            [this.BOMB_TYPES.STICKY]: 'Sticky Girl',
            [this.BOMB_TYPES.SHATTERER]: 'Shatterer Girl',
            [this.BOMB_TYPES.DRILLER]: 'Driller Girl',   // Add Driller Girl name
            [this.BOMB_TYPES.RICOCHET]: 'Ricochet Girl'  // Add Ricochet Girl name
        };
        
        // Remaining bombs of each type - will be set by level manager
        this.bombsRemaining = {
            [this.BOMB_TYPES.BLAST]: 6,      // Doubled from 3 for testing
            [this.BOMB_TYPES.PIERCER]: 10,   // Doubled from 5 for testing
            [this.BOMB_TYPES.CLUSTER]: 2,    // Doubled from 1 for testing
            [this.BOMB_TYPES.STICKY]: 10,    // Doubled from 5 for testing
            [this.BOMB_TYPES.SHATTERER]: 2,  // Doubled from 1 for testing
            [this.BOMB_TYPES.DRILLER]: 6,    // Doubled from 3 for testing
            [this.BOMB_TYPES.RICOCHET]: 0    // Starts at 0, unlocked in level 2
        };
        
        // Current selected bomb type
        this.currentBombType = this.BOMB_TYPES.BLAST;
        
        // Debug mode for testing
        this.debugMode = true;
        
        // Configure the game for better performance with frequent pixel operations
        this.willReadPixelsFrequently = true;
    }

    preload() {
        // This method is called by Phaser before create()
        // We'll use it to preload voice audio assets
        try {
            console.log("Preloading voice message assets...");
            
            // Load voice message assets from local filesystem with proper absolute paths
            this.voiceMessages.forEach(message => {
                // Use relative path starting with assets, no leading slash
                // Do NOT include any server port or domain
                const path = `assets/audio/voice/${message}.mp3`;
                
                // Set both the key and the URL to the same path for consistent loading
                this.load.audio(`voice_${message}`, path);
                console.log(`Loading voice message: ${path}`);
            });
        } catch (error) {
            console.error("Error preloading voice assets:", error);
        }
    }

    create() {
        try {
            console.log(`GameScene: Creating scene for level ${this.currentLevel}`);
            
            // Clear any existing resources to prevent memory leaks
            this.clearResources();
            
            // Initialize the BombLauncher module
            this.bombLauncher = new BombLauncher(this);
            
            // Setup the game level first
            this.setupGame();
            
            // Initialize the game state manager
            this.gameStateManager = new GameStateManager(this);
            this.gameStateManager.init();
            
            // Initialize voice files
            this.initializeVoiceAssets();
            
            // Initialize the level manager
            this.initializeLevelManager().then(() => {
                // Now that we have the level manager initialized, setup bombs
                this.setupBombs();
                
                // Create initial bomb at the slingshot
                this.bombLauncher.createBomb(this.currentBombType || 'bomb');
                
                // Update bomb UI to reflect initial counts
                this.updateBombUI();
                
                // Setup the selection UI after bomb counts are set
                this.updateBombSelection();
                
                // Verify assets are loaded properly
                this.verifyAssets();
            }).catch(error => {
                console.error("Error initializing level manager:", error);
                // Use fallback configuration
                this.setupFallbackBombs();
                this.updateBombUI();
            });
            
            // Create bomb selector UI
            this.createBombSelector();
            
            // Create selection indicator
            this.createSelectionIndicator();
            
            // Initialize audio system with delay to prevent 'cut' errors
            this.time.delayedCall(500, () => {
                this.initializeAudio();
            });
            
            console.log("GameScene creation complete");
        } catch (error) {
            console.error("Error in create function:", error);
        }
    }
    
    // Add a new method to handle loading voice files from local paths
    loadVoiceFiles() {
        try {
            console.log("Loading voice files from local paths...");
            
            // Reset the loader to clear any previous configurations
            this.load.reset();
            
            // Force absolute paths with no server prefixes
            this.load.setBaseURL('');
            this.load.setPath('');
            
            // Load each voice file with explicit full paths
            this.voiceMessages.forEach(message => {
                // Use absolute path starting from assets folder
                const filePath = `assets/audio/voice/${message}.mp3`;
                const key = `voice_${message}`;
                
                // Load the file with the explicit path
                console.log(`Loading voice file: ${filePath}`);
                this.load.audio(key, filePath);
            });
            
            // Start loading and set up completion callback
            this.load.once('complete', () => {
                console.log("Voice files loading complete");
                
                // Verify which files were successfully loaded
                let loadedCount = 0;
                this.voiceMessages.forEach(message => {
                    const key = `voice_${message}`;
                    if (this.cache.audio.exists(key)) {
                        loadedCount++;
                        console.log(`Voice file loaded: ${key}`);
                    } else {
                        console.warn(`Failed to load voice file: ${key}`);
                    }
                });
                
                console.log(`Voice files loaded: ${loadedCount}/${this.voiceMessages.length}`);
                
                // Emit an event that voice files are ready
                this.events.emit('voiceFilesReady', loadedCount);
            });
            
            this.load.start();
            
        } catch (error) {
            console.error("Error loading voice files:", error);
        }
    }
    
    // Update initializeVoiceAssets to use the new dedicated method
    initializeVoiceAssets() {
        try {
            console.log("Initializing voice assets...");
            
            // Check for system type and adjust paths if needed
            const isBrowser = typeof window !== 'undefined' && typeof window.document !== 'undefined';
            console.log(`Environment: ${isBrowser ? 'Browser' : 'Other'}, Running from: ${window.location ? window.location.href : 'unknown'}`);
            
            // Use the dedicated method to load voice files
            this.loadVoiceFiles();
            
            console.log("Voice asset initialization complete");
            
        } catch (error) {
            console.error("Error initializing voice assets:", error);
        }
    }
    
    // Method to clear resources before creating new ones
    clearResources() {
        // Stop any existing audio
        if (this.audioManager && typeof this.audioManager.stopAll === 'function') {
            try {
                this.audioManager.stopAll();
            } catch (e) {
                console.warn("Error stopping audio:", e);
            }
        }
        
        // Clear any existing tweens
        if (this.tweens) {
            this.tweens.killAll();
        }
        
        // Clear any pending timers
        if (this.time) {
            this.time.removeAllEvents();
        }
        
        // Clear any existing UI elements
        if (this.bombSelectorContainer) {
            this.bombSelectorContainer.destroy();
            this.bombSelectorContainer = null;
        }
        
        // Clean up debug visuals if they exist
        if (this.debugVisuals && this.debugVisuals.length > 0) {
            this.debugVisuals.forEach(visual => {
                if (visual && typeof visual.destroy === 'function') {
                    visual.destroy();
                }
            });
            this.debugVisuals = [];
        }
        
        // Clear bomb references
        if (this.bomb) {
            try {
                this.bomb.destroy();
            } catch (e) {
                console.warn("Error destroying bomb:", e);
            }
            this.bomb = null;
        }
        
        // Clear any active sticky bombs
        if (this.activeStickyBombs && this.activeStickyBombs.length > 0) {
            this.activeStickyBombs.forEach(bomb => {
                try {
                    if (this.bombUtils) {
                        this.bombUtils.cleanupBombResources(bomb);
                    }
                } catch (e) {
                    console.warn("Error cleaning up sticky bomb:", e);
                }
            });
            this.activeStickyBombs = [];
        }
        
        console.log("Resources cleared successfully");
    }

    setupCamera() {
        // Set up the main camera to show the entire 1920x1080 game area without overflow
        const gameWidth = 1920;
        const gameHeight = 1080;
        
        // Set strict bounds for the main camera
        this.cameras.main.setBounds(0, 0, gameWidth, gameHeight);
        this.cameras.main.setBackgroundColor('#000000');
        this.cameras.main.setViewport(0, 0, gameWidth, gameHeight);
        
        // Make sure the camera is properly scaled according to the game config
        const scaleX = this.scale.width / gameWidth;
        const scaleY = this.scale.height / gameHeight;
        
        console.log(`Camera setup: Game dimensions ${this.scale.width}x${this.scale.height}, Scale: ${scaleX.toFixed(2)}x${scaleY.toFixed(2)}`);
        
        // Create a UI camera specifically for UI elements with highest depth
        this.uiCamera = this.cameras.add(0, 0, gameWidth, gameHeight);
        this.uiCamera.setName('UI Camera');
        this.uiCamera.setScroll(0, 0);
        this.uiCamera.setBackgroundColor(0x000000, 0); // Transparent background
        
        // Only include UI elements in this camera (depth >= UI_DEPTH)
        this.uiCamera.ignore(this.children.list.filter(item => item.depth < this.UI_DEPTH));
        
        // Ensure our world physics is larger than our camera bounds to prevent bombs from hitting invisible walls
        // Extend the physics world by 2000 pixels in each direction
        this.matter.world.setBounds(-2000, -2000, gameWidth + 4000, gameHeight + 4000);
        
        // Debug camera bounds if in debug mode
        if (this.debugMode) {
            console.log(`Main camera bounds: 0, 0, ${gameWidth}, ${gameHeight}`);
            console.log(`UI camera bounds: 0, 0, ${gameWidth}, ${gameHeight}`);
            console.log(`Physics world bounds: -2000, -2000, ${gameWidth + 4000}, ${gameHeight + 4000}`);
            console.log(`UI depth: ${this.UI_DEPTH}`);
        }
    }

    createBackground() {
        try {
            // Create a container with specific depth for layering
            this.backgroundContainer = this.add.container(0, 0);
            this.backgroundContainer.setDepth(0); // Lowest depth for background
            
            // Get the background image key for the current level - always use level number
            const backgroundKey = `background${this.currentLevel}`;
            
            console.log(`Attempting to load background with key: ${backgroundKey}`);
            console.log(`Available texture keys:`, Object.keys(this.textures.list).join(', '));
            
            // Check if level background was loaded successfully
            let bgImage;
            
            // Try loading with different possible keys for better compatibility
            if (this.textures.exists(backgroundKey)) {
                // Use the loaded background image
                bgImage = this.add.image(1920/2, 1080/2, backgroundKey);
                console.log(`Using level background image: ${backgroundKey}`);
            } else {
                // Last resort - create a colored background
                console.log(`No background image found for ${backgroundKey}, creating colored background`);
                bgImage = this.add.rectangle(1920/2, 1080/2, 1920, 1080, 0x87CEEB);
            }
            
            // Set background to lowest depth to ensure it's behind everything
            bgImage.setDepth(0);
            
            // Get the chibi image key for the current level - always use level number
            const chibiKey = `chibi_girl${this.currentLevel}`;
            
            console.log(`Attempting to load chibi with key: ${chibiKey}`);
            
            // Position the chibi image on the right side of the screen
            // Use 2/3 of the screen width for X position to move it rightward
            const chibiX = Math.floor(1920 * 0.7); // 70% of screen width
            const chibiY = 1080/2; // Centered vertically
            
            // Add the chibi image
            if (this.textures.exists(chibiKey)) {
                this.chibiImage = this.add.image(chibiX, chibiY, chibiKey);
                console.log(`Successfully created chibi image with key: ${chibiKey}`);
            } else {
                console.error(`Chibi image texture ${chibiKey} not found, creating placeholder`);
                // Create a placeholder for the chibi image
                const graphics = this.add.graphics();
                graphics.fillStyle(0xff00ff, 0.5); // Semi-transparent magenta
                graphics.fillRect(0, 0, 300, 600);
                graphics.generateTexture('placeholder_chibi', 300, 600);
                graphics.clear();
                
                this.chibiImage = this.add.image(chibiX, chibiY, 'placeholder_chibi');
            }
            
            this.chibiImage.setDepth(1); // Lower depth for chibi image
            
            // No scaling, use original size
            // Store dimensions for later reference
            const imageWidth = this.chibiImage.width;
            const imageHeight = this.chibiImage.height;
            
            // Set the image to be fully opaque
            this.chibiImage.setAlpha(1);
            
            // Log the new position
            console.log("Background created with chibi image positioned at:", 
                        chibiX, chibiY,
                        "with dimensions:", imageWidth, "x", imageHeight);
        } catch (error) {
            console.error("Error in createBackground:", error);
        }
    }

    createIceBlocks() {
        this.iceBlocks = [];
        this.blueVeils = []; // Array to store individual blue veil rectangles
        const blockSize = 15; // Reduced to 1/4 of original size (was 60)
        
        // Create a container for ice blocks with depth above chibi but below UI
        const blocksContainer = this.add.container(0, 0);
        blocksContainer.setDepth(2);
        
        // Get the chibi image dimensions - no scaling
        const imageWidth = this.chibiImage.width; 
        const imageHeight = this.chibiImage.height;
        
        // Calculate the image boundaries
        const imageX = this.chibiImage.x - imageWidth / 2;
        const imageY = this.chibiImage.y - imageHeight / 2;
        
        // Calculate grid dimensions
        const cols = Math.ceil(imageWidth / blockSize);
        const rows = Math.ceil(imageHeight / blockSize);
        
        console.log(`Chibi image at ${this.chibiImage.x}, ${this.chibiImage.y}`);
        console.log(`Image calculated bounds: ${imageX}, ${imageY}, ${imageWidth}x${imageHeight}`);
        console.log(`Creating ice blocks grid: ${cols}x${rows} over image area ${imageWidth}x${imageHeight}`);
        
        // Create a temporary canvas to check pixel data
        const tempCanvas = document.createElement('canvas');
        const tempContext = tempCanvas.getContext('2d');
        tempCanvas.width = imageWidth;
        tempCanvas.height = imageHeight;
        
        // Get the texture key of the chibi image
        const textureKey = this.chibiImage.texture.key;
        
        // Get the image data
        const frame = this.textures.getFrame(textureKey);
        const source = frame.source.image || frame.source.canvas;
        
        // Draw the image to our temp canvas
        tempContext.drawImage(source, 0, 0, imageWidth, imageHeight);
        
        // Alpha threshold - lower value to include more semi-transparent pixels at edges
        const alphaThreshold = 50; // Much lower threshold to catch edge pixels
        
        // Sample size for checking multiple pixels in the block area
        const sampleSize = 5; // Check more points in a 5x5 grid
        const sampleOffset = Math.floor(blockSize / (sampleSize + 1));
        
        // Create a 2D grid to track where we've placed blocks
        const blockGrid = Array(rows).fill().map(() => Array(cols).fill(false));
        
        // Variables to track total blocks for percentage calculations
        this.totalIceBlocks = 0;
        this.clearedIceBlocks = 0;
        
        // First pass: Find all core pixels that meet the alpha threshold
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Calculate screen position for the block
                const blockScreenX = imageX + col * blockSize + blockSize / 2;
                const blockScreenY = imageY + row * blockSize + blockSize / 2;
                
                // Sample multiple points within this block area
                let hasVisiblePixel = false;
                
                for (let sx = 0; sx < sampleSize; sx++) {
                    for (let sy = 0; sy < sampleSize; sy++) {
                        // Calculate sampling position in the original image
                        const offsetX = -Math.floor(sampleSize/2) + sx;
                        const offsetY = -Math.floor(sampleSize/2) + sy;
                        
                        const sampleX = Math.floor(col * blockSize) + offsetX * sampleOffset;
                        const sampleY = Math.floor(row * blockSize) + offsetY * sampleOffset;
                        
                        // Ensure we're within bounds
                        if (sampleX >= 0 && sampleX < imageWidth && 
                            sampleY >= 0 && sampleY < imageHeight) {
                            
                            try {
                                const pixelData = tempContext.getImageData(sampleX, sampleY, 1, 1).data;
                                // If any sampled pixel has alpha above threshold, mark block as visible
                                if (pixelData[3] >= alphaThreshold) {
                                    hasVisiblePixel = true;
                                    break;
                                }
                            } catch (e) {
                                console.error(`Error sampling pixel at ${sampleX},${sampleY}:`, e);
                            }
                        }
                    }
                    if (hasVisiblePixel) break;
                }
                
                if (hasVisiblePixel) {
                    blockGrid[row][col] = true;
                }
            }
        }
        
        // Second pass: Add padding around detected pixels to ensure edges are covered
        // This creates a thickness around the chibi image
        const paddingAmount = 1; // How many blocks of padding to add
        
        // Create a copy of the grid before adding padding
        const originalGrid = blockGrid.map(row => [...row]);
        
        // Add padding around each detected block
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (originalGrid[row][col]) {
                    // Add padding blocks around this block
                    for (let pr = -paddingAmount; pr <= paddingAmount; pr++) {
                        for (let pc = -paddingAmount; pc <= paddingAmount; pc++) {
                            const padRow = row + pr;
                            const padCol = col + pc;
                            
                            // Make sure we're in bounds
                            if (padRow >= 0 && padRow < rows && padCol >= 0 && padCol < cols) {
                                blockGrid[padRow][padCol] = true;
                            }
                        }
                    }
                }
            }
        }
        
        // Prepare to create exactly 3 dynamite blocks
        const dynamitePositions = [];
        const validPositions = [];
        
        // Collect all valid block positions first
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (blockGrid[row][col]) {
                    const blockScreenX = imageX + col * blockSize + blockSize / 2;
                    const blockScreenY = imageY + row * blockSize + blockSize / 2;
                    validPositions.push({x: blockScreenX, y: blockScreenY, row, col});
                }
            }
        }
        
        // Pick 3 random positions for dynamite blocks (if we have enough blocks)
        if (validPositions.length > 3) {
            // Shuffle the array to get random positions
            for (let i = validPositions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [validPositions[i], validPositions[j]] = [validPositions[j], validPositions[i]];
            }
            
            // Take the first 3 positions for dynamite
            for (let i = 0; i < 3; i++) {
                dynamitePositions.push({
                    x: validPositions[i].x,
                    y: validPositions[i].y,
                    row: validPositions[i].row,
                    col: validPositions[i].col
                });
            }
        }
        
        // Third pass: Create blocks based on our grid
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (!blockGrid[row][col]) continue;
                
                // Calculate screen position for the block
                const blockScreenX = imageX + col * blockSize + blockSize / 2;
                const blockScreenY = imageY + row * blockSize + blockSize / 2;
                
                // Determine block type
                let blockType = this.blockTypes.TYPES.STANDARD; // Default is standard
                
                // Check if this position is one of our dynamite positions
                const isDynamite = dynamitePositions.some(pos => 
                    pos.row === row && pos.col === col);
                
                if (isDynamite) {
                    blockType = this.blockTypes.TYPES.DYNAMITE;
                } else {
                    // For non-dynamite blocks, use weighted random for other special types
                    let blockTypeRand = Math.random();
                    if (blockTypeRand < 0.02) {
                        blockType = this.blockTypes.TYPES.ETERNAL;
                    } else if (blockTypeRand < 0.08) {
                        blockType = this.blockTypes.TYPES.STRONG;
                    }
                }
                
                // Base physics properties
                let physicsProps = {
                    isStatic: true,
                    friction: 0.01, 
                    restitution: 0.3
                };
                
                // Adjust properties based on block type
                if (blockType === 'bouncy') {
                    physicsProps.restitution = 1.0; // Bouncy blocks have high restitution
                }
                
                // Create ice block
                const block = this.matter.add.image(blockScreenX, blockScreenY, 'iceBlock', null, physicsProps);
                
                // Scale the blocks to match the new size
                block.setScale(blockSize / 40); // Original ice block is 40x40, scale up
                
                // Set a slight random rotation for some blocks
                if (Math.random() < 0.3) {
                    block.setRotation(Math.random() * 0.2 - 0.1);
                }
                
                // Set blocks to appear above the chibi image but below UI
                block.setDepth(4); // Higher than chibi (1) and blocksContainer (2) and blue veils (3)
                
                // Initialize block properties based on type
                block.isActive = true;
                block.blockType = blockType;
                
                // Set specific properties based on block type
                let veilColor, veilAlpha;
                
                switch(blockType) {
                    case this.blockTypes.TYPES.ETERNAL:
                        block.hitsLeft = this.blockTypes.getHitPoints(blockType);
                        veilColor = this.blockTypes.getColor(blockType);
                        veilAlpha = this.blockTypes.getAlpha(blockType);
                        break;
                    case this.blockTypes.TYPES.STRONG:
                        block.hitsLeft = this.blockTypes.getHitPoints(blockType);
                        veilColor = this.blockTypes.getColor(blockType);
                        veilAlpha = this.blockTypes.getAlpha(blockType);
                        break;
                    case this.blockTypes.TYPES.DYNAMITE:
                        block.hitsLeft = this.blockTypes.getHitPoints(blockType);
                        veilColor = this.blockTypes.getColor(blockType);
                        veilAlpha = this.blockTypes.getAlpha(blockType);
                        // Add a bit of pulsing to the dynamite block
                        this.tweens.add({
                            targets: block,
                            alpha: 0.7,
                            yoyo: true,
                            repeat: -1,
                            duration: 600
                        });
                        break;
                    case this.blockTypes.TYPES.BOUNCY: 
                        // This case is still used by boundary bouncy blocks
                        block.hitsLeft = this.blockTypes.getHitPoints(blockType);
                        veilColor = this.blockTypes.getColor(blockType);
                        veilAlpha = this.blockTypes.getAlpha(blockType);
                        // Add pulsating effect like the boundary bouncy blocks
                        this.tweens.add({
                            targets: block,
                            alpha: { from: 0.5, to: 0.8 },
                            yoyo: true,
                            repeat: -1,
                            duration: 1500,
                            ease: 'Sine.easeInOut'
                        });
                        break;
                    default: // standard
                        block.hitsLeft = this.blockTypes.getHitPoints(this.blockTypes.TYPES.STANDARD);
                        veilColor = this.blockTypes.getColor(this.blockTypes.TYPES.STANDARD);
                        veilAlpha = this.blockTypes.getAlpha(this.blockTypes.TYPES.STANDARD);
                }
                
                block.setAlpha(0.5);
                
                // Create a blue veil rectangle for this block with type-specific color
                const blueVeil = this.add.rectangle(
                    blockScreenX, 
                    blockScreenY, 
                    blockSize, 
                    blockSize, 
                    veilColor,
                    veilAlpha
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
                
                // Count each ice block for percentage calculations
                this.totalIceBlocks++;
            }
        }
        
        // Ensure chibi image remains fully opaque after adding blue veils
        this.chibiImage.setAlpha(1);
        
        // Reset revealed pixels counter based on total ice blocks
        this.revealedPixels = 0;
        this.revealPercentage = 0;
        
        console.log(`Created ${this.iceBlocks.length} ice blocks with blue veils`);
        // Log the number of dynamite blocks created
        console.log(`Created exactly ${dynamitePositions.length} dynamite blocks`);
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
            veil.setAlpha(veil.alpha * (0.6 + Math.random() * 0.15));
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

    createBow() {
        try {
            // Create a silver bow shape using graphics
            const bowGraphics = this.add.graphics();
            
            // Silver color with slight gradient
            const silverColor = 0xC0C0C0;
            const darkSilver = 0x909090;
            
            // Create bow arc
            bowGraphics.lineStyle(5, silverColor, 1);
            bowGraphics.beginPath();
            // Draw a semicircle arc for the bow
            bowGraphics.arc(0, 0, 40, Phaser.Math.DegToRad(150), Phaser.Math.DegToRad(390), false);
            bowGraphics.strokePath();
            
            // Add some details to make it look like a bow
            bowGraphics.lineStyle(3, darkSilver, 1);
            // Bow grip (middle part)
            bowGraphics.fillStyle(darkSilver, 1);
            bowGraphics.fillRect(-5, -10, 10, 20);
            
            // Generate a texture from the graphics
            bowGraphics.generateTexture('bow', 100, 100);
            bowGraphics.clear();
            
            // Create the bow image using the generated texture
            this.bow = this.add.image(this.BOW_X, this.BOW_Y, 'bow');
            this.bow.setOrigin(0.5, 0.5);
            this.bow.setDepth(10); // Above all game elements but below UI
            
            // Add bowstring (elastic line)
            this.elasticLine = this.add.graphics();
            this.elasticLine.setDepth(11); // Above bow
            
            // Draw the default bowstring (a straight line when not pulled)
            this.updateBowstring();
            
        } catch (error) {
            console.error("Error in createBow:", error);
        }
    }
    
    // Helper method to update the bowstring appearance
    updateBowstring() {
        if (this.elasticLine) {
            this.elasticLine.clear();
            this.elasticLine.lineStyle(2, 0xFFFFFF, 0.8); // White, slightly transparent
            this.elasticLine.beginPath();
            this.elasticLine.moveTo(this.BOW_X, this.BOW_Y - 40); // Top of bow
            this.elasticLine.lineTo(this.BOW_X, this.BOW_Y + 40); // Bottom of bow
            this.elasticLine.stroke();
        }
    }

    createBomb() {
        console.log("Creating bomb");
        
        // Create inactive bomb at slingshot position - simple settings
        this.bomb = this.matter.add.image(this.BOW_X, this.BOW_Y - 20, 'bomb', null);
        
        this.bomb.setCircle(30); // Set physics circle radius to 30 (half of 60x60)
        this.bomb.setStatic(true);
        this.bomb.setVisible(true);
        this.bomb.setDepth(12); // Above slingshot and elastic line
        
        // Set bomb size to 60x60 (reduced from 80x80)
        this.bomb.setDisplaySize(60, 60);
        
        if (this.debugMode) {
            console.log("Bomb created:", this.bomb);
        }
    }

    setupInput() {
        try {
            // Pointer down event - works for both mouse and touch
            this.input.on('pointerdown', (pointer) => {
                try {
                    if (this.shotsRemaining <= 0 || !this.bombLauncher || !this.bombLauncher.bomb || !this.bombLauncher.bomb.visible) return;
                    
                    // Immediately log touch events for debugging
                    if (this.debugMode) {
                        console.log('Pointer down detected:', 
                            pointer.x, pointer.y, 
                            'isMobile:', !this.game.device.os.desktop, 
                            'type:', pointer.type);
                    }
                    
                    // Check if click/touch is near the bomb - use larger detection area on mobile
                    const touchRadius = this.game.device.os.desktop ? 80 : 120;
                    const distance = Phaser.Math.Distance.Between(
                        pointer.x, pointer.y, 
                        this.bombLauncher.bomb.x, this.bombLauncher.bomb.y
                    );
                    
                    if (distance < touchRadius) {
                        // Provide immediate visual feedback
                        this.bombLauncher.bomb.setTint(0xffff00);
                        
                        this.isAiming = true;
                        
                        // Immediately start drawing the trajectory
                        if (pointer && pointer.x !== undefined && pointer.y !== undefined) {
                            this.bombLauncher.drawTrajectoryFromPointer(pointer);
                        }
                        
                        // For touch devices, immediately move the bomb to the touch position
                        // This creates a more responsive feel
                        if (!this.game.device.os.desktop) {
                            // Validate pointer before passing to BombLauncher
                            if (pointer && pointer.x !== undefined && pointer.y !== undefined) {
                                // Update bomb position through the BombLauncher
                                this.bombLauncher.drawTrajectoryFromPointer(pointer);
                            }
                        }
                        
                        // Mobile touch feedback - pulse the bomb when touched
                        this.tweens.add({
                            targets: this.bombLauncher.bomb,
                            scale: { from: 1, to: 1.2 },
                            duration: 100,
                            yoyo: true,
                            ease: 'Sine.easeInOut'
                        });
                        
                        // Add touch indicator text for mobile users
                        if (this.touchIndicator) this.touchIndicator.destroy();
                        
                        // Add mobile-specific instructions
                        if (!this.game.device.os.desktop) {
                            this.addMobilePulseHint();
                        }
                    }
                } catch (error) {
                    console.error("Error in pointerdown handler:", error);
                }
            });
            
            // Handle pointer movement for aiming
            this.input.on('pointermove', (pointer) => {
                try {
                    if (!this.isAiming || !this.bombLauncher || !this.bombLauncher.bomb) return;
                    
                    // Validate pointer before passing to BombLauncher
                    if (pointer && pointer.x !== undefined && pointer.y !== undefined) {
                        // Force clear any existing trajectory and elastic line first
                        if (this.bombLauncher.trajectoryGraphics) {
                            this.bombLauncher.trajectoryGraphics.clear();
                        }
                        if (this.bombLauncher.elasticLine) {
                            this.bombLauncher.elasticLine.clear();
                        }
                        
                        // Use drawTrajectoryFromPointer for consistent drawing
                        this.bombLauncher.drawTrajectoryFromPointer(pointer);
                    }
                } catch (error) {
                    console.error("Error in pointermove handler:", error);
                }
            });
            
            // Handle pointer up for launching
            this.input.on('pointerup', (pointer) => {
                try {
                    if (!this.isAiming || !this.bombLauncher) return;
                    
                    // Clear any indicators
                    if (this.touchIndicator) {
                        this.touchIndicator.destroy();
                        this.touchIndicator = null;
                    }
                    
                    // Reset bomb tint
                    if (this.bombLauncher.bomb) {
                        this.bombLauncher.bomb.clearTint();
                    }
                    
                    // Validate pointer exists before accessing it
                    if (!pointer || pointer.x === undefined || pointer.y === undefined) {
                        console.warn("Invalid pointer in pointerup event");
                        this.isAiming = false;
                        return;
                    }
                    
                    try {
                        // Launch the bomb using the BombLauncher
                        if (this.bombLauncher.launchBomb(pointer)) {
                            // Bomb was successfully launched
                            
                            // Add haptic feedback for mobile devices if supported
                            if (window.navigator && window.navigator.vibrate) {
                                window.navigator.vibrate(100); // 100ms vibration on launch
                            }
                            
                            // Decrement bomb count
                            this.decrementBombCount(this.currentBombType);
                            
                            // Decrement shots
                            this.shotsRemaining--;
                            this.events.emit('updateShots', this.shotsRemaining);
                            
                            // Reset aiming flag
                            this.isAiming = false;
                            
                            // Set timeout to create a new bomb if shots remain
                            this.time.delayedCall(3000, () => {
                                if (this.shotsRemaining > 0) {
                                    if (!this.bombLauncher.bomb) {
                                        this.bombLauncher.createBomb(this.currentBombType || 'bomb');
                                    }
                                } else {
                                    // Check level completion or game over if no shots remain
                                    this.checkLevelCompletion();
                                }
                            });
                        } else {
                            // Bomb launch failed, reset aiming state
                            this.isAiming = false;
                        }
                    } catch (error) {
                        console.error("Error launching bomb:", error);
                        if (this.debugText) this.debugText.setText(`ERROR: ${error.message}`);
                        
                        // Try to recover
                        this.isAiming = false;
                        if (this.bombLauncher) {
                            this.bombLauncher.createBomb(this.currentBombType || 'bomb');
                        }
                    }
                } catch (error) {
                    console.error("Error in pointerup handler:", error);
                }
            });
            
            // Add specific handling for touch cancel events (important for mobile)
            this.input.on('pointercancel', () => {
                if (this.isAiming && this.bombLauncher && this.bombLauncher.bomb) {
                    // Reset the bomb position if touch is cancelled
                    this.isAiming = false;
                    
                    // Create a new bomb at the slingshot position
                    this.bombLauncher.createBomb(this.currentBombType || 'bomb');
                    
                    // Clear any indicators
                    if (this.touchIndicator) {
                        this.touchIndicator.destroy();
                        this.touchIndicator = null;
                    }
                }
            });
            
            // Log if input setup is complete
            if (this.debugMode) {
                console.log("Input setup complete");
            }
        } catch (error) {
            console.error("Error in setupInput:", error);
        }
    }
    
    // Add a pulsing hint for mobile users to show where to touch
    addMobilePulseHint() {
        if (!this.bomb || this.hintActive) return;
        
        // Only show on mobile devices
        if (!this.game.device.os.desktop) {
            this.hintActive = true;
            
            // Create a pulsing circle around the bomb
            const hintCircle = this.add.circle(
                this.bomb.x, 
                this.bomb.y, 
                30, 
                0xffffff, 
                0.5
            ).setDepth(11);
            
            // Add a hint text
            const hintText = this.add.text(
                this.bomb.x,
                this.bomb.y - 50,
                "Tap & Drag",
                {
                    font: '18px Arial',
                    fill: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 3
                }
            ).setOrigin(0.5).setDepth(11);
            
            // Pulse animation
            this.tweens.add({
                targets: [hintCircle],
                scale: { from: 1, to: 1.5 },
                alpha: { from: 0.5, to: 0 },
                duration: 1000,
                repeat: 3,
                onComplete: () => {
                    hintCircle.destroy();
                    hintText.destroy();
                    this.hintActive = false;
                }
            });
            
            // Fade text after animations
            this.tweens.add({
                targets: [hintText],
                alpha: { from: 1, to: 0 },
                delay: 3000,
                duration: 1000
            });
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
                let bombReflected = false;
                
                // Process in a try-catch block to avoid complete game failure on collision errors
                try {
                    // Get the active bomb - either from bombLauncher (preferred) or direct reference
                    const activeBomb = (this.bombLauncher && this.bombLauncher.bomb) ? this.bombLauncher.bomb : this.bomb;
                    
                    // Cache bomb info before any processing in case the bomb gets destroyed
                    let cachedBombInfo = null;
                    if (activeBomb && activeBomb.scene) {
                        cachedBombInfo = {
                            x: activeBomb.x,
                            y: activeBomb.y,
                            type: activeBomb.bombType || this.BOMB_TYPES.BLAST,
                            velocity: activeBomb.body?.velocity ? 
                                {x: activeBomb.body.velocity.x, y: activeBomb.body.velocity.y} : 
                                {x: 0, y: 0}
                        };
                    }
                    
                    // Skip all collision processing if the bomb is still at the slingshot
                    if (activeBomb && activeBomb.isAtSlingshot) {
                        console.log("Ignoring collision for bomb still at slingshot");
                        return;
                    }
                    
                    // Skip collision processing if the bomb has already exploded
                    if (activeBomb && activeBomb.hasExploded) {
                        console.log("Ignoring collision for already exploded bomb");
                        return;
                    }
                    
                    // Skip collision processing if no active bomb exists
                    if (!activeBomb || !activeBomb.active || !activeBomb.body) {
                        console.log("No active bomb to process collisions for");
                        return;
                    }

                    // Process each collision pair
                    for (let i = 0; i < pairs.length; i++) {
                        try {
                            const bodyA = pairs[i].bodyA;
                            const bodyB = pairs[i].bodyB;
                            
                            if (!bodyA || !bodyB) continue;
                                
                            // Skip this collision if either body is null or undefined
                            if (!bodyA.gameObject && !bodyA.label) continue;
                            if (!bodyB.gameObject && !bodyB.label) continue;
                            
                            // Find the bomb and block objects from the collision
                            let bombBody, blockBody;
                            
                            if (bodyA.gameObject === activeBomb) {
                                bombBody = bodyA;
                                blockBody = bodyB;
                            } else if (bodyB.gameObject === activeBomb) {
                                bombBody = bodyB;
                                blockBody = bodyA;
                            } else {
                                // Neither body is the bomb, so skip this pair
                                continue;
                            }

                            // Capture the current bomb position for explosion effects
                            const bombX = activeBomb.x;
                            const bombY = activeBomb.y;
                            const bombType = activeBomb.bombType || this.BOMB_TYPES.BLAST;
                            
                            // Special handling for reflective border - these don't have gameObjects
                            if (!blockBody.gameObject && blockBody.label === 'reflectiveBorder') {
                                // Only bounce if we have a valid bomb
                                if (activeBomb && activeBomb.active) {
                                    // Create boundary collision with reflective properties
                                    const borderBlock = { 
                                        body: blockBody, 
                                        x: (blockBody.bounds.min.x + blockBody.bounds.max.x) / 2,
                                        y: (blockBody.bounds.min.y + blockBody.bounds.max.y) / 2
                                    };
                                    
                                    console.log("Reflective border collision detected", {
                                        borderX: borderBlock.x,
                                        borderY: borderBlock.y,
                                        bombX: activeBomb.x,
                                        bombY: activeBomb.y
                                    });
                                    
                                    // Handle reflection through handleBouncyBlock
                                    this.handleBouncyBlock(borderBlock, activeBomb);
                                    bombReflected = true;
                                    
                                    // Track bounce for ricochet bombs
                                    if (activeBomb && activeBomb.bombType === this.BOMB_TYPES.RICOCHET) {
                                        activeBomb.isRicochet = true;
                                        activeBomb.lastBounceTime = Date.now();
                                        activeBomb.lastBounceX = activeBomb.x;
                                        activeBomb.lastBounceY = activeBomb.y;
                                    }
                                    
                                    continue; // Skip normal block handling
                                }
                            }
                            
                            // Make sure blockBody has a gameObject
                            if (!blockBody || !blockBody.gameObject) {
                                continue;
                            }
                            
                            // Check if the other object is an ice block
                            const block = blockBody.gameObject;
                            
                            // Make sure block is still valid and active
                            if (!block || !block.scene) {
                                console.log("Block no longer exists during collision");
                                continue;
                            }
                            
                            // Check if it's a valid ice block - additional safeguards for null checks
                            if (block && block.isActive && this.iceBlocks && this.iceBlocks.includes(block)) {
                                // Mark that the bomb has hit an ice block
                                if (activeBomb) {
                                    activeBomb.hasHitIceBlock = true;
                                    console.log("Bomb has hit an ice block, marked as hasHitIceBlock=true");
                                }
                                
                                // Check if it's a bouncy block
                                if (block.blockType === 'bouncy') {
                                    // Handle bounce logic except for sticky bombs
                                    const bombType = activeBomb ? (activeBomb.bombType || this.BOMB_TYPES.BLAST) : this.BOMB_TYPES.BLAST;
                                    
                                    if (bombType !== this.BOMB_TYPES.STICKY) {
                                        // Check that bomb still exists before handling bounce
                                        if (activeBomb && activeBomb.body) {
                                            this.handleBouncyBlock(block, activeBomb);
                                            bombReflected = true;
                                            
                                            // Track bounce for ricochet bombs
                                            if (activeBomb && activeBomb.bombType === this.BOMB_TYPES.RICOCHET) {
                                                activeBomb.isRicochet = true;
                                                activeBomb.lastBounceTime = Date.now();
                                                activeBomb.lastBounceX = activeBomb.x;
                                                activeBomb.lastBounceY = activeBomb.y;
                                            }
                                        }
                                        
                                        continue; // Skip normal bomb behavior
                                    }
                                }
                                
                                // Handle dynamite blocks if we have a blast or shatterer bomb
                                if (block.blockType === 'dynamite' && 
                                    (bombType === this.BOMB_TYPES.BLAST || bombType === this.BOMB_TYPES.SHATTERER)) {
                                    // Dynamite blocks create additional explosions when hit
                                    this.createDynamiteDestroyEffect(block.x, block.y);
                                    
                                    // Destroy additional blocks in radius
                                    this.destroyBlocksInRadius(block.x, block.y, 200);
                                    
                                    // Make sure to destroy the dynamite block itself
                                    this.destroyIceBlock(block);
                                    
                                    // Need to also process normal bomb behavior, so we don't continue here
                                }
                                
                                // Handle different bomb types
                                if (!hasExploded && !bombStuck) {
                                    // Mark the bomb as exploded to prevent double explosions
                                    if (activeBomb) {
                                        activeBomb.hasExploded = true;
                                    }
                                    
                                    try {
                                        switch(bombType) {
                                            case this.BOMB_TYPES.BLAST:
                                                // Standard explosion with radius damage
                                                this.bombUtils.handleBlastBomb(bombX, bombY);
                                                hasExploded = true;
                                                break;
                                                
                                            case this.BOMB_TYPES.PIERCER:
                                                // Get velocity before accessing the bomb's properties
                                                let velocity = {x: 0, y: 0};
                                                if (activeBomb && activeBomb.body) {
                                                    velocity = activeBomb.body.velocity;
                                                } else if (cachedBombInfo) {
                                                    velocity = cachedBombInfo.velocity;
                                                }
                                                // Creates a line of destruction in its direction
                                                this.bombUtils.handlePiercerBomb(bombX, bombY, velocity);
                                                hasExploded = true;
                                                break;
                                                
                                            case this.BOMB_TYPES.CLUSTER:
                                                // Creates multiple smaller explosions
                                                this.bombUtils.handleClusterBomb(bombX, bombY);
                                                hasExploded = true;
                                                break;
                                                
                                            case this.BOMB_TYPES.STICKY:
                                                // Sticks to a block and explodes after delay
                                                if (block && block.isActive && this.iceBlocks.includes(block)) {
                                                    // Handle sticky behavior
                                                    if (this.bombUtils && this.bombUtils.handleStickyBomb) {
                                                        this.bombUtils.handleStickyBomb(bombX, bombY, block);
                                                    } else {
                                                        // Direct method call if not using BombUtils
                                                        this.handleStickyBomb(bombX, bombY, block);
                                                    }
                                                    bombStuck = true;
                                                    
                                                    // IMPORTANT: Do NOT mark as exploded for sticky bombs
                                                    // They need to remain until triggered by another bomb
                                                    if (activeBomb) {
                                                        activeBomb.hasExploded = false;
                                                        activeBomb.isSticky = true;
                                                    }
                                                    
                                                    // Log successful sticky
                                                    console.log("Sticky bomb attached to block and waiting for trigger");
                                                    
                                                    // Schedule creation of a new bomb after a delay
                                                    this.time.delayedCall(1500, () => {
                                                        const noBombAvailable = (!this.bombLauncher || !this.bombLauncher.bomb) && !this.bomb;
                                                        if (this.shotsRemaining > 0 && noBombAvailable) {
                                                            console.log("Creating new bomb after placing sticky bomb (from collision handler)");
                                                            this.resetBomb();
                                                        }
                                                    });
                                                } else {
                                                    // If not sticking to a valid target, just explode
                                                    if (this.bombUtils && this.bombUtils.handleBlastBomb) {
                                                        this.bombUtils.handleBlastBomb(bombX, bombY);
                                                    } else {
                                                        this.handleBlastBomb(bombX, bombY);
                                                    }
                                                    hasExploded = true;
                                                    
                                                    // Mark the bomb as exploded
                                                    if (activeBomb) {
                                                        activeBomb.hasExploded = true;
                                                    }
                                                }
                                                break;
                                                
                                            case this.BOMB_TYPES.SHATTERER:
                                                // Creates a powerful blast that's effective against tough blocks
                                                this.bombUtils.handleShattererBomb(bombX, bombY);
                                                hasExploded = true;
                                                break;
                                                            
                                            case this.BOMB_TYPES.DRILLER:
                                                // Handle the driller bomb specially if it collides with a block
                                                try {
                                                    console.log("Driller bomb collision detected");
                                                    
                                                    // Store velocity before doing anything else
                                                    let velocityX = 0;
                                                    let velocityY = 0;
                                                    
                                                    if (activeBomb && activeBomb.body && activeBomb.body.velocity) {
                                                        velocityX = activeBomb.body.velocity.x;
                                                        velocityY = activeBomb.body.velocity.y;
                                                        // Store velocity on the bomb object for later use
                                                        activeBomb.storedVelocityX = velocityX;
                                                        activeBomb.storedVelocityY = velocityY;
                                                        
                                                        console.log(`Stored driller velocity: ${velocityX}, ${velocityY}`);
                                                    } else if (cachedBombInfo && cachedBombInfo.velocity) {
                                                        velocityX = cachedBombInfo.velocity.x;
                                                        velocityY = cachedBombInfo.velocity.y;
                                                        
                                                        console.log(`Using cached velocity for driller: ${velocityX}, ${velocityY}`);
                                                    }
                                                    
                                                    console.log(`Driller bomb collision with velocity: ${velocityX}, ${velocityY}`);
                                                    
                                                    // IMPORTANT: Mark the bomb as a driller before processing 
                                                    // to prevent destruction in the cleanup phase
                                                    if (activeBomb) {
                                                        activeBomb.isDriller = true;
                                                        activeBomb.hasExploded = false;
                                                        console.log("Driller bomb - not destroying as it needs to drill");
                                                    }
                                                    
                                                    // Process the driller bomb with the stored velocity
                                                    let drillerBomb = null;
                                                    if (this.bombUtils && this.bombUtils.handleDrillerBomb) {
                                                        console.log("Using BombUtils.handleDrillerBomb");
                                                        drillerBomb = this.bombUtils.handleDrillerBomb(bombX, bombY, block, velocityX, velocityY);
                                                    } else {
                                                        console.log("Using GameScene.handleDrillerBomb directly");
                                                        drillerBomb = this.handleDrillerBomb(bombX, bombY, block);
                                                    }
                                                    
                                                    // Make sure we have a reference to the driller bomb
                                                    if (!this.activeDrillerBombs) {
                                                        this.activeDrillerBombs = [];
                                                    }
                                                    
                                                    // Only add if we don't already have this bomb
                                                    if (drillerBomb && !this.activeDrillerBombs.includes(drillerBomb)) {
                                                        this.activeDrillerBombs.push(drillerBomb);
                                                        console.log("Added driller bomb to activeDrillerBombs array");
                                                    }
                                                    
                                                    bombStuck = true; // Mark as stuck rather than exploded
                                                    
                                                    // Don't mark as exploded for driller bombs
                                                    if (activeBomb) {
                                                        activeBomb.hasExploded = false;
                                                    }
                                                } catch (error) {
                                                    console.error("Error handling driller bomb:", error);
                                                    // Fallback to blast bomb if driller fails
                                                    this.bombUtils.handleBlastBomb(bombX, bombY);
                                                    hasExploded = true;
                                                }
                                                break;
                                                        
                                            case this.BOMB_TYPES.RICOCHET:
                                                // Handle ricochet bomb - doesn't explode on contact, just bounces
                                                if (this.bombUtils && this.bombUtils.handleRicochetBomb) {
                                                    // Get velocity before accessing bomb properties
                                                    let velocity = {x: 0, y: 0};
                                                    if (activeBomb && activeBomb.body) {
                                                        velocity = activeBomb.body.velocity;
                                                    } else if (cachedBombInfo) {
                                                        velocity = cachedBombInfo.velocity;
                                                    }
                                                    
                                                    // We don't mark hasExploded as true for ricochet bombs since they continue bouncing
                                                    // But we do need to fix the hasExploded flag we set above
                                                    if (activeBomb) {
                                                        activeBomb.hasExploded = false;
                                                    }
                                                    
                                                    // We don't return/cleanup after handleRicochetBomb since it doesn't destroy the bomb
                                                    this.bombUtils.handleRicochetBomb(bombX, bombY, block, velocity);
                                                } else {
                                                    // Fallback to blast bomb if handler not available
                                                    console.warn("Ricochet bomb handler not available, using blast bomb");
                                                    this.bombUtils.handleBlastBomb(bombX, bombY);
                                                    hasExploded = true;
                                                }
                                                break;
                                                            
                                            default:
                                                // Default fallback for unknown bomb types
                                                this.bombUtils.handleBlastBomb(bombX, bombY);
                                                hasExploded = true;
                                                break;
                                        }
                                    } catch (error) {
                                        console.error("Error handling bomb type:", error);
                                        
                                        // Emergency recovery - make sure to nullify bomb references
                                        if (activeBomb) {
                                            if (activeBomb.scene) {
                                                activeBomb.destroy();
                                            }
                                            
                                            // Clean up both references
                                            if (this.bombLauncher) {
                                                this.bombLauncher.bomb = null;
                                            }
                                            this.bomb = null;
                                        }
                                        
                                        // Force a reset to recover
                                        this.time.delayedCall(1000, () => this.resetBomb());
                                    }
                                    
                                    // Destroy the bomb if it exploded (not if it's sticky and stuck)
                                    // Also don't destroy ricochet bombs as they need to keep bouncing
                                    // Don't destroy driller bombs either
                                    if (hasExploded && activeBomb && 
                                        bombType !== this.BOMB_TYPES.RICOCHET && 
                                        bombType !== this.BOMB_TYPES.STICKY &&
                                        bombType !== this.BOMB_TYPES.DRILLER) {
                                        // Clean up any countdown timers for ricochet bombs
                                        if (activeBomb.countdownText && activeBomb.countdownText.scene) {
                                            activeBomb.countdownText.destroy();
                                            activeBomb.countdownText = null;
                                        }
                                        if (activeBomb.countdown) {
                                            activeBomb.countdown.remove();
                                            activeBomb.countdown = null;
                                        }
                                        
                                        // Extra check to ensure we don't destroy special bombs
                                        if (activeBomb.isSticky || activeBomb.isDriller) {
                                            console.log(`Not destroying ${bombType} bomb - it's marked as special`);
                                        } else {
                                            // Destroy the bomb
                                            activeBomb.destroy();
                                            
                                            // Clear both references
                                            if (this.bombLauncher) {
                                                this.bombLauncher.bomb = null;
                                                this.bombLauncher.bombState.active = false;
                                            }
                                            this.bomb = null;
                                        }
                                    } else if (bombType === this.BOMB_TYPES.DRILLER || activeBomb && activeBomb.isDriller) {
                                        console.log("Driller bomb - not destroying as it needs to drill");
                                        // Ensure hasExploded is false for driller bombs
                                        if (activeBomb) {
                                            activeBomb.hasExploded = false;
                                        }
                                    } else if (bombType === this.BOMB_TYPES.STICKY || (activeBomb && activeBomb.isSticky)) {
                                        console.log("Sticky bomb - not destroying as it needs to stay stuck until triggered");
                                        // Ensure hasExploded is false for sticky bombs
                                        if (activeBomb) {
                                            activeBomb.hasExploded = false;
                                            activeBomb.isSticky = true;
                                        }
                                    }
                                }
                            }
                        } catch (error) {
                            console.error("Error processing collision pair:", error);
                        }
                    }
                    
                    // If the bomb exploded or got stuck, reset the bomb
                    if ((hasExploded || bombStuck) && this.shotsRemaining > 0) {
                        this.time.delayedCall(1000, () => {
                            // Check both references
                            const noBombAvailable = (!this.bombLauncher || !this.bombLauncher.bomb) && !this.bomb;
                            if (noBombAvailable) {
                                this.resetBomb();
                            }
                        });
                    }
                    
                } catch (error) {
                    console.error("Error in collision handler:", error);
                    
                    // Safety cleanup to prevent the game from getting stuck
                    this.time.delayedCall(1000, () => {
                        const noBombAvailable = (!this.bombLauncher || !this.bombLauncher.bomb) && !this.bomb;
                        if (this.shotsRemaining > 0 && noBombAvailable) {
                            this.resetBomb();
                        }
                    });
                }
            });
        } catch (error) {
            console.error("Error in setupCollisions:", error);
        }
    }
    
    handleBlastBomb(x, y) {
        // Standard explosion behavior - radius effect
        this.blockUtils.createExplosion(x, y);
        this.destroyBlocksInRadius(x, y, 150);
        
        // Check if any sticky bombs are in range and trigger them
        this.triggerStickyBomb(x, y, 150);
    }
    
    handlePiercerBomb(x, y, providedVelocity) {
        // Piercer bomb creates a line of destruction in its travel direction
        let velocity;
        
        // Handle the case where velocity is provided externally (for stopped bombs)
        if (providedVelocity) {
            velocity = providedVelocity;
            console.log("Using provided velocity for piercer bomb:", velocity);
        } 
        // Try to get velocity from active bomb
        else if (this.bomb && this.bomb.body && this.bomb.body.velocity) {
            velocity = this.bomb.body.velocity;
            console.log("Using current bomb velocity for piercer bomb:", velocity);
        } 
        // Fallback to default downward velocity
        else {
            console.log("No velocity available for piercer bomb, using default downward direction");
            velocity = { x: 0, y: 1 };
        }
        
        // Normalize velocity to get direction
        const magnitude = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        const dirX = magnitude > 0 ? velocity.x / magnitude : 0;
        const dirY = magnitude > 0 ? velocity.y / magnitude : 1;
        
        // Create a narrower but longer explosion effect
        const lineLength = 300;
        
        // Create visual effect - smaller explosion
        this.blockUtils.createExplosion(x, y);
        
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
        this.blockUtils.createExplosion(x, y);
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
                this.blockUtils.createMiniExplosion(clusterX, clusterY);
                // Destroy blocks in smaller radius
                this.destroyBlocksInRadius(clusterX, clusterY, 70);
                // Check for sticky bombs in mini explosion
                this.triggerStickyBomb(clusterX, clusterY, 70);
            });
        }
    }

    destroyBlocksInRadius(x, y, radius) {
        if (!this.iceBlocks) return;
        
        // Create a list to track blocks to be destroyed
        const blocksToDestroy = [];
        const blocksToDamage = [];
        const dynamiteToTrigger = [];
        
        // Check distance of each block from explosion center
        this.iceBlocks.forEach(block => {
            if (block && block.isActive) {
                const distance = Phaser.Math.Distance.Between(x, y, block.x, block.y);
                
                if (distance < radius) {
                    if (block.blockType === this.blockTypes.TYPES.DYNAMITE) {
                        // Add dynamite blocks to a special trigger list
                        // with a short delay so they explode sequentially
                        const delay = (distance / radius) * 50; // shorter delay for chain reactions
                        dynamiteToTrigger.push({ block, delay });
                    } else if (block.blockType === this.blockTypes.TYPES.BOUNCY) {
                        // Bouncy blocks don't get destroyed, they reflect bombs
                        // However, we'll add a visual indication they were hit
                        this.time.delayedCall(10, () => {
                            this.blockUtils.createBouncyHitEffect(block.x, block.y);
                        });
                    } else if (block.blockType === this.blockTypes.TYPES.ETERNAL || block.blockType === this.blockTypes.TYPES.STRONG) {
                        // Add multi-hit blocks to damage list
                        const delay = (distance / radius) * 100;
                        blocksToDamage.push({ block, delay });
                    } else {
                        // Regular blocks get destroyed
                        const delay = (distance / radius) * 100;
                        blocksToDestroy.push({ block, delay });
                    }
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
        
        // Process block damage with delays
        blocksToDamage.forEach(({ block, delay }) => {
            this.time.delayedCall(delay, () => {
                if (block && block.isActive) {
                    this.damageIceBlock(block);
                }
            });
        });
        
        // Process dynamite triggers with delays
        dynamiteToTrigger.forEach(({ block, delay }) => {
            this.time.delayedCall(delay, () => {
                if (block && block.isActive) {
                    // Create explosion at dynamite location
                    this.blockUtils.createExplosion(block.x, block.y);
                    
                    // Destroy the dynamite block
                    this.destroyIceBlock(block);
                    
                    // Destroy additional blocks in radius
                    this.destroyBlocksInRadius(block.x, block.y, 120); // Dynamite has smaller radius
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
        
        // Create shatter effect using BlockUtils
        this.blockUtils.createBlockShatter(block);
        
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
                    duration: 5000, // 5 seconds, matching the veil
                    ease: 'Linear',
                    onComplete: () => {
                        // Remove the highlight when the animation completes
                        if (block.blueVeil.highlight && block.blueVeil.highlight.scene) {
                            block.blueVeil.highlight.destroy();
                        }
                    }
                });
            }
            
            // Start a tween to fade out the blue veil over 5 seconds
            this.tweens.add({
                targets: block.blueVeil,
                alpha: 0,
                duration: 5000, // 5 seconds
                ease: 'Linear',
                onComplete: () => {
                    // Remove the veil when the animation completes
                    if (block.blueVeil && block.blueVeil.scene) {
                        block.blueVeil.destroy();
                    }
                }
            });
        }
        
        // Special effects based on block type
        if (block.blockType === this.blockTypes.TYPES.DYNAMITE) {
            // Dynamite blocks get additional particle effects
            this.blockUtils.createDynamiteDestroyEffect(block.x, block.y);
        }
        
        // Ensure chibi image remains fully opaque
        this.chibiImage.setAlpha(1);
        
        // Update revealed percentage based on ice blocks cleared
        this.clearedIceBlocks++;
        const previousPercentage = this.revealPercentage;
        this.revealPercentage = Math.min(100, Math.floor((this.clearedIceBlocks / this.totalIceBlocks) * 100));
        
        // Log for debugging
        if (this.debugMode) {
            console.log(`Cleared ${this.clearedIceBlocks} of ${this.totalIceBlocks} blocks (${this.revealPercentage}%)`);
        }
        
        // Emit update to UI with more detailed information
        this.events.emit('updatePercentage', this.revealPercentage);
        
        // When percentage reaches key milestones, make the image clearer
        if ((previousPercentage < 20 && this.revealPercentage >= 20) ||
            (previousPercentage < 50 && this.revealPercentage >= 50) ||
            (previousPercentage < 80 && this.revealPercentage >= 80)) {
            // Add a little flash effect to highlight the milestone
            this.cameras.main.flash(300, 255, 255, 255, 0.3);
        }
        
        // Check if we've revealed enough for a congratulatory voice message
        const percentageChange = this.revealPercentage - this.lastRevealPercentage;
        if (percentageChange >= this.voiceThreshold) {
            if (this.debugMode) {
                console.log(`Voice message triggered at ${this.revealPercentage}% (${percentageChange}% change)`);
            }
            
            // Play voice message with text display
            this.playRandomVoiceMessage();
            
            // For larger percentage changes, show special effect text
            if (percentageChange >= 20) {
                this.displaySpecialClearText(percentageChange);
            }
            
            // Update last reveal percentage to current to avoid multiple triggers
            this.lastRevealPercentage = this.revealPercentage;
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
    


    checkLevelCompletion() {
        // Forward to gameStateManager
        this.gameStateManager.checkLevelCompletion();
            
        // For compatibility, sync the state variables
        this.isLevelComplete = this.gameStateManager.isLevelComplete;
        this.isGameOver = this.gameStateManager.isGameOver;
    }
    
    // Method to display the victory background with a nice transition
    displayVictoryBackground() {
        // Forward to gameStateManager
        this.gameStateManager.displayVictoryBackground();
    }

    checkGameOver() {
        // Forward to gameStateManager
        this.gameStateManager.checkGameOver();
        
        // For compatibility, sync the state variables
        this.isLevelComplete = this.gameStateManager.isLevelComplete;
        this.isGameOver = this.gameStateManager.isGameOver;
    }

    resetBomb() {
        try {
            console.log("resetBomb called, creating new bomb");
            
            // Check if BombLauncher is available
            if (this.bombLauncher) {
                // Use BombLauncher's createBomb method
                console.log("Using BombLauncher to create new bomb of type:", this.currentBombType);
                this.bombLauncher.createBomb(this.currentBombType);
                
                // Store reference to the bombLauncher's bomb for backward compatibility
                this.bomb = this.bombLauncher.bomb;
            } else {
                // Legacy method - direct creation in GameScene
                console.log("Legacy creation: Direct in GameScene");
                
                // Create inactive bomb at slingshot position
                this.bomb = this.matter.add.image(this.BOW_X, this.BOW_Y - 20, this.currentBombType || 'blast_bomb');
                
                this.bomb.setCircle(30);
                this.bomb.setStatic(true);
                this.bomb.setVisible(true);
                this.bomb.setDepth(12);
                
                // Set bomb size to 60x60
                this.bomb.setDisplaySize(60, 60);
                
                // Create elastic line
                this.updateBowstring();
            }
            
            // Add mobile hint for touch devices
            if (!this.game.device.os.desktop) {
                this.addMobilePulseHint();
            }
            
            console.log("New bomb created successfully:", this.bomb ? this.bomb.texture.key : "No bomb");
            
        } catch (error) {
            console.error("Error in resetBomb:", error);
        }
    }
    
    updateUI() {
        try {
            if (this.ui && typeof this.ui.setTexts === 'function') {
                // Update UI with current game values
                this.ui.setTexts(
                    `Bombs: ${this.shotsRemaining}`, 
                    `Score: ${this.score || 0}`
                );
                
                // Make sure UI elements have proper depth
                if (this.ui.bombsText) {
                    this.ui.bombsText.setDepth(this.UI_DEPTH + 1);
                }
                if (this.ui.scoreText) {
                    this.ui.scoreText.setDepth(this.UI_DEPTH + 1);
                }
            }
        } catch (error) {
            console.error("Error updating UI:", error);
        }
    }
    
    createDynamicBomb(x, y, bombType, forceX, forceY) {
        // Update bomb state tracking
        this.bombState.lastBombFired = Date.now();
        
        // Reset the last reveal percentage for the new shot
        this.lastRevealPercentage = this.revealPercentage;
        if (this.debugMode) {
            console.log(`Reset voice tracking: current reveal is ${this.revealPercentage}%`);
        }
        
        // Set bomb properties based on type
        let bombProperties = {
            restitution: 0.9, // Increased for better bouncing in ultra-low gravity
            friction: 0.01, // Reduced for less surface friction
            density: 0.0003, // Keep the same density
            frictionAir: 0.001 // Reduced from 0.004 to 0.001 for less air resistance
        };
        
        // Adjust properties for special bomb types
        switch(bombType) {
            case this.BOMB_TYPES.PIERCER:
                // Piercer has lower friction and higher density
                bombProperties.friction = 0.002;
                bombProperties.frictionAir = 0.0008; // Reduced from 0.003 to 0.0008
                bombProperties.density = 0.0005;
                break;
                
            case this.BOMB_TYPES.CLUSTER:
                // Cluster is a bit lighter
                bombProperties.density = 0.0002;
                bombProperties.frictionAir = 0.001; // Reduced from 0.005 to 0.001
                break;
                
            case this.BOMB_TYPES.STICKY:
                // Sticky bombs should be a bit lighter too
                bombProperties.density = 0.0003;
                bombProperties.frictionAir = 0.001; // Reduced from 0.004 to 0.001
                break;
                
            case this.BOMB_TYPES.SHATTERER:
                // Shatterer is heavier but still needs adjustment
                bombProperties.density = 0.0004;
                bombProperties.frictionAir = 0.0009; // Reduced from 0.0036 to 0.0009
                break;
                
            case this.BOMB_TYPES.DRILLER:
                // Driller needs good momentum
                bombProperties.density = 0.0004;
                bombProperties.frictionAir = 0.0008; // Reduced from 0.003 to 0.0008
                break;
                
            case this.BOMB_TYPES.RICOCHET:
                // Ricochet needs perfect bouncing
                bombProperties.restitution = 1.0; // Perfect elasticity for bouncing
                bombProperties.friction = 0.001; // Very low friction for smooth bounces
                bombProperties.frictionAir = 0.0005; // Very low air friction to maintain speed
                bombProperties.density = 0.0003; // Same density
                // Set special property for ricochet bomb to identify it
                this.isRicochetBomb = true;
                break;
        }
        
        // Create the bomb with appropriate properties - use bombType directly as it already contains the correct texture name
        this.bomb = this.matter.add.image(x, y, bombType, null, bombProperties);
        this.bomb.setCircle(30); // Set physics circle radius to 30 (half of 60x60)
        this.bomb.bombType = bombType; // Store the bomb type for later use
        this.bomb.setDepth(12); // Same depth as static bomb
        
        // Set bomb size to 60x60 (reduced from 80x80)
        this.bomb.setDisplaySize(60, 60);
        
        // Mark as a launched bomb (not static at slingshot)
        this.bomb.isLaunched = true;
        this.bomb.hasHitIceBlock = false;
        
        // Add special properties for Ricochet bombs
        if (bombType === this.BOMB_TYPES.RICOCHET) {
            this.bomb.isRicochet = true;
            
            // Initialize bounce tracking properties
            this.bomb.lastBounceTime = 0;
            this.bomb.lastBounceX = x;
            this.bomb.lastBounceY = y;
            
            // Create a countdown display for the ricochet bomb
            const countdownDuration = 5000; // 5 seconds in ms
            this.bomb.bounceStartTime = Date.now();
            this.bomb.bounceDuration = countdownDuration;
            
            // Text to show countdown
            this.bomb.countdownText = this.add.text(x, y - 30, '5.0', {
                font: '16px Arial',
                fill: '#FFFFFF',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
            this.bomb.countdownText.setDepth(20);
            
            // Update countdown each frame
            this.bomb.countdown = this.time.addEvent({
                delay: 100, // Update every 100ms
                callback: () => {
                    if (!this.bomb || !this.bomb.scene) return;
                    
                    const elapsed = Date.now() - this.bomb.bounceStartTime;
                    const remaining = Math.max(0, (this.bomb.bounceDuration - elapsed) / 1000);
                    
                    // Update the text
                    if (this.bomb.countdownText && this.bomb.countdownText.scene) {
                        this.bomb.countdownText.setText(remaining.toFixed(1));
                        this.bomb.countdownText.setPosition(this.bomb.x, this.bomb.y - 30);
                        
                        // Change color as time gets lower
                        if (remaining < 1) {
                            this.bomb.countdownText.setFill('#FF0000'); // Red when < 1 second
                        } else if (remaining < 2) {
                            this.bomb.countdownText.setFill('#FFFF00'); // Yellow when < 2 seconds
                        }
                    }
                    
                    // Explode when time is up
                    if (remaining <= 0 && this.bomb && !this.bomb.hasExploded) {
                        if (this.bombUtils) {
                            this.bombUtils.explodeRicochetBomb(this.bomb);
                        } else {
                            // Fallback
                            this.handleRicochetBomb(this.bomb.x, this.bomb.y);
                            if (this.bomb && this.bomb.scene) {
                                this.bomb.destroy();
                            }
                            this.bomb = null;
                        }
                    }
                },
                callbackScope: this,
                loop: true
            });
        }
        
        // Update bomb state
        this.bombState.active = true;
        
        // Apply impulse (instant force)
        this.matter.body.applyForce(this.bomb.body, 
            { x: x, y: y }, 
            { x: forceX, y: forceY });
        
        // Track when the bomb was launched
        this.bomb.launchTime = this.time.now;
        
        // Set up a timer to check for missed bombs after 15 seconds (increased from 8 seconds)
        this.bombMissTimer = this.time.delayedCall(15000, () => {
            // If the bomb still exists, is launched, and hasn't hit an ice block, consider it a miss
            if (this.bomb && this.bomb.isLaunched && !this.bomb.hasHitIceBlock) {
                if (this.debugMode) {
                    console.log("Bomb missed all ice blocks for 15 seconds, destroying it");
                }
                
                // Create a small "fizzle" effect
                this.createFizzleEffect(this.bomb.x, this.bomb.y);
                
                // Destroy the bomb
                if (this.bomb && this.bomb.scene) {
                    this.bomb.destroy();
                }
                this.bomb = null;
                
                // Update bomb state
                this.bombState.active = false;
                
                // Reset bomb for next shot if shots remain after a small delay
                // Store the timeout ID so we can cancel it if needed
                if (this.pendingReset) {
                    clearTimeout(this.pendingReset);
                }
                
                // Record when we're scheduling a pending reset
                this.bombState.pendingReset = Date.now();
                
                this.pendingReset = setTimeout(() => {
                    this.pendingReset = null;
                    this.bombState.pendingReset = null;
                    
                    if (this.shotsRemaining > 0) {
                        this.resetBomb();
                    } else {
                        // Check level completion or game over if no shots remain
                        this.checkLevelCompletion();
                    }
                }, 1000);
            }
        });
        
        // Set up an emergency auto-reset timer as a fallback
        // This ensures that even if all other systems fail, we'll still reset after a maximum time
        if (this.bombState.autoResetTimer) {
            clearTimeout(this.bombState.autoResetTimer);
        }
        
        this.bombState.autoResetTimer = setTimeout(() => {
            // Only run if the current bomb is still the one we created
            if (this.bomb && this.bomb.isLaunched && !this.bomb.hasHitIceBlock) {
                if (this.debugMode) {
                    console.warn("EMERGENCY AUTO-RESET: Bomb active too long, forcing reset");
                }
                this.forceResetGameState();
            }
        }, this.bombState.maxIdleTime);
        
        // Fallback: try direct velocity set if needed
        if (this.debugMode) {
            this.time.delayedCall(100, () => {
                if (this.bomb && this.bomb.body && 
                    Math.abs(this.bomb.body.velocity.x) < 0.1 && 
                    Math.abs(this.bomb.body.velocity.y) < 0.1) {
                    console.log("Force didn't work, trying velocity directly");
                    const dx = this.BOW_X - x;
                    const dy = (this.BOW_Y - 30) - y;
                    this.bomb.setVelocity(dx * 0.2, dy * 0.2);
                }
            });
        }
    }
    
    // Create a small fizzle effect when a bomb misses
    createFizzleEffect(x, y) {
        // Create a small particle effect for a "fizzle" or "failure"
        const particles = this.add.particles('particle');
        particles.setDepth(6); // Same depth as other effects
        
        const emitter = particles.createEmitter({
            speed: { min: 30, max: 60 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.6, end: 0 },
            lifespan: 800,
            blendMode: 'ADD',
            tint: 0xaaaaaa // Gray particles for a "fizzle"
        });
        
        // Emit particles at bomb position
        emitter.explode(15, x, y);
        
        // Small "fizzle" sound if available
        if (this.sound && this.sound.add) {
            try {
                const fizzleSound = this.sound.add('fizzle', { volume: 0.3 });
                fizzleSound.play();
            } catch (e) {
                console.log("Fizzle sound not available:", e);
                // Try to use an existing sound at a different rate as a fallback
                try {
                    const fallbackSound = this.sound.add('explosion');
                    fallbackSound.play({ volume: 0.2, rate: 0.5 });
                } catch (e) {
                    console.log("Fallback sound not available either");
                }
            }
        }
        
        // Destroy the particle system after emissions complete
        this.time.delayedCall(1000, () => {
            particles.destroy();
        });
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
        console.log("Setting up input handlers");
        
        // Check if input handlers are already set up to avoid duplicate handlers
        if (this.inputHandlersSetup) {
            console.log("Input handlers already set up, skipping");
            return;
        }
        
        // Mark input handlers as set up
        this.inputHandlersSetup = true;
        
        // Setup global input handlers here
        this.input.on('pointerdown', (pointer) => {
            // Only handle if bomb is reset and ready
            if (!this.isBombActive() && !this.isLevelComplete && !this.isGameOver) {
                // Check if click is on a bomb selector button (handled by that component)
                if (this.bombSelectorContainer && this.bombSelectorContainer.input 
                    && this.bombSelectorContainer.getBounds().contains(pointer.x, pointer.y)) {
                    return; // Let the container handle its own clicks
                }
                
                // Otherwise, start aiming
                this.isAiming = true;
                
                // Add a subtle screen effect to indicate aiming has started
                if (this.cameras && this.cameras.main) {
                    this.cameras.main.shake(100, 0.002);
                }
                
                // If BombLauncher is available, update bomb position
                if (this.bombLauncher && this.bombLauncher.bomb) {
                    this.bombLauncher.drawTrajectoryFromPointer(pointer);
                }
            }
        });
        
        this.input.on('pointerup', (pointer) => {
            if (this.isAiming && !this.isLevelComplete && !this.isGameOver) {
                this.isAiming = false;
                
                // Clear trajectory line when shot is fired or aiming canceled
                this.clearTrajectory();
                
                // Only fire if min distance is moved (to avoid accidental taps)
                // Check if click is on a bomb selector button (handled by that component)
                if (this.bombSelectorContainer && this.bombSelectorContainer.input 
                    && this.bombSelectorContainer.getBounds().contains(pointer.x, pointer.y)) {
                    return; // Let the container handle its own clicks
                }
                
                // Fire the bomb if we are not clicking on UI
                this.fireBomb(pointer);
            }
        });
        
        this.input.on('pointermove', (pointer) => {
            if (this.isAiming && !this.isLevelComplete && !this.isGameOver) {
                // Draw trajectory line
                this.drawTrajectoryFromPointer(pointer);
            }
        });
        
        // Add a keyboard shortcut for toggling debug visuals (D key)
        this.input.keyboard.on('keydown-D', () => {
            this.toggleDebugVisuals();
            
            // Also update BombLauncher debug mode if available
            if (this.bombLauncher) {
                this.bombLauncher.debugMode = this.debugMode;
            }
        });
        
        console.log("Input handlers set up successfully");
    }
    
    // Method to toggle debug visuals on/off
    toggleDebugVisuals() {
        // Toggle the debug mode flag
        this.debugMode = !this.debugMode;
        console.log(`Debug visuals ${this.debugMode ? 'enabled' : 'disabled'}`);
        
        // Toggle debug mode in BombLauncher if available
        if (this.bombLauncher && this.bombLauncher.toggleDebugMode) {
            this.bombLauncher.toggleDebugMode(this.debugMode);
        }
        
        // Clean up existing debug visuals if any
        if (this.debugVisuals && this.debugVisuals.length > 0) {
            this.debugVisuals.forEach(visual => {
                if (visual && typeof visual.destroy === 'function') {
                    visual.destroy();
                }
            });
            this.debugVisuals = [];
        }
        
        // If debug mode is now on, recreate the debug visuals
        if (this.debugMode && this.boundaryBlocks && this.boundaryBlocks.length > 0) {
            this.debugVisuals = this.debugVisuals || [];
            
            // Create debug visuals for each boundary
            this.boundaryBlocks.forEach(border => {
                if (border && border.body) {
                    const bounds = border.body.bounds;
                    const width = bounds.max.x - bounds.min.x;
                    const height = bounds.max.y - bounds.min.y;
                    const x = bounds.min.x + width/2;
                    const y = bounds.min.y + height/2;
                    
                    const debugVisual = this.add.rectangle(x, y, width, height, 0x00ff00, 0.3);
                    debugVisual.setDepth(10); // Above everything
                    debugVisual.setStrokeStyle(1, 0xffffff);
                    
                    this.debugVisuals.push(debugVisual);
                }
            });
            
            console.log(`Created ${this.debugVisuals.length} debug visuals for reflective borders`);
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
            
            // Initial update to display correct values
            this.updateUI();
            
            // Debug message
            if (this.debugMode) {
                console.log("UI initialized with correct depth settings");
            }
            
            console.log("UI created successfully");
        } catch (error) {
            console.error("Error initializing UI:", error);
        }
    }
    
    resetLevel() {
        // Reset game state via GameStateManager
        if (this.gameStateManager) {
            this.gameStateManager.resetGameState();
            
            // Sync state variables for compatibility
            this.isLevelComplete = this.gameStateManager.isLevelComplete;
            this.isGameOver = this.gameStateManager.isGameOver;
        } else {
            // Fallback if gameStateManager is not available
            this.isLevelComplete = false;
            this.isGameOver = false;
        }
        
        // Reset other game state variables
        this.gameOver = false;
        this.shotsRemaining = this.MAX_SHOTS;
        this.revealPercentage = 0;
        
        // Reset the ice block counters
        this.clearedIceBlocks = 0;
        
        // Reset bomb counts
        this.bombsRemaining = {
            [this.BOMB_TYPES.BLAST]: 10,
            [this.BOMB_TYPES.PIERCER]: 7,
            [this.BOMB_TYPES.CLUSTER]: 5,
            [this.BOMB_TYPES.STICKY]: 3,
            [this.BOMB_TYPES.SHATTERER]: 2,
            [this.BOMB_TYPES.DRILLER]: 3  // Add initial count for Driller Girl bombs
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
                this.bombUtils.cleanupBombResources(stickyBomb);
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
            console.log("Cleaning up previous completion veil during level reset");
            
            // If it's a container, destroy all children
            if (this.veilContainer) {
                this.veilContainer.setVisible(false);
                this.veilContainer.destroy(true);
                this.veilContainer = null;
            } else if (this.completionVeil.scene) {
                this.completionVeil.setVisible(false);
                this.completionVeil.destroy();
            }
            
            this.completionVeil = null;
        }
        
        if (this.frostGraphics && this.frostGraphics.scene) {
            this.frostGraphics.setVisible(false);
            this.frostGraphics.destroy();
            this.frostGraphics = null;
        }
        
        // Reset the completionVeilRemoved flag
        this.completionVeilRemoved = false;
        
        // Use our new method to create a completion veil that matches the chibi shape
        this.createCompletionVeil();
        
        // Update UI
        this.events.emit('updateShots', this.shotsRemaining);
        this.events.emit('updatePercentage', this.revealPercentage);
    }
    
    update(time, delta) {
        try {
            // Handle game state
            if (this.gameState) {
                this.gameState.update(time, delta);
            }
            
            // Check for bombs that need auto-creation
            const noBombAvailable = (!this.bombLauncher || !this.bombLauncher.bomb) && !this.bomb;
            if (noBombAvailable && this.shotsRemaining > 0) {
                const hasActiveDrillers = this.activeDrillerBombs && this.activeDrillerBombs.some(bomb => bomb.isActive);
                const hasActiveSticky = this.activeStickyBombs && this.activeStickyBombs.length > 0;
                
                // Check if we need to auto-create a bomb
                // No drillers/sticky are currently creating their bombs, so it's safe to create one
                if (!hasActiveDrillers && !this.isCreatingNewBomb) {
                    // Log this condition when debugging launcher reset issues
                    console.log("Auto-creating new bomb in update - no bomb available and no active drillers");
                    
                    // Set a flag to prevent multiple resets
                    this.isCreatingNewBomb = true;
                    
                    this.time.delayedCall(300, () => {
                        // Double check if we still need to create a bomb
                        const stillNoBomb = (!this.bombLauncher || !this.bombLauncher.bomb) && !this.bomb;
                        if (stillNoBomb && this.shotsRemaining > 0) {
                            console.log("Calling resetBomb from update loop");
                            this.resetBomb();
                        }
                        this.isCreatingNewBomb = false;
                    });
                }
            }
            
            // Handle active sticky bombs
            if (this.activeStickyBombs && this.activeStickyBombs.length > 0) {
                // Process all active sticky bombs to ensure effects follow their position
                this.activeStickyBombs.forEach(bomb => {
                    if (!bomb || !bomb.isActive) return;
                    
                    // Update particle emitter position if it exists
                    if (bomb.emitter && bomb.emitter.manager && bomb.emitter.manager.scene) {
                        bomb.emitter.setPosition(bomb.x, bomb.y);
                    }
                    
                    // Update visual effect position if it exists
                    if (bomb.visualEffect && bomb.visualEffect.scene) {
                        bomb.visualEffect.setPosition(bomb.x, bomb.y);
                    }
                    
                    // If the bomb has a sprite, update its position
                    if (bomb.bombSprite && bomb.bombSprite.scene) {
                        bomb.bombSprite.setPosition(bomb.x, bomb.y);
                    }
                });
            }
            
            // Handle active driller bombs - ensure they continue drilling
            if (this.activeDrillerBombs && this.activeDrillerBombs.length > 0) {
                // Only log this periodically to avoid spamming
                if (time % 5000 < 20) {
                    console.log(`${this.activeDrillerBombs.length} active driller bombs`);
                }
                
                // Process all active driller bombs
                this.activeDrillerBombs.forEach(bomb => {
                    if (!bomb || !bomb.isActive) return;
                    
                    // Update particle emitter position if it exists
                    if (bomb.emitter && bomb.emitter.manager && bomb.emitter.manager.scene) {
                        bomb.emitter.setPosition(bomb.x, bomb.y);
                    }
                    
                    // Update driller effect position if it exists
                    if (bomb.drillerEffect && bomb.drillerEffect.scene) {
                        bomb.drillerEffect.setPosition(bomb.x, bomb.y);
                    }
                    
                    // If the bomb has a sprite, update its position
                    if (bomb.bombSprite && bomb.bombSprite.scene) {
                        bomb.bombSprite.setPosition(bomb.x, bomb.y);
                    }
                    
                    // Check if this is an old driller bomb (over 8 seconds) and hasn't been deactivated
                    // This is a failsafe
                    const now = Date.now();
                    if (bomb.createdAt && (now - bomb.createdAt > 8000)) {
                        console.warn(`Driller bomb has been active for over 8s - forcing completion`);
                        bomb.isActive = false;
                        
                        // Stop the drill interval if it exists
                        if (bomb.drillInterval) {
                            bomb.drillInterval.remove();
                            bomb.drillInterval = null;
                        }
                        
                        // Create a final explosion
                        if (this.bombUtils) {
                            this.bombUtils.createDrillerExplosion(bomb.x, bomb.y);
                        }
                        
                        // Clear out any bomb references that might be preventing reset
                        if (this.bomb === bomb.bombSprite) {
                            this.bomb = null;
                        }
                        
                        if (this.bombLauncher && this.bombLauncher.bomb === bomb.bombSprite) {
                            this.bombLauncher.bomb = null;
                            this.bombLauncher.bombState.active = false;
                        }
                        
                        // Destroy blocks in the ending radius
                        this.destroyBlocksInRadius(bomb.x, bomb.y, 180);
                        
                        // Clean up resources
                        if (bomb.drillerEffect && bomb.drillerEffect.scene) {
                            bomb.drillerEffect.destroy();
                        }
                        
                        if (bomb.particles && bomb.particles.scene) {
                            bomb.particles.destroy();
                        }
                        
                        // Check for bomb reset
                        this.time.delayedCall(500, () => {
                            const noBombAvailable = (!this.bombLauncher || !this.bombLauncher.bomb) && !this.bomb;
                            if (this.shotsRemaining > 0 && noBombAvailable) {
                                console.log("Creating new bomb from failsafe");
                                this.resetBomb();
                            }
                        });
                    }
                });
                
                // Clean up inactive driller bombs
                this.activeDrillerBombs = this.activeDrillerBombs.filter(bomb => 
                    bomb && bomb.isActive);
            }
            
            // Check for bombs that miss everything
            if (this.bombLauncher) {
                this.bombLauncher.checkForMissedBombs();
                
                // Also check for bombs that have stopped moving without hitting anything
                this.bombLauncher.checkForStoppedBombs();
            }
            
            // Make UI elements follow the camera
            this.updateUI();
            
            // Apply any game settings
            if (this.applyGameSettings) {
                this.applyGameSettings(delta);
            }
            
            // Check for ricochet bomb timers
            if (this.bombLauncher && this.bombLauncher.bomb && 
                this.bombLauncher.bomb.texture && 
                this.bombLauncher.bomb.texture.key === this.BOMB_TYPES.RICOCHET) {
                
                const bomb = this.bombLauncher.bomb;
                
                // Only process for active launched ricochet bombs
                if (bomb.isRicochet && bomb.isLaunched && !bomb.hasExploded) {
                    // Track time since last bounce
                    const now = this.time.now;
                    const timeSinceLastBounce = bomb.lastBounceTime ? (now - bomb.lastBounceTime) : 0;
                    
                    // If it's been a while since the last bounce (more than 3 seconds), explode the bomb
                    if (timeSinceLastBounce > 3000) {
                        if (this.bombUtils && this.bombUtils.explodeRicochetBomb) {
                            this.bombUtils.explodeRicochetBomb(bomb);
                        } else {
                            // Fallback to exploding as a regular bomb
                            this.handleBombExplosion(bomb.x, bomb.y, bomb.texture.key);
                            
                            // Destroy the bomb
                            bomb.destroy();
                            this.bombLauncher.bomb = null;
                            this.bomb = null;
                        }
                    }
                    
                    // Create a trail effect for active ricochet bombs
                    if (timeSinceLastBounce < 3000 && bomb.isRicochet) {
                        // Add a trail effect every 100ms
                        if (!bomb.lastTrailTime || (now - bomb.lastTrailTime) > 100) {
                            bomb.lastTrailTime = now;
                            
                            if (this.bombUtils && this.bombUtils.createRicochetTrail) {
                                this.bombUtils.createRicochetTrail(bomb);
                            }
                        }
                    }
                }
            }
            
            // Add original game behavior for fps counter, etc.
            if (this.debugMode && this.frameCounter !== undefined) {
                this.frameCounter++;
                
                // Update FPS counter every second
                if (time > this.lastFPSUpdate + 1000) {
                    this.lastFPS = this.frameCounter;
                    this.frameCounter = 0;
                    this.lastFPSUpdate = time;
                    
                    if (this.debugText) {
                        this.debugText.setText(`FPS: ${this.lastFPS} | Shots: ${this.shotsRemaining}`);
                    }
                }
            }
        } catch (error) {
            console.error("Error in update function:", error);
            
            // Ensure game doesn't get stuck due to an error
            if (!this.failsafeTimer) {
                this.failsafeTimer = this.time.delayedCall(2000, () => {
                    this.failsafeTimer = null;
                    if (this.checkGameState) {
                        this.checkGameState();
                    }
                });
            }
        }
    }
    
    // Helper method to handle bomb explosions safely
    handleBombExplosion(bombX, bombY, bombType) {
        try {
                            // Handle the explosion based on bomb type
                            switch(bombType) {
                                case this.BOMB_TYPES.BLAST:
                                    this.bombUtils.handleBlastBomb(bombX, bombY);
                                    break;
                                case this.BOMB_TYPES.PIERCER:
                                    this.bombUtils.handlePiercerBomb(bombX, bombY);
                                    break;
                                case this.BOMB_TYPES.CLUSTER:
                                    this.bombUtils.handleClusterBomb(bombX, bombY);
                                    break;
                                case this.BOMB_TYPES.STICKY:
                    this.bombUtils.handleBlastBomb(bombX, bombY); // Fallback to blast for sticky
                                    break;
                                case this.BOMB_TYPES.SHATTERER:
                                    this.bombUtils.handleShattererBomb(bombX, bombY);
                                    break;
                                case this.BOMB_TYPES.DRILLER:
                    this.bombUtils.handleBlastBomb(bombX, bombY); // Fallback for driller
                    break;
                case this.BOMB_TYPES.RICOCHET:
                    this.handleRicochetBomb(bombX, bombY);
                                    break;
                                default:
                    this.bombUtils.handleBlastBomb(bombX, bombY); // Default fallback
                    break;
                            }
                            
            // Reset the bomb after explosion
                                this.resetBomb();
        } catch (error) {
            console.error("Error handling bomb explosion:", error);
            // Force a reset as a recovery mechanism
            this.resetBomb();
        }
    }
    
    init(data) {
        try {
            // Initialize game state
            this.score = 0;
            
            // Reset bomb counters completely
            this.shotsRemaining = this.MAX_SHOTS;
            this.isAiming = false;
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
            
            // Carry over data from previous scenes
            if (data) {
                // Handle any input from parent scene
                this.currentLevel = data.levelNumber || 1;
                console.log(`Starting level ${this.currentLevel}`);
                
                // Force cleanup of any existing UI
                if (this.bombSelectorContainer) {
                    this.bombSelectorContainer.destroy();
                    this.bombSelectorContainer = null;
                    
                    // Force clear references to buttons
                    this.blastButton = null;
                    this.piercerButton = null;
                    this.clusterButton = null;
                    this.stickyButton = null;
                    this.shattererButton = null;
                    this.drillerButton = null;
                    this.ricochetButton = null;
                    this.selectionIndicator = null;
                    
                    console.log("Cleaned up previous bomb selector UI");
                }
                
                // Stop any existing audio
                if (this.audioManager && this.audioManager.bgMusic) {
                    try {
                        this.audioManager.bgMusic.stop();
                        console.log("Stopped background music from previous level");
                    } catch (err) {
                        console.warn("Error stopping previous level music:", err);
                    }
                }
            }
            
            // Fully reset bombs for the new level
            this.resetBombCounts();
            
            console.log("Initialization complete for level", this.currentLevel);
        } catch (error) {
            console.error("Error in init:", error);
        }
    }
    
    // New helper method to reset bomb counts when changing levels
    resetBombCounts() {
        console.log("Completely resetting bomb counts for new level");
        // Reset all bomb counts to zero to prepare for new level configuration
        this.bombsRemaining = {
            [this.BOMB_TYPES.BLAST]: 0,
            [this.BOMB_TYPES.PIERCER]: 0,
            [this.BOMB_TYPES.CLUSTER]: 0,
            [this.BOMB_TYPES.STICKY]: 0,
            [this.BOMB_TYPES.SHATTERER]: 0,
            [this.BOMB_TYPES.DRILLER]: 0,
            [this.BOMB_TYPES.RICOCHET]: 0
        };
    }

    createBombSelector() {
        // Create bomb selection buttons at the bottom of the screen
        // Ensuring they're well within the visible 1920x1080 area
        const gameHeight = 1080;
        const buttonY = gameHeight - 90; // Position 90px from bottom edge (reduced from 100px)
        const spacing = 130; // Reduce spacing for smaller buttons (was 160)
        
        // Calculate starting X position to center the bomb selector
        const gameWidth = 1920;
        const startX = gameWidth / 2 - (spacing * 2.5); // Center the 6 buttons
        
        // Create a container for the bomb selector UI with proper depth
        this.bombSelectorContainer = this.add.container(0, 0);
        this.bombSelectorContainer.setDepth(this.UI_DEPTH);
        
        // Create background panel for bomb selector with border for better visibility
        const selectorBg = this.add.rectangle(
            gameWidth / 2,
            buttonY,
            gameWidth,
            100, // Smaller height (was 120)
            0x000000,
            0.5 // Reduced opacity from 0.7 to 0.5 for better visibility
        );
        selectorBg.setDepth(this.UI_DEPTH - 1); // Keep background behind the buttons
        selectorBg.setStrokeStyle(2, 0x3388ff, 0.8); // Add a blue border
        
        // Add all to container first (background should be at bottom of container)
        this.bombSelectorContainer.add(selectorBg);
        
        // Initialize label containers
        this.bombLabels = {};
        this.bombCounters = {};
        
        // Define colors for each bomb type for better visual distinction
        const bombColors = {
            [this.BOMB_TYPES.BLAST]: 0xff4444,     // Red for blast
            [this.BOMB_TYPES.PIERCER]: 0x44aaff,   // Blue for piercer
            [this.BOMB_TYPES.CLUSTER]: 0xffaa44,   // Orange for cluster
            [this.BOMB_TYPES.STICKY]: 0x44ff44,    // Green for sticky
            [this.BOMB_TYPES.SHATTERER]: 0xaa44ff,  // Purple for shatterer
            [this.BOMB_TYPES.DRILLER]: 0xBB5500    // Brown for driller
        };
        
        // Create buttons with proper positioning and ensure they're in front of the background
        const createBombButton = (x, y, bombType) => {
            // Create the button with depth higher than background
            const button = this.add.image(x, y, bombType)
                .setScale(1.0) // Reduced from 1.2
                .setDisplaySize(60, 60) // Reduced from 80x80 to 60x60
                .setInteractive()
                .setDepth(this.UI_DEPTH + 1); // Ensure buttons are in front of background
            
            // Add a subtle highlight/glow effect behind the button using the bomb's color
            const glowColor = bombColors[bombType] || 0xffffff;
            const glow = this.add.circle(x, y, 22, glowColor, 0.3); // Reduced from radius 28 to 22
            glow.setDepth(this.UI_DEPTH); // Between background and button
            this.bombSelectorContainer.add(glow);
            
            button.on('pointerdown', () => this.selectBombType(bombType));
            
            // Bomb name style with stronger contrast
            const nameStyle = {
                font: '12px Arial', // Reduced from 14px to 12px
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3, // Reduced from 4
                shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true }
            };
            
            // Counter style with better visibility
            const counterStyle = {
                font: '12px Arial', // Reduced from 14px to 12px
                fill: '#ffff00',
                stroke: '#000000',
                strokeThickness: 2, // Reduced from 3
                shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true }
            };
            
            // Create the name label below the button
            const nameLabel = this.add.text(
                x,
                y + 18, // Reduced from 20 to 18
                this.BOMB_NAMES[bombType],
                nameStyle
            ).setOrigin(0.5).setDepth(this.UI_DEPTH + 1);
            
            // Create the counter label above the button
            const counterLabel = this.add.text(
                x,
                y - 18, // Reduced from 20 to 18
                `x${this.bombsRemaining[bombType]}`,
                counterStyle
            ).setOrigin(0.5).setDepth(this.UI_DEPTH + 1); // Ensure text is in front
            
            // Add to container to keep everything organized
            this.bombSelectorContainer.add(button);
            this.bombSelectorContainer.add(nameLabel);
            this.bombSelectorContainer.add(counterLabel);
            
            // Store reference to glow for animation
            button.glow = glow;
            
            // Store references
            this.bombLabels[bombType] = nameLabel;
            this.bombCounters[bombType] = counterLabel;
            
            return button;
        };
        
        // Create all bomb buttons using the new function
        this.blastButton = createBombButton(startX, buttonY, this.BOMB_TYPES.BLAST);
        this.piercerButton = createBombButton(startX + spacing, buttonY, this.BOMB_TYPES.PIERCER);
        this.clusterButton = createBombButton(startX + spacing * 2, buttonY, this.BOMB_TYPES.CLUSTER);
        this.stickyButton = createBombButton(startX + spacing * 3, buttonY, this.BOMB_TYPES.STICKY);
        this.shattererButton = createBombButton(startX + spacing * 4, buttonY, this.BOMB_TYPES.SHATTERER);
        this.drillerButton = createBombButton(startX + spacing * 5, buttonY, this.BOMB_TYPES.DRILLER);
            this.ricochetButton = createBombButton(startX + spacing * 6, buttonY, this.BOMB_TYPES.RICOCHET);
        
        // Log all created buttons for debugging
        console.log("Created bomb buttons:", {
            blast: !!this.blastButton,
            piercer: !!this.piercerButton,
            cluster: !!this.clusterButton,
            sticky: !!this.stickyButton,
            shatterer: !!this.shattererButton,
            driller: !!this.drillerButton,
            ricochet: !!this.ricochetButton
        });
        
        // Create the selection indicator
        this.createSelectionIndicator();
        
        // Update bomb UI to reflect initial state
        this.updateBombUI();
        
        // Debug text to confirm position
        if (this.debugMode) {
            console.log(`Bomb selector positioned at y=${buttonY} with spacing=${spacing}`);
        }
    }
    
    // Create a selection indicator to highlight the currently selected bomb
    createSelectionIndicator() {
        // Create a highlight circle behind the selected bomb
        this.selectionIndicator = this.add.circle(0, 0, 35, 0xffff00, 0.4);
        this.selectionIndicator.setDepth(this.UI_DEPTH);
        this.bombSelectorContainer.add(this.selectionIndicator);
        
        // Add a pulsing animation to the selection indicator
        this.tweens.add({
            targets: this.selectionIndicator,
            scale: { from: 1, to: 1.2 },
            alpha: { from: 0.4, to: 0.6 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }
    
    selectBombType(bombType) {
        // Store previous bomb type before changing
        const previousBombType = this.currentBombType;
        
        // Update current bomb type
        this.currentBombType = bombType;
        
        // Add visual effect for type change
        if (previousBombType !== bombType) {
            // Add a small camera shake effect for feedback
            if (this.cameras && this.cameras.main) {
                this.cameras.main.shake(100, 0.003);
            }
            
            // Add flash effect for bomb switch
            const flash = this.add.circle(this.BOW_X, this.BOW_Y - 20, 40, 0xffffff, 0.7);
            flash.setDepth(50);
            
            // Animate the flash
            this.tweens.add({
                targets: flash,
                alpha: 0,
                scale: 2,
                duration: 300,
                onComplete: () => {
                    flash.destroy();
                }
            });
            
            // Play switch sound if available
            try {
                this.sound.play('switch', { volume: 0.3 });
            } catch (e) {
                console.log("Switch sound not available");
            }
            
            console.log(`Bomb type changed from ${previousBombType} to ${bombType}`);
        }
        
        // Update UI
        this.updateBombUI();
        
        // Only create a new bomb if not actively aiming or if no bomb exists
        if (!this.isAiming) {
            // Create a new bomb with the selected type using the BombLauncher
            if (this.bombLauncher) {
                console.log(`Creating new bomb of type ${bombType}`);
                this.bombLauncher.createBomb(bombType);
                
                // Store reference to the bombLauncher's bomb for backward compatibility
                this.bomb = this.bombLauncher.bomb;
                
                // Add a small highlight effect to show the new bomb
                const highlight = this.add.circle(this.BOW_X, this.BOW_Y - 20, 35, 0xffff00, 0.3);
                highlight.setDepth(11);
                
                // Animate the highlight
                this.tweens.add({
                    targets: highlight,
                    alpha: 0,
                    scale: 1.5,
                    duration: 500,
                    onComplete: () => {
                        highlight.destroy();
                    }
                });
            } else {
                // Fallback to legacy method if BombLauncher isn't available
                if (this.bomb && this.bomb.body && this.bomb.body.isStatic) {
                    this.bomb.setTexture(bombType);
                    
                    // Make sure the bomb is at the slingshot position
                    this.bomb.setPosition(this.BOW_X, this.BOW_Y - 20);
                    
                    // Update the highlight position
                    if (this.bombHighlight) {
                        this.bombHighlight.setPosition(this.BOW_X, this.BOW_Y - 20);
                    }
                } else {
                    // Create a new bomb if none exists
                    this.resetBomb();
                }
            }
        } else if (this.isAiming && this.bomb && this.bomb.body && this.bomb.body.isStatic) {
            // If already aiming, just update the texture without changing position
            this.bomb.setTexture(bombType);
            
            // Add a quick flash effect around the bomb to show the texture change
            const aimingFlash = this.add.circle(this.bomb.x, this.bomb.y, 35, 0xffff00, 0.3);
            aimingFlash.setDepth(11);
            
            // Animate the flash
            this.tweens.add({
                targets: aimingFlash,
                alpha: 0,
                scale: 1.5,
                duration: 300,
                onComplete: () => {
                    aimingFlash.destroy();
                }
            });
            
            console.log(`Changed texture to ${bombType} while aiming`);
        } else {
            console.log(`Bomb type set to ${bombType}, will be used for next bomb`);
        }
    }
    
    updateBombSelection() {
        // This method is kept simple as updateBombUI now handles all the UI updates
        // This avoids circular references between the two methods
        console.log(`Updating bomb selection to: ${this.currentBombType}`);
    }

    handleStickyBomb(x, y, block) {
        if (this.debugMode) {
            console.log("Starting sticky bomb effect at", x, y);
        }
        
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
        
        // Get active bomb reference
        const activeBomb = (this.bombLauncher && this.bombLauncher.bomb) ? this.bombLauncher.bomb : this.bomb;
        
        if (activeBomb) {
            // Fix the bomb in place
            activeBomb.setStatic(true);
            
            // Store the original position
            activeBomb.originalX = activeBomb.x;
            activeBomb.originalY = activeBomb.y;
            
            // Make the bomb appear at the correct position
            activeBomb.setPosition(x, y);
            
            // Mark the bomb as sticky
            activeBomb.isSticky = true;
            
            // Ensure it's not considered exploded
            activeBomb.hasExploded = false;
            
            // Store reference to the bomb sprite
            bombSprite = activeBomb;
            
            // Make sure the bomb is visible
            activeBomb.setVisible(true);
            
            // Update bomb state
            if (this.bombLauncher && this.bombLauncher.bombState) {
                this.bombLauncher.bombState.active = true;
            }
            
            if (this.debugMode) {
                console.log("Sticky bomb marked, using existing bomb at", x, y);
            }
            
            // IMPORTANT: Clear primary bomb references after storing local reference for the sticky bomb
            // This allows the launcher to create a new bomb
            if (this.bombLauncher && this.bombLauncher.bomb === activeBomb) {
                this.bombLauncher.bomb = null;
                if (this.bombLauncher.bombState) {
                    this.bombLauncher.bombState.active = false;
                }
            }
            
            if (this.bomb === activeBomb) {
                this.bomb = null;
            }
        }
        
        // Create a sticky bomb object to track its state
        const stickyBomb = {
            x: x,
            y: y,
            isActive: true,
            visualEffect: stickyEffect,
            particles: particles,
            emitter: emitter,
            bombSprite: bombSprite, // Store the bomb sprite reference
            explosionRadius: 440, // Wider explosion radius than standard bomb (doubled from 220)
            isSticky: true, // Mark this as a sticky bomb
            createdAt: Date.now() // Add timestamp for debugging
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
        // Only create a new bomb if there isn't one active
        this.time.delayedCall(1000, () => {
            const noBombAvailable = (!this.bombLauncher || !this.bombLauncher.bomb) && !this.bomb;
            if (this.shotsRemaining > 0 && noBombAvailable) {
                console.log("Creating new bomb after placing sticky bomb");
                this.resetBomb();
            } else if (noBombAvailable) {
                this.checkLevelCompletion();
            }
        });
        
        // Log that a sticky bomb has been placed
        console.log("Sticky bomb placed at", x, y);
        
        return stickyBomb;
    }
    
    // Add a new method to trigger sticky bombs
    triggerStickyBomb(x, y, radius) {
        if (!this.activeStickyBombs || this.activeStickyBombs.length === 0) return;
        
        // First pass: check specifically for driller bombs in a much wider radius
        // This ensures driller bombs are triggered more reliably
        const drillerCheckRadius = radius * 3;
        const allTriggeredBombs = [];
        
        // First check for driller bombs with a much larger radius
        this.activeStickyBombs.forEach(bomb => {
            if (!bomb.isActive) return;
            
            if (bomb.isDriller) {
                const distance = Phaser.Math.Distance.Between(x, y, bomb.x, bomb.y);
                if (distance < drillerCheckRadius) {
                    allTriggeredBombs.push(bomb);
                    
                    // Mark as inactive immediately to prevent double-triggering
                    bomb.isActive = false;
                    
                    // Visual debug effect to show trigger range
                    if (this.debugMode) {
                        console.log(`DRILLER TRIGGERED at ${bomb.x},${bomb.y} - distance: ${distance.toFixed(2)}, drillerCheckRadius: ${drillerCheckRadius}`);
                        
                        // Create a temporary visual indicator of trigger radius
                        const radiusVisual = this.add.circle(x, y, drillerCheckRadius, 0xFF9900, 0.2);
                        radiusVisual.setDepth(20);
                        
                        // Fade out and remove
                        this.tweens.add({
                            targets: radiusVisual,
                            alpha: 0,
                            duration: 500,
                            onComplete: () => radiusVisual.destroy()
                        });
                    }
                }
            }
        });
        
        // Then check for sticky bombs with the normal radius
        this.activeStickyBombs.forEach(bomb => {
            if (!bomb.isActive || allTriggeredBombs.includes(bomb)) return;
            
            const distance = Phaser.Math.Distance.Between(x, y, bomb.x, bomb.y);
            if (distance < radius) {
                allTriggeredBombs.push(bomb);
                
                // Mark as inactive immediately to prevent double-triggering
                bomb.isActive = false;
                
                // Visual debug effect
                if (this.debugMode) {
                    console.log(`Sticky bomb triggered at ${bomb.x},${bomb.y} - distance: ${distance.toFixed(2)}`);
                    
                    // Create a temporary visual indicator of trigger radius
                    const radiusVisual = this.add.circle(x, y, radius, 0xFF99FF, 0.2);
                    radiusVisual.setDepth(20);
                    
                    // Fade out and remove
                    this.tweens.add({
                        targets: radiusVisual,
                        alpha: 0,
                        duration: 500,
                        onComplete: () => radiusVisual.destroy()
                    });
                }
            }
        });
        
        // Now process all triggered bombs
        allTriggeredBombs.forEach(bomb => {
            // Process delayed explosion based on bomb type
            if (bomb.isDriller) {
                // Driller bombs need a drill explosion
                this.time.delayedCall(300, () => {
                    // Create drill explosion at bomb's position
                    if (this.bombUtils && this.bombUtils.createDrillerExplosion) {
                        this.bombUtils.createDrillerExplosion(bomb.x, bomb.y);
                    } else {
                        this.createDrillerExplosion(bomb.x, bomb.y);
                    }
                    
                    // Clean up resources
                    this.cleanupBombResources(bomb);
                });
            } else {
                // Regular sticky bombs get a large explosion after a delay
                this.time.delayedCall(300, () => {
                    // Create large explosion at bomb's position
                    if (this.bombUtils && this.bombUtils.createLargeExplosion) {
                        this.bombUtils.createLargeExplosion(bomb.x, bomb.y);
                    } else {
                        this.createLargeExplosion(bomb.x, bomb.y);
                    }
                    
                    // Destroy blocks in a large radius
                    const explosionRadius = bomb.explosionRadius || 200;
                    this.destroyBlocksInRadius(bomb.x, bomb.y, explosionRadius);
                    
                    // Clean up resources
                    this.cleanupBombResources(bomb);
                });
            }
        });
        
        // Remove triggered bombs from the active array
        if (allTriggeredBombs.length > 0) {
            this.activeStickyBombs = this.activeStickyBombs.filter(bomb => 
                !allTriggeredBombs.includes(bomb)
            );
        }
        
        return allTriggeredBombs.length > 0;
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
        
        // For Shatterer bomb, we'll handle block destruction differently to reflect its power
        this.destroyBlocksWithShatterer(x, y, 250);
        
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
    
    // New method to handle the special destruction properties of the Shatterer bomb
    destroyBlocksWithShatterer(x, y, radius) {
        if (!this.iceBlocks) return;
        
        // Create a list to track blocks to be destroyed
        const blocksToDestroy = [];
        const dynamiteToTrigger = [];
        
        // Check distance of each block from explosion center
        this.iceBlocks.forEach(block => {
            if (block && block.isActive) {
                const distance = Phaser.Math.Distance.Between(x, y, block.x, block.y);
                
                if (distance < radius) {
                    if (block.blockType === this.blockTypes.TYPES.DYNAMITE) {
                        // Add dynamite blocks to a special trigger list
                        const delay = (distance / radius) * 50; // shorter delay for chain reactions
                        dynamiteToTrigger.push({ block, delay });
                    } else if (block.blockType === this.blockTypes.TYPES.BOUNCY) {
                        // Bouncy blocks don't get destroyed by Shatterer either, just show they were hit
                        this.time.delayedCall(10, () => {
                            this.blockUtils.createBouncyHitEffect(block.x, block.y);
                        });
                    } else {
                        // All other blocks (including Eternal and Strong) get destroyed in one hit
                        // by the Shatterer bomb
                        const delay = (distance / radius) * 100;
                        blocksToDestroy.push({ block, delay });
                    }
                }
            }
        });
        
        // Process block destruction with delays
        blocksToDestroy.forEach(({ block, delay }) => {
            this.time.delayedCall(delay, () => {
                if (block && block.isActive) {
                    // If Eternal or Strong, play special effect before destruction
                    if (block.blockType === this.blockTypes.TYPES.ETERNAL || block.blockType === this.blockTypes.TYPES.STRONG) {
                        this.blockUtils.createShattererImpactEffect(block.x, block.y);
                    }
                    this.destroyIceBlock(block); // Destroy in one hit regardless of type
                }
            });
        });
        
        // Process dynamite triggers with delays
        dynamiteToTrigger.forEach(({ block, delay }) => {
            this.time.delayedCall(delay, () => {
                if (block && block.isActive) {
                    // Create explosion at dynamite location
                    this.createExplosion(block.x, block.y);
                    
                    // Destroy the dynamite block
                    this.destroyIceBlock(block);
                    
                    // Destroy additional blocks in radius
                    this.destroyBlocksInRadius(block.x, block.y, 120); // Dynamite has smaller radius
                }
            });
        });
        
        // Clean up the iceBlocks array after a delay
        this.time.delayedCall(1000, () => {
            this.cleanupIceBlocksArray();
        });
    }

    initializeAudio() {
        try {
            console.log("Initializing audio system...");
            
            // Try to create a dummy audio element to test browser audio support
            const dummyAudio = document.createElement('audio');
        
            // Check if browser supports audio
            if (dummyAudio && typeof dummyAudio.play === 'function') {
                console.log("Browser supports audio APIs");
                
                // Create a proper AudioManager with a short delay
                this.time.delayedCall(500, () => {
                    this.createAudioManager();
                });
                
                // Try to unlock audio on user interaction
                this.handleAudioUnlock();
            } else {
                console.warn("Browser may not fully support audio, creating dummy audio manager");
                this.createDummyAudioManager();
            }
        } catch (error) {
            console.error("Error initializing audio:", error);
            // Fallback to dummy audio
            this.createDummyAudioManager();
        }
    }
    
    // Handle audio unlock on user interaction
    handleAudioUnlock() {
        // Audio context for web browsers
        const AudioContext = window.AudioContext || window.webkitAudioContext;
                
        // Return if audio context isn't supported
        if (!AudioContext) {
            console.warn("AudioContext not supported in this browser");
            return;
        }
        
        // Create audio context
        const audioCtx = new AudioContext();
                
        // Function to resume audio context and remove listeners
                const resumeAudio = () => {
            if (audioCtx.state === 'suspended') {
                audioCtx.resume().then(() => {
                    console.log("AudioContext resumed successfully");
                }).catch(err => {
                    console.error("Error resuming AudioContext:", err);
                });
            }
            
            // Create audio manager after user interaction
            if (!this.audioManager) {
                this.time.delayedCall(100, () => {
                        this.createAudioManager();
                });
            }
            
            // Remove event listeners after first interaction
            document.removeEventListener('click', resumeAudio);
            document.removeEventListener('touchstart', resumeAudio);
            document.removeEventListener('keydown', resumeAudio);
                };
                
        // Add event listeners for user interaction
        document.addEventListener('click', resumeAudio);
        document.addEventListener('touchstart', resumeAudio);
        document.addEventListener('keydown', resumeAudio);
        
        console.log("Audio unlock handlers added");
    }
    
    // Create a dummy audio manager that doesn't try to play any sounds
    createDummyAudioManager() {
        console.log("Creating dummy audio manager (no sounds will play)");
        this.audioManager = {
            bgMusic: null,
            victoryMusic: null,
            
            playBackgroundMusic: () => {
                console.log("Dummy audio manager: Ignoring background music request");
            },
            
            playVictoryMusic: () => {
                console.log("Dummy audio manager: Ignoring victory music request");
            },
            
            stopAll: () => {
                console.log("Dummy audio manager: Ignoring stop all request");
            },
            
            playGameOverSound: () => {
                console.log("Dummy audio manager: Ignoring game over sound request");
            }
        };
    }
    
    createAudioManager() {
        // Create a simple audio manager with better null handling
        this.audioManager = {
            bgMusic: null,
            victoryMusic: null,
            soundsEnabled: true,
            
            playBackgroundMusic: () => {
                try {
                    console.log(`Attempting to play background music for level ${this.currentLevel}...`);
                    
                    // Check if sounds are enabled
                    if (!this.audioManager.soundsEnabled) {
                        console.log("Sounds disabled, skipping background music");
                        return;
                    }
                    
                    // Check if we already have a music instance and stop it properly
                    if (this.audioManager.bgMusic) {
                        try {
                            if (this.audioManager.bgMusic.isPlaying) {
                                this.audioManager.bgMusic.stop();
                            }
                            this.audioManager.bgMusic = null;
                            console.log("Stopped previous background music");
                        } catch (err) {
                            console.warn("Error stopping previous background music:", err);
                            // Continue anyway to try to play new music
                        }
                    }
                    
                    // Try level-specific music first (e.g., bgMusic_level2)
                    const levelMusicKey = `bgMusic_level${this.currentLevel}`;
                    let musicKey = 'bgMusic'; // Default music key
                    
                    // First check if the level-specific music exists in cache
                    if (this.cache.audio.exists(levelMusicKey)) {
                        console.log(`Found level-specific music: ${levelMusicKey}`);
                        musicKey = levelMusicKey;
                    } else {
                        console.log(`No level-specific music found for level ${this.currentLevel}, using default bgMusic`);
                        
                        // Verify that the default music exists
                        if (!this.cache.audio.exists('bgMusic')) {
                            console.error("Default bgMusic asset not found in cache!");
                            return; // Exit if no music is available
                        }
                    }
                    
                    // Create and play background music with error handling
                    try {
                        console.log(`Creating audio with key: ${musicKey}`);
                        
                        // Add a try-catch block specifically for sound creation
                        try {
                            this.audioManager.bgMusic = this.sound.add(musicKey, {
                                volume: 0.4,
                                loop: true
                            });
                        } catch (soundErr) {
                            console.error(`Error creating sound with key ${musicKey}:`, soundErr);
                            return;
                        }
                        
                        if (this.audioManager.bgMusic) {
                            // Add another try-catch block for playing the sound
                            try {
                                this.audioManager.bgMusic.play();
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
                                this.audioManager.bgMusic = this.sound.add('bgMusic', {
                                    volume: 0.4,
                                    loop: true
                                });
                                
                                if (this.audioManager.bgMusic) {
                                    try {
                                        this.audioManager.bgMusic.play();
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
            },
            
            playVictoryMusic: () => {
                try {
                    console.log("Attempting to play victory music...");
                    
                    // Check if sounds are enabled
                    if (!this.audioManager.soundsEnabled) {
                        console.log("Sounds disabled, skipping victory music");
                        return;
                    }
                    
                    // Stop background music if playing
                    if (this.audioManager.bgMusic) {
                        try {
                            if (this.audioManager.bgMusic.isPlaying) {
                                this.audioManager.bgMusic.stop();
                            }
                        } catch (err) {
                            console.warn("Error stopping background music:", err);
                        }
                    }
                    
                    // Check if the victory music exists
                    if (!this.cache.audio.exists('victoryMusic')) {
                        console.error("victoryMusic asset not found in cache");
                        return;
                    }
                    
                    // Play victory music with enhanced error handling
                    try {
                        this.audioManager.victoryMusic = this.sound.add('victoryMusic', {
                            volume: 0.6,
                            loop: false
                        });
                        
                        // Make sure it starts playing with a bit of delay
                        this.time.delayedCall(200, () => {
                            if (this.audioManager.victoryMusic) {
                                try {
                                    this.audioManager.victoryMusic.play();
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
            },
            
            stopAll: () => {
                try {
                    console.log("Attempting to stop all audio...");
                    
                    // Stop background music safely
                    if (this.audioManager.bgMusic) {
                        try {
                            // First check if it has a stop method
                            if (typeof this.audioManager.bgMusic.stop === 'function') {
                                this.audioManager.bgMusic.stop();
                                console.log("Background music stopped successfully");
                            } else {
                                console.log("Background music has no stop method, setting to null");
                            }
                            // Either way, set to null to allow garbage collection
                            this.audioManager.bgMusic = null;
                        } catch (err) {
                            console.error("Error stopping background music:", err);
                            this.audioManager.bgMusic = null;
                        }
                    }
                    
                    // Stop victory music safely
                    if (this.audioManager.victoryMusic) {
                        try {
                            // First check if it has a stop method
                            if (typeof this.audioManager.victoryMusic.stop === 'function') {
                                this.audioManager.victoryMusic.stop();
                                console.log("Victory music stopped successfully");
                            } else {
                                console.log("Victory music has no stop method, setting to null");
                            }
                            // Either way, set to null to allow garbage collection
                            this.audioManager.victoryMusic = null;
                        } catch (err) {
                            console.error("Error stopping victory music:", err);
                            this.audioManager.victoryMusic = null;
                        }
                    }
                    
                    // Try to stop all audio directly through the sound manager
                    try {
                        if (this.sound && typeof this.sound.stopAll === 'function') {
                            this.sound.stopAll();
                            console.log("Called sound.stopAll() as an additional safety measure");
                        }
                    } catch (err) {
                        console.warn("Could not stop all sounds through sound manager:", err);
                    }
                    
                    console.log("All audio stopped (or at least attempted to stop)");
                } catch (err) {
                    console.error("Error in stopAll audio method:", err);
                }
            },
            
            playGameOverSound: () => {
                try {
                    console.log("Attempting to play game over sound...");
                    
                    // Check if sounds are enabled
                    if (!this.audioManager.soundsEnabled) {
                        console.log("Sounds disabled, skipping game over sound");
                        return;
                    }
                    
                    // Check if the game over sound exists
                    if (this.cache.audio.exists('gameOverSound')) {
                        // Play game over sound
                        try {
                            const gameOverSound = this.sound.add('gameOverSound', {
                                volume: 0.5
                            });
                            if (gameOverSound) {
                                try {
                                    gameOverSound.play();
                                    console.log("Game over sound started successfully");
                                } catch (playErr) {
                                    console.error("Error playing game over sound:", playErr);
                                }
                            }
                        } catch (err) {
                            console.error("Failed to create game over sound:", err);
                        }
                    } else {
                        console.warn("gameOverSound asset not found in cache");
                    }
                } catch (err) {
                    console.error("Error in playGameOverSound:", err);
                }
            }
        };
        
        // Add a short delay before playing music to ensure everything is loaded
        this.time.delayedCall(1000, () => {
            if (this.audioManager && typeof this.audioManager.playBackgroundMusic === 'function') {
                this.audioManager.playBackgroundMusic();
            }
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
            
            // Number of points to predict - increased for moon trajectory
            const numPoints = 200; // Increased from 120 for much longer moon trajectory
            
            // Time step for each predicted point (in seconds)
            const timeStep = 0.1; // Reduced time step to make points closer together
            
            // Get physics properties based on current bomb type
            let density = 0.0003; // Default density for moon physics
            let frictionAir = 0.008; // Increased 4x from 0.002 for trajectory prediction
            
            // Adjust properties for special bomb types to match their actual physics
            switch(this.currentBombType) {
                case this.BOMB_TYPES.PIERCER:
                    density = 0.0005;
                    frictionAir = 0.006; // Increased 4x from 0.0015
                    break;
                case this.BOMB_TYPES.CLUSTER:
                    density = 0.0002;
                    frictionAir = 0.01; // Increased 4x from 0.0025
                    break;
                case this.BOMB_TYPES.STICKY:
                    density = 0.0003;
                    frictionAir = 0.008; // Increased 4x from 0.002
                    break;
                case this.BOMB_TYPES.SHATTERER:
                    density = 0.0004;
                    frictionAir = 0.0072; // Increased 4x from 0.0018
                    break;
                case this.BOMB_TYPES.DRILLER:
                    density = 0.0004;
                    frictionAir = 0.006; // Increased 4x from 0.0015
                    break;
            }
            
            // Gravity from the physics world - safely access with fallback value
            let gravityY = 0.008; // Quarter of moon gravity (reduced from 0.08)
            try {
                gravityY = this.matter.world.localWorld.gravity.y || 0.008;
            } catch (error) {
                console.warn("Could not access physics world gravity, using default:", error);
            }
            
            // Scale factor for velocity - safely access with fallback value
            let forceScale = 40; // Reduced from 60 for better moon trajectory prediction
            try {
                forceScale = (this.matter.world.localWorld.body?.global?.translateForceToPts || 1) * 40;
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
                const skipFactor = Math.ceil(this.trajectoryPoints.length / 60); // Don't draw more than ~60 dots
                
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
            
            // If the completion veil is a container of blocks
            if (this.veilContainer) {
                // Fade out all individual veil blocks
                this.veilContainer.iterate(veilBlock => {
                    this.tweens.add({
                        targets: veilBlock,
                        alpha: 0,
                        duration: 1500,
                        ease: 'Power2'
                    });
                });
                
                // Remove the container after the animation completes
                this.time.delayedCall(1500, () => {
                    if (this.veilContainer && this.veilContainer.scene) {
                        this.veilContainer.destroy();
                    }
                });
            } 
            // Fallback for rectangular veil
            else if (this.completionVeil.scene) {
                // Remove the completion veil with a nice effect
                this.tweens.add({
                    targets: this.completionVeil,
                    alpha: 0,
                    duration: 1500,
                    ease: 'Power2',
                    onComplete: () => {
                        if (this.completionVeil && this.completionVeil.scene) {
                            this.completionVeil.destroy();
                        }
                    }
                });
            }
            
            // Handle frost graphics separately
            if (this.frostGraphics && this.frostGraphics.scene) {
                this.tweens.add({
                    targets: this.frostGraphics,
                    alpha: 0,
                    duration: 1500,
                    ease: 'Power2',
                    onComplete: () => {
                        if (this.frostGraphics && this.frostGraphics.scene) {
                            this.frostGraphics.destroy();
                        }
                    }
                });
            }
            
            // Add sparkle particles where the veil was
            this.emitParticlesAtChibiCenter();
        }
    }
    
    // Helper to emit particles at chibi image center
    emitParticlesAtChibiCenter() {
        const particles = this.add.particles('particle');
        const emitter = particles.createEmitter({
            x: this.chibiImage.x,
            y: this.chibiImage.y,
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

    createCompletionVeil() {
        try {
            // First ensure any existing completion veil is fully cleaned up
            if (this.completionVeil) {
                if (this.veilContainer) {
                    this.veilContainer.destroy(true);
                    this.veilContainer = null;
                } else if (this.completionVeil.scene) {
                    this.completionVeil.destroy();
                }
                this.completionVeil = null;
            }
            
            if (this.frostGraphics && this.frostGraphics.scene) {
                this.frostGraphics.destroy();
                this.frostGraphics = null;
            }
            
            // Reset the removal flag
            this.completionVeilRemoved = false;
            
            // Get the chibi image dimensions - no scaling
            const imageWidth = this.chibiImage.width;
            const imageHeight = this.chibiImage.height;
            
            // Calculate the exact boundaries
            const imageX = this.chibiImage.x - imageWidth / 2;
            const imageY = this.chibiImage.y - imageHeight / 2;
            
            console.log(`Creating completion veil for chibi at ${this.chibiImage.x}, ${this.chibiImage.y}`);
            console.log(`With bounds: ${imageX}, ${imageY}, size: ${imageWidth}x${imageHeight}`);
            
            // Create a container for the veil
            this.veilContainer = this.add.container(0, 0);
            this.veilContainer.setDepth(2); // Above chibi (1) but below ice blocks (4)
            
            // Create a temporary canvas to check pixel data
            const tempCanvas = document.createElement('canvas');
            const tempContext = tempCanvas.getContext('2d');
            tempCanvas.width = imageWidth;
            tempCanvas.height = imageHeight;
            
            // Get the texture key of the chibi image
            const textureKey = this.chibiImage.texture.key;
            
            // Get the image data
            const frame = this.textures.getFrame(textureKey);
            const source = frame.source.image || frame.source.canvas;
            
            // Draw the image to our temp canvas
            tempContext.drawImage(source, 0, 0, imageWidth, imageHeight);
            
            // Create a graphics object for the frost effect
            const frostGraphics = this.add.graphics();
            frostGraphics.setDepth(2);
            this.frostGraphics = frostGraphics;
            
            // Block size for the veil - smaller size for more precise shape
            const blockSize = 10; // Keeping original block size of 10
            
            // Alpha threshold - lower value to include more semi-transparent pixels
            const alphaThreshold = 50; // Keeping original alpha threshold of 50
            
            // Create veil blocks that match the chibi image shape
            const rows = Math.ceil(imageHeight / blockSize);
            const cols = Math.ceil(imageWidth / blockSize);
            
            // Sample size for checking multiple pixels in the block area
            const sampleSize = 5; // Check more points in a 5x5 grid
            const sampleOffset = Math.floor(blockSize / (sampleSize + 1));
            
            // Create a 2D grid to track where we've placed veil blocks
            const veilGrid = Array(rows).fill().map(() => Array(cols).fill(false));
            
            // Keep track of non-transparent points for frost effect
            const nonTransparentPoints = [];
            
            // First pass: Find all blocks with visible pixels
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    // Calculate screen position
                    const blockScreenX = imageX + col * blockSize + blockSize / 2;
                    const blockScreenY = imageY + row * blockSize + blockSize / 2;
                    
                    // Sample multiple points within this block area
                    let hasVisiblePixel = false;
                    
                    for (let sx = 0; sx < sampleSize; sx++) {
                        for (let sy = 0; sy < sampleSize; sy++) {
                            // Calculate sampling position in the original image
                            const offsetX = -Math.floor(sampleSize/2) + sx;
                            const offsetY = -Math.floor(sampleSize/2) + sy;
                            
                            const sampleX = Math.floor(col * blockSize) + offsetX * sampleOffset;
                            const sampleY = Math.floor(row * blockSize) + offsetY * sampleOffset;
                            
                            // Ensure we're within bounds
                            if (sampleX >= 0 && sampleX < imageWidth && 
                                sampleY >= 0 && sampleY < imageHeight) {
                                
                                try {
                                    const pixelData = tempContext.getImageData(sampleX, sampleY, 1, 1).data;
                                    // If any sampled pixel has alpha above threshold, mark block as visible
                                    if (pixelData[3] >= alphaThreshold) {
                                        hasVisiblePixel = true;
                                        break;
                                    }
                                } catch (e) {
                                    console.error(`Error sampling pixel at ${sampleX},${sampleY}:`, e);
                                }
                            }
                        }
                        if (hasVisiblePixel) break;
                    }
                    
                    if (hasVisiblePixel) {
                        veilGrid[row][col] = true;
                        nonTransparentPoints.push({
                            x: blockScreenX,
                            y: blockScreenY
                        });
                    }
                }
            }
            
            // Second pass: Add padding around detected pixels to ensure edges are covered
            const paddingAmount = 1; // Original padding value (1) restored
            
            // Create a copy of the grid before adding padding
            const originalGrid = veilGrid.map(row => [...row]);
            
            // Add padding around each detected block
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    if (originalGrid[row][col]) {
                        // Add padding blocks around this block
                        for (let pr = -paddingAmount; pr <= paddingAmount; pr++) {
                            for (let pc = -paddingAmount; pc <= paddingAmount; pc++) {
                                const padRow = row + pr;
                                const padCol = col + pc;
                                
                                // Make sure we're in bounds
                                if (padRow >= 0 && padRow < rows && padCol >= 0 && padCol < cols) {
                                    veilGrid[padRow][padCol] = true;
                                    
                                    // Add these to non-transparent points if not already included
                                    const blockX = imageX + padCol * blockSize + blockSize / 2;
                                    const blockY = imageY + padRow * blockSize + blockSize / 2;
                                    
                                    // Only add if this point is not already in the array
                                    if (!nonTransparentPoints.some(p => p.x === blockX && p.y === blockY)) {
                                        nonTransparentPoints.push({
                                            x: blockX,
                                            y: blockY
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
            }
            
            // Third pass: Create veil blocks based on our grid
            for (let row = 0; row < rows; row++) {
                for (let col = 0; col < cols; col++) {
                    if (!veilGrid[row][col]) continue;
                    
                    // Calculate screen position
                    const blockScreenX = imageX + col * blockSize + blockSize / 2;
                    const blockScreenY = imageY + row * blockSize + blockSize / 2;
                    
                    // Create a veil block at this position
                    const veilBlock = this.add.rectangle(
                        blockScreenX,
                        blockScreenY,
                        blockSize,
                        blockSize,
                        0x0033aa, // Deep blue color
                        0.7
                    );
                    
                    veilBlock.setDepth(2);
                    this.veilContainer.add(veilBlock);
                }
            }
            
            // Add frost effects at random non-transparent points
            frostGraphics.lineStyle(2, 0x66aaff, 0.3); // Light blue lines for frost effect
            
            // Number of frost patterns to create
            const numPatterns = 50;
            
            // Add crystalline patterns only in non-transparent areas
            for (let i = 0; i < numPatterns && nonTransparentPoints.length > 0; i++) {
                // Select a random point from the non-transparent pixels
                const randomIndex = Math.floor(Math.random() * nonTransparentPoints.length);
                const point = nonTransparentPoints[randomIndex];
                
                // Create a frost pattern at this point
                const size = Phaser.Math.Between(15, 40);
                
                // Draw a snowflake-like pattern
                frostGraphics.moveTo(point.x, point.y);
                frostGraphics.lineTo(point.x + size, point.y);
                frostGraphics.moveTo(point.x, point.y);
                frostGraphics.lineTo(point.x - size/2, point.y + size);
                frostGraphics.moveTo(point.x, point.y);
                frostGraphics.lineTo(point.x - size/2, point.y - size);
            }
            
            // Store reference to the veil container
            this.completionVeil = this.veilContainer;
            
            console.log('Completion veil created with shape matching chibi');
        } catch (error) {
            console.error("Error creating completion veil:", error);
            
            // Fallback to simple rectangle if there's an error
            this.completionVeil = this.add.rectangle(
                this.chibiImage.x,
                this.chibiImage.y,
                this.chibiImage.width,
                this.chibiImage.height,
                0x0033aa,
                0.7
            ).setDepth(2);
        }
    }

    handleDrillerBomb(x, y, block) {
        if (this.debugMode) {
            console.log("Starting driller bomb effect at", x, y);
        }
        
        // Create a visual driller effect to show bomb has started drilling
        const drillerEffect = this.add.circle(x, y, 25, 0xBB5500, 0.7);
        drillerEffect.setDepth(15);
        
        // Animate the driller effect to rotate
        this.tweens.add({
            targets: drillerEffect,
            angle: 360,
            duration: 1000,
            ease: 'Linear',
            repeat: -1 // Repeat forever until removed
        });
        
        // Add particles for drilling effect
        const particles = this.add.particles('particle');
        const emitter = particles.createEmitter({
            speed: { min: 10, max: 30 },
            scale: { start: 0.3, end: 0 },
            alpha: { start: 0.7, end: 0 },
            lifespan: 800,
            blendMode: 'ADD',
            tint: 0xBB5500, // Brown/orange tint for drill
            frequency: 100, // Emit particles frequently
            quantity: 2
        });
        
        // Set particle emission point
        emitter.setPosition(x, y);
        
        // Keep a reference to the original bomb sprite and velocity
        let bombSprite = null;
        let velocityX = 0;
        let velocityY = 0;
        
        // Get active bomb reference
        const activeBomb = (this.bombLauncher && this.bombLauncher.bomb) ? this.bombLauncher.bomb : this.bomb;
        
        if (activeBomb) {
            try {
                // Try to get the velocity - either from stored velocity or directly from body
                if (activeBomb.storedVelocityX !== undefined && activeBomb.storedVelocityY !== undefined) {
                    velocityX = activeBomb.storedVelocityX;
                    velocityY = activeBomb.storedVelocityY;
                    
                    if (this.debugMode) {
                        console.log(`Using stored velocity for driller: ${velocityX}, ${velocityY}`);
                    }
                } else if (activeBomb.body && activeBomb.body.velocity) {
                    velocityX = activeBomb.body.velocity.x;
                    velocityY = activeBomb.body.velocity.y;
                    
                    if (this.debugMode) {
                        console.log(`Using direct velocity for driller: ${velocityX}, ${velocityY}`);
                    }
                } else {
                    // Fallback to estimating direction based on bomb and block positions
                    if (block) {
                        const dx = activeBomb.x - block.x;
                        const dy = activeBomb.y - block.y;
                        const mag = Math.sqrt(dx * dx + dy * dy);
                        if (mag > 0) {
                            // Use normalized direction with a default magnitude
                            const defaultMagnitude = 5;
                            velocityX = -(dx / mag) * defaultMagnitude;
                            velocityY = -(dy / mag) * defaultMagnitude;
                            
                            if (this.debugMode) {
                                console.log(`Using fallback direction for driller: ${velocityX}, ${velocityY}`);
                            }
                        }
                    }
                }
                
                // Fix the bomb in place but keep it visible
                activeBomb.setStatic(true);
                
                // Store the original position
                activeBomb.originalX = activeBomb.x;
                activeBomb.originalY = activeBomb.y;
                
                // Store original velocity for reference
                activeBomb.storedVelocityX = velocityX;
                activeBomb.storedVelocityY = velocityY;
                
                // Mark the bomb as a driller
                activeBomb.isDriller = true;
                
                // Ensure it's not marked as exploded
                activeBomb.hasExploded = false;
                
                // Store reference to the bomb sprite
                bombSprite = activeBomb;
                
                if (this.debugMode) {
                    console.log(`Driller bomb marked, using existing bomb at ${x}, ${y}`);
                }
            } catch (error) {
                console.error("Error setting up driller bomb:", error);
            }
        } else {
            console.error("No active bomb found for driller effect");
        }
        
        // Get the direction from the bomb's velocity vector
        let directionX = 1; // Default right direction
        let directionY = 0;
        
        // Use the bomb's velocity to determine drilling direction
        const velocityMag = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
        if (velocityMag > 0.1) { // Only use velocity if it's significant
            // Normalize the velocity vector
            directionX = velocityX / velocityMag;
            directionY = velocityY / velocityMag;
            
            if (this.debugMode) {
                console.log(`Drilling direction based on velocity: ${directionX.toFixed(2)}, ${directionY.toFixed(2)}`);
            }
        } else if (block) {
            // Fallback to collision direction if velocity is too low
            // Calculate direction from block center to initial impact point
            const dx = x - block.x;
            const dy = y - block.y;
            
            // Normalize to get direction vector
            const mag = Math.sqrt(dx * dx + dy * dy);
            if (mag > 0) {
                directionX = dx / mag;
                directionY = dy / mag;
                
                if (this.debugMode) {
                    console.log(`Fallback drilling direction from collision: ${directionX.toFixed(2)}, ${directionY.toFixed(2)}`);
                }
            }
        }
        
        // Blocks to drill through (up to 10)
        const maxDrillDistance = 10;
        let currentDrillDistance = 0;
        
        // Track current drill position
        let currentX = x;
        let currentY = y;
        
        // Store blocks that have been drilled through
        const drilledBlocks = [];
        
        // Create driller bomb object to return and store
        const drillerBomb = {
            x: x,
            y: y,
            velocityX: velocityX,
            velocityY: velocityY,
            directionX: directionX,
            directionY: directionY,
            drillerEffect: drillerEffect,
            particles: particles,
            emitter: emitter,
            bombSprite: bombSprite,
            isDriller: true,
            isActive: true,
            createdAt: Date.now(),
            activeBomb: activeBomb
        };
        
        // Make sure we track this driller bomb
        if (!this.activeDrillerBombs) {
            this.activeDrillerBombs = [];
        }
        
        // Add to tracking array
        this.activeDrillerBombs.push(drillerBomb);
        
        // Keep track of the drill interval to ensure it can be cleared
        let drillInterval = null;
        
        // Drilling animation
        drillInterval = this.time.addEvent({
            delay: 200, // Drill through a block every 200ms - changed from 300ms in original
            callback: () => {
                // Update position based on direction
                currentX += directionX * 20; // Move 20px in drill direction
                currentY += directionY * 20; 
                
                // Move the visual effect and particles
                if (drillerEffect && drillerEffect.scene) {
                    drillerEffect.setPosition(currentX, currentY);
                }
                
                if (emitter && emitter.manager && emitter.manager.scene) {
                    emitter.setPosition(currentX, currentY);
                }
                
                // Update the bomb sprite position
                if (bombSprite && bombSprite.scene) {
                    bombSprite.setPosition(currentX, currentY);
                }
                
                // Update the driller bomb tracking object
                drillerBomb.x = currentX;
                drillerBomb.y = currentY;
                
                // Find any blocks at the current position
                this.iceBlocks.forEach(block => {
                    if (!block || !block.isActive) return;
                    
                    // Check distance to this block
                    const distance = Phaser.Math.Distance.Between(currentX, currentY, block.x, block.y);
                    
                    // If we're close enough to a block, drill through it
                    if (distance < 40 && !drilledBlocks.includes(block)) {
                        // Add to drilled blocks
                        drilledBlocks.push(block);
                        
                        // Create a drilling effect at this block
                        this.createDrillEffect(block.x, block.y);
                        
                        // Destroy the block
                        this.destroyIceBlock(block);
                        
                        // Increment drill distance
                        currentDrillDistance++;
                        
                        // Stop if we've reached the max drill distance
                        if (currentDrillDistance >= maxDrillDistance) {
                            if (drillInterval) {
                                drillInterval.remove();
                                drillInterval = null;
                            }
                            drillingComplete();
                        }
                    }
                });
                
                // Check if drilling has gone offscreen or reached maximum distance
                if (currentX < 0 || currentX > this.cameras.main.width || 
                    currentY < 0 || currentY > this.cameras.main.height) {
                    if (drillInterval) {
                        drillInterval.remove();
                        drillInterval = null;
                    }
                    drillingComplete();
                }
            },
            callbackScope: this,
            repeat: 100 // Allow for plenty of drilling steps
        });
        
        // Store interval in the driller object
        drillerBomb.drillInterval = drillInterval;
        
        // Function to handle the end of drilling
        const drillingComplete = () => {
            if (this.debugMode) {
                console.log(`Driller finished after drilling through ${currentDrillDistance} blocks`);
            }
            
            // Stop the drilling animation if it's still active
            if (drillInterval) {
                drillInterval.remove();
                drillInterval = null;
            }
            
            // Create an effect at the final position
            const finalX = currentX;
            const finalY = currentY;
            
            // Mark the driller bomb as inactive
            drillerBomb.isActive = false;
            
            // Create a unique ID for this driller bomb for debugging purposes
            const bombId = 'driller_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
            
            // Create a driller bomb object similar to sticky bomb - keep the bomb in place
            const stuckDrillerBomb = {
                id: bombId,
                x: finalX,
                y: finalY,
                isActive: true,
                visualEffect: drillerEffect,
                particles: particles,
                emitter: emitter,
                bombSprite: bombSprite,
                explosionRadius: 380, // Large explosion radius when triggered
                isDriller: true, // Mark this as a driller bomb specifically
                createdAt: Date.now()  // Add timestamp for debugging
            };
            
            // Add to active sticky bombs array for triggering by other bombs
            if (!this.activeStickyBombs) {
                this.activeStickyBombs = [];
            }
            
            // Add the new driller bomb to the sticky array (for explosion triggering)
            this.activeStickyBombs.push(stuckDrillerBomb);
            
            console.log(`Driller bomb placed at final position: ${finalX},${finalY}`);
            
            // Add a small particle effect at the final position to show completion
            this.createDrillEffect(finalX, finalY);
            
            // IMPORTANT: Clear the active bomb reference immediately
            if (this.bomb === bombSprite) {
                this.bomb = null;
            }
            
            if (this.bombLauncher && this.bombLauncher.bomb === bombSprite) {
                this.bombLauncher.bomb = null;
                this.bombLauncher.bombState.active = false;
            }
            
            // Force immediate checking of the launcher state
            console.log("Checking if new bomb should be created...");
            console.log("Shots remaining:", this.shotsRemaining);
            
            // Check if we need to reset the bomb immediately
            const noBombAvailable = (!this.bombLauncher || !this.bombLauncher.bomb) && !this.bomb;
            console.log("No bomb available:", noBombAvailable);
            
            if (this.shotsRemaining > 0 && noBombAvailable) {
                console.log("Creating new bomb right after driller completed");
                
                // Use a shorter delay to reset the bomb faster
                this.time.delayedCall(500, () => {
                    console.log("Reset bomb called from driller completion");
                    // Explicitly call resetBomb to create a new bomb
                    this.resetBomb();
                });
            } else if (noBombAvailable) {
                console.log("No shots remaining, checking level completion");
                this.checkLevelCompletion();
            }
        };
        
        // Set a failsafe timer to ensure drilling completes even if normal process fails
        this.time.delayedCall(7000, () => {
            if (drillInterval && drillInterval.active) {
                if (this.debugMode) {
                    console.log("Failsafe: Forcing drill completion");
                }
                drillingComplete();
            }
        });
        
        // Play a drilling sound if available
        try {
            this.sound.play('explosion', { volume: 0.3, rate: 2.0 }); // Higher pitch for drilling sound
        } catch (e) {
            console.log("Sound not available:", e);
        }
        
        return drillerBomb;
    }

    // Helper function to create a drill effect
    createDrillEffect(x, y) {
        // Create a drill dust effect
        const particles = this.add.particles('particle');
        particles.setDepth(6);
        
        // Create the emitter for debris
        const emitter = particles.createEmitter({
            speed: { min: 30, max: 80 },
            scale: { start: 0.4, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 500,
            blendMode: 'ADD',
            tint: [0xBB5500, 0xCCCCCC], // Brown/orange and gray for drill dust
        });
        
        // Emit a burst of particles
        emitter.explode(10, x, y);
        
        // Clean up after use
        this.time.delayedCall(500, () => {
            particles.destroy();
        });
        
        // Add a small camera shake for drilling feedback
        this.cameras.main.shake(100, 0.003);
    }

    // New helper method specifically for driller explosions
    createDrillerExplosion(x, y) {
        // Create a larger explosion effect for driller bombs with distinct visuals
        const explosion = this.add.circle(x, y, 140, 0xBB5500, 0.8);
        explosion.setDepth(6);
        
        // Animate the explosion
        this.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 3.5, // Larger scale for more impressive explosion
            duration: 600, // Longer duration
            ease: 'Power2',
            onComplete: () => {
                explosion.destroy();
            }
        });
        
        // Add drilling debris particles
        const particles = this.add.particles('particle');
        particles.setDepth(6);
        
        const emitter = particles.createEmitter({
            speed: { min: 100, max: 300 }, // Faster particles
            scale: { start: 1.8, end: 0 }, // Larger particles
            alpha: { start: 1, end: 0 },
            lifespan: 1200,
            blendMode: 'ADD',
            tint: [0xBB5500, 0xFF9900, 0xFFCC00] // Brown/orange/yellow for drill explosion
        });
        
        // Emit more particles
        emitter.explode(80, x, y);
        
        // Add a flash effect
        const flash = this.add.circle(x, y, 180, 0xffffff, 1);
        flash.setDepth(6);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                flash.destroy();
            }
        });
        
        // Add secondary ring blast
        const ring = this.add.circle(x, y, 10, 0xFF9900, 0.7);
        ring.setStrokeStyle(4, 0xBB5500, 1);
        ring.setDepth(6);
        this.tweens.add({
            targets: ring,
            scale: 30,
            alpha: 0,
            duration: 800,
            onComplete: () => {
                ring.destroy();
            }
        });
        
        // Clean up particles after use
        this.time.delayedCall(1200, () => {
            particles.destroy();
        });
        
        // Add a stronger camera shake
        this.cameras.main.shake(500, 0.02);
        
        // Add explosion sound with lower pitch for bigger boom
        if (this.sound && this.sound.add) {
            try {
                const explosionSound = this.sound.add('explosion');
                explosionSound.play({ volume: 0.7, rate: 0.5 });
            } catch (e) {
                console.log("Sound not available:", e);
            }
        }
    }

    // New helper method to cleanly handle bomb resource cleanup
    cleanupBombResources(bomb) {
        try {
            // Clean up visual effects with error handling
            if (bomb.visualEffect) {
                if (bomb.visualEffect.scene) {
                    bomb.visualEffect.destroy();
                }
                bomb.visualEffect = null;
            }
            
            if (bomb.particles) {
                if (bomb.particles.scene) {
                    bomb.particles.destroy();
                }
                bomb.particles = null;
            }
            
            // Destroy the bomb sprite if it exists
            if (bomb.bombSprite) {
                if (bomb.bombSprite.scene) {
                    bomb.bombSprite.destroy();
                }
                bomb.bombSprite = null;
            }
            
            // Clean up any tweens that might be running on bomb elements
            if (bomb.visualEffect) this.tweens.killTweensOf(bomb.visualEffect);
            if (bomb.bombSprite) this.tweens.killTweensOf(bomb.bombSprite);
            
            // If any emitters are stored directly on the bomb
            if (bomb.emitter) {
                if (bomb.emitter.manager && bomb.emitter.manager.scene) {
                    bomb.emitter.stop();
                    bomb.emitter.remove();
                }
                bomb.emitter = null;
            }
        } catch (error) {
            console.error(`Error cleaning up bomb resources:`, error);
        }
    }

    // Add a global failsafe mechanism to detect and fix stuck game states
    setupGlobalFailsafe() {
        // Clear any existing failsafe
        if (this.globalFailsafeTimer) {
            clearInterval(this.globalFailsafeTimer);
        }
        
        // Create a periodic check that runs every 5 seconds
        this.globalFailsafeTimer = setInterval(() => {
            try {
                this.checkGameState();
            } catch (e) {
                console.error("Error in global failsafe:", e);
            }
        }, 5000);
    }
    
    // Check for stuck game states and auto-recover if needed
    checkGameState() {
        // Forward to gameStateManager
        this.gameStateManager.checkGameState();
        
        // For compatibility, sync the state variables
        this.isLevelComplete = this.gameStateManager.isLevelComplete;
        this.isGameOver = this.gameStateManager.isGameOver;
    }
    
    // Force reset the game state to recover from stuck situations
    forceResetGameState() {
        // Forward to gameStateManager
        this.gameStateManager.forceResetGameState();
        
        // For compatibility, sync the state variables
        this.isLevelComplete = this.gameStateManager.isLevelComplete;
        this.isGameOver = this.gameStateManager.isGameOver;
    }

    // When scene is shutting down, clean up all resources
    shutdown() {
        // Clean up the gameStateManager
        if (this.gameStateManager) {
            this.gameStateManager.shutdown();
        }
        
        // Clear the failsafe timer to prevent memory leaks
        if (this.globalFailsafeTimer) {
            clearInterval(this.globalFailsafeTimer);
            this.globalFailsafeTimer = null;
        }
        
        // Clean up any pending timeouts
        if (this.pendingReset) {
            clearTimeout(this.pendingReset);
            this.pendingReset = null;
        }
        
        if (this.bombState.autoResetTimer) {
            clearTimeout(this.bombState.autoResetTimer);
            this.bombState.autoResetTimer = null;
        }
        
        // Clean up audio resources
        if (this.audioManager) {
            try {
                console.log("Shutdown: Cleaning up audio resources");
                // Stop all audio
                this.audioManager.stopAll();
                
                // Explicitly set audio objects to null to free memory
                this.audioManager.bgMusic = null;
                this.audioManager.victoryMusic = null;
            } catch(error) {
                console.error("Error cleaning up audio in shutdown:", error);
            }
            
            // Set audioManager to null
            this.audioManager = null;
        }
        
        // Clean up any remaining bomb or resources
        if (this.bomb && this.bomb.scene) {
            this.bomb.destroy();
            this.bomb = null;
        }
        
        // Call original shutdown method
        super.shutdown();
    }

    // New method to handle damaging multi-hit blocks
    damageIceBlock(block) {
        if (!block || !block.isActive) return;
        
        // Reduce hits left
        block.hitsLeft--;
        
        // Create a damage effect using BlockUtils
        this.blockUtils.createDamageEffect(block);
        
        // If block has no hits left, destroy it
        if (block.hitsLeft <= 0) {
            this.destroyIceBlock(block);
        } else {
            // Otherwise update the appearance to show damage
            // For Eternal Ice Blocks
            if (block.blockType === this.blockTypes.TYPES.ETERNAL) {
                const newAlpha = 0.75 + (block.hitsLeft * 0.05);
                if (block.blueVeil) {
                    this.tweens.add({
                        targets: block.blueVeil,
                        alpha: newAlpha,
                        duration: 200,
                        yoyo: true,
                        ease: 'Sine.easeInOut'
                    });
                }
            } 
            // For Strong Ice Blocks
            else if (block.blockType === this.blockTypes.TYPES.STRONG) {
                const crackIntensity = 0.7 + ((2 - block.hitsLeft) * 0.15);
                if (block.blueVeil) {
                    this.tweens.add({
                        targets: block.blueVeil,
                        alpha: crackIntensity,
                        duration: 200,
                        yoyo: true,
                        ease: 'Sine.easeInOut'
                    });
                }
            }
        }
    }
    
    // New method to create damage effect for multi-hit blocks
    createDamageEffect(block) {
        // Create small particles to indicate damage
        const particles = this.add.particles('particle');
        particles.setDepth(6);
        
        let tint = 0xffffff; // Default
        
        // Set tint based on block type
        if (block.blockType === this.blockTypes.TYPES.ETERNAL) {
            tint = this.blockTypes.getColor(this.blockTypes.TYPES.ETERNAL); // Dark blue
        } else if (block.blockType === this.blockTypes.TYPES.STRONG) {
            tint = this.blockTypes.getColor(this.blockTypes.TYPES.STRONG); // Medium blue
        }
        
        const emitter = particles.createEmitter({
            speed: { min: 30, max: 80 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 400,
            blendMode: 'ADD',
            tint: tint
        });
        
        // Emit particles from the center of the block
        emitter.explode(10, block.x, block.y);
        
        // Clean up particles after use
        this.time.delayedCall(500, () => {
            particles.destroy();
        });
        
        // Add a small camera shake for feedback
        this.cameras.main.shake(100, 0.005);
        
        // Play a crack sound for feedback
        if (this.sound && this.sound.add) {
            try {
                const crackSound = this.sound.add('cracksound', { volume: 0.3 });
                crackSound.play();
            } catch (e) {
                console.log("Sound not available:", e);
            }
        }
    }
    
    // New method to create effect when bouncy blocks are hit
    createBouncyHitEffect(x, y) {
        // Visual bounce effect
        const ring = this.add.circle(x, y, 20, 0x88ddff, 0.8);
        ring.setDepth(6);
        
        this.tweens.add({
            targets: ring,
            radius: 40,
            alpha: 0,
            duration: 300,
            ease: 'Sine.easeOut',
            onUpdate: (tween) => {
                // Manually update the circle size since radius isn't a standard property
                const radius = 20 + (40 - 20) * tween.progress;
                ring.setRadius(radius);
            },
            onComplete: () => {
                ring.destroy();
            }
        });
        
        // Play bounce sound
        if (this.sound && this.sound.add) {
            try {
                const bounceSound = this.sound.add('bouncesound', { volume: 0.4 });
                if (!bounceSound.isPlaying) {
                    bounceSound.play();
                }
            } catch (e) {
                console.log("Sound not available:", e);
            }
        }
    }

    // New method for dynamite block destruction effect
    createDynamiteDestroyEffect(x, y) {
        // Create special particles for dynamite
        const particles = this.add.particles('particle');
        particles.setDepth(6);
        
        const emitter = particles.createEmitter({
            speed: { min: 80, max: 200 },
            scale: { start: 1.2, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 600,
            blendMode: 'ADD',
            tint: [0xff0000, 0xff6600, 0xffcc00] // Red/orange/yellow
        });
        
        // Emit more particles for dynamite
        emitter.explode(40, x, y);
        
        // Add a flash effect
        const flash = this.add.circle(x, y, 80, 0xffcc00, 0.8);
        flash.setDepth(6);
        this.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 2,
            duration: 200,
            onComplete: () => {
                flash.destroy();
            }
        });
        
        // Clean up particles after use
        this.time.delayedCall(700, () => {
            particles.destroy();
        });
    }

    // New method to handle bouncy block reflections
    handleBouncyBlock(block, bomb) {
        if (!bomb || !block) return;
        
        try {
            // Ensure the bomb still exists in the scene
            if (!bomb.scene) {
                console.warn("Bomb no longer in scene during bounce handling");
                return;
            }
            
            // Safety check for required bomb properties
            if (!bomb.body) {
                console.warn("Bomb has no physics body during bounce handling");
                return;
            }
            
            // Check if this is a reflective border (from a specific label)
            const isReflectiveBorder = block.body && block.body.label === 'reflectiveBorder';
            
            // Get the current velocity (with safety checks)
            let vx = 0, vy = 0;
            if (bomb.body && bomb.body.velocity) {
                vx = bomb.body.velocity.x;
                vy = bomb.body.velocity.y;
            }
            
            // Get current speed for later use
            const currentSpeed = Math.sqrt(vx * vx + vy * vy);
            
            // Initialize normal vector variables
            let nx = 0, ny = 0;
            
            // Determine the correct visual effect position for the bounce
            let effectX = block.x;
            let effectY = block.y;
            
            if (isReflectiveBorder) {
                // For reflective borders, we need to calculate normal differently based on which border was hit
                // The normal should point inward from the border
                
                // Get the border dimensions
                const borderWidth = block.body.bounds.max.x - block.body.bounds.min.x;
                const borderHeight = block.body.bounds.max.y - block.body.bounds.min.y;
                
                // For border blocks, use the bomb's position for the visual effect,
                // but clamp to the nearest border edge
                if (borderWidth > borderHeight) {
                    // This is a horizontal border (top or bottom)
                    effectX = bomb.x; // Keep x position of the bomb
                    // Clamp y to the border edge - use bomb's x but border's y
                    effectY = (block.y < this.cameras.main.height / 2) ? 
                        block.body.bounds.max.y : // Top border: use bottom edge
                        block.body.bounds.min.y;  // Bottom border: use top edge
                    
                    // Normal should point up or down
                    nx = 0;
                    ny = (block.y < this.cameras.main.height / 2) ? 1 : -1;  // Top border: normal points down, Bottom border: normal points up
                } else {
                    // This is a vertical border (left or right)
                    effectY = bomb.y; // Keep y position of the bomb
                    // Clamp x to the border edge - use bomb's y but border's x
                    effectX = (block.x < this.cameras.main.width / 2) ? 
                        block.body.bounds.max.x : // Left border: use right edge
                        block.body.bounds.min.x;  // Right border: use left edge
                    
                    // Normal should point left or right  
                    nx = (block.x < this.cameras.main.width / 2) ? 1 : -1;  // Left border: normal points right, Right border: normal points left
                    ny = 0;
                }
                
                // Create the bounce effect at the correct position
                if (this.blockUtils) {
                    this.blockUtils.createBouncyHitEffect(effectX, effectY);
                }
                
                if (this.debugMode) {
                    console.log(`Reflective border hit. Normal: (${nx}, ${ny})`);
                }
            } else {
                // For normal bouncy blocks, use the block's position for the effect
                if (this.blockUtils) {
                    this.blockUtils.createBouncyHitEffect(block.x, block.y);
                }
                
                // For normal bouncy blocks, calculate normal as vector from block center to bomb
                nx = bomb.x - block.x;
                ny = bomb.y - block.y;
        
        // Normalize the normal vector
        const length = Math.sqrt(nx * nx + ny * ny);
                if (length > 0) {
                    nx /= length;
                    ny /= length;
                } else {
                    // Fallback if positions are the same (should be rare)
                    nx = 0;
                    ny = -1; // Default upward normal
                }
            }
            
            // Calculate the reflection with proper math:
            // r = v - 2(v·n)n
            // First, calculate dot product v·n
            const dotProduct = vx * nx + vy * ny;
            
            // Calculate reflection vector components
            let reflectX = vx - 2 * dotProduct * nx;
            let reflectY = vy - 2 * dotProduct * ny;
            
            // Add a small random factor for more natural bouncing (±10%)
            const randomFactor = 0.9 + Math.random() * 0.2;
            
            // Calculate the reflection speed, with a slight boost to maintain motion
            const restitution = 0.95; // 95% of energy maintained
            const targetSpeed = currentSpeed * restitution;
            
            // Normalize and rescale the reflection vector to match the target speed
            const reflectSpeed = Math.sqrt(reflectX * reflectX + reflectY * reflectY);
            if (reflectSpeed > 0) {
                reflectX = (reflectX / reflectSpeed) * targetSpeed * randomFactor;
                reflectY = (reflectY / reflectSpeed) * targetSpeed * randomFactor;
            }
            
            // Apply the reflection vector as the new velocity
            bomb.setVelocity(reflectX, reflectY);
            
            // Ensure the bomb is not embedded in the block by moving it slightly along the normal
            const pushDistance = 5; // 5 pixels away from collision point
            bomb.x += nx * pushDistance;
            bomb.y += ny * pushDistance;
            
            // Cap the maximum speed
            if (bomb.body.velocity) {
                const newSpeed = Math.sqrt(
                    bomb.body.velocity.x * bomb.body.velocity.x + 
                    bomb.body.velocity.y * bomb.body.velocity.y
                );
                
                const maxSpeed = 40; // Same as in BombUtils for consistency
                if (newSpeed > maxSpeed) {
                    const speedFactor = maxSpeed / newSpeed;
        bomb.setVelocity(
                        bomb.body.velocity.x * speedFactor,
                        bomb.body.velocity.y * speedFactor
                    );
                }
            }
            
            // Create a visual trail effect for the bomb
            if (this.bombUtils && typeof this.bombUtils.createBounceTrail === 'function') {
        this.bombUtils.createBounceTrail(bomb);
            }
            
            // If this is a ricochet bomb, handle special bounce tracking
            if (bomb.bombType === this.BOMB_TYPES.RICOCHET) {
                // Update the bounce counter
                bomb.bounceCount = (bomb.bounceCount || 0) + 1;
                bomb.lastBounceTime = Date.now();
                bomb.lastBounceX = bomb.x;
                bomb.lastBounceY = bomb.y;
                
                // Mark the bomb as a ricochet bomb if not already
                bomb.isRicochet = true;
                
                // Make sure ricochet countdown text is updated
                if (bomb.countdownText && bomb.countdownText.scene) {
                    bomb.countdownText.setPosition(bomb.x, bomb.y - 30);
                }
            }
            
            // Create a visual flash at the bounce point
            if (this.bombUtils && typeof this.bombUtils.createBounceFlash === 'function') {
                this.bombUtils.createBounceFlash(effectX, effectY);
            }
            
        } catch (error) {
            console.error("Error in handleBouncyBlock:", error);
        }
    }
    
    // New method to add a visual trail to bounced bombs
    createBounceTrail(bomb) {
        if (!bomb || !bomb.scene) return;
        
        // Create trail particles
        const particles = this.add.particles('particle');
        particles.setDepth(5);
        
        const emitter = particles.createEmitter({
            lifespan: 300,
            speed: { min: 5, max: 20 },
            scale: { start: 0.4, end: 0 },
            alpha: { start: 0.6, end: 0 },
            blendMode: 'ADD',
            tint: 0x88ddff, // Light blue for bounce trail
            frequency: 20, // Emit a particle every 20ms
            emitZone: {
                type: 'edge',
                source: new Phaser.Geom.Circle(0, 0, 5),
                quantity: 1
            }
        });
        
        // Track the bomb to emit particles
        emitter.startFollow(bomb);
        
        // Clean up particles if bomb is destroyed
        this.time.delayedCall(1200, () => {
            if (particles && particles.scene) {
                particles.destroy();
            }
        });
        
        // Remove the trail after a short time (if bomb hasn't exploded yet)
        this.time.delayedCall(800, () => {
            if (emitter && emitter.manager && emitter.manager.scene) {
                emitter.stopFollow();
                emitter.stop();
            }
        });
    }

    // New method to create bouncy blocks around the level boundaries
    createBoundaryBouncyBlocks() {
        console.log("Creating zero-thickness reflective borders");
        
        // Add boundary blocks to a tracking array if not already created
        if (!this.boundaryBlocks) {
            this.boundaryBlocks = [];
        }
        
        // Define the physics properties for reflective borders
        const reflectiveProps = {
            isStatic: true,
            friction: 0,
            restitution: 1.0, // Perfect reflection
            isSensor: false,  // Need physical collision
            collisionFilter: {
                category: 0x0002,  // Assign specific collision category
                mask: 0xFFFFFFFF   // Collide with everything
            }
        };
        
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        const borderThickness = 10; // Thin but not zero (for physics to work)
        
        // Create the borders as invisible rectangle bodies
        
        // Top border (full width)
        this.createReflectiveBorder(
            gameWidth / 2,           // x at center of screen
            -borderThickness / 2,    // y just off-screen
            gameWidth,               // full width
            borderThickness,         // thin height
            reflectiveProps
        );
        
        // Bottom border (full width)
        this.createReflectiveBorder(
            gameWidth / 2,                      // x at center of screen
            gameHeight + borderThickness / 2,   // y just off-screen
            gameWidth,                          // full width 
            borderThickness,                    // thin height
            reflectiveProps
        );
        
        // Left border (full height)
        this.createReflectiveBorder(
            -borderThickness / 2,               // x just off-screen
            gameHeight / 2,                     // y at center of screen
            borderThickness,                    // thin width
            gameHeight,                         // full height
            reflectiveProps
        );
        
        // Right border (full height)
        this.createReflectiveBorder(
            gameWidth + borderThickness / 2,    // x just off-screen
            gameHeight / 2,                     // y at center of screen
            borderThickness,                    // thin width
            gameHeight,                         // full height
            reflectiveProps
        );
        
        console.log(`Created 4 reflective borders around the game boundary`);
    }
    
    // Helper method to create a single reflective border (invisible)
    createReflectiveBorder(x, y, width, height, physicsProps) {
        // Create an invisible rectangle body
        const border = this.matter.add.rectangle(x, y, width, height, physicsProps);
        
        // Name the body for debugging
        border.label = 'reflectiveBorder';
        
        // For debugging - add a visible representation that won't be in the final game
        if (this.debugMode) {
            const debugVisual = this.add.rectangle(x, y, width, height, 0x00ff00, 0.3);
            debugVisual.setDepth(10); // Above everything
            debugVisual.setStrokeStyle(1, 0xffffff);
        
            // Store reference for cleanup
            this.debugVisuals = this.debugVisuals || [];
            this.debugVisuals.push(debugVisual);
        }
        
        // Track this border
        this.boundaryBlocks.push(border);
        
        return border;
    }

    // Helper method to setup bomb counts based on level
    setupBombs() {
        try {
            console.log(`Setting up bombs for level ${this.currentLevel}`);
            
            // Reset bomb counts to make sure we don't keep any from previous levels
            Object.keys(this.bombsRemaining).forEach(bombType => {
                this.bombsRemaining[bombType] = 0;
            });
            
            // If we have a level manager, use its bomb counts
            if (this.levelManager) {
                const levelBombs = this.levelManager.getBombCounts();
                
                if (levelBombs) {
                    console.log(`Received bomb counts from level manager (BEFORE doubling):`, JSON.stringify(levelBombs));
                    
                    // Set bomb counts from level configuration and DOUBLE them for testing
                    Object.keys(levelBombs).forEach(bombType => {
                        // Skip undefined or invalid bomb types
                        if (!bombType || typeof levelBombs[bombType] !== 'number') {
                            return;
                        }
                        
                        // Store original count for debugging
                        const originalCount = levelBombs[bombType];
                        
                        // Double the bomb count for testing
                        this.bombsRemaining[bombType] = originalCount * 2;
                        
                        // Debug log for this specific bomb type
                        console.log(`Doubled bomb count for ${bombType}: ${originalCount} → ${this.bombsRemaining[bombType]}`);
                    });
                } else {
                    console.warn("Level manager returned no bomb counts!");
                    this.setupFallbackBombs();
                }
            } else {
                console.warn("No level manager available!");
                this.setupFallbackBombs();
            }
            
            // TESTING: Add at least 1 of each bomb type regardless of level
            Object.keys(this.BOMB_TYPES).forEach(bombTypeKey => {
                const bombType = this.BOMB_TYPES[bombTypeKey];
                if (this.bombsRemaining[bombType] < 1) {
                    this.bombsRemaining[bombType] = 1;
                    console.log(`TESTING: Added 1 ${bombType} for testing purposes`);
                }
            });
            
            // Always set driller bombs to 6 for testing purposes
            this.bombsRemaining[this.BOMB_TYPES.DRILLER] = 6;
            console.log(`Set driller bomb count to 6 for testing`);
            
            // Always set ricochet bombs to 4 for testing purposes
            this.bombsRemaining[this.BOMB_TYPES.RICOCHET] = 4;
            console.log(`Set ricochet bomb count to 4 for testing`);
            
            // Make sure we have the ricochet bombs for level 2+
            if (this.currentLevel >= 2) {
                // Ensure ricochet bombs are available
                this.bombsRemaining[this.BOMB_TYPES.RICOCHET] = Math.max(this.bombsRemaining[this.BOMB_TYPES.RICOCHET], 4);
                console.log(`Ensured ricochet bombs are available for level ${this.currentLevel}: ${this.bombsRemaining[this.BOMB_TYPES.RICOCHET]}`);
            }
            
            // Check if there's a newly unlocked bomb to select
            const unlockedBomb = this.levelManager ? this.levelManager.getUnlockedBombType() : null;
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
                        
            console.log(`Bomb setup complete for level ${this.currentLevel}:`, this.bombsRemaining);
            console.log(`Starting with bomb type: ${this.currentBombType}`);
            return true;
        } catch (error) {
            console.error("Error setting up bombs:", error);
            // Implement fallback in case of error
            this.setupFallbackBombs();
            return false;
        }
    }
    
    // Fallback method to set default bomb counts if level manager fails
    setupFallbackBombs() {
        console.log("Using fallback bomb setup for level", this.currentLevel);
        
        // Set fallback bomb counts based on level
        switch (this.currentLevel) {
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
                    [this.BOMB_TYPES.RICOCHET]: 4   // Added for testing
                };
                // Select blast bomb by default
                this.currentBombType = this.BOMB_TYPES.BLAST;
        }
        
        // TESTING: Add at least 1 of each bomb type regardless of level
        Object.keys(this.BOMB_TYPES).forEach(bombTypeKey => {
            const bombType = this.BOMB_TYPES[bombTypeKey];
            if (this.bombsRemaining[bombType] < 1) {
                this.bombsRemaining[bombType] = 1;
                console.log(`TESTING: Added 1 ${bombType} for testing purposes in fallback setup`);
            }
        });
        
        // Log bomb setup
        console.log("Fallback bomb setup complete:", this.bombsRemaining);
    }

    // Debugging function to verify if assets are loaded properly
    verifyAssets() {
        console.log('------ Asset Verification ------');
        console.log('Current level:', this.currentLevel);
        
        // Check background images
        const bgKey = `background${this.currentLevel}`;
        console.log(`Background ${bgKey}: ${this.textures.exists(bgKey) ? 'LOADED' : 'MISSING'}`);
        
        // Check chibi images
        const chibiKey = `chibi_girl${this.currentLevel}`;
        console.log(`Chibi ${chibiKey}: ${this.textures.exists(chibiKey) ? 'LOADED' : 'MISSING'}`);
        
        // Check victory background
        const victoryKey = `victoryBackground${this.currentLevel}`;
        console.log(`Victory ${victoryKey}: ${this.textures.exists(victoryKey) ? 'LOADED' : 'MISSING'}`);
        
        // Check voice assets
        let voiceFilesLoaded = 0;
        this.voiceMessages.forEach(message => {
            const audioKey = `voice_${message}`;
            const isLoaded = this.cache.audio.exists(audioKey);
            if (isLoaded) {
                voiceFilesLoaded++;
            }
            console.log(`Voice ${audioKey}: ${isLoaded ? 'LOADED' : 'MISSING'}`);
        });
        console.log(`Voice files: ${voiceFilesLoaded}/${this.voiceMessages.length} loaded`);
        
        // List all loaded textures for reference
        console.log('All loaded textures:', Object.keys(this.textures.list)
            .filter(key => key !== '__DEFAULT' && key !== '__MISSING')
            .join(', '));
        
        console.log('All loaded audio:', Object.keys(this.cache.audio.entries.entries)
            .join(', '));
            
        console.log('-------------------------------');
    }

    // Update bomb UI to reflect current bomb counts and selection
    updateBombUI() {
        console.log("Updating bomb UI with current bomb counts");
        
        // Store references to all buttons for convenience
        const buttonMap = {
            [this.BOMB_TYPES.BLAST]: this.blastButton,
            [this.BOMB_TYPES.PIERCER]: this.piercerButton,
            [this.BOMB_TYPES.CLUSTER]: this.clusterButton,
            [this.BOMB_TYPES.STICKY]: this.stickyButton,
            [this.BOMB_TYPES.SHATTERER]: this.shattererButton,
            [this.BOMB_TYPES.DRILLER]: this.drillerButton,
            [this.BOMB_TYPES.RICOCHET]: this.ricochetButton
        };
        
        // Update each button if it exists
        Object.keys(this.bombsRemaining).forEach(bombType => {
            const button = buttonMap[bombType];
            
            // Skip if this button doesn't exist
            if (!button) return;
            
            // Update counter text
            if (this.bombCounters && this.bombCounters[bombType]) {
                this.bombCounters[bombType].setText(`x${this.bombsRemaining[bombType] || 0}`);
            }
            
            // Update button interactivity and visibility
            if (this.bombsRemaining[bombType] > 0) {
                button.setAlpha(1);
                button.setInteractive({ useHandCursor: true });
            } else {
                button.setAlpha(0.5);
                button.disableInteractive();
            }
            
            // Update glow animation for each button
            if (button && button.glow) {
                // Kill any existing tweens
                this.tweens.killTweensOf(button.glow);
                
                // Determine if this is the selected button
                const isSelected = bombType === this.currentBombType;
                
                if (isSelected) {
                    // Make selected button's glow pulse
                    button.glow.setAlpha(0.5); // Higher starting alpha
                    this.tweens.add({
                        targets: button.glow,
                        alpha: { from: 0.5, to: 0.8 },
                        scale: { from: 1, to: 1.3 },
                        duration: 800,
                        yoyo: true,
                        repeat: -1
                    });
                } else {
                    // Keep non-selected button's glow subtle
                    button.glow.setAlpha(0.3);
                    button.glow.setScale(1);
                }
            }
        });
        
        // Update selection visuals using the existing updateBombSelection logic
        if (this.blastButton) { 
            this.blastButton.setScale(this.currentBombType === this.BOMB_TYPES.BLAST ? 1.15 : 1.0);
            this.blastButton.setTint(this.currentBombType === this.BOMB_TYPES.BLAST ? 0xffffff : 0xbbbbbb);
        }
        
        if (this.piercerButton) {
            this.piercerButton.setScale(this.currentBombType === this.BOMB_TYPES.PIERCER ? 1.15 : 1.0);
            this.piercerButton.setTint(this.currentBombType === this.BOMB_TYPES.PIERCER ? 0xffffff : 0xbbbbbb);
        }
        
        if (this.clusterButton) {
            this.clusterButton.setScale(this.currentBombType === this.BOMB_TYPES.CLUSTER ? 1.15 : 1.0);
            this.clusterButton.setTint(this.currentBombType === this.BOMB_TYPES.CLUSTER ? 0xffffff : 0xbbbbbb);
        }
        
        if (this.stickyButton) {
            this.stickyButton.setScale(this.currentBombType === this.BOMB_TYPES.STICKY ? 1.15 : 1.0);
            this.stickyButton.setTint(this.currentBombType === this.BOMB_TYPES.STICKY ? 0xffffff : 0xbbbbbb);
        }
        
        if (this.shattererButton) {
            this.shattererButton.setScale(this.currentBombType === this.BOMB_TYPES.SHATTERER ? 1.15 : 1.0);
            this.shattererButton.setTint(this.currentBombType === this.BOMB_TYPES.SHATTERER ? 0xffffff : 0xbbbbbb);
        }
        
        if (this.drillerButton) {
            this.drillerButton.setScale(this.currentBombType === this.BOMB_TYPES.DRILLER ? 1.15 : 1.0);
            this.drillerButton.setTint(this.currentBombType === this.BOMB_TYPES.DRILLER ? 0xffffff : 0xbbbbbb);
        }
        
        if (this.ricochetButton) {
            this.ricochetButton.setScale(this.currentBombType === this.BOMB_TYPES.RICOCHET ? 1.15 : 1.0);
            this.ricochetButton.setTint(this.currentBombType === this.BOMB_TYPES.RICOCHET ? 0xffffff : 0xbbbbbb);
        }
        
        // Update selection indicator position
        if (this.selectionIndicator) {
            let selectedButton = buttonMap[this.currentBombType];
            if (selectedButton) {
                this.selectionIndicator.setPosition(selectedButton.x, selectedButton.y);
                this.selectionIndicator.setVisible(true);
            } else {
                this.selectionIndicator.setVisible(false);
            }
        }
        
        // Update labels to highlight the selected bomb type
        if (this.bombLabels) {
            Object.keys(this.bombLabels).forEach(bombType => {
                const isSelected = bombType === this.currentBombType;
                
                // Highlight selected bomb name with brighter color and larger text
                if (this.bombLabels[bombType]) {
                    this.bombLabels[bombType].setStyle({
                        font: isSelected ? 'bold 16px Arial' : '14px Arial',
                        fill: isSelected ? '#ffff00' : '#ffffff',
                        stroke: '#000000',
                        strokeThickness: isSelected ? 5 : 4,
                        shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: isSelected ? 3 : 2, fill: true }
                    });
                }
                
                // Highlight selected bomb counter
                if (this.bombCounters[bombType]) {
                    this.bombCounters[bombType].setStyle({
                        font: isSelected ? 'bold 16px Arial' : '14px Arial',
                        fill: isSelected ? '#ffffff' : '#ffff00',
                        stroke: '#000000',
                        strokeThickness: isSelected ? 4 : 3,
                        shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: isSelected ? 3 : 2, fill: true }
                    });
                }
            });
        }
        
        // Make sure we have a valid bomb selection if the current type is depleted
        if (this.bombsRemaining[this.currentBombType] <= 0) {
            // Find a bomb type with remaining bombs
            const availableBombType = Object.keys(this.bombsRemaining).find(
                type => this.bombsRemaining[type] > 0
            );
            
            if (availableBombType) {
                this.selectBombType(availableBombType);
                console.log(`Auto-selected available bomb type: ${availableBombType}`);
            }
        }
    }

    // Update UI to reflect the current bomb selection
    updateBombSelection() {
        // Simply call the more comprehensive updateBombUI method
        this.updateBombUI();
    }

    // Setup the game world and physics
    setupGame() {
        // Clear any cached textures or game objects to ensure fresh UI
        this.game.textures.list = this.textures.list;
        
        // Setup camera to show the full 1920x1080 game world
        this.setupCamera();
        
        // Set zero gravity (world bounds are set in setupCamera)
        this.matter.world.setGravity(0, 0); // Zero gravity for space-like environment

        // Initialize arrays for game objects
        this.activeStickyBombs = [];
        
        // Initialize block utilities
        this.blockUtils = new BlockUtils(this);
        
        // Initialize bomb utilities
        this.bombUtils = new BombUtils(this);
        
        // Create trajectoryPoints for aiming path
        this.trajectoryPoints = [];
        this.trajectoryGraphics = this.add.graphics();
        this.trajectoryGraphics.setDepth(15); // Higher depth than blocks (4) to ensure visibility
        
        // Create game objects
        this.createBackground();
        
        // Create the completion veil based on chibi image shape
        this.createCompletionVeil();
        
        // Create reflective borders around the game boundary
        this.createBoundaryBouncyBlocks();
        
        // Create bow
        this.createBow();
        this.createTargets();
        
        // Create UI before resetting bomb
        this.createUI();
        
        // Reset bomb and prepare for first shot
        this.resetBomb();
        
        // Setup input handlers - use original setupInput method for bow functionality
        this.setupInput();
        
        // Setup global failsafe timer to detect stuck game states
        this.setupGlobalFailsafe();
        
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
            
            // Give it time to initialize before sending events
            this.time.delayedCall(200, () => {
                this.updateUIWithInitialValues();
            });
        } else {
            // Still add a small delay to ensure UI is ready
            this.time.delayedCall(50, () => {
                this.updateUIWithInitialValues();
            });
        }
        
        console.log("Game setup completed successfully");
    }
    
    // Helper method to update UI with initial values
    updateUIWithInitialValues() {
        try {
            // Check if UIScene exists and is active
            const uiScene = this.scene.get('UIScene');
            if (!uiScene) {
                console.warn("UI Scene not found when trying to update initial values");
                return;
            }
            
            // Check if UI components are initialized
            if (uiScene.shotsText && uiScene.percentageText) {
        // Send initial events to update UI
        this.events.emit('updateShots', this.shotsRemaining);
        this.events.emit('updatePercentage', this.revealPercentage);
                console.log("UI initial values updated successfully");
            } else {
                console.warn("UI components not ready, retrying in 100ms");
                // Try again after a short delay
                this.time.delayedCall(100, () => this.updateUIWithInitialValues());
            }
        } catch (error) {
            console.error("Error updating UI initial values:", error);
        }
    }
    
    // Initialize the level manager and return a promise
    async initializeLevelManager() {
        try {
            console.log("Initializing level manager...");
            
            // Initialize level manager
            this.levelManager = new LevelManager(this);
            
            // Set the current level in the manager
            this.levelManager.setLevel(this.currentLevel);
            
            // Initialize and wait for it to complete
            await this.levelManager.initialize();
            
            console.log("Level manager initialized successfully");
            
            // Update target percentage based on level config
            this.targetPercentage = this.levelManager.getTargetPercentage();
            
            return true;
        } catch (error) {
            console.error("Error initializing level manager:", error);
            return false;
        }
    }

    // Handle Ricochet Bomb (called when manually exploding or on timeout)
    handleRicochetBomb(x, y) {
        try {
            console.log("GameScene handling ricochet bomb explosion at:", x, y);
            
            // If we don't have a bombUtils reference yet, create one
            if (!this.bombUtils) {
                this.bombUtils = new BombUtils(this);
            }
            
            // Store positions in case of errors
            const safeX = x || 0;
            const safeY = y || 0;
            
            // First, create explosion effect
            if (this.bombUtils && this.bombUtils.createExplosion) {
                this.bombUtils.createExplosion(safeX, safeY);
            } else {
                // Fallback explosion if bombUtils method is unavailable
                this.createExplosion(safeX, safeY);
            }
            
            // Destroy blocks in a medium radius (similar to blast bomb)
            this.destroyBlocksInRadius(safeX, safeY, 150);
            
            // Check if any sticky bombs are in range and trigger them
            this.triggerStickyBomb(safeX, safeY, 150);
            
            // Track that this explosive bomb has been used
            this.events.emit('bombUsed', { type: this.BOMB_TYPES.RICOCHET, x: safeX, y: safeY });
            
            // Add a small camera shake for feedback
            if (this.cameras && this.cameras.main) {
                this.cameras.main.shake(300, 0.01);
            }
            
            // Run a quick check to ensure game state is updated properly
            this.time.delayedCall(100, () => {
                this.checkLevelCompletion();
            });
            
            // Make sure bomb is null to prevent double references
            if (this.bomb && this.bomb.bombType === this.BOMB_TYPES.RICOCHET) {
                this.bomb = null;
            }
            
            // Reset the bomb to allow new shots (with a bit longer delay)
            this.time.delayedCall(1000, () => {
                if (this.shotsRemaining > 0) {
                    this.resetBomb();
                }
            });
        } catch (error) {
            console.error("Error in handleRicochetBomb:", error);
            // If there was a critical error, try to recover
            this.time.delayedCall(500, () => {
                this.forceResetGameState();
            });
        }
    }

    
    
    // Helper method to check if a bomb is currently active
    isBombActive() {
        // If BombLauncher is available, use its method
        if (this.bombLauncher) {
            return this.bombLauncher.isBombActive();
        }
        // Fallback to original implementation
        return this.bomb && this.bomb.active && this.bombState && this.bombState.active;
    }
    
    // Helper method to fire the bomb based on pointer position
    fireBomb(pointer) {
        if (!pointer || pointer.x === undefined || pointer.y === undefined) {
            console.warn("Invalid pointer in fireBomb method");
            return;
        }

        try {
            // Use BombLauncher if available
            if (this.bombLauncher) {
                if (this.bombLauncher.launchBomb(pointer)) {
                    // Bomb was successfully launched
                    
                    // Add haptic feedback for mobile devices if supported
                    if (window.navigator && window.navigator.vibrate) {
                        window.navigator.vibrate(100); // 100ms vibration on launch
                    }
                    
                    // Decrement shots
                    this.shotsRemaining--;
                    this.events.emit('updateShots', this.shotsRemaining);
                    
                    // Clear the trajectory if any remains
                    this.clearTrajectory();
                    
                    // Log success
                    console.log(`Bomb fired successfully via BombLauncher`);
                }
                return;
            }
            
            // Fallback to original implementation if BombLauncher isn't available
            console.warn("BombLauncher not available, using legacy firing method");
            
            // Calculate angle and distance from slingshot
            const dx = this.BOW_X - pointer.x;
            const dy = this.BOW_Y - 30 - pointer.y;
            
            // Minimum drag distance required to fire (prevents accidental taps)
            const minDragDistance = 20;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDragDistance) {
                // Too small a drag, reset the bomb position
                this.resetBomb();
                return;
            }
            
            // Calculate velocity based on drag distance and angle
            const normalizedDistance = Math.min(distance, this.MAX_DRAG_DISTANCE) / this.MAX_DRAG_DISTANCE;
            const forceX = dx * this.SHOT_POWER;
            const forceY = dy * this.SHOT_POWER;
            
            // Clear any existing elastic line
            if (this.elasticLine) {
                this.elasticLine.clear();
            }
            
            // Make the bomb dynamic and apply force
            this.bomb.setStatic(false);
            this.bomb.setFixedRotation(false);
            this.bomb.setFrictionAir(0.005); // Very low air friction
            this.bomb.setAngularVelocity(0.1); // Slight rotation
            
            // Apply force to the bomb
            this.bomb.applyForce({ x: forceX, y: forceY });
            
            // IMPORTANT: Mark the bomb as launched and no longer at slingshot
            this.bomb.isLaunched = true;
            this.bomb.isAtSlingshot = false;
            
            // Set bomb as active and track last bomb fired time
            this.bombState.active = true;
            this.bombState.lastBombFired = Date.now();
            
            // Decrement shot count
            this.shotsRemaining--;
            
            // Update UI to show shots remaining
            this.events.emit('updateShots', this.shotsRemaining);
            
            // Clear the trajectory graphics
            this.clearTrajectory();
            
            // Decrement bomb count and update UI
            this.decrementBombCount(this.currentBombType);
            
            console.log(`Bomb fired with force: ${forceX.toFixed(2)}, ${forceY.toFixed(2)}`);
        } catch (error) {
            console.error("Error in fireBomb:", error);
            // Try to recover
            if (this.bombLauncher) {
                this.bombLauncher.createBomb(this.currentBombType || 'bomb');
            } else {
                this.resetBomb();
            }
        }
    }
    
    // Helper method to draw trajectory based on pointer position
    drawTrajectoryFromPointer(pointer) {
        if (!pointer || pointer.x === undefined || pointer.y === undefined) {
            console.warn("Invalid pointer in drawTrajectoryFromPointer");
            return;
        }
        
        try {
            // Use BombLauncher if available
            if (this.bombLauncher) {
                this.bombLauncher.drawTrajectoryFromPointer(pointer);
                return;
            }
            
            // Fallback to original implementation if BombLauncher isn't available
            console.warn("BombLauncher not available, using legacy drawing method");
            
            // Calculate angle and distance from slingshot
            const dx = this.BOW_X - pointer.x;
            const dy = this.BOW_Y - 30 - pointer.y;
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
            
            // Draw elastic line
            if (this.elasticLine) {
                this.elasticLine.clear();
                this.elasticLine.lineStyle(2, 0xFFFFFF, 0.8); // White, slightly transparent
                this.elasticLine.beginPath();
                // Draw from top of bow through the bomb position and to bottom of bow
                this.elasticLine.moveTo(this.BOW_X, this.BOW_Y - 40); // Top of bow
                this.elasticLine.lineTo(bombX, bombY); // Bomb position
                this.elasticLine.lineTo(this.BOW_X, this.BOW_Y + 40); // Bottom of bow
                this.elasticLine.stroke();
            }
            
            // Calculate velocity based on drag distance and angle
            const forceX = dx * this.SHOT_POWER;
            const forceY = dy * this.SHOT_POWER;
            
            // Draw trajectory prediction
            this.drawTrajectory(bombX, bombY, forceX, forceY);
        } catch (error) {
            console.error("Error in drawTrajectoryFromPointer:", error);
        }
    }

    // New method to play a random congratulatory voice message
    playRandomVoiceMessage() {
        try {
            // Don't play if audio is disabled or the level is complete/game over
            if (this.isLevelComplete || this.isGameOver || 
                (this.audioManager && !this.audioManager.soundsEnabled)) {
                return;
            }
            
            // Get a random voice message from the array
            const randomIndex = Math.floor(Math.random() * this.voiceMessages.length);
            const messageKey = this.voiceMessages[randomIndex];
            const audioKey = `voice_${messageKey}`;
            
            console.log(`Attempting to play voice message: ${messageKey}`);
            
            // Display the congratulatory text on screen
            this.displayCongratulationText(messageKey);
            
            // Local file path - ensure it's correctly formatted for direct access
            const filePath = `assets/audio/voice/${messageKey}.mp3`;
            
            // First try to play using Phaser's audio system
            if (this.sound && this.cache.audio.exists(audioKey)) {
                try {
                    const voiceSound = this.sound.add(audioKey, { volume: 0.7 });
                    voiceSound.play();
                    
                    // Debug log
                    if (this.debugMode) {
                        console.log(`Voice message played successfully: ${messageKey}`);
                    }
                    
                    return true; // Successfully played
                } catch (e) {
                    console.error(`Error playing cached voice clip ${audioKey}:`, e);
                    // Fall through to alternatives
                }
            }
            
            // Alternative 1: Try loading directly from file if not cached
            console.warn(`Voice audio not found in cache: ${audioKey}, attempting direct playback`);
            
            try {
                // Create an Audio element directly (browser API)
                const audio = new Audio(filePath);
                audio.volume = 0.7;
                
                // Log the full URL for debugging
                console.log(`Loading audio directly from: ${audio.src}`);
                
                // Play the audio with proper error handling
                audio.play()
                    .then(() => {
                        console.log(`Direct audio playback started for: ${messageKey}`);
                    })
                    .catch(err => {
                        console.error(`Direct audio play failed: ${err.message}`);
                        
                        // Alternative 2: Try one more approach for Edge/IE
                        if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                            console.log("Trying IE/Edge specific method");
                            const sound = document.createElement('audio');
                            sound.src = filePath;
                            sound.volume = 0.7;
                            sound.play();
                        }
                    });
                
                return true; // Attempted to play
            } catch (directErr) {
                console.error("All audio play attempts failed:", directErr);
                return false;
            }
        } catch (error) {
            console.error("Error in playRandomVoiceMessage:", error);
            return false;
        }
    }

    // New method to display congratulatory text messages on screen
    displayCongratulationText(message) {
        try {
            // Remove any existing congratulation text
            if (this.congratulationText && this.congratulationText.scene) {
                this.congratulationText.destroy();
            }
            
            // Format the message text - capitalize and add exclamation if needed
            let displayText = message.replace(/_/g, ' ');
            displayText = displayText.charAt(0).toUpperCase() + displayText.slice(1);
            if (!displayText.endsWith('!')) {
                displayText += '!';
            }
            
            // Create text in the center of the screen
            this.congratulationText = this.add.text(
                this.cameras.main.width / 2,
                this.cameras.main.height / 2 - 100,
                displayText,
                {
                    fontFamily: 'Arial',
                    fontSize: '48px',
                    fontStyle: 'bold',
                    color: '#FFD700', // Gold color
                    stroke: '#000000',
                    strokeThickness: 6,
                    shadow: {
                        offsetX: 3,
                        offsetY: 3,
                        color: '#000',
                        blur: 5,
                        fill: true
                    }
                }
            );
            
            // Center the text
            this.congratulationText.setOrigin(0.5);
            
            // Set high depth to appear above game elements
            this.congratulationText.setDepth(this.UI_DEPTH + 5);
            
            // Add animations to make the text pop and fade
            this.tweens.add({
                targets: this.congratulationText,
                scale: { from: 0.5, to: 1.2 },
                duration: 200,
                ease: 'Back.easeOut',
                yoyo: true,
                hold: 100,
                onComplete: () => {
                    // After the pop animation, let it stay for a moment then fade out
                    this.tweens.add({
                        targets: this.congratulationText,
                        alpha: { from: 1, to: 0 },
                        y: '-=50', // Float up while fading
                        duration: 1000,
                        delay: 800,
                        ease: 'Power2',
                        onComplete: () => {
                            // Clean up after the animation
                            if (this.congratulationText && this.congratulationText.scene) {
                                this.congratulationText.destroy();
                                this.congratulationText = null;
                            }
                        }
                    });
                }
            });
            
            if (this.debugMode) {
                console.log(`Displayed congratulation text: "${displayText}"`);
            }
            
        } catch (error) {
            console.error("Error displaying congratulation text:", error);
        }
    }

    // Method to display special text effects for large percentage clears
    displaySpecialClearText(percentageCleared) {
        try {
            // Only trigger for very significant clears (20% or more at once)
            if (percentageCleared < 20) return;
            
            // Choose message based on clear size
            let message;
            let fontSize = 52;
            let color = '#FFD700'; // Default gold
            
            if (percentageCleared >= 40) {
                message = 'SPECTACULAR!!!';
                fontSize = 64;
                color = '#FF00FF'; // Magenta for biggest clears
            } else if (percentageCleared >= 30) {
                message = 'AMAZING!!!';
                fontSize = 60;
                color = '#00FFFF'; // Cyan for big clears
            } else {
                message = 'WOW!!';
                fontSize = 56;
                color = '#FFFF00'; // Yellow for good clears
            }
            
            // Create special text that appears above regular congratulation text
            const specialText = this.add.text(
                this.cameras.main.width / 2,
                this.cameras.main.height / 2 - 180,
                message,
                {
                    fontFamily: 'Arial',
                    fontSize: `${fontSize}px`,
                    fontStyle: 'bold',
                    color: color,
                    stroke: '#000000',
                    strokeThickness: 8,
                    shadow: {
                        offsetX: 4,
                        offsetY: 4,
                        color: '#000',
                        blur: 8,
                        fill: true
                    }
                }
            );
            
            // Center the text
            specialText.setOrigin(0.5);
            
            // Set highest depth to appear above everything
            specialText.setDepth(this.UI_DEPTH + 10);
            
            // Add more dramatic animation for the special text
            this.tweens.add({
                targets: specialText,
                scale: { from: 0.3, to: 1.5 },
                duration: 350,
                ease: 'Back.easeOut',
                yoyo: true,
                hold: 200,
                onComplete: () => {
                    // Add wiggle effect
                    this.tweens.add({
                        targets: specialText,
                        angle: { from: -5, to: 5 },
                        duration: 150,
                        yoyo: true,
                        repeat: 3,
                        onComplete: () => {
                            // Then fade out
                            this.tweens.add({
                                targets: specialText,
                                alpha: { from: 1, to: 0 },
                                y: '-=80',
                                scale: { from: 1, to: 1.8 },
                                duration: 800,
                                delay: 300,
                                ease: 'Power2',
                                onComplete: () => {
                                    specialText.destroy();
                                }
                            });
                        }
                    });
                }
            });
            
            // Add a camera shake effect for extra impact
            this.cameras.main.shake(300, 0.01);
            
        } catch (error) {
            console.error("Error displaying special clear text:", error);
        }
    }

    // Method to create a fizzle effect for bombs that go out of bounds
    createFizzleEffect(x, y) {
        try {
            // Create a particle emitter for the fizzle effect
            const particles = this.add.particles('particle');
            
            const emitter = particles.createEmitter({
                x: x,
                y: y,
                speed: { min: 50, max: 150 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.6, end: 0 },
                alpha: { start: 0.8, end: 0 },
                blendMode: 'ADD',
                lifespan: 800,
                gravityY: 100,
                quantity: 15,
                tint: [0xffff00, 0xff0000, 0xffffff]
            });
            
            // Play a sound effect if available
            if (this.audioManager && this.audioManager.playSound) {
                this.audioManager.playSound('fizzle');
            }
            
            // Set the emitter to emit all particles at once, then stop
            emitter.explode(20, x, y);
            
            // Destroy the particle system after emissions complete
            this.time.delayedCall(1000, () => {
                particles.destroy();
            });
        } catch (error) {
            console.error("Error creating fizzle effect:", error);
        }
    }

    /**
     * Adds a pulsing hint for mobile users when a new bomb is loaded
     */
    addMobilePulseHint() {
        try {
            if (!this.bombLauncher || !this.bombLauncher.bomb) return;
            
            // Add touch indicator text for mobile users
            this.touchIndicator = this.add.text(
                this.bombLauncher.bomb.x,
                this.bombLauncher.bomb.y - 60,
                "Hold & Drag to Aim",
                {
                    fontFamily: 'Arial',
                    fontSize: '24px',
                    align: 'center',
                    color: '#FFFFFF',
                    stroke: '#000000',
                    strokeThickness: 4,
                    shadow: {
                        offsetX: 2,
                        offsetY: 2,
                        color: '#000',
                        blur: 2,
                        stroke: true,
                        fill: true
                    }
                }
            ).setOrigin(0.5, 0.5).setDepth(20);
            
            // Fade out the indicator after a short delay
            this.tweens.add({
                targets: this.touchIndicator,
                alpha: 0,
                delay: 1000,
                duration: 500,
                onComplete: () => {
                    if (this.touchIndicator) this.touchIndicator.destroy();
                }
            });
            
            if (this.debugMode && this.debugText) {
                console.log('Mobile hint added');
            }
        } catch (error) {
            console.error("Error adding mobile pulse hint:", error);
        }
    }

    // Apply any game settings
    applyGameSettings(delta) {
        try {
            // Check if we have a bomb when we should
            const shouldHaveBomb = !this.isLevelComplete && 
                                 !this.isGameOver && 
                                 this.shotsRemaining > 0 &&
                                 !this.isAiming;
            
            // Auto-create a bomb if one is missing when it should exist
            const bombLauncherHasBomb = this.bombLauncher && this.bombLauncher.bomb;
            const sceneBombExists = this.bomb && this.bomb.scene;
            
            // If we're not in a transition state and don't have an active/flying bomb
            if (shouldHaveBomb && !bombLauncherHasBomb && !sceneBombExists && !this.bombState.active) {
                const timeSinceLastReset = Date.now() - this.bombState.lastResetTime;
                
                // Only try to create a new bomb if we haven't just reset
                if (timeSinceLastReset > 1000) {
                    console.log("Auto-creating missing bomb in applyGameSettings");
                    this.resetBomb();
                }
            }
            
            // Check if bomb is stuck in aiming state but not moving
            if (this.isAiming && this.bombState.lastAimUpdate) {
                const aimIdleTime = Date.now() - this.bombState.lastAimUpdate;
                
                // If aiming hasn't been updated for 10 seconds, auto-release
                if (aimIdleTime > 10000) {
                    console.log("Detected stuck aiming state, auto-releasing");
                    this.isAiming = false;
                    
                    // Reset the bomb to recover from the stuck state
                    this.time.delayedCall(500, () => {
                        this.resetBomb();
                    });
                }
            }
            
            // Check if there's a stuck or lost bomb
            if (this.bombState.active) {
                const timeSinceActivation = Date.now() - this.bombState.lastBombFired;
                
                // Check for bombs that have stopped moving
                if (this.bomb && this.bomb.body && this.bomb.body.velocity && !this.bomb.hasHitIceBlock) {
                    // Skip special bomb types that shouldn't auto-explode
                    const bombType = this.bomb.bombType || this.currentBombType;
                    if (bombType !== this.BOMB_TYPES.STICKY && 
                        bombType !== this.BOMB_TYPES.DRILLER && 
                        bombType !== this.BOMB_TYPES.RICOCHET) {
                        
                        // Calculate speed of the bomb
                        const velocity = this.bomb.body.velocity;
                        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
                        
                        // If bomb has been active for at least 3 seconds and has very low speed
                        if (timeSinceActivation > 3000 && speed < 0.3) {
                            console.log(`Backup check: Bomb stopped (speed: ${speed.toFixed(2)}), exploding it`);
                            
                            // Handle explosion based on bomb type
                            const bombX = this.bomb.x;
                            const bombY = this.bomb.y;
                            
                            try {
                                // Use bombUtils if available, otherwise fall back to direct methods
                                if (this.bombUtils) {
                                    switch(bombType) {
                                        case this.BOMB_TYPES.BLAST:
                                            this.bombUtils.handleBlastBomb(bombX, bombY);
                                            break;
                                        case this.BOMB_TYPES.PIERCER:
                                            // Pass a default direction for piercer bombs that have stopped
                                            this.bombUtils.handlePiercerBomb(bombX, bombY, {x: 0, y: 1});
                                            break;
                                        case this.BOMB_TYPES.CLUSTER:
                                            this.bombUtils.handleClusterBomb(bombX, bombY);
                                            break;
                                        case this.BOMB_TYPES.SHATTERER:
                                            this.bombUtils.handleShattererBomb(bombX, bombY);
                                            break;
                                        default:
                                            this.bombUtils.handleBlastBomb(bombX, bombY);
                                            break;
                                    }
                                } else {
                                    switch(bombType) {
                                        case this.BOMB_TYPES.BLAST:
                                            this.handleBlastBomb(bombX, bombY);
                                            break;
                                        case this.BOMB_TYPES.PIERCER:
                                            // Check if the method accepts velocity parameter
                                            if (this.handlePiercerBomb.length > 2) {
                                                this.handlePiercerBomb(bombX, bombY, {x: 0, y: 1});
                                            } else {
                                                this.handlePiercerBomb(bombX, bombY);
                                            }
                                            break;
                                        case this.BOMB_TYPES.CLUSTER:
                                            this.handleClusterBomb(bombX, bombY);
                                            break;
                                        case this.BOMB_TYPES.SHATTERER:
                                            this.handleShattererBomb(bombX, bombY);
                                            break;
                                        default:
                                            this.handleBlastBomb(bombX, bombY);
                                            break;
                                    }
                                }
                            } catch (explosionError) {
                                console.error(`Error handling explosion for ${bombType}:`, explosionError);
                                
                                // Fallback to simplest explosion if specific handler failed
                                try {
                                    if (this.bombUtils) {
                                        this.bombUtils.handleBlastBomb(bombX, bombY);
                                    } else {
                                        this.handleBlastBomb(bombX, bombY);
                                    }
                                } catch (fallbackError) {
                                    console.error("Fallback explosion also failed:", fallbackError);
                                }
                            }
                            
                            // Clean up bomb
                            if (this.bomb.scene) {
                                this.bomb.destroy();
                            }
                            this.bomb = null;
                            this.bombState.active = false;
                            
                            // Create a new bomb after a delay
                            this.time.delayedCall(1000, () => {
                                if (this.shotsRemaining > 0) {
                                    this.resetBomb();
                                }
                            });
                            
                            return; // Exit early after handling the bomb
                        }
                    }
                }
                
                // If a bomb has been active for more than 20 seconds without hitting anything
                if (timeSinceActivation > 20000) {
                    console.log("Detected stuck bomb, auto-resetting");
                    
                    // Create a fizzle effect at the bomb's position if it exists
                    if (this.bomb && this.bomb.scene) {
                        this.createFizzleEffect(this.bomb.x, this.bomb.y);
                    }
                    
                    // Reset the bomb state
                    this.bombState.active = false;
                    
                    // Reset the bomb to create a new one
                    this.resetBomb();
                }
            }
            
            // Handle any pending level completion checks if game state is idle
            if (!this.isAiming && !this.bombState.active) {
                // Check for automatic level completion after a delay
                const now = Date.now();
                
                // If we haven't checked for a while and game is idle
                if (this.lastLevelCheckTime && now - this.lastLevelCheckTime > 5000) {
                    // Check level completion if no active bombs
                    this.checkLevelCompletion();
                    this.lastLevelCheckTime = now;
                }
            }
        } catch (error) {
            console.error("Error in applyGameSettings:", error);
        }
    }
}