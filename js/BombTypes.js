// BombTypes.js - Contains all bomb-related functionality
class BombManager {
    constructor(scene) {
        // Reference to the main game scene
        this.scene = scene;
        
        // Define bomb types with names from Game Design Document
        // Use scene's BOMB_TYPES if available, otherwise define our own
        if (scene.BOMB_TYPES) {
            this.BOMB_TYPES = scene.BOMB_TYPES;
            console.log("BombManager: Using scene's BOMB_TYPES");
        } else {
            this.BOMB_TYPES = {
                BLAST: 'blast_bomb',
                PIERCER: 'piercer_bomb',
                CLUSTER: 'cluster_bomb',
                STICKY: 'sticky_bomb',
                SHATTERER: 'shatterer_bomb',
                DRILLER: 'driller_bomb',
                RICHOCHET: 'ricochet_bomb' 
            };
            console.log("BombManager: Defined own BOMB_TYPES");
        }
        
        // Bomb names based on Game Design Document
        this.BOMB_NAMES = {
            [this.BOMB_TYPES.BLAST]: 'Blast Girl',
            [this.BOMB_TYPES.PIERCER]: 'Piercer Girl',
            [this.BOMB_TYPES.CLUSTER]: 'Cluster Girl',
            [this.BOMB_TYPES.STICKY]: 'Sticky Girl',
            [this.BOMB_TYPES.SHATTERER]: 'Shatterer Girl',
            [this.BOMB_TYPES.DRILLER]: 'Driller Girl',
            [this.BOMB_TYPES.RICHOCHET]: 'Ricochet Girl'
        };
        
        // Initialize array for sticky bombs
        this.activeStickyBombs = [];
    }
    
