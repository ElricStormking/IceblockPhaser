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
        
        // Store initial velocity for driller and sticky bombs
        bomb.storedVelocityX = forceX * 100; // Amplify for better storage
        bomb.storedVelocityY = forceY * 100;
        
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
        console.log("BombUtils.handleStickyBomb called at", x, y);
        
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
        
        // Get the active bomb reference from either direct reference or launcher
        let activeBomb = null;
        if (this.scene.bombLauncher && this.scene.bombLauncher.bomb) {
            activeBomb = this.scene.bombLauncher.bomb;
        } else if (this.scene.bomb) {
            activeBomb = this.scene.bomb;
        }
        
        if (activeBomb) {
            // Fix the bomb in place
            activeBomb.setStatic(true);
            // Make the bomb appear at the correct position
            activeBomb.setPosition(x, y);
            
            // Mark the bomb as sticky
            activeBomb.isSticky = true;
            activeBomb.hasExploded = false;
            
            // Store reference to the bomb sprite
            bombSprite = activeBomb;
            
            console.log("Sticky bomb reference maintained, fixing bomb position at", x, y);
            
            // IMPORTANT: Clear the scene's bomb references after storing our local reference
            // This ensures the launcher will create a new bomb
            if (this.scene.bombLauncher && this.scene.bombLauncher.bomb === activeBomb) {
                this.scene.bombLauncher.bomb = null;
                if (this.scene.bombLauncher.bombState) {
                    this.scene.bombLauncher.bombState.active = false;
                }
            }
            
            if (this.scene.bomb === activeBomb) {
                this.scene.bomb = null;
            }
        }
        
        // Create a sticky bomb object to track its state
        const stickyBomb = {
            x: x,
            y: y,
            isActive: true,
            visualEffect: stickyEffect,
            particles: particles,
            emitter: emitter,
            bombSprite: bombSprite, // Store the bomb sprite reference
            explosionRadius: 440, // Wider explosion radius than standard bomb
            isSticky: true,
            createdAt: Date.now()
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
        
        console.log("Sticky bomb - not destroying as it needs to stay stuck until triggered");
        
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
    
    // Handle driller bomb effect
    handleDrillerBomb(x, y, block, velocityX, velocityY) {
        console.log("BombUtils.handleDrillerBomb called at", x, y);
        
        // Handle the case where separate velocity components are provided
        let velocity = { x: 0, y: 0 };
        
        if (velocityX !== undefined && velocityY !== undefined) {
            velocity = { x: velocityX, y: velocityY };
            console.log(`Using provided velocity: ${velocityX}, ${velocityY}`);
        } else if (this.scene.bomb && this.scene.bomb.body && this.scene.bomb.body.velocity) {
            velocity = this.scene.bomb.body.velocity;
            console.log(`Using bomb body velocity: ${velocity.x}, ${velocity.y}`);
        } else if (this.scene.bomb && this.scene.bomb.storedVelocityX !== undefined && this.scene.bomb.storedVelocityY !== undefined) {
            velocity = { 
                x: this.scene.bomb.storedVelocityX, 
                y: this.scene.bomb.storedVelocityY 
            };
            console.log(`Using bomb stored velocity: ${velocity.x}, ${velocity.y}`);
        } else {
            console.log(`No velocity available, using default.`);
            velocity = { x: 0, y: 1 }; // Default downward velocity
        }
        
        // Get active bomb reference first
        let activeBomb = null;
        
        // Check both possible bomb references (BombLauncher or direct)
        if (this.scene.bombLauncher && this.scene.bombLauncher.bomb) {
            activeBomb = this.scene.bombLauncher.bomb;
            console.log("Using bombLauncher.bomb for driller");
        } else if (this.scene.bomb) {
            activeBomb = this.scene.bomb;
            console.log("Using scene.bomb for driller");
        }
        
        // Store velocity directly on the active bomb if possible
        if (activeBomb) {
            // Save the velocity information on the bomb itself
            activeBomb.storedVelocityX = velocity.x;
            activeBomb.storedVelocityY = velocity.y;
            activeBomb.isDriller = true;
            activeBomb.hasExploded = false; // Ensure it's not marked as exploded
            
            console.log(`Stored velocity on bomb: ${velocity.x}, ${velocity.y}`);
        }
        
        // Forward to the scene's implementation for consistent handling
        if (this.scene.handleDrillerBomb) {
            return this.scene.handleDrillerBomb(x, y, block);
        } else {
            console.error("Scene does not have handleDrillerBomb method, cannot process driller bomb");
            return null;
        }
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
        // Large explosion for driller bombs when triggered
        const explosion = this.scene.add.circle(x, y, 150, 0xBB5500, 0.8);
        explosion.setDepth(6);
        
        // Animate the explosion
        this.scene.tweens.add({
            targets: explosion,
            alpha: 0,
            scale: 3,
            duration: 800,
            ease: 'Power2',
            onComplete: () => {
                explosion.destroy();
            }
        });
        
        // Add particles for a bigger effect
        const particles = this.scene.add.particles('particle');
        particles.setDepth(6);
        
        const emitter = particles.createEmitter({
            speed: { min: 100, max: 300 },
            scale: { start: 2, end: 0 },
            alpha: { start: 1, end: 0 },
            lifespan: 1200,
            blendMode: 'ADD',
            tint: 0xBB5500
        });
        
        // Emit more particles
        emitter.explode(60, x, y);
        
        // Add a larger flash effect
        const flash = this.scene.add.circle(x, y, 200, 0xffffff, 1);
        flash.setDepth(6);
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 2,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                flash.destroy();
            }
        });
        
        // Destroy blocks in a wider radius
        this.scene.destroyBlocksInRadius(x, y, 180);
        
        // Play an explosion sound if available
        if (this.scene.sound && this.scene.sound.add) {
            try {
                const explosionSound = this.scene.sound.add('explosion');
                explosionSound.play({ volume: 0.6 });
            } catch (e) {
                console.log("Explosion sound not available:", e);
            }
        }
        
        // Camera shake for impact
        if (this.scene.cameras && this.scene.cameras.main) {
            this.scene.cameras.main.shake(300, 0.02);
        }
    }
    
    // Create a drill dust effect when a driller bomb drills through a block
    createDrillEffect(x, y) {
        // Small particles for drilling effect
        const particles = this.scene.add.particles('particle');
        particles.setDepth(6);
        
        const emitter = particles.createEmitter({
            speed: { min: 50, max: 150 },
            scale: { start: 0.5, end: 0 },
            alpha: { start: 0.8, end: 0 },
            lifespan: 600,
            blendMode: 'ADD',
            tint: 0xBB7722
        });
        
        // Emit particles at drill position
        emitter.explode(15, x, y);
        
        // Add a small burst flash
        const flash = this.scene.add.circle(x, y, 30, 0xBB5500, 0.7);
        flash.setDepth(5);
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 2,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                flash.destroy();
            }
        });
        
        // Destroy the particle system after emissions complete
        this.scene.time.delayedCall(600, () => {
            particles.destroy();
        });
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
    
    // Handle Ricochet Bomb
    handleRicochetBomb(x, y, block, velocity) {
        try {
            if (!this.scene) return;
            
            // Get or create the bomb
            let bomb = this.scene.bomb;
            
            // Safety check - if bomb doesn't exist
            if (!bomb) {
                console.warn("No bomb reference in handleRicochetBomb");
                return;
            }
            
            // Safety check - if bomb is already destroyed
            if (!bomb.scene) {
                console.warn("Bomb already destroyed in handleRicochetBomb");
                return;
            }
            
            // Safety check - if bomb has already exploded
            if (bomb.hasExploded) {
                console.warn("Bomb already exploded in handleRicochetBomb");
                return;
            }
            
            // If we don't have a bomb reference or it's the first hit, set up the ricochet properties
            if (!bomb.isRicochet) {
                console.log("Setting up ricochet bomb properties");
                
                // Mark as ricochet bomb
                bomb.isRicochet = true;
                bomb.bounceCount = 0;
                bomb.bounceTime = Date.now();
                bomb.hasExploded = false;
                bomb.lastBounceTime = 0;
                bomb.lastBounceX = -1000;
                bomb.lastBounceY = -1000;
                
                // Set restitution (bounciness) to make it bounce more - reduced even further to 0.5
                bomb.setBounce(0.5);
                bomb.setFriction(0.15);  // Increased friction
                // Use direct body damping properties instead of non-existent setDamping method
                if (bomb.body) {
                    bomb.body.frictionAir = 0.005; // Increased to slow down faster
                    if (bomb.body.force) {
                        bomb.body.force.x = 0;
                        bomb.body.force.y = 0;
                    }
                }
                
                // Set very low velocity limits - drastically reduced to make gentle bounces
                if (bomb.body) {
                    if (typeof bomb.body.maxVelocity !== 'undefined') {
                        bomb.body.maxVelocity.x = 40; // Reduced from 450 to 40
                        bomb.body.maxVelocity.y = 40; // Reduced from 450 to 40
                    }
                }
                
                // Create bounce trail effect
                bomb.bounceTrail = this.createRicochetTrail(bomb);
                
                // Set up 5-second explosion timer
                if (bomb.explosionTimer) {
                    bomb.explosionTimer.remove();
                }
                
                bomb.explosionTimer = this.scene.time.delayedCall(5000, () => {
                    if (bomb && bomb.scene && !bomb.hasExploded) {
                        this.explodeRicochetBomb(bomb);
                    }
                });
                
                // Add a visual countdown indicator
                this.addRicochetCountdown(bomb);
                
                // Play a bouncing sound
                if (this.scene.sound && this.scene.sound.add) {
                    try {
                        const bounceSound = this.scene.sound.add('bouncesound');
                        bounceSound.play({ volume: 0.3 });
                    } catch (e) {
                        console.log("Sound not available:", e);
                    }
                }
            } else {
                // This is a subsequent bounce - check if we should process this bounce
                const now = Date.now();
                const minBounceInterval = 250; // Minimum ms between bounce sound/effects
                const canBounce = (now - (bomb.lastBounceTime || 0)) > minBounceInterval;
                
                // Calculate distance from last bounce
                const lastX = bomb.lastBounceX || -1000;
                const lastY = bomb.lastBounceY || -1000;
                const distFromLastBounce = Phaser.Math.Distance.Between(x, y, lastX, lastY);
                
                // We need at least 50 pixels of distance between bounces
                const minBounceDistance = 50;
                
                if (canBounce && distFromLastBounce > minBounceDistance) {
                    // Update bounce tracking properties
                    bomb.bounceCount = (bomb.bounceCount || 0) + 1;
                    bomb.lastBounceTime = now;
                    bomb.lastBounceX = x;
                    bomb.lastBounceY = y;
                    
                    // Play bounce sound with increased pitch based on bounce count
                    if (this.scene.sound && this.scene.sound.add) {
                        try {
                            const bounceSound = this.scene.sound.add('bouncesound');
                            const pitch = 1.0 + (bomb.bounceCount * 0.05); // Increase pitch with each bounce
                            bounceSound.play({ 
                                volume: 0.3,
                                rate: Math.min(pitch, 1.5) // Limit max pitch
                            });
                        } catch (e) {
                            console.log("Sound not available:", e);
                        }
                    }
                    
                    // Create a small flash effect at bounce point
                    this.createBounceFlash(x, y);
                    
                    // Update the countdown text position if it exists
                    if (bomb.countdownText && bomb.countdownText.scene) {
                        bomb.countdownText.setPosition(bomb.x, bomb.y - 30);
                    }
                    
                    // Make sure velocity isn't too low after the bounce
                    if (bomb.body && bomb.body.velocity) {
                        const vx = bomb.body.velocity.x;
                        const vy = bomb.body.velocity.y;
                        const speed = Math.sqrt(vx * vx + vy * vy);
                        
                        // Ensure minimum velocity after bounce
                        const minSpeed = 25;
                        if (speed < minSpeed) {
                            const scale = minSpeed / Math.max(speed, 1);
                            bomb.setVelocity(vx * scale, vy * scale);
                        }
                    }
                }
            }
            
            // Handle collision with specific block types
            if (block && bomb && bomb.body && bomb.body.velocity) {
                try {
                    // Calculate reflection vector based on the collision with the block
                    // First, get the normal vector from the block to the bomb
                    const dx = bomb.x - block.x;
                    const dy = bomb.y - block.y;
                    
                    // Normalize the normal vector
                    const length = Math.sqrt(dx * dx + dy * dy);
                    const nx = length > 0 ? dx / length : 0;
                    const ny = length > 0 ? dy / length : -1;
                    
                    // Get current velocity
                    const vx = bomb.body.velocity.x;
                    const vy = bomb.body.velocity.y;
                    
                    // Calculate dot product of velocity and normal
                    const dot = vx * nx + vy * ny;
                    
                    // Calculate reflection vector: r = v - 2(v·n)n
                    const reflectX = vx - 2 * dot * nx;
                    const reflectY = vy - 2 * dot * ny;
                    
                    // Apply some slight randomization for more natural bounces (±10%)
                    const randomFactor = 0.9 + Math.random() * 0.2;
                    
                    // Apply the reflection with a slight boost 
                    const speedFactor = 1.05; // 5% boost to counteract friction
                    bomb.setVelocity(
                        reflectX * speedFactor * randomFactor,
                        reflectY * speedFactor * randomFactor
                    );
                    
                    // Make sure we're not stuck in the block by moving the bomb slightly 
                    // along the normal vector away from the block
                    const pushDistance = 5; // 5 pixels away from the block
                    bomb.x += nx * pushDistance;
                    bomb.y += ny * pushDistance;
                    
                    // Now handle specific block types
                    if (block.blockType) {
                        switch (block.blockType) {
                            case this.scene.blockTypes?.TYPES?.DYNAMITE:
                                // Dynamite blocks explode on contact
                                if (this.scene.destroyIceBlock) {
                                    this.scene.destroyIceBlock(block);
                                }
                                break;
                                
                            case this.scene.blockTypes?.TYPES?.BOUNCY:
                                // Add extra velocity on bouncy blocks
                                if (bomb.body) {
                                    const speedMultiplier = 1.2;
                                    bomb.setVelocity(
                                        bomb.body.velocity.x * speedMultiplier,
                                        bomb.body.velocity.y * speedMultiplier
                                    );
                                    
                                    // Create a special bouncy block effect
                                    if (this.scene.createBouncyHitEffect) {
                                        this.scene.createBouncyHitEffect(x, y);
                                    }
                                }
                                break;
                                
                            case this.scene.blockTypes?.TYPES?.ETERNAL:
                            case this.scene.blockTypes?.TYPES?.STRONG:
                                // Damage the block
                                if (this.scene.damageIceBlock) {
                                    this.scene.damageIceBlock(block);
                                }
                                break;
                                
                            default:
                                // Default (standard blocks) - destroy them
                                if (this.scene.destroyIceBlock) {
                                    this.scene.destroyIceBlock(block);
                                }
                                break;
                        }
                    }
                    
                    // Apply velocity cap after block collision
                    if (bomb.body && bomb.body.velocity) {
                        const currentSpeed = Math.sqrt(
                            bomb.body.velocity.x * bomb.body.velocity.x + 
                            bomb.body.velocity.y * bomb.body.velocity.y
                        );
                        
                        const maxSpeed = 40;
                        if (currentSpeed > maxSpeed) {
                            const scale = maxSpeed / currentSpeed;
                            bomb.setVelocity(
                                bomb.body.velocity.x * scale,
                                bomb.body.velocity.y * scale
                            );
                        }
                    }
                } catch (error) {
                    console.error("Error in block collision handling:", error);
                }
            }
            
        } catch (error) {
            console.error("Error in handleRicochetBomb:", error);
        }
    }
    
    // Handle ricochet bomb hitting world boundaries
    handleRicochetBoundaryHit(bomb) {
        try {
            if (!bomb || !bomb.body) return;
            
            // Increment bounce count
            bomb.bounceCount = (bomb.bounceCount || 0) + 1;
            
            // Create a bounce flash at the bomb's position
            this.createBounceFlash(bomb.x, bomb.y);
            
            // Ensure the bomb maintains sufficient velocity after boundary hit
            // Drastically reduced for gentler bounces
            const minSpeed = 25;  // Reduced from 250 to 25
            const maxSpeed = 40;  // Reduced from 400 to 40
            
            // Only proceed if body has velocity
            if (bomb.body && bomb.body.velocity) {
                const vx = bomb.body.velocity.x;
                const vy = bomb.body.velocity.y;
                const speed = Math.sqrt(vx * vx + vy * vy);
                
                if (speed < minSpeed) {
                    // Scale velocity to ensure minimum speed
                    const scale = minSpeed / Math.max(speed, 1);
                    bomb.setVelocity(vx * scale, vy * scale);
                } else if (speed > maxSpeed) {
                    // Cap maximum speed
                    const scale = maxSpeed / speed;
                    bomb.setVelocity(vx * scale, vy * scale);
                }
            }
            
            // Play bounce sound
            if (this.scene && this.scene.sound && this.scene.sound.add) {
                try {
                    const bounceSound = this.scene.sound.add('bouncesound');
                    bounceSound.play({ volume: 0.2 });
                } catch (e) {
                    console.log("Sound not available:", e);
                }
            }
            
            // Update the countdown text position if it exists
            if (bomb.countdownText && bomb.countdownText.scene) {
                bomb.countdownText.setPosition(bomb.x, bomb.y - 30);
            }
            
        } catch (error) {
            console.error("Error in handleRicochetBoundaryHit:", error);
        }
    }
    
    // Create a ricochet trail effect
    createRicochetTrail(bomb) {
        if (!this.scene || !bomb) return null;
        
        // Create particle emitter for the ricochet trail
        const particles = this.scene.add.particles('particle');
        particles.setDepth(5);
        
        const emitter = particles.createEmitter({
            lifespan: 400,
            speed: { min: 5, max: 15 },
            scale: { start: 0.3, end: 0 },
            alpha: { start: 0.8, end: 0 },
            blendMode: 'ADD',
            tint: 0x00FFFF, // Cyan for ricochet
            frequency: 15, // Emit particles more frequently than regular bounce
            emitZone: {
                type: 'edge',
                source: new Phaser.Geom.Circle(0, 0, 8),
                quantity: 2
            }
        });
        
        // Track the bomb to emit particles
        emitter.startFollow(bomb);
        
        // Store the emitter on the bomb for later reference
        bomb.trailEmitter = emitter;
        
        // Store particles on the bomb for cleanup
        bomb.trailParticles = particles;
        
        return particles;
    }
    
    // Create a flash effect at bounce point
    createBounceFlash(x, y) {
        if (!this.scene) return;
        
        // Create a small flash circle
        const flash = this.scene.add.circle(x, y, 25, 0x00FFFF, 0.8);
        flash.setDepth(5);
        
        // Animate it
        this.scene.tweens.add({
            targets: flash,
            alpha: 0,
            scale: 2.5,
            duration: 200,
            ease: 'Power2',
            onComplete: () => {
                flash.destroy();
            }
        });
        
        // Add some tiny particles
        const particles = this.scene.add.particles('particle');
        particles.setDepth(5);
        
        const emitter = particles.createEmitter({
            speed: { min: 40, max: 120 },
            scale: { start: 0.4, end: 0 },
            alpha: { start: 1.0, end: 0 },
            lifespan: 400,
            blendMode: 'ADD',
            tint: 0x00FFFF, // Cyan for ricochet
            quantity: 15
        });
        
        // Emit particles at bounce point
        emitter.explode(15, x, y);
        
        // Add a small concentric ring effect
        const ring = this.scene.add.circle(x, y, 5, 0x00FFFF, 0);
        ring.setStrokeStyle(2, 0x00FFFF, 1);
        ring.setDepth(5);
        
        this.scene.tweens.add({
            targets: ring,
            scale: 5,
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                ring.destroy();
            }
        });
        
        // Destroy particles after they're done
        this.scene.time.delayedCall(500, () => {
            if (particles && particles.scene) {
                particles.destroy();
            }
        });
    }
    
    // Add a countdown indicator to ricochet bomb
    addRicochetCountdown(bomb) {
        if (!this.scene || !bomb) return;
        
        // Create the countdown text
        const countdownText = this.scene.add.text(
            bomb.x, 
            bomb.y - 30, 
            '5', 
            { 
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#00FFFF',
                stroke: '#000000',
                strokeThickness: 4,
                align: 'center'
            }
        );
        countdownText.setOrigin(0.5, 0.5);
        countdownText.setDepth(10);
        
        // Store reference on the bomb
        bomb.countdownText = countdownText;
        
        // Update the countdown text every second
        let secondsLeft = 5;
        
        const updateCountdown = () => {
            secondsLeft--;
            
            // Make sure the text and bomb still exist
            if (countdownText && countdownText.scene && bomb && bomb.scene) {
                // Update text
                countdownText.setText(secondsLeft.toString());
                
                // Update position to follow the bomb
                countdownText.setPosition(bomb.x, bomb.y - 30);
                
                // Make text pulse on each second
                this.scene.tweens.add({
                    targets: countdownText,
                    scale: 1.5,
                    duration: 100,
                    yoyo: true,
                    ease: 'Sine.easeOut'
                });
                
                // Change color as time decreases
                if (secondsLeft <= 2) {
                    countdownText.setColor('#FF0000'); // Red for last 2 seconds
                } else if (secondsLeft <= 3) {
                    countdownText.setColor('#FFFF00'); // Yellow for 3 seconds
                }
                
                // Continue countdown if there's time left
                if (secondsLeft > 0 && !bomb.hasExploded) {
                    this.scene.time.delayedCall(1000, updateCountdown);
                }
            }
        };
        
        // Start the countdown
        this.scene.time.delayedCall(1000, updateCountdown);
    }
    
    // Explode the ricochet bomb
    explodeRicochetBomb(bomb) {
        if (!this.scene) return;
        
        // Safety check - if bomb is null or already destroyed
        if (!bomb) {
            console.warn("Attempt to explode null or undefined bomb");
            return;
        }
        
        // Check if bomb has already exploded to prevent duplicates
        if (bomb.hasExploded) {
            console.log("Bomb already exploded, skipping");
            return;
        }
        
        console.log("Ricochet bomb exploding at:", bomb.x, bomb.y);
        
        try {
            // CRITICAL: Immediately mark as exploded to prevent multiple explosions
            bomb.hasExploded = true;
            
            // Store all bomb info we need before potentially destroying it
            const bombInfo = {
                x: bomb.x || 0,
                y: bomb.y || 0,
                type: bomb.bombType || this.scene.BOMB_TYPES?.RICOCHET || 'ricochet_bomb',
                velocity: bomb.body?.velocity ? { x: bomb.body.velocity.x, y: bomb.body.velocity.y } : null
            };
            
            // First detach the bomb from the physics system to prevent further collisions during cleanup
            if (bomb.body && this.scene.matter && this.scene.matter.world) {
                try {
                    // Remove from world but don't destroy the gameObject yet
                    this.scene.matter.world.remove(bomb.body);
                } catch (e) {
                    console.warn("Could not remove bomb body from physics world:", e);
                }
            }
            
            // Clean up all bomb resources in a specific order to avoid errors
            
            // 1. Clean up the countdown text
            if (bomb.countdownText) {
                if (bomb.countdownText.scene) {
                    bomb.countdownText.destroy();
                }
                bomb.countdownText = null;
            }
            
            // 2. Clean up any timers
            if (bomb.explosionTimer) {
                bomb.explosionTimer.remove();
                bomb.explosionTimer = null;
            }
            
            if (bomb.countdown) {
                bomb.countdown.remove();
                bomb.countdown = null;
            }
            
            // 3. Clean up the trail
            if (bomb.trailEmitter) {
                try {
                    bomb.trailEmitter.stopFollow();
                    bomb.trailEmitter.stop();
                } catch (e) {
                    console.warn("Error stopping trail emitter:", e);
                }
                bomb.trailEmitter = null;
            }
            
            if (bomb.trailParticles && bomb.trailParticles.scene) {
                try {
                    bomb.trailParticles.destroy();
                } catch (e) {
                    console.warn("Error destroying trail particles:", e);
                }
                bomb.trailParticles = null;
            }
            
            // 4. Remove references from the scene to prevent update errors
            // IMPORTANT: Clear the reference in scene.bomb before explosion effects
            // to prevent trying to access destroyed objects during effect creation
            if (this.scene && this.scene.bomb === bomb) {
                this.scene.bomb = null;
            }
            
            // 5. Create the explosion at the stored position
            // AFTER we've cleared the bomb reference
            if (this.scene && this.scene.handleRicochetBomb) {
                // Use the cached coordinates and let GameScene handle the explosion
                this.scene.handleRicochetBomb(bombInfo.x, bombInfo.y);
            } else if (this.createExplosion) {
                // Fallback if handleRicochetBomb is not available
                this.createExplosion(bombInfo.x, bombInfo.y);
                if (this.scene.destroyBlocksInRadius) {
                    this.scene.destroyBlocksInRadius(bombInfo.x, bombInfo.y, 150);
                }
                
                // Call reset manually if using the fallback path
                this.scene.time.delayedCall(1000, () => {
                    if (this.scene && this.scene.resetBomb) {
                        this.scene.resetBomb();
                    }
                });
            }
            
            // 6. Finally destroy the bomb object itself if it still exists
            if (bomb.scene) {
                try {
                    bomb.destroy();
                } catch (e) {
                    console.warn("Error destroying bomb gameObject:", e);
                }
            }
            
            console.log("Ricochet bomb cleanup complete");
        } catch (error) {
            console.error("Error in explodeRicochetBomb:", error);
            
            // Recovery: If error occurred, make sure to null the scene's bomb reference
            if (this.scene) {
                if (this.scene.bomb === bomb) {
                    this.scene.bomb = null;
                }
                
                // Force reset the game state
                if (this.scene.forceResetGameState) {
                    this.scene.time.delayedCall(500, () => {
                        this.scene.forceResetGameState();
                    });
                } else if (this.scene.resetBomb) {
                    this.scene.time.delayedCall(500, () => {
                        this.scene.resetBomb();
                    });
                }
            }
        }
    }
}

// Export the BombUtils class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BombUtils };
} else {
    // If not in Node.js, add to window object
    window.BombUtils = BombUtils;
} 