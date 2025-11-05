#!/bin/bash

# Vercel Environment Variables Setup Script
# This script helps you set up Stripe environment variables in Vercel

echo "🚀 Vercel Environment Variables Setup"
echo "======================================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI is not installed."
    echo ""
    echo "Install it with:"
    echo "  npm install -g vercel"
    echo ""
    exit 1
fi

echo "✅ Vercel CLI is installed"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ .env.local file not found"
    echo "Please create .env.local with your Stripe keys first"
    exit 1
fi

echo "📋 This script will help you set up these environment variables in Vercel:"
echo "  - STRIPE_SECRET_KEY"
echo "  - STRIPE_WEBHOOK_SECRET"
echo "  - FIREBASE_PROJECT_ID"
echo "  - FIREBASE_CLIENT_EMAIL"
echo "  - FIREBASE_PRIVATE_KEY"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi

echo ""
echo "📝 Make sure you have:"
echo "  1. Created a webhook endpoint in Stripe Dashboard"
echo "  2. Copied the webhook signing secret (whsec_...)"
echo ""
read -p "Have you done this? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "⚠️  Please complete these steps first:"
    echo "  1. Go to https://dashboard.stripe.com/test/webhooks"
    echo "  2. Click 'Add endpoint'"
    echo "  3. Enter URL: https://YOUR-APP.vercel.app/api/webhooks/stripe"
    echo "  4. Select event: checkout.session.completed"
    echo "  5. Copy the signing secret"
    echo ""
    exit 1
fi

echo ""
echo "🔐 Setting environment variables in Vercel..."
echo ""

# Get values from .env.local
source .env.local

# Set Stripe variables
echo "Setting STRIPE_SECRET_KEY..."
vercel env add STRIPE_SECRET_KEY production <<< "$STRIPE_SECRET_KEY"

echo ""
read -p "Enter your PRODUCTION webhook secret (whsec_...): " WEBHOOK_SECRET
vercel env add STRIPE_WEBHOOK_SECRET production <<< "$WEBHOOK_SECRET"

# Set Firebase variables
if [ -n "$FIREBASE_PROJECT_ID" ]; then
    echo ""
    echo "Setting FIREBASE_PROJECT_ID..."
    vercel env add FIREBASE_PROJECT_ID production <<< "$FIREBASE_PROJECT_ID"
fi

if [ -n "$FIREBASE_CLIENT_EMAIL" ]; then
    echo ""
    echo "Setting FIREBASE_CLIENT_EMAIL..."
    vercel env add FIREBASE_CLIENT_EMAIL production <<< "$FIREBASE_CLIENT_EMAIL"
fi

if [ -n "$FIREBASE_PRIVATE_KEY" ]; then
    echo ""
    echo "Setting FIREBASE_PRIVATE_KEY..."
    vercel env add FIREBASE_PRIVATE_KEY production <<< "$FIREBASE_PRIVATE_KEY"
fi

echo ""
echo "✅ Environment variables configured!"
echo ""
echo "📤 Next steps:"
echo "  1. Deploy to Vercel: git push"
echo "  2. Or trigger redeploy: vercel --prod"
echo "  3. Test webhook in Stripe Dashboard"
echo ""
echo "💡 Tip: You can view your env vars with:"
echo "  vercel env ls"
echo ""
