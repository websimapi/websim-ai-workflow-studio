// Global state management
export const state = {
    currentWorkflow: 'text-to-image',
    uploadedImage: null,
    uploadedImage2: null,
    lastGeneratedImage: null,
    lastGeneratedText: null,
    lastGeneratedAudio: null,
    selectedComment: null,
    commentImages: []
};

// Re-export for backward compatibility
window.state = state;

