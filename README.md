# Beauty Ice Breaker

A Phaser-based game where players use a slingshot to launch bombs at ice blocks covering a character silhouette.

## Game Overview

In Beauty Ice Breaker, players aim to reveal the character image hidden behind ice blocks. Using a variety of bombs with different abilities, players strategically break the ice blocks to achieve the target reveal percentage.

## Modular Architecture

The game has been refactored into a modular architecture to improve code organization and maintainability:

### Core Game Components

- **GameScene** - Main game scene handling overall game flow and coordination between modules
- **UIScene** - Manages UI elements and displays

### Utility Modules

- **BlockTypes** - Defines block type constants and properties (standard, strong, eternal, dynamite, bouncy)
  - Centralizes block colors, transparency values, and hit points
  - Provides getter methods for block properties

- **BlockUtils** - Handles visual effects and operations related to ice blocks
  - Block shattering animations
  - Damage effects for different block types
  - Bouncy block hit animations
  - Dynamite explosion effects
  - Shatterer impact effects

- **BombUtils** - Manages bomb behaviors and visual effects
  - Bomb creation with proper physics properties
  - Type-specific explosion effects (blast, piercer, cluster, sticky, shatterer, driller)
  - Specialized bomb handling logic
  - Bomb trail effects and particle systems
  - Resource cleanup to prevent memory leaks

### Additional Components

- **InputHandler** - Manages player input
- **AudioManager** - Handles sound effects and music
- **LevelManager** - Controls level loading and progression
- **VisualEffects** - Generic visual effects used throughout the game

## Bomb Types

The game features several unique bomb types:

- **Blast Bomb** - Standard explosion with radius damage
- **Piercer Bomb** - Creates a line of destruction in its travel direction
- **Cluster Bomb** - Splits into multiple smaller explosions
- **Sticky Bomb** - Sticks to blocks and explodes after a delay
- **Shatterer Bomb** - Powerful blast effective against tough blocks
- **Driller Bomb** - Drills through multiple blocks in sequence

## Block Types

Different ice block types provide varied gameplay challenges:

- **Standard** - Regular ice blocks that break with one hit
- **Strong** - Tougher blocks requiring multiple hits
- **Eternal** - Very durable blocks requiring several hits
- **Dynamite** - Explodes when destroyed, damaging nearby blocks
- **Bouncy** - Reflects bombs instead of breaking

## Game Description

In Beauty Ice Breaker, you use a slingshot to launch "girl bombs" at ice blocks covering a chibi girl image. By destroying the ice blocks, you progressively reveal the hidden image underneath. Your goal is to reveal at least 80% of the image within a limited number of shots.

## How to Play

1. **Setup**: Open `index.html` in a web browser to start the game.
2. **Controls**:
   - Click and drag on the bomb to aim
   - Release to launch the bomb
   - Try to hit and destroy ice blocks covering the image
3. **Objective**: Reveal at least 80% of the hidden chibi girl image using your limited shots.
4. **Win Condition**: Successfully reveal 80% or more of the image before running out of shots.

## Features Implemented in Prototype

- Slingshot physics using Matter.js
- Image revealing mechanic
- Ice block collision and destruction
- Shot counter and reveal percentage tracking
- Win/lose conditions
- Basic UI

## Technical Details

- Built with Phaser 3 game framework
- Uses Matter.js physics for realistic projectile movement
- HTML5 Canvas for rendering

## Development

This is a prototype version of the game. Future enhancements could include:
- Different types of girl bombs with special abilities
- Multiple levels with different chibi girl images
- Progressive difficulty
- Sound effects and background music
- Enhanced graphics and animations

## Credits

Based on the game design document "Beauty Ice Breaker" that combines gameplay elements from:
- Gals Panic (image revealing)
- Angry Birds (slingshot physics)

## Running the Game

This is a single-player offline game that uses HTML5 and Phaser. Due to browser security restrictions (CORS policy), you need to run the game through a local web server instead of opening the HTML file directly.

We've provided several ways to easily run the game without CORS issues:

### Windows Users

1. Double-click the `play_game.bat` file
2. The game should automatically open in your default browser

### Mac/Linux Users

1. Open a terminal in the game directory
2. Run: `chmod +x play_game.sh` (only needed once)
3. Run: `./play_game.sh`
4. The game should automatically open in your default browser

### Manual Options

If the scripts don't work, you can try these alternatives:

#### Using Python (easiest)

1. Open a command prompt/terminal in the game directory
2. Run: `python -m http.server 8000` (or `python3 -m http.server 8000`)
3. Open a browser and go to: http://localhost:8000

#### Using Node.js

1. Open a command prompt/terminal in the game directory
2. Run: `npm install express` (only needed once)
3. Run: `node server.js`
4. Open a browser and go to: http://localhost:3000

#### Using a Local Server

You can also use tools like:
- XAMPP/WAMP/MAMP
- VSCode's Live Server extension
- Any other local web server

## Troubleshooting

If you see CORS errors in the browser console, it means you're trying to open the game directly from a file:// URL. Use one of the methods above to run the game through a proper local server (http:// URL).

## Game Controls

- Click and drag on bombs to aim
- Release to fire
- Select different bomb types from the bottom panel
- Clear at least 80% of the ice to complete each level 