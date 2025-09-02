// Import the Supabase client from your existing setup
import { supabase } from './supabaseClient.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Fetch the current user from Supabase auth
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
        // If a user is logged in, load their progress and milestones
        await loadProgress(user.id);
        await loadMilestones(user.id);
    } else {
        // Handle case where user is not logged in
        console.log("User not logged in. Cannot display progress.");
        // Optional: redirect to login page
        // window.location.href = '/login.html'; 
    }
});

/**
 * Fetches and displays the user's aggregated progress stats.
 * @param {string} userId - The UUID of the logged-in user.
 */
async function loadProgress(userId) {
    // Fetch all progress records for the user from the 'user_progress' table
    const { data, error } = await supabase
        .from('user_progress')
        .select('total_quizzes, avg_score, flashcards_studied')
        .eq('user_id', userId);

    const quizzesCompletedEl = document.getElementById('quizzes-completed');
    const averageScoreEl = document.getElementById('average-score');
    const flashcardsStudiedEl = document.getElementById('flashcards-studied');

    if (error) {
        console.error('Error fetching user progress:', error);
        quizzesCompletedEl.textContent = 'N/A';
        averageScoreEl.textContent = 'N/A';
        flashcardsStudiedEl.textContent = 'N/A';
        return;
    }

    if (data && data.length > 0) {
        // Aggregate the stats from all topics
        const totalQuizzes = data.reduce((sum, row) => sum + (row.total_quizzes || 0), 0);
        const totalFlashcards = data.reduce((sum, row) => sum + (row.flashcards_studied || 0), 0);
        
        // Calculate a weighted average for the score across all topics
        const totalScorePoints = data.reduce((sum, row) => sum + (row.avg_score || 0) * (row.total_quizzes || 0), 0);
        const totalQuizzesForAvg = data.reduce((sum, row) => sum + (row.total_quizzes || 0), 0);
        const averageScore = totalQuizzesForAvg > 0 ? (totalScorePoints / totalQuizzesForAvg) : 0;

        quizzesCompletedEl.textContent = totalQuizzes;
        averageScoreEl.textContent = `${Math.round(averageScore)}%`;
        flashcardsStudiedEl.textContent = totalFlashcards;
    } else {
        // If no progress records exist, display default values
        quizzesCompletedEl.textContent = 0;
        averageScoreEl.textContent = '0%';
        flashcardsStudiedEl.textContent = 0;
    }
}

/**
 * Fetches and displays the user's achieved milestones.
 * @param {string} userId - The UUID of the logged-in user.
 */
async function loadMilestones(userId) {
    const milestonesContainer = document.getElementById('milestones-container');
    milestonesContainer.innerHTML = '<p class="text-gray-500">Loading milestones...</p>';

    // Fetch all milestones for the user
    const { data, error } = await supabase
        .from('milestones')
        .select('milestone_name, milestone_description, achieved_at')
        .eq('user_id', userId)
        .order('achieved_at', { ascending: false });

    if (error) {
        console.error('Error fetching milestones:', error);
        milestonesContainer.innerHTML = '<p class="text-red-500">Could not load milestones.</p>';
        return;
    }

    if (data && data.length > 0) {
        milestonesContainer.innerHTML = ''; // Clear loading message
        data.forEach(milestone => {
            const milestoneEl = createMilestoneElement(
                milestone.milestone_name,
                milestone.milestone_description,
                milestone.achieved_at
            );
            milestonesContainer.appendChild(milestoneEl);
        });
    } else {
        milestonesContainer.innerHTML = '<p class="text-gray-500">No milestones achieved yet. Keep learning!</p>';
    }
}

// --- Milestone Badge Styling ---

// A mapping from milestone names (or parts of them) to badge styles.
// This is a simple way to add visual flair without changing the DB schema.
// You can expand this with more milestone names and styles.
const milestoneStyles = {
    'First Quiz': { color: 'green' },
    'Quiz Master': { color: 'yellow' },
    'Perfect Score': { color: 'blue' },
    'Study Streak': { color: 'purple' },
    'default': { color: 'gray' }
};

