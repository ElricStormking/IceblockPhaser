// GameState.js - Base state class for game states
class GameState {
    constructor(scene) {
        this.scene = scene;
        this.name = 'unknown';
    }
    
    // Called when entering this state
    enter(data = {}) {
        console.log(`Entering state: ${this.name}`);
    }
    
    // Called when exiting this state
    exit() {
        console.log(`Exiting state: ${this.name}`);
    }
    
    // Called every frame while in this state
    update(time, delta) {
        // Default implementation does nothing
    }
    
    // Handle user input specific to this state
    handleInput() {
        // Default implementation does nothing
    }
}

// PlayingState - Main gameplay state
class PlayingState extends GameState {
    constructor(scene) {
        super(scene);
        this.name = 'playing';
    }
    
    enter(data = {}) {
        super.enter(data);
        
        // Ensure we have necessary managers
        if (!this.scene.bombManager || !this.scene.uiManager) {
            console.error("Required managers not available in PlayingState");
            return;
        }
        
        // Reset bomb if needed
        if (!this.scene.bombManager.bomb) {
            this.scene.bombManager.createBomb(
                this.scene.SLINGSHOT_X,
                this.scene.SLINGSHOT_Y - 20
            );
        }
        
        // Enable input for gameplay
        this.scene.input.enabled = true;
    }
    
    exit() {
        super.exit();
        
        // Disable input
        this.scene.input.enabled = false;
    }
    
    update(time, delta) {
        super.update(time, delta);
        
        // Check for bomb out of bounds
        if (this.scene.bombManager && this.scene.bombManager.bomb && this.scene.bombManager.bomb.isLaunched) {
            const bomb = this.scene.bombManager.bomb;
            
            // Check if bomb is outside the world bounds
            if (bomb.x < 0 || bomb.x > this.scene.cameras.main.width ||
                bomb.y < 0 || bomb.y > this.scene.cameras.main.height) {
                
                // Create a small visual effect where the bomb exited
                if (this.scene.bombUtils) {
                    this.scene.bombUtils.createFizzleEffect(
                        Phaser.Math.Clamp(bomb.x, 10, this.scene.cameras.main.width - 10),
                        Phaser.Math.Clamp(bomb.y, 10, this.scene.cameras.main.height - 10)
                    );
                }
                
                // Reset the bomb
                this.scene.bombManager.createBomb(
                    this.scene.SLINGSHOT_X,
                    this.scene.SLINGSHOT_Y - 20
                );
            }
        }
    }
}

// LevelCompleteState - Shown when level is completed
class LevelCompleteState extends GameState {
    constructor(scene) {
        super(scene);
        this.name = 'levelComplete';
    }
    
    enter(data = {}) {
        super.enter(data);
        
        // Stop any active bombs
        if (this.scene.bombManager) {
            this.scene.bombManager.cleanup();
        }
        
        // Play victory music
        if (this.scene.audioManager) {
            this.scene.audioManager.playVictoryMusic();
        }
        
        // Show victory screen
        if (this.scene.uiManager) {
            const hasNextLevel = this.scene.levelManager ? this.scene.levelManager.hasNextLevel() : false;
            this.scene.uiManager.showVictoryScreen(
                this.scene.currentLevel,
                this.scene.revealPercentage || 0,
                hasNextLevel
            );
        }
        
        // Change background if needed
        this.displayVictoryBackground();
    }
    
    // Show victory background with animation
    displayVictoryBackground() {
        try {
            const victoryBgKey = `victoryBackground${this.scene.currentLevel}`;
            
            if (this.scene.textures.exists(victoryBgKey)) {
                // Create victory background image
                const victoryBg = this.scene.add.image(
                    this.scene.cameras.main.width / 2,
                    this.scene.cameras.main.height / 2,
                    victoryBgKey
                );
                
                // Set size to fill screen
                victoryBg.setDisplaySize(
                    this.scene.cameras.main.width,
                    this.scene.cameras.main.height
                );
                
                // Start with alpha 0
                victoryBg.setAlpha(0);
                
                // Set it above background but below other elements
                victoryBg.setDepth(0.5);
                
                // Fade in with animation
                this.scene.tweens.add({
                    targets: victoryBg,
                    alpha: 1,
                    duration: 2000,
                    ease: 'Power2',
                    onComplete: () => {
                        // Add subtle zoom animation
                        this.scene.tweens.add({
                            targets: victoryBg,
                            scale: 1.05,
                            duration: 10000,
                            yoyo: true,
                            repeat: -1,
                            ease: 'Sine.easeInOut'
                        });
                    }
                });
                
                console.log(`Victory background ${victoryBgKey} displayed`);
            } else {
                console.warn(`Victory background texture ${victoryBgKey} not found`);
            }
        } catch (error) {
            console.error("Error displaying victory background:", error);
        }
    }
}

// GameOverState - Shown when player fails the level
class GameOverState extends GameState {
    constructor(scene) {
        super(scene);
        this.name = 'gameOver';
    }
    
    enter(data = {}) {
        super.enter(data);
        
        // Stop any active bombs
        if (this.scene.bombManager) {
            this.scene.bombManager.cleanup();
        }
        
        // Play game over sound
        if (this.scene.audioManager) {
            this.scene.audioManager.playGameOverSound();
        }
        
        // Show game over screen
        if (this.scene.uiManager) {
            this.scene.uiManager.showGameOverScreen(
                this.scene.revealPercentage || 0,
                this.scene.targetPercentage || 80
            );
        }
        
        // Add red flash effect
        this.scene.cameras.main.flash(500, 255, 0, 0, 0.7);
    }
}

// Export the state classes
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        GameState,
        PlayingState,
        LevelCompleteState,
        GameOverState
    };
} else {
    // If not in Node.js, add to window object
    window.GameState = GameState;
    window.PlayingState = PlayingState;
    window.LevelCompleteState = LevelCompleteState;
    window.GameOverState = GameOverState;
} 