// BlockManager.js - Handles all block types and their behaviors
class BlockManager {
    constructor(scene) {
        // Store reference to the main scene
        this.scene = scene;
        
        // Array to store all ice blocks
        this.blocks = [];
        
        // Track total blocks created for percentage calculations
        this.totalCreatedBlocks = 0;
        
        // Block type definitions
        this.BLOCK_TYPES = {
            STANDARD: 'standard',
            STRONG: 'strong',
            DYNAMITE: 'dynamite',
            ETERNAL: 'eternal',
            BOUNCY: 'bouncy'
        };
        
        // Block colors by type
        this.BLOCK_COLORS = {
            [this.BLOCK_TYPES.STANDARD]: 0x8fffff,
            [this.BLOCK_TYPES.STRONG]: 0x0080ff,
            [this.BLOCK_TYPES.DYNAMITE]: 0xff5050,
            [this.BLOCK_TYPES.ETERNAL]: 0x50ff50,
            [this.BLOCK_TYPES.BOUNCY]: 0x00ffff
        };
    }
    
    // Create ice blocks based on chibi silhouette
    createIceBlocks() {
        try {
            // Create a container for ice blocks with depth above chibi but below UI
            const blockContainer = this.scene.add.container(0, 0);
            blockContainer.setDepth(4);
            
            // Reset blocks array
            this.blocks = [];
            
            // Get image dimensions of the chibi
            const chibiImage = this.scene.chibiImage;
            const chibiTexture = this.scene.textures.get('chibi_girl1');
            const chibiFrame = chibiTexture.frames.__BASE;
            
            // Create a temporary canvas to check pixel data
            const tempCanvas = document.createElement('canvas');
            const context = tempCanvas.getContext('2d');
            tempCanvas.width = chibiFrame.width;
            tempCanvas.height = chibiFrame.height;
            
            // Draw the chibi texture to the canvas
            context.drawImage(
                chibiTexture.getSourceImage(),
                chibiFrame.cutX, chibiFrame.cutY,
                chibiFrame.cutWidth, chibiFrame.cutHeight,
                0, 0,
                chibiFrame.width, chibiFrame.height
            );
            
            // Get image data
            const imageData = context.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
            const pixels = imageData.data;
            
            // Size and position variables
            const blockSize = 30; // Size of each block
            const gridPadding = 2; // Padding between blocks
            const gridCols = Math.floor(chibiFrame.width / blockSize);
            const gridRows = Math.floor(chibiFrame.height / blockSize);
            
            // Create a 2D grid to track where we've placed blocks
            const blockGrid = Array(gridRows).fill().map(() => Array(gridCols).fill(false));
            
            // First pass: Detect non-transparent pixels in each grid cell
            for (let row = 0; row < gridRows; row++) {
                for (let col = 0; col < gridCols; col++) {
                    // Check if this grid cell contains non-transparent pixels
                    let hasContent = false;
                    
                    // Sample multiple points in the cell to be more accurate
                    const sampleSize = 5;
                    const cellStartX = col * blockSize;
                    const cellStartY = row * blockSize;
                    
                    for (let sy = 0; sy < sampleSize; sy++) {
                        for (let sx = 0; sx < sampleSize; sx++) {
                            const pixelX = cellStartX + Math.floor(sx * (blockSize / sampleSize));
                            const pixelY = cellStartY + Math.floor(sy * (blockSize / sampleSize));
                            
                            // Calculate index into the pixel array
                            const pixelIndex = (pixelY * tempCanvas.width + pixelX) * 4;
                            
                            // If pixel is not transparent
                            if (pixelIndex < pixels.length && pixels[pixelIndex + 3] > 50) {
                                hasContent = true;
                                break;
                            }
                        }
                        if (hasContent) break;
                    }
                    
                    blockGrid[row][col] = hasContent;
                }
            }
            
            // Second pass: Add padding around filled cells
            // This creates a thickness around the chibi image
            const paddedGrid = JSON.parse(JSON.stringify(blockGrid));
            
            // Create a copy of the grid before adding padding
            for (let row = 0; row < gridRows; row++) {
                for (let col = 0; col < gridCols; col++) {
                    // If cell is filled, also fill its neighbors
                    if (blockGrid[row][col]) {
                        // Add block to adjacent cells (left, right, top, bottom)
                        if (row > 0) paddedGrid[row - 1][col] = true;
                        if (row < gridRows - 1) paddedGrid[row + 1][col] = true;
                        if (col > 0) paddedGrid[row][col - 1] = true;
                        if (col < gridCols - 1) paddedGrid[row][col + 1] = true;
                    }
                }
            }
            
            // Track the positions of special blocks
            const dynamitePositions = [];
            const strongPositions = [];
            const eternalPositions = [];
            const bouncyPositions = [];
            
            // Prepare to create exactly 3 dynamite blocks
            const dynamiteCount = 3;
            const filledCells = [];
            
            for (let row = 0; row < gridRows; row++) {
                for (let col = 0; col < gridCols; col++) {
                    if (paddedGrid[row][col]) {
                        filledCells.push({ row, col });
                    }
                }
            }
            
            // Randomly select positions for dynamite blocks
            for (let i = 0; i < dynamiteCount && filledCells.length > 0; i++) {
                const idx = Math.floor(Math.random() * filledCells.length);
                const { row, col } = filledCells[idx];
                dynamitePositions.push({ row, col });
                filledCells.splice(idx, 1);
            }
            
            // Select positions for strong blocks (around 10% of remaining blocks)
            const strongBlockCount = Math.floor(filledCells.length * 0.1);
            for (let i = 0; i < strongBlockCount && filledCells.length > 0; i++) {
                const idx = Math.floor(Math.random() * filledCells.length);
                const { row, col } = filledCells[idx];
                strongPositions.push({ row, col });
                filledCells.splice(idx, 1);
            }
            
            // Select positions for eternal blocks (around 5% of remaining blocks)
            const eternalBlockCount = Math.floor(filledCells.length * 0.05);
            for (let i = 0; i < eternalBlockCount && filledCells.length > 0; i++) {
                const idx = Math.floor(Math.random() * filledCells.length);
                const { row, col } = filledCells[idx];
                eternalPositions.push({ row, col });
                filledCells.splice(idx, 1);
            }
            
            // Select positions for bouncy blocks (around 5% of remaining blocks)
            const bouncyBlockCount = Math.floor(filledCells.length * 0.05);
            for (let i = 0; i < bouncyBlockCount && filledCells.length > 0; i++) {
                const idx = Math.floor(Math.random() * filledCells.length);
                const { row, col } = filledCells[idx];
                bouncyPositions.push({ row, col });
                filledCells.splice(idx, 1);
            }
            
            // Third pass: Create blocks based on our grid
            const createdBlocks = [];
            
            for (let row = 0; row < gridRows; row++) {
                for (let col = 0; col < gridCols; col++) {
                    if (paddedGrid[row][col]) {
                        // Calculate block position (relative to chibi position)
                        const blockX = chibiImage.x - chibiFrame.width / 2 + col * blockSize + blockSize / 2;
                        const blockY = chibiImage.y - chibiFrame.height / 2 + row * blockSize + blockSize / 2;
                        
                        // Determine block type based on special positions
                        let blockType = this.BLOCK_TYPES.STANDARD;
                        
                        // Check for special block types
                        const isDynamite = dynamitePositions.some(pos => pos.row === row && pos.col === col);
                        const isStrong = strongPositions.some(pos => pos.row === row && pos.col === col);
                        const isEternal = eternalPositions.some(pos => pos.row === row && pos.col === col);
                        const isBouncy = bouncyPositions.some(pos => pos.row === row && pos.col === col);
                        
                        if (isDynamite) {
                            blockType = this.BLOCK_TYPES.DYNAMITE;
                        } else if (isEternal) {
                            blockType = this.BLOCK_TYPES.ETERNAL;
                        } else if (isStrong) {
                            blockType = this.BLOCK_TYPES.STRONG;
                        } else if (isBouncy) {
                            blockType = this.BLOCK_TYPES.BOUNCY;
                        }
                        
                        // Create ice block
                        const block = this.createBlock(blockX, blockY, blockSize, blockType);
                        createdBlocks.push(block);
                    }
                }
            }
            
            // Store the total number of blocks created for percentage calculations
            this.totalCreatedBlocks = createdBlocks.length;
            
            console.log(`Created ${createdBlocks.length} ice blocks with blue veils`);
            console.log(`Created exactly ${dynamitePositions.length} dynamite blocks`);
            
            return createdBlocks;
        } catch (error) {
            console.error("Error in createIceBlocks:", error);
            return [];
        }
    }
    
