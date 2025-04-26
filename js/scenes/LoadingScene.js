class LoadingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoadingScene' });
    }

    preload() {
        // Add a simple dark background
        this.cameras.main.setBackgroundColor('#000000');
        
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
        });
        
        // Load the actual game assets
        try {
            console.log("LoadingScene: Loading game assets");
            
            // Load both images needed for the game scene here
            try {
                this.load.image('levelBackground', 'assets/images/background.png');
                this.load.image('chibi', 'assets/images/chibi_girl.png');
                
                // Load game object images
                this.load.image('slingshot', 'assets/images/slingshot.png');
                this.load.image('bomb', 'assets/images/bomb.png');
                this.load.image('iceBlock', 'assets/images/ice_block.png');
                this.load.image('particle', 'assets/images/particle.png');
                this.load.image('mini_particle', 'assets/images/mini_particle.png');
                this.load.image('sticky_particle', 'assets/images/sticky_particle.png');
                this.load.image('impact_particle', 'assets/images/impact_particle.png');
                
                // Load bomb types
                this.load.image('blast_bomb', 'assets/images/blast_bomb.png');
                this.load.image('piercer_bomb', 'assets/images/piercer_bomb.png');
                this.load.image('cluster_bomb', 'assets/images/cluster_bomb.png');
                this.load.image('sticky_bomb', 'assets/images/sticky_bomb.png');
                this.load.image('shatterer_bomb', 'assets/images/shatterer_bomb.png');
                
                // Load audio files with simpler approach
                try {
                    console.log("Loading audio files...");
                    this.load.audio('bgMusic', 'assets/audio/background_music.mp3');
                    this.load.audio('victoryMusic', 'assets/audio/victory_music.mp3'); // Use the actual victory music file
                    this.load.audio('gameOverSound', 'assets/audio/game_over.mp3'); // Game over sound
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
        
        // Create fallback bomb if needed
        if (!this.textures.exists('bomb')) {
            console.log("Creating fallback bomb texture");
            const bombGraphics = this.add.graphics({ willReadFrequently: true });
            bombGraphics.fillStyle(0x000000, 1);
            bombGraphics.fillCircle(25, 25, 25);
            bombGraphics.generateTexture('bomb', 50, 50);
            bombGraphics.clear();
            
            // Use the same fallback for all bomb types
            if (!this.textures.exists('blast_bomb')) {
                bombGraphics.fillStyle(0xff5500, 1);
                bombGraphics.fillCircle(25, 25, 25);
                bombGraphics.generateTexture('blast_bomb', 50, 50);
                bombGraphics.clear();
            }
            
            if (!this.textures.exists('piercer_bomb')) {
                bombGraphics.fillStyle(0x00aaff, 1);
                bombGraphics.fillCircle(25, 25, 25);
                bombGraphics.generateTexture('piercer_bomb', 50, 50);
                bombGraphics.clear();
            }
            
            if (!this.textures.exists('cluster_bomb')) {
                bombGraphics.fillStyle(0xffcc00, 1);
                bombGraphics.fillCircle(25, 25, 25);
                bombGraphics.generateTexture('cluster_bomb', 50, 50);
                bombGraphics.clear();
            }
            
            if (!this.textures.exists('sticky_bomb')) {
                bombGraphics.fillStyle(0xff00ff, 1);
                bombGraphics.fillCircle(25, 25, 25);
                bombGraphics.generateTexture('sticky_bomb', 50, 50);
                bombGraphics.clear();
            }
            
            if (!this.textures.exists('shatterer_bomb')) {
                bombGraphics.fillStyle(0xff0000, 1);
                bombGraphics.fillCircle(25, 25, 25);
                bombGraphics.generateTexture('shatterer_bomb', 50, 50);
                bombGraphics.clear();
            }
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
} 