    // Handle Blast Bomb explosion
    handleBlastBomb(x, y) {
        try {
            // Safety check - don't allow explosion if scene is in aiming state
            if (this.scene.isAiming) {
                console.log("BombManager: Prevented premature bomb explosion during aiming");
                return;
            }
            
            // Mark the bomb as exploded if it exists
            if (this.scene.bomb && !this.scene.bomb.hasExploded) {
                this.scene.bomb.hasExploded = true;
            }
            
            console.log(`BombManager: Creating explosion at (${x}, ${y})`);
            
            // Create explosion effect via effectsManager
            if (this.scene.effectsManager && typeof this.scene.effectsManager.createExplosion === 'function') {
                this.scene.effectsManager.createExplosion(x, y);
            } else {
                // Fallback to our own explosion if effects manager isn't available
                this.createExplosion(x, y);
            }
            
            // FIXED IMPLEMENTATION: Use the scene's destroyBlocksInRadius properly
            // This calls the properly implemented method in GameScene
            console.log("BombManager: Calling destroyBlocksInRadius with radius 150");
            
            // Added debug info to check if we have ice blocks available
            if (this.scene.iceBlocks) {
                console.log(`BombManager: Found ${this.scene.iceBlocks.length} ice blocks in the scene`);
                
                // Log ALL blocks for debugging when there are few blocks
                if (this.scene.iceBlocks.length < 10) {
                    console.log("BombManager: Logging all blocks for debugging:");
                    this.scene.iceBlocks.forEach((block, index) => {
                        if (block) {
                            const distance = Phaser.Math.Distance.Between(x, y, block.x, block.y);
                            console.log(`BombManager: Block ${index}: position=(${block.x}, ${block.y}), distance=${distance.toFixed(2)}, type=${block.blockType || 'unknown'}, isActive=${block.isActive}`);
                        } else {
                            console.log(`BombManager: Block ${index} is null or undefined`);
                        }
                    });
                } else {
                    // Log a few random blocks for debugging
                    for (let i = 0; i < Math.min(3, this.scene.iceBlocks.length); i++) {
                        const block = this.scene.iceBlocks[i];
                        if (block && block.isActive) {
                            const distance = Phaser.Math.Distance.Between(x, y, block.x, block.y);
                            console.log(`BombManager: Sample block ${i} at ${block.x}, ${block.y}, distance: ${distance.toFixed(2)}, type: ${block.blockType || 'unknown'}`);
                        }
                    }
                }
                
                // EMERGENCY MEASURE: If we have blocks but none are being destroyed,
                // directly destroy the closest block to guarantee progress
                const initialLength = this.scene.iceBlocks.length;
                
                // Call regular destroy method first
                if (this.scene.destroyBlocksInRadius) {
                    this.scene.destroyBlocksInRadius(x, y, 150);
                }
                
                // Check if any blocks were affected after a short delay
                this.scene.time.delayedCall(300, () => {
                    if (this.scene.iceBlocks && this.scene.iceBlocks.length === initialLength && initialLength > 0) {
                        console.log("BombManager: No blocks were destroyed, using emergency measure to destroy closest block");
                        
                        // Find the closest block
                        let closestBlock = null;
                        let closestDistance = Infinity;
                        
                        this.scene.iceBlocks.forEach(block => {
                            if (block && block.isActive) {
                                const distance = Phaser.Math.Distance.Between(x, y, block.x, block.y);
                                if (distance < closestDistance) {
                                    closestDistance = distance;
                                    closestBlock = block;
                                }
                            }
                        });
                        
                        // Destroy it directly
                        if (closestBlock && this.scene.destroyIceBlock) {
                            console.log(`BombManager: Emergency destroying closest block at (${closestBlock.x}, ${closestBlock.y})`);
                            this.scene.destroyIceBlock(closestBlock);
                        }
                    }
                });
                
                // Still make all the regular calls with increasing radius
                this.scene.time.delayedCall(50, () => {
                    if (this.scene.destroyBlocksInRadius) {
                        console.log("BombManager: Making second call to destroyBlocksInRadius with larger radius");
                        this.scene.destroyBlocksInRadius(x, y, 170);
                    }
                });
                
                // Make a third call with a huge radius as a fallback if blocks are too far away
                this.scene.time.delayedCall(100, () => {
                    if (this.scene.destroyBlocksInRadius && this.scene.iceBlocks && this.scene.iceBlocks.length > 0) {
                        console.log("BombManager: Making third call to destroyBlocksInRadius with maximum radius");
                        this.scene.destroyBlocksInRadius(x, y, 300);
                        
                        // Last resort - if blocks still exist, try direct destruction
                        this.scene.time.delayedCall(100, () => {
                            if (this.scene.iceBlocks && this.scene.iceBlocks.length > 0) {
                                console.log("BombManager: Attempting direct destruction of all remaining blocks");
                                this.directDestroyAllBlocks();
                            }
                        });
                    }
                });
            } else {
                console.error("BombManager: No iceBlocks array found in scene!");
                // Fallback implementation if needed
                this.directDestroyBlocks(x, y, 150);
            }
            
            // Try to trigger sticky bombs
            if (this.scene.triggerStickyBomb && typeof this.scene.triggerStickyBomb === 'function') {
                this.scene.triggerStickyBomb(x, y, 150);
            }
            
            // Update bomb state
            if (this.scene.bombState) {
                this.scene.bombState.active = false;
            }
            
            // Add camera shake
            this.scene.cameras.main.shake(300, 0.01);
            
            // Play explosion sound if available
            if (this.scene.audioManager && typeof this.scene.audioManager.playSound === 'function') {
                this.scene.audioManager.playSound('explosion', { volume: 0.5 });
            }
        } catch (error) {
            console.error("Error in handleBlastBomb:", error);
        }
    }
    
