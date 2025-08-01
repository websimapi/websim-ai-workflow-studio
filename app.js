// Main application initialization and state management
import { initNavigation } from './navigation.js';

// Global application state
let appState = {
    currentWorkflow: 'text-to-image',
    uploadedImage: null,
    uploadedImage2: null,
    lastGeneratedImage: null,
    lastGeneratedText: null,
    lastGeneratedAudio: null,
    selectedComment: null,
    commentImages: []
};

// State management functions
export function getAppState() {
    return { ...appState };
}

export function updateAppState(updates) {
    appState = { ...appState, ...updates };
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
});