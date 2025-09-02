document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const API_BASE_URL = 'http://localhost:8000'; // Your FastAPI backend URL

    // --- DOM Elements ---
    const topicForm = document.getElementById('topic-form');
    const topicInput = document.getElementById('topic-input');
    const topicFormContainer = document.getElementById('topic-form-container');
    const flashcardContainer = document.getElementById('flashcard-container');
    const flashcardsTitle = document.getElementById('flashcards-title'); // Assuming this exists
    const flashcardActions = document.getElementById('flashcard-actions');
    const loadingSpinner = document.getElementById('loading-spinner');

    // Exit Modal Elements
    const exitFlashcardsButton = document.getElementById('exit-flashcards-button');
    const exitConfirmModal = document.getElementById('exit-confirm-modal');
    const exitConfirmDialog = document.getElementById('exit-confirm-dialog');
    const confirmExitButton = document.getElementById('confirm-exit-button');
    const cancelExitButton = document.getElementById('cancel-exit-button');

    // --- Event Listeners ---
    if (topicForm) {
        topicForm.addEventListener('submit', handleTopicSubmit);
    }

    /**
     * Handles the submission of the initial topic.
     * @param {Event} event The form submission event.
     */
    async function handleTopicSubmit(event) {
        event.preventDefault();
        const topic = topicInput.value.trim();
        if (!topic) return;

        // --- UI Updates: Show loading state ---
        topicFormContainer?.classList.add('hidden');
        flashcardContainer?.classList.add('hidden'); // Hide container until populated
        flashcardActions?.classList.add('hidden');
        loadingSpinner?.classList.remove('hidden');
        if (flashcardsTitle) {
            flashcardsTitle.textContent = `Flashcards for: ${topic}`;
        }

        try {
            // --- API Call to the FastAPI backend ---
            const response = await fetch(`${API_BASE_URL}/generate_flashcards`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify({ topic: topic })
            });

            if (!response.ok) {
                let errorDetail = 'Failed to generate flashcards. The server returned an error.';
                try {
                    const errorData = await response.json();
                    // FastAPI validation errors are often in errorData.detail.
                    // It can be a string or an array of objects.
                    if (errorData && errorData.detail) {
                        errorDetail = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail, null, 2);
                    }
                } catch (e) { /* Response was not JSON, use the default error message. */ }
                throw new Error(errorDetail);
            }

            const responseData = await response.json();

            // The backend might return a wrapped object { "flashcards": [...] } or just the array [...].
            // This handles both cases to be robust.
            const flashcardsArray = Array.isArray(responseData) ? responseData : responseData.flashcards;

            // Final check to ensure we ended up with a valid array.
            if (!Array.isArray(flashcardsArray)) {
                console.error("Could not find a valid 'flashcards' array in the server response:", responseData);
                throw new Error('The server response did not contain a valid list of flashcards. See console for details.');
            }
            populateFlashcards(flashcardsArray);

        } catch (error) {
            console.error('Error generating flashcards:', error);
            if (flashcardContainer) {
                flashcardContainer.innerHTML = `<p class="text-red-500 text-center col-span-full">${error.message}</p>`;
            }
        } finally {
            // --- UI Updates: Hide loading state and show content ---
            loadingSpinner?.classList.add('hidden');
            flashcardContainer?.classList.remove('hidden');
            flashcardActions?.classList.remove('hidden');
        }
    }

    /**
     * Creates and appends flashcard elements to the container.
     * @param {object[]} flashcards - Array of flashcard data with `question` and `answer`.
     */
    function populateFlashcards(flashcards) {
        if (!flashcardContainer) return;
        flashcardContainer.innerHTML = ''; // Clear previous content
        if (!flashcards || flashcards.length === 0) {
            flashcardContainer.innerHTML = `<p class="text-gray-500 text-center col-span-full">No flashcards generated for this topic.</p>`;
            return;
        }

        flashcards.forEach(cardData => {
            const cardElement = document.createElement('div');
            // The backend model was updated from {front, back} to {question, answer}.
            // We check for both to be robust against different backend versions.
            const question = cardData.question || cardData.front;
            const answer = cardData.answer || cardData.back;

            cardElement.className = 'flashcard relative h-64 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg cursor-pointer transition-transform duration-500 [transform-style:preserve-3d]';
            cardElement.innerHTML = `
                <div class="front absolute inset-0 w-full h-full flex items-center justify-center bg-white dark:bg-gray-800 rounded-xl [backface-visibility:hidden]">
                    <p class="text-xl font-semibold text-center p-4">${question || 'Error: Question not found'}</p>
                </div>
                <div class="back absolute inset-0 w-full h-full flex items-center justify-center bg-red-100 dark:bg-red-900/50 rounded-xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
                    <p class="text-md p-4 text-center">${answer || 'Error: Answer not found'}</p>
                </div>
            `;
            cardElement.addEventListener('click', () => {
                cardElement.classList.toggle('is-flipped');
            });
            flashcardContainer.appendChild(cardElement);
        });
    }

    /**
     * Resets the view to the initial topic selection form.
     */
    function resetView() {
        topicFormContainer?.classList.remove('hidden');
        flashcardContainer?.classList.add('hidden');
        flashcardActions?.classList.add('hidden');
        if (flashcardContainer) flashcardContainer.innerHTML = '';
        if (topicInput) topicInput.value = '';
        if (flashcardsTitle) {
            flashcardsTitle.textContent = 'Create Flashcards'; // Reset title
        }
    }

    // --- Exit Modal Logic ---

    function handleExit() {
        if (exitConfirmModal && exitConfirmDialog) {
            exitConfirmModal.classList.remove('hidden');
            exitConfirmModal.classList.add('flex');
            setTimeout(() => {
                exitConfirmDialog.classList.remove('opacity-0', 'scale-95');
            }, 10);
        }
    }

    function closeExitModal() {
        if (exitConfirmModal && exitConfirmDialog) {
            exitConfirmDialog.classList.add('opacity-0', 'scale-95');
            setTimeout(() => {
                exitConfirmModal.classList.add('hidden');
                exitConfirmModal.classList.remove('flex');
            }, 300);
        }
    }

    function setupModalListeners() {
        if (exitFlashcardsButton && confirmExitButton && cancelExitButton && exitConfirmModal) {
            exitFlashcardsButton.addEventListener('click', handleExit);
            confirmExitButton.addEventListener('click', () => {
                closeExitModal();
                resetView();
            });
            cancelExitButton.addEventListener('click', closeExitModal);
            exitConfirmModal.addEventListener('click', (event) => {
                if (event.target === exitConfirmModal) {
                    closeExitModal();
                }
            });
        }
    }

    setupModalListeners();
});