    // Last resort method to destroy all blocks
    directDestroyAllBlocks() {
        try {
            if (!this.scene.iceBlocks || this.scene.iceBlocks.length === 0) {
                console.log("BombManager: No blocks to destroy in last resort method");
                return;
            }
            
            console.log(`BombManager: Attempting to destroy all ${this.scene.iceBlocks.length} blocks directly`);
            
            // Create a copy of the array to avoid modification during iteration
            const blocksToDestroy = [...this.scene.iceBlocks];
            
            // Destroy all blocks with staggered delays
            blocksToDestroy.forEach((block, index) => {
                if (block && block.isActive) {
                    this.scene.time.delayedCall(index * 50, () => {
                        if (this.scene.destroyIceBlock && block && block.isActive) {
                            console.log(`BombManager: Directly destroying block at (${block.x}, ${block.y})`);
                            this.scene.destroyIceBlock(block);
                        }
                    });
                }
            });
        } catch (error) {
            console.error("Error in directDestroyAllBlocks:", error);
        }
    }
    
    // Fallback method for direct block destruction (only used if destroyBlocksInRadius is missing)
    directDestroyBlocks(x, y, radius) {
        if (!this.scene.iceBlocks || this.scene.iceBlocks.length === 0) {
            console.warn("No ice blocks to destroy");
            return;
        }
        
        console.log(`Direct implementation checking ${this.scene.iceBlocks.length} ice blocks for destruction`);
        
        // Check distance of each block from explosion center
        const blocksToDestroy = [];
        
        this.scene.iceBlocks.forEach(block => {
            if (block && block.isActive) {
                const distance = Phaser.Math.Distance.Between(x, y, block.x, block.y);
                
                // FIXED: Use a more generous radius check to ensure blocks are destroyed
                if (distance < radius * 1.5) {
                    console.log(`Found block at (${block.x}, ${block.y}) within radius ${distance.toFixed(2)}`);
                    // Calculate delay based on distance
                    const delay = (distance / radius) * 100;
                    blocksToDestroy.push({ block, delay });
                }
            }
        });
        
        console.log(`Direct implementation found ${blocksToDestroy.length} blocks to destroy`);
        
        // If no blocks found with normal radius but there are active blocks, 
        // force destruction of the closest blocks
        if (blocksToDestroy.length === 0 && this.scene.iceBlocks.length > 0) {
            console.log("BombManager: No blocks in radius but blocks exist - destroying closest blocks");
            
            // Find the closest blocks
            const closestBlocks = this.scene.iceBlocks
                .filter(block => block && block.isActive)
                .map(block => {
                    const distance = Phaser.Math.Distance.Between(x, y, block.x, block.y);
                    return { block, distance, delay: 100 };
                })
                .sort((a, b) => a.distance - b.distance)
                .slice(0, 3); // Get up to 3 closest blocks
                
            closestBlocks.forEach(({ block, delay }, index) => {
                console.log(`BombManager: Force-destroying block at (${block.x}, ${block.y}), distance: ${block.distance}`);
                blocksToDestroy.push({ block, delay: delay + index * 50 });
            });
        }
        
        // Destroy blocks with proper delays
        blocksToDestroy.forEach(({ block, delay }) => {
            this.scene.time.delayedCall(delay, () => {
                if (block && block.isActive && typeof this.scene.destroyIceBlock === 'function') {
                    this.scene.destroyIceBlock(block);
                }
            });
        });
    }
    
    // Create our own explosion effect
    createExplosion(x, y, radius = 80) {
        try {
            // Create visual explosion
            const explosion = this.scene.add.circle(x, y, radius, 0xffaa00, 0.5);
            explosion.setDepth(6);
            
            // Animate the explosion
            this.scene.tweens.add({
                targets: explosion,
                alpha: 0,
                scale: 1.5,
                duration: 500,
                ease: 'Power2',
                onComplete: () => {
                    explosion.destroy();
                }
            });
            
            // Create particle effect
            const particles = this.scene.add.particles('particle');
            particles.setDepth(6);
            
            const emitter = particles.createEmitter({
                speed: { min: 50, max: 200 },
                scale: { start: 1, end: 0 },
                alpha: { start: 1, end: 0 },
                lifespan: 800,
                blendMode: 'ADD',
                tint: [0xffff00, 0xff6600]
            });
            
            // Emit particles at explosion point
            emitter.explode(40, x, y);
            
            // Add camera shake
            this.scene.cameras.main.shake(200, 0.01);
            
            // Play explosion sound
            if (this.scene.audioManager) {
                this.scene.audioManager.playSound('explosion', { volume: 0.5 });
            }
        } catch (error) {
            console.error("Error creating explosion:", error);
        }
    }
    
