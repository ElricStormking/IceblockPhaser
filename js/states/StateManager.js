// StateManager.js - Handles game state transitions
class StateManager {
    constructor(scene) {
        this.scene = scene;
        this.states = {};
        this.currentState = null;
        this.previousState = null;
    }
    
    // Register a new state
    registerState(name, state) {
        this.states[name] = state;
        console.log(`Registered state: ${name}`);
    }
    
    // Change to a different state
    setState(stateName, stateData = {}) {
        // Check if the state exists
        if (!this.states[stateName]) {
            console.error(`State '${stateName}' does not exist`);
            return false;
        }
        
        // Skip if we're already in this state
        if (this.currentState && this.currentState.name === stateName) {
            console.log(`Already in state: ${stateName}`);
            return true;
        }
        
        console.log(`Changing state from ${this.currentState ? this.currentState.name : 'none'} to ${stateName}`);
        
        // Exit current state if it exists
        if (this.currentState && typeof this.currentState.exit === 'function') {
            this.currentState.exit();
        }
        
        // Store previous state
        this.previousState = this.currentState;
        
        // Set new state
        this.currentState = this.states[stateName];
        this.currentState.name = stateName; // Ensure the name is set on the state
        
        // Enter new state
        if (typeof this.currentState.enter === 'function') {
            this.currentState.enter(stateData);
        }
        
        // Emit state change event
        this.scene.events.emit('stateChanged', stateName, stateData);
        
        return true;
    }
    
    // Go back to the previous state
    goToPreviousState(stateData = {}) {
        if (!this.previousState) {
            console.warn("No previous state to return to");
            return false;
        }
        
        return this.setState(this.previousState.name, stateData);
    }
    
    // Get the current state name
    getCurrentStateName() {
        return this.currentState ? this.currentState.name : null;
    }
    
    // Update the current state
    update(time, delta) {
        if (this.currentState && typeof this.currentState.update === 'function') {
            this.currentState.update(time, delta);
        }
    }
    
    // Clean up resources
    cleanup() {
        // Exit current state if it exists
        if (this.currentState && typeof this.currentState.exit === 'function') {
            this.currentState.exit();
        }
        
        // Clear state references
        this.states = {};
        this.currentState = null;
        this.previousState = null;
        
        console.log("StateManager resources cleaned up");
    }
}

// Export the StateManager class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StateManager };
} else {
    // If not in Node.js, add to window object
    window.StateManager = StateManager;
} 