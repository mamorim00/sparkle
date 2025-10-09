# Firebase Admin SDK Setup

You need Firebase Admin credentials for the Stripe Connect API routes.

## Step 1: Download Service Account Key

1. Go to Firebase Console: https://console.firebase.google.com/project/sparkle-86740/settings/serviceaccounts/adminsdk

2. Click "Generate new private key"

3. A JSON file will download with this structure:
```json
{
  "type": "service_account",
  "project_id": "sparkle-86740",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@sparkle-86740.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "...",
  "token_uri": "...",
  "auth_provider_x509_cert_url": "...",
  "client_x509_cert_url": "..."
}
```

## Step 2: Add to .env.local

Add these lines to your `.env.local` file:

```bash
# Firebase Admin SDK (for server-side API routes)
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@sparkle-86740.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

**Important:**
- Keep the quotes around the private key
- Keep the `\n` characters in the key (don't replace them)
- DO NOT commit this file to git (it's already in .gitignore)

## Step 3: Add to Vercel (for production)

In Vercel project settings → Environment Variables, add:

```
FIREBASE_CLIENT_EMAIL = firebase-adminsdk-xxxxx@sparkle-86740.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY = -----BEGIN PRIVATE KEY-----
YOUR_PRIVATE_KEY_HERE
-----END PRIVATE KEY-----
```

For the private key in Vercel:
- Paste the entire key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
- Include the actual newlines (not `\n` - Vercel handles this differently)

## Step 4: Restart Dev Server

After adding the variables:
```bash
# Stop the dev server (Ctrl+C)
# Start it again
npm run dev
```

## Alternative: Use existing service account

If you already have `firebase-adminsdk-fbsvc@sparkle-86740.iam.gserviceaccount.com` configured in your functions, you can use those same credentials in your Next.js app.
