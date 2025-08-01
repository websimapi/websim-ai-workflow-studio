import { initNavigation, switchWorkflow } from './navigation.js';
import { handleGenerateImage } from './textToImage.js';
import { handleGenerateSpeech } from './textToSpeech.js';
import { handleImageUpload, handleAnalyzeImage } from './imageToText.js';
import { handleChainUpload, handleStartChain } from './chainWorkflow.js';
import { handleCombineUpload, handleCombineImages } from './combineWorkflow.js';
import { loadComments, processComment, handleComment as commentHandler } from './comments.js';
import { downloadFile as downloadUtil } from './api.js';
import { generateImage as apiGenerateImage } from './api.js';

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize navigation
    initNavigation();
    
    // Set initial active workflow
    const initialBtn = document.querySelector('.nav-btn[data-workflow="text-to-image"]');
    if (initialBtn) {
        switchWorkflow(initialBtn);
    }
    
    // Initialize weight slider
    const slider = document.getElementById('weightSlider');
    const display = document.getElementById('weightDisplay');
    
    if (slider) {
        slider.addEventListener('input', (e) => {
            const value = e.target.value;
            display.textContent = `${value}% Image 1 / ${100-value}% Image 2`;
        });
    }
});

// Export global functions for HTML onclick handlers
window.generateImage = handleGenerateImage;
window.generateSpeech = handleGenerateSpeech;
window.handleImageUpload = handleImageUpload;
window.analyzeImage = handleAnalyzeImage;
window.handleChainUpload = handleChainUpload;
window.startChain = handleStartChain;
window.handleCombineUpload = handleCombineUpload;
window.combineImages = handleCombineImages;
window.processComment = processComment;
window.commentResult = commentHandler;
window.downloadImage = (url, filename) => downloadUtil(url, filename || 'ai-image.png');
window.downloadAudio = (url, filename) => downloadUtil(url, filename || 'ai-audio.mp3');

// Also ensure generateImage is available
window.generateImage = handleGenerateImage; // This is already correct for the HTML onclick

// Make sure we also have the API function available if needed
window.apiGenerateImage = apiGenerateImage;

// Export for module usage
export * from './api.js';
export * from './navigation.js';
export * from './textToImage.js';
export * from './textToSpeech.js';
export * from './imageToText.js';
export * from './chainWorkflow.js';
export * from './combineWorkflow.js';
export * from './comments.js';
export * from './state.js';