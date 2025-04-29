# Game Design Document: Beauty Ice Breaker

## 1. Game Overview
- **Title**: Beauty Ice Breaker
- **Genre**: Puzzle-Physics
- **Platform**: PC and Mobile (Web-based using HTML5 and [Phaser 3](https://phaser.io/docs))
- **Target Audience**: Casual gamers, fans of cute chibi-style games, and puzzle-physics enthusiasts
- **Game Concept**: In a whimsical frozen world, players use a magical slingshot to launch "cute girl bombs" at ice blocks covering a chibi girl image. By destroying the ice, players reveal the image, aiming to uncover at least 80% within a limited number of shots. The game blends the image-revealing mechanic of "Gals Panic" with the physics-based shooting of "Angry Birds," presented in a charming chibi art style.

## 2. Story Settings
- **Theme**: Players are on a mission to rescue chibi girls trapped under layers of magical ice in a fantastical, frozen realm. Each level features a unique chibi girl who needs to be freed by shattering the ice blocks covering her image.
- **Narrative**: A mysterious frost has encased adorable chibi girls in ice. Using a magical slingshot and "cute girl bombs," players must carefully aim to break the ice and rescue each girl. Upon completing a level, the chibi girl may display a cheerful animation, such as waving or smiling, to thank the player.
- **Tone**: Lighthearted, cute, and family-friendly, emphasizing the adorable chibi aesthetic to appeal to a broad audience.

## 3. Gameplay Mechanics
- **Objective**: Reveal at least 80% of the hidden chibi girl image by destroying ice blocks using a limited number of "cute girl bombs."
- **Core Mechanics**:
  - **Image Revealing**: Inspired by "Gals Panic," players uncover a chibi girl image by destroying ice blocks. As blocks are removed, the image becomes clearer, with progress tracked as a percentage.
  - **Shooting and Physics**: Players use a slingshot to launch "cute girl bombs," with trajectories and collisions governed by Matter.js physics, similar to "Angry Birds." Bombs can bounce, shatter, or trigger special effects upon impact, depending on the block and bomb type.
- **Ice Blocks**:
  - **Appearance**: Frosted, semi-transparent sprites, resembling ice cubes or frosty panels, with distinct visuals for each block type (e.g., crystalline sheen for Eternal Ice, red glow for Dynamite).
  - **Properties**:
    - **Size**: Larger blocks in early levels (40x40 pixels), smaller in advanced levels (20x20 pixels).
    - **Durability**: Varies by block type, with some requiring multiple hits or specific bombs.
    - **Behavior**: Later levels may feature moving (e.g., oscillating paths) or regenerating blocks.
    - **Block Types**:

      | **Block Type**       | **Description**                                                                 | **Strategic Use**                                                                 |
      |----------------------|--------------------------------------------------------------------------------|----------------------------------------------------------------------------------|
      | **Eternal Ice Block**| Requires 3 explosion hits to destroy, or 1 Shatterer Girl heavy explosion hit. | Demands careful use of Shatterer Girl or multiple shots with other bombs.         |
      | **Strong Ice Block** | Requires 2 explosion hits to destroy, or 1 Shatterer Girl heavy explosion hit. | Encourages use of Shatterer Girl for efficiency or multiple weaker shots.         |
      | **Dynamite Block**   | Any explosion hit causes it to explode, destroying itself and nearby ice blocks. | Triggers chain reactions; pair with Blast or Cluster Girl for maximum impact.     |
      | **Bouncy Block**     | Reflects any bomb hit without exploding, applying new force based on incidence angle. | Requires precise aiming to redirect bombs toward other blocks; avoids bomb loss.   |

      - **Implementation Notes**:
        - **Eternal Ice Block**: Tracks hit count (e.g., custom property `hitsLeft: 3`), destroyed only by Shatterer Girl or after three hits.
        - **Strong Ice Block**: Similar to Eternal but with `hitsLeft: 2`.
        - **Dynamite Block**: Triggers an explosion on collision, applying force to nearby blocks using Matter.js impulses.
        - **Bouncy Block**: High restitution (e.g., 1.0) and static physics body to reflect bombs, calculating reflection angle based on incidence.
  - **Physics**: Lower friction (e.g., 0.01) for slipperiness, enhancing challenge, except for Bouncy Blocks.
- **Projectiles ("Cute Girl Bombs")**:
  - **Design**: Chibi girl sprites with bomb elements, such as a girl holding a sparkling bomb or styled as a bomb with chibi features.
  - **Mechanics**: Limited shots per level, with specific bomb types available. Players strategize to maximize block destruction, considering block type interactions.
- **Scoring and Star System**:
  - **Base Score**: 10 points per percentage of image revealed (e.g., 80% = 800 points).
  - **Shot Bonus**: 100 points per unused shot.
  - **Total Score**: Sum of base score and shot bonus per level.
  - **Star System**:
    - **3 Stars**: 100% reveal percentage.
    - **2 Stars**: ≥90% reveal percentage.
    - **1 Star**: ≥80% reveal percentage (minimum to pass).
- **Win/Lose Conditions**:
  - **Win**: Achieve at least 80% reveal percentage to progress.
  - **Lose**: Fail to reach 80%, requiring a retry.
- **Progression**: Completing a level unlocks the next, with increasing difficulty through varied block types, behaviors, and bomb restrictions.

### 3.1. Girl Bomb Attacks
The game includes 10 unique "girl bombs," each offering distinct ways to destroy ice blocks. Players select a bomb type before each shot, with availability limited per level to encourage strategic planning. Below are the bomb types, their effects, and interactions with block types:

| **Bomb Type**       | **Description**                                                                 | **Strategic Use**                                                                 | **Block Interactions**                                                                 |
|---------------------|--------------------------------------------------------------------------------|----------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|
| **Blast Girl**      | Creates a large explosion, destroying all ice blocks within a significant radius. | Ideal for clearing dense clusters of ice blocks quickly.                          | Triggers Dynamite; damages Eternal/Strong (1 hit).                                     |
| **Piercer Girl**    | Penetrates through multiple ice blocks in a straight line, destroying them sequentially. | Perfect for targeting rows or columns of ice blocks aligned in a straight path.   | Triggers Dynamite; damages Eternal/Strong (1 hit); reflected by Bouncy.                |
| **Shrapnel Girl**   | Fragments into smaller projectiles upon impact, each destroying a separate ice block. | Effective for hitting multiple scattered ice blocks with a single shot.           | Triggers Dynamite; damages Eternal/Strong (1 hit per fragment); reflected by Bouncy.   |
| **Ricochet Girl**   | Bounces off surfaces, allowing it to hit ice blocks from various angles.         | Useful for navigating around obstacles or reaching hard-to-hit ice blocks.        | Triggers Dynamite; damages Eternal/Strong (1 hit); reflected by Bouncy with synergy.   |
| **Sticky Girl**     | Adheres to the first ice block it hits and can be detonated manually or after a delay. | Allows precise timing of explosions, maximizing damage in specific areas.         | Sticks to any block; triggers Dynamite; damages Eternal/Strong (1 hit).               |
| **Melter Girl**     | Releases a substance that gradually melts ice blocks over time, even after impact. | Great for dealing with large or reinforced ice blocks requiring sustained damage. | Triggers Dynamite; damages Eternal/Strong (1 hit over time); reflected by Bouncy.      |
| **Shatterer Girl**  | Delivers a powerful impact, capable of breaking even the toughest ice blocks.    | Essential for levels with particularly durable ice blocks.                        | Destroys Eternal/Strong in 1 hit; triggers Dynamite; reflected by Bouncy.              |
| **Cluster Girl**    | Disperses several smaller bombs upon explosion, each targeting nearby ice blocks. | Excellent for covering a wide area with multiple smaller explosions.              | Triggers Dynamite; damages Eternal/Strong (1 hit per mini-bomb); reflected by Bouncy.  |
| **Flying Girl**     | Floats slowly after launch; players control movement with WASD (PC) or joystick (mobile) and shoot rockets at the mouse cursor (or tap target) with left mouse button. Rockets explode on impact. Lasts 15 seconds, then fizzles. | Allows precise targeting of specific blocks or areas, especially Dynamite Blocks. | Rockets trigger Dynamite; damage Eternal/Strong (1 hit per rocket); reflected by Bouncy. |
| **Driller Girl**    | Drills 30 blocks deep upon landing, then remains as a sticky bomb, exploding only when triggered by other explosions. | Sets up chain reactions by positioning in deep ice block clusters.               | Drills through any block; sticks and triggers Dynamite; damages Eternal/Strong (1 hit when exploded); reflected by Bouncy. |

- **Implementation Notes**:
  - **Flying Girl**: Kinematic physics body with player-controlled velocity, rocket spawning, and 15-second timer. Rockets use Matter.js impulses for explosions.
  - **Driller Girl**: Tracks block penetration (up to 30 blocks), becomes kinematic post-drill, and uses collision events for explosion triggers.
  - Bomb types interact with block types via Matter.js collision events, with custom logic for durability (e.g., `hitsLeft`), explosions (Dynamite), and reflection (Bouncy).

## 4. Controls
- **PC**:
  - Click and drag to aim the slingshot; release to shoot.
  - For Flying Girl: WASD to control movement post-launch, left mouse button to shoot rockets.
  - Optional: Press a key (e.g., 1–0) to select bomb type.
- **Mobile**:
  - Touch and drag to aim the slingshot; release to shoot.
  - For Flying Girl: On-screen joystick for movement, tap to shoot rockets at a targeted position.
  - Tap a UI button to select bomb type.
- **Input Handling**: Phaser 3’s input system supports both mouse and touch inputs, with responsive scaling for screen sizes from 320x480 to 1920x1080.

## 5. Art and Sound
- **Art Style**:
  - **Visuals**: Chibi style with vibrant colors, exaggerated proportions (large heads, small bodies), and a cute, whimsical aesthetic.
  - **Background Images**: Unique chibi girl portraits or full-body sprites per level, sourced from royalty-free assets like [itch.io](https://itch.io).
  - **Ice Blocks**:
    - **Eternal Ice Block**: Dark blue, crystalline with a glowing core.
    - **Strong Ice Block**: Lighter blue, slightly cracked appearance.
    - **Dynamite Block**: Red-tinted with a sparking fuse effect.
    - **Bouncy Block**: Shiny, reflective surface with a rubbery texture.
  - **Projectiles**:
    - **Flying Girl**: Chibi girl with wings or jetpack, animated to hover; rockets are small, sparkling projectiles.
    - **Driller Girl**: Chibi girl with a drill accessory, animated to spin while drilling.
    - Other bombs: Chibi girls with bomb elements, animated to spin or sparkle.
  - **Slingshot**: Stylized, cute slingshot with chibi-themed decorations (e.g., ribbons or hearts).
- **Sound**:
  - **Background Music**: Upbeat, cheerful tracks (light pop or kawaii-style).
  - **Sound Effects**:
    - Launch: "Pop" or giggle; whoosh for Flying Girl; whir for Driller Girl.
    - Destruction: Crystalline shatter, deeper for Eternal/Strong.
    - Dynamite: Loud "boom."
    - Bouncy: Springy "boing."
    - Flying Girl rocket: "Pew."
    - Driller Girl: Drilling buzz.
    - Reveal: Soft chime.
    - Win/lose: Cheerful jingle for wins, gentle tone for losses.
    - Star rating: Ascending chimes for 1–3 stars.
- **Asset Sources**: Assets from [CraftPix.net](https://craftpix.net) for chibi girls, [GraphicRiver](https://graphicriver.net) for ice blocks, stored in `/assets/`.

## 6. Levels and Progression
- **Number of Levels**: 30 levels, each with a unique chibi girl image, increasing in difficulty through block types, behaviors, and bomb restrictions.
- **Difficulty Progression**:
  - **Early Levels (1–10)**: Large, mostly stationary blocks (Standard, Strong, some Dynamite); 7–10 shots; introduce Blast, Piercer, Shrapnel, Ricochet, Sticky, Shatterer, Melter.
  - **Mid Levels (11–20)**: Smaller blocks, including Eternal and more Dynamite; some moving blocks; 5–7 shots; add Cluster, Flying.
  - **Late Levels (21–30)**: Small, moving, or regenerating blocks, including Bouncy; 3–5 shots; add Driller.
- **Star System**:
  - **3 Stars**: 100% reveal percentage.
  - **2 Stars**: ≥90% reveal percentage.
  - **1 Star**: ≥80% reveal percentage (minimum to pass).
- **Level Design Overview**:
  - Each level specifies block configuration, bomb availability, and strategic notes.
  - Levels 1–15 are detailed below with sample layouts to guide implementation.
  - Levels 16–30 follow a similar structure, with increasing complexity (e.g., regenerating blocks, tighter bomb limits).

### 6.1. Sample Level Design for Levels 1–15

| **Level** | **Chibi Girl Theme** | **Total Blocks** | **Block Configuration** | **Bomb Availability** | **Layout Description** | **Strategic Notes** |
|-----------|----------------------|------------------|-------------------------|-----------------------|------------------------|---------------------|
| 1         | Schoolgirl           | 50               | 50 Standard             | Blast: 5, Piercer: 3  | Grid of 5x10 Standard blocks centered (x: 200–600, y: 100–500). | Use Blast for clusters (3–4 blocks per shot) to clear efficiently. Save Piercer for stragglers to ensure 3 stars. |
| 2         | Princess             | 50               | 40 Standard, 10 Strong  | Blast: 4, Piercer: 3, Shrapnel: 2 | 5x10 grid with Strong blocks in middle rows (y: 200–300). | Target Strong blocks with two Blast hits or Shrapnel for spread. Use Piercer for edges to hit multiple Standards. |
| 3         | Witch                | 60               | 50 Standard, 10 Strong  | Blast: 3, Piercer: 3, Shrapnel: 3 | 6x10 grid; Strong blocks form a vertical column at x: 400. | Limited Blasts; use Shrapnel to hit Strong blocks twice, Piercer for horizontal rows. Aim for 90%+ by minimizing shots. |
| 4         | Knight               | 60               | 45 Standard, 10 Strong, 5 Dynamite | Blast: 3, Piercer: 2, Shrapnel: 2, Ricochet: 2 | 6x10 grid; Dynamite at corners (x: 200, 600; y: 100, 500), Strong in center. | Place Blast near Dynamite to trigger explosions, clearing nearby blocks. Ricochet for corners to ensure 3 stars. |
| 5         | Mermaid              | 70               | 50 Standard, 15 Strong, 5 Dynamite | Blast: 3, Piercer: 2, Shrapnel: 2, Ricochet: 3 | 7x10 grid; Dynamite in a cross (x: 400, y: 300; corners), Strong in rows (y: 200, 400). | Use Blast on Dynamite for chain reactions. Ricochet to navigate around Strong blocks. Conserve shots for 100%. |
| 6         | Fairy                | 70               | 45 Standard, 15 Strong, 10 Dynamite | Blast: 2, Piercer: 2, Shrapnel: 3, Ricochet: 2 | 7x10 grid; Dynamite clustered at center (x: 350–450, y: 250–350), Strong at edges. | Limited Blasts; place near Dynamite cluster for max impact. Shrapnel for spread, Ricochet for edges. Aim for chain reactions. |
| 7         | Pirate               | 80               | 50 Standard, 20 Strong, 10 Dynamite | Blast: 2, Piercer: 2, Shrapnel: 2, Ricochet: 3, Sticky: 1 | 8x10 grid; Dynamite in two rows (y: 200, 400), Strong in columns (x: 300, 500). | Use Sticky near Dynamite for timed explosion, clearing Strong blocks. Ricochet for angled shots to hit multiple blocks. |
| 8         | Scientist            | 80               | 40 Standard, 20 Strong, 20 Dynamite | Blast: 2, Piercer: 2, Shrapnel: 2, Ricochet: 2, Sticky: 2 | 8x10 grid; Dynamite forms a diamond (x: 300–500, y: 200–400), Strong surrounds it. | Sticky bombs on Dynamite for massive clears. Use Blast sparingly to trigger multiple Dynamites. Shrapnel for outer blocks. |
| 9         | Astronaut            | 90               | 50 Standard, 25 Strong, 10 Dynamite, 5 Eternal | Blast: 2, Piercer: 2, Shrapnel: 2, Ricochet: 2, Sticky: 1, Shatterer: 1 | 9x10 grid; Eternal at center (x: 400, y: 300), Dynamite in corners, Strong in rows (y: 200, 400). | Use Shatterer for Eternal. Sticky on Dynamite for chains. Blast and Shrapnel for Strong blocks to reach 3 stars. |
| 10        | Idol                 | 90               | 45 Standard, 25 Strong, 15 Dynamite, 5 Eternal | Blast: 2, Piercer: 2, Shrapnel: 2, Ricochet: 2, Sticky: 1, Shatterer: 2 | 9x10 grid; Eternal in a cross (x: 400, y: 300), Dynamite scattered, Strong at edges. | Shatterer for Eternal cross. Sticky on Dynamite for efficiency. Ricochet to navigate tight spaces for 100% reveal. |
| 11        | Baker                | 100              | 50 Standard, 30 Strong, 15 Dynamite, 5 Eternal | Blast: 2, Piercer: 2, Shrapnel: 2, Ricochet: 1, Sticky: 1, Shatterer: 2, Melter: 1 | 10x10 grid; Eternal and Strong in center (x: 300–500, y: 200–400), Dynamite at edges. 10 Standard blocks move horizontally (x: 200–600, y: 100). | Melter for Strong/Eternal. Shatterer for Eternal. Sticky on Dynamite for chains. Moving blocks need precise timing. |
| 12        | Dancer               | 100              | 45 Standard, 30 Strong, 15 Dynamite, 10 Eternal | Blast: 2, Piercer: 2, Shrapnel: 1, Ricochet: 1, Sticky: 1, Shatterer: 2, Melter: 2 | 10x10 grid; Eternal in columns (x: 300, 500), Dynamite in rows (y: 200, 400), Strong surrounds. 10 Standard move vertically (y: 100–500). | Melter and Shatterer for Eternal. Sticky on Dynamite. Limited Shrapnel; use for spread damage to hit moving blocks. |
| 13        | Ninja                | 110              | 50 Standard, 35 Strong, 15 Dynamite, 10 Eternal | Blast: 2, Piercer: 1, Shrapnel: 1, Ricochet: 2, Sticky: 1, Shatterer: 2, Melter: 2, Cluster: 1 | 11x10 grid; Eternal and Strong in a checkerboard (x: 300–500, y: 200–400), Dynamite at corners. 15 Standard move (x: 200–600). | Cluster for wide Dynamite triggers. Shatterer/Melter for Eternal. Ricochet for moving blocks to ensure 3 stars. |
| 14        | Gardener             | 110              | 45 Standard, 35 Strong, 20 Dynamite, 10 Eternal | Blast: 2, Piercer: 1, Shrapnel: 1, Ricochet: 2, Sticky: 2, Shatterer: 2, Melter: 1, Cluster: 1 | 11x10 grid; Dynamite in a spiral (x: 300–500, y: 200–400), Eternal/Strong in center. 15 Standard move (y: 100–500). | Cluster and Sticky for Dynamite spiral. Shatterer for Eternal. Ricochet for moving blocks. Conserve bombs for 100%. |
| 15        | Vampire              | 120              | 50 Standard, 40 Strong, 20 Dynamite, 10 Eternal | Blast: 2, Piercer: 1, Shrapnel: 1, Ricochet: 1, Sticky: 2, Shatterer: 2, Melter: 2, Cluster: 1, Flying: 1 | 12x10 grid; Eternal in a ring (x: 350–450, y: 250–350), Dynamite/Strong layered outside, Standard at edges. 20 Standard move (x: 200–600). | Flying Girl to target Dynamite precisely. Cluster/Sticky for chains. Shatterer/Melter for Eternal. Timing critical for moving blocks. |

### 6.2. Level Design Notes
- **Block Behaviors**:
  - **Levels 1–10**: Stationary blocks to teach mechanics.
  - **Levels 11–15**: Introduce moving blocks (10–20% of Standard blocks move at 50 pixels/second, oscillating horizontally or vertically).
- **Bomb Unlock Progression**:
  - Levels 1–3: Blast, Piercer, Shrapnel.
  - Levels 4–5: Add Ricochet.
  - Levels 6–8: Add Sticky.
  - Levels 9–10: Add Shatterer.
  - Levels 11–12: Add Melter.
  - Levels 13–15: Add Cluster, Flying.
- **Tutorial Prompts**:
  - Level 1: “Drag the bomb to aim and shoot. Reach 80% for 1 star, 90% for 2 stars, 100% for 3 stars!”
  - Level 2: “Strong Blocks need 2 hits or Shatterer Girl.”
  - Level 4: “Dynamite Blocks explode with any hit, clearing nearby blocks!”
  - Level 9: “Eternal Blocks need Shatterer Girl or 3 hits.”
  - Level 13: “Cluster Girl spreads mini-bombs for wide damage.”
  - Level 15: “Use WASD to move Flying Girl and shoot rockets for precision.”
- **Strategic Design**:
  - Early levels (1–5) focus on learning bomb mechanics and Dynamite chains.
  - Mid levels (6–10) introduce Sticky and Shatterer for Eternal blocks, requiring precise bomb placement.
  - Levels 11–15 add moving blocks, Melter, Cluster, and Flying Girl, increasing puzzle complexity with dynamic targets and chain reactions.

## 7. Controls
- **PC**:
  - Click and drag to aim the slingshot; release to shoot.
  - For Flying Girl: WASD to control movement, left mouse button to shoot rockets.
  - Press keys (e.g., 1–0) to select bomb type.
- **Mobile**:
  - Touch and drag to aim the slingshot; release to shoot.
  - For Flying Girl: On-screen joystick for movement, tap to shoot rockets.
  - Tap UI button to select bomb type.
- **Input Handling**: Phaser 3’s input system supports mouse and touch inputs, scaling for 320x480 to 1920x1080.

## 8. User Interface
- **HUD**:
  - **Shots Remaining**: Top-left, e.g., “Shots: 5”
  - **Reveal Percentage**: Top-right, e.g., “Revealed: 80%,” with progress bar
  - **Slingshot**: Bottom-left, with red aiming line
  - **Bomb Selection**: UI buttons/keys with counts (e.g., “Blast: 2”)
  - **Flying Girl Controls**: WASD indicators (PC) or joystick (mobile)
  - **Star Rating**: Post-level display with 1–3 stars
- **Main Menu**:
  - Buttons: Start Game, Options, Credits
  - Background: Static chibi girl image or subtle animation
- **Level Completion**:
  - Text: “Level Complete!” (green) or “Try Again!” (red)
  - Score: Base score + bonus
  - Star rating: 1–3 stars with percentage
  - Buttons: Next Level or Retry

## 9. Replayability
- **Fixed Levels**: Set block layouts and bomb limits for consistency.
- **Star System**: Encourages replay for 3 stars (100% reveal) by optimizing bomb usage.
- **Enhancements**: Future updates could randomize block placement or add challenge modes.
- **Scoring Incentive**: High scores motivate bomb combination experiments.

## 10. Development Considerations
- **Asset Creation**: Use royalty-free assets from [itch.io](https://itch.io) or [CraftPix.net](https://craftpix.net). [GIMP](https://www.gimp.org) for placeholders. Distinct visuals for Flying Girl (wings/jetpack), Driller Girl (drill), and block types.
- **Testing**: Test on multiple devices (iPhone, Android, PC) for input and scaling, especially Flying Girl’s controls and moving block interactions.
- **Optimization**: Compress PNGs for faster mobile loading.
- **Physics Adjustments**: Tune block properties (friction, restitution) and bomb interactions, particularly for Flying Girl’s rockets and Bouncy Block reflections.
- **Optional Enhancements**: Add shattering animations, rocket trails, or star-earning effects using Phaser’s particle system.