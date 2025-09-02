// --- DOM Elements ---
const exitProfileButton = document.getElementById('exit-profile-button');
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
    if (!exitProfileButton) return; // Guard against the button not being on the page
    
    exitProfileButton.addEventListener('click', handleExit);
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
    // Other profile page initialization logic can go here.
});