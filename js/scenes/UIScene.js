class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        // Get reference to game scene
        this.gameScene = this.scene.get('GameScene');
        
        // Setup camera for UI elements
        this.setupUICamera();
        
        // Get screen dimensions for positioning
        const gameWidth = 1920;
        const gameHeight = 1080;
        const centerX = gameWidth / 2;
        
        // Create UI elements with better positioning and higher visibility
        // Shots counter positioned top-left
        this.shotsText = this.add.text(150, 40, 'Shots: 5', {
            font: '28px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5, 0.5).setDepth(2);
        
        // Revealed percentage positioned at top center
        this.percentageText = this.add.text(centerX, 30, 'Revealed: 0%', {
            font: '28px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            backgroundColor: null
        }).setOrigin(0.5, 0.5).setDepth(2);
        
        // Target percentage positioned at top center, below revealed percentage
        this.targetText = this.add.text(centerX, 60, 'Target: 80%', {
            font: '22px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5, 0.5).setDepth(2);
        
        // Add a more compact progress bar
        this.progressBarBg = this.add.rectangle(
            centerX,
            90,
            350,
            12,
            0x444444,
            1
        ).setOrigin(0.5, 0.5).setDepth(1);
        
        this.progressBar = this.add.rectangle(
            centerX - 175,
            90,
            0,
            10,
            0x00ff00,
            1
        ).setOrigin(0, 0.5).setDepth(1);
        
        // Add percentage text directly on the progress bar
        this.progressText = this.add.text(
            centerX,
            90,
            '0%',
            {
                font: '14px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                backgroundColor: null
            }
        ).setOrigin(0.5, 0.5).setDepth(2);
        
        // Listen for events from GameScene
        this.gameScene.events.on('updateShots', this.updateShots, this);
        this.gameScene.events.on('updatePercentage', this.updatePercentage, this);
        this.gameScene.events.on('levelComplete', this.showLevelComplete, this);
        
        // Debug text to verify position
        if (this.gameScene.debugMode) {
            console.log(`UI positioned at width=${gameWidth}, height=${gameHeight}`);
        }
    }

    setupUICamera() {
        // Define strict dimensions
        const gameWidth = 1920;
        const gameHeight = 1080;
        
        // Configure the main camera to show the entire 1920x1080 UI area
        this.cameras.main.setName('UI Main Camera');
        this.cameras.main.setBounds(0, 0, gameWidth, gameHeight);
        this.cameras.main.setViewport(0, 0, gameWidth, gameHeight);
        this.cameras.main.setBackgroundColor('rgba(0,0,0,0)'); // Transparent background
        
        // Log camera and scaling information
        console.log(`UI Scene camera setup: ${this.scale.width}x${this.scale.height}`);
        console.log(`Scale mode: ${this.scale.scaleMode}`);
        
        // Ensure all UI elements are properly scaled and visible
        this.scale.on('resize', this.resize, this);
        
        // Make sure cameras refresh when game size changes
        this.scale.on('resize', (gameSize) => {
            console.log(`Game resized to: ${gameSize.width}x${gameSize.height}`);
            // Refresh camera bounds
            this.cameras.main.setBounds(0, 0, gameWidth, gameHeight);
            this.cameras.main.setViewport(0, 0, gameWidth, gameHeight);
        });
        
        // Initial resize call
        this.resize();
    }
    
    resize() {
        const gameWidth = 1920;
        const gameHeight = 1080;
        const scaleX = this.scale.width / gameWidth;
        const scaleY = this.scale.height / gameHeight;
        
        console.log(`UI resize: Scale factors ${scaleX.toFixed(2)}x${scaleY.toFixed(2)}`);
        
        // Ensure UI elements stay within the visible area
        // Check if any UI elements need repositioning
        const visibleHeight = this.scale.height;
        const visibleWidth = this.scale.width;
        
        // Log the visible dimensions for debugging
        console.log(`Visible game area: ${visibleWidth}x${visibleHeight}`);
        
        // Ensure camera is showing the entire game area
        this.cameras.main.setBounds(0, 0, gameWidth, gameHeight);
        this.cameras.main.setViewport(0, 0, gameWidth, gameHeight);
    }

    updateShots(shots) {
        // Add null check to prevent errors
        if (!this.shotsText || !this.shotsText.setText) {
            console.warn('UIScene: shotsText is not properly initialized');
            return;
        }
        
        // Make sure shots is valid
        if (shots === undefined || shots === null) {
            console.warn('UIScene: shots value is undefined or null');
            shots = 0;
        }
        
        this.shotsText.setText(`Shots: ${shots}`);
    }

    updatePercentage(percentage) {
        // Add null check to prevent errors
        if (!this.percentageText || !this.progressText || !this.progressBar) {
            console.warn('UIScene: percentage display elements are not properly initialized');
            return;
        }
        
        // Make sure percentage is a valid number
        if (percentage === undefined || percentage === null || isNaN(percentage)) {
            console.warn('UIScene: percentage value is invalid:', percentage);
            percentage = 0;
        }
        
        // Ensure percentage is a number and round it
        const roundedPercentage = Math.round(percentage);
        
        // Update both percentage displays
        this.percentageText.setText(`Revealed: ${roundedPercentage}%`).setVisible(true);
        this.progressText.setText(`${roundedPercentage}%`).setVisible(true);
        
        // Update progress bar - adjusted for 350px width
        this.progressBar.width = (roundedPercentage / 100) * 350;
        
        // Add visual feedback by changing color when getting closer to target
        if (roundedPercentage >= 80) {
            this.percentageText.setStyle({ 
                font: '28px Arial', // Reduced from 32px
                fill: '#00ff00',
                stroke: '#000000',
                strokeThickness: 4,
                backgroundColor: null
            }); // Green for complete
            this.progressBar.fillColor = 0x00ff00; // Green
            this.progressText.setStyle({
                font: '14px Arial', // Reduced from 16px
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                backgroundColor: null
            });
        } else if (roundedPercentage >= 60) {
            this.percentageText.setStyle({ 
                font: '28px Arial', // Reduced from 32px
                fill: '#ffff00',
                stroke: '#000000',
                strokeThickness: 4,
                backgroundColor: null
            }); // Yellow for getting close
            this.progressBar.fillColor = 0xffff00; // Yellow
            this.progressText.setStyle({
                font: '14px Arial', // Reduced from 16px
                fill: '#000000',
                stroke: '#ffffff',
                strokeThickness: 3,
                backgroundColor: null
            });
        } else if (roundedPercentage >= 30) {
            this.percentageText.setStyle({ 
                font: '28px Arial', // Reduced from 32px
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
                backgroundColor: null
            }); // White for default
            this.progressBar.fillColor = 0xff8800; // Orange
            this.progressText.setStyle({
                font: '14px Arial', // Reduced from 16px
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                backgroundColor: null
            });
        } else {
            this.percentageText.setStyle({ 
                font: '28px Arial', // Reduced from 32px
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
                backgroundColor: null
            }); // White for default
            this.progressBar.fillColor = 0xff0000; // Red
            this.progressText.setStyle({
                font: '14px Arial', // Reduced from 16px
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                backgroundColor: null
            });
        }
    }

    showLevelComplete(data) {
        // Add semi-transparent overlay for the whole screen
        const overlay = this.add.rectangle(
            this.cameras.main.width / 2, 
            this.cameras.main.height / 2, 
            this.cameras.main.width, 
            this.cameras.main.height, 
            0x000000, 0.7
        );
        
        // Add result text
        const resultText = data.result === 'win' ? 'Level Complete!' : 'Try Again!';
        const resultColor = data.result === 'win' ? '#00ff00' : '#ff0000';
        
        this.add.text(
            this.cameras.main.width / 2, 
            200, 
            resultText, 
            {
                font: '48px Arial',
                fill: resultColor,
                stroke: '#000000',
                strokeThickness: 6
            }
        ).setOrigin(0.5);
        
        // Add score information
        this.add.text(
            this.cameras.main.width / 2, 
            300, 
            `Revealed: ${data.percentage}%`, 
            {
                font: '32px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);
        
        if (data.result === 'win') {
            const bonusPoints = data.shotsRemaining * 100;
            this.add.text(
                this.cameras.main.width / 2, 
                350, 
                `Bonus Points: ${bonusPoints}`, 
                {
                    font: '32px Arial',
                    fill: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 4
                }
            ).setOrigin(0.5);
            
            const totalScore = data.percentage * 10 + bonusPoints;
            this.add.text(
                this.cameras.main.width / 2, 
                400, 
                `Total Score: ${totalScore}`, 
                {
                    font: '32px Arial',
                    fill: '#ffff00',
                    stroke: '#000000',
                    strokeThickness: 4
                }
            ).setOrigin(0.5);
        }
        
        // Add buttons
        const retryButton = this.add.text(
            this.cameras.main.width / 2 - 150, 
            500, 
            'Retry Level', 
            {
                font: '32px Arial',
                fill: '#ffffff',
                backgroundColor: '#880000',
                padding: {
                    left: 15,
                    right: 15,
                    top: 10,
                    bottom: 10
                }
            }
        ).setOrigin(0.5);
        
        retryButton.setInteractive({ useHandCursor: true });
        
        retryButton.on('pointerover', () => {
            retryButton.setStyle({ fill: '#ff9999' });
        });
        
        retryButton.on('pointerout', () => {
            retryButton.setStyle({ fill: '#ffffff' });
        });
        
        retryButton.on('pointerdown', () => {
            // Reset and restart the game scene
            this.gameScene.scene.restart();
            this.scene.restart();
        });
        
        // Add main menu button
        const menuButton = this.add.text(
            this.cameras.main.width / 2 + 150, 
            500, 
            'Main Menu', 
            {
                font: '32px Arial',
                fill: '#ffffff',
                backgroundColor: '#000088',
                padding: {
                    left: 15,
                    right: 15,
                    top: 10,
                    bottom: 10
                }
            }
        ).setOrigin(0.5);
            
        menuButton.setInteractive({ useHandCursor: true });
        
        menuButton.on('pointerover', () => {
            menuButton.setStyle({ fill: '#9999ff' });
        });
        
        menuButton.on('pointerout', () => {
            menuButton.setStyle({ fill: '#ffffff' });
        });
        
        menuButton.on('pointerdown', () => {
            this.scene.stop('GameScene');
            this.scene.stop();
            this.scene.start('MainMenuScene');
        });
    }
} 