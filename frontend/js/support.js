// --- DOM Elements ---
const exitSupportButton = document.getElementById('exit-support-button');
const exitConfirmModal = document.getElementById('exit-confirm-modal');
const exitConfirmDialog = document.getElementById('exit-confirm-dialog');
const confirmExitButton = document.getElementById('confirm-exit-button');
const cancelExitButton = document.getElementById('cancel-exit-button');

// --- Exit Modal Logic ---

function handleExit() {
    exitConfirmModal.classList.remove('hidden');
    setTimeout(() => {
        exitConfirmDialog.classList.remove('opacity-0', 'scale-95');
    }, 10);
}

function closeExitModal() {
    exitConfirmDialog.classList.add('opacity-0', 'scale-95');
    setTimeout(() => {
        exitConfirmModal.classList.add('hidden');
    }, 300);
}

function setupModalListeners() {
    if (!exitSupportButton) return; // Guard against the button not being on the page
    
    exitSupportButton.addEventListener('click', handleExit);
    confirmExitButton.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
    cancelExitButton.addEventListener('click', closeExitModal);
    exitConfirmModal.addEventListener('click', (event) => {
        if (event.target === exitConfirmModal) {
            closeExitModal();
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setupModalListeners();
});