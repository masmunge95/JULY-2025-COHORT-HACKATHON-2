import { supabase } from './supabaseClient.js';

// --- DOM Elements ---
const topicForm = document.getElementById('topic-form');
const topicInput = document.getElementById('topic-input');
const quizFormEl = document.getElementById('quiz-form');
const questionsContainer = document.getElementById('questions-container');
const quizActionsEl = document.getElementById('quiz-actions');
const loadingSpinner = document.getElementById('loading-spinner');
const quizTitleEl = document.getElementById('quiz-title');
const quizContainer = document.getElementById('quiz-container');
const topicFormContainer = document.getElementById('topic-form-container');
const quizResultsEl = document.getElementById('quiz-results');
const scoreTextEl = document.getElementById('score-text');
const exitConfirmModal = document.getElementById('exit-confirm-modal');
const exitConfirmDialog = document.getElementById('exit-confirm-dialog');
const confirmExitButton = document.getElementById('confirm-exit-button');
const cancelExitButton = document.getElementById('cancel-exit-button');

// --- Global State ---
let questions = [];
let currentTopic = '';

const BACKEND_URL = 'http://127.0.0.1:8000';

/**
 * Fetches quiz questions from the backend API.
 * @param {string} topic The topic for the quiz.
 * @returns {Promise<object[]>} A promise that resolves to an array of question objects.
 */
async function generateQuizFromAPI(topic) {
    console.log(`[API] Generating quiz for: "${topic}"`);
    try {
        const response = await fetch(`${BACKEND_URL}/generate_quiz`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Failed to parse error response.' }));
            throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching quiz from API:", error);
        throw error;
    }
}

/**
 * Creates a button element with the given properties.
 * @param {string} text - The button text.
 * @param {'button' | 'submit'} type - The button type.
 * @param {string} classNames - The CSS classes for the button.
 * @param {function(Event): void} [clickHandler] - Optional click event handler.
 * @returns {HTMLButtonElement} The created button element.
 */
function createButton(text, type, classNames, clickHandler) {
    const button = document.createElement('button');
    button.type = type;
    button.textContent = text;
    button.className = classNames;
    if (clickHandler) {
        button.addEventListener('click', clickHandler);
    }
    return button;
}

/**
 * Renders the quiz questions and options into a form.
 * @param {object[]} newQuestions The array of question objects.
 */
function renderQuiz(newQuestions) {
    questions = newQuestions; // Store questions for submission handling
    questionsContainer.innerHTML = ''; // Clear previous questions
    quizActionsEl.innerHTML = ''; // Clear previous actions

    questions.forEach((q, index) => {
        const questionBlock = document.createElement('div');
        questionBlock.className = 'question-block';

        const questionText = document.createElement('p');
        questionText.className = 'font-semibold text-lg mb-2';
        questionText.textContent = `${index + 1}. ${q.question}`;
        questionBlock.appendChild(questionText);

        const optionsList = document.createElement('div');
        optionsList.className = 'space-y-2';
        q.options.forEach(option => {
            const label = document.createElement('label');
            label.className = 'block p-3 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer';

            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = `question-${index}`;
            radio.value = option;
            radio.className = 'mr-2';
            radio.required = true;

            const span = document.createElement('span');
            span.textContent = option;

            label.appendChild(radio);
            label.appendChild(span);
            optionsList.appendChild(label);
        });
        questionBlock.appendChild(optionsList);
        questionsContainer.appendChild(questionBlock);
    });

    // Create Exit Button
    const exitButton = createButton(
        'Exit Quiz',
        'button',
        'font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline shadow-md hover:shadow-lg transition-all duration-300 bg-gray-600 hover:bg-gray-700 text-white dark:bg-gray-500 dark:hover:bg-gray-600',
        handleExitQuiz
    );
    quizActionsEl.appendChild(exitButton);

    // Create Submit Button
    const submitButton = createButton(
        'Submit Answers',
        'submit',
        'font-bold py-3 px-6 rounded-lg focus:outline-none focus:shadow-outline shadow-md hover:shadow-lg transition-all duration-300 bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600'
    );
    quizActionsEl.appendChild(submitButton);

    loadingSpinner.classList.add('hidden');
    quizFormEl.classList.remove('hidden');
}

/**
 * Handles the submission of the quiz form.
 * @param {Event} e The form submission event.
 */
async function handleSubmitQuiz(e) {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const formData = new FormData(e.target);
    let correctAnswers = 0;

    questions.forEach((q, index) => {
        if (formData.get(`question-${index}`) === q.answer) {
            correctAnswers++;
        }
    });

    const score = questions.length > 0 ? Math.round((correctAnswers / questions.length) * 100) : 0;

    scoreTextEl.textContent = `You scored ${score}% (${correctAnswers} out of ${questions.length} correct).`;
    quizContainer.classList.add('hidden');
    quizResultsEl.classList.remove('hidden');

    // Call the database function to upsert progress
    const { error } = await supabase.rpc('upsert_quiz_progress', {
        p_user_id: user.id,
        p_topic: currentTopic,
        p_new_score: score
    });

    if (error) {
        console.error('Error saving quiz progress:', error);
        alert('Could not save your results.');
    }
}

/**
 * Handles the click event for the exit button.
 */
function handleExitQuiz() {
        exitConfirmModal.classList.remove('hidden');
    // Use a small timeout to allow the browser to render the modal
    // before applying the transition classes.
    setTimeout(() => {
        exitConfirmDialog.classList.remove('opacity-0', 'scale-95');
    }, 10);
}

/**
 * Hides the exit confirmation modal.
 */
function closeExitModal() {
    exitConfirmDialog.classList.add('opacity-0', 'scale-95');
    // Wait for the transition to finish before hiding the modal completely.
    setTimeout(() => {
        exitConfirmModal.classList.add('hidden');
    }, 300); // This duration should match the transition duration in CSS.
}

/**
 * Sets up event listeners for the exit modal.
 */
function setupModalListeners() {
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

/**
 * Main function to initialize the page.
 */
async function main() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    topicForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const topic = topicInput.value.trim();
        if (!topic) return;

        currentTopic = topic; // Store topic for submission

        // UI updates
        topicFormContainer.classList.add('hidden');
        quizTitleEl.textContent = `Quiz on "${topic}"`;
        quizContainer.classList.remove('hidden');
        loadingSpinner.classList.remove('hidden');
        quizFormEl.classList.add('hidden');
        quizResultsEl.classList.add('hidden');

        try {
            const generatedQuestions = await generateQuizFromAPI(topic);
            renderQuiz(generatedQuestions);
        } catch (error) {
            loadingSpinner.classList.add('hidden');
            quizContainer.innerHTML = `<p class="text-red-500 text-center font-semibold">Failed to generate quiz: ${error.message}</p>`;
        }
    });

    quizFormEl.addEventListener('submit', handleSubmitQuiz);
    setupModalListeners();
}

document.addEventListener('DOMContentLoaded', main);
