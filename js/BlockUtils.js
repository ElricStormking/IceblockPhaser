// BlockUtils.js - Contains utility functions for working with blocks
class BlockUtils {
    constructor(scene) {
        this.scene = scene;
    }
    
    // Create a shatter effect for blocks
    createBlockShatter(block) {
        if (!block || !this.scene) return;
        
        // Create 2-3 smaller pieces at the block's position
        const numPieces = Phaser.Math.Between(2, 3);
        const blockSize = block.displayWidth / 2; // Pieces are half the size
        
        for (let i = 0; i < numPieces; i++) {
            // Randomize position slightly around the original block
            const offsetX = Phaser.Math.Between(-10, 10);
            const offsetY = Phaser.Math.Between(-10, 10);
            
            // Create a smaller piece
            const piece = this.scene.matter.add.image(
                block.x + offsetX,
                block.y + offsetY,
                'iceBlock',
                null,
                {
                    restitution: 0.8,
                    friction: 0.01,
                    density: 0.001
                }
            );
            
            // Scale down the piece to 1/16 of original size (original was 60, now 15, pieces should be ~3.75)
            piece.setScale(0.075 + Math.random() * 0.05); // Random size between 0.075 and 0.125 of original
            
            // Make sure shattered pieces appear above the chibi image
            piece.setDepth(5); // Higher than blocks (4) and blue veils (3), but lower than UI (100)
            
            // Apply random rotation
            piece.setRotation(Math.random() * Math.PI * 2);
            
            // Apply random velocity
            const velX = Phaser.Math.Between(-5, 5);
            const velY = Phaser.Math.Between(-5, 2);
            piece.setVelocity(velX, velY);
            
            // Make pieces semi-transparent
            piece.setAlpha(0.7);
            
            // Destroy the piece after delay
            this.scene.time.delayedCall(1500 + Math.random() * 1000, () => {
                if (piece && piece.scene) {
                    piece.destroy();
                }
            });
        }
    }
    
    // Create a damage effect for blocks
    createDamageEffect(block) {
        if (!block || !this.scene) return;
        
        // Create small particles to indicate damage
        const particles = this.scene.add.particles('particle');
        particles.setDepth(6);
        
        let tint = 0xffffff; // Default
        
        // Set tint based on block type
        if (block.blockType === this.scene.blockTypes.TYPES.ETERNAL) {
            tint = this.scene.blockTypes.getColor(this.scene.blockTypes.TYPES.ETERNAL);
        } else if (block.blockType === this.scene.blockTypes.TYPES.STRONG) {
            tint = this.scene.blockTypes.getColor(this.scene.blockTypes.TYPES.STRONG);
        }
        
        const emitter = particles.createEmitter({
            speed: { min: 30, max: 80 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 400,
            blendMode: 'ADD',
            tint: tint
        });
        
        // Emit particles from the center of the block
        emitter.explode(10, block.x, block.y);
        
        // Clean up particles after use
        this.scene.time.delayedCall(500, () => {
            particles.destroy();
        });
        
        // Add a small camera shake for feedback
        this.scene.cameras.main.shake(100, 0.005);
        
        // Play a crack sound for feedback
        if (this.scene.sound && this.scene.sound.add) {
            try {
                const crackSound = this.scene.sound.add('cracksound', { volume: 0.3 });
                crackSound.play();
            } catch (e) {
                console.log("Sound not available:", e);
            }
        }
    }
    
    // Create an effect when bouncy blocks are hit
    createBouncyHitEffect(x, y) {
        if (!this.scene) return;
        
        // Visual bounce effect
        const ring = this.scene.add.circle(x, y, 20, 0x88ddff, 0.8);
        ring.setDepth(6);
        
        this.scene.tweens.add({
            targets: ring,
            radius: 40,
            alpha: 0,
            duration: 300,
            ease: 'Sine.easeOut',
            onUpdate: (tween) => {
                // Manually update the circle size since radius isn't a standard property
                const radius = 20 + (40 - 20) * tween.progress;
                ring.setRadius(radius);
            },
            onComplete: () => {
                ring.destroy();
            }
        });
        
        // Play bounce sound
        if (this.scene.sound && this.scene.sound.add) {
            try {
                const bounceSound = this.scene.sound.add('bouncesound', { volume: 0.4 });
                if (!bounceSound.isPlaying) {
                    bounceSound.play();
                }
            } catch (e) {
                console.log("Sound not available:", e);
            }
        }
    }
    
    // Create a special effect for dynamite blocks
    createDynamiteDestroyEffect(x, y) {
        if (!this.scene) return;
        
        // Create special particles for dynamite
        const particles = this.scene.add.particles('particle');
        particles.setDepth(6);
        
        const emitter = particles.createEmitter({
            speed: { min: 80, max: 200 },
            scale: { start: 1.2, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 600,
            blendMode: 'ADD',
            tint: [0xff0000, 0xff6600, 0xffcc00] // Red/orange/yellow
        });
        
        // Emit more particles for dynamite
        emitter.explode(40, x, y);
        
        // Add a flash effect
        const flash = this.scene.add.circle(x, y, 80, 0xffcc00, 0.8);
        flash.setDepth(6);
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 2,
            duration: 200,
            onComplete: () => {
                flash.destroy();
            }
        });
        
        // Clean up particles after use
        this.scene.time.delayedCall(700, () => {
            particles.destroy();
        });
    }
    
