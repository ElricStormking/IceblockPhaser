class UI {
    constructor(scene) {
        this.scene = scene;
        this.bombsText = null;
        this.scoreText = null;
        this.UI_DEPTH = 1000; // Very high depth for UI elements
    }

    create() {
        // Get game dimensions for positioning
        const gameWidth = this.scene.cameras.main.width;
        const gameHeight = this.scene.cameras.main.height;
        
        // Create UI elements with high depth - positioned at top-right corner
        this.bombsText = this.scene.add.text(gameWidth - 50, 20, 'Bombs: 5', {
            font: '24px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setDepth(this.UI_DEPTH)
          .setOrigin(1, 0); // Right-align text
        
        // Position score text below bombs text
        this.scoreText = this.scene.add.text(gameWidth - 50, 60, 'Score: 0', {
            font: '24px Arial',
            fill: '#ffffff',
            stroke: '#000000', 
            strokeThickness: 4
        }).setDepth(this.UI_DEPTH)
          .setOrigin(1, 0); // Right-align text
          
        // Add a background for better visibility
        const padding = 10;
        const bombsBg = this.scene.add.rectangle(
            gameWidth - 25 - this.bombsText.width/2, 
            20 + this.bombsText.height/2,
            this.bombsText.width + padding*2,
            this.bombsText.height + padding,
            0x000000, 0.5
        ).setOrigin(0.5).setDepth(this.UI_DEPTH - 1);
        
        const scoreBg = this.scene.add.rectangle(
            gameWidth - 25 - this.scoreText.width/2, 
            60 + this.scoreText.height/2,
            this.scoreText.width + padding*2,
            this.scoreText.height + padding,
            0x000000, 0.5
        ).setOrigin(0.5).setDepth(this.UI_DEPTH - 1);
    }

    setTexts(bombsText, scoreText) {
        if (this.bombsText) {
            this.bombsText.setText(bombsText);
        }
        
        if (this.scoreText) {
            this.scoreText.setText(scoreText);
        }
    }
} 