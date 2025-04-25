class UI {
    constructor(scene) {
        this.scene = scene;
        this.bombsText = null;
        this.scoreText = null;
    }

    create() {
        // Create UI elements
        this.bombsText = this.scene.add.text(20, 20, 'Bombs: 5', {
            font: '24px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        
        this.scoreText = this.scene.add.text(20, 60, 'Score: 0', {
            font: '24px Arial',
            fill: '#ffffff',
            stroke: '#000000', 
            strokeThickness: 4
        });
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