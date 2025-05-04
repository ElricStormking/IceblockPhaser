// BlockManager.js - Handles ice block creation and management
class BlockManager {
    constructor(scene) {
        this.scene = scene;
        this.blockUtils = scene.blockUtils;
        this.blockTypes = scene.blockTypes;
        this.iceBlocks = [];
        this.blueVeils = [];
        this.dynamiteBlocks = [];
        this.totalBlocks = 0;
        this.clearedBlocks = 0;
    }
    
    // Create ice blocks covering an image
    createIceBlocksOverImage(targetImage, imageX, imageY, imageWidth, imageHeight) {
        try {
            console.log("Creating ice blocks over image");
            
            // Clear any existing blocks
            this.clearBlocks();
            
            // Use blockUtils if available, otherwise use built-in method
            if (this.blockUtils && typeof this.blockUtils.createIceBlocksOverImage === 'function') {
                const result = this.blockUtils.createIceBlocksOverImage(
                    targetImage, imageX, imageY, imageWidth, imageHeight
                );
                
                // Store the results
                this.iceBlocks = result.blocks || [];
                this.blueVeils = result.veils || [];
                this.dynamiteBlocks = result.dynamiteBlocks || [];
                this.totalBlocks = this.iceBlocks.length;
                
                console.log(`Created ${this.totalBlocks} ice blocks (${this.dynamiteBlocks.length} dynamite blocks)`);
                return result;
            } else {
                // Fallback to built-in method
                return this.createIceBlocksDirectly(targetImage, imageX, imageY, imageWidth, imageHeight);
            }
        } catch (error) {
            console.error("Error creating ice blocks:", error);
            return { blocks: [], veils: [], dynamiteBlocks: [] };
        }
    }
    