    // Create a single block of specified type
    createBlock(x, y, size, blockType = 'standard') {
        try {
            // Create the block sprite or rectangle
            const block = this.scene.matter.add.rectangle(
                x, y, 
                size - 2, // Slightly smaller than grid size to create gap
                size - 2,
                {
                    isStatic: true,
                    label: 'ice_block'
                }
            );
            
            // Get color based on block type
            const blockColor = this.BLOCK_COLORS[blockType] || this.BLOCK_COLORS.STANDARD;
            
            // Create a blue veil rectangle for this block with type-specific color
            const blueVeil = this.scene.add.rectangle(
                x, y, 
                size - 2, 
                size - 2, 
                blockColor, 
                1
            );
            
            // Add custom properties to the block
            block.blockType = blockType;
            block.blueVeil = blueVeil;
            block.width = size - 2;
            block.height = size - 2;
            block.isActive = true;
            
            // Initialize type-specific properties
            switch (blockType) {
                case this.BLOCK_TYPES.STRONG:
                    // Initialize health for strong blocks
                    block.health = 2;
                    block.hitsLeft = 2;
                    break;
                case this.BLOCK_TYPES.ETERNAL:
                    block.health = 3;
                    block.hitsLeft = 3;
                    break;
                case this.BLOCK_TYPES.DYNAMITE:
                    block.health = 1;
                    block.hitsLeft = 1;
                    break;
                case this.BLOCK_TYPES.BOUNCY:
                    block.health = 1;
                    block.hitsLeft = 1;
                    break;
                default:
                    block.health = 1;
                    block.hitsLeft = 1;
                    break;
            }
            
            // Set block-specific visual indicators and other properties
            switch (blockType) {
                case this.BLOCK_TYPES.STRONG:
                    // No need to set health again, it's already set above
                    break;
                case this.BLOCK_TYPES.DYNAMITE:
                    // Add dynamite visual indicator
                    const dynamiteIcon = this.scene.add.sprite(x, y, 'dynamite_icon');
                    dynamiteIcon.setScale(0.5);
                    dynamiteIcon.setDepth(5);
                    block.dynamiteIcon = dynamiteIcon;
                    break;
                case this.BLOCK_TYPES.ETERNAL:
                    // Add eternal visual indicator (shield effect)
                    const shieldEffect = this.scene.add.sprite(x, y, 'shield_effect');
                    shieldEffect.setScale(0.6);
                    shieldEffect.setDepth(5);
                    shieldEffect.setAlpha(0.7);
                    block.shieldEffect = shieldEffect;
                    break;
                case this.BLOCK_TYPES.BOUNCY:
                    // Add bouncy visual indicator (pulse effect)
                    const bounceIndicator = this.scene.add.sprite(x, y, 'bounce_indicator');
                    bounceIndicator.setScale(0.6);
                    bounceIndicator.setDepth(5);
                    
                    // Add pulsing animation to bounce indicator
                    this.scene.tweens.add({
                        targets: bounceIndicator,
                        scale: 0.7,
                        duration: 600,
                        yoyo: true,
                        repeat: -1
                    });
                    
                    block.bounceIndicator = bounceIndicator;
                    break;
            }
            
            // Add visual effects like shimmer
            this.createIceTextureEffect(blueVeil);
            
            // Add to blocks array
            this.blocks.push(block);
            
            return block;
        } catch (error) {
            console.error("Error in createBlock:", error);
            return null;
        }
    }
    
