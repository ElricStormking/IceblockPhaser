# Game Design Document: Beauty Ice Breaker

## 1. Game Overview
- **Title**: Beauty Ice Breaker
- **Genre**: Puzzle-Physics
- **Platform**: PC and Mobile (Web-based using HTML5 and [Phaser 3](https://phaser.io/))
- **Target Audience**: Casual gamers, fans of cute chibi-style games, and puzzle-physics enthusiasts
- **Game Concept**: In a whimsical frozen world, players use a magical slingshot to launch "cute girl bombs" at ice blocks covering a chibi girl image. By destroying the ice, players reveal the image, aiming to uncover at least 80% within a limited number of shots. The game blends the image-revealing mechanic of "Gals Panic" with the physics-based shooting of "Angry Birds," presented in a charming chibi art style.

## 2. Story Settings
- **Theme**: Players rescue 10 unique chibi girls trapped under magical ice in a fantastical, frozen realm. Each of the 30 levels features one of three unique frozen images for one of these chibi girls, who are also represented by the 10 "cute girl bomb" types used to free them.
- **Narrative**: A mysterious frost has encased 10 adorable chibi girls in ice, each frozen in three distinct poses or scenes (30 images total). Using a magical slingshot and "cute girl bombs" (each embodying one of the chibi girls), players shatter the ice to rescue them. Completing a level reveals the chibi girl’s image, adding it to a gallery system. Achieving 2 stars or higher on levels introducing a new chibi girl (Levels 1, 4, 7, ..., 28) unlocks her bomb type, symbolizing her joining the player’s arsenal to rescue others. Upon level completion, the chibi girl may display a cheerful animation (e.g., waving, smiling) to thank the player.
- **Tone**: Lighthearted, cute, and family-friendly, emphasizing the adorable chibi aesthetic.

## 3. Gameplay Mechanics
- **Objective**: Reveal at least 80% of the hidden chibi girl image by destroying ice blocks using limited "cute girl bombs."
- **Core Mechanics**:
  - **Image Revealing**: Inspired by "Gals Panic," players uncover a chibi girl image by destroying ice blocks, with progress tracked as a percentage. Each level’s image is added to a gallery system upon completion.
  - **Shooting and Physics**: Players use a slingshot to launch bombs, with trajectories and collisions governed by Matter.js physics, similar to "Angry Birds." Bombs trigger varied effects based on block and bomb types. All blocks are stationary to focus on strategic placement.
  - **Bomb Unlock System**: The 10 bomb types correspond to the 10 chibi girls. Achieving ≥90% reveal (2 stars or higher) on levels introducing a new chibi girl (1, 4, 7, ..., 28) unlocks her bomb type for use in subsequent levels.
  - **Congratulatory Voice Messages**: When a single girl bomb shot reveals ≥30% of the image, a random congratulatory message (e.g., "Fantastic!", "Great Aim!", "Marvelous!", "Superb!") is played in a cute, girl-like voice, accompanied by on-screen text. This rewards skillful shots, enhancing player engagement.
- **Ice Blocks**:
  - **Appearance**: Frosted, semi-transparent sprites (ice cubes or panels) with distinct visuals (e.g., crystalline sheen for Eternal, red glow for Dynamite).
  - **Properties**:
    - **Size**: Larger blocks in early levels (40x40 pixels), smaller in advanced levels (20x20 pixels).
    - **Durability**: Varies by block type, requiring multiple hits or specific bombs.
    - **Behavior**: All blocks are stationary, emphasizing strategic bomb placement over timing.
    - **Block Types**:

      | **Block Type**       | **Description**                                                                 | **Strategic Use**                                                                 |
      |----------------------|--------------------------------------------------------------------------------|----------------------------------------------------------------------------------|
      | **Standard Ice Block**| Destroyed with 1 hit.                                                          | Basic blocks, easy to clear with any bomb.                                       |
      | **Strong Ice Block** | Requires 2 explosion hits to destroy, or 1 Shatterer Girl heavy explosion hit. | Use Shatterer Girl for efficiency or multiple weaker shots.                       |
      | **Eternal Ice Block**| Requires 3 explosion hits to destroy, or 1 Shatterer Girl heavy explosion hit. | Use Shatterer Girl or multiple shots strategically.                              |
      | **Dynamite Block**   | Any explosion hit causes it to explode, destroying itself and nearby blocks.    | Pair with Blast, Cluster, or precise shots for chain reactions.                   |

      - **Implementation Notes**:
        - **Eternal Ice Block**: Custom property `hitsLeft: 3`, destroyed by Shatterer Girl or three hits.
        - **Strong Ice Block**: `hitsLeft: 2`, similar mechanics.
        - **Dynamite Block**: Triggers explosion on collision, applying Matter.js impulses to nearby blocks.
  - **Physics**: Low friction (0.01) for slipperiness, ensuring smooth bomb interactions.
- **Projectiles ("Cute Girl Bombs")**:
  - **Design**: Chibi girl sprites with bomb elements (e.g., holding sparkling bombs), each representing one of the 10 frozen chibi girls being rescued.
  - **Mechanics**: Limited shots per level, with specific bomb types available based on unlocks. Players strategize to maximize block destruction, setting up Sticky and Driller bombs for triggered explosions.
- **Scoring and Star System**:
  - **Base Score**: 10 points per percentage of image revealed (e.g., 80% = 800 points).
  - **Shot Bonus**: 100 points per unused shot.
  - **Total Score**: Base score + shot bonus.
  - **Star System**:
    - **3 Stars**: 100% reveal percentage.
    - **2 Stars**: ≥90% reveal percentage.
    - **1 Star**: ≥80% reveal percentage (minimum to pass).
- **Win/Lose Conditions**:
  - **Win**: Achieve ≥80% reveal to progress, unlocking the level’s chibi girl image in the gallery.
  - **Lose**: Fail to reach 80%, requiring retry.
- **Progression**: Completing a level unlocks the next. Achieving ≥90% reveal on levels introducing a new chibi girl (1, 4, 7, ..., 28) unlocks her bomb type.
- **Gallery System**: A menu section where players view unlocked chibi girl images (30 total, one per level). Accessible from the main menu, with thumbnails or full views, showcasing each chibi girl’s three unique poses/scenes.

### 3.1. Girl Bomb Attacks
The 10 "girl bombs" represent the 10 frozen chibi girls. Each bomb type is unlocked by achieving 2 stars or higher on the first level featuring that chibi girl (Levels 1, 4, 7, ..., 28). Below are the bomb types, effects, and block interactions:

| **Bomb Type**       | **Chibi Girl** | **Description**                                                                 | **Strategic Use**                                                                 | **Block Interactions**                                                                 |
|---------------------|----------------|--------------------------------------------------------------------------------|----------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|
| **Blast Girl**      | Schoolgirl     | Large explosion, destroys blocks within a significant radius.                   | Clear dense clusters quickly.                                                    | Triggers Dynamite; damages Eternal/Strong (1 hit).                                     |
| **Shrapnel Girl**   | Witch          | Fragments into smaller projectiles, each destroying a separate block.           | Hit multiple scattered blocks.                                                   | Triggers Dynamite; damages Eternal/Strong (1 hit per fragment).                        |
| **Sticky Girl**     | Pirate         | Adheres to first block hit, detonated manually or after delay.                  | Time explosions for maximum damage, set up before triggering with another bomb.   | Sticks to any block; triggers Dynamite; damages Eternal/Strong (1 hit).               |
| **Piercer Girl**    | Knight         | Penetrates multiple blocks in a straight line, destroying sequentially.         | Target rows or columns, especially Dynamite blocks.                              | Triggers Dynamite; damages Eternal/Strong (1 hit).                                     |
| **Ricochet Girl**   | Mermaid        | Bounces off surfaces, hitting blocks from various angles.                       | Navigate obstacles (Strong/Eternal) to reach hidden blocks.                       | Triggers Dynamite; damages Eternal/Strong (1 hit).                                     |
| **Shatterer Girl**  | Astronaut      | Powerful impact, breaks toughest blocks.                                        | Essential for Eternal/Strong blocks behind obstacles.                            | Destroys Eternal/Strong in 1 hit; triggers Dynamite.                                   |
| **Cluster Girl**    | Ninja          | Disperses smaller bombs upon explosion, targeting nearby blocks.                | Cover wide areas, trigger Dynamite for chains.                                   | Triggers Dynamite; damages Eternal/Strong (1 hit per mini-bomb).                       |
| **Melter Girl**     | Baker          | Releases substance that melts blocks over time, even after impact.              | Deal with large or reinforced blocks (Eternal) behind obstacles.                 | Triggers Dynamite; damages Eternal/Strong (1 hit over time).                           |
| **Driller Girl**    | Sorceress      | Drills 30 blocks deep, remains as sticky bomb, explodes when triggered by other explosions. | Set up chain reactions in deep clusters, especially behind Eternal blocks.       | Drills through any block; sticks, triggers Dynamite; damages Eternal/Strong (1 hit when exploded). |
| **Flying Girl**     | Vampire        | Floats slowly; players control with WASD (PC) or joystick (mobile), shoot rockets at cursor (or tap target). Rockets explode on impact. Lasts 15 seconds, then fizzles. | Precise targeting, especially Dynamite. Not used in level designs per requirements. | Rockets trigger Dynamite; damage Eternal/Strong (1 hit per rocket).                    |

- **Implementation Notes**:
  - **Sticky Girl**: Sticks to blocks, detonates via player input (e.g., key press) or after 5-second delay. Explosion triggers nearby Dynamite or Driller bombs.
  - **Driller Girl**: Tracks penetration (30 blocks), becomes kinematic, explodes via collision events (e.g., Blast, Cluster). Synergizes with Sticky for chain reactions.
  - Bombs interact with blocks via Matter.js, with logic for durability, explosions, and reflection.
  - Bomb unlocks are tracked (e.g., player data flag `unlockedBombs`), enabling selection in UI only after achieving ≥90% on Levels 1, 4, 7, ..., 28.
  - **Congratulatory Messages**: Track reveal percentage per shot (e.g., `revealDelta` in game state). If ≥30%, trigger a random voice clip from `/assets/audio/voice/` and display text via Phaser 3 text object (fade out after 2 seconds). Common with Blast, Cluster, or Sticky-triggered chains.

## 4. Controls
- **PC**:
  - Click and drag to aim slingshot; release to shoot.
  - Sticky Girl: Press spacebar to detonate stuck bombs.
  - Keys (1–0) for bomb type.
- **Mobile**:
  - Touch and drag to aim slingshot; release to shoot.
  - Sticky Girl: Tap on-screen button to detonate stuck bombs.
  - Tap UI for bomb type.
- **Input Handling**: Phaser 3 supports mouse/touch, scaling for 320x480 to 1920x1080.

## 5. Art and Sound
- **Art Style**:
  - **Visuals**: Chibi style with vibrant colors, exaggerated proportions.
  - **Background Images**: 30 unique chibi girl images (3 per girl: Schoolgirl, Knight, Witch, Mermaid, Pirate, Baker, Astronaut, Ninja, Vampire, Sorceress), sourced from [itch.io](https://itch.io/game-assets/tag-chibi).
  - **Ice Blocks**:
    - **Eternal**: Dark blue, crystalline, glowing core.
    - **Strong**: Light blue, cracked appearance.
    - **Dynamite**: Red-tinted, sparking fuse.
  - **Projectiles**:
    - **Driller Girl**: Chibi (Sorceress) with drill, spinning animation.
    - Others: Chibi girls with bomb elements, themed to their character (e.g., Schoolgirl with a book-shaped bomb for Blast).
  - **Slingshot**: Cute, with chibi decorations (e.g., ribbons).
  - **Congratulatory Messages**: On-screen text in a cute, bold font (e.g., Comic Sans or similar), with slight glow effect, centered above the play area, fading out after 2 seconds.
- **Sound**:
  - **Background Music**: Upbeat, light pop or kawaii-style.
  - **Sound Effects**:
    - Launch: "Pop"/giggle; whir (Driller).
    - Destruction: Crystalline shatter, deeper for Eternal/Strong.
    - Dynamite: "Boom."
    - Driller: Drilling buzz.
    - Reveal: Soft chime.
    - Win/lose: Cheerful jingle (win), gentle tone (lose).
    - Star rating: Ascending chimes for 1–3 stars.
    - Bomb unlock: Triumphant fanfare.
    - **Congratulatory Voice Messages**: Cute, girl-like voice clips (e.g., "Fantastic!", "Great Aim!", "Marvelous!", "Superb!", "Amazing!", "Wonderful!", "Nice Shot!", "Incredible!"). Stored in `/assets/audio/voice/`, randomly selected when a shot reveals ≥30%.
  - **Asset Sources**: [CraftPix.net](https://craftpix.net/) for chibi girls, [GraphicRiver](https://graphicriver.net/) for blocks, [Freesound.org](https://freesound.org/) or [Zapsplat.com](https://www.zapsplat.com/) for voice clips, stored in `/assets/`.
  - **Implementation Notes**:
    - Voice clips are short (1–2 seconds), high-pitched, and cheerful to match the chibi aesthetic.
    - Use Phaser 3’s audio system to play clips (`this.sound.play('voice_fantastic')`) with volume balanced against background music (e.g., voice at 0.8, music at 0.5).
    - Ensure mobile compatibility by preloading audio assets and supporting common formats (e.g., MP3, OGG).

## 6. Levels and Progression
- **Number of Levels**: 30, each featuring one of three unique images for one of 10 chibi girls, increasing difficulty via block types, layouts, and bomb restrictions.
- **Chibi Girl and Bomb Mapping**:
  - Each chibi girl has 3 levels (images), with her bomb type unlocked after achieving ≥90% reveal on her first level:
    - **Schoolgirl (Blast Girl)**: Levels 1–3 (unlock after Level 1).
    - **Witch (Shrapnel Girl)**: Levels 4–6 (unlock after Level 4).
    - **Pirate (Sticky Girl)**: Levels 7–9 (unlock after Level 7).
    - **Knight (Piercer Girl)**: Levels 10–12 (unlock after Level 10).
    - **Mermaid (Ricochet Girl)**: Levels 13–15 (unlock after Level 13).
    - **Astronaut (Shatterer Girl)**: Levels 16–18 (unlock after Level 16).
    - **Ninja (Cluster Girl)**: Levels 19–21 (unlock after Level 19).
    - **Baker (Melter Girl)**: Levels 22–24 (unlock after Level 22).
    - **Sorceress (Driller Girl)**: Levels 25–27 (unlock after Level 25).
    - **Vampire (Flying Girl)**: Levels 28–30 (unlock after Level 28, not used in level designs per requirements).
- **Difficulty Progression**:
  - **Levels 1–10**: Large, stationary blocks (Standard, Strong, Dynamite); 7–10 shots; use Blast, Shrapnel, Sticky to destroy large clusters and learn Sticky bomb setups.
  - **Levels 11–20**: Smaller blocks, add Eternal and more Dynamite; 5–7 shots; add Piercer, Ricochet, Shatterer, Cluster to target Dynamite accurately and navigate obstacles (Strong, Eternal).
  - **Levels 21–30**: Small blocks, more Eternal and Dynamite; 3–5 shots; add Melter, Driller to set up Sticky/Driller bombs for triggered explosions and clear large areas behind obstacles (Eternal).
- **Star System**:
  - **3 Stars**: 100% reveal.
  - **2 Stars**: ≥90% reveal.
  - **1 Star**: ≥80% reveal (minimum to pass).
- **Level Design**: Each level specifies block configuration, bomb availability (based on unlocks), layout, and strategic notes for 3 stars. Bomb types are restricted until unlocked, focusing on cluster destruction (1–10), Dynamite accuracy and Ricochet (11–20), and Sticky/Driller setups for Eternal blocks (21–30). Congratulatory messages trigger for high-impact shots (≥30% reveal).

# 6.1. Detailed Level Design for Levels 1–30

Below is the detailed level design for all 30 levels of "Beauty Ice Breaker," ensuring each level provides a unique challenge while adhering to the game’s mechanics, bomb types, and block configurations. The designs are structured to progressively increase in difficulty, focusing on strategic bomb placement and block interactions without moving blocks. Each level specifies the chibi girl theme, bomb type unlocked (if applicable), total blocks, block configuration, available bombs, layout description, and strategic notes for achieving high reveal percentages and unlocking bomb types.

| **Level** | **Chibi Girl** | **Bomb Type** | **Total Blocks** | **Block Configuration** | **Bombs Available** | **Layout Description** | **Strategic Notes** |
|-----------|----------------|---------------|------------------|-------------------------|---------------------|------------------------|---------------------|
| **1**     | Schoolgirl     | Blast Girl (unlock after ≥90% reveal) | 50               | Standard: 50            | Blast: 5, Shrapnel: 3 | 5x10 grid centered (x: 200–600, y: 100–500), rectangular block cluster. | Use Blast for large clusters (3–4 blocks/shot, aim for ≥30% reveal for "Fantastic!"). Shrapnel for scattered Standards. Achieve ≥90% to unlock Blast Girl. |
| **2**     | Schoolgirl     | Blast Girl    | 50               | Standard: 40, Strong: 10 | Blast: 4, Shrapnel: 3 | 5x10 grid; Strong in middle rows (y: 200–300), forming a horizontal band. | Blast Strong blocks (2 hits) for clusters. Shrapnel for Standards around Strong. Aim for ≥30% reveal per Blast for "Great Aim!". |
| **3**     | Schoolgirl     | Blast Girl    | 60               | Standard: 50, Strong: 10 | Blast: 3, Shrapnel: 3, Sticky: 2 | 6x10 grid; Strong in vertical column (x: 400), Standard surrounding, forming a cross shape. | Place Sticky near Strong column, trigger with Blast for chain clears (≥30% reveal for "Marvelous!"). Shrapnel for edges. |
| **4**     | Witch          | Shrapnel Girl (unlock after ≥90% reveal) | 60               | Standard: 45, Strong: 10, Dynamite: 5 | Blast: 3, Shrapnel: 3, Sticky: 2 | 6x10 grid; Dynamite at four corners (x: 200, 600; y: 100, 500), Strong in center square (x: 350–450, y: 250–350). | Sticky on Dynamite, trigger with Shrapnel for explosions (≥30% reveal for "Superb!"). Blast for Strong cluster. Achieve ≥90% to unlock Shrapnel Girl. |
| **5**     | Witch          | Shrapnel Girl | 70               | Standard: 50, Strong: 15, Dynamite: 5 | Blast: 3, Shrapnel: 2, Sticky: 2 | 7x10 grid; Dynamite in cross pattern (x: 400, y: 300; corners), Strong in two rows (y: 200, 400). | Sticky on Dynamite cross, trigger with Blast for chains (≥30% reveal for "Amazing!"). Shrapnel for Strong. Conserve shots for 100%. |
| **6**     | Witch          | Shrapnel Girl | 70               | Standard: 45, Strong: 15, Dynamite: 10 | Blast: 3, Shrapnel: 2, Sticky: 3 | 7x10 grid; Dynamite clustered in center (x: 350–450, y: 250–350), Strong at edges forming a frame. | Place multiple Sticky on Dynamite cluster, trigger with Shrapnel for large clears (≥30% reveal for "Wonderful!"). Blast for Strong edges. |
| **7**     | Pirate         | Sticky Girl (unlock after ≥90% reveal) | 80               | Standard: 50, Strong: 20, Dynamite: 10 | Blast: 2, Shrapnel: 2, Sticky: 3 | 8x10 grid; Dynamite in two horizontal rows (y: 200, 400), Strong in two vertical columns (x: 300, 500). | Place multiple Sticky near Dynamite rows, trigger with Blast for massive clears (≥30% reveal for "Nice Shot!"). Shrapnel for Standards. Achieve ≥90% to unlock Sticky Girl. |
| **8**     | Pirate         | Sticky Girl   | 80               | Standard: 40, Strong: 20, Dynamite: 20 | Blast: 2, Shrapnel: 2, Sticky: 4 | 8x10 grid; Dynamite in diamond shape (x: 300–500, y: 200–400), Strong surrounding in a square. | Sticky on multiple Dynamite, trigger with Shrapnel for chain reactions (≥30% reveal for "Incredible!"). Blast for Strong. |
| **9**     | Pirate         | Sticky Girl   | 90               | Standard: 50, Strong: 25, Dynamite: 15 | Blast: 2, Shrapnel: 2, Sticky: 4 | 9x10 grid; Dynamite scattered (x: 300–500, y: 200–400), Strong in three rows (y: 200, 300, 400). | Sticky on Dynamite, trigger with Blast for chains (≥30% reveal for "Fantastic!"). Shrapnel for Strong rows. |
| **10**    | Knight         | Piercer Girl (unlock after ≥90% reveal) | 90               | Standard: 45, Strong: 25, Dynamite: 20 | Blast: 2, Shrapnel: 2, Sticky: 3 | 9x10 grid; Dynamite scattered (x: 300–500, y: 200–400), Strong in cross shape (x: 400, y: 300). | Sticky on Dynamite, trigger with Blast for chains (≥30% reveal for "Great Aim!"). Shrapnel for tight spaces. Achieve ≥90% to unlock Piercer Girl. |
| **11**    | Knight         | Piercer Girl  | 100              | Standard: 50, Strong: 30, Dynamite: 15, Eternal: 5 | Blast: 2, Shrapnel: 2, Sticky: 2, Piercer: 2 | 10x10 grid; Eternal/Strong in center square (x: 300–500, y: 200–400), Dynamite at edges (x: 200, 600). | Piercer through Dynamite for chains (≥30% reveal for "Marvelous!"). Sticky on Dynamite, trigger with Blast. Shrapnel for Standards. |
| **12**    | Knight         | Piercer Girl  | 100              | Standard: 45, Strong: 30, Dynamite: 15, Eternal: 10 | Blast: 2, Shrapnel: 1, Sticky: 2, Piercer: 3 | 10x10 grid; Eternal in two columns (x: 300, 500), Dynamite in two rows (y: 200, 400), Strong filling gaps. | Piercer for Dynamite rows to trigger chains (≥30% reveal for "Superb!"). Sticky on Dynamite, trigger with Blast. Shrapnel for Eternal (3 hits). |
| **13**    | Mermaid        | Ricochet Girl (unlock after ≥90% reveal) | 110              | Standard: 50, Strong: 35, Dynamite: 15, Eternal: 10 | Blast: 2, Shrapnel: 1, Sticky: 2, Piercer: 2, Ricochet: 2 | 11x10 grid; Eternal/Strong in checkerboard pattern (x: 300–500, y: 200–400), Dynamite at four corners. | Ricochet to hit Dynamite behind Strong/Eternal for chains (≥30% reveal for "Amazing!"). Sticky on Dynamite, trigger with Piercer. Achieve ≥90% to unlock Ricochet Girl. |
| **14**    | Mermaid        | Ricochet Girl | 110              | Standard: 45, Strong: 35, Dynamite: 20, Eternal: 10 | Blast: 2, Shrapnel: 1, Sticky: 2, Piercer: 2, Ricochet: 3 | 11x10 grid; Dynamite in spiral pattern (x: 300–500, y: 200–400), Eternal/Strong in center square. | Ricochet for Dynamite behind Eternal for chains (≥30% reveal for "Wonderful!"). Sticky on Dynamite, trigger with Blast. Piercer for rows. |
| **15**    | Mermaid        | Ricochet Girl | 120              | Standard: 50, Strong: 40, Dynamite: 20, Eternal: 10 | Blast: 2, Shrapnel: 1, Sticky: 2, Piercer: 2, Ricochet: 3, Shatterer: 1 | 12x10 grid; Eternal in ring (x: 350–450, y: 250–350), Dynamite/Strong layered outside, Standard at edges. | Shatterer for Eternal ring. Ricochet for Dynamite behind Strong for chains (≥30% reveal for "Nice Shot!"). Sticky on Dynamite, trigger with Piercer. |
| **16**    | Astronaut      | Shatterer Girl (unlock after ≥90% reveal) | 120              | Standard: 50, Strong: 40, Eternal: 20, Dynamite: 10 | Blast: 2, Shrapnel: 2, Sticky: 2, Piercer: 2, Ricochet: 2, Shatterer: 1 | 12x10 grid. Eternal blocks form a 4x4 square in the center (x: 350–450, y: 250–350). Strong blocks surround the Eternal square, creating a 6x6 area (x: 300–500, y: 200–400). Dynamite blocks are at the four corners (x: 200, 600; y: 100, 500). Standard blocks fill the remaining spaces. | Use Shatterer Girl to break through the Eternal center efficiently. Place Sticky bombs on Dynamite at the corners and trigger with Blast for chain reactions (≥30% reveal for "Fantastic!"). Use Ricochet to hit blocks behind Strong obstacles. Achieve ≥90% to unlock Shatterer Girl. |
| **17**    | Astronaut      | Shatterer Girl | 130              | Standard: 45, Strong: 45, Eternal: 25, Dynamite: 15 | Blast: 2, Shrapnel: 1, Sticky: 2, Piercer: 1, Ricochet: 2, Shatterer: 2 | 13x10 grid. Eternal blocks form a cross (x: 400, y: 300; extending to x: 300–500, y: 200–400). Strong blocks are in rows above and below the cross (y: 100, 500). Dynamite blocks are scattered near the cross, forming a loose ring. Standard blocks fill the remaining spaces. | Use Shatterer Girl to clear the Eternal cross. Place Sticky bombs on Dynamite and trigger with Piercer for precise chain reactions (≥30% reveal for "Great Aim!"). Use Ricochet to hit Dynamite behind Strong blocks. Conserve Shatterer for Eternal blocks to ensure 3 stars. |
| **18**    | Astronaut      | Shatterer Girl | 130              | Standard: 40, Strong: 50, Eternal: 30, Dynamite: 10 | Blast: 2, Shrapnel: 1, Sticky: 2, Piercer: 1, Ricochet: 2, Shatterer: 2 | 13x10 grid. Eternal blocks form a diamond (x: 300–500, y: 200–400). Strong blocks create a frame around the diamond (x: 250–550, y: 150–450). Dynamite blocks are at the grid’s corners and midpoints (x: 200, 600; y: 100, 500). Standard blocks are sparse in outer areas. | Use Shatterer Girl to break the Eternal diamond. Place Sticky bombs on Dynamite at the edges and trigger with Blast for maximum clears (≥30% reveal for "Marvelous!"). Use Ricochet to navigate around the Strong frame. Prioritize Shatterer for Eternal to achieve 100% reveal. |
| **19**    | Ninja          | Cluster Girl (unlock after ≥90% reveal) | 140              | Standard: 50, Strong: 50, Eternal: 20, Dynamite: 20 | Blast: 2, Shrapnel: 1, Sticky: 2, Piercer: 1, Ricochet: 1, Shatterer: 2, Cluster: 1 | 14x10 grid. Dynamite blocks form a spiral from the center (x: 400, y: 300) outward. Eternal blocks are interspersed within the spiral, creating a layered pattern. Strong blocks are in outer rows and columns (x: 200, 600; y: 100, 500). Standard blocks fill remaining spaces. | Use Cluster Girl to cover the Dynamite spiral for massive chain reactions (≥30% reveal for "Superb!"). Use Shatterer Girl for Eternal blocks within the spiral. Place Sticky bombs on key Dynamite positions and trigger with Blast. Achieve ≥90% to unlock Cluster Girl. |
| **20**    | Ninja          | Cluster Girl | 140              | Standard: 45, Strong: 45, Eternal: 25, Dynamite: 25 | Blast: 2, Shrapnel: 1, Sticky: 2, Piercer: 1, Ricochet: 1, Shatterer: 2, Cluster: 2 | 14x10 grid. Dynamite and Eternal blocks form a checkerboard pattern (x: 300–500, y: 200–400). Strong blocks are in rows above and below (y: 100, 500). Standard blocks are in outer areas. | Use Cluster Girl to hit multiple Dynamite blocks for chain reactions (≥30% reveal for "Amazing!"). Use Shatterer Girl for Eternal blocks in the checkerboard. Place Sticky bombs on Dynamite and trigger with Piercer for precise timing. Conserve Cluster for maximum impact. |
| **21**    | Ninja          | Cluster Girl | 150              | Standard: 40, Strong: 50, Eternal: 30, Dynamite: 30 | Blast: 2, Shrapnel: 1, Sticky: 2, Piercer: 1, Ricochet: 1, Shatterer: 2, Cluster: 2 | 15x10 grid. Dynamite blocks form a dense central cluster (x: 350–450, y: 250–350). Eternal blocks surround the cluster, forming a protective layer. Strong blocks are in outer rows and columns. Standard blocks are sparse. | Use Cluster Girl to clear the central Dynamite cluster for massive reveals (≥30% reveal for "Wonderful!"). Use Shatterer Girl to break through the Eternal layer first. Place Sticky bombs on outer Dynamite and trigger with Blast. Prioritize Cluster for chain reactions. |
| **22**    | Baker          | Melter Girl (unlock after ≥90% reveal) | 150              | Standard: 50, Strong: 50, Eternal: 30, Dynamite: 20 | Blast: 2, Shrapnel: 1, Sticky: 2, Piercer: 1, Ricochet: 1, Shatterer: 2, Cluster: 1, Melter: 1 | 15x10 grid. Eternal blocks form a large square (x: 300–500, y: 200–400). Strong blocks are inside, forming a smaller square (x: 350–450, y: 250–350). Dynamite blocks are at the corners of the large square. Standard blocks are outside the square. | Use Melter Girl to slowly damage the Eternal square over time (≥30% reveal for "Nice Shot!"). Use Shatterer Girl for quicker destruction if needed. Place Sticky bombs on Dynamite at the corners and trigger with Cluster for chain reactions. Achieve ≥90% to unlock Melter Girl. |
| **23**    | Baker          | Melter Girl | 160              | Standard: 45, Strong: 55, Eternal: 35, Dynamite: 25 | Blast: 2, Shrapnel: 1, Sticky: 2, Piercer: 1, Ricochet: 1, Shatterer: 2, Cluster: 1, Melter: 2 | 16x10 grid. Eternal blocks form a checkerboard pattern (x: 300–500, y: 200–400). Strong blocks are in rows above and below (y: 100, 500). Dynamite blocks are scattered near the checkerboard. Standard blocks are in outer areas. | Use Melter Girl to damage the Eternal checkerboard over time (≥30% reveal for "Incredible!"). Use Shatterer Girl for faster destruction if needed. Place Sticky bombs on Dynamite and trigger with Blast. Use Cluster for wide-area clears. |
| **24**    | Baker          | Melter Girl | 160              | Standard: 40, Strong: 60, Eternal: 40, Dynamite: 20 | Blast: 2, Shrapnel: 1, Sticky: 2, Piercer: 1, Ricochet: 1, Shatterer: 2, Cluster: 1, Melter: 2 | 16x10 grid. Eternal blocks form a thick wall in the center (x: 350–450, y: 200–400). Strong blocks are on both sides of the wall. Dynamite blocks are at the grid’s corners. Standard blocks are in outer areas. | Use Melter Girl to slowly break through the Eternal wall (≥30% reveal for "Fantastic!"). Use Shatterer Girl for quicker penetration if needed. Place Sticky bombs on Dynamite at the corners and trigger with Blast. Use Cluster to clear areas behind the wall. |
| **25**    | Sorceress      | Driller Girl (unlock after ≥90% reveal) | 170              | Standard: 50, Strong: 60, Eternal: 40, Dynamite: 20 | Blast: 2, Shrapnel: 1, Sticky: 2, Piercer: 1, Ricochet: 1, Shatterer: 2, Cluster: 1, Melter: 2, Driller: 1 | 17x10 grid. Eternal blocks form a large rectangle in the center (x: 300–500, y: 200–400). Strong blocks are inside the rectangle. Dynamite blocks are at the grid’s corners. Standard blocks are outside the rectangle. | Use Driller Girl to penetrate the Eternal rectangle and set up chain reactions (≥30% reveal for "Great Aim!"). Use Melter Girl to damage the Eternal blocks over time. Place Sticky bombs on Dynamite and trigger with Blast. Achieve ≥90% to unlock Driller Girl. |
| **26**    | Sorceress      | Driller Girl | 170              | Standard: 45, Strong: 55, Eternal: 45, Dynamite: 25 | Blast: 2, Shrapnel: 1, Sticky: 2, Piercer: 1, Ricochet: 1, Shatterer: 2, Cluster: 1, Melter: 2, Driller: 2 | 17x10 grid. Eternal blocks form a spiral from the center outward (x: 400, y: 300). Strong blocks are interspersed within the spiral. Dynamite blocks are at the grid’s corners and midpoints. Standard blocks are sparse. | Use Driller Girl to drill through the Eternal spiral and trigger chain reactions (≥30% reveal for "Marvelous!"). Use Melter Girl for sustained damage on Eternal blocks. Place Sticky bombs on Dynamite and trigger with Cluster. Use Shatterer for quick clears if needed. |
| **27**    | Sorceress      | Driller Girl | 180              | Standard: 40, Strong: 60, Eternal: 50, Dynamite: 30 | Blast: 2, Shrapnel: 1, Sticky: 2, Piercer: 1, Ricochet: 1, Shatterer: 2, Cluster: 1, Melter: 2, Driller: 2 | 18x10 grid. Eternal blocks form a large cross (x: 400, y: 300; extending to x: 300–500, y: 200–400). Strong blocks are in the quadrants formed by the cross. Dynamite blocks are at the grid’s corners and along the cross. Standard blocks are in outer areas. | Use Driller Girl to drill along the Eternal cross and set up multiple chain reactions (≥30% reveal for "Superb!"). Use Melter Girl for sustained damage on Eternal blocks. Place Sticky bombs on Dynamite along the cross and trigger with Blast. Use Cluster for wide-area clears in the quadrants. |
| **28**    | Vampire        | Flying Girl (unlock after ≥90% reveal) | 180              | Standard: 45, Strong: 65, Eternal: 45, Dynamite: 25 | Blast: 2, Shrapnel: 1, Sticky: 2, Piercer: 1, Ricochet: 1, Shatterer: 2, Cluster: 1, Melter: 2, Driller: 2 | 18x10 grid. Eternal blocks form a large square with a hole in the center (x: 300–500, y: 200–400; hole at x: 350–450, y: 250–350). Strong blocks fill the hole. Dynamite blocks are at the grid’s corners and around the square. Standard blocks are in outer areas. | Use Driller Girl to drill through the Eternal square and into the Strong blocks inside (≥30% reveal for "Amazing!"). Use Melter Girl for sustained damage on Eternal blocks. Place Sticky bombs on Dynamite around the square and trigger with Cluster for chain reactions. Achieve ≥90% to unlock Flying Girl (not used in design). |
| **29**    | Vampire        | Flying Girl | 190              | Standard: 40, Strong: 70, Eternal: 50, Dynamite: 30 | Blast: 2, Shrapnel: 1, Sticky: 2, Piercer: 1, Ricochet: 1, Shatterer: 2, Cluster: 1, Melter: 2, Driller: 2 | 19x10 grid. Eternal blocks form a checkerboard pattern (x: 300–500, y: 200–400). Strong blocks are in rows above and below (y: 100, 500). Dynamite blocks are scattered near the checkerboard. Standard blocks are in outer areas. | Use Driller Girl to navigate through the Eternal checkerboard and set up chain reactions (≥30% reveal for "Wonderful!"). Use Melter Girl for sustained damage on Eternal blocks. Place Sticky bombs on Dynamite and trigger with Blast. Use Cluster for wide-area clears. |
| **30**    | Vampire        | Flying Girl | 200              | Standard: 35, Strong: 75, Eternal: 55, Dynamite: 35 | Blast: 2, Shrapnel: 1, Sticky: 2, Piercer: 1, Ricochet: 1, Shatterer: 2, Cluster: 1, Melter: 2, Driller: 2 | 20x10 grid. Eternal blocks form a large maze-like structure in the center (x: 300–500, y: 200–400), with paths and dead ends. Strong blocks are placed at key points within the maze. Dynamite blocks are at the entrances and exits of the maze. Standard blocks are in outer areas. | Use Driller Girl to navigate through the Eternal maze and set up chain reactions at key points (≥30% reveal for "Incredible!"). Use Melter Girl for sustained damage on Eternal blocks. Place Sticky bombs on Dynamite at the entrances and trigger with Blast. Use Cluster for wide-area clears within the maze. This level tests the player’s mastery of all bomb types and strategic thinking. |