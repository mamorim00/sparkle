#!/usr/bin/env node

/**
 * Stripe Setup Checker
 * Verifies that all necessary Stripe environment variables are configured
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Checking Stripe Configuration...\n');

// Check .env.local file
const envPath = path.join(__dirname, '..', '.env.local');
let envVars = {};

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });
  console.log('✅ Found .env.local file\n');
} else {
  console.log('❌ .env.local file not found\n');
  process.exit(1);
}

// Required variables
const requiredVars = {
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': 'Stripe Publishable Key (client-side)',
  'STRIPE_SECRET_KEY': 'Stripe Secret Key (server-side)',
  'STRIPE_WEBHOOK_SECRET': 'Stripe Webhook Secret (for webhook signature verification)',
};

// Optional but recommended
const optionalVars = {
  'FIREBASE_PROJECT_ID': 'Firebase Project ID (for Admin SDK)',
  'FIREBASE_CLIENT_EMAIL': 'Firebase Service Account Email',
  'FIREBASE_PRIVATE_KEY': 'Firebase Service Account Private Key',
};

let allGood = true;

console.log('📋 Required Environment Variables:\n');

Object.entries(requiredVars).forEach(([key, description]) => {
  const value = envVars[key];
  if (value) {
    // Mask the value for security
    const masked = value.substring(0, 12) + '...' + value.substring(value.length - 4);
    console.log(`  ✅ ${key}`);
    console.log(`     ${description}`);
    console.log(`     Value: ${masked}\n`);

    // Check if it's test or live mode
    if (key === 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY') {
      if (value.startsWith('pk_test_')) {
        console.log(`     ⚠️  TEST MODE - Remember to switch to live keys for production\n`);
      } else if (value.startsWith('pk_live_')) {
        console.log(`     🔴 LIVE MODE - Real payments will be processed\n`);
      }
    }

    if (key === 'STRIPE_SECRET_KEY') {
      if (value.startsWith('sk_test_')) {
        console.log(`     ⚠️  TEST MODE - Remember to switch to live keys for production\n`);
      } else if (value.startsWith('sk_live_')) {
        console.log(`     🔴 LIVE MODE - Real payments will be processed\n`);
      }
    }
  } else {
    console.log(`  ❌ ${key} - MISSING`);
    console.log(`     ${description}\n`);
    allGood = false;
  }
});

console.log('\n📋 Optional Environment Variables (for Server-side Firebase):\n');

Object.entries(optionalVars).forEach(([key, description]) => {
  const value = envVars[key];
  if (value) {
    const masked = value.length > 20
      ? value.substring(0, 12) + '...' + value.substring(value.length - 4)
      : value;
    console.log(`  ✅ ${key}`);
    console.log(`     Value: ${masked}\n`);
  } else {
    console.log(`  ⚠️  ${key} - Not set`);
    console.log(`     ${description}`);
    console.log(`     Note: Required for API routes that use Firebase Admin SDK\n`);
  }
});

// Summary
console.log('\n' + '='.repeat(60));
if (allGood) {
  console.log('✅ All required Stripe variables are configured!');
  console.log('\nNext steps:');
  console.log('1. Set up webhook in Stripe Dashboard');
  console.log('2. Add environment variables to Vercel');
  console.log('3. Test webhook with: stripe listen --forward-to localhost:3000/api/webhooks/stripe');
  console.log('\nSee STRIPE_SETUP.md for detailed instructions.');
} else {
  console.log('❌ Some required variables are missing.');
  console.log('\nPlease add them to .env.local file:');
  Object.entries(requiredVars).forEach(([key, description]) => {
    if (!envVars[key]) {
      console.log(`  ${key}=your_${key.toLowerCase()}_here`);
    }
  });
}
console.log('='.repeat(60) + '\n');

process.exit(allGood ? 0 : 1);