    // Create ice texture effect for a block
    createIceTextureEffect(veil) {
        try {
            // Add a subtle shade/gradient to the rectangle
            // Create a shimmer/highlight effect for some blocks
            if (Math.random() < 0.3) {
                const shimmerX = veil.x + Phaser.Math.Between(-veil.width/3, veil.width/3);
                const shimmerY = veil.y + Phaser.Math.Between(-veil.height/3, veil.height/3);
                
                const shimmer = this.scene.add.rectangle(
                    shimmerX, shimmerY, 
                    veil.width / 3, 
                    veil.height / 3, 
                    0xffffff, 
                    0.3
                );
                
                shimmer.setDepth(veil.depth + 0.1);
                
                // Create shimmer animation
                this.scene.tweens.add({
                    targets: shimmer,
                    alpha: { from: 0.3, to: 0 },
                    duration: Phaser.Math.Between(1500, 3000),
                    ease: 'Sine.easeInOut',
                    repeat: -1,
                    yoyo: true
                });
                
                // Store reference to shimmer effect
                veil.shimmerEffect = shimmer;
            }
        } catch (error) {
            console.error("Error in createIceTextureEffect:", error);
        }
    }
    
    // Get all blocks in a specified radius
    getBlocksInRadius(x, y, radius) {
        return this.blocks.filter(block => {
            // Skip destroyed blocks
            if (!block.blueVeil || !block.blueVeil.active) return false;
            
            // Calculate distance
            const dx = block.x - x;
            const dy = block.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            return distance <= radius;
        });
    }
    
