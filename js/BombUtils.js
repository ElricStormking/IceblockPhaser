// BombUtils.js - Contains utility functions for working with bombs
class BombUtils {
    constructor(scene) {
        this.scene = scene;
    }
    
    // Create a dynamic bomb with appropriate physics
    createDynamicBomb(x, y, bombType, forceX, forceY) {
        // Set bomb properties based on type
        let bombProperties = {
            restitution: 0.9, // Increased for better bouncing in ultra-low gravity
            friction: 0.01, // Reduced for less surface friction
            density: 0.0003, // Keep the same density
            frictionAir: 0.001 // Reduced for less air resistance
        };
        
        // Adjust properties for special bomb types
        switch(bombType) {
            case this.scene.BOMB_TYPES.PIERCER:
                // Piercer has lower friction and higher density
                bombProperties.friction = 0.002;
                bombProperties.frictionAir = 0.0008;
                bombProperties.density = 0.0005;
                break;
                
            case this.scene.BOMB_TYPES.CLUSTER:
                // Cluster is a bit lighter
                bombProperties.density = 0.0002;
                bombProperties.frictionAir = 0.001;
                break;
                
            case this.scene.BOMB_TYPES.STICKY:
                // Sticky bombs should be a bit lighter too
                bombProperties.density = 0.0003;
                bombProperties.frictionAir = 0.001;
                break;
                
            case this.scene.BOMB_TYPES.SHATTERER:
                // Shatterer is heavier but still needs adjustment
                bombProperties.density = 0.0004;
                bombProperties.frictionAir = 0.0009;
                break;
                
            case this.scene.BOMB_TYPES.DRILLER:
                // Driller needs good momentum
                bombProperties.density = 0.0004;
                bombProperties.frictionAir = 0.0008;
                break;
        }
        
        // Create the bomb with appropriate properties
        const bomb = this.scene.matter.add.image(x, y, bombType, null, bombProperties);
        bomb.setCircle(30); // Set physics circle radius to 30 (half of 60x60)
        bomb.bombType = bombType; // Store the bomb type for later use
        bomb.setDepth(12); // Same depth as static bomb
        
        // Set bomb size to 60x60
        bomb.setDisplaySize(60, 60);
        
        // Mark as a launched bomb (not static at slingshot)
        bomb.isLaunched = true;
        bomb.hasHitIceBlock = false;
        
        // Apply impulse (instant force)
        this.scene.matter.body.applyForce(bomb.body, 
            { x: x, y: y }, 
            { x: forceX, y: forceY });
        
        // Track when the bomb was launched
        bomb.launchTime = this.scene.time.now;
        
        return bomb;
    }
    
    // Handle blast bomb explosion
    handleBlastBomb(x, y) {
        this.createExplosion(x, y);
        this.scene.destroyBlocksInRadius(x, y, 150);
        
        // Check if any sticky bombs are in range and trigger them
        this.scene.triggerStickyBomb(x, y, 150);
    }
    
