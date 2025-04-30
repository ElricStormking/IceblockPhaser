# Beauty Ice Breaker Game - Level Structure

This document describes the structure and organization of the 5 initial levels for the Beauty Ice Breaker game.

## Level Structure

Each level is stored in its own directory (`level1` through `level5`) and includes:

1. **Level Configuration** (`level_config.json`): Contains basic level details including:
   - Level number
   - Chibi girl character
   - Available bomb types
   - Block configuration
   - Layout description
   - Strategic notes
   
2. **Available Bombs** (`available_bombs.json`): Specifies the bombs available in this level:
   - Which bomb types are available
   - How many of each bomb type are provided
   - Which bomb is unlocked by completing this level
   
3. **Block Layout** (`block_layout.json`): Provides detailed block positions for:
   - Standard blocks
   - Strong blocks
   - Dynamite blocks
   - Eternal blocks (where applicable)
   - Bouncy blocks (where applicable)
   
4. **Chibi Girl Image**: Each level features a unique chibi girl character image:
   - Level 1: `chibi_girl.png` (Schoolgirl)
   - Level 2: `chibi_girl2.png` (Knight)
   - Level 3: `chibi_girl3.png` (Witch)
   - Level 4: `chibi_girl4.png` (Mermaid)
   - Level 5: `chibi_girl5.png` (Pirate)
   
5. **Victory Background**: Each level has a unique victory background:
   - Level 1: `victory_background.png`
   - Level 2: `victory_background2.png`
   - Level 3: `victory_background3.png`
   - Level 4: `victory_background4.png`
   - Level 5: `victory_background5.png`

## Level Progression

The levels progressively introduce new bomb types and block configurations:

1. **Level 1** (Schoolgirl - Blast Girl):
   - Introduces the basic Blast bomb
   - Simple grid with all standard blocks
   - Unlocks the Blast bomb type for future levels
   
2. **Level 2** (Knight - Piercer Girl):
   - Introduces the Piercer bomb and Ricochet bomb
   - Grid with standard, strong, and dynamite blocks
   - Unlocks the Piercer bomb type for future levels
   
3. **Level 3** (Witch - Shrapnel Girl):
   - Introduces the Cluster bomb (Shrapnel)
   - Larger grid with more dynamite blocks for chain reactions
   - Unlocks the Cluster bomb type for future levels
   
4. **Level 4** (Mermaid - Ricochet Girl):
   - Introduces the Ricochet bomb and Shatterer bomb
   - First level with eternal blocks (requiring Shatterer)
   - Unlocks the Ricochet bomb type for future levels
   
5. **Level 5** (Pirate - Sticky Girl):
   - Introduces the Sticky bomb
   - Complex checkerboard layout with all block types
   - Unlocks the Sticky bomb type for future levels

## Bomb Types

Different colored bombs are available in the `assets/images/bombs` directory:
- `blast_bomb.png` - Red explosion bomb
- `piercer_bomb.png` - Blue piercing bomb
- `cluster_bomb.png` - Orange bomb that splits into mini bombs
- `sticky_bomb.png` - Green bomb that sticks to blocks
- `shatterer_bomb.png` - Purple bomb that can break eternal blocks
- `ricochet_bomb.png` - Teal bomb that bounces off surfaces
- `driller_bomb.png` - Brown bomb that drills through blocks

## Adding New Levels

To add more levels to the game:
1. Create a new level folder (e.g., `level6`)
2. Copy the structure and file formats from existing levels
3. Update the level configuration with appropriate values
4. Add unique chibi girl and victory background images
5. Create a detailed block layout configuration
6. Update available bombs to include newly unlocked types 