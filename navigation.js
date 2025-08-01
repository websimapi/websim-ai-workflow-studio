import { loadComments } from './comments.js';

// Initialize navigation
export function initNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchWorkflow(btn));
    });
}

export function switchWorkflow(btn) {
    if (!btn) return;
    
    // Remove active class from all buttons
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Hide all workflows
    document.querySelectorAll('.workflow').forEach(w => w.classList.remove('active'));
    
    // Show selected workflow
    const targetId = btn.dataset.workflow;
    const targetWorkflow = document.getElementById(targetId);
    if (targetWorkflow) {
        targetWorkflow.classList.add('active');
        
        // Load comments if switching to comment-to-x
        if (targetId === 'comment-to-x') {
            loadComments();
        }
    }
}

// Export current state
export let currentWorkflow = 'text-to-image';

export let uploadedImage = null;
export let uploadedImage2 = null;

export function getCurrentWorkflow() {
    return currentWorkflow;
}

export function setUploadedImage(image) {
    uploadedImage = image;
    window.uploadedImage = image; // Make sure it's available globally
}

export function setUploadedImage2(image) {
    uploadedImage2 = image;
    window.uploadedImage2 = image; // Make sure it's available globally
}