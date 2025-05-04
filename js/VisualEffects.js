// VisualEffects.js - Handles all visual effects and animations
class EffectsManager {
    constructor(scene) {
        // Store reference to the main scene
        this.scene = scene;
    }
    
    // Standard explosion effect used by most bombs
    createExplosion(x, y) {
        try {
            // Create visual explosion effect
            const explosion = this.scene.add.sprite(x, y, 'explosion');
            explosion.setScale(1.5);
            explosion.setDepth(10); // Higher than ice blocks, lower than UI
            
            // Play the explosion animation
            explosion.play('explosion_anim');
            
            // Create particles for additional effect
            const particles = this.scene.add.particles(x, y, 'ice_particle', {
                speed: { min: 100, max: 200 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.6, end: 0 },
                lifespan: { min: 600, max: 800 },
                gravityY: 100,
                quantity: 30,
                blendMode: 'ADD'
            });
            
            const emitter = particles.createEmitter({
                speed: { min: 100, max: 200 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.6, end: 0 },
                lifespan: { min: 600, max: 800 },
                gravityY: 100,
                quantity: 30,
                blendMode: 'ADD'
            });
            
            // Create a flash effect
            this.scene.cameras.main.flash(100, 255, 255, 255, 0.5);
            
            // Play explosion sound
            if (this.scene.audioManager) {
                this.scene.audioManager.playSound('explosion');
            }
            
            // Destroy the sprite once animation completes
            explosion.once('animationcomplete', () => {
                explosion.destroy();
            });
            
            // Set a timer to destroy the particles after animation completes
            this.scene.time.delayedCall(800, () => {
                particles.destroy();
            });
        } catch (error) {
            console.error("Error in createExplosion:", error);
        }
    }
    
    // Larger explosion for sticky bombs or other powerful explosions
    createLargeExplosion(x, y) {
        try {
            // Create a larger explosion with more particles
            const explosion = this.scene.add.sprite(x, y, 'explosion');
            explosion.setScale(2.5); // Larger scale
            explosion.setDepth(10);
            
            // Play the explosion animation
            explosion.play('explosion_anim');
            
            // Create particles for additional effect - more particles
            const particles = this.scene.add.particles(x, y, 'ice_particle', {
                speed: { min: 150, max: 300 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.8, end: 0 },
                lifespan: { min: 800, max: 1000 },
                gravityY: 50,
                quantity: 50,
                blendMode: 'ADD'
            });
            
            // Longer camera shake for larger explosion
            this.scene.cameras.main.shake(200, 0.01);
            
            // Stronger flash
            this.scene.cameras.main.flash(150, 255, 255, 255, 0.7);
            
            // Play explosion sound (louder)
            if (this.scene.audioManager) {
                this.scene.audioManager.playSound('explosion', { volume: 1.5 });
            }
            
            // Destroy the sprite once animation completes
            explosion.once('animationcomplete', () => {
                explosion.destroy();
            });
            
            // Set a timer to destroy the particles
            this.scene.time.delayedCall(1000, () => {
                particles.destroy();
            });
        } catch (error) {
            console.error("Error in createLargeExplosion:", error);
        }
    }
    
    // Smaller explosion for cluster bombs or secondary effects
    createMiniExplosion(x, y) {
        try {
            // Create smaller visual explosion effect
            const explosion = this.scene.add.sprite(x, y, 'explosion');
            explosion.setScale(0.8); // Smaller than standard explosion
            explosion.setDepth(10);
            
            // Play the explosion animation
            explosion.play('explosion_anim');
            
            // Smaller particle effect
            const particles = this.scene.add.particles(x, y, 'ice_particle', {
                speed: { min: 50, max: 100 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.4, end: 0 },
                lifespan: { min: 400, max: 600 },
                gravityY: 50,
                quantity: 15,
                blendMode: 'ADD'
            });
            
            // Tiny camera shake
            this.scene.cameras.main.shake(100, 0.005);
            
            // Play explosion sound (quieter)
            if (this.scene.audioManager) {
                this.scene.audioManager.playSound('explosion', { volume: 0.6 });
            }
            
            // Destroy the sprite once animation completes
            explosion.once('animationcomplete', () => {
                explosion.destroy();
            });
            
            // Set a timer to destroy the particles
            this.scene.time.delayedCall(600, () => {
                particles.destroy();
            });
        } catch (error) {
            console.error("Error in createMiniExplosion:", error);
        }
    }
    
