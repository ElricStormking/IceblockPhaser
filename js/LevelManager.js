// LevelManager.js - Manages level data, progression and resources
class LevelManager {
    constructor(scene) {
        this.scene = scene;
        this.currentLevel = 1;
        this.maxLevels = 5;
        this.levelData = {};
        
        // Initialize with default values in case loading fails
        this.defaultLevelData = {
            1: {
                levelNumber: 1,
                chibiImage: 'chibi_girl1',
                victoryBackground: 'victoryBackground1',
                background: 'background1',
                targetPercentage: 85,
                bombsAvailable: {
                    blast_bomb: 3,
                    piercer_bomb: 0,
                    cluster_bomb: 1,
                    sticky_bomb: 5,
                    shatterer_bomb: 1,
                    driller_bomb: 3
                },
                unlockedBomb: null
            },
            2: {
                levelNumber: 2,
                chibiImage: 'chibi_girl2',
                victoryBackground: 'victoryBackground2',
                background: 'background2',
                targetPercentage: 85,
                bombsAvailable: {
                    blast_bomb: 3,
                    piercer_bomb: 2,
                    cluster_bomb: 0,
                    sticky_bomb: 0,
                    shatterer_bomb: 0,
                    driller_bomb: 3,
                    ricochet_bomb: 2
                },
                unlockedBomb: 'piercer_bomb'
            }
            // Levels 3, 4, 5 would be added here
        };
    }
    
    // Initialize the level manager and load level data
    async initialize() {
        try {
            console.log("Initializing LevelManager...");
            await this.loadLevelData();
            return true;
        } catch (error) {
            console.error("Error initializing LevelManager:", error);
            // Use default level data if loading fails
            this.levelData = this.defaultLevelData;
            return false;
        }
    }
    
    // Load specific level data - called from GameSceneRefactored
    async loadLevel(level) {
        try {
            console.log(`Loading data for level ${level}`);
            
            // Set the current level
            this.currentLevel = level;
            
            // If level data is not loaded yet, load all level data
            if (Object.keys(this.levelData).length === 0) {
                await this.loadLevelData();
            }
            
            return true;
        } catch (error) {
            console.error(`Error loading level ${level}:`, error);
            
            // Use default level data if available
            if (this.defaultLevelData[level]) {
                this.levelData[level] = this.defaultLevelData[level];
                return true;
            }
            
            return false;
        }
    }
    
    // Load level data from configuration files
    async loadLevelData() {
        try {
            // Create an object to store level data
            this.levelData = {};
            
            // Load data for each level
            for (let level = 1; level <= this.maxLevels; level++) {
                try {
                    // Try to fetch level configuration
                    const configPath = `assets/images/level${level}/level_config.json`;
                    const response = await fetch(configPath);
                    
                    if (response.ok) {
                        const levelConfig = await response.json();
                        
                        // Store the level data
                        this.levelData[level] = {
                            levelNumber: level,
                            chibiImage: `chibi_girl${level}`,
                            victoryBackground: `victoryBackground${level}`,
                            background: `background${level}`,
                            targetPercentage: 85, // Default, can be overridden by config
                            bombsAvailable: {}
                        };
                        
                        // Copy bomb availability from the config
                        if (levelConfig.bombAvailability) {
                            this.levelData[level].bombsAvailable = levelConfig.bombAvailability;
                            console.log(`Loaded bomb availability for level ${level}:`, this.levelData[level].bombsAvailable);
                        } else {
                            console.log(`No bomb availability config found for level ${level}, using defaults`);
                            // If no bomb availability found, use defaults from defaultLevelData or create them
                            if (this.defaultLevelData[level] && this.defaultLevelData[level].bombsAvailable) {
                                this.levelData[level].bombsAvailable = {...this.defaultLevelData[level].bombsAvailable};
                                console.log(`Using default bomb availability for level ${level}:`, this.levelData[level].bombsAvailable);
                            } else {
                                // Generate default bomb counts for this level
                                this.levelData[level].bombsAvailable = this.createDefaultBombCounts(level);
                                console.log(`Created default bomb counts for level ${level}:`, this.levelData[level].bombsAvailable);
                            }
                        }
                        
                        // Set the target percentage if provided in config
                        if (levelConfig.targetPercentage) {
                            this.levelData[level].targetPercentage = levelConfig.targetPercentage;
                        }
                        
                        // Set the unlocked bomb type if available
                        if (levelConfig.bombType) {
                            this.levelData[level].unlockedBomb = levelConfig.bombType;
                        }
                        
                        console.log(`Loaded configuration for level ${level}`);
                    } else {
                        console.warn(`No configuration found for level ${level}, using defaults`);
                        // If config doesn't exist, use default data
                        this.levelData[level] = this.defaultLevelData[level] || 
                                              this.createDefaultLevelData(level);
                    }
                } catch (levelError) {
                    console.warn(`Error loading level ${level} configuration:`, levelError);
                    // If loading fails, use default data
                    this.levelData[level] = this.defaultLevelData[level] || 
                                          this.createDefaultLevelData(level);
                }
            }
            
            console.log("Level data loaded successfully:", this.levelData);
            return true;
        } catch (error) {
            console.error("Error loading level data:", error);
            // Fallback to default data
            this.levelData = this.defaultLevelData;
            return false;
        }
    }
    