    // Handle piercer bomb effect
    handlePiercerBomb(x, y, velocity) {
        velocity = velocity || (this.scene.bomb ? this.scene.bomb.body.velocity : {x: 0, y: 1});
        
        // Normalize velocity to get direction
        const magnitude = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        const dirX = magnitude > 0 ? velocity.x / magnitude : 0;
        const dirY = magnitude > 0 ? velocity.y / magnitude : 1;
        
        // Create a narrower but longer explosion effect
        const lineLength = 300;
        
        // Create visual effect - smaller explosion
        this.createExplosion(x, y);
        
        // Create piercing line particles
        const particles = this.scene.add.particles('particle');
        const emitter = particles.createEmitter({
            speed: { min: 20, max: 50 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 500,
            blendMode: 'ADD',
            tint: 0x77aaff // Blue tint to match the bomb
        });
        
        // Emit along the trajectory line
        for (let i = 0; i < lineLength; i += 10) {
            const pointX = x + dirX * i;
            const pointY = y + dirY * i;
            emitter.explode(3, pointX, pointY);
            
            // Destroy blocks along the line
            this.scene.destroyBlocksInRadius(pointX, pointY, 30);
            
            // Check for sticky bombs along the line
            if (i % 50 === 0) { // Check every 50 pixels to avoid too many calculations
                this.scene.triggerStickyBomb(pointX, pointY, 60);
            }
        }
        
        // Clean up particles
        this.scene.time.delayedCall(500, () => {
            particles.destroy();
        });
    }
    
    // Handle cluster bomb explosions
    handleClusterBomb(x, y) {
        // Create main explosion (smaller than blast bomb)
        this.createExplosion(x, y);
        this.scene.destroyBlocksInRadius(x, y, 100);
        
        // Check for sticky bombs in primary explosion
        this.scene.triggerStickyBomb(x, y, 100);
        
        // Create 3-5 smaller explosions around the main one
        const numClusters = Phaser.Math.Between(3, 5);
        const clusterRadius = 150;
        
        for (let i = 0; i < numClusters; i++) {
            // Calculate random positions around the main explosion
            const angle = Math.random() * Math.PI * 2;
            const distance = 70 + Math.random() * clusterRadius;
            const clusterX = x + Math.cos(angle) * distance;
            const clusterY = y + Math.sin(angle) * distance;
            
            // Add delay based on distance from center
            const delay = distance * 2;
            
            // Create delayed cluster explosion
            this.scene.time.delayedCall(delay, () => {
                // Create mini explosion
                this.createMiniExplosion(clusterX, clusterY);
                // Destroy blocks in smaller radius
                this.scene.destroyBlocksInRadius(clusterX, clusterY, 70);
                // Check for sticky bombs in mini explosion
                this.scene.triggerStickyBomb(clusterX, clusterY, 70);
            });
        }
    }
    
    // Handle sticky bomb placement
    handleStickyBomb(x, y, block) {
        // Create a visual sticky effect to show bomb has stuck, but not exploded
        const stickyEffect = this.scene.add.circle(x, y, 30, 0xff99ff, 0.5);
        stickyEffect.setDepth(15);
        
        // Animate the sticky effect to pulse
        this.scene.tweens.add({
            targets: stickyEffect,
            alpha: 0.2,
            scale: 1.2,
            duration: 800,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1 // Repeat forever until removed
        });
        
        // Add small particles to show it's active
        const particles = this.scene.add.particles('sticky_particle');
        const emitter = particles.createEmitter({
            speed: { min: 10, max: 50 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.7, end: 0 },
            lifespan: 1000,
            blendMode: 'ADD',
            tint: 0xff99ff, // Pink tint for sticky bombs
            frequency: 500, // Emit particles every 500ms
            quantity: 2
        });
        
        // Set particle emission point
        emitter.setPosition(x, y);
        
        // Keep a reference to the original bomb sprite
        let bombSprite = null;
        if (this.scene.bomb) {
            // Fix the bomb in place
            this.scene.bomb.setStatic(true);
            // Store the bomb's position and type
            const bombType = this.scene.bomb.bombType;
            
            // Make the bomb appear at the correct position
            this.scene.bomb.setPosition(x, y);
            
            // Store reference to the bomb sprite
            bombSprite = this.scene.bomb;
            
            // Destroy original bomb reference - but not the visual
            this.scene.bomb = null;
        }
        
        // Create a sticky bomb object to track its state
        const stickyBomb = {
            x: x,
            y: y,
            isActive: true,
            visualEffect: stickyEffect,
            particles: particles,
            bombSprite: bombSprite, // Store the bomb sprite reference
            explosionRadius: 440 // Wider explosion radius than standard bomb
        };
        
        // Add the sticky bomb to an array to track all active sticky bombs
        if (!this.scene.activeStickyBombs) {
            this.scene.activeStickyBombs = [];
        }
        this.scene.activeStickyBombs.push(stickyBomb);
        
        // Play a sticking sound if available
        try {
            this.scene.sound.play('explosion', { volume: 0.2, rate: 1.5 }); // Higher pitch for sticking sound
        } catch (e) {
            console.log("Sound not available:", e);
        }
        
        return stickyBomb;
    }
    
    // Handle shatterer bomb explosions
    handleShattererBomb(x, y) {
        // Create a large red explosion
        const explosion = this.scene.add.circle(x, y, 100, 0xcc3333, 0.8);
        
        // Shockwave effect
        const shockwave = this.scene.add.circle(x, y, 10, 0xffffff, 0.8);
        this.scene.tweens.add({
            targets: shockwave,
            radius: 150,
            alpha: 0,
            duration: 600,
            ease: 'Power2',
            onComplete: () => {
                shockwave.destroy();
            },
            onUpdate: (tween) => {
                // Manually update the circle size since radius isn't a standard property
                const radius = 10 + (150 - 10) * tween.progress;
                shockwave.setRadius(radius);
            }
        });
        
        // Animate the explosion
        this.scene.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 2.5,
            duration: 500,
            ease: 'Power2',
            onComplete: () => {
                explosion.destroy();
            }
        });
        
