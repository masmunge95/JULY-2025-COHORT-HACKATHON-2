// --- Supabase Client Initialization ---
// IMPORTANT: Replace with your actual Supabase URL and Anon Key
const SUPABASE_URL = 'https://ssmddcoxoocqitjjlnfs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNzbWRkY294b29jcWl0ampsbmZzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MzAyMDUsImV4cCI6MjA3MjIwNjIwNX0.bSDGrMrYPSN0R_QoY0QehNENYZjs7jU_uueScvP_MlQ';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Supabase URL and Anon Key are required. Make sure to update them in forgot-password.js");
}
// The 'supabase' object is globally available from the Supabase CDN script.
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// --- Get DOM Elements ---
const forgotPasswordForm = document.getElementById('forgot-password-form');
const sendLinkButton = document.getElementById('send-link-button');
const formMessage = document.getElementById('form-message');

// --- Event Listeners ---
forgotPasswordForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = forgotPasswordForm.email.value;
    sendLinkButton.disabled = true;
    sendLinkButton.textContent = 'Sending...';
    formMessage.classList.add('hidden');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password.html`, // URL to your password update page
    });

    if (error) {
        showMessage(`Error: ${error.message}`, 'error');
    } else {
        showMessage('Password reset link has been sent to your email address. Please check your inbox.', 'success');
        forgotPasswordForm.reset();
    }

    sendLinkButton.disabled = false;
    sendLinkButton.textContent = 'Send Reset Link';
});

// --- Helper Functions ---
function showMessage(message, type = 'error') {
    formMessage.textContent = message;
    formMessage.className = `text-sm ${type === 'error' ? 'text-red-500' : 'text-green-600'}`;
    formMessage.classList.remove('hidden');
}