class LoadingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoadingScene' });
    }

    preload() {
        // Add a simple dark background
        this.cameras.main.setBackgroundColor('#000000');
        
        // Create the bomb textures programmatically first, before any loading occurs
        this.createBombTextures();
        
        // Loading UI with more detailed information
        const loadingText = this.add.text(
            1920/2,
            1080/2 - 120,
            'Loading Game Assets...',
            { 
                font: '42px Arial', 
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6 
            }
        ).setOrigin(0.5);
        
        // Add asset details text
        const assetText = this.add.text(
            1920/2,
            1080/2 - 60,
            'Preparing...',
            { 
                font: '32px Arial', 
                fill: '#ffffff'
            }
        ).setOrigin(0.5);
        
        // More visually appealing loading bar
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(
            1920/2 - 400,
            1080/2,
            800,
            70
        );
        
        // Add loading events
        this.load.on('progress', (value) => {
            progressBar.clear();
            progressBar.fillStyle(0x00ff00, 1);
            progressBar.fillRect(
                1920/2 - 390,
                1080/2 + 10,
                780 * value,
                50
            );
        });
        
        this.load.on('fileprogress', (file) => {
            assetText.setText('Loading: ' + file.key);
        });
        
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            assetText.destroy();
            
            console.log("Asset loading complete");
            
            // The create() method will now handle the rest
        });
        
        // Load the actual game assets
        try {
            console.log("LoadingScene: Loading game assets");
            
            // Load both images needed for the game scene here
            try {
                this.load.image('levelBackground', 'assets/images/background.png');
                this.load.image('chibi', 'assets/images/chibi_girl.png');
                
                // Load victory background image
                this.load.image('victoryBackground', 'assets/images/victory_background.png');
                
                // Load game object images
                this.load.image('slingshot', 'assets/images/slingshot.png');
                this.load.image('iceBlock', 'assets/images/ice_block.png');
                this.load.image('particle', 'assets/images/particle.png');
                this.load.image('mini_particle', 'assets/images/mini_particle.png');
                this.load.image('sticky_particle', 'assets/images/sticky_particle.png');
                this.load.image('impact_particle', 'assets/images/impact_particle.png');
                
                // Generate bomb textures programmatically instead of loading images
                this.createBombTextures();
                
                // Load audio files with simpler approach
                try {
                    console.log("Loading audio files...");
                    this.load.audio('bgMusic', 'assets/audio/background_music.mp3');
                    this.load.audio('victoryMusic', 'assets/audio/victory_music.mp3'); // Use the actual victory music file
                    this.load.audio('gameOverSound', 'assets/audio/game_over.mp3'); // Game over sound
                    this.load.audio('explosion', 'assets/audio/explosion.mp3'); // Explosion sound
                    this.load.audio('cracksound', 'assets/audio/crack.mp3'); // Cracking sound for damaging blocks
                    this.load.audio('bouncesound', 'assets/audio/bounce.mp3'); // Bounce sound for bouncy blocks
                } catch (audioError) {
                    console.error("Error loading audio files:", audioError);
                }
                
                // Add error handler for asset loading
                this.load.on('loaderror', (fileObj) => {
                    console.error("Error loading file:", fileObj.key);
                    if (fileObj.key === 'levelBackground' || fileObj.key === 'chibi') {
                        console.log(`${fileObj.key} failed to load, will use fallback`);
                    }
                });
            } catch (error) {
                console.error("Error setting up image loading:", error);
            }
        } catch (error) {
            console.error("Error during loading:", error);
            assetText.setText('Error loading assets. Click to retry.');
            
            // Allow click to retry
            this.input.once('pointerdown', () => {
                this.scene.restart();
            });
        }
    }
    
    createLevelBackground() {
        // Only create a fallback background if loading the image failed
        if (!this.textures.exists('levelBackground')) {
            console.log("Creating fallback level background");
            
            // Create a simple level background with a solid color
            const levelBg = this.add.graphics({ willReadFrequently: true });
            
            // Use a solid teal color
            levelBg.fillStyle(0x40E0D0, 1);  // Turquoise
            levelBg.fillRect(0, 0, 1920, 1080);
            
            // Add some decorative elements - circles
            levelBg.fillStyle(0xFFFFFF, 0.2);
            
            // Add several random circles with different sizes
            for (let i = 0; i < 20; i++) {
                const x = Math.random() * 1920;
                const y = Math.random() * 1080;
                const radius = 20 + Math.random() * 80;
                levelBg.fillCircle(x, y, radius);
            }
            
            // Add some decorative lines
            levelBg.lineStyle(10, 0xFFFFFF, 0.1);
            
            // Add several straight lines
            for (let i = 0; i < 5; i++) {
                const startX = Math.random() * 500;
                const startY = Math.random() * 300;
                const endX = 1500 + Math.random() * 400;
                const endY = 800 + Math.random() * 200;
                
                levelBg.beginPath();
                levelBg.moveTo(startX, startY);
                levelBg.lineTo(endX, endY);
                levelBg.strokePath();
            }
            
            // Generate the texture for use in the game scene
            levelBg.generateTexture('levelBackground', 1920, 1080);
            levelBg.clear();
            
            console.log("Created custom level background texture");
        } else {
            console.log("Using loaded level background");
        }
    }
    
    createOrLoadChibiImage() {
        // Only create a fallback chibi if loading the image failed
        if (!this.textures.exists('chibi')) {
            console.log("Creating fallback chibi image");
            
            // Create a fallback chibi image
            const chibi = this.add.graphics({ willReadFrequently: true });
            
            // Create a canvas for the chibi
            chibi.fillStyle(0x000000, 0); // Transparent background
            chibi.fillRect(0, 0, 800, 1080);
            
            // Scale proportions for the image
            const centerX = 400;
            const centerY = 400;
            const headSize = 250;
            
            // Create a pretty anime-style girl silhouette
            
            // Head shape
            chibi.fillStyle(0xff99cc, 1);
            chibi.fillCircle(centerX, centerY, headSize);
            
            // Face details
            chibi.fillStyle(0x000000, 1);
            chibi.fillCircle(centerX - 80, centerY - 50, 25); // Left eye
            chibi.fillCircle(centerX + 80, centerY - 50, 25); // Right eye
            
            // Smile
            chibi.lineStyle(15, 0x000000, 1);
            chibi.beginPath();
            chibi.arc(centerX, centerY + 30, 100, 0, Math.PI, false);
            chibi.strokePath();
            
            // Hair
            chibi.fillStyle(0x663366, 1);
            chibi.fillCircle(centerX, centerY - 120, 150);
            chibi.fillCircle(centerX - 120, centerY - 80, 100);
            chibi.fillCircle(centerX + 120, centerY - 80, 100);
            
            // Body
            chibi.fillStyle(0xff99cc, 1);
            chibi.fillTriangle(
                centerX, centerY + headSize,  // Top point
                centerX - 300, centerY + 700, // Bottom left
                centerX + 300, centerY + 700  // Bottom right
            );
            
            // Arms
            chibi.fillStyle(0xff99cc, 1);
            // Left arm
            chibi.fillRect(centerX - 320, centerY + 100, 80, 300);
            // Right arm
            chibi.fillRect(centerX + 240, centerY + 100, 80, 300);
            
            // Generate texture
            chibi.generateTexture('chibi', 800, 1080);
            chibi.clear();
            
            console.log("Created fallback chibi image");
        } else {
            console.log("Using loaded chibi image");
        }
        
        // Create fallback bomb assets if needed
        this.createFallbackGameAssets();
    }
    
    createFallbackGameAssets() {
        // Create fallback assets for critical game objects
        
        // Create fallback background if needed
        if (!this.textures.exists('levelBackground')) {
            console.log("Creating fallback background texture");
            const bg = this.add.graphics({ willReadFrequently: true });
            
            // Deep blue background
            bg.fillStyle(0x001a33, 1);
            bg.fillRect(0, 0, 1920, 1080);
            
            // Add some simple designs
            bg.lineStyle(5, 0x0066cc, 0.5);
            
            // Make a grid pattern
            for (let i = 0; i < 20; i++) {
                // Horizontal lines
                bg.moveTo(0, i * 60);
                bg.lineTo(1920, i * 60);
                
                // Vertical lines
                bg.moveTo(i * 100, 0);
                bg.lineTo(i * 100, 1080);
            }
            
            bg.generateTexture('levelBackground', 1920, 1080);
            bg.clear();
        }
        
        // Create fallback victory background if needed
        if (!this.textures.exists('victoryBackground')) {
            console.log("Creating fallback victory background texture");
            const victoryBg = this.add.graphics({ willReadFrequently: true });
            
            // Create a warm colored victory background (golden sunrise feeling)
            const gradientColors = [0xffd700, 0xff8c00, 0xff4500];
            
            // Create a radial gradient effect
            for (let i = 0; i < 10; i++) {
                const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                    { r: 255, g: 215, b: 0 },
                    { r: 255, g: 69, b: 0 },
                    10,
                    i
                );
                
                const rgb = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
                const alpha = 1 - (i * 0.1);
                
                victoryBg.fillStyle(rgb, alpha);
                victoryBg.fillCircle(1920/2, 1080/2, 1000 - i * 80);
            }
            
            // Add some "rays" of light
            victoryBg.lineStyle(15, 0xffffff, 0.5);
            for (let a = 0; a < 360; a += 15) {
                const rad = a * Math.PI / 180;
                const startX = 1920/2 + Math.cos(rad) * 200;
                const startY = 1080/2 + Math.sin(rad) * 200;
                const endX = 1920/2 + Math.cos(rad) * 900;
                const endY = 1080/2 + Math.sin(rad) * 900;
                
                victoryBg.moveTo(startX, startY);
                victoryBg.lineTo(endX, endY);
            }
            
            victoryBg.generateTexture('victoryBackground', 1920, 1080);
            victoryBg.clear();
        }
        
        // Create fallback slingshot if needed
        if (!this.textures.exists('slingshot')) {
            console.log("Creating fallback slingshot texture");
            const slingshotGraphics = this.add.graphics({ willReadFrequently: true });
            
            // Draw a simple Y shape
            slingshotGraphics.lineStyle(8, 0x663300, 1);
            slingshotGraphics.beginPath();
            slingshotGraphics.moveTo(25, 75);
            slingshotGraphics.lineTo(25, 25);
            slingshotGraphics.moveTo(25, 25);
            slingshotGraphics.lineTo(10, 5);
            slingshotGraphics.moveTo(25, 25);
            slingshotGraphics.lineTo(40, 5);
            slingshotGraphics.strokePath();
            
            slingshotGraphics.generateTexture('slingshot', 50, 80);
            slingshotGraphics.clear();
        }
        
        // Create fallback ice block if needed
        if (!this.textures.exists('iceBlock')) {
            console.log("Creating fallback ice block texture");
            const blockGraphics = this.add.graphics({ willReadFrequently: true });
            
            // Draw a simple blue square
            blockGraphics.fillStyle(0xaaddff, 1);
            blockGraphics.fillRect(0, 0, 40, 40);
            blockGraphics.lineStyle(2, 0xffffff, 0.5);
            blockGraphics.strokeRect(0, 0, 40, 40);
            
            blockGraphics.generateTexture('iceBlock', 40, 40);
            blockGraphics.clear();
        }
        
        // Create fallback particle if needed
        if (!this.textures.exists('particle')) {
            console.log("Creating fallback particle textures");
            const particleGraphics = this.add.graphics({ willReadFrequently: true });
            
            // Main particle
            particleGraphics.fillStyle(0xffffff, 1);
            particleGraphics.fillCircle(8, 8, 8);
            particleGraphics.generateTexture('particle', 16, 16);
            
            // Mini particle
            particleGraphics.fillStyle(0xffffff, 1);
            particleGraphics.fillCircle(4, 4, 4);
            particleGraphics.generateTexture('mini_particle', 8, 8);
            
            // Sticky particle
            particleGraphics.fillStyle(0xff00ff, 1);
            particleGraphics.fillCircle(4, 4, 4);
            particleGraphics.generateTexture('sticky_particle', 8, 8);
            
            // Impact particle
            particleGraphics.fillStyle(0xff5500, 1);
            particleGraphics.fillCircle(4, 4, 4);
            particleGraphics.generateTexture('impact_particle', 8, 8);
            
            particleGraphics.clear();
        }
    }
    
    startGame() {
        console.log("LoadingScene: Starting game");
        
        // No audio initialization here - will be done in GameScene
        this.scene.start('GameScene');
        this.scene.launch('UIScene');
    }

    // Add a new method to create bomb textures programmatically
    createBombTextures() {
        // Define colors for each bomb type
        const bombColors = {
            'blast_bomb': 0xff4444,     // Red for blast
            'piercer_bomb': 0x44aaff,   // Blue for piercer
            'cluster_bomb': 0xffaa44,   // Orange for cluster
            'sticky_bomb': 0x44ff44,    // Green for sticky
            'shatterer_bomb': 0xaa44ff,  // Purple for shatterer
            'driller_bomb': 0xBB5500,    // Brown for driller
            'ricochet_bomb': 0x00ccaa   // Teal/Turquoise for Ricochet
        };

        // Remove existing textures if they exist
        Object.keys(bombColors).forEach(bombType => {
            if (this.textures.exists(bombType)) {
                this.textures.remove(bombType);
                console.log(`Removed existing texture for ${bombType}`);
            }
        });
        
        // Create a default bomb texture (used for initial loading)
        if (this.textures.exists('bomb')) {
            this.textures.remove('bomb');
        }
        const defaultBomb = this.add.graphics();
        defaultBomb.fillStyle(0xffcc00, 1);
        defaultBomb.lineStyle(4, 0x000000, 1);
        defaultBomb.fillCircle(30, 30, 25);
        defaultBomb.strokeCircle(30, 30, 25);
        defaultBomb.generateTexture('bomb', 60, 60);
        defaultBomb.clear();
        defaultBomb.destroy();
        console.log('Created default bomb texture');

        // Create each bomb texture
        Object.entries(bombColors).forEach(([bombType, color]) => {
            // Create a temporary graphics object
            const graphics = this.add.graphics();
            
            // Draw the bomb (circle with face)
            graphics.fillStyle(color, 1);
            graphics.lineStyle(2, 0x000000, 1);
            
            // Draw main circle
            graphics.fillCircle(30, 30, 25);
            graphics.strokeCircle(30, 30, 25);
            
            // Add a smiley face
            // Eyes
            graphics.fillStyle(0xffffff, 1);
            graphics.fillCircle(22, 22, 6);
            graphics.fillCircle(38, 22, 6);
            
            graphics.fillStyle(0x000000, 1);
            graphics.fillCircle(22, 22, 3);
            graphics.fillCircle(38, 22, 3);
            
            // Mouth
            graphics.lineStyle(2, 0x000000, 1);
            graphics.beginPath();
            graphics.arc(30, 34, 12, 0, Math.PI, false);
            graphics.strokePath();
            
            // Add specific features based on bomb type
            switch(bombType) {
                case 'blast_bomb':
                    // Add explosion-like spikes
                    graphics.lineStyle(2, 0xff0000, 1);
                    for (let i = 0; i < 8; i++) {
                        const angle = (i / 8) * Math.PI * 2;
                        const x1 = 30 + Math.cos(angle) * 25;
                        const y1 = 30 + Math.sin(angle) * 25;
                        const x2 = 30 + Math.cos(angle) * 32;
                        const y2 = 30 + Math.sin(angle) * 32;
                        graphics.lineBetween(x1, y1, x2, y2);
                    }
                    break;
                
                case 'piercer_bomb':
                    // Add arrow-like shape
                    graphics.fillStyle(0x0000ff, 1);
                    graphics.fillTriangle(55, 30, 45, 22, 45, 38);
                    break;
                
                case 'cluster_bomb':
                    // Add smaller circles around
                    graphics.fillStyle(0xff8800, 1);
                    graphics.fillCircle(12, 12, 7);
                    graphics.fillCircle(48, 12, 7);
                    graphics.fillCircle(12, 48, 7);
                    graphics.fillCircle(48, 48, 7);
                    break;
                
                case 'sticky_bomb':
                    // Add sticky drips
                    graphics.fillStyle(0x00dd00, 1);
                    graphics.fillCircle(30, 58, 7);
                    graphics.fillCircle(15, 48, 5);
                    graphics.fillCircle(45, 48, 5);
                    break;
                
                case 'shatterer_bomb':
                    // Add crack pattern
                    graphics.lineStyle(2, 0x000000, 1);
                    for (let i = 0; i < 6; i++) {
                        const angle = (i / 6) * Math.PI * 2;
                        const x1 = 30 + Math.cos(angle) * 8;
                        const y1 = 30 + Math.sin(angle) * 8;
                        const x2 = 30 + Math.cos(angle) * 22;
                        const y2 = 30 + Math.sin(angle) * 22;
                        graphics.lineBetween(x1, y1, x2, y2);
                    }
                    break;
                
                case 'driller_bomb':
                    // Add drill-like pattern
                    graphics.lineStyle(2, 0x663300, 1);
                    graphics.beginPath();
                    graphics.moveTo(30, 12);
                    graphics.lineTo(48, 30);
                    graphics.lineTo(30, 48);
                    graphics.lineTo(12, 30);
                    graphics.lineTo(30, 12);
                    graphics.strokePath();
                    break;
                
                case 'ricochet_bomb':
                    // Add swirl/bounce lines
                    graphics.lineStyle(2, 0xffffff, 0.8); // White lines
                    graphics.beginPath();
                    graphics.arc(30, 30, 18, Math.PI * 0.2, Math.PI * 0.8, false);
                    graphics.strokePath();
                    graphics.beginPath();
                    graphics.arc(30, 30, 18, Math.PI * 1.2, Math.PI * 1.8, false);
                    graphics.strokePath();
                    break;
            }
            
            // Generate the texture with smaller size
            graphics.generateTexture(bombType, 60, 60);
            graphics.clear();
            graphics.destroy();
            
            console.log(`Created texture for ${bombType}`);
        });
        
        console.log('Created all bomb textures');
    }

    // Add a create method to ensure the textures are created at scene creation
    create() {
        // Recreate the bomb textures to ensure they exist
        this.createBombTextures();
        
        // Create a custom background for level 1
        this.createLevelBackground();
        
        // Now create or load the chibi image
        this.createOrLoadChibiImage();
        
        // Show "Press any key to continue"
        const continueText = this.add.text(
            1920/2,
            1080/2 + 100,
            'Press any key to continue',
            {
                font: '42px Arial', 
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6
            }
        ).setOrigin(0.5);
        
        // Make the text pulse
        this.tweens.add({
            targets: continueText,
            alpha: 0.5,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
        
        // Listen for input to continue
        this.input.keyboard.once('keydown', () => {
            this.startGame();
        });
        
        this.input.once('pointerdown', () => {
            this.startGame();
        });
    }
} 