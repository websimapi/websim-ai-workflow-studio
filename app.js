// Main application entry point
import { initializeNavigation } from './modules/navigation.js';
import { initializeWorkflows } from './modules/workflows/index.js';
import { initializeComments } from './modules/comments.js';

// Global state container
window.AppState = {
    currentWorkflow: 'text-to-image',
    uploadedImage: null,
    uploadedImage2: null,
    lastGeneratedImage: null,
    lastGeneratedText: null,
    lastGeneratedAudio: null,
    selectedComment: null,
    commentImages: []
};

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    initializeNavigation();
    initializeWorkflows();
    initializeComments();
});