        // Add particles for impact effect
        const particles = this.scene.add.particles('impact_particle');
        const emitter = particles.createEmitter({
            speed: { min: 100, max: 300 },
            scale: { start: 1.5, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 1000,
            blendMode: 'ADD',
            angle: { min: 0, max: 360 },
            quantity: 50
        });
        
        // Emit particles in a single burst
        emitter.explode(50, x, y);
        
        // For Shatterer bomb, we'll handle block destruction differently to reflect its power
        this.scene.destroyBlocksWithShatterer(x, y, 250);
        
        // Check for sticky bombs in a wide radius with high chance to trigger
        this.scene.triggerStickyBomb(x, y, 300);
        
        // Add a stronger camera shake
        this.scene.cameras.main.shake(500, 0.02);
        
        // Destroy the particle system after emissions complete
        this.scene.time.delayedCall(1000, () => {
            particles.destroy();
        });
        
        // Add explosion sound if available
        if (this.scene.sound && this.scene.sound.add) {
            try {
                const explosionSound = this.scene.sound.add('explosion');
                explosionSound.play({ volume: 0.8, rate: 0.7 }); // Lower pitch for heavier sound
            } catch (e) {
                console.log("Sound not available:", e);
            }
        }
    }
    
    // Handle driller bomb effects
    handleDrillerBomb(x, y, block, velocity) {
        velocity = velocity || (this.scene.bomb ? this.scene.bomb.body.velocity : {x: 0, y: 1});
        
        // Create a visual driller effect to show bomb has started drilling
        const drillerEffect = this.scene.add.circle(x, y, 25, 0xBB5500, 0.7);
        drillerEffect.setDepth(15);
        
        // Animate the driller effect to rotate
        this.scene.tweens.add({
            targets: drillerEffect,
            angle: 360,
            duration: 1000,
            ease: 'Linear',
            repeat: -1 // Repeat forever until removed
        });
        
        // Add particles for drilling effect
        const particles = this.scene.add.particles('particle');
        const emitter = particles.createEmitter({
            speed: { min: 10, max: 30 },
            scale: { start: 0.3, end: 0 },
            alpha: { start: 0.7, end: 0 },
            lifespan: 800,
            blendMode: 'ADD',
            tint: 0xBB5500, // Brown/orange tint for drill
            frequency: 100, // Emit particles frequently
            quantity: 2
        });
        
        // Set particle emission point
        emitter.setPosition(x, y);
        
        // Keep a reference to the original bomb sprite and velocity
        let bombSprite = null;
        let velocityX = velocity.x;
        let velocityY = velocity.y;
        
        if (this.scene.bomb) {
            // Get the bomb's velocity before making it static
            velocityX = this.scene.bomb.body.velocity.x;
            velocityY = this.scene.bomb.body.velocity.y;
            
            // Fix the bomb in place
            this.scene.bomb.setStatic(true);
            
            // Store reference to the bomb sprite
            bombSprite = this.scene.bomb;
            
            // Destroy original bomb reference - but not the visual
            this.scene.bomb = null;
        }
        
        // Get the direction from the bomb's velocity vector
        let directionX = 1; // Default right direction
        let directionY = 0;
        
        // Use the bomb's velocity to determine drilling direction
        const velocityMag = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
        if (velocityMag > 0.1) { // Only use velocity if it's significant
            // Normalize the velocity vector
            directionX = velocityX / velocityMag;
            directionY = velocityY / velocityMag;
        } else if (block) {
            // Fallback to collision direction if velocity is too low
            // Calculate direction from block center to initial impact point
            const dx = x - block.x;
            const dy = y - block.y;
            
            // Normalize to get direction vector
            const mag = Math.sqrt(dx * dx + dy * dy);
            if (mag > 0) {
                directionX = dx / mag;
                directionY = dy / mag;
            }
        }
        
        // Create a driller bomb object with needed properties
        return {
            x: x,
            y: y,
            velocityX: velocityX,
            velocityY: velocityY,
            directionX: directionX,
            directionY: directionY,
            drillerEffect: drillerEffect,
            particles: particles,
            emitter: emitter,
            bombSprite: bombSprite
        };
    }
    
