// InputHandler.js - Handles all input interactions for the game
class InputHandler {
    constructor(scene) {
        // Store reference to the game scene
        this.scene = scene;
        
        // Input control flags
        this.isAiming = false;
        this.hintActive = false;
        
        // Initialize touch indicator
        this.touchIndicator = null;
    }
    
    // Set up all input handlers
    setupInputHandlers() {
        try {
            console.log("Setting up input handlers");
            
            // Make sure we clear any existing input handlers first
            this.scene.input.off('pointerdown');
            this.scene.input.off('pointermove');
            this.scene.input.off('pointerup');
            this.scene.input.off('pointercancel');
            
            // When player presses down on the slingshot
            this.scene.input.on('pointerdown', (pointer) => {
                try {
                    // Only allow interaction if we have a bomb ready
                    if (!this.scene.bomb || this.isAiming || 
                        this.scene.isLevelComplete || this.scene.isGameOver) {
                        return;
                    }
                    
                    // Immediately log touch events for debugging
                    if (this.scene.debugMode) {
                        console.log('Pointer down detected:', 
                            pointer.x, pointer.y, 
                            'isMobile:', !this.scene.game.device.os.desktop, 
                            'type:', pointer.type);
                    }
                    
                    // Check if click/touch is near the bomb - use larger detection area on mobile
                    const touchRadius = this.scene.game.device.os.desktop ? 80 : 120;
                    const distance = Phaser.Math.Distance.Between(
                        pointer.x, pointer.y, 
                        this.scene.bomb.x, this.scene.bomb.y
                    );
                    
                    if (distance < touchRadius) {
                        // Provide immediate visual feedback
                        this.scene.bomb.setTint(0xffff00);
                        
                        this.isAiming = true;
                        
                        // Keep the bomb static during aiming - we'll manually position it
                        this.scene.bomb.setStatic(true);
                        
                        // For touch devices, immediately move the bomb to the touch position
                        // This creates a more responsive feel
                        if (!this.scene.game.device.os.desktop) {
                            // Calculate initial direction from slingshot
                            const dx = this.scene.SLINGSHOT_X - pointer.x;
                            const dy = this.scene.SLINGSHOT_Y - 30 - pointer.y;
                            const distance = Math.min(
                                this.scene.MAX_DRAG_DISTANCE,
                                Math.sqrt(dx * dx + dy * dy)
                            );
                            
                            // Calculate angle
                            const angle = Math.atan2(dy, dx);
                            
                            // Calculate bomb position
                            const bombX = this.scene.SLINGSHOT_X - distance * Math.cos(angle);
                            const bombY = (this.scene.SLINGSHOT_Y - 30) - distance * Math.sin(angle);
                            
                            // Update bomb position immediately
                            this.scene.bomb.setPosition(bombX, bombY);
                            
                            // Draw elastic line immediately
                            if (this.scene.elasticLine) {
                                this.scene.elasticLine.clear();
                                this.scene.elasticLine.lineStyle(3, 0xFF0000);
                                this.scene.elasticLine.beginPath();
                                this.scene.elasticLine.moveTo(this.scene.SLINGSHOT_X - 10, this.scene.SLINGSHOT_Y - 30);
                                this.scene.elasticLine.lineTo(bombX, bombY);
                                this.scene.elasticLine.moveTo(this.scene.SLINGSHOT_X + 10, this.scene.SLINGSHOT_Y - 30);
                                this.scene.elasticLine.lineTo(bombX, bombY);
                                this.scene.elasticLine.stroke();
                            }
                        }
                        
                        // Mobile touch feedback - pulse the bomb when touched
                        this.scene.tweens.add({
                            targets: this.scene.bomb,
                            scale: { from: 1, to: 1.2 },
                            duration: 100,
                            yoyo: true,
                            ease: 'Sine.easeInOut'
                        });
                        
                        // Add touch indicator text for mobile users
                        if (this.touchIndicator) this.touchIndicator.destroy();
                        this.touchIndicator = this.scene.add.text(
                            this.scene.bomb.x,
                            this.scene.bomb.y - 60,
                            "Hold & Drag to Aim",
                            {
                                font: '16px Arial',
                                fill: '#ffffff',
                                stroke: '#000000',
                                strokeThickness: 3
                            }
                        ).setOrigin(0.5).setDepth(20);
                        
                        // Fade out the indicator after a short delay
                        this.scene.tweens.add({
                            targets: this.touchIndicator,
                            alpha: 0,
                            delay: 1000,
                            duration: 500,
                            onComplete: () => {
                                if (this.touchIndicator) this.touchIndicator.destroy();
                            }
                        });
                        
                        if (this.scene.debugMode && this.scene.debugText) {
                            console.log('Aiming started');
                            this.scene.debugText.setText(`Aiming started at ${pointer.x},${pointer.y} | distance: ${distance}`);
                        }
                    }
                } catch (error) {
                    console.error("Error in pointerdown handler:", error);
                }
            });
            
            // When player drags to aim
            this.scene.input.on('pointermove', (pointer) => {
                try {
                    if (!this.isAiming || !this.scene.bomb) return;
                    
                    // On all mobile devices, make sure the pointer is down
                    // This fixes the issue where dragging doesn't work with press and hold
                    if (!pointer.isDown && !this.scene.game.device.os.desktop) {
                        return; // Skip if touch isn't active on mobile devices
                    }
                    
                    // Calculate angle and distance from slingshot
                    const dx = this.scene.SLINGSHOT_X - pointer.x;
                    const dy = this.scene.SLINGSHOT_Y - 30 - pointer.y;
                    const distance = Math.min(
                        Phaser.Math.Distance.Between(this.scene.SLINGSHOT_X, this.scene.SLINGSHOT_Y, pointer.x, pointer.y),
                        this.scene.MAX_DRAG_DISTANCE
                    );
                    
                    // Calculate angle
                    const angle = Math.atan2(dy, dx);
                    
                    // Calculate bomb position
                    const bombX = this.scene.SLINGSHOT_X - distance * Math.cos(angle);
                    const bombY = (this.scene.SLINGSHOT_Y - 30) - distance * Math.sin(angle);
                    
                    // Update bomb position - keep it static while dragging
                    this.scene.bomb.setPosition(bombX, bombY);
                    
                    // Add debug info for touch events if in debug mode
                    if (this.scene.debugMode && this.scene.debugText) {
                        this.scene.debugText.setText(
                            `Aiming: pos=${bombX.toFixed(1)},${bombY.toFixed(1)} | ` +
                            `dx=${dx.toFixed(1)},dy=${dy.toFixed(1)} | ` +
                            `pointer.isDown=${pointer.isDown} | ` +
                            `mobile=${!this.scene.game.device.os.desktop}`
                        );
                    }
                    
                    // Update touch indicator position if it exists
                    if (this.touchIndicator && this.touchIndicator.active) {
                        this.touchIndicator.setPosition(bombX, bombY - 60);
                    }
                    
                    // Draw elastic line
                    if (this.scene.elasticLine) {
                        this.scene.elasticLine.clear();
                        this.scene.elasticLine.lineStyle(3, 0xFF0000);
                        this.scene.elasticLine.beginPath();
                        this.scene.elasticLine.moveTo(this.scene.SLINGSHOT_X - 10, this.scene.SLINGSHOT_Y - 30);
                        this.scene.elasticLine.lineTo(bombX, bombY);
                        this.scene.elasticLine.moveTo(this.scene.SLINGSHOT_X + 10, this.scene.SLINGSHOT_Y - 30);
                        this.scene.elasticLine.lineTo(bombX, bombY);
                        this.scene.elasticLine.stroke();
                    }
                    
                    // Calculate velocity based on drag distance and angle
                    const forceX = dx * this.scene.SHOT_POWER * 0.01;
                    const forceY = dy * this.scene.SHOT_POWER * 0.01;
                    
                    // Draw trajectory prediction
                    this.scene.drawTrajectory(bombX, bombY, forceX, forceY);
                } catch (error) {
                    console.error("Error in pointermove handler:", error);
                }
            });
            
            // When player releases to shoot
            this.scene.input.on('pointerup', (pointer) => {
                try {
                    if (!this.isAiming || !this.scene.bomb) return;
                    
                    // Immediately log touch release for debugging
                    if (this.scene.debugMode) {
                        console.log('Pointer up detected:', 
                            pointer.x, pointer.y, 
                            'isMobile:', !this.scene.game.device.os.desktop,
                            'downTime:', pointer.downTime,
                            'upTime:', pointer.upTime,
                            'type:', pointer.type);
                    }
                    
                    // Clear any tint applied during pointerdown
                    this.scene.bomb.clearTint();
                    
                    // Remove touch indicator if it exists
                    if (this.touchIndicator) {
                        this.touchIndicator.destroy();
                        this.touchIndicator = null;
                    }
                    
                    // Calculate force based on distance from slingshot
                    const dx = this.scene.SLINGSHOT_X - this.scene.bomb.x;
                    const dy = (this.scene.SLINGSHOT_Y - 30) - this.scene.bomb.y;
                    
                    // Check if the drag distance is significant enough to launch
                    const dragDistance = Math.sqrt(dx * dx + dy * dy);
                    if (dragDistance < 10 && !this.scene.game.device.os.desktop) {
                        // If barely moved on mobile, don't launch - just consider it a tap
                        if (this.scene.debugMode) {
                            console.log('Drag distance too small, not launching:', dragDistance);
                        }
                        // Reset position
                        this.scene.bomb.setPosition(this.scene.SLINGSHOT_X, this.scene.SLINGSHOT_Y - 20);
                        this.isAiming = false;
                        
                        // Clear visual elements
                        if (this.scene.elasticLine) this.scene.elasticLine.clear();
                        if (this.scene.trajectoryGraphics) this.scene.trajectoryGraphics.clear();
                        return;
                    }
                    
                    // Scale by shot power
                    const forceX = dx * this.scene.SHOT_POWER * 0.01;
                    const forceY = dy * this.scene.SHOT_POWER * 0.01;
                    
                    if (this.scene.debugMode && this.scene.debugText) {
                        console.log('Launching bomb with force:', forceX, forceY, 'distance:', dragDistance);
                        this.scene.debugText.setText(`Launch: force=${forceX.toFixed(3)},${forceY.toFixed(3)} | distance=${dragDistance.toFixed(1)}`);
                    }
                    
                    // Clear elastic line
                    if (this.scene.elasticLine) this.scene.elasticLine.clear();
                    
                    // Clear trajectory
                    if (this.scene.trajectoryGraphics) this.scene.trajectoryGraphics.clear();
                    
                    try {
                        // Store current bomb position and type
                        const bombX = this.scene.bomb.x;
                        const bombY = this.scene.bomb.y;
                        const bombType = this.scene.currentBombType;
                        
                        // Cancel any previous miss timer
                        if (this.scene.bombMissTimer) {
                            this.scene.bombMissTimer.remove();
                            this.scene.bombMissTimer = null;
                        }
                        
                        // Remove the old static bomb
                        this.scene.bomb.destroy();
                        
                        // Create a new dynamic bomb at the same position
                        this.scene.createDynamicBomb(bombX, bombY, bombType, forceX, forceY);
                        
                        // Add haptic feedback for mobile devices if supported
                        if (window.navigator && window.navigator.vibrate) {
                            window.navigator.vibrate(100); // 100ms vibration on launch
                        }
                        
                        // Decrement bomb count
                        this.scene.decrementBombCount(bombType);
                        
                        // Decrement shots
                        this.scene.shotsRemaining--;
                        this.scene.events.emit('updateShots', this.scene.shotsRemaining);
                        
                        // Reset aiming flag
                        this.isAiming = false;
                        
                        // Set timeout to create a new bomb if shots remain
                        this.scene.time.delayedCall(3000, () => {
                            if (this.scene.shotsRemaining > 0) {
                                if (!this.scene.bomb) {
                                    this.scene.resetBomb();
                                }
                            } else {
                                // Check level completion or game over if no shots remain
                                this.scene.checkLevelCompletion();
                            }
                        });
                    }
                    catch (error) {
                        console.error("Error launching bomb:", error);
                        if (this.scene.debugText) this.scene.debugText.setText(`ERROR: ${error.message}`);
                        
                        // Try to recover
                        this.scene.resetBomb();
                    }
                } catch (error) {
                    console.error("Error in pointerup handler:", error);
                }
            });

            // Add specific handling for touch cancel events (important for mobile)
            this.scene.input.on('pointercancel', () => {
                if (this.isAiming && this.scene.bomb) {
                    // Reset the bomb position if touch is cancelled
                    this.isAiming = false;
                    this.scene.bomb.setPosition(this.scene.SLINGSHOT_X, this.scene.SLINGSHOT_Y - 20);
                    
                    // Clear visuals
                    if (this.scene.elasticLine) this.scene.elasticLine.clear();
                    if (this.scene.trajectoryGraphics) this.scene.trajectoryGraphics.clear();
                    if (this.touchIndicator) {
                        this.touchIndicator.destroy();
                        this.touchIndicator = null;
                    }
                }
            });
            
            // Add a pulsing hint for mobile users when a new bomb is loaded
            this.scene.time.delayedCall(500, () => {
                this.addMobilePulseHint();
            });
            
            console.log("Input handlers setup complete");
        } catch (error) {
            console.error("Error setting up input handlers:", error);
        }
    }
    
