// BlockTypes.js - Defines all block types and their properties
class BlockTypes {
    constructor() {
        // Block type definitions
        this.TYPES = {
            STANDARD: 'standard',
            STRONG: 'strong',
            DYNAMITE: 'dynamite',
            ETERNAL: 'eternal',
            BOUNCY: 'bouncy'
        };
        
        // Block colors by type
        this.COLORS = {
            [this.TYPES.STANDARD]: 0xaaddff,  // Default light blue
            [this.TYPES.STRONG]: 0x6666dd,     // Medium blue
            [this.TYPES.DYNAMITE]: 0xdd3333,   // Red
            [this.TYPES.ETERNAL]: 0x3333cc,    // Dark blue
            [this.TYPES.BOUNCY]: 0x00cc44      // Green
        };
        
        // Block alpha (transparency) values
        this.ALPHA = {
            [this.TYPES.STANDARD]: 0.85,
            [this.TYPES.STRONG]: 0.85,
            [this.TYPES.DYNAMITE]: 0.85,
            [this.TYPES.ETERNAL]: 0.9,
            [this.TYPES.BOUNCY]: 0.9
        };
        
        // Block hit points
        this.HIT_POINTS = {
            [this.TYPES.STANDARD]: 1,
            [this.TYPES.STRONG]: 2,
            [this.TYPES.DYNAMITE]: 1,
            [this.TYPES.ETERNAL]: 3,
            [this.TYPES.BOUNCY]: 1
        };
    }
    
    // Get color for a given block type
    getColor(blockType) {
        return this.COLORS[blockType] || this.COLORS[this.TYPES.STANDARD];
    }
    
    // Get alpha for a given block type
    getAlpha(blockType) {
        return this.ALPHA[blockType] || this.ALPHA[this.TYPES.STANDARD];
    }
    
    // Get hit points for a given block type
    getHitPoints(blockType) {
        return this.HIT_POINTS[blockType] || this.HIT_POINTS[this.TYPES.STANDARD];
    }
    
    // Check if a block type exists
    isValidType(blockType) {
        return Object.values(this.TYPES).includes(blockType);
    }
}

// Export the BlockTypes class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BlockTypes };
} else {
    // If not in Node.js, add to window object
    window.BlockTypes = BlockTypes;
} 