    // Create a small fizzle effect when a bomb misses
    createFizzleEffect(x, y) {
        // Create a small particle effect for a "fizzle" or "failure"
        const particles = this.scene.add.particles('particle');
        particles.setDepth(6); // Same depth as other effects
        
        const emitter = particles.createEmitter({
            speed: { min: 30, max: 60 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.6, end: 0 },
            lifespan: 800,
            blendMode: 'ADD',
            tint: 0xaaaaaa // Gray particles for a "fizzle"
        });
        
        // Emit particles at bomb position
        emitter.explode(15, x, y);
        
        // Small "fizzle" sound if available
        if (this.scene.sound && this.scene.sound.add) {
            try {
                const fizzleSound = this.scene.sound.add('fizzle', { volume: 0.3 });
                fizzleSound.play();
            } catch (e) {
                console.log("Fizzle sound not available:", e);
                // Try to use an existing sound at a different rate as a fallback
                try {
                    const fallbackSound = this.scene.sound.add('explosion');
                    fallbackSound.play({ volume: 0.2, rate: 0.5 });
                } catch (e) {
                    console.log("Fallback sound not available either");
                }
            }
        }
        
        // Destroy the particle system after emissions complete
        this.scene.time.delayedCall(1000, () => {
            particles.destroy();
        });
        
        return particles;
    }
    