    // Add a pulsing hint for mobile users to show where to touch
    addMobilePulseHint() {
        if (!this.scene.bomb || this.hintActive) return;
        
        // Only show on mobile devices
        if (!this.scene.game.device.os.desktop) {
            this.hintActive = true;
            
            // Create a pulsing circle around the bomb
            const hintCircle = this.scene.add.circle(
                this.scene.bomb.x, 
                this.scene.bomb.y, 
                30, 
                0xffffff, 
                0.5
            ).setDepth(11);
            
            // Add a hint text
            const hintText = this.scene.add.text(
                this.scene.bomb.x,
                this.scene.bomb.y - 50,
                "Tap & Drag",
                {
                    font: '18px Arial',
                    fill: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 3
                }
            ).setOrigin(0.5).setDepth(11);
            
            // Pulse animation
            this.scene.tweens.add({
                targets: [hintCircle],
                scale: { from: 1, to: 1.5 },
                alpha: { from: 0.5, to: 0 },
                duration: 1000,
                repeat: 3,
                onComplete: () => {
                    hintCircle.destroy();
                    hintText.destroy();
                    this.hintActive = false;
                }
            });
            
            // Fade text after animations
            this.scene.tweens.add({
                targets: [hintText],
                alpha: { from: 1, to: 0 },
                delay: 3000,
                duration: 1000
            });
        }
    }
    
    // Reset aim state
    resetAimState() {
        this.isAiming = false;
        
        // Clear any hint elements
        if (this.touchIndicator) {
            this.touchIndicator.destroy();
            this.touchIndicator = null;
        }
        
        this.hintActive = false;
    }
    
    // Clean up resources
    cleanup() {
        // Remove all input handlers
        this.scene.input.off('pointerdown');
        this.scene.input.off('pointermove');
        this.scene.input.off('pointerup');
        this.scene.input.off('pointercancel');
        
        // Clear any active UI elements
        if (this.touchIndicator) {
            this.touchIndicator.destroy();
            this.touchIndicator = null;
        }
        
        this.isAiming = false;
        this.hintActive = false;
    }
}

// Export the InputHandler class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { InputHandler };
} else {
    // If not in Node.js, add to window object
    window.InputHandler = InputHandler;
} 