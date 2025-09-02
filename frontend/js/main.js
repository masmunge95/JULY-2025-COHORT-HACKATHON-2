import { supabase } from './supabaseClient.js';

const logoutButton = document.getElementById('logout-button');
const userEmailSpan = document.getElementById('user-email');
const userAvatar = document.getElementById('user-avatar');

async function setupHeader() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    if (userEmailSpan) {
        userEmailSpan.textContent = user.email;
    }

    if (userAvatar) {
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('avatar_url')
            .eq('id', user.id)
            .single();
        
        if (profile && profile.avatar_url) {
            userAvatar.src = profile.avatar_url;
        } else {
            userAvatar.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`;
        }
    }
}

logoutButton.addEventListener('click', async () => {
    await supabase.auth.signOut();
    window.location.href = 'index.html';
});

document.addEventListener('DOMContentLoaded', setupHeader);