    // Destroy blocks in radius
    destroyBlocksInRadius(x, y, radius) {
        try {
            // Find all blocks within the explosion radius
            const blocksInRadius = this.getBlocksInRadius(x, y, radius);
            
            // Track destroyed blocks to calculate reveal percentage
            let blocksDestroyed = 0;
            
            // Create a list to track blocks to be destroyed
            const destroyQueue = [];
            
            // Process each block based on its type
            blocksInRadius.forEach(block => {
                // Skip blocks that are already destroyed
                if (!block.blueVeil || !block.blueVeil.active) return;
                
                // Calculate distance from explosion center
                const dx = block.x - x;
                const dy = block.y - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Handle different block types
                switch (block.blockType) {
                    case this.BLOCK_TYPES.ETERNAL:
                        // Eternal blocks can't be destroyed
                        return;
                        
                    case this.BLOCK_TYPES.STRONG:
                        // Strong blocks require multiple hits
                        if (block.health && block.health > 1) {
                            // Damage the block instead of destroying
                            block.health--;
                            this.scene.effects.createDamageEffect(block);
                            return;
                        }
                        // If health is 1, destroy it normally
                        break;
                        
                    case this.BLOCK_TYPES.BOUNCY:
                        // Bouncy blocks reflect bombs but can be destroyed
                        this.scene.effects.createBouncyHitEffect(block.x, block.y);
                        break;
                        
                    case this.BLOCK_TYPES.DYNAMITE:
                        // Dynamite blocks explode when hit, destroying blocks around them
                        destroyQueue.push(block);
                        
                        // Queue a delayed explosion effect
                        this.scene.time.delayedCall(Phaser.Math.Between(100, 300), () => {
                            // Create explosion at dynamite location
                            this.scene.effects.createExplosion(block.x, block.y);
                            
                            // Find additional blocks within the dynamite explosion radius
                            this.destroyBlocksInRadius(block.x, block.y, 100);
                        });
                        return;
                }
                
                // Add to destroy queue
                destroyQueue.push(block);
            });
            
            // Process the destroy queue
            destroyQueue.forEach(block => {
                this.destroyBlock(block);
                blocksDestroyed++;
            });
            
            // Clean up array, removing destroyed blocks
            this.cleanupBlocksArray();
            
            return blocksDestroyed;
        } catch (error) {
            console.error("Error in destroyBlocksInRadius:", error);
            return 0;
        }
    }
    