// Map of badge colors to Tailwind CSS classes
const badgeColorClasses = {
    green: { bg: 'bg-green-100 dark:bg-green-900/50', border: 'border-green-500', text: 'text-green-800 dark:text-green-200', icon: 'text-green-500' },
    blue: { bg: 'bg-blue-100 dark:bg-blue-900/50', border: 'border-blue-500', text: 'text-blue-800 dark:text-blue-200', icon: 'text-blue-500' },
    yellow: { bg: 'bg-yellow-100 dark:bg-yellow-900/50', border: 'border-yellow-500', text: 'text-yellow-800 dark:text-yellow-200', icon: 'text-yellow-500' },
    purple: { bg: 'bg-purple-100 dark:bg-purple-900/50', border: 'border-purple-500', text: 'text-purple-800 dark:text-purple-200', icon: 'text-purple-500' },
    gray: { bg: 'bg-gray-100 dark:bg-gray-700', border: 'border-gray-500', text: 'text-gray-800 dark:text-gray-200', icon: 'text-gray-500' }
};

// Map of badge icons to SVG paths (using Heroicons outline, 24x24)
const badgeIcons = {
    'trophy': '<path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9a9.75 9.75 0 1011.356-8.447 9.75 9.75 0 00-11.356 0M16.5 18.75a9.75 9.75 0 00-11.356 0M16.5 18.75v-1.5A2.25 2.25 0 0014.25 15h-6.5A2.25 2.25 0 005.5 17.25v1.5m3.25-6.375v-1.5a2.25 2.25 0 012.25-2.25h.5a2.25 2.25 0 012.25 2.25v1.5m-3.25-6.375V6.75a2.25 2.25 0 012.25-2.25h.5a2.25 2.25 0 012.25 2.25v1.5" />',
    'academic-cap': '<path d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.905 59.905 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0l-3.172 3.172a1 1 0 001.414 1.414L2.828 12.828l1.414-1.414zm16.97 0l3.172 3.172a1 1 0 001.414-1.414L19.172 11.414l-1.414-1.414z" />',
    'check-badge': '<path fill-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12c0 1.357-.6 2.573-1.549 3.397a4.49 4.49 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.491 4.491 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />',
    'fire': '<path stroke-linecap="round" stroke-linejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.362-1.44m0 0c1.007-.247 2.026-.38 3.084-.382M15.362 5.214C14.355 4.967 13.336 4.84 12.3 4.84c-1.036 0-2.055.127-3.062.374m0 0a8.003 8.003 0 00-4.28 7.777 8.003 8.003 0 004.28 7.777m0 0A8.287 8.287 0 009 9.6a8.983 8.983 0 013.362-1.44m0 0c1.007-.247 2.026-.38 3.084-.382M15.362 5.214a8.252 8.252 0 0112 21 8.25 8.25 0 01-6.038-13.952 8.287 8.287 0 00-3.362 1.44" />',
    'star': '<path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />'
};

/**
 * Creates and returns an HTML element for a single milestone badge.
 * @param {string} title - The name of the milestone.
 * @param {string} description - The description of the milestone.
 * @param {string} date - The ISO date string when the milestone was achieved.
 * @returns {HTMLElement} The created div element for the milestone.
 */
function createMilestoneElement(title, description, date) {
    // Find a style that matches the milestone title for dynamic badge styling
    const styleKey = Object.keys(milestoneStyles).find(key => title.includes(key)) || 'default';
    const style = milestoneStyles[styleKey];

    const color = badgeColorClasses[style.color] || badgeColorClasses.default;
    const iconSVG = badgeIcons['trophy']; // Always use the trophy icon per user request

    const formattedDate = new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });

    const element = document.createElement('div');
    // Classes for a card-like box with a top border accent
    element.className = `bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col items-center text-center transition-transform duration-300 hover:scale-105 cursor-pointer border-t-4 ${color.border}`;
    
    element.innerHTML = `
        <div class="mb-4">
            <svg class="w-16 h-16 ${color.icon}" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                ${iconSVG}
            </svg>
        </div>
        <p class="font-bold text-lg text-gray-800 dark:text-white">${title}</p>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">${description}</p>
        <p class="text-xs text-gray-500 dark:text-gray-500 mt-3 font-medium">Achieved: ${formattedDate}</p>
    `;
    return element;
}