    // Create block shatter effect
    createBlockShatter(block) {
        try {
            // Create 2-3 small particles at the block's position
            const particles = this.scene.add.particles('particle');
            const emitter = particles.createEmitter({
                speed: { min: 30, max: 80 },
                scale: { start: 0.2, end: 0 },
                alpha: { start: 0.8, end: 0 },
                lifespan: 600,
                blendMode: 'ADD',
                tint: 0xaaddff // Light blue for ice
            });
            
            // Emit particles at block position
            emitter.explode(10, block.x, block.y);
            
            // Clean up after particles are done
            this.scene.time.delayedCall(700, () => {
                particles.destroy();
            });
        } catch (error) {
            console.error("Error in createBlockShatter:", error);
        }
    }
    
    // Handle Piercer Bomb explosion
    handlePiercerBomb(x, y) {
        try {
            console.log(`BombManager: Handling piercer bomb at (${x}, ${y})`);
            
            // Create the main explosion via effectsManager
            if (this.scene.effectsManager && typeof this.scene.effectsManager.createExplosion === 'function') {
                this.scene.effectsManager.createExplosion(x, y);
            } else {
                // Fallback to our own explosion if effects manager isn't available
                this.createExplosion(x, y);
            }
            
            // Calculate a line through the impact point
            const angleDegrees = Phaser.Math.Between(0, 360);
            const angleRadians = Phaser.Math.DegToRad(angleDegrees);
            
            // Define the line length
            const lineLength = 300;
            
            // Calculate end coordinates
            const endX = x + Math.cos(angleRadians) * lineLength;
            const endY = y + Math.sin(angleRadians) * lineLength;
            
            // Draw debug line
            console.log(`Piercer angle: ${angleDegrees}° (${angleRadians.toFixed(2)} rad), from (${x},${y}) to (${endX.toFixed(0)},${endY.toFixed(0)})`);
            
            // Number of points to check along the line
            const points = 10;
            
            // Check points along the line for blocks to destroy
            for (let i = 0; i < points; i++) {
                const t = i / (points - 1);  // Normalized distance along the line (0 to 1)
                const pointX = x + (endX - x) * t;
                const pointY = y + (endY - y) * t;
                
                // Create small explosions along the line
                this.scene.time.delayedCall(i * 50, () => {
                    // Use a particle effect along the line
                    const particles = this.scene.add.particles('particle');
                    particles.setDepth(6);
                    
                    const emitter = particles.createEmitter({
                        speed: { min: 20, max: 60 },
                        scale: { start: 0.5, end: 0 },
                        alpha: { start: 0.7, end: 0 },
                        lifespan: 400,
                        blendMode: 'ADD',
                        tint: 0x77aaff
                    });
                    
                    // Burst of particles at this point
                    emitter.explode(10, pointX, pointY);
                    
                    // Clean up particles after they're done
                    this.scene.time.delayedCall(500, () => {
                        particles.destroy();
                    });
                    
                    // Destroy blocks at this point using the scene's method
                    if (this.scene.destroyBlocksInRadius) {
                        this.scene.destroyBlocksInRadius(pointX, pointY, 30);
                    } else {
                        this.directDestroyBlocks(pointX, pointY, 30);
                    }
                });
            }
            
            // Add mild camera shake
            this.scene.cameras.main.shake(200, 0.008);
            
            // Play sound if available
            if (this.scene.audioManager) {
                this.scene.audioManager.playSound('piercer', { volume: 0.6 });
            }
        } catch (error) {
            console.error("Error in handlePiercerBomb:", error);
        }
    }
    
