// GameStateManager.js - Manages game state for level completion and game over states
class GameStateManager {
    constructor(scene) {
        this.scene = scene;
        this.isLevelComplete = false;
        this.isGameOver = false;
        this.UI_DEPTH = 1000; // Same depth as in GameScene
    }

    // Initialize the manager
    init() {
        console.log("GameStateManager: Initializing");
    }

    // Check if the level is complete based on reveal percentage
    checkLevelCompletion() {
        if (this.isLevelComplete) return;
        
        if (this.scene.revealPercentage >= this.scene.targetPercentage) {
            console.log("Level complete! Playing victory music...");
            this.isLevelComplete = true;
            
            // Clear any trajectory display
            if (this.scene.clearTrajectory) {
                this.scene.clearTrajectory();
            }
            
            // Play victory music with enhanced error handling
            if (this.scene.audioManager) {
                try {
                    this.scene.audioManager.playVictoryMusic();
                } catch (error) {
                    console.error("Error during victory music playback:", error);
                }
            } else {
                console.error("Audio manager not available for victory music");
            }
            
            // Change the background to victory background
            this.displayVictoryBackground();
            
            // Set full opacity on the chibi image
            if (this.scene.chibiImage) {
                this.scene.chibiImage.setAlpha(1);
            }
            
            // Force remove the completion veil regardless of previous removal state
            if (this.scene.completionVeil) {
                console.log("Force removing completion veil during level completion");
                this.scene.completionVeilRemoved = true;
                
                // If the completion veil is a container of blocks
                if (this.scene.veilContainer && this.scene.veilContainer.scene) {
                    // Immediately hide and destroy the veil container
                    this.scene.veilContainer.setVisible(false);
                    this.scene.veilContainer.destroy(true);
                    this.scene.veilContainer = null;
                }
                
                // Handle frost graphics separately
                if (this.scene.frostGraphics && this.scene.frostGraphics.scene) {
                    this.scene.frostGraphics.setVisible(false);
                    this.scene.frostGraphics.destroy();
                }
                
                // Ensure the completionVeil reference is cleared
                this.scene.completionVeil = null;
            }
            
            // Clear all remaining blue veils
            if (this.scene.blueVeils) {
                this.scene.blueVeils.forEach(veil => {
                    if (veil && veil.scene) {
                        // Handle any highlight effects
                        if (veil.highlight && veil.highlight.scene) {
                            this.scene.tweens.add({
                                targets: veil.highlight,
                                alpha: 0,
                                duration: 8000, // 8 seconds
                                ease: 'Linear',
                                onComplete: () => {
                                    if (veil.highlight && veil.highlight.scene) {
                                        veil.highlight.destroy();
                                    }
                                }
                            });
                        }
                        
                        // Instead of destroying immediately, fade them out
                        this.scene.tweens.add({
                            targets: veil,
                            alpha: 0,
                            duration: 8000, // 8 seconds
                            ease: 'Linear',
                            onComplete: () => {
                                if (veil && veil.scene) {
                                    veil.destroy();
                                }
                            }
                        });
                    }
                });
                // Create a new array for the next level's veils
                this.scene.blueVeils = [];
            }
            
            // Create a celebratory effect
            this.scene.cameras.main.flash(500, 255, 255, 255, 0.7);
            
            // Add some particles for celebration
            const particles = this.scene.add.particles('particle');
            particles.setDepth(6); // Same depth as explosion effects, above all game elements
            const emitter = particles.createEmitter({
                speed: { min: 100, max: 300 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.5, end: 0 },
                blendMode: 'ADD',
                lifespan: 2000,
                tint: [0xffff00, 0xff00ff, 0x00ffff, 0xff0000],
                on: false
            });
            
            // Emit particles around the chibi image
            if (this.scene.chibiImage) {
                emitter.explode(100, this.scene.chibiImage.x, this.scene.chibiImage.y);
            }
            
            // Create victory UI elements with high depth
            const victoryText = this.scene.add.text(
                this.scene.cameras.main.centerX,
                100,
                'Level Complete!',
                {
                    fontSize: '48px',
                    fontFamily: 'Arial',
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 6,
                    shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 5, fill: true }
                }
            ).setOrigin(0.5, 0.5).setDepth(this.UI_DEPTH);
            
            const percentText = this.scene.add.text(
                this.scene.cameras.main.centerX,
                200,
                `${this.scene.revealPercentage}% Revealed!`,
                {
                    fontSize: '32px',
                    fontFamily: 'Arial',
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 4
                }
            ).setOrigin(0.5, 0.5).setDepth(this.UI_DEPTH);
            
            // After a delay, show buttons
            this.scene.time.delayedCall(3000, () => {
                // Create container for buttons
                const buttonContainer = this.scene.add.container(0, 0).setDepth(this.UI_DEPTH);
                
                // Style for buttons
                const buttonStyle = {
                    fontSize: '36px',
                    fontFamily: 'Arial',
                    color: '#ffffff',
                    padding: { x: 20, y: 10 }
                };
                
                // Check if there's a next level
                const hasNextLevel = this.scene.levelManager ? 
                    this.scene.levelManager.hasNextLevel() : 
                    (this.scene.currentLevel < 5);
                
                // Adjust positions based on whether we have a next level button
                const xOffset = hasNextLevel ? 150 : 0;
                
                // Play Again button
                const restartButton = this.scene.add.text(
                    this.scene.cameras.main.centerX - xOffset,
                    this.scene.cameras.main.height - 100,
                    'Play Again',
                    {
                        ...buttonStyle,
                        backgroundColor: '#1a6dd5'
                    }
                ).setOrigin(0.5, 0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => this.scene.scene.restart());
                
                restartButton.on('pointerover', () => restartButton.setStyle({ color: '#ffff00' }));
                restartButton.on('pointerout', () => restartButton.setStyle({ color: '#ffffff' }));
                
                // Add to container
                buttonContainer.add(restartButton);
                
                // If this isn't the last level, show Next Level button
                if (hasNextLevel) {
                    // Next Level button
                    const nextLevelButton = this.scene.add.text(
                        this.scene.cameras.main.centerX + xOffset,
                        this.scene.cameras.main.height - 100,
                        'Next Level',
                        {
                            ...buttonStyle,
                            backgroundColor: '#22aa22' // Green background for next level
                        }
                    ).setOrigin(0.5, 0.5)
                    .setInteractive({ useHandCursor: true })
                    .on('pointerdown', () => {
                        // Properly stop ALL audio first
                        if (this.scene.audioManager) {
                            try {
                                console.log("Stopping audio before transitioning to next level");
                                this.scene.audioManager.stopAll();
                            } catch (e) {
                                console.error("Error stopping audio:", e);
                            }
                        }
                        
                        // Clear any timers or tweens
                        this.scene.tweens.killAll();
                        this.scene.time.removeAllEvents();
                        
                        // Advance to the next level
                        if (this.scene.levelManager && this.scene.levelManager.hasNextLevel()) {
                            // First update the level number
                            this.scene.levelManager.nextLevel();
                            this.scene.currentLevel = this.scene.levelManager.currentLevel;
                            
                            console.log(`Advancing to level ${this.scene.currentLevel}`);
                            
                            // Stop this scene and start the loading scene for the next level
                            this.scene.scene.stop('GameScene');
                            this.scene.scene.start('LoadingScene', { 
                                levelNumber: this.scene.currentLevel
                            });
                        } else {
                            console.log("No more levels available");
                        }
                    });
                    
                    nextLevelButton.on('pointerover', () => nextLevelButton.setStyle({ color: '#ffff00' }));
                    nextLevelButton.on('pointerout', () => nextLevelButton.setStyle({ color: '#ffffff' }));
                    
                    // Add to container
                    buttonContainer.add(nextLevelButton);
                    
                    // Add a celebration message about unlocking a new bomb if applicable
                    if (this.scene.levelManager && this.scene.levelManager.hasUnlockedBomb()) {
                        const bombType = this.scene.levelManager.getUnlockedBombType();
                        const bombName = this.scene.BOMB_NAMES[bombType] || 'New Bomb';
                        
                        const unlockText = this.scene.add.text(
                            this.scene.cameras.main.centerX,
                            this.scene.cameras.main.height - 170,
                            `You've unlocked ${bombName}!`,
                            {
                                fontSize: '28px',
                                fontFamily: 'Arial',
                                color: '#ffff00',
                                stroke: '#000000',
                                strokeThickness: 4,
                                shadow: { offsetX: 1, offsetY: 1, color: '#000', blur: 3, fill: true }
                            }
                        ).setOrigin(0.5, 0.5).setDepth(this.UI_DEPTH);
                        
                        // Add a pulsing effect to the unlock text
                        this.scene.tweens.add({
                            targets: unlockText,
                            scale: 1.1,
                            duration: 800,
                            yoyo: true,
                            repeat: -1,
                            ease: 'Sine.easeInOut'
                        });
                        
                        // Add to container
                        buttonContainer.add(unlockText);
                    }
                }
            });
        } else if (this.scene.shotsRemaining <= 0 && !this.isGameOver) {
            // If no shots remain and target percentage not reached, trigger game over
            this.checkGameOver();
        }
    }

    // Method to display the victory background with a nice transition
    displayVictoryBackground() {
        try {
            // Get the victory background key for the current level
            const victoryBgKey = `victoryBackground${this.scene.currentLevel}`;
            
            // Check if the victory background texture exists
            if (this.scene.textures.exists(victoryBgKey)) {
                // Create a new image for the victory background
                const victoryBg = this.scene.add.image(1920/2, 1080/2, victoryBgKey);
                
                // Make sure it spans the entire screen nicely
                victoryBg.setDisplaySize(1920, 1080);
                
                // Start with alpha 0 (fully transparent)
                victoryBg.setAlpha(0);
                
                // Set it to a depth that's above the background but below other elements
                victoryBg.setDepth(0.5); // Between background (0) and chibi (1)
                
                // Create a fade-in transition
                this.scene.tweens.add({
                    targets: victoryBg,
                    alpha: 1, // Fade to fully visible
                    duration: 2000, // Over 2 seconds
                    ease: 'Power2',
                    onComplete: () => {
                        // After fading in, make the background subtly animate
                        this.scene.tweens.add({
                            targets: victoryBg,
                            scale: 1.05, // Slightly grow
                            duration: 10000, // Very slow animation
                            yoyo: true,
                            repeat: -1, // Infinite repetition
                            ease: 'Sine.easeInOut'
                        });
                    }
                });
                
                console.log(`Victory background (${victoryBgKey}) displayed for level ${this.scene.currentLevel}`);
            } else {
                console.warn(`Victory background texture '${victoryBgKey}' not found!`);
            }
        } catch (error) {
            console.error("Error displaying victory background:", error);
        }
    }

    // Check for game over condition
    checkGameOver() {
        if (this.isGameOver || this.isLevelComplete) return;
        
        console.log("Game Over! No shots remaining.");
        this.isGameOver = true;
        
        // Clear any trajectory display
        if (this.scene.clearTrajectory) {
            this.scene.clearTrajectory();
        }
        
        // Play game over sound if available
        if (this.scene.audioManager) {
            try {
                this.scene.audioManager.playGameOverSound();
            } catch (error) {
                console.error("Error during game over sound playback:", error);
            }
        }
        
        // Apply a red flash to indicate failure
        this.scene.cameras.main.flash(500, 255, 0, 0, 0.7);
        
        // Fade out any remaining blue veils
        if (this.scene.blueVeils) {
            this.scene.blueVeils.forEach(veil => {
                if (veil && veil.scene) {
                    // Handle any highlight effects
                    if (veil.highlight && veil.highlight.scene) {
                        this.scene.tweens.add({
                            targets: veil.highlight,
                            alpha: 0,
                            duration: 8000, // 8 seconds
                            ease: 'Linear',
                            onComplete: () => {
                                if (veil.highlight && veil.highlight.scene) {
                                    veil.highlight.destroy();
                                }
                            }
                        });
                    }
                    
                    // Instead of destroying immediately, fade them out
                    this.scene.tweens.add({
                        targets: veil,
                        alpha: 0,
                        duration: 8000, // 8 seconds
                        ease: 'Linear',
                        onComplete: () => {
                            if (veil && veil.scene) {
                                veil.destroy();
                            }
                        }
                    });
                }
            });
        }
        
        // Create game over UI elements with high depth
        const gameOverText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            100,
            'Game Over!',
            {
                fontSize: '48px',
                fontFamily: 'Arial',
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 6,
                shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 5, fill: true }
            }
        ).setOrigin(0.5, 0.5).setDepth(this.UI_DEPTH);
        
        const resultText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            200,
            `You revealed ${this.scene.revealPercentage}% of ${this.scene.targetPercentage}% needed`,
            {
                fontSize: '32px',
                fontFamily: 'Arial',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5, 0.5).setDepth(this.UI_DEPTH);
        
        // After a delay, show restart button
        this.scene.time.delayedCall(2000, () => {
            const restartButton = this.scene.add.text(
                this.scene.cameras.main.centerX,
                this.scene.cameras.main.height - 100,
                'Try Again',
                {
                    fontSize: '36px',
                    fontFamily: 'Arial',
                    color: '#ffffff',
                    backgroundColor: '#d51a1a',
                    padding: { x: 20, y: 10 }
                }
            ).setOrigin(0.5, 0.5)
            .setDepth(this.UI_DEPTH)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.scene.restart());
            
            restartButton.on('pointerover', () => restartButton.setStyle({ color: '#ffff00' }));
            restartButton.on('pointerout', () => restartButton.setStyle({ color: '#ffffff' }));
        });
    }

    // Check the game state for potential recovery from stuck situations
    checkGameState() {
        const currentTime = Date.now();
        
        // Case 1: Bomb has been active for too long without hitting anything
        if (this.scene.bomb && this.scene.bomb.isLaunched && 
            (currentTime - this.scene.bombState.lastBombFired) > this.scene.bombState.maxIdleTime) {
                
            if (this.scene.debugMode) {
                console.warn(`FAILSAFE: Bomb active for ${Math.floor((currentTime - this.scene.bombState.lastBombFired)/1000)}s without action`);
            }
            
            // Force cleanup and reset
            this.forceResetGameState();
            return;
        }
        
        // Case 2: No active bomb for too long but game expects one
        if (!this.scene.bomb && !this.isLevelComplete && !this.isGameOver && 
            this.scene.shotsRemaining > 0 && 
            (currentTime - this.scene.bombState.lastResetTime) > 10000) {
                
            if (this.scene.debugMode) {
                console.warn("FAILSAFE: No active bomb for 10s when one should exist");
            }
            
            // Force a bomb reset
            this.forceResetGameState();
            return;
        }
        
        // Case 3: Pending reset that never executed
        if (this.scene.bombState.pendingReset && 
            (currentTime - this.scene.bombState.pendingReset) > 5000) {
                
            if (this.scene.debugMode) {
                console.warn("FAILSAFE: Pending reset never executed after 5s");
            }
            
            // Force cleanup and reset
            this.forceResetGameState();
            return;
        }
    }
    
    // Force reset the game state to recover from stuck situations
    forceResetGameState() {
        // Cancel all timers
        if (this.scene.bombMissTimer) {
            this.scene.bombMissTimer.remove();
            this.scene.bombMissTimer = null;
        }
        
        if (this.scene.pendingReset) {
            clearTimeout(this.scene.pendingReset);
            this.scene.pendingReset = null;
        }
        
        // Clear any stored timeouts in bombState
        if (this.scene.bombState.autoResetTimer) {
            clearTimeout(this.scene.bombState.autoResetTimer);
            this.scene.bombState.autoResetTimer = null;
        }
        
        // Ensure no bomb is active
        if (this.scene.bomb) {
            if (this.scene.bomb.scene) {
                this.scene.bomb.destroy();
            }
            this.scene.bomb = null;
        }
        
        // Reset bomb state
        this.scene.bombState.active = false;
        this.scene.bombState.pendingReset = null;
        
        // Reset the game after a short delay
        setTimeout(() => {
            if (this.scene.shotsRemaining > 0) {
                // Only reset the bomb if we should still have shots
                if (this.scene.resetBomb) {
                    this.scene.resetBomb();
                }
            } else {
                // Otherwise check if the level is complete
                this.checkLevelCompletion();
            }
        }, 500);
    }

    // Reset the game state for a new level
    resetGameState() {
        this.isLevelComplete = false;
        this.isGameOver = false;
    }

    // Clean up resources when the scene is shut down
    shutdown() {
        console.log("GameStateManager: shutting down");
    }
}

// Export the GameStateManager class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameStateManager };
} else {
    // If not in Node.js, add to window object
    window.GameStateManager = GameStateManager;
} 