    // Create default level data for a level without configuration
    createDefaultLevelData(level) {
        console.log(`Creating default level data for level ${level}`);
        return {
            1: {
                levelNumber: 1,
                chibiImage: 'chibi_girl1',
                victoryBackground: 'victoryBackground1',
                background: 'background1',
                targetPercentage: 80,
                bombsAvailable: {
                    blast_bomb: 3,
                    piercer_bomb: 0,
                    cluster_bomb: 1,
                    sticky_bomb: 5,
                    shatterer_bomb: 1,
                    driller_bomb: 3,
                    ricochet_bomb: 0
                },
                unlockedBomb: null
            },
            2: {
                levelNumber: 2,
                chibiImage: 'chibi_girl2',
                victoryBackground: 'victoryBackground2',
                background: 'background2',
                targetPercentage: 85,
                bombsAvailable: {
                    blast_bomb: 3,
                    piercer_bomb: 2,
                    cluster_bomb: 0,
                    sticky_bomb: 0,
                    shatterer_bomb: 0,
                    driller_bomb: 3,
                    ricochet_bomb: 2
                },
                unlockedBomb: 'piercer_bomb'
            },
            3: {
                levelNumber: 3,
                chibiImage: 'chibi_girl3',
                victoryBackground: 'victoryBackground3',
                background: 'background3',
                targetPercentage: 85,
                bombsAvailable: {
                    blast_bomb: 3,
                    piercer_bomb: 3,
                    cluster_bomb: 2,
                    sticky_bomb: 0,
                    shatterer_bomb: 0,
                    driller_bomb: 3,
                    ricochet_bomb: 2
                },
                unlockedBomb: 'cluster_bomb'
            },
            4: {
                levelNumber: 4,
                chibiImage: 'chibi_girl4',
                victoryBackground: 'victoryBackground4',
                background: 'background4',
                targetPercentage: 85,
                bombsAvailable: {
                    blast_bomb: 3,
                    piercer_bomb: 3,
                    cluster_bomb: 2,
                    sticky_bomb: 2,
                    shatterer_bomb: 0,
                    driller_bomb: 3,
                    ricochet_bomb: 2
                },
                unlockedBomb: 'sticky_bomb'
            },
            5: {
                levelNumber: 5,
                chibiImage: 'chibi_girl5',
                victoryBackground: 'victoryBackground5',
                background: 'background5',
                targetPercentage: 90,
                bombsAvailable: {
                    blast_bomb: 3,
                    piercer_bomb: 3,
                    cluster_bomb: 2,
                    sticky_bomb: 2,
                    shatterer_bomb: 1,
                    driller_bomb: 3,
                    ricochet_bomb: 2
                },
                unlockedBomb: 'shatterer_bomb'
            }
        }[level] || this.createDefaultLevel1Data();
    }
    