    // Shatter effect for blocks
    createBlockShatter(block) {
        try {
            // Create 2-3 smaller pieces at the block's position
            const piecesCount = Phaser.Math.Between(2, 3);
            
            for (let i = 0; i < piecesCount; i++) {
                // Create a smaller piece
                const piece = this.scene.add.sprite(
                    block.x + Phaser.Math.Between(-10, 10),
                    block.y + Phaser.Math.Between(-10, 10),
                    'ice_piece'
                );
                
                piece.setScale(0.7);
                piece.setDepth(5);
                
                // Random rotation and velocity
                const angle = Phaser.Math.Between(0, 360);
                const speed = Phaser.Math.Between(50, 100);
                
                // Set velocity
                const velocityX = Math.cos(angle * Math.PI / 180) * speed;
                const velocityY = Math.sin(angle * Math.PI / 180) * speed;
                
                // Animate the piece
                this.scene.tweens.add({
                    targets: piece,
                    x: piece.x + velocityX,
                    y: piece.y + velocityY,
                    alpha: 0,
                    angle: Phaser.Math.Between(-180, 180),
                    duration: 600,
                    ease: 'Power2',
                    onComplete: () => {
                        piece.destroy();
                    }
                });
            }
            
            // Play crack sound
            if (this.scene.audioManager) {
                this.scene.audioManager.playSound('crack');
            }
        } catch (error) {
            console.error("Error in createBlockShatter:", error);
        }
    }
    
    // Special effect for bouncy blocks
    createBouncyHitEffect(x, y) {
        try {
            // Create a bouncy feedback circle
            const circle = this.scene.add.graphics();
            circle.fillStyle(0x00ffff, 0.7);
            circle.fillCircle(0, 0, 40);
            circle.setPosition(x, y);
            circle.setDepth(6);
            
            // Add a scaling animation
            this.scene.tweens.add({
                targets: circle,
                scaleX: 1.5,
                scaleY: 1.5,
                alpha: 0,
                duration: 300,
                ease: 'Sine.easeOut',
                onComplete: () => {
                    circle.destroy();
                }
            });
            
            // Add particles
            const particles = this.scene.add.particles(x, y, 'bouncy_particle', {
                speed: { min: 50, max: 100 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.4, end: 0 },
                lifespan: { min: 300, max: 500 },
                gravityY: 0,
                quantity: 10,
                blendMode: 'ADD'
            });
            
            // Play bounce sound
            if (this.scene.audioManager) {
                this.scene.audioManager.playSound('bounce');
            }
            
            // Set a timer to destroy the particles
            this.scene.time.delayedCall(500, () => {
                particles.destroy();
            });
        } catch (error) {
            console.error("Error in createBouncyHitEffect:", error);
        }
    }
    
    // Trail effect for bouncing bombs
    createBounceTrail(bomb) {
        try {
            // Create a trail effect behind the bomb
            const trail = this.scene.add.sprite(bomb.x, bomb.y, 'bounce_trail');
            trail.setAlpha(0.7);
            trail.setDepth(4); // Below bomb but above blocks
            
            // Determine rotation based on bomb's velocity
            const angle = Math.atan2(bomb.body.velocity.y, bomb.body.velocity.x);
            trail.rotation = angle;
            
            // Scale based on velocity magnitude
            const speed = Math.sqrt(
                bomb.body.velocity.x * bomb.body.velocity.x + 
                bomb.body.velocity.y * bomb.body.velocity.y
            );
            const scale = Phaser.Math.Clamp(speed / 10, 0.5, 2);
            trail.scaleX = scale;
            
            // Add fade out animation
            this.scene.tweens.add({
                targets: trail,
                alpha: 0,
                duration: 200,
                ease: 'Power2',
                onComplete: () => {
                    trail.destroy();
                }
            });
        } catch (error) {
            console.error("Error in createBounceTrail:", error);
        }
    }
    
    // Dynamite block special destruction effect
    createDynamiteDestroyEffect(x, y) {
        try {
            // Create a bright flash around the dynamite block
            const flash = this.scene.add.sprite(x, y, 'flash');
            flash.setScale(2);
            flash.setDepth(6);
            flash.setAlpha(0.8);
            
            // Play flash animation
            flash.play('flash_anim');
            
            // Add camera shake
            this.scene.cameras.main.shake(200, 0.01);
            
            // Create explosion particles
            const particles = this.scene.add.particles(x, y, 'dynamite_particle', {
                speed: { min: 100, max: 200 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.6, end: 0 },
                lifespan: { min: 600, max: 800 },
                gravityY: 50,
                quantity: 30,
                blendMode: 'ADD'
            });
            
            // Play explosion sound
            if (this.scene.audioManager) {
                this.scene.audioManager.playSound('dynamite');
            }
            
            // Destroy the flash once animation completes
            flash.once('animationcomplete', () => {
                flash.destroy();
            });
            
            // Set a timer to destroy the particles
            this.scene.time.delayedCall(800, () => {
                particles.destroy();
            });
        } catch (error) {
            console.error("Error in createDynamiteDestroyEffect:", error);
        }
    }
    
