# Game Design Document: Beauty Ice Breaker

## 1. Game Overview
- **Title**: Beauty Ice Breaker
- **Genre**: Puzzle-Physics
- **Platform**: PC and Mobile (Web-based using HTML5 and [Phaser 3](https://phaser.io/docs))
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
  - **Shooting and Physics**: Players use a slingshot to launch bombs, with trajectories and collisions governed by Matter.js physics, similar to "Angry Birds." Bombs trigger varied effects based on block and bomb types.
  - **Bomb Unlock System**: The 10 bomb types correspond to the 10 chibi girls. Achieving ≥90% reveal (2 stars or higher) on levels introducing a new chibi girl (1, 4, 7, ..., 28) unlocks her bomb type for use in subsequent levels.
  - **Congratulatory Voice Messages**: When a single girl bomb shot reveals **30% or more** of the image, a random congratulatory message (e.g., "Fantastic!", "Great Aim!", "Marvelous!", "Superb!") is played in a cute, girl-like voice, accompanied by on-screen text. This rewards skillful shots, enhancing player engagement.
- **Ice Blocks**:
  - **Appearance**: Frosted, semi-transparent sprites (ice cubes or panels) with distinct visuals (e.g., crystalline sheen for Eternal, red glow for Dynamite).
  - **Properties**:
    - **Size**: Larger blocks in early levels (40x40 pixels), smaller in advanced levels (20x20 pixels).
    - **Durability**: Varies by block type, requiring multiple hits or specific bombs.
    - **Behavior**: Later levels feature moving (oscillating paths) or regenerating blocks (respawn after delay).
    - **Block Types**:

      | **Block Type**       | **Description**                                                                 | **Strategic Use**                                                                 |
      |----------------------|--------------------------------------------------------------------------------|----------------------------------------------------------------------------------|
      | **Eternal Ice Block**| Requires 3 explosion hits to destroy, or 1 Shatterer Girl heavy explosion hit. | Use Shatterer Girl or multiple shots strategically.                              |
      | **Strong Ice Block** | Requires 2 explosion hits to destroy, or 1 Shatterer Girl heavy explosion hit. | Use Shatterer Girl for efficiency or multiple weaker shots.                       |
      | **Dynamite Block**   | Any explosion hit causes it to explode, destroying itself and nearby blocks.    | Pair with Blast or Cluster Girl for chain reactions.                              |
      | **Bouncy Block**     | Reflects any bomb hit without exploding, applying force based on incidence angle. | Use Ricochet or Flying Girl to redirect bombs to other blocks.                   |

      - **Implementation Notes**:
        - **Eternal Ice Block**: Custom property `hitsLeft: 3`, destroyed by Shatterer Girl or three hits.
        - **Strong Ice Block**: `hitsLeft: 2`, similar mechanics.
        - **Dynamite Block**: Triggers explosion on collision, applying Matter.js impulses to nearby blocks.
        - **Bouncy Block**: High restitution (1.0), static body, reflects bombs with angle-based force.
  - **Physics**: Low friction (0.01) for slipperiness, except Bouncy Blocks.
- **Projectiles ("Cute Girl Bombs")**:
  - **Design**: Chibi girl sprites with bomb elements (e.g., holding sparkling bombs), each representing one of the 10 frozen chibi girls being rescued.
  - **Mechanics**: Limited shots per level, with specific bomb types available based on unlocks. Players strategize to maximize block destruction.
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
| **Piercer Girl**    | Knight         | Penetrates multiple blocks in a straight line, destroying sequentially.         | Target rows or columns of blocks.                                                | Triggers Dynamite; damages Eternal/Strong (1 hit); reflected by Bouncy.                |
| **Shrapnel Girl**   | Witch          | Fragments into smaller projectiles, each destroying a separate block.           | Hit multiple scattered blocks.                                                   | Triggers Dynamite; damages Eternal/Strong (1 hit per fragment); reflected by Bouncy.   |
| **Ricochet Girl**   | Mermaid        | Bounces off surfaces, hitting blocks from various angles.THe Ricochet Girl will keep bouncing for 5 seconds then it will explode.                       | 
Navigate obstacles or reach hidden blocks.                                        | Triggers Dynamite; damages Eternal/Strong (1 hit); reflected by Bouncy with synergy.   |
| **Sticky Girl**     | Pirate         | Adheres to first block hit, detonated manually or after delay.                  | Time explosions for maximum damage.                                              | Sticks to any block; triggers Dynamite; damages Eternal/Strong (1 hit).               |
| **Melter Girl**     | Baker          | Releases substance that melts blocks over time, even after impact.              | Deal with large or reinforced blocks.                                            | Triggers Dynamite; damages Eternal/Strong (1 hit over time); reflected by Bouncy.      |
| **Shatterer Girl**  | Astronaut      | Powerful impact, breaks toughest blocks.                                        | Essential for Eternal/Strong blocks.                                             | Destroys Eternal/Strong in 1 hit; triggers Dynamite; reflected by Bouncy.              |
| **Cluster Girl**    | Ninja          | Disperses smaller bombs upon explosion, targeting nearby blocks.                | Cover wide areas with multiple explosions.                                       | Triggers Dynamite; damages Eternal/Strong (1 hit per mini-bomb); reflected by Bouncy.  |
| **Flying Girl**     | Vampire        | Floats slowly; players control with WASD (PC) or joystick (mobile), shoot rockets at cursor (or tap target). Rockets explode on impact. Lasts 15 seconds, then fizzles. | Precise targeting, especially Dynamite.                                          | Rockets trigger Dynamite; damage Eternal/Strong (1 hit per rocket); reflected by Bouncy. |
| **Driller Girl**    | Sorceress      | Drills 30 blocks deep, remains as sticky bomb, explodes when triggered by other explosions. | Set up chain reactions in deep clusters.                                         | Drills through any block; sticks, triggers Dynamite; damages Eternal/Strong (1 hit when exploded); reflected by Bouncy. |

- **Implementation Notes**:
  - **Flying Girl**: Kinematic body, player-controlled velocity, rocket spawning, 15-second timer. Rockets use Matter.js impulses.
  - **Driller Girl**: Tracks penetration (30 blocks), becomes kinematic, explodes via collision events.
  - Bombs interact with blocks via Matter.js, with logic for durability, explosions, and reflection.
  - Bomb unlocks are tracked (e.g., player data flag `unlockedBombs`), enabling selection in UI only after achieving ≥90% on Levels 1, 4, 7, ..., 28.
  - **Congratulatory Messages**: Track reveal percentage per shot (e.g., `revealDelta` in game state). If ≥30%, trigger a random voice clip from `/assets/audio/voice/` and display text via Phaser 3 text object (fade out after 2 seconds).

## 4. Controls
- **PC**:
  - Click and drag to aim slingshot; release to shoot.
  - Flying Girl: WASD for movement, left mouse for rockets.
  - Keys (1–0) for bomb type.
- **Mobile**:
  - Touch and drag to aim slingshot; release to shoot.
  - Flying Girl: Joystick for movement, tap for rockets.
  - Tap UI for bomb type.
- **Input Handling**: Phaser 3 supports mouse/touch, scaling for 320x480 to 1920x1080.

## 5. Art and Sound
- **Art Style**:
  - **Visuals**: Chibi style with vibrant colors, exaggerated proportions.
  - **Background Images**: 30 unique chibi girl images (3 per girl: Schoolgirl, Knight, Witch, Mermaid, Pirate, Baker, Astronaut, Ninja, Vampire, Sorceress), sourced from [itch.io](https://itch.io).
  - **Ice Blocks**:
    - **Eternal**: Dark blue, crystalline, glowing core.
    - **Strong**: Light blue, cracked appearance.
    - **Dynamite**: Red-tinted, sparking fuse.
    - **Bouncy**: Shiny, rubbery texture.
  - **Projectiles**:
    - **Flying Girl**: Chibi (Vampire) with wings/jetpack, hovering; rockets are sparkling.
    - **Driller Girl**: Chibi (Sorceress) with drill, spinning animation.
    - Others: Chibi girls with bomb elements, themed to their character (e.g., Schoolgirl with a book-shaped bomb for Blast).
  - **Slingshot**: Cute, with chibi decorations (e.g., ribbons).
  - **Congratulatory Messages**: On-screen text in a cute, bold font (e.g., Comic Sans or similar), with slight glow effect, centered above the play area, fading out after 2 seconds.
- **Sound**:
  - **Background Music**: Upbeat, light pop or kawaii-style.
  - **Sound Effects**:
    - Launch: "Pop"/giggle; whoosh (Flying); whir (Driller).
    - Destruction: Crystalline shatter, deeper for Eternal/Strong.
    - Dynamite: "Boom."
    - Bouncy: "Boing."
    - Flying rocket: "Pew."
    - Driller: Drilling buzz.
    - Reveal: Soft chime.
    - Win/lose: Cheerful jingle (win), gentle tone (lose).
    - Star rating: Ascending chimes for 1–3 stars.
    - Bomb unlock: Triumphant fanfare.
    - **Congratulatory Voice Messages**: Cute, girl-like voice clips (e.g., "Fantastic!", "Great Aim!", "Marvelous!", "Superb!", "Amazing!", "Wonderful!", "Nice Shot!", "Incredible!"). Stored in `/assets/audio/voice/`, randomly selected when a shot reveals ≥30%.
  - **Asset Sources**: [CraftPix.net](https://craftpix.net) for chibi girls, [GraphicRiver](https://graphicriver.net) for blocks, [Freesound.org](https://freesound.org) or [Zapsplat.com](https://www.zapsplat.com) for voice clips, stored in `/assets/`.
  - **Implementation Notes**:
    - Voice clips are short (1–2 seconds), high-pitched, and cheerful to match the chibi aesthetic.
    - Use Phaser 3’s audio system to play clips (`this.sound.play('voice_fantastic')`) with volume balanced against background music (e.g., voice at 0.8, music at 0.5).
    - Ensure mobile compatibility by preloading audio assets and supporting common formats (e.g., MP3, OGG).

## 6. Levels and Progression
- **Number of Levels**: 30, each featuring one of three unique images for one of 10 chibi girls, increasing difficulty via block types, behaviors, and bomb restrictions.
- **Chibi Girl and Bomb Mapping**:
  - Each chibi girl has 3 levels (images), with her bomb type unlocked after achieving ≥90% reveal on her first level:
    - **Schoolgirl (Blast Girl)**: Levels 1–3 (unlock after Level 1).
    - **Knight (Piercer Girl)**: Levels 4–6 (unlock after Level 4).
    - **Witch (Shrapnel Girl)**: Levels 7–9 (unlock after Level 7).
    - **Mermaid (Ricochet Girl)**: Levels 10–12 (unlock after Level 10).
    - **Pirate (Sticky Girl)**: Levels 13–15 (unlock after Level 13).
    - **Baker (Melter Girl)**: Levels 16–18 (unlock after Level 16).
    - **Astronaut (Shatterer Girl)**: Levels 19–21 (unlock after Level 19).
    - **Ninja (Cluster Girl)**: Levels 22–24 (unlock after Level 22).
    - **Vampire (Flying Girl)**: Levels 25–27 (unlock after Level 25).
    - **Sorceress (Driller Girl)**: Levels 28–30 (unlock after Level 28).
- **Difficulty Progression**:
  - **Early Levels (1–10)**: Large, mostly stationary blocks (Standard, Strong, Dynamite); 7–10 shots; introduce Blast, Piercer, Shrapnel, Ricochet, Sticky.
  - **Mid Levels (11–20)**: Smaller blocks, Eternal, more Dynamite; moving blocks; 5–7 shots; add Melter, Shatterer, Cluster.
  - **Late Levels (21–30)**: Small, moving, regenerating blocks, Bouncy; 3–5 shots; add Flying, Driller.
- **Star System**:
  - **3 Stars**: 100% reveal.
  - **2 Stars**: ≥90% reveal.
  - **1 Star**: ≥80% reveal (minimum to pass).
- **Level Design**: Each level specifies block configuration, bomb availability (based on unlocks), layout, and strategic notes for 3 stars. Bomb types are limited until unlocked, ensuring players use newly acquired bombs strategically. Congratulatory messages trigger for high-impact shots (≥30% reveal), encouraging players to aim for large reveals to hear varied voice clips.

### 6.1. Detailed Level Design for Levels 1–30

| **Level** | **Chibi Girl Theme** | **Bomb Type** | **Total Blocks** | **Block Configuration** | **Bomb Availability** | **Layout Description** | **Strategic Notes** |
|-----------|----------------------|---------------|------------------|-------------------------|-----------------------|------------------------|---------------------|
| 1         | Schoolgirl           | Blast Girl    | 50               | 50 Standard             | Blast: 5, Piercer: 3  | 5x10 grid centered (x: 200–600, y: 100–500). | Use Blast for clusters (3–4 blocks/shot). Piercer for stragglers. Achieve ≥90% to unlock Blast Girl. Aim for ≥30% reveal per Blast shot to trigger voice messages (e.g., "Fantastic!"). |
| 2         | Schoolgirl           | Blast Girl    | 50               | 40 Standard, 10 Strong  | Blast: 4, Piercer: 3, Shrapnel: 2 | 5x10 grid; Strong in middle rows (y: 200–300). | Target Strong with two Blast hits or Shrapnel. Piercer for edges. Trigger voice messages with high-impact Blast shots. |
| 3         | Schoolgirl           | Blast Girl    | 60               | 50 Standard, 10 Strong  | Blast: 3, Piercer: 3, Shrapnel: 3 | 6x10 grid; Strong in vertical column (x: 400). | Limited Blasts; Shrapnel for Strong (2 hits), Piercer for rows. Aim for ≥30% reveal to hear "Great Aim!" etc. |
| 4         | Knight               | Piercer Girl  | 60               | 45 Standard, 10 Strong, 5 Dynamite | Blast: 3, Piercer: 2, Shrapnel: 2, Ricochet: 2 | 6x10 grid; Dynamite at corners (x: 200, 600; y: 100, 500), Strong in center. | Blast near Dynamite for explosions. Ricochet for corners. Achieve ≥90% to unlock Piercer Girl. Trigger voice messages with Dynamite chains. |
| 5         | Knight               | Piercer Girl  | 70               | 50 Standard, 15 Strong, 5 Dynamite | Blast: 3, Piercer: 2, Shrapnel: 2, Ricochet: 3 | 7x10 grid; Dynamite in cross (x: 400, y: 300; corners), Strong in rows (y: 200, 400). | Blast on Dynamite for chains. Ricochet around Strong. Aim for ≥30% reveal per shot for voice clips. |
| 6         | Knight               | Piercer Girl  | 70               | 45 Standard, 15 Strong, 10 Dynamite | Blast: 2, Piercer: 2, Shrapnel: 3, Ricochet: 2 | 7x10 grid; Dynamite clustered (x: 350–450, y: 250–350), Strong at edges. | Limited Blasts; place near Dynamite for impact. Shrapnel for spread, Ricochet for edges. Trigger voice messages with Dynamite explosions. |
| 7         | Witch                | Shrapnel Girl | 80               | 50 Standard, 20 Strong, 10 Dynamite | Blast: 2, Piercer: 2, Shrapnel: 2, Ricochet: 3, Sticky: 1 | 8x10 grid; Dynamite in rows (y: 200, 400), Strong in columns (x: 300, 500). | Sticky near Dynamite for timed explosion. Ricochet for angled shots. Achieve ≥90% to unlock Shrapnel Girl. Use Shrapnel for ≥30% reveal voice clips. |
| 8         | Witch                | Shrapnel Girl | 80               | 40 Standard, 20 Strong, 20 Dynamite | Blast: 2, Piercer: 2, Shrapnel: 2, Ricochet: 2, Sticky: 2 | 8x10 grid; Dynamite in diamond (x: 300–500, y: 200–400), Strong surrounds. | Sticky on Dynamite for massive clears. Blast sparingly for multiple Dynamites. Trigger voice messages with Sticky explosions. |
| 9         | Witch                | Shrapnel Girl | 90               | 50 Standard, 25 Strong, 10 Dynamite, 5 Eternal | Blast: 2, Piercer: 2, Shrapnel: 2, Ricochet: 2, Sticky: 1, Shatterer: 1 | 9x10 grid; Eternal at center (x: 400, y: 300), Dynamite in corners, Strong in rows (y: 200, 400). | Shatterer for Eternal. Sticky on Dynamite for chains. Blast/Shrapnel for Strong. Aim for voice clips with Shrapnel spread. |
| 10        | Mermaid              | Ricochet Girl | 90               | 45 Standard, 25 Strong, 15 Dynamite, 5 Eternal | Blast: 2, Piercer: 2, Shrapnel: 2, Ricochet: 2, Sticky: 1, Shatterer: 2 | 9x10 grid; Eternal in cross (x: 400, y: 300), Dynamite scattered, Strong at edges. | Shatterer for Eternal cross. Sticky on Dynamite. Ricochet for tight spaces. Achieve ≥90% to unlock Ricochet Girl. Trigger voice clips with Ricochet chains. |
| 11        | Mermaid              | Ricochet Girl | 100              | 50 Standard, 30 Strong, 15 Dynamite, 5 Eternal | Blast: 2, Piercer: 2, Shrapnel: 2, Ricochet: 1, Sticky: 1, Shatterer: 2, Melter: 1 | 10x10 grid; Eternal/Strong in center (x: 300–500, y: 200–400), Dynamite at edges. 10 Standard move horizontally (x: 200–600, y: 100, 50 px/s). | Melter for Strong/Eternal. Shatterer for Eternal. Sticky on Dynamite. Time shots for moving blocks. Aim for ≥30% reveal for voice messages. |
| 12        | Mermaid              | Ricochet Girl | 100              | 45 Standard, 30 Strong, 15 Dynamite, 10 Eternal | Blast: 2, Piercer: 2, Shrapnel: 1, Ricochet: 1, Sticky: 1, Shatterer: 2, Melter: 2 | 10x10 grid; Eternal in columns (x: 300, 500), Dynamite in rows (y: 200, 400), Strong surrounds. 10 Standard move vertically (y: 100–500). | Melter/Shatterer for Eternal. Sticky on Dynamite. Limited Shrapnel for moving blocks. Trigger voice clips with Melter. |
| 13        | Pirate               | Sticky Girl   | 110              | 50 Standard, 35 Strong, 15 Dynamite, 10 Eternal | Blast: 2, Piercer: 1, Shrapnel: 1, Ricochet: 2, Sticky: 1, Shatterer: 2, Melter: 2, Cluster: 1 | 11x10 grid; Eternal/Strong in checkerboard (x: 300–500, y: 200–400), Dynamite at corners. 15 Standard move (x: 200–600). | Cluster for Dynamite triggers. Shatterer/Melter for Eternal. Ricochet for moving blocks. Achieve ≥90% to unlock Sticky Girl. Use Sticky for voice clips. |
| 14        | Pirate               | Sticky Girl   | 110              | 45 Standard, 35 Strong, 20 Dynamite, 10 Eternal | Blast: 2, Piercer: 1, Shrapnel: 1, Ricochet: 2, Sticky: 2, Shatterer: 2, Melter: 1, Cluster: 1 | 11x10 grid; Dynamite in spiral (x: 300–500, y: 200–400), Eternal/Strong in center. 15 Standard move (y: 100–500). | Cluster/Sticky for Dynamite spiral. Shatterer for Eternal. Ricochet for moving blocks. Trigger voice messages with Sticky chains. |
| 15        | Pirate               | Sticky Girl   | 120              | 50 Standard, 40 Strong, 20 Dynamite, 10 Eternal | Blast: 2, Piercer: 1, Shrapnel: 1, Ricochet: 1, Sticky: 2, Shatterer: 2, Melter: 2, Cluster: 1 | 12x10 grid; Eternal in ring (x: 350–450, y: 250–350), Dynamite/Strong layered outside, Standard at edges. 20 Standard move (x: 200–600). | Cluster/Sticky for Dynamite chains. Shatterer/Melter for Eternal. Ricochet for moving blocks. Aim for ≥30% reveal for voice clips. |
| 16        | Baker                | Melter Girl   | 120              | 45 Standard, 40 Strong, 20 Dynamite, 15 Eternal | Blast: 2, Piercer: 1, Shrapnel: 1, Ricochet: 1, Sticky: 2, Shatterer: 3, Melter: 2, Cluster: 1 | 12x10 grid; Eternal in diamond (x: 300–500, y: 200–400), Dynamite/Strong in layers. 20 Standard move vertically (y: 100–500, 50 px/s). | Melter for Eternal/Strong. Shatterer for Eternal. Sticky on Dynamite. Cluster for clears. Achieve ≥90% to unlock Melter Girl. Trigger voice clips with Melter. |
| 17        | Baker                | Melter Girl   | 130              | 50 Standard, 45 Strong, 20 Dynamite, 15 Eternal | Blast: 2, Piercer: 1, Shrapnel: 1, Ricochet: 1, Sticky: 1, Shatterer: 3, Melter: 2, Cluster: 2 | 13x10 grid; Eternal/Strong in grid (x: 300–500, y: 200–400), Dynamite at edges. 25 Standard move (x: 200–600). | Cluster for Dynamite. Shatterer/Melter for Eternal. Sticky for chains. Time moving blocks for voice messages. |
| 18        | Baker                | Melter Girl   | 130              | 45 Standard, 45 Strong, 25 Dynamite, 15 Eternal | Blast: 2, Piercer: 1, Shrapnel: 1, Ricochet: 1, Sticky: 1, Shatterer: 2, Melter: 2, Cluster: 2 | 13x10 grid; Dynamite in cross (x: 400, y: 300), Eternal/Strong surround. 25 Standard move (y: 100–500). | Cluster for Dynamite cross. Shatterer/Melter for Eternal. Sticky for chains. Aim for ≥30% reveal for voice clips. |
| 19        | Astronaut            | Shatterer Girl| 140              | 50 Standard, 50 Strong, 25 Dynamite, 15 Eternal | Blast: 2, Piercer: 1, Shrapnel: 1, Ricochet: 1, Sticky: 1, Shatterer: 2, Melter: 2, Cluster: 2 | 14x10 grid; Eternal in columns (x: 300, 500), Dynamite in rows (y: 200, 400), Strong fills. 30 Standard move (x: 200–600). | Shatterer for Eternal. Cluster for Dynamite. Melter for Strong. Time moving blocks. Achieve ≥90% to unlock Shatterer Girl. Trigger voice clips with Shatterer. |
| 20        | Astronaut            | Shatterer Girl| 140              | 45 Standard, 50 Strong, 25 Dynamite, 20 Eternal | Blast: 2, Piercer: 1, Shrapnel: 1, Ricochet: 1, Sticky: 1, Shatterer: 3, Melter: 2, Cluster: 2 | 14x10 grid; Eternal in checkerboard (x: 300–500, y: 200–400), Dynamite scattered, Strong fills. 30 Standard move (y: 100–500). | Shatterer for Eternal. Cluster for Dynamite. Melter for Strong. Precise shots for moving blocks and voice messages. |
| 21        | Astronaut            | Shatterer Girl| 150              | 50 Standard, 50 Strong, 25 Dynamite, 20 Eternal, 5 Bouncy | Blast: 2, Piercer: 1, Shrapnel: 1, Ricochet: 1, Sticky: 1, Shatterer: 2, Melter: 2, Cluster: 1 | 15x10 grid; Bouncy at corners (x: 200, 600; y: 100, 500), Eternal in center, Dynamite/Strong around. 30 Standard move (x: 200–600). | Ricochet for Bouncy. Shatterer for Eternal. Cluster for Dynamite. Sticky for chains. Trigger voice clips with Cluster. |
| 22        | Ninja                | Cluster Girl  | 150              | 45 Standard, 50 Strong, 25 Dynamite, 20 Eternal, 10 Bouncy | Blast: 2, Piercer: 1, Shrapnel: 1, Ricochet: 1, Sticky: 1, Shatterer: 2, Melter: 2, Cluster: 1 | 15x10 grid; Bouncy in rows (y: 200, 400), Eternal/Dynamite in center, Strong fills. 30 Standard move (y: 100–500). | Cluster for Dynamite chains. Shatterer/Melter for Eternal. Ricochet for Bouncy. Achieve ≥90% to unlock Cluster Girl. Trigger voice clips with Cluster. |
| 23        | Ninja                | Cluster Girl  | 160              | 50 Standard, 55 Strong, 25 Dynamite, 20 Eternal, 10 Bouncy | Blast: 2, Piercer: 1, Shrapnel: 1, Ricochet: 1, Sticky: 1, Shatterer: 2, Melter: 1, Cluster: 2 | 16x10 grid; Bouncy in columns (x: 300, 500), Eternal in ring (x: 350–450, y: 250–350), Dynamite/Strong fill. 35 Standard move (x: 200–600). | Cluster for Dynamite. Shatterer for Eternal. Ricochet for Bouncy. Time moving blocks for voice messages. |
| 24        | Ninja                | Cluster Girl  | 160              | 45 Standard, 55 Strong, 30 Dynamite, 20 Eternal, 10 Bouncy | Blast: 2, Piercer: 1, Shrapnel: 1, Ricochet: 1, Sticky: 1, Shatterer: 2, Melter: 1, Cluster: 2 | 16x10 grid; Bouncy/Dynamite in spiral (x: 300–500, y: 200–400), Eternal/Strong in center. 35 Standard move (y: 100–500). | Cluster for Dynamite chains. Shatterer for Eternal. Ricochet for Bouncy. Trigger voice clips with Cluster explosions. |
| 25        | Vampire              | Flying Girl   | 170              | 50 Standard, 60 Strong, 30 Dynamite, 20 Eternal, 10 Bouncy | Blast: 2, Piercer: 1, Shrapnel: 1, Ricochet: 1, Sticky: 1, Shatterer: 2, Melter: 1, Cluster: 2, Flying: 1 | 17x10 grid; Bouncy at edges, Eternal/Dynamite in cross (x: 400, y: 300), Strong fills. 40 Standard move (x: 200–600). 5 Standard regenerate (5s delay). | Flying for Bouncy/Dynamite precision. Cluster for chains. Shatterer for Eternal. Target regenerating blocks fast. Achieve ≥90% to unlock Flying Girl. Trigger voice clips with Flying rockets. |
| 26        | Vampire              | Flying Girl   | 170              | 45 Standard, 60 Strong, 30 Dynamite, 25 Eternal, 10 Bouncy | Blast: 2, Piercer: 1, Shrapnel: 1, Ricochet: 1, Sticky: 1, Shatterer: 2, Melter: 1, Cluster: 2, Flying: 2 | 17x10 grid; Bouncy/Eternal in grid (x: 300–500, y: 200–400), Dynamite scattered, Strong fills. 40 Standard move (y: 100–500). 5 Standard regenerate. | Flying for Bouncy/Dynamite. Cluster for chains. Shatterer for Eternal. Hit regenerating blocks early for voice messages. |
| 27        | Vampire              | Flying Girl   | 180              | 50 Standard, 65 Strong, 30 Dynamite, 25 Eternal, 10 Bouncy | Blast: 2, Piercer: 1, Shrapnel: 1, Ricochet: 1, Sticky: 1, Shatterer: 2, Melter: 1, Cluster: 2, Flying: 2 | 18x10 grid; Bouncy/Dynamite in rows (y: 200, 400), Eternal in columns (x: 300, 500), Strong fills. 45 Standard move (x: 200–600). 5 Strong regenerate. | Flying for Bouncy/Dynamite. Cluster for chains. Shatterer for Eternal. Prioritize regenerating Strong for voice clips. |
| 28        | Sorceress            | Driller Girl  | 180              | 45 Standard, 65 Strong, 35 Dynamite, 25 Eternal, 10 Bouncy | Blast: 2, Piercer: 1, Shrapnel: 1, Ricochet: 1, Sticky: 1, Shatterer: 2, Melter: 1, Cluster: 2, Flying: 2, Driller: 1 | 18x10 grid; Bouncy/Eternal in checkerboard (x: 300–500, y: 200–400), Dynamite in center, Strong fills. 45 Standard move (y: 100–500). 5 Strong regenerate. | Driller for deep Dynamite chains. Flying for Bouncy. Shatterer for Eternal. Target regenerating Strong. Achieve ≥90% to unlock Driller Girl. Trigger voice clips with Driller explosions. |
| 29        | Sorceress            | Driller Girl  | 190              | 50 Standard, 70 Strong, 35 Dynamite, 25 Eternal, 10 Bouncy | Blast: 2, Piercer: 1, Shrapnel: 1, Ricochet: 1, Sticky: 1, Shatterer: 2, Melter: 1, Cluster: 2, Flying: 2, Driller: 2 | 19x10 grid; Bouncy/Dynamite in spiral (x: 300–500, y: 200–400), Eternal/Strong in layers. 50 Standard move (x: 200–600). 5 Eternal regenerate. | Driller for deep setups. Flying for Bouncy/Dynamite. Cluster for chains. Shatterer for Eternal. Hit regenerating Eternal fast for voice messages. |
| 30        | Sorceress            | Driller Girl  | 200              | 50 Standard, 70 Strong, 35 Dynamite, 25 Eternal, 20 Bouncy | Blast: 2, Piercer: 1, Shrapnel: 1, Ricochet: 1, Sticky: 1, Shatterer: 2, Melter: 1, Cluster: 2, Flying: 3, Driller: 3 | 20x10 grid; Bouncy in grid (x: 300–500, y: 200–400), Eternal/Dynamite in cross, Strong fills. 50 Standard move (y: 100–500). 5 Eternal regenerate. | Driller for Dynamite chains. Flying for Bouncy precision. Cluster for clears. Shatterer for Eternal. Optimize for regenerating Eternal and voice clips. |

### 6.2. Level Design Notes
- **Block Behaviors**:
  - **Levels 1–10**: Stationary blocks to teach mechanics.
  - **Levels 11–20**: Moving blocks (10–30% of Standard, 50 px/s, oscillating horizontally/vertically).
  - **Levels 21–30**: Moving blocks (20–30%) and regenerating blocks (5–10%, 5s delay, starting with Standard, then Strong/Eternal).
- **Bomb Unlock Progression**:
  - Level 1: Unlock Blast Girl (≥90% reveal).
  - Level 4: Unlock Piercer Girl.
  - Level 7: Unlock Shrapnel Girl.
  - Level 10: Unlock Ricochet Girl.
  - Level 13: Unlock Sticky Girl.
  - Level 16: Unlock Melter Girl.
  - Level 19: Unlock Shatterer Girl.
  - Level 22: Unlock Cluster Girl.
  - Level 25: Unlock Flying Girl.
  - Level 28: Unlock Driller Girl.
  - Bombs are unavailable until unlocked, ensuring players rely on available types (e.g., only Blast/Piercer in Levels 1–3).
- **Congratulatory Voice Messages**:
  - Triggered when a single shot reveals ≥30% of the image (e.g., large Blast Girl explosion, well-placed Sticky Girl, or Flying Girl rocket barrage).
  - Encourages players to experiment with bomb types (e.g., Cluster, Flying) to achieve high-impact shots and hear varied messages.
  - Messages enhance feedback for Dynamite chain reactions, common in later levels with more Dynamite blocks.
- **Tutorial Prompts**:
  - Level 1: “Drag the bomb to aim and shoot. Reach 80% for 1 star, 90% for 2 stars to unlock Blast Girl, 100% for 3 stars! Reveal 30%+ in one shot for a special message!”
  - Level 2: “Strong Blocks need 2 hits or Shatterer Girl. Aim for big reveals to hear ‘Great Aim!’”
  - Level 4: “Dynamite Blocks explode with any hit! Reach 90% to unlock Piercer Girl and trigger voice clips with chains.”
  - Level 7: “Shrapnel Girl spreads damage. Unlock her at 90%! Aim for 30%+ reveals.”
  - Level 10: “Eternal Blocks need Shatterer or 3 hits. Unlock Ricochet Girl at 90%. Trigger voice messages with big shots.”
  - Level 13: “Sticky Girl times explosions. Unlock her at 90%. Use her for voice clips.”
  - Level 16: “Melter Girl damages over time. Unlock her at 90%. Aim for 30%+ reveals.”
  - Level 19: “Shatterer Girl breaks tough blocks. Unlock her at 90%. Trigger voice messages with Shatterer.”
  - Level 22: “Cluster Girl spreads mini-bombs. Unlock her at 90%. Use Cluster for voice clips.”
  - Level 25: “Use WASD to move Flying Girl and shoot rockets. Unlock her at 90%. Aim rockets for voice messages.”
  - Level 28: “Driller Girl burrows deep for chains. Unlock her at 90%. Trigger voice clips with Driller explosions.”
- **Strategic Design**:
  - **Levels 1–5**: Teach bomb mechanics, introduce Dynamite chains with Blast/Piercer. Encourage ≥30% reveal shots for voice messages.
  - **Levels 6–10**: Add Sticky, Shatterer, Eternal blocks, requiring precise placement. Use Sticky for high-impact voice triggers.
  - **Levels 11–15**: Moving blocks, Melter, Cluster, increasing puzzle complexity. Cluster shots often trigger voice messages.
  - **Levels 16–20**: More Eternal/Dynamite, moving blocks, Shatterer for efficiency. Melter and Cluster for voice clips.
  - **Levels 21–30**: Bouncy, regenerating blocks, Flying/Driller for advanced strategies. Flying and Driller shots can trigger voice messages with precise or deep impacts.

## 7. Controls
- **PC**:
  - Click and drag to aim slingshot; release to shoot.
  - Flying Girl: WASD for movement, left mouse for rockets.
  - Keys (1–0) for bomb type.
- **Mobile**:
  - Touch and drag to aim slingshot; release to shoot.
  - Flying Girl: Joystick for movement, tap for rockets.
  - Tap UI for bomb type.
- **Input Handling**: Phaser 3 supports mouse/touch, scaling for 320x480 to 1920x1080.

## 8. User Interface
- **HUD**:
  - **Shots Remaining**: Top-left, e.g., “Shots: 5”
  - **Reveal Percentage**: Top-right, e.g., “Revealed: 80%,” with progress bar
  - **Slingshot**: Bottom-left, red aiming line
  - **Bomb Selection**: UI buttons/keys with counts (e.g., “Blast: 2”), showing only unlocked bombs
  - **Flying Girl Controls**: WASD indicators (PC) or joystick (mobile)
  - **Congratulatory Messages**: Brief text (e.g., “Fantastic!”) centered above play area, in cute font with glow, fading after 2 seconds, triggered by ≥30% reveal per shot
  - **Star Rating**: Post-level with 1–3 stars
- **Main Menu**:
  - Buttons: Start Game, Gallery, Options, Credits
  - Background: Static chibi girl or subtle animation
- **"Hello World" This is a test to see if you can handle a phrase with double quotes in the middle of a sentence. If you can, great job! If not, please try to incorporate it properly.
- **Gallery System**:
  - Accessible from main menu.
  - Displays unlocked chibi girl images (30 total, 3 per girl).
  - Organized by chibi girl (e.g., Schoolgirl: Image 1–3), with thumbnails and full-view options.
  - Locked images show silhouettes with level numbers.
- **Level Completion**:
  - Text: “Level Complete!” (green) or “Try Again!” (red)
  - Score: Base score + bonus
  - Star rating: 1–3 stars with percentage
  - Notification: “Image Unlocked in Gallery!” and, for Levels 1, 4, 7, ..., 28 with ≥90%, “New Bomb Unlocked: [Bomb Type]!”
  - Buttons: Next Level, Retry, Gallery

## 9. Replayability
- **Fixed Levels**: Set block layouts and bomb limits for consistency.
- **Star System**: Replay for 3 stars (100% reveal) by optimizing bombs.
- **Gallery System**: Collecting all 30 images encourages replaying levels for unlocks.
- **Bomb Unlocks**: Achieving ≥90% on Levels 1, 4, 7, ..., 28 motivates replay for new bomb types.
- **Congratulatory Voice Messages**: Varied messages (e.g., "Marvelous!", "Superb!") encourage players to aim for high-impact shots (≥30% reveal) to hear all clips, enhancing engagement.
- **Enhancements**: Future updates could randomize blocks or add challenge modes.
- **Scoring Incentive**: High scores encourage bomb combination experiments.

## 10. Development Considerations
- **Asset Creation**: Royalty-free assets from [itch.io](https://itch.io) or [CraftPix.net](https://craftpix.net). [GIMP](https://www.gimp.org) for placeholders. Create 3 unique images per chibi girl (30 total), distinct visuals for each bomb type (e.g., Vampire with wings for Flying, Sorceress with drill for Driller). Record 8–10 voice clips for congratulatory messages in a high-pitched, cheerful tone.
- **Testing**: Test on multiple devices (iPhone, Android, PC) for input, scaling, Flying Girl controls, moving/regenerating blocks, gallery functionality, bomb unlock triggers, and voice message playback. Ensure voice clips play without lag and text fades correctly.
- **Optimization**: Compress PNGs and audio (MP3/OGG) for faster mobile loading. Preload voice clips to avoid playback delays.
- **Physics Adjustments**: Tune block properties (friction, restitution), bomb interactions (Flying rockets, Driller penetration, Bouncy reflections).
- **Gallery Implementation**: Use Phaser 3 scenes for gallery menu, with image loading from `/assets/images/chibi/`. Track unlocks via player data (e.g., `unlockedImages`, `unlockedBombs`).
- **Congratulatory Messages Implementation**:
  - Track reveal percentage per shot by comparing image reveal before and after bomb impact (e.g., `revealDelta = newReveal - oldReveal`).
  - If `revealDelta ≥ 30`, select random voice clip from array (e.g., `['voice_fantastic', 'voice_great_aim', ...]`) and play via `this.sound.play()`.
  - Display matching text using Phaser 3 text object (e.g., `this.add.text(400, 300, 'Fantastic!', { font: '24px Comic Sans', color: '#fff', stroke: '#000' }).setOrigin(0.5)`), with tween to fade out over 2 seconds.
  - Ensure voice and text triggers are limited to once per shot to avoid overlap (e.g., use flag `isMessagePlaying`).
- **Optional Enhancements**: Add shattering animations, rocket trails, drilling effects, gallery animations (e.g., chibi girl waving), or particle effects for congratulatory messages (e.g., sparkles around text) using Phaser’s particle system.