class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
    }

    create() {
        // Get reference to game scene
        this.gameScene = this.scene.get('GameScene');
        
        // Create UI elements
        this.shotsText = this.add.text(20, 20, 'Shots: 5', {
            font: '24px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        
        this.percentageText = this.add.text(20, 60, 'Revealed: 0%', {
            font: '24px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        
        this.targetText = this.add.text(20, 100, 'Target: 80%', {
            font: '24px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        
        // Listen for events from GameScene
        this.gameScene.events.on('updateShots', this.updateShots, this);
        this.gameScene.events.on('updatePercentage', this.updatePercentage, this);
        this.gameScene.events.on('levelComplete', this.showLevelComplete, this);
    }

    updateShots(shots) {
        this.shotsText.setText(`Shots: ${shots}`);
    }

    updatePercentage(percentage) {
        this.percentageText.setText(`Revealed: ${percentage}%`);
        
        // Add visual feedback by changing color when getting closer to target
        if (percentage >= 80) {
            this.percentageText.setStyle({ fill: '#00ff00' }); // Green for complete
        } else if (percentage >= 60) {
            this.percentageText.setStyle({ fill: '#ffff00' }); // Yellow for getting close
        } else {
            this.percentageText.setStyle({ fill: '#ffffff' }); // White for default
        }
    }

    showLevelComplete(data) {
        // Add semi-transparent overlay
        const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.7);
        
        // Add result text
        const resultText = data.result === 'win' ? 'Level Complete!' : 'Try Again!';
        const resultColor = data.result === 'win' ? '#00ff00' : '#ff0000';
        
        this.add.text(400, 200, resultText, {
            font: '48px Arial',
            fill: resultColor,
            stroke: '#000000',
            strokeThickness: 6
        }).setOrigin(0.5);
        
        // Add score information
        this.add.text(400, 300, `Revealed: ${data.percentage}%`, {
            font: '32px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        if (data.result === 'win') {
            const bonusPoints = data.shotsRemaining * 100;
            this.add.text(400, 350, `Bonus Points: ${bonusPoints}`, {
                font: '32px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);
            
            const totalScore = data.percentage * 10 + bonusPoints;
            this.add.text(400, 400, `Total Score: ${totalScore}`, {
                font: '32px Arial',
                fill: '#ffff00',
                stroke: '#000000',
                strokeThickness: 4
            }).setOrigin(0.5);
        }
        
        // Add buttons
        const retryButton = this.add.text(400, 500, 'Retry Level', {
            font: '32px Arial',
            fill: '#ffffff',
            backgroundColor: '#880000',
            padding: {
                left: 15,
                right: 15,
                top: 10,
                bottom: 10
            }
        }).setOrigin(0.5);
        
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
        
        // If won, show next level button
        if (data.result === 'win') {
            const menuButton = this.add.text(600, 500, 'Main Menu', {
                font: '32px Arial',
                fill: '#ffffff',
                backgroundColor: '#000088',
                padding: {
                    left: 15,
                    right: 15,
                    top: 10,
                    bottom: 10
                }
            }).setOrigin(0.5);
            
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
} 