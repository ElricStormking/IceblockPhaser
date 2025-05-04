// UIManager.js - Handles all game UI elements and interactions
class UIManager {
    constructor(scene) {
        this.scene = scene;
        this.containers = {};
        this.elements = {};
        this.UI_DEPTH = 1000; // Very high depth for UI elements
        
        // Bomb selection UI elements
        this.bombSelectorContainer = null;
        this.bombLabels = {};
        this.bombCounters = {};
        this.bombButtons = {};
        this.selectionIndicator = null;
    }
    
    // Initialize the UI system
    initialize() {
        console.log("Initializing UIManager");
        this.setupEventListeners();
        return true;
    }
    
    // Set up event listeners for UI updates
    setupEventListeners() {
        // Listen for game events to update UI
        this.scene.events.on('updateShots', this.updateShotsDisplay, this);
        this.scene.events.on('updatePercentage', this.updatePercentageDisplay, this);
        this.scene.events.on('bombCountUpdated', this.updateBombCounter, this);
        this.scene.events.on('bombTypeSelected', this.updateBombSelection, this);
    }
    
    // Create the main game UI elements
    createMainUI() {
        // Create a container for the main UI
        this.containers.main = this.scene.add.container(0, 0);
        this.containers.main.setDepth(this.UI_DEPTH);
        
        // Create shots remaining display
        this.elements.shots = this.scene.add.text(
            20, 20, 
            'Shots: 20', 
            {
                font: '24px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        
        // Create revealed percentage display
        this.elements.percentage = this.scene.add.text(
            this.scene.cameras.main.width / 2, 20,
            'Revealed: 0% (Target: 80%)',
            {
                font: '24px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5, 0);
        
        // Create score display
        this.elements.score = this.scene.add.text(
            this.scene.cameras.main.width - 20, 20,
            'Score: 0',
            {
                font: '24px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(1, 0);
        
        // Add elements to container
        this.containers.main.add([
            this.elements.shots,
            this.elements.percentage,
            this.elements.score
        ]);
        
        console.log("Main UI created");
    }
    
    // Create the bomb selector UI
    createBombSelector(bombManager) {
        // Use provided manager's constants and data
        const BOMB_TYPES = bombManager.BOMB_TYPES;
        const BOMB_NAMES = bombManager.BOMB_NAMES;
        const bombsRemaining = bombManager.bombsRemaining;
        const currentBombType = bombManager.currentBombType;
        
        // Create bomb selection buttons at the bottom of the screen
        const gameHeight = this.scene.cameras.main.height;
        const gameWidth = this.scene.cameras.main.width;
        const buttonY = gameHeight - 90; // Position from bottom edge
        const spacing = 130; // Space between buttons
        
        // Calculate starting X position to center the bomb selector
        const numBombs = Object.keys(BOMB_TYPES).length;
        const startX = gameWidth / 2 - (spacing * (numBombs - 1) / 2);
        
        // Clear existing bomb selector if it exists
        if (this.bombSelectorContainer) {
            this.bombSelectorContainer.destroy();
        }
        
        // Create a container for the bomb selector UI
        this.bombSelectorContainer = this.scene.add.container(0, 0);
        this.bombSelectorContainer.setDepth(this.UI_DEPTH);
        
        // Create background panel with border
        const selectorBg = this.scene.add.rectangle(
            gameWidth / 2,
            buttonY,
            gameWidth,
            100,
            0x000000,
            0.5
        );
        selectorBg.setDepth(this.UI_DEPTH - 1);
        selectorBg.setStrokeStyle(2, 0x3388ff, 0.8);
        
        // Add to container
        this.bombSelectorContainer.add(selectorBg);
        
        // Reset references
        this.bombButtons = {};
        this.bombLabels = {};
        this.bombCounters = {};
        
        // Define colors for each bomb type
        const bombColors = {
            [BOMB_TYPES.BLAST]: 0xff4444,     // Red for blast
            [BOMB_TYPES.PIERCER]: 0x44aaff,   // Blue for piercer
            [BOMB_TYPES.CLUSTER]: 0xffaa44,   // Orange for cluster
            [BOMB_TYPES.STICKY]: 0x44ff44,    // Green for sticky
            [BOMB_TYPES.SHATTERER]: 0xaa44ff,  // Purple for shatterer
            [BOMB_TYPES.DRILLER]: 0xBB5500,    // Brown for driller
            [BOMB_TYPES.RICOCHET]: 0x00FFFF    // Cyan for ricochet
        };
        
        // Helper to create a bomb button
        const createBombButton = (x, y, bombType) => {
            // Create button with higher depth than background
            const button = this.scene.add.image(x, y, bombType)
                .setScale(1.0)
                .setDisplaySize(60, 60)
                .setInteractive()
                .setDepth(this.UI_DEPTH + 1);
            
            // Add glow effect using the bomb's color
            const glowColor = bombColors[bombType] || 0xffffff;
            const glow = this.scene.add.circle(x, y, 22, glowColor, 0.3);
            glow.setDepth(this.UI_DEPTH);
            this.bombSelectorContainer.add(glow);
            
            // Set up click handler
            button.on('pointerdown', () => {
                // Call the bomb manager to change the selected type
                this.scene.events.emit('selectBombType', bombType);
            });
            
            // Name label style
            const nameStyle = {
                font: '12px Arial',
                fill: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3,
                shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true }
            };
            
            // Counter style
            const counterStyle = {
                font: '12px Arial',
                fill: '#ffff00',
                stroke: '#000000',
                strokeThickness: 2,
                shadow: { offsetX: 1, offsetY: 1, color: '#000000', blur: 2, fill: true }
            };
            
            // Create name label
            const nameLabel = this.scene.add.text(
                x,
                y + 18,
                BOMB_NAMES[bombType],
                nameStyle
            ).setOrigin(0.5).setDepth(this.UI_DEPTH + 1);
            
            // Create counter label
            const counterLabel = this.scene.add.text(
                x,
                y - 18,
                `x${bombsRemaining[bombType] || 0}`,
                counterStyle
            ).setOrigin(0.5).setDepth(this.UI_DEPTH + 1);
            
            // Add to container
            this.bombSelectorContainer.add(button);
            this.bombSelectorContainer.add(nameLabel);
            this.bombSelectorContainer.add(counterLabel);
            
            // Store references
            button.glow = glow;
            this.bombButtons[bombType] = button;
            this.bombLabels[bombType] = nameLabel;
            this.bombCounters[bombType] = counterLabel;
            
            return button;
        };
        
        // Create buttons for each bomb type
        let index = 0;
        Object.values(BOMB_TYPES).forEach(bombType => {
            createBombButton(startX + spacing * index, buttonY, bombType);
            index++;
        });
        
        // Create selection indicator
        this.createSelectionIndicator();
        
        // Update the visual selection based on current bomb type
        this.updateBombSelection(currentBombType);
        
        console.log("Bomb selector UI created");
        return this.bombSelectorContainer;
    }
    
    // Create the selection indicator for bomb selection
    createSelectionIndicator() {
        // Create a highlight circle for the selected bomb
        this.selectionIndicator = this.scene.add.circle(0, 0, 35, 0xffff00, 0.4);
        this.selectionIndicator.setDepth(this.UI_DEPTH);
        this.bombSelectorContainer.add(this.selectionIndicator);
        
        // Add a pulsing animation
        this.scene.tweens.add({
            targets: this.selectionIndicator,
            scale: { from: 1, to: 1.2 },
            alpha: { from: 0.4, to: 0.6 },
            duration: 800,
            yoyo: true,
            repeat: -1
        });
    }
    
    // Update the selection indicator position
    updateBombSelection(bombType) {
        // Find the button for this bomb type
        const button = this.bombButtons[bombType];
        
        if (button) {
            // Update selection indicator position
            this.selectionIndicator.setPosition(button.x, button.y);
            this.selectionIndicator.setVisible(true);
            
            // Update visual state of all buttons
            Object.entries(this.bombButtons).forEach(([type, btn]) => {
                const isSelected = type === bombType;
                
                // Scale and tint the button based on selection
                btn.setScale(isSelected ? 1.15 : 1.0);
                btn.setTint(isSelected ? 0xffffff : 0xbbbbbb);
                
                // Update button glow
                if (btn.glow) {
                    // Kill any existing tweens
                    this.scene.tweens.killTweensOf(btn.glow);
                    
                    if (isSelected) {
                        // Make selected button's glow pulse
                        btn.glow.setAlpha(0.5);
                        this.scene.tweens.add({
                            targets: btn.glow,
                            alpha: { from: 0.5, to: 0.8 },
                            scale: { from: 1, to: 1.3 },
                            duration: 800,
                            yoyo: true,
                            repeat: -1
                        });
                    } else {
                        // Keep non-selected button's glow subtle
                        btn.glow.setAlpha(0.3);
                        btn.glow.setScale(1);
                    }
                }
                
                // Update label styles
                if (this.bombLabels[type]) {
                    this.bombLabels[type].setStyle({
                        font: isSelected ? 'bold 16px Arial' : '14px Arial',
                        fill: isSelected ? '#ffff00' : '#ffffff',
                        stroke: '#000000',
                        strokeThickness: isSelected ? 5 : 4
                    });
                }
                
                // Update counter styles
                if (this.bombCounters[type]) {
                    this.bombCounters[type].setStyle({
                        font: isSelected ? 'bold 16px Arial' : '14px Arial',
                        fill: isSelected ? '#ffffff' : '#ffff00',
                        stroke: '#000000',
                        strokeThickness: isSelected ? 4 : 3
                    });
                }
            });
        } else {
            this.selectionIndicator.setVisible(false);
            console.warn(`No button found for bomb type: ${bombType}`);
        }
    }
    
    // Update a specific bomb counter
    updateBombCounter(bombType, count) {
        if (this.bombCounters[bombType]) {
            this.bombCounters[bombType].setText(`x${count}`);
            
            // Update interactivity based on availability
            const button = this.bombButtons[bombType];
            if (button) {
                if (count > 0) {
                    button.setAlpha(1);
                    button.setInteractive({ useHandCursor: true });
                } else {
                    button.setAlpha(0.5);
                    button.disableInteractive();
                }
            }
        }
    }
    
    // Update the shots remaining display
    updateShotsDisplay(shots) {
        if (this.elements.shots) {
            this.elements.shots.setText(`Shots: ${shots}`);
        }
    }
    
    // Update the percentage display
    updatePercentageDisplay(percentage, target = 80) {
        if (this.elements.percentage) {
            this.elements.percentage.setText(`Revealed: ${percentage}% (Target: ${target}%)`);
            
            // Change color based on progress
            if (percentage >= target) {
                this.elements.percentage.setFill('#00ff00');
            } else if (percentage >= target * 0.75) {
                this.elements.percentage.setFill('#ffff00');
            } else {
                this.elements.percentage.setFill('#ffffff');
            }
        }
    }
    
    // Update the score display
    updateScoreDisplay(score) {
        if (this.elements.score) {
            this.elements.score.setText(`Score: ${score}`);
        }
    }
    
    // Show victory screen
    showVictoryScreen(levelNum, percentage, hasNextLevel = true) {
        // Create container for victory UI
        this.containers.victory = this.scene.add.container(0, 0);
        this.containers.victory.setDepth(this.UI_DEPTH + 5);
        
        // Add semi-transparent overlay
        const overlay = this.scene.add.rectangle(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            0x000000,
            0.7
        );
        
        // Create victory text
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
        ).setOrigin(0.5, 0.5);
        
        const percentText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            200,
            `${percentage}% Revealed!`,
            {
                fontSize: '32px',
                fontFamily: 'Arial',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5, 0.5);
        
        // Add elements to container
        this.containers.victory.add([overlay, victoryText, percentText]);
        
        // Create buttons after a delay
        this.scene.time.delayedCall(2000, () => {
            // Button style
            const buttonStyle = {
                fontSize: '36px',
                fontFamily: 'Arial',
                color: '#ffffff',
                padding: { x: 20, y: 10 }
            };
            
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
            
            this.containers.victory.add(restartButton);
            
            // Next Level button
            if (hasNextLevel) {
                const nextLevelButton = this.scene.add.text(
                    this.scene.cameras.main.centerX + xOffset,
                    this.scene.cameras.main.height - 100,
                    'Next Level',
                    {
                        ...buttonStyle,
                        backgroundColor: '#22aa22'
                    }
                ).setOrigin(0.5, 0.5)
                .setInteractive({ useHandCursor: true })
                .on('pointerdown', () => {
                    // Clean up before transitioning
                    this.scene.events.emit('goToNextLevel');
                });
                
                nextLevelButton.on('pointerover', () => nextLevelButton.setStyle({ color: '#ffff00' }));
                nextLevelButton.on('pointerout', () => nextLevelButton.setStyle({ color: '#ffffff' }));
                
                this.containers.victory.add(nextLevelButton);
            }
        });
    }
    
    // Show game over screen
    showGameOverScreen(percentage, targetPercentage) {
        // Create container for game over UI
        this.containers.gameOver = this.scene.add.container(0, 0);
        this.containers.gameOver.setDepth(this.UI_DEPTH + 5);
        
        // Add semi-transparent overlay
        const overlay = this.scene.add.rectangle(
            this.scene.cameras.main.width / 2,
            this.scene.cameras.main.height / 2,
            this.scene.cameras.main.width,
            this.scene.cameras.main.height,
            0x000000,
            0.7
        );
        
        // Create game over text
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
        ).setOrigin(0.5, 0.5);
        
        const resultText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            200,
            `You revealed ${percentage}% of ${targetPercentage}% needed`,
            {
                fontSize: '32px',
                fontFamily: 'Arial',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5, 0.5);
        
        // Add elements to container
        this.containers.gameOver.add([overlay, gameOverText, resultText]);
        
        // Create retry button after a delay
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
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () => this.scene.scene.restart());
            
            restartButton.on('pointerover', () => restartButton.setStyle({ color: '#ffff00' }));
            restartButton.on('pointerout', () => restartButton.setStyle({ color: '#ffffff' }));
            
            this.containers.gameOver.add(restartButton);
        });
    }
    
