// --- Constants ---
const API_BASE_URL = 'http://localhost:8000/api';

// --- DOM Elements ---
const topicForm = document.getElementById('topic-form');
const topicInput = document.getElementById('topic-input');
const topicFormContainer = document.getElementById('topic-form-container');
const explanationContainer = document.getElementById('explanation-container');
const loadingSpinner = document.getElementById('loading-spinner');
const explanationInterface = document.getElementById('explanation-interface');
const explanationTitle = document.getElementById('explanation-title');
const followUpForm = document.getElementById('follow-up-form');

// Exit Modal Elements
const exitExplanationButton = document.getElementById('exit-explanation-button');
const exitConfirmModal = document.getElementById('exit-confirm-modal');
const exitConfirmDialog = document.getElementById('exit-confirm-dialog');
const confirmExitButton = document.getElementById('confirm-exit-button');
const cancelExitButton = document.getElementById('cancel-exit-button');

// --- Event Listeners ---
topicForm.addEventListener('submit', handleTopicSubmit);


/**
 * Populates the explanation interface with the generated content.
 * @param {string} topic The topic that was explained.
 * @param {string} explanationText The explanation text from the AI.
 */
function populateExplanation(topic, explanationText) {
    explanationTitle.textContent = `Explanation of: ${topic}`;

    // The AI response might have markdown-like newlines. Convert them to paragraphs for HTML display.
    const explanationHTML = explanationText.split('\n').filter(p => p.trim() !== '').map(p => `<p class="mb-4 text-lg leading-relaxed">${p}</p>`).join('');

    if (!explanationInterface) {
        console.error("Fatal Error: The 'explanation-interface' element was not found in the DOM.");
        alert("A fatal error occurred: could not display the explanation.");
        return;
    }
    explanationInterface.innerHTML = explanationHTML;
}

/**
 * Handles the submission of the initial topic by fetching an explanation from the backend.
 * @param {Event} event The form submission event.
 */
async function handleTopicSubmit(event) {
    event.preventDefault();
    const topic = topicInput.value.trim();
    if (!topic) return;
    
    // --- UI Updates for loading state ---
    topicFormContainer.classList.add('hidden');
    explanationContainer.classList.remove('hidden');
    explanationTitle.textContent = `Generating Explanation for: ${topic}`;
    loadingSpinner.classList.remove('hidden');
    explanationInterface.classList.add('hidden');
    followUpForm.classList.add('hidden');

    try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            throw new Error('Authentication error. Please log in again.');
        }

        const response = await fetch(`${API_BASE_URL}/content/generate_explanation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ topic })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'An unknown server error occurred.' }));
            const errorDetail = errorData.detail || 'Failed to generate explanation.';
            throw new Error(errorDetail);
        }

        const responseData = await response.json();
        populateExplanation(responseData.topic, responseData.explanation);
        explanationInterface.classList.remove('hidden');
        followUpForm.classList.remove('hidden');

    } catch (error) {
        console.error('Error generating explanation:', error);
        explanationTitle.textContent = 'Error';
        if (explanationInterface) {
            explanationInterface.innerHTML = `<p class="text-red-500 text-center">${error.message}</p>`;
            explanationInterface.classList.remove('hidden');
        } else {
            alert(`An error occurred: ${error.message}`);
        }
    } finally {
        loadingSpinner.classList.add('hidden');
    }
}

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
    exitExplanationButton.addEventListener('click', handleExit);
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

setupModalListeners();