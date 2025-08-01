// Workflow navigation and switching logic
import { state } from './state.js';

export function initNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => handleNavClick(btn));
    });
}

function handleNavClick(btn) {
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    document.querySelectorAll('.workflow').forEach(w => w.classList.remove('active'));
    document.getElementById(btn.dataset.workflow).classList.add('active');
    
    state.currentWorkflow = btn.dataset.workflow;
    
    if (btn.dataset.workflow === 'comment-to-x') {
        import('./comments.js').then(module => module.loadComments());
    }
}

// Export for backward compatibility
window.originalNavClick = handleNavClick;