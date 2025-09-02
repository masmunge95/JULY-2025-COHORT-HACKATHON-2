import { supabase } from './supabaseClient.js';

// --- IMPORTANT ---
// This is a placeholder for your actual Instasend API key.
// In a real application, this key should NEVER be exposed on the frontend.
// All payment processing should happen on a secure backend server.
const INSTASEND_API_KEY = 'YOUR_INSTASEND_API_KEY_PLACEHOLDER';

document.addEventListener('DOMContentLoaded', async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return;
    }

    const paymentButtons = document.querySelectorAll('.pricing-card button');

    paymentButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            const plan = e.target.dataset.plan;
            const amount = e.target.dataset.amount;
            
            if (!plan || !amount) {
                alert('Could not determine payment plan. Please try again.');
                return;
            }

            // Disable button to prevent multiple clicks
            button.disabled = true;
            button.textContent = 'Processing...';

            try {
                // 1. SIMULATE BACKEND CALL TO INITIATE PAYMENT
                // In a real app, this would be a fetch() call to your own server endpoint.
                // Your server would then securely use the Instasend API.
                console.log(`Initiating payment for plan: ${plan}, amount: ${amount}`);
                const paymentResponse = await simulateInstasendPayment(user, plan, amount);

                if (paymentResponse.status === 'completed') {
                    // 2. RECORD PAYMENT IN SUPABASE
                    const { error: paymentError } = await supabase
                        .from('payments')
                        .insert({
                            user_id: user.id,
                            plan: plan,
                            amount: parseInt(amount),
                            status: 'completed'
                        });

                    if (paymentError) {
                        throw new Error(`Payment successful, but failed to update profile: ${paymentError.message}`);
                    }

                    // 3. SIMULATE SENDING RECEIPT EMAIL
                    // Your backend would handle this using MailerSend.
                    console.log(`Sending receipt for plan ${plan} to ${user.email}`);

                    alert(`Payment successful! Your ${plan} plan is now active.`);
                    window.location.href = 'dashboard.html';

                } else {
                    throw new Error(paymentResponse.message || 'Payment failed. Please try again.');
                }

            } catch (error) {
                alert(error.message);
                // Re-enable button on failure
                button.disabled = false;
                button.textContent = e.target.dataset.originalText;
            }
        });
    });
});

// This is a MOCK function. In a real app, this logic lives on your backend.
async function simulateInstasendPayment(user, plan, amount) {
    console.log(`[BACKEND SIM] Calling Instasend API with key ${INSTASEND_API_KEY.substring(0, 8)}... for user ${user.id}`);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate a successful payment
    return {
        status: 'completed',
        transaction_id: `isnd_${Math.random().toString(36).substring(2)}`
    };
}