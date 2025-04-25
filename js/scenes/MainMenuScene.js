class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    create() {
        // Add background
        this.add.image(1920/2, 1080/2, 'background');
        
        // Add decorative elements
        this.addDecorations();
        
        // Add title
        this.add.text(1920/2, 250, 'Beauty Ice Breaker', {
            font: '96px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 8
        }).setOrigin(0.5);
        
        // Add subtitle
        this.add.text(1920/2, 360, 'Prototype with Simple Shapes', {
            font: '36px Arial',
            fill: '#ffffaa',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // Add start button
        const startButton = this.add.text(1920/2, 500, 'Start Game', {
            font: '48px Arial',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 6,
            padding: { x: 30, y: 15 }
        }).setOrigin(0.5);
        
        // Add instructions
        this.add.text(1920/2, 650, 'Click and drag the bomb to aim\nRelease to shoot\nReveal at least 80% of the image to win', {
            font: '32px Arial',
            fill: '#ffffff',
            align: 'center'
        }).setOrigin(0.5);
        
        // Make button interactive
        startButton.setInteractive({ useHandCursor: true });
        
        // Add hover effect
        startButton.on('pointerover', () => {
            startButton.setStyle({ fill: '#ff9999' });
        });
        
        startButton.on('pointerout', () => {
            startButton.setStyle({ fill: '#ffffff' });
        });
        
        // Start game when button is clicked
        startButton.on('pointerdown', () => {
            this.scene.start('LoadingScene');
        });
    }
    
    addDecorations() {
        // Add some ice blocks as decoration
        for (let i = 0; i < 30; i++) { // More blocks for larger resolution
            const x = Phaser.Math.Between(100, 1820);
            const y = Phaser.Math.Between(100, 980);
            
            if (Math.abs(x - 1920/2) < 300 && y > 400 && y < 600) continue; // Don't place over the button
            
            const block = this.add.image(x, y, 'iceBlock');
            block.setScale(2); // Larger blocks for higher resolution
            block.setAlpha(0.6);
            block.setRotation(Phaser.Math.Between(-30, 30) * Math.PI / 180);
            
            // Add a tween to make it spin slowly
            this.tweens.add({
                targets: block,
                rotation: block.rotation + Math.PI * 2,
                duration: Phaser.Math.Between(5000, 15000),
                repeat: -1
            });
        }
        
        // Add a few bomb images
        for (let i = 0; i < 5; i++) { // More bombs for larger resolution
            const x = Phaser.Math.Between(200, 1720);
            const y = Phaser.Math.Between(800, 980);
            
            const bomb = this.add.image(x, y, 'bomb');
            bomb.setScale(2); // Larger bombs for higher resolution
            
            // Add a tween to make it bounce
            this.tweens.add({
                targets: bomb,
                y: bomb.y - 30, // Larger bounce
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
        
        // Add a slingshot
        this.add.image(1600, 900, 'slingshot').setOrigin(0.5, 0.9).setScale(3); // Larger slingshot
        
        // Add a preview of the chibi girl
        const preview = this.add.image(300, 900, 'chibi').setScale(0.25);
        this.tweens.add({
            targets: preview,
            alpha: 0.7,
            duration: 2000,
            yoyo: true,
            repeat: -1
        });
    }
} 