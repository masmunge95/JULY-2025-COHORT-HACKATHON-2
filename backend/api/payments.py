from fastapi import APIRouter, Depends, HTTPException, Request
import httpx

from ..core.config import settings
from ..core.security import get_current_user
from ..core.dependencies import get_supabase_client
from ..models.models import User
from supabase import Client

router = APIRouter()

@router.post("/create_checkout_session")
async def create_checkout_session(current_user: User = Depends(get_current_user)):
    """
    Creates a payment link with InstaSend for the user to upgrade to premium.
    """
    headers = {
        "Authorization": f"Bearer {settings.INSTASEND_API_KEY}",
        "Content-Type": "application/json"
    }
    # The webhook URL where InstaSend will send a notification upon successful payment
    # This needs to be your publicly accessible backend URL.
    # For local testing, you might use a tool like ngrok.
    # For production, this will be your Render/Railway URL.
    # NOTE: This is a placeholder. You must replace it with your actual deployed backend URL.
    webhook_url = "https://your-backend-service-url.onrender.com/api/payments/instasend_webhook"

    payload = {
        "wallet_id": settings.INSTASEND_WALLET_ID,
        "amount": "9.99", # Premium price
        "currency": "USD",
        "method": "checkout",
        "customer": {
            "email": current_user.email
        },
        "metadata": {
            "user_id": str(current_user.id) # Pass user ID to identify on webhook
        },
        "redirect_url": f"{settings.FRONTEND_URL}/dashboard.html?payment=success",
        "webhook_url": webhook_url
    }

    async with httpx.AsyncClient() as client:
        response = await client.post("https://api.instasend.com/v1/payment", headers=headers, json=payload)

    if response.status_code != 201:
        raise HTTPException(status_code=500, detail=f"Failed to create payment session: {response.text}")

    payment_data = response.json()
    return {"checkout_url": payment_data["payment_url"]}

@router.post("/instasend_webhook")
async def instasend_webhook(request: Request, supabase: Client = Depends(get_supabase_client)):
    """
    Handles webhook notifications from InstaSend for successful payments.
    This endpoint must be publicly accessible and does not require user authentication.
    """
    data = await request.json()

    # Verify the event is a successful payment
    if data.get("event") == "payment.succeeded":
        payment_info = data.get("data", {})
        metadata = payment_info.get("metadata", {})
        user_id = metadata.get("user_id")

        if user_id:
            # 1. Update the user's profile to be premium
            supabase.table('profiles').update({"is_premium": True}).eq('id', user_id).execute()

            # 2. Log the payment in the payments table
            supabase.table('payments').insert({
                "user_id": user_id,
                "instasend_payment_id": payment_info.get("id"),
                "amount": payment_info.get("amount"),
                "currency": payment_info.get("currency")
            }).execute()

    return {"status": "received"}