    // Handle Cluster Bomb explosion
    handleClusterBomb(x, y) {
        try {
            console.log(`BombManager: Handling cluster bomb at (${x}, ${y})`);
            
            // Create the primary explosion via effectsManager
            if (this.scene.effectsManager && typeof this.scene.effectsManager.createExplosion === 'function') {
                this.scene.effectsManager.createExplosion(x, y);
            } else {
                // Fallback to our own explosion if effects manager isn't available
                this.createExplosion(x, y);
            }
            
            // Call destroyBlocksInRadius for primary explosion
            if (this.scene.destroyBlocksInRadius) {
                this.scene.destroyBlocksInRadius(x, y, 100);
            } else {
                this.directDestroyBlocks(x, y, 100);
            }
            
            // Number of cluster bombs
            const numClusters = Phaser.Math.Between(3, 5);
            
            // Radius within which cluster bombs appear
            const clusterRadius = 150;
            
            // Create cluster explosions
            for (let i = 0; i < numClusters; i++) {
                // Add a small delay before cluster activates
                this.scene.time.delayedCall(300 + i * 100, () => {
                    // Random position within radius
                    const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
                    const distance = Phaser.Math.FloatBetween(50, clusterRadius);
                    
                    const clusterX = x + Math.cos(angle) * distance;
                    const clusterY = y + Math.sin(angle) * distance;
                    
                    // Create mini explosion via effectsManager
                    if (this.scene.effectsManager && typeof this.scene.effectsManager.createMiniExplosion === 'function') {
                        this.scene.effectsManager.createMiniExplosion(clusterX, clusterY);
                    } else {
                        // Fallback to our own explosion if effects manager isn't available
                        this.createExplosion(clusterX, clusterY, 40); // Smaller radius for mini explosion
                    }
                    
                    // Destroy blocks around cluster point
                    if (this.scene.destroyBlocksInRadius) {
                        this.scene.destroyBlocksInRadius(clusterX, clusterY, 70);
                    } else {
                        this.directDestroyBlocks(clusterX, clusterY, 70);
                    }
                    
                    // Add a small camera shake for each cluster
                    this.scene.cameras.main.shake(100, 0.005);
                });
            }
            
            // Add camera shake for primary explosion
            this.scene.cameras.main.shake(200, 0.01);
            
            // Play explosion sound
            if (this.scene.audioManager) {
                this.scene.audioManager.playSound('cluster', { volume: 0.7 });
            }
        } catch (error) {
            console.error("Error in handleClusterBomb:", error);
        }
    }
    
    // Handle Sticky Bomb explosion
    handleStickyBomb(x, y, block) {
        try {
            // If no block to stick to, fall back to blast bomb
            if (!block) {
                this.handleBlastBomb(x, y);
                return;
            }
            
            // Create visual feedback that it's sticking
            const stickyFeedback = this.scene.add.sprite(x, y, 'sticky_effect');
            stickyFeedback.setScale(0.5);
            stickyFeedback.play('sticky_effect_anim');
            stickyFeedback.once('animationcomplete', () => {
                stickyFeedback.destroy();
            });
            
            // Create the bomb object that will stick to the target
            const stickyBomb = {
                x: x,
                y: y,
                block: block,
                countdown: 3000, // 3 seconds until explosion
                sprite: this.scene.add.sprite(x, y, 'sticky_bomb'),
                countdownText: this.scene.add.text(x, y - 20, '3', {
                    font: '24px Arial',
                    fill: '#ff0000',
                    stroke: '#000000',
                    strokeThickness: 4
                }).setOrigin(0.5)
            };
            
            // Add the sticky bomb to our active list
            this.activeStickyBombs.push(stickyBomb);
            
            // Set up a timer to update the countdown display
            const countdownInterval = setInterval(() => {
                stickyBomb.countdown -= 1000;
                if (stickyBomb.countdown <= 0) {
                    clearInterval(countdownInterval);
                    return;
                }
                const seconds = Math.ceil(stickyBomb.countdown / 1000);
                stickyBomb.countdownText.setText(seconds.toString());
            }, 1000);
            
            // Set up the explosion timer
            this.scene.time.delayedCall(stickyBomb.countdown, () => {
                // Only trigger if the bomb still exists (hasn't been cleared by level completion)
                const bombIndex = this.activeStickyBombs.indexOf(stickyBomb);
                if (bombIndex >= 0) {
                    this.activeStickyBombs.splice(bombIndex, 1);
                    this.triggerStickyBomb(stickyBomb.x, stickyBomb.y, 150);
                    
                    // Clean up sticky bomb resources
                    if (stickyBomb.sprite) stickyBomb.sprite.destroy();
                    if (stickyBomb.countdownText) stickyBomb.countdownText.destroy();
                }
            });
        } catch (error) {
            console.error("Error in handleStickyBomb:", error);
        }
    }
    