    // Create a larger explosion effect for sticky bombs
    createLargeExplosion(x, y) {
        // Create a larger explosion effect for sticky bombs
        const explosion = this.scene.add.circle(x, y, 120, 0xff77cc, 0.8);
        explosion.setDepth(6);
        
        // Animate the explosion
        this.scene.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 3, // Larger scale
            duration: 500, // Longer duration
            ease: 'Power2',
            onComplete: () => {
                explosion.destroy();
            }
        });
        
        // Add more particles for a bigger effect
        const particles = this.scene.add.particles('particle');
        particles.setDepth(6);
        
        const emitter = particles.createEmitter({
            speed: { min: 80, max: 250 }, // Faster particles
            scale: { start: 1.5, end: 0 }, // Larger particles
            alpha: { start: 1, end: 0 },
            lifespan: 1000,
            blendMode: 'ADD',
            tint: 0xff77cc // Pink tint for sticky bomb explosions
        });
        
        // Emit more particles
        emitter.explode(50, x, y);
        
        // Add a larger flash effect
        const flash = this.scene.add.circle(x, y, 150, 0xffffff, 1);
        flash.setDepth(6);
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                flash.destroy();
            }
        });
        
        // Clean up particles after use
        this.scene.time.delayedCall(1000, () => {
            particles.destroy();
        });
        
        // Add a stronger camera shake
        this.scene.cameras.main.shake(400, 0.015);
        
        // Add explosion sound with lower pitch for bigger boom
        if (this.scene.sound && this.scene.sound.add) {
            try {
                const explosionSound = this.scene.sound.add('explosion');
                explosionSound.play({ volume: 0.6, rate: 0.6 });
            } catch (e) {
                console.log("Sound not available:", e);
            }
        }
    }
    
    // Create a driller explosion effect
    createDrillerExplosion(x, y) {
        // Create a larger explosion effect for driller bombs with distinct visuals
        const explosion = this.scene.add.circle(x, y, 140, 0xBB5500, 0.8);
        explosion.setDepth(6);
        
        // Animate the explosion
        this.scene.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 3.5, // Larger scale for more impressive explosion
            duration: 600, // Longer duration
            ease: 'Power2',
            onComplete: () => {
                explosion.destroy();
            }
        });
        
        // Add drilling debris particles
        const particles = this.scene.add.particles('particle');
        particles.setDepth(6);
        
        const emitter = particles.createEmitter({
            speed: { min: 100, max: 300 }, // Faster particles
            scale: { start: 1.8, end: 0 }, // Larger particles
            alpha: { start: 1, end: 0 },
            lifespan: 1200,
            blendMode: 'ADD',
            tint: [0xBB5500, 0xFF9900, 0xFFCC00] // Brown/orange/yellow for drill explosion
        });
        
        // Emit more particles
        emitter.explode(80, x, y);
        
        // Add a flash effect
        const flash = this.scene.add.circle(x, y, 180, 0xffffff, 1);
        flash.setDepth(6);
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            duration: 300,
            onComplete: () => {
                flash.destroy();
            }
        });
        
        // Add secondary ring blast
        const ring = this.scene.add.circle(x, y, 10, 0xFF9900, 0.7);
        ring.setStrokeStyle(4, 0xBB5500, 1);
        ring.setDepth(6);
        this.scene.tweens.add({
            targets: ring,
            scale: 30,
            alpha: 0,
            duration: 800,
            onComplete: () => {
                ring.destroy();
            }
        });
        
        // Clean up particles after use
        this.scene.time.delayedCall(1200, () => {
            particles.destroy();
        });
        
        // Add a stronger camera shake
        this.scene.cameras.main.shake(500, 0.02);
        
        // Add explosion sound with lower pitch for bigger boom
        if (this.scene.sound && this.scene.sound.add) {
            try {
                const explosionSound = this.scene.sound.add('explosion');
                explosionSound.play({ volume: 0.7, rate: 0.5 });
            } catch (e) {
                console.log("Sound not available:", e);
            }
        }
    }
    
    // Create a drill dust effect when a driller bomb drills through a block
    createDrillEffect(x, y) {
        // Create a drill dust effect
        const particles = this.scene.add.particles('particle');
        particles.setDepth(6);
        
        // Create the emitter for debris
        const emitter = particles.createEmitter({
            speed: { min: 30, max: 80 },
            scale: { start: 0.4, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 500,
            blendMode: 'ADD',
            tint: [0xBB5500, 0xCCCCCC], // Brown/orange and gray for drill dust
        });
        
        // Emit a burst of particles
        emitter.explode(10, x, y);
        
        // Clean up after use
        this.scene.time.delayedCall(500, () => {
            particles.destroy();
        });
        
        // Add a small camera shake for drilling feedback
        this.scene.cameras.main.shake(100, 0.003);
        
        return particles;
    }
    
    // Create a bounce trail effect for bombs bounced off bouncy blocks
    createBounceTrail(bomb) {
        if (!bomb || !bomb.scene) return;
        
        // Create trail particles
        const particles = this.scene.add.particles('particle');
        particles.setDepth(5);
        
        const emitter = particles.createEmitter({
            lifespan: 300,
            speed: { min: 5, max: 20 },
            scale: { start: 0.4, end: 0 },
            alpha: { start: 0.6, end: 0 },
            blendMode: 'ADD',
            tint: 0x88ddff, // Light blue for bounce trail
            frequency: 20, // Emit a particle every 20ms
            emitZone: {
                type: 'edge',
                source: new Phaser.Geom.Circle(0, 0, 5),
                quantity: 1
            }
        });
        
        // Track the bomb to emit particles
        emitter.startFollow(bomb);
        
        // Clean up particles if bomb is destroyed
        this.scene.time.delayedCall(1200, () => {
            if (particles && particles.scene) {
                particles.destroy();
            }
        });
        
        // Remove the trail after a short time (if bomb hasn't exploded yet)
        this.scene.time.delayedCall(800, () => {
            if (emitter && emitter.manager && emitter.manager.scene) {
                emitter.stopFollow();
                emitter.stop();
            }
        });
        
        return particles;
    }
    
    // Clean up bomb resources to prevent memory leaks
    cleanupBombResources(bomb) {
        try {
            // Clean up visual effects with error handling
            if (bomb.visualEffect) {
                if (bomb.visualEffect.scene) {
                    bomb.visualEffect.destroy();
                }
                bomb.visualEffect = null;
            }
            
            if (bomb.particles) {
                if (bomb.particles.scene) {
                    bomb.particles.destroy();
                }
                bomb.particles = null;
            }
            
            // Destroy the bomb sprite if it exists
            if (bomb.bombSprite) {
                if (bomb.bombSprite.scene) {
                    bomb.bombSprite.destroy();
                }
                bomb.bombSprite = null;
            }
            
            // Clean up any tweens that might be running on bomb elements
            if (bomb.visualEffect) this.scene.tweens.killTweensOf(bomb.visualEffect);
            if (bomb.bombSprite) this.scene.tweens.killTweensOf(bomb.bombSprite);
            
            // If any emitters are stored directly on the bomb
            if (bomb.emitter) {
                if (bomb.emitter.manager && bomb.emitter.manager.scene) {
                    bomb.emitter.stop();
                    bomb.emitter.remove();
                }
                bomb.emitter = null;
            }
        } catch (error) {
            console.error(`Error cleaning up bomb resources:`, error);
        }
    }
    
    // Generic explosion effect
    createExplosion(x, y) {
        if (!this.scene) return;
        
        // Create visual explosion effect
        const explosion = this.scene.add.circle(x, y, 80, 0xff5500, 0.8);
        explosion.setDepth(6);
        
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
        particles.setDepth(6);
        
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
        flash.setDepth(6);
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
        explosion.setDepth(6);
        
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
        particles.setDepth(6);
        
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

// Export the BombUtils class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BombUtils };
} else {
    // If not in Node.js, add to window object
    window.BombUtils = BombUtils;
} 