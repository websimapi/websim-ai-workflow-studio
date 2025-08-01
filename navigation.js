// Navigation and workflow switching
import { loadComments } from './comments.js';
import { getAppState, updateAppState } from './app.js';

export function initNavigation() {
    // Override nav buttons
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => handleNavClick(btn));
    });
    
    // Initialize weight slider
    const slider = document.getElementById('weightSlider');
    const display = document.getElementById('weightDisplay');
    
    if (slider) {
        slider.addEventListener('input', (e) => {
            const value = e.target.value;
            display.textContent = `${value}% Image 1 / ${100-value}% Image 2`;
        });
    }
}

function handleNavClick(btn) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    document.querySelectorAll('.workflow').forEach(w => w.classList.remove('active'));
    document.getElementById(btn.dataset.workflow).classList.add('active');
    
    updateAppState({ currentWorkflow: btn.dataset.workflow });
    
    if (btn.dataset.workflow === 'comment-to-x') {
        loadComments();
    }
}