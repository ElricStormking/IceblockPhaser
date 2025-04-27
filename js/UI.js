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
        this.bombsText = this.scene.add.text(gameWidth - 30, 30, 'Bombs: 5', {
            font: '28px Arial', // Larger font
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 5, // Thicker stroke
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 3, fill: true } // Add shadow
        }).setDepth(this.UI_DEPTH + 100) // Significantly increased depth to ensure it's above all panels
          .setOrigin(1, 0.5); // Right-align text, center vertically
        
        // Position score text below bombs text
        this.scoreText = this.scene.add.text(gameWidth - 30, 70, 'Score: 0', {
            font: '24px Arial',
            fill: '#ffff00', // Yellow color for score to stand out
            stroke: '#000000', 
            strokeThickness: 4,
            shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 3, fill: true } // Add shadow
        }).setDepth(this.UI_DEPTH + 100) // Significantly increased depth to ensure it's above all panels
          .setOrigin(1, 0.5); // Right-align text, center vertically
    }

    setTexts(bombsText, scoreText) {
        if (this.bombsText) {
            this.bombsText.setText(bombsText);
            
            // Update the text style for enhanced visibility
            this.bombsText.setStyle({
                font: '28px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 5,
                shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 3, fill: true }
            });
            
            // Ensure depth is maintained
            this.bombsText.setDepth(this.UI_DEPTH + 100);
        }
        
        if (this.scoreText) {
            this.scoreText.setText(scoreText);
            
            // Update the text style for enhanced visibility
            this.scoreText.setStyle({
                font: '24px Arial',
                fill: '#ffff00',
                stroke: '#000000',
                strokeThickness: 4,
                shadow: { offsetX: 2, offsetY: 2, color: '#000000', blur: 3, fill: true }
            });
            
            // Ensure depth is maintained
            this.scoreText.setDepth(this.UI_DEPTH + 100);
        }
    }
} 