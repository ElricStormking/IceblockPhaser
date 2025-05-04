const config = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    parent: 'game-container',
    backgroundColor: '#000000',
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1920,
        height: 1080,
        min: {
            width: 960,
            height: 540
        },
        max: {
            width: 1920,
            height: 1080
        },
        zoom: 1,        // Default zoom level (can be adjusted)
        autoRound: true, // Round pixel values to avoid blurring
        expandParent: true
    },
    physics: {
        default: 'matter',
        matter: {
            debug: false,       // Set to true to see physics bodies
            gravity: { y: 1 },
            enableSleeping: false, // Disable sleeping for more consistent behavior
            setBounds: true,    // Enable bounds all around
            plugins: {
                attractors: true // Enable the attractors plugin for more control
            }
        }
    },
    input: {
        activePointers: 3,        // Allow tracking multiple touches at once
        smoothFactor: 0.1,        // Even lower smoothing for more responsive touch (0.2 -> 0.1)
        dragDistanceThreshold: 2, // Lower drag distance threshold further for better sensitivity
        dragTimeThreshold: 100,   // Lower time threshold for quicker response to dragging
        // Mobile-specific settings
        touch: {
            capture: true,        // Capture all touch events on the page
            target: document.body, // Set target to document.body for better touch event handling
            tapInterval: 300,     // Shorter tap interval for more responsive controls
            holdTime: 400,        // Shorter hold time for more responsive hold detection
            preventDefaultMove: true // Prevent default move behavior for drag actions
        }
    },
    loader: {
        baseURL: '',  // Empty string for base URL to ensure local paths
        path: './',   // Use relative path starting with ./ to ensure local access
        crossOrigin: false, // Disable CORS for local file loading
        maxParallelDownloads: 32, // Allow more parallel downloads for speed
        xhr: {
            // Prevent automatic URL prefixing by Phaser
            responseType: '',
            async: true,
            // Set withCredentials to false for local files
            withCredentials: false,
            // Don't let the XHR request append any server URL
            overrideMimeType: false
        }
    },
    render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false,
        transparent: false,
        clearBeforeRender: true,
        premultipliedAlpha: true,
        preserveDrawingBuffer: false,
        willReadFrequently: true // Add this option for better performance with frequent pixel operations
    },
    scene: [
        BootScene,
        MainMenuScene,
        LoadingScene,
        GameScene,
        UIScene
    ],
    // Disable right-click context menu on canvas
    disableContextMenu: true
};

window.addEventListener('load', () => {
    // Add CSS to prevent scrolling
    const style = document.createElement('style');
    style.textContent = `
        html, body {
            margin: 0;
            padding: 0;
            overflow: hidden;
            width: 100%;
            height: 100%;
            background-color: #000;
        }
        #game-container {
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
        }
        canvas {
            display: block;
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
        }
    `;
    document.head.appendChild(style);
    
    // Create the game instance
    const game = new Phaser.Game(config);
    
    // Add console logging to help debug
    console.log('Game initialized');
    
    // Add browser info for debugging
    console.log('Browser:', navigator.userAgent);
    console.log('Phaser version:', Phaser.VERSION);
    
    // Listen for window resize events
    window.addEventListener('resize', () => {
        // Notify game scale manager to update size
        if (game.scale) {
            // Log the new dimensions
            console.log(`Window resized: ${window.innerWidth}x${window.innerHeight}`);
            // Update the scale
            game.scale.refresh();
        }
    });
    
    // Listen for errors
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.message);
    });
}); 