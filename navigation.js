// modules/navigation.js
export function initializeNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => handleNavigation(btn));
    });
}

function handleNavigation(btn) {
    // Remove active state from all buttons
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    // Hide all workflows
    document.querySelectorAll('.workflow').forEach(w => w.classList.remove('active'));
    
    // Show selected workflow
    const targetWorkflow = document.getElementById(btn.dataset.workflow);
    targetWorkflow.classList.add('active');
    
    // Update global state
    window.AppState.currentWorkflow = btn.dataset.workflow;
    
    // Special handling for comment-to-x
    if (btn.dataset.workflow === 'comment-to-x') {
        window.loadComments();
    }
}