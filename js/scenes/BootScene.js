class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Create simple shapes instead of loading images
        this.createShapes();
        
        // Create audio data
        this.createAudio();
        
        console.log("BootScene: Assets created successfully");
        
        // Loading UI
        const loadingText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 50,
            'Loading...',
            { 
                font: '20px Arial', 
                fill: '#ffffff' 
            }
        ).setOrigin(0.5);
        
        // Loading progress bar
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(
            this.cameras.main.width / 2 - 160,
            this.cameras.main.height / 2,
            320,
            50
        );
        
        // Simulate loading progress
        let progress = 0;
        const timer = this.time.addEvent({
            delay: 50,
            callback: () => {
                progress += 0.05;
                progressBar.clear();
                progressBar.fillStyle(0xffffff, 1);
                progressBar.fillRect(
                    this.cameras.main.width / 2 - 150,
                    this.cameras.main.height / 2 + 10,
                    300 * Math.min(progress, 1),
                    30
                );
                
                if (progress >= 1) {
                    timer.remove();
                    progressBar.destroy();
                    progressBox.destroy();
                    loadingText.destroy();
                    console.log("BootScene: Loading complete, starting MainMenuScene");
                    this.scene.start('MainMenuScene');
                }
            },
            callbackScope: this,
            loop: true
        });
    }
    
    createShapes() {
        // Create a simple blue background for startup screens
        const background = this.add.graphics({ willReadFrequently: true });
        background.fillStyle(0x000000, 1); // Black background
        background.fillRect(0, 0, 1920, 1080);
        background.generateTexture('background', 1920, 1080);
        background.clear();
        
        // Create ice block (light blue rectangle with alpha)
        const iceBlock = this.add.graphics({ willReadFrequently: true });
        iceBlock.fillStyle(0xaaddff, 0.9);
        iceBlock.fillRect(0, 0, 40, 40);
        iceBlock.lineStyle(2, 0xffffff, 0.9);
        iceBlock.strokeRect(0, 0, 40, 40);
        iceBlock.generateTexture('iceBlock', 40, 40);
        iceBlock.clear();
        
        // Create slingshot (brown Y shape)
        const slingshot = this.add.graphics({ willReadFrequently: true });
        slingshot.fillStyle(0x8B4513, 1);
        slingshot.fillRect(0, 0, 10, 60);  // Base
        slingshot.fillRect(-20, 0, 50, 10); // Top part
        slingshot.generateTexture('slingshot', 50, 60);
        slingshot.clear();
        
        // 1. BLAST GIRL - Regular bomb (pink circle with face)
        const blastBomb = this.add.graphics({ willReadFrequently: true });
        blastBomb.fillStyle(0xff77aa, 1);
        blastBomb.fillCircle(20, 20, 20);
        blastBomb.fillStyle(0x000000, 1);
        blastBomb.fillCircle(13, 15, 3); // Left eye
        blastBomb.fillCircle(27, 15, 3); // Right eye
        blastBomb.lineStyle(2, 0x000000, 1);
        blastBomb.beginPath();
        blastBomb.arc(20, 25, 8, 0, Math.PI, false);
        blastBomb.strokePath();
        blastBomb.generateTexture('bomb', 40, 40); // Default bomb
        blastBomb.generateTexture('blast_bomb', 40, 40);
        blastBomb.clear();
        
        // 2. PIERCER GIRL - Pointed bomb (pink arrow-shaped)
        const piercerBomb = this.add.graphics({ willReadFrequently: true });
        piercerBomb.fillStyle(0x77aaff, 1); // Blue color
        piercerBomb.fillCircle(20, 20, 16);
        // Add arrow point
        piercerBomb.fillStyle(0x77aaff, 1);
        piercerBomb.fillTriangle(20, 0, 10, 20, 30, 20);
        // Add face
        piercerBomb.fillStyle(0x000000, 1);
        piercerBomb.fillCircle(15, 15, 2); // Left eye
        piercerBomb.fillCircle(25, 15, 2); // Right eye
        piercerBomb.lineStyle(1, 0x000000, 1);
        piercerBomb.beginPath();
        piercerBomb.arc(20, 23, 5, 0, Math.PI, false);
        piercerBomb.strokePath();
        piercerBomb.generateTexture('piercer_bomb', 40, 40);
        piercerBomb.clear();
        
        // 3. CLUSTER GIRL - Multiple bomb (yellow with dots)
        const clusterBomb = this.add.graphics({ willReadFrequently: true });
        clusterBomb.fillStyle(0xffdd44, 1); // Yellow color
        clusterBomb.fillCircle(20, 20, 18);
        // Add smaller circles around it
        clusterBomb.fillStyle(0xff9900, 0.6);
        clusterBomb.fillCircle(12, 12, 6);
        clusterBomb.fillCircle(28, 12, 6);
        clusterBomb.fillCircle(12, 28, 6);
        clusterBomb.fillCircle(28, 28, 6);
        // Add face
        clusterBomb.fillStyle(0x000000, 1);
        clusterBomb.fillCircle(15, 15, 2); // Left eye
        clusterBomb.fillCircle(25, 15, 2); // Right eye
        clusterBomb.lineStyle(1, 0x000000, 1);
        clusterBomb.beginPath();
        clusterBomb.arc(20, 22, 6, 0, Math.PI, false);
        clusterBomb.strokePath();
        clusterBomb.generateTexture('cluster_bomb', 40, 40);
        clusterBomb.clear();
        
        // 4. STICKY GIRL - Sticky bomb (green with goo)
        const stickyBomb = this.add.graphics({ willReadFrequently: true });
        stickyBomb.fillStyle(0x66cc66, 1); // Green color
        stickyBomb.fillCircle(20, 20, 18);
        // Add sticky drips
        stickyBomb.fillStyle(0x88ff88, 0.8);
        stickyBomb.fillCircle(20, 35, 8);
        stickyBomb.fillCircle(12, 32, 6);
        stickyBomb.fillCircle(28, 32, 6);
        // Add face
        stickyBomb.fillStyle(0x000000, 1);
        stickyBomb.fillCircle(15, 15, 2); // Left eye
        stickyBomb.fillCircle(25, 15, 2); // Right eye
        stickyBomb.lineStyle(1, 0x000000, 1);
        stickyBomb.beginPath();
        stickyBomb.arc(20, 22, 6, 0, Math.PI, false);
        stickyBomb.strokePath();
        stickyBomb.generateTexture('sticky_bomb', 40, 40);
        stickyBomb.clear();
        
        // 5. SHATTERER GIRL - Heavy impact bomb (red with cracks)
        const shattererBomb = this.add.graphics({ willReadFrequently: true });
        shattererBomb.fillStyle(0xcc3333, 1); // Red color
        shattererBomb.fillCircle(20, 20, 20);
        // Add crack pattern
        shattererBomb.lineStyle(2, 0x000000, 0.8);
        shattererBomb.beginPath();
        shattererBomb.moveTo(10, 10);
        shattererBomb.lineTo(18, 18);
        shattererBomb.moveTo(30, 10);
        shattererBomb.lineTo(22, 18);
        shattererBomb.moveTo(20, 10);
        shattererBomb.lineTo(20, 18);
        shattererBomb.strokePath();
        // Add face
        shattererBomb.fillStyle(0x000000, 1);
        shattererBomb.fillCircle(15, 15, 2); // Left eye
        shattererBomb.fillCircle(25, 15, 2); // Right eye
        shattererBomb.lineStyle(1, 0x000000, 1);
        shattererBomb.beginPath();
        shattererBomb.arc(20, 22, 5, 0, Math.PI, false);
        shattererBomb.strokePath();
        shattererBomb.generateTexture('shatterer_bomb', 40, 40);
        shattererBomb.clear();
        
        // Create particle for explosion effects
        const particle = this.add.graphics({ willReadFrequently: true });
        particle.fillStyle(0xff5500, 1);
        particle.fillCircle(8, 8, 8);
        particle.generateTexture('particle', 16, 16);
        particle.clear();
        
        // Create smaller particle for cluster bombs
        const miniParticle = this.add.graphics({ willReadFrequently: true });
        miniParticle.fillStyle(0xffdd44, 1);
        miniParticle.fillCircle(4, 4, 4);
        miniParticle.generateTexture('mini_particle', 8, 8);
        miniParticle.clear();
        
        // Create green sticky particles
        const stickyParticle = this.add.graphics({ willReadFrequently: true });
        stickyParticle.fillStyle(0x66cc66, 1);
        stickyParticle.fillCircle(6, 6, 6);
        stickyParticle.generateTexture('sticky_particle', 12, 12);
        stickyParticle.clear();
        
        // Create red impact particles
        const impactParticle = this.add.graphics({ willReadFrequently: true });
        impactParticle.fillStyle(0xcc3333, 1);
        impactParticle.fillRect(0, 0, 8, 8);
        impactParticle.generateTexture('impact_particle', 8, 8);
        impactParticle.clear();
    }

    createAudio() {
        // We'll use the Phaser sound manager to create a procedurally generated explosion sound
        try {
            // Create an audio context for programmatic sound creation
            const audioContext = this.sound.context;
            if (!audioContext) return;
            
            // Add explosion sound using Web Audio API
            const explosionBuffer = audioContext.createBuffer(1, 4096, audioContext.sampleRate);
            const explosionData = explosionBuffer.getChannelData(0);
            
            // Generate a noise burst for explosion sound
            for (let i = 0; i < explosionData.length; i++) {
                const t = i / explosionData.length;
                // Exponential decay
                const envelope = Math.pow(1 - t, 2);
                // Random noise
                explosionData[i] = (Math.random() * 2 - 1) * envelope;
            }
            
            // Add to the game's cache
            this.cache.audio.add('explosion', explosionBuffer);
            
        } catch (e) {
            console.log("Could not create audio:", e);
        }
    }
} 