    // Create ice blocks directly (fallback method)
    createIceBlocksDirectly(targetImage, imageX, imageY, imageWidth, imageHeight) {
        const blockSize = 15; // Small block size
        const blocks = [];
        const veils = [];
        const dynamiteBlocks = [];
        
        // Create a container for ice blocks with depth above chibi but below UI
        const blocksContainer = this.scene.add.container(0, 0);
        blocksContainer.setDepth(2);
        
        // Calculate grid dimensions
        const cols = Math.ceil(imageWidth / blockSize);
        const rows = Math.ceil(imageHeight / blockSize);
        
        console.log(`Creating ice blocks grid: ${cols}x${rows} over image area ${imageWidth}x${imageHeight}`);
        
        // Create a temporary canvas to check pixel data
        const tempCanvas = document.createElement('canvas');
        const tempContext = tempCanvas.getContext('2d');
        tempCanvas.width = imageWidth;
        tempCanvas.height = imageHeight;
        
        // Get the texture key of the target image
        const textureKey = targetImage.texture.key;
        
        // Get the image data
        const frame = this.scene.textures.getFrame(textureKey);
        const source = frame.source.image || frame.source.canvas;
        
        // Draw the image to our temp canvas
        tempContext.drawImage(source, 0, 0, imageWidth, imageHeight);
        
        // Alpha threshold - lower value to include more semi-transparent pixels at edges
        const alphaThreshold = 50;
        
        // Create a 2D grid to track where we've placed blocks
        const blockGrid = Array(rows).fill().map(() => Array(cols).fill(false));
        
        // First pass: Find all core pixels that meet the alpha threshold
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Calculate position in the original image
                const sampleX = Math.floor(col * blockSize);
                const sampleY = Math.floor(row * blockSize);
                
                // Ensure we're within bounds
                if (sampleX >= 0 && sampleX < imageWidth && sampleY >= 0 && sampleY < imageHeight) {
                    try {
                        const pixelData = tempContext.getImageData(sampleX, sampleY, 1, 1).data;
                        if (pixelData[3] >= alphaThreshold) {
                            blockGrid[row][col] = true;
                        }
                    } catch (e) {
                        console.error(`Error sampling pixel at ${sampleX},${sampleY}:`, e);
                    }
                }
            }
        }
        
        // Add padding around detected pixels
        const paddingAmount = 1;
        const originalGrid = blockGrid.map(row => [...row]);
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (originalGrid[row][col]) {
                    // Add padding blocks
                    for (let pr = -paddingAmount; pr <= paddingAmount; pr++) {
                        for (let pc = -paddingAmount; pc <= paddingAmount; pc++) {
                            const padRow = row + pr;
                            const padCol = col + pc;
                            
                            if (padRow >= 0 && padRow < rows && padCol >= 0 && padCol < cols) {
                                blockGrid[padRow][padCol] = true;
                            }
                        }
                    }
                }
            }
        }
        
        // Select positions for dynamite blocks
        const validPositions = [];
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (blockGrid[row][col]) {
                    const blockScreenX = imageX + col * blockSize + blockSize / 2;
                    const blockScreenY = imageY + row * blockSize + blockSize / 2;
                    validPositions.push({x: blockScreenX, y: blockScreenY, row, col});
                }
            }
        }
        
        // Pick 3 random positions for dynamite blocks
        const dynamitePositions = [];
        if (validPositions.length > 3) {
            // Shuffle the array
            for (let i = validPositions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [validPositions[i], validPositions[j]] = [validPositions[j], validPositions[i]];
            }
            
            // Take the first 3
            for (let i = 0; i < 3; i++) {
                dynamitePositions.push({
                    x: validPositions[i].x,
                    y: validPositions[i].y,
                    row: validPositions[i].row,
                    col: validPositions[i].col
                });
            }
        }
        
        // Create blocks based on our grid
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (!blockGrid[row][col]) continue;
                
                // Calculate screen position
                const blockScreenX = imageX + col * blockSize + blockSize / 2;
                const blockScreenY = imageY + row * blockSize + blockSize / 2;
                
                // Determine block type
                let blockType = this.blockTypes.TYPES.STANDARD;
                
                // Check if this position is one of our dynamite positions
                const isDynamite = dynamitePositions.some(pos => 
                    pos.row === row && pos.col === col);
                
                if (isDynamite) {
                    blockType = this.blockTypes.TYPES.DYNAMITE;
                } else {
                    // For non-dynamite blocks, use weighted random
                    let blockTypeRand = Math.random();
                    if (blockTypeRand < 0.02) {
                        blockType = this.blockTypes.TYPES.ETERNAL;
                    } else if (blockTypeRand < 0.08) {
                        blockType = this.blockTypes.TYPES.STRONG;
                    }
                }
                
                // Physics properties
                let physicsProps = {
                    isStatic: true,
                    friction: 0.01,
                    frictionAir: 0.01,
                    restitution: 0.1
                };
                
                // Create the block
                const block = this.createBlock(
                    blockScreenX,
                    blockScreenY,
                    blockSize,
                    blockType,
                    physicsProps
                );
                
                // Add to tracking arrays
                blocks.push(block);
                if (blockType === this.blockTypes.TYPES.DYNAMITE) {
                    dynamiteBlocks.push(block);
                }
                
                // Create blue veil rectangle if this is a regular block
                if (blockType === this.blockTypes.TYPES.STANDARD) {
                    const veil = this.createVeil(blockScreenX, blockScreenY, blockSize);
                    veils.push(veil);
                }
            }
        }
        
        this.iceBlocks = blocks;
        this.blueVeils = veils;
        this.dynamiteBlocks = dynamiteBlocks;
        this.totalBlocks = blocks.length;
        
        console.log(`Created ${blocks.length} ice blocks (${dynamiteBlocks.length} dynamite blocks)`);
        
        return { 
            blocks: blocks,
            veils: veils,
            dynamiteBlocks: dynamiteBlocks
        };
    }
    
    // Create a single ice block
    createBlock(x, y, blockSize, blockType, physicsProps) {
        // Default properties
        const defaultProps = {
            isStatic: true,
            friction: 0.01,
            frictionAir: 0.01,
            restitution: 0.1
        };
        
        // Merge with provided properties
        const finalProps = { ...defaultProps, ...physicsProps };
        
        // Create the block with proper texture
        let texture = 'ice_block';
        let tint = 0xffffff;
        
        switch (blockType) {
            case this.blockTypes.TYPES.ETERNAL:
                texture = 'ice_block_eternal';
                tint = 0x0000ff; // Blue tint
                break;
            case this.blockTypes.TYPES.STRONG:
                texture = 'ice_block_strong';
                tint = 0x888888; // Grey tint
                break;
            case this.blockTypes.TYPES.DYNAMITE:
                texture = 'ice_block_dynamite';
                tint = 0xff0000; // Red tint
                break;
            case this.blockTypes.TYPES.BOUNCY:
                texture = 'ice_block_bouncy';
                tint = 0xffff00; // Yellow tint
                break;
            default:
                texture = 'ice_block';
                tint = 0xffffff; // No tint
        }
        
        // Create the ice block as a physics object
        const block = this.scene.matter.add.image(x, y, texture);
        block.setRectangle(blockSize, blockSize);
        block.setStatic(finalProps.isStatic);
        block.setFrictionAir(finalProps.frictionAir);
        block.setFriction(finalProps.friction);
        block.setRestitution(finalProps.restitution);
        block.setTint(tint);
        
        // Set display size and depth
        block.setDisplaySize(blockSize, blockSize);
        block.setDepth(3);
        
        // Add properties for game logic
        block.blockType = blockType;
        block.health = this.getBlockHealth(blockType);
        block.maxHealth = block.health;
        block.blockSize = blockSize;
        
        return block;
    }
    
    // Create a blue veil (overlay) for a block
    createVeil(x, y, blockSize) {
        // Create a rectangle with semi-transparent blue color
        const veil = this.scene.add.rectangle(
            x, y, blockSize, blockSize, 0x0088ff, 0.5
        );
        veil.setDepth(4); // Above ice blocks
        
        return veil;
    }
    
    // Get initial health based on block type
    getBlockHealth(blockType) {
        switch (blockType) {
            case this.blockTypes.TYPES.ETERNAL:
                return Infinity; // Cannot be destroyed
            case this.blockTypes.TYPES.STRONG:
                return 3; // Takes 3 hits
            case this.blockTypes.TYPES.DYNAMITE:
                return 1; // One hit to trigger
            case this.blockTypes.TYPES.BOUNCY:
                return 2; // Takes 2 hits
            default:
                return 1; // Standard blocks take 1 hit
        }
    }
    
    // Damage a block
    damageBlock(block, damage = 1) {
        if (!block || block.destroyed) return false;
        
        // Check if block can be damaged
        if (block.blockType === this.blockTypes.TYPES.ETERNAL) {
            return false;
        }
        
        // Apply damage
        block.health -= damage;
        
        // Check if block is destroyed
        if (block.health <= 0) {
            return this.destroyBlock(block);
        } else {
            // Create damage effect
            this.createDamageEffect(block);
            return false;
        }
    }
    
    // Destroy a block completely
    destroyBlock(block) {
        if (!block || block.destroyed) return false;
        
        // Mark block as destroyed
        block.destroyed = true;
        
        // Remove from physics world
        this.scene.matter.world.remove(block);
        
        // Find and remove the veil for this block
        const blockX = block.x;
        const blockY = block.y;
        
        const veilIndex = this.blueVeils.findIndex(veil => 
            Math.abs(veil.x - blockX) < 0.1 && 
            Math.abs(veil.y - blockY) < 0.1
        );
        
        if (veilIndex >= 0) {
            const veil = this.blueVeils[veilIndex];
            veil.destroy();
            this.blueVeils.splice(veilIndex, 1);
        }
        
        // Handle special block types
        if (block.blockType === this.blockTypes.TYPES.DYNAMITE) {
            // Create dynamite explosion effect
            this.createDynamiteEffect(block.x, block.y);
            
            // Remove from dynamite blocks list
            const dynIndex = this.dynamiteBlocks.indexOf(block);
            if (dynIndex >= 0) {
                this.dynamiteBlocks.splice(dynIndex, 1);
            }
        } else {
            // Create standard destroy effect
            this.createDestroyEffect(block.x, block.y);
        }
        
        // Find and remove from ice blocks array
        const index = this.iceBlocks.indexOf(block);
        if (index >= 0) {
            this.iceBlocks.splice(index, 1);
        }
        
        // Update counts
        this.clearedBlocks++;
        
        // Play appropriate sound
        if (this.scene.audioManager) {
            this.scene.audioManager.playCrackSound();
        }
        
        // Destroy the block game object
        block.destroy();
        
        return true;
    }
    
    // Create a damage effect for a block
    createDamageEffect(block) {
        // Add a flash effect
        this.scene.tweens.add({
            targets: block,
            alpha: 0.3,
            duration: 50,
            yoyo: true,
            repeat: 2,
            onComplete: () => {
                if (block.scene) {
                    block.setAlpha(1);
                }
            }
        });
        
        // Add particles for damaged block
        const particles = this.scene.add.particles('ice_particle');
        
        const emitter = particles.createEmitter({
            lifespan: 800,
            speed: { min: 50, max: 100 },
            scale: { start: 0.5, end: 0 },
            quantity: 10,
            blendMode: 'ADD',
            on: false
        });
        
        // Emit particles from the block's position
        emitter.setPosition(block.x, block.y);
        emitter.explode(10);
        
        // Auto-destroy the particle system
        this.scene.time.delayedCall(800, () => {
            particles.destroy();
        });
    }
    
    // Create a standard destroy effect
    createDestroyEffect(x, y) {
        // Add particles for destroyed block
        const particles = this.scene.add.particles('ice_particle');
        
        const emitter = particles.createEmitter({
            lifespan: 1000,
            speed: { min: 50, max: 150 },
            scale: { start: 0.8, end: 0 },
            quantity: 20,
            blendMode: 'ADD',
            on: false
        });
        
        // Emit particles
        emitter.setPosition(x, y);
        emitter.explode(20);
        
        // Auto-destroy the particle system
        this.scene.time.delayedCall(1000, () => {
            particles.destroy();
        });
    }
    
    // Create a dynamite explosion effect
    createDynamiteEffect(x, y) {
        // Create explosion flash
        const flash = this.scene.add.circle(x, y, 30, 0xff8800, 1);
        flash.setDepth(20);
        
        // Add tween for flash
        this.scene.tweens.add({
            targets: flash,
            scale: 4,
            alpha: 0,
            duration: 500,
            onComplete: () => flash.destroy()
        });
        
        // Add particles for explosion
        const particles = this.scene.add.particles('fire_particle');
        
        const emitter = particles.createEmitter({
            lifespan: 1000,
            speed: { min: 100, max: 200 },
            scale: { start: 1, end: 0 },
            quantity: 30,
            blendMode: 'ADD',
            on: false
        });
        
        // Emit particles
        emitter.setPosition(x, y);
        emitter.explode(30);
        
        // Auto-destroy the particle system
        this.scene.time.delayedCall(1000, () => {
            particles.destroy();
        });
        
        // Play explosion sound
        if (this.scene.audioManager) {
            this.scene.audioManager.playExplosionSound();
        }
        
        // Destroy blocks in radius
        this.destroyBlocksInRadius(x, y, 60);
    }
    
    // Destroy blocks within a radius
    destroyBlocksInRadius(x, y, radius) {
        // Create a copy of the blocks array to avoid modification during iteration
        const blocks = [...this.iceBlocks];
        
        // Check each block
        blocks.forEach(block => {
            if (!block || block.destroyed) return;
            
            // Calculate distance
            const dx = block.x - x;
            const dy = block.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Destroy blocks within radius (except eternal blocks)
            if (distance <= radius && block.blockType !== this.blockTypes.TYPES.ETERNAL) {
                this.destroyBlock(block);
            }
        });
    }
    
    // Get current game progress percentage
    getRevealPercentage() {
        if (this.totalBlocks === 0) return 0;
        return Math.floor((this.clearedBlocks / this.totalBlocks) * 100);
    }
    
    // Clear all blocks
    clearBlocks() {
        // Destroy all ice blocks
        this.iceBlocks.forEach(block => {
            if (block && block.scene) {
                this.scene.matter.world.remove(block);
                block.destroy();
            }
        });
        
        // Destroy all blue veils
        this.blueVeils.forEach(veil => {
            if (veil && veil.scene) {
                veil.destroy();
            }
        });
        
        // Reset arrays and counts
        this.iceBlocks = [];
        this.blueVeils = [];
        this.dynamiteBlocks = [];
        this.totalBlocks = 0;
        this.clearedBlocks = 0;
        
        console.log("All blocks cleared");
    }
    
    // Clean up resources
    cleanup() {
        this.clearBlocks();
    }
}

// Export the BlockManager class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BlockManager };
} else {
    // If not in Node.js, add to window object
    window.BlockManager = BlockManager;
} 