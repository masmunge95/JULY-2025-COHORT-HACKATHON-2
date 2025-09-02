// --- DOM Elements ---
const topicForm = document.getElementById('topic-form');
const topicInput = document.getElementById('topic-input');
const topicFormContainer = document.getElementById('topic-form-container');
const discussionContainer = document.getElementById('discussion-container');
const loadingSpinner = document.getElementById('loading-spinner');
const chatInterface = document.getElementById('chat-interface');
const chatLog = document.getElementById('chat-log');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const discussionTitle = document.getElementById('discussion-title');

// Exit Modal Elements
const exitDiscussionButton = document.getElementById('exit-discussion-button');
const exitConfirmModal = document.getElementById('exit-confirm-modal');
const exitConfirmDialog = document.getElementById('exit-confirm-dialog');
const confirmExitButton = document.getElementById('confirm-exit-button');
const cancelExitButton = document.getElementById('cancel-exit-button');

// --- State ---
let currentTopic = '';
let chatHistory = [];

// --- Event Listeners ---
topicForm.addEventListener('submit', handleTopicSubmit);
chatForm.addEventListener('submit', handleChatSubmit);

/**
 * Sends the chat history to the backend and gets an AI response.
 * @param {string} topic The topic being discussed.
 * @param {object[]} history The chat history.
 * @returns {Promise<string>} The AI's response message.
 */
async function getAIResponse(topic, history) {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
        // Redirect to login if not authenticated
        window.location.href = 'index.html';
        return "Authentication error.";
    }

    try {
        const response = await fetch('http://127.0.0.1:8000/generate/discussion', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({ topic, history })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Failed to get AI response');
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Error getting AI response:', error);
        return "I'm having trouble connecting right now. Please try again in a moment.";
    }
}

/**
 * Handles the submission of the initial topic.
 * @param {Event} event The form submission event.
 */
async function handleTopicSubmit(event) {
    event.preventDefault();
    const topic = topicInput.value.trim();
    if (!topic) return;

    currentTopic = topic;
    chatHistory = []; // Reset history

    topicFormContainer.classList.add('hidden');
    discussionContainer.classList.remove('hidden');
    discussionTitle.textContent = `Discussion: ${topic}`;

    const initialMessage = await getAIResponse(currentTopic, chatHistory);

    loadingSpinner.classList.add('hidden');
    chatInterface.classList.remove('hidden');
    
    appendMessage(initialMessage, 'ai');
}

/**
 * Handles the submission of a chat message.
 * @param {Event} event The form submission event.
 */
async function handleChatSubmit(event) {
    event.preventDefault();
    const message = chatInput.value.trim();
    if (!message) return;

    appendMessage(message, 'user');
    chatInput.value = '';
    chatInput.disabled = true;

    const aiResponse = await getAIResponse(currentTopic, chatHistory);
    appendMessage(aiResponse, 'ai');
    chatInput.disabled = false;
    chatInput.focus();
}

/**
 * Appends a message to the chat log.
 * Appends a message to the chat log and history.
 * @param {string} text The message text.
 * @param {'user' | 'ai'} sender The sender of the message.
 */
function appendMessage(text, sender) {
    // Add to state
    chatHistory.push({ role: sender, content: text });

    // Add to DOM
    const messageDiv = document.createElement('div');
    messageDiv.className = `p-4 rounded-lg max-w-xl ${
        sender === 'user'
            ? 'bg-red-500 text-white self-end'
            : 'bg-gray-200 dark:bg-gray-700 text-black dark:text-white self-start'
    }`;
    messageDiv.textContent = text;
    
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = 'flex ' + (sender === 'user' ? 'justify-end' : 'justify-start');
    wrapperDiv.appendChild(messageDiv);
    
    chatLog.appendChild(wrapperDiv);
    chatLog.scrollTop = chatLog.scrollHeight; // Auto-scroll to the bottom
}

// --- Exit Modal Logic ---

function handleExitDiscussion() {
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
    exitDiscussionButton.addEventListener('click', handleExitDiscussion);
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