    // Trigger a sticky bomb explosion
    triggerStickyBomb(x, y, radius) {
        try {
            // Create a larger explosion effect than regular blast
            this.scene.createLargeExplosion(x, y);
            
            // Destroy blocks in radius (slightly larger than blast bomb)
            this.scene.destroyBlocksInRadius(x, y, radius);
        } catch (error) {
            console.error("Error in triggerStickyBomb:", error);
        }
    }
    
    // Handle Shatterer Bomb explosion
    handleShattererBomb(x, y) {
        try {
            // Shatterer bomb creates a large shockwave
            
            // Create visual effect - more powerful than standard explosion
            const particles = this.scene.add.particles(x, y, 'shatterer_particle', {
                speed: { min: 200, max: 400 },
                angle: { min: 0, max: 360 },
                scale: { start: 1, end: 0 },
                lifespan: { min: 800, max: 1000 },
                blendMode: 'ADD',
                gravityY: 0,
                quantity: 40
            });
            
            // Create a shockwave visual with ring effect
            this.scene.createShattererImpactEffect(x, y);
            
            // Add a delay before destroying the particles
            this.scene.time.delayedCall(1000, () => {
                particles.destroy();
            });
            
            // Radius is larger than blast bomb
            const radius = 200;
            
            // Special destruction that can damage/break "strong" blocks too
            this.scene.destroyBlocksWithShatterer(x, y, radius);
            
        } catch (error) {
            console.error("Error in handleShattererBomb:", error);
        }
    }
    