    // Special destroy method for Shatterer bomb
    destroyBlocksWithShatterer(x, y, radius) {
        try {
            // Find all blocks within the explosion radius
            const blocksInRadius = this.getBlocksInRadius(x, y, radius);
            
            // Track destroyed blocks to calculate reveal percentage
            let blocksDestroyed = 0;
            
            // Create a list to track blocks to be destroyed
            const destroyQueue = [];
            
            // Process each block based on its type
            blocksInRadius.forEach(block => {
                // Skip blocks that are already destroyed
                if (!block.blueVeil || !block.blueVeil.active) return;
                
                // Calculate distance from explosion center
                const dx = block.x - x;
                const dy = block.y - y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Handle different block types differently for Shatterer bomb
                switch (block.blockType) {
                    case this.BLOCK_TYPES.ETERNAL:
                        // Even Shatterer can't destroy eternal blocks
                        return;
                        
                    case this.BLOCK_TYPES.STRONG:
                        // Shatterer always destroys strong blocks in one hit
                        break;
                        
                    case this.BLOCK_TYPES.DYNAMITE:
                        // Dynamite blocks explode when hit
                        destroyQueue.push(block);
                        
                        // Queue a delayed explosion effect
                        this.scene.time.delayedCall(Phaser.Math.Between(100, 300), () => {
                            // Create explosion at dynamite location
                            this.scene.effects.createExplosion(block.x, block.y);
                            
                            // Destroy additional blocks in dynamite radius
                            this.destroyBlocksInRadius(block.x, block.y, 100);
                        });
                        return;
                        
                    case this.BLOCK_TYPES.BOUNCY:
                        // Shatterer always destroys bouncy blocks
                        this.scene.effects.createBouncyHitEffect(block.x, block.y);
                        break;
                }
                
                // Add to destroy queue
                destroyQueue.push(block);
            });
            
            // Process the destroy queue
            destroyQueue.forEach(block => {
                this.destroyBlock(block);
                blocksDestroyed++;
            });
            
            // Clean up array, removing destroyed blocks
            this.cleanupBlocksArray();
            
            return blocksDestroyed;
        } catch (error) {
            console.error("Error in destroyBlocksWithShatterer:", error);
            return 0;
        }
    }
    
    // Remove destroyed blocks from the blocks array
    cleanupBlocksArray() {
        this.blocks = this.blocks.filter(block => 
            block && block.blueVeil && block.blueVeil.active
        );
    }
    
    // Destroy a single block
    destroyBlock(block) {
        try {
            // Ignore if block is already destroyed
            if (!block || !block.blueVeil || !block.blueVeil.active) {
                return false;
            }
            
            // Different destruction effects based on block type
            switch (block.blockType) {
                case this.BLOCK_TYPES.DYNAMITE:
                    // Remove dynamite icon
                    if (block.dynamiteIcon) {
                        block.dynamiteIcon.destroy();
                    }
                    
                    // Special dynamite effect
                    this.scene.effects.createDynamiteDestroyEffect(block.x, block.y);
                    break;
                    
                case this.BLOCK_TYPES.ETERNAL:
                    // Remove shield effect
                    if (block.shieldEffect) {
                        block.shieldEffect.destroy();
                    }
                    break;
                    
                case this.BLOCK_TYPES.BOUNCY:
                    // Remove bounce indicator
                    if (block.bounceIndicator) {
                        block.bounceIndicator.destroy();
                    }
                    break;
            }
            
            // Remove any shimmer effect
            if (block.blueVeil && block.blueVeil.shimmerEffect) {
                block.blueVeil.shimmerEffect.destroy();
            }
            
            // Create shatter effect
            this.scene.effects.createBlockShatter(block);
            
            // Remove the veil
            block.blueVeil.destroy();
            
            // Remove the physics body - it's important to properly clean up Matter bodies
            this.scene.matter.world.remove(block);
            
            return true;
        } catch (error) {
            console.error("Error in destroyBlock:", error);
            return false;
        }
    }
    
    // Damage a block (for strong blocks)
    damageBlock(block) {
        try {
            // Ignore if block is already destroyed
            if (!block || !block.blueVeil || !block.blueVeil.active) {
                console.log("Block already destroyed or invalid");
                return false;
            }
            
            // For debugging
            console.log(`Damaging block of type ${block.blockType}, health: ${block.health || 'N/A'}`);
            
            // Handle strong and eternal blocks
            if (block.blockType === this.BLOCK_TYPES.STRONG || block.blockType === this.BLOCK_TYPES.ETERNAL) {
                // Ensure health property exists
                if (block.health === undefined) {
                    block.health = block.blockType === this.BLOCK_TYPES.STRONG ? 2 : 3;
                }
                
                // Decrement health
                block.health--;
                
                console.log(`Block damaged, health now: ${block.health}`);
                
                // If health reaches 0, destroy the block
                if (block.health <= 0) {
                    console.log("Block has no health left, destroying");
                    return this.destroyBlock(block);
                } else {
                    // Otherwise show damage effect
                    if (this.scene.effects && typeof this.scene.effects.createDamageEffect === 'function') {
                        this.scene.effects.createDamageEffect(block);
                    } else {
                        // Fallback when effects manager is not available
                        this.scene.createBlockShatter(block);
                    }
                    
                    // Visual indicator of damage - make the block less opaque
                    if (block.blueVeil) {
                        block.blueVeil.setAlpha(block.blueVeil.alpha * 0.8);
                    }
                    
                    return true;
                }
            } else {
                // For normal blocks, just destroy them
                return this.destroyBlock(block);
            }
        } catch (error) {
            console.error("Error in damageBlock:", error);
            return false;
        }
    }
    