    // Create default bomb counts for a level
    createDefaultBombCounts(level) {
        // Define a pattern of bombs per level
        return {
            blast_bomb: 3, // Always have some basic bombs
            piercer_bomb: Math.max(0, level - 1), // Start at level 2
            cluster_bomb: Math.max(0, level - 2), // Start at level 3
            sticky_bomb: Math.max(0, level - 2), // Start at level 3
            shatterer_bomb: Math.max(0, level - 3), // Start at level 4
            driller_bomb: Math.max(0, level - 3), // Start at level 4
            ricochet_bomb: level >= 2 ? 2 : 0 // Available from level 2
        };
    }
    
    // Get the current level data
    getCurrentLevelData() {
        return this.levelData[this.currentLevel] || this.defaultLevelData[1];
    }
    
    // Move to the next level
    nextLevel() {
        if (this.currentLevel < this.maxLevels) {
            this.currentLevel++;
            console.log(`Advanced to level ${this.currentLevel}`);
            return true;
            } else {
            console.log("Already at maximum level");
            return false;
        }
    }
    
    // Set a specific level
    setLevel(level) {
        if (level >= 1 && level <= this.maxLevels) {
            this.currentLevel = level;
            console.log(`Set to level ${this.currentLevel}`);
            return true;
        } else {
            console.warn(`Invalid level number: ${level}`);
            return false;
        }
    }
    
    // Check if there's a next level available
    hasNextLevel() {
        return this.currentLevel < this.maxLevels;
    }
    
    // Get bomb counts for the current level
    getBombCounts() {
        const levelData = this.getCurrentLevelData();
        console.log(`Getting bomb counts for level ${this.currentLevel}:`, levelData.bombsAvailable);
        
        if (!levelData.bombsAvailable) {
            console.warn(`No bomb data available for level ${this.currentLevel}, using defaults`);
            return this.defaultLevelData[1].bombsAvailable;
        }
        
        return levelData.bombsAvailable;
    }
    
    // Get image key for the current level's chibi
    getChibiImageKey() {
        const levelData = this.getCurrentLevelData();
        return levelData.chibiImage || `chibi_girl${this.currentLevel}`;
    }
    
    // Get background key for the current level
    getBackgroundKey() {
        const levelData = this.getCurrentLevelData();
        return levelData.background || `background${this.currentLevel}`;
    }
    
    // Get victory background key for the current level
    getVictoryBackgroundKey() {
        const levelData = this.getCurrentLevelData();
        return levelData.victoryBackground || `victoryBackground${this.currentLevel}`;
    }
    
    // Get target percentage for the current level
    getTargetPercentage() {
        const levelData = this.getCurrentLevelData();
        return levelData.targetPercentage || 85;
    }
    
    // Get the newly unlocked bomb type for the current level, if any
    getUnlockedBombType() {
        const levelData = this.getCurrentLevelData();
        return levelData.unlockedBomb || null;
    }
    
    // Check if this level has a new unlocked bomb
    hasUnlockedBomb() {
        return this.getUnlockedBombType() !== null;
    }
    
    // Fallback method if level data isn't found
    createDefaultLevel1Data() {
        console.log("Creating fallback level 1 data");
        return {
            levelNumber: 1,
            chibiImage: 'chibi_girl1',
            victoryBackground: 'victoryBackground1',
            background: 'background1',
            targetPercentage: 80,
            bombsAvailable: {
                blast_bomb: 3,
                piercer_bomb: 0,
                cluster_bomb: 1,
                sticky_bomb: 5,
                shatterer_bomb: 1,
                driller_bomb: 3,
                ricochet_bomb: 0
            },
            unlockedBomb: null
        };
    }
}

// Export the LevelManager class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LevelManager };
} else {
    // If not in Node.js, add to window object
    window.LevelManager = LevelManager;
} 