    // Show a temporary message
    showMessage(message, duration = 2000, style = {}) {
        const defaultStyle = {
            fontSize: '28px',
            fontFamily: 'Arial',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        };
        
        const finalStyle = { ...defaultStyle, ...style };
        
        const messageText = this.scene.add.text(
            this.scene.cameras.main.centerX,
            this.scene.cameras.main.centerY,
            message,
            finalStyle
        ).setOrigin(0.5).setDepth(this.UI_DEPTH + 10);
        
        // Add a fade-out animation
        this.scene.tweens.add({
            targets: messageText,
            alpha: 0,
            y: this.scene.cameras.main.centerY - 50,
            duration: duration,
            ease: 'Power2',
            onComplete: () => {
                messageText.destroy();
            }
        });
        
        return messageText;
    }
    
    // Clean up all UI resources
    cleanup() {
        // Destroy all containers
        Object.values(this.containers).forEach(container => {
            if (container && container.scene) {
                container.destroy(true);
            }
        });
        
        // Destroy bomb selector if it exists
        if (this.bombSelectorContainer && this.bombSelectorContainer.scene) {
            this.bombSelectorContainer.destroy(true);
        }
        
        // Clear reference arrays
        this.containers = {};
        this.elements = {};
        this.bombButtons = {};
        this.bombLabels = {};
        this.bombCounters = {};
        this.selectionIndicator = null;
        
        // Remove event listeners
        this.scene.events.off('updateShots', this.updateShotsDisplay, this);
        this.scene.events.off('updatePercentage', this.updatePercentageDisplay, this);
        this.scene.events.off('bombCountUpdated', this.updateBombCounter, this);
        this.scene.events.off('bombTypeSelected', this.updateBombSelection, this);
        
        console.log("UIManager resources cleaned up");
    }
}

// Export the UIManager class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIManager };
} else {
    // If not in Node.js, add to window object
    window.UIManager = UIManager;
} 