    // Drill effect for driller bomb
    createDrillEffect(x, y) {
        try {
            // Create initial drill impact effect
            const drillImpact = this.scene.add.sprite(x, y, 'drill_impact');
            drillImpact.setScale(1);
            drillImpact.setDepth(6);
            
            // Play drill impact animation
            drillImpact.play('drill_impact_anim');
            
            // Add particles at impact point
            const particles = this.scene.add.particles(x, y, 'drill_particle', {
                speed: { min: 50, max: 100 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.4, end: 0 },
                lifespan: { min: 400, max: 600 },
                gravityY: 0,
                quantity: 15,
                blendMode: 'ADD'
            });
            
            // Play drill sound
            if (this.scene.audioManager) {
                this.scene.audioManager.playSound('drill');
            }
            
            // Destroy the impact effect once animation completes
            drillImpact.once('animationcomplete', () => {
                drillImpact.destroy();
            });
            
            // Set a timer to destroy the particles
            this.scene.time.delayedCall(600, () => {
                particles.destroy();
            });
        } catch (error) {
            console.error("Error in createDrillEffect:", error);
        }
    }
    
    // Final explosion for driller bomb
    createDrillerExplosion(x, y) {
        try {
            // Create explosion effect
            const explosion = this.scene.add.sprite(x, y, 'explosion');
            explosion.setScale(1.2);
            explosion.setDepth(10);
            
            // Play the explosion animation
            explosion.play('explosion_anim');
            
            // Create particles
            const particles = this.scene.add.particles(x, y, 'drill_particle', {
                speed: { min: 80, max: 150 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.5, end: 0 },
                lifespan: { min: 500, max: 700 },
                gravityY: 50,
                quantity: 20,
                blendMode: 'ADD'
            });
            
            // Add camera shake
            this.scene.cameras.main.shake(150, 0.008);
            
            // Play explosion sound
            if (this.scene.audioManager) {
                this.scene.audioManager.playSound('explosion');
            }
            
            // Destroy the sprite once animation completes
            explosion.once('animationcomplete', () => {
                explosion.destroy();
            });
            
            // Set a timer to destroy the particles
            this.scene.time.delayedCall(700, () => {
                particles.destroy();
            });
        } catch (error) {
            console.error("Error in createDrillerExplosion:", error);
        }
    }
    
    // Shockwave effect for shatterer bomb
    createShattererImpactEffect(x, y) {
        try {
            // Create a shockwave ring
            const shockwave = this.scene.add.sprite(x, y, 'shockwave');
            shockwave.setScale(0.1);
            shockwave.setAlpha(0.7);
            shockwave.setDepth(6);
            
            // Add scaling animation for the shockwave
            this.scene.tweens.add({
                targets: shockwave,
                scale: 3,
                alpha: 0,
                duration: 700,
                ease: 'Sine.easeOut',
                onComplete: () => {
                    shockwave.destroy();
                }
            });
            
            // Add camera shake effect
            this.scene.cameras.main.shake(300, 0.015);
            
            // Play shatter sound
            if (this.scene.audioManager) {
                this.scene.audioManager.playSound('shatter');
            }
        } catch (error) {
            console.error("Error in createShattererImpactEffect:", error);
        }
    }
    
    // Effect for damaged blocks
    createDamageEffect(block) {
        try {
            // Create crack overlay
            const crack = this.scene.add.sprite(block.x, block.y, 'block_crack');
            crack.setScale(block.width / crack.width);
            crack.setDepth(block.depth + 0.1);
            
            // Play crack animation
            crack.play('block_crack_anim');
            
            // Create small particles
            const particles = this.scene.add.particles(block.x, block.y, 'ice_particle', {
                speed: { min: 30, max: 60 },
                angle: { min: 0, max: 360 },
                scale: { start: 0.3, end: 0 },
                lifespan: { min: 300, max: 500 },
                gravityY: 50,
                quantity: 8,
                blendMode: 'ADD'
            });
            
            // Play crack sound
            if (this.scene.audioManager) {
                this.scene.audioManager.playSound('crack', { volume: 0.5 });
            }
            
            // Destroy the animation once it completes
            crack.once('animationcomplete', () => {
                crack.destroy();
            });
            
            // Set a timer to destroy the particles
            this.scene.time.delayedCall(500, () => {
                particles.destroy();
            });
        } catch (error) {
            console.error("Error in createDamageEffect:", error);
        }
    }
    
    // Clean up any ongoing effects
    cleanup() {
        // If needed, clean up any persistent effects here
    }
}

// Export the EffectsManager class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EffectsManager };
} else {
    // If not in Node.js, add to window object
    window.EffectsManager = EffectsManager;
} 