    // Handle Driller Bomb
    handleDrillerBomb(x, y, block) {
        try {
            // If no block to drill, fall back to blast bomb
            if (!block) {
                this.handleBlastBomb(x, y);
                return;
            }
            
            // Create drill effect
            this.scene.createDrillEffect(x, y);
            
            // Initial small explosion at impact site
            this.scene.createMiniExplosion(x, y);
            
            // Get initial direction based on block position relative to chibi girl
            const chibiCenter = {
                x: this.scene.chibiImage.x,
                y: this.scene.chibiImage.y
            };
            
            // Direction away from chibi
            const directionX = x - chibiCenter.x;
            const directionY = y - chibiCenter.y;
            
            // Normalize direction
            const magnitude = Math.sqrt(directionX * directionX + directionY * directionY);
            let normalizedDirX = magnitude > 0 ? directionX / magnitude : 1;
            let normalizedDirY = magnitude > 0 ? directionY / magnitude : 0;
            
            // Start position is at the impact block
            let currentX = x;
            let currentY = y;
            
            // How far we've drilled
            let drillDistance = 0;
            const maxDrillDistance = 500; // Maximum pixel distance
            const drillStep = 20; // Pixels per step
            const maxSteps = maxDrillDistance / drillStep;
            let currentStep = 0;
            
            // Blocks we've already processed to avoid duplicates
            const processedBlocks = new Set();
            
            // Add the initial block
            if (block) {
                processedBlocks.add(block);
            }
            
            // Set up recursive function to drill in steps
            const doDrillStep = () => {
                if (currentStep >= maxSteps || this.scene.isLevelComplete) {
                    // We've reached the maximum drilling distance or level completed
                    this.scene.createDrillerExplosion(currentX, currentY);
                    return;
                }
                
                // Move to next position
                currentX += normalizedDirX * drillStep;
                currentY += normalizedDirY * drillStep;
                currentStep++;
                drillDistance += drillStep;
                
                // Create drilling effect at current position
                const drillEffect = this.scene.add.sprite(currentX, currentY, 'drill_effect');
                drillEffect.setScale(0.7);
                drillEffect.play('drill_effect_anim');
                drillEffect.once('animationcomplete', () => {
                    drillEffect.destroy();
                });
                
                // Check for blocks near the current drill position
                const nearbyBlocks = this.scene.iceBlocks.filter(b => {
                    // Skip blocks we've already processed
                    if (processedBlocks.has(b)) return false;
                    
                    // Calculate distance
                    const dx = b.x - currentX;
                    const dy = b.y - currentY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Block is within drill radius
                    return distance < 40;
                });
                
                let blocksDestroyed = false;
                
                // Process found blocks
                nearbyBlocks.forEach(b => {
                    processedBlocks.add(b);
                    
                    // Different behavior for different block types
                    switch (b.blockType) {
                        case this.scene.blockManager.BLOCK_TYPES.ETERNAL:
                            // Can't destroy eternal blocks, bounce off them
                            this.scene.createDrillerExplosion(currentX, currentY);
                            currentStep = maxSteps; // Stop drilling
                            return;
                            
                        case this.scene.blockManager.BLOCK_TYPES.STRONG:
                            // Damage strong blocks, might take multiple hits
                            this.scene.damageIceBlock(b);
                            blocksDestroyed = true;
                            break;
                            
                        case this.scene.blockManager.BLOCK_TYPES.DYNAMITE:
                            // Trigger dynamite block explosion
                            this.scene.destroyIceBlock(b);
                            blocksDestroyed = true;
                            break;
                            
                        default:
                            // Standard block gets destroyed
                            this.scene.destroyIceBlock(b);
                            blocksDestroyed = true;
                            break;
                    }
                });
                
                // If we've destroyed blocks, slightly adjust trajectory randomly
                if (blocksDestroyed && Math.random() < 0.3) {
                    // Add some randomness to drilling direction
                    const angleChange = (Math.random() - 0.5) * Math.PI / 4; // ±45 degrees
                    const cosAngle = Math.cos(angleChange);
                    const sinAngle = Math.sin(angleChange);
                    
                    // Rotate direction vector
                    const newDirX = normalizedDirX * cosAngle - normalizedDirY * sinAngle;
                    const newDirY = normalizedDirX * sinAngle + normalizedDirY * cosAngle;
                    
                    normalizedDirX = newDirX;
                    normalizedDirY = newDirY;
                }
                
                // Schedule next drill step with a short delay
                this.scene.time.delayedCall(100, doDrillStep);
            };
            
            // Start the drilling sequence
            doDrillStep();
            
        } catch (error) {
            console.error("Error in handleDrillerBomb:", error);
        }
    }
    
    // Handle Ricochet Bomb
    handleRicochetExplosion(bomb) {
        try {
            // Only trigger explosion if the ricochet bomb has bounced enough
            if (bomb && bomb.bounceCount && bomb.bounceCount > 3) {
                // Create explosion effect similar to blast bomb
                this.handleBlastBomb(bomb.x, bomb.y);
                return true;
            }
            return false;
        } catch (error) {
            console.error("Error in handleRicochetExplosion:", error);
            return false;
        }
    }
    
    // Clean up all bomb resources
    cleanup() {
        // Clear any sticky bombs
        this.activeStickyBombs.forEach(bomb => {
            if (bomb.sprite) bomb.sprite.destroy();
            if (bomb.countdownText) bomb.countdownText.destroy();
        });
        this.activeStickyBombs = [];
    }
}

// Export the BombManager class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BombManager };
} else {
    // If not in Node.js, add to window object
    window.BombManager = BombManager;
} 