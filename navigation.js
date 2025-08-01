import { loadComments } from './comments.js';

export let currentWorkflow = 'text-to-image';
export let uploadedImage = null;
export let uploadedImage2 = null;

export function switchWorkflow(btn) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    document.querySelectorAll('.workflow').forEach(w => w.classList.remove('active'));
    document.getElementById(btn.dataset.workflow).classList.add('active');
    
    currentWorkflow = btn.dataset.workflow;
    
    if (btn.dataset.workflow === 'comment-to-x') {
        loadComments();
    }
}

export function getCurrentWorkflow() {
    return currentWorkflow;
}

export function setUploadedImage(image) {
    uploadedImage = image;
}

export function setUploadedImage2(image) {
    uploadedImage2 = image;
}