    // Create a shatterer impact effect
    createShattererImpactEffect(x, y) {
        if (!this.scene) return;
        
        try {
            // Create the main burst
            const burst = this.scene.add.circle(x, y, 30, 0x4444ff, 0.8);
            burst.setDepth(6); // Above game objects but below UI
            
            // Create jagged electric-like lines radiating from the impact point
            const graphics = this.scene.add.graphics();
            graphics.setDepth(6);
            
            // Draw with blue-white color
            graphics.lineStyle(2, 0x88aaff, 0.9);
            
            // Create several jagged lines emanating from the impact point
            const numLines = 6;
            const maxLength = 40;
            
            for (let i = 0; i < numLines; i++) {
                const angle = (i / numLines) * Math.PI * 2;
                let currentX = x;
                let currentY = y;
                
                graphics.beginPath();
                graphics.moveTo(x, y);
                
                // Create a jagged line with multiple segments
                const numSegments = 3;
                for (let j = 0; j < numSegments; j++) {
                    // Calculate the target point for this segment
                    const segmentLength = maxLength / numSegments;
                    const segmentEndX = x + Math.cos(angle + (Math.random() * 0.4 - 0.2)) * (j + 1) * segmentLength;
                    const segmentEndY = y + Math.sin(angle + (Math.random() * 0.4 - 0.2)) * (j + 1) * segmentLength;
                    
                    graphics.lineTo(segmentEndX, segmentEndY);
                    currentX = segmentEndX;
                    currentY = segmentEndY;
                }
                
                graphics.strokePath();
            }
            
            // Create particles
            const particles = this.scene.add.particles('particle');
            particles.setDepth(6);
            
            const emitter = particles.createEmitter({
                speed: { min: 30, max: 100 },
                scale: { start: 0.6, end: 0 },
                alpha: { start: 0.8, end: 0 },
                lifespan: 400,
                blendMode: 'ADD',
                tint: 0x4488ff  // Blue tint
            });
            
            // Emit particles at impact point
            emitter.explode(15, x, y);
            
            // Animate and clean up
            this.scene.tweens.add({
                targets: [burst, graphics],
                alpha: 0,
                duration: 300,
                onComplete: () => {
                    burst.destroy();
                    graphics.destroy();
                }
            });
            
            // Clean up particles
            this.scene.time.delayedCall(500, () => {
                particles.destroy();
            });
            
            // Add small camera shake
            this.scene.cameras.main.shake(100, 0.006);
            
        } catch (error) {
            console.error("Error in createShattererImpactEffect:", error);
        }
    }
    
    // Create explosion effect
    createExplosion(x, y) {
        if (!this.scene) return;
        
        // Create visual explosion effect
        const explosion = this.scene.add.circle(x, y, 80, 0xff5500, 0.8);
        explosion.setDepth(6); // Higher than ice blocks (4), blue veils (3), and shattered pieces (5)
        
        // Animate the explosion
        this.scene.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 2,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                explosion.destroy();
            }
        });
        
        // Add some particles for more effect
        const particles = this.scene.add.particles('particle');
        particles.setDepth(6); // Same depth as explosion
        
        const emitter = particles.createEmitter({
            speed: { min: 50, max: 200 },
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 800,
            blendMode: 'ADD'
        });
        
        // Emit particles at explosion point
        emitter.explode(30, x, y);
        
        // Create a flash effect
        const flash = this.scene.add.circle(x, y, 100, 0xffffff, 1);
        flash.setDepth(6); // Same depth as explosion
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 200,
            onComplete: () => {
                flash.destroy();
            }
        });
        
        // Destroy the particle system after emissions complete
        this.scene.time.delayedCall(1000, () => {
            particles.destroy();
        });
        
        // Add a camera shake effect
        this.scene.cameras.main.shake(300, 0.01);
        
        // Add explosion sound if available
        if (this.scene.sound && this.scene.sound.add) {
            try {
                const explosionSound = this.scene.sound.add('explosion');
                explosionSound.play({ volume: 0.5 });
            } catch (e) {
                console.log("Sound not available:", e);
            }
        }
    }
    
    // Create mini explosion effect for cluster bombs
    createMiniExplosion(x, y) {
        if (!this.scene) return;
        
        // Create smaller visual explosion effect
        const explosion = this.scene.add.circle(x, y, 40, 0xffdd44, 0.7);
        explosion.setDepth(6); // Same depth as regular explosions, above all game elements
        
        // Animate the explosion
        this.scene.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 1.5,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                explosion.destroy();
            }
        });
        
        // Add some particles for more effect
        const particles = this.scene.add.particles('mini_particle');
        particles.setDepth(6); // Match explosion depth
        
        const emitter = particles.createEmitter({
            speed: { min: 30, max: 150 },
            scale: { start: 1, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 600,
            blendMode: 'ADD'
        });
        
        // Emit particles at explosion point
        emitter.explode(20, x, y);
        
        // Destroy the particle system after emissions complete
        this.scene.time.delayedCall(700, () => {
            particles.destroy();
        });
        
        // Add a small camera shake
        this.scene.cameras.main.shake(150, 0.005);
    }
}

// Export the BlockUtils class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BlockUtils };
} else {
    // If not in Node.js, add to window object
    window.BlockUtils = BlockUtils;
} 