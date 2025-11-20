/**
 * Script to add coordinates to existing cleaners who don't have them yet
 * This is a one-time migration script
 *
 * Usage:
 * 1. Make sure you have your Firebase credentials set up
 * 2. Run: node scripts/add-coordinates-to-cleaners.js
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'sparkle-86740',
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Default coordinates for common cities
const cityCoordinates = {
  'Helsinki': { lat: 60.1699, lng: 24.9384 },
  'Dublin': { lat: 53.3498, lng: -6.2603 },
  'Espoo': { lat: 60.2055, lng: 24.6559 },
  'Vantaa': { lat: 60.2934, lng: 25.0378 },
  'Tampere': { lat: 61.4978, lng: 23.7610 },
};

async function addCoordinatesToCleaners() {
  console.log('🔍 Fetching cleaners without coordinates...');

  try {
    const cleanersSnapshot = await db.collection('cleaners').get();
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const doc of cleanersSnapshot.docs) {
      const cleaner = doc.data();

      // Skip if already has coordinates
      if (cleaner.coordinates?.lat && cleaner.coordinates?.lng) {
        skipped++;
        continue;
      }

      const location = cleaner.location || 'Helsinki'; // Default to Helsinki
      const coordinates = cityCoordinates[location] || cityCoordinates['Helsinki'];

      try {
        await db.collection('cleaners').doc(doc.id).update({
          coordinates: coordinates,
          zipcode: cleaner.zipcode || '', // Set empty zipcode if not present
        });

        console.log(`✅ Updated ${cleaner.name || doc.id} (${location})`);
        updated++;
      } catch (error) {
        console.error(`❌ Error updating ${doc.id}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Total cleaners: ${cleanersSnapshot.size}`);
    console.log(`   ✅ Updated: ${updated}`);
    console.log(`   ⏭️  Skipped (already had coordinates): ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);

    if (updated > 0) {
      console.log('\n✨ Migration complete! Cleaners now have coordinates based on their city.');
      console.log('💡 Note: For better accuracy, have cleaners update their zipcode in their profile.');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    process.exit(0);
  }
}

// Run the migration
addCoordinatesToCleaners();
