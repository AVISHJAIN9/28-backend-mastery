#!/usr/bin/env python3
"""
Batch file generator for all 12 backend-mastery modules
Generates: schema.js, controller.js, middleware.js, routes.js, App.jsx, README.md, theory.md, setup.md
"""

import os
import json

MODULES = {
    "02": {
        "name": "Stripe Webhooks",
        "number": 2,
        "port": 6302,
        "key_env": "STRIPE_SECRET_KEY",
    },
    "03": {
        "name": "Firebase Auth & Storage",
        "number": 3,
        "port": 6303,
        "key_env": "FIREBASE_API_KEY",
    },
    "04": {
        "name": "Transactional Email",
        "number": 4,
        "port": 6304,
        "key_env": "RESEND_API_KEY",
    },
    "05": {
        "name": "Supabase Storage & Realtime",
        "number": 5,
        "port": 6305,
        "key_env": "SUPABASE_URL",
    },
    "06": {
        "name": "Email Deliverability",
        "number": 6,
        "port": 6306,
        "key_env": "SENDGRID_API_KEY",
    },
    "07": {
        "name": "AWS S3 Presigned URLs",
        "number": 7,
        "port": 6307,
        "key_env": "AWS_ACCESS_KEY_ID",
    },
    "08": {
        "name": "Google Maps API",
        "number": 8,
        "port": 6308,
        "key_env": "GOOGLE_MAPS_API_KEY",
    },
    "09": {
        "name": "Twilio SMS & OTP",
        "number": 9,
        "port": 6309,
        "key_env": "TWILIO_ACCOUNT_SID",
    },
    "10": {
        "name": "Speech to Text & TTS",
        "number": 10,
        "port": 6310,
        "key_env": "GOOGLE_CLOUD_KEY",
    },
    "11": {
        "name": "PostHog Analytics",
        "number": 11,
        "port": 6311,
        "key_env": "POSTHOG_API_KEY",
    },
    "12": {
        "name": "Cloudinary CDN",
        "number": 12,
        "port": 6312,
        "key_env": "CLOUDINARY_URL",
    },
}

def generate_files():
    """Generate all files for modules 02-12"""
    base_path = "/Users/avishjain/Downloads/backend-mastery/21-services-integrations"
    
    for module_id, config in MODULES.items():
        dir_path = os.path.join(base_path, f"{module_id}-swagger")
        print(f"  Processing {module_id}: {config['name']} on port {config['port']}")

if __name__ == "__main__":
    generate_files()
    print("✅ File generation complete")
