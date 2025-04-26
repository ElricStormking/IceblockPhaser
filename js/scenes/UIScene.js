class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        // Get reference to game scene
        this.gameScene = this.scene.get('GameScene');
        
        // Get screen dimensions for positioning
        const gameWidth = this.cameras.main.width;
        const gameHeight = this.cameras.main.height;
        const centerX = gameWidth / 2;
        
        // Create background panels for UI elements for better visibility
        const panelColor = 0x000000;
        const panelAlpha = 0.5;
        
        // Top panel for percentage displays
        const topPanel = this.add.rectangle(
            centerX, 
            40, 
            300, 
            80, 
            panelColor, 
            panelAlpha
        ).setOrigin(0.5, 0.5).setDepth(1);
        
        // Left panel for shots counter
        const leftPanel = this.add.rectangle(
            130, 
            40, 
            240, 
            50, 
            panelColor, 
            panelAlpha
        ).setOrigin(0.5, 0.5).setDepth(1);
        
        // Create UI elements with better positioning
        // Shots counter positioned top-left
        this.shotsText = this.add.text(130, 40, 'Shots: 5', {
            font: '24px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5, 0.5).setDepth(2);
        
        // Revealed percentage positioned at top center
        this.percentageText = this.add.text(centerX, 25, 'Revealed: 0%', {
            font: '28px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4,
            backgroundColor: null
        }).setOrigin(0.5, 0.5).setDepth(2);
        
        // Target percentage positioned at top center, below revealed percentage
        this.targetText = this.add.text(centerX, 55, 'Target: 80%', {
            font: '24px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5, 0.5).setDepth(2);
        
        // Add a simple progress bar under the text
        this.progressBarBg = this.add.rectangle(
            centerX,
            80,
            250,
            12,
            0x444444,
            1
        ).setOrigin(0.5, 0.5).setDepth(1);
        
        this.progressBar = this.add.rectangle(
            centerX - 125,
            80,
            0,
            10,
            0x00ff00,
            1
        ).setOrigin(0, 0.5).setDepth(1);
        
        // Add percentage text directly on the progress bar
        this.progressText = this.add.text(
            centerX,
            80,
            '0%',
            {
                font: '16px Arial',
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
    }

    updateShots(shots) {
        this.shotsText.setText(`Shots: ${shots}`);
    }

    updatePercentage(percentage) {
        // Ensure percentage is a number and round it
        const roundedPercentage = Math.round(percentage);
        
        // Update both percentage displays
        this.percentageText.setText(`Revealed: ${roundedPercentage}%`).setVisible(true);
        this.progressText.setText(`${roundedPercentage}%`).setVisible(true);
        
        // Update progress bar
        this.progressBar.width = (roundedPercentage / 100) * 250;
        
        // Add visual feedback by changing color when getting closer to target
        if (roundedPercentage >= 80) {
            this.percentageText.setStyle({ 
                font: '28px Arial',
                fill: '#00ff00',
                stroke: '#000000',
                strokeThickness: 4,
                backgroundColor: null
            }); // Green for complete
            this.progressBar.fillColor = 0x00ff00; // Green
            this.progressText.setStyle({
                font: '16px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                backgroundColor: null
            });
        } else if (roundedPercentage >= 60) {
            this.percentageText.setStyle({ 
                font: '28px Arial',
                fill: '#ffff00',
                stroke: '#000000',
                strokeThickness: 4,
                backgroundColor: null
            }); // Yellow for getting close
            this.progressBar.fillColor = 0xffff00; // Yellow
            this.progressText.setStyle({
                font: '16px Arial',
                fill: '#000000',
                stroke: '#ffffff',
                strokeThickness: 3,
                backgroundColor: null
            });
        } else if (roundedPercentage >= 30) {
            this.percentageText.setStyle({ 
                font: '28px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
                backgroundColor: null
            }); // White for default
            this.progressBar.fillColor = 0xff8800; // Orange
            this.progressText.setStyle({
                font: '16px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                backgroundColor: null
            });
        } else {
            this.percentageText.setStyle({ 
                font: '28px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4,
                backgroundColor: null
            }); // White for default
            this.progressBar.fillColor = 0xff0000; // Red
            this.progressText.setStyle({
                font: '16px Arial',
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