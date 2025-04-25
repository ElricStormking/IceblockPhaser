class LoadingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoadingScene' });
    }

    preload() {
        // Add background from already loaded assets
        this.add.image(1920/2, 1080/2, 'background');
        
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
        
        // Actually load the assets here
        try {
            console.log("LoadingScene: Loading game assets");
            // We don't need to load chibi anymore, it's created in BootScene
            
            // Simulate loading for demo purposes
            this.time.delayedCall(1000, () => {
                this.load.emit('progress', 1);
                this.load.emit('complete');
            });
        } catch (error) {
            console.error("Error loading assets:", error);
            assetText.setText('Error loading assets. Click to retry.');
            
            // Allow click to retry
            this.input.once('pointerdown', () => {
                this.scene.restart();
            });
        }
    }
    
    startGame() {
        console.log("LoadingScene: Starting game");
        this.scene.start('GameScene');
        this.scene.launch('UIScene');
    }
} 