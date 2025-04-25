const config = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    parent: 'game-container',
    backgroundColor: '#000000',
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
    scene: [
        BootScene,
        MainMenuScene,
        LoadingScene,
        GameScene,
        UIScene
    ]
};

window.addEventListener('load', () => {
    // Create the game instance
    const game = new Phaser.Game(config);
    
    // Add console logging to help debug
    console.log('Game initialized');
    
    // Add browser info for debugging
    console.log('Browser:', navigator.userAgent);
    console.log('Phaser version:', Phaser.VERSION);
    
    // Listen for errors
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.message);
    });
}); 