    // Handle interaction with bouncy blocks
    handleBouncyBlock(block, bomb) {
        try {
            // Only works on bouncy blocks
            if (block.blockType !== this.BLOCK_TYPES.BOUNCY) return false;
            
            // Calculate reflection direction
            const dx = bomb.x - block.x;
            const dy = bomb.y - block.y;
            
            // Normalize
            const magnitude = Math.sqrt(dx * dx + dy * dy);
            const ndx = dx / magnitude;
            const ndy = dy / magnitude;
            
            // Get current velocity
            const vx = bomb.body.velocity.x;
            const vy = bomb.body.velocity.y;
            
            // Apply bouncy reflection with slight speed increase for more dynamic gameplay
            const bounceFactorX = vx < 0 === ndx < 0 ? -1.1 : 1.1;
            const bounceFactorY = vy < 0 === ndy < 0 ? -1.1 : 1.1;
            
            // Set new velocity
            bomb.setVelocity(vx * bounceFactorX, vy * bounceFactorY);
            
            // Create bounce visual effect
            this.scene.effects.createBouncyHitEffect(bomb.x, bomb.y);
            
            // Create trail effect behind the bomb
            this.scene.effects.createBounceTrail(bomb);
            
            // Increment bounce count (used for ricochet bombs)
            if (!bomb.bounceCount) bomb.bounceCount = 0;
            bomb.bounceCount++;
            
            return true;
        } catch (error) {
            console.error("Error in handleBouncyBlock:", error);
            return false;
        }
    }
    
    // Get number of remaining blocks
    getRemainingBlocksCount() {
        return this.blocks.length;
    }
    
    // Get current revealed percentage
    getRevealPercentage() {
        try {
            // Get the initial total count from scene if available
            const initialTotal = this.scene.initialBlockCount || this.totalCreatedBlocks || 0;
            
            // If we have no initial count, we can't calculate percentage
            if (initialTotal <= 0) return 0;
            
            // Calculate percentage based on how many blocks are gone
            const currentCount = this.blocks.length;
            const destroyedCount = initialTotal - currentCount;
            
            // Calculate percentage revealed
            const percentage = (destroyedCount / initialTotal) * 100;
            
            // Ensure it's within valid range
            return Phaser.Math.Clamp(percentage, 0, 100);
        } catch (error) {
            console.error("Error in getRevealPercentage:", error);
            return 0;
        }
    }
    
    // Clean up resources
    cleanup() {
        // Destroy all remaining blocks
        this.blocks.forEach(block => {
            try {
                // Remove associated visual elements
                if (block.blueVeil) {
                    if (block.blueVeil.shimmerEffect) {
                        block.blueVeil.shimmerEffect.destroy();
                    }
                    block.blueVeil.destroy();
                }
                
                // Remove type-specific visual indicators
                if (block.dynamiteIcon) block.dynamiteIcon.destroy();
                if (block.shieldEffect) block.shieldEffect.destroy();
                if (block.bounceIndicator) block.bounceIndicator.destroy();
                
                // Remove physics body
                this.scene.matter.world.remove(block);
            } catch (e) {
                console.error("Error cleaning up block:", e);
            }
        });
        
        // Clear the blocks array
        this.blocks = [];
    }
}

// Export the BlockManager class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BlockManager };
} else {
    // If not in Node.js, add to window object
    window.BlockManager = BlockManager;
} 