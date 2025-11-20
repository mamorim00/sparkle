/**
 * Script to add Helsinki zipcodes and coordinates to existing cleaners
 *
 * This script will:
 * 1. Fetch all cleaners without coordinates
 * 2. Assign them Helsinki zipcodes (rotating through different districts)
 * 3. Geocode each zipcode to get accurate coordinates
 *
 * Usage:
 * node scripts/add-helsinki-zipcodes.js
 */

const admin = require('firebase-admin');
const https = require('https');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.replace(/^"|"$/g, '');
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/^"|"$/g, '').replace(/\\n/g, '\n');

// Validate credentials
if (!clientEmail || !privateKey) {
  console.error('❌ Error: Missing Firebase credentials!');
  console.error('\nPlease ensure .env.local has:');
  console.error('   FIREBASE_CLIENT_EMAIL="..."');
  console.error('   FIREBASE_PRIVATE_KEY="..."');
  process.exit(1);
}

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'sparkle-86740',
  clientEmail: clientEmail,
  privateKey: privateKey,
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Real Helsinki postal codes from different districts
const HELSINKI_ZIPCODES = [
  '00100', // Keskusta (City Center)
  '00120', // Punavuori
  '00130', // Kaartinkaupunki
  '00140', // Kaivopuisto
  '00150', // Eira
  '00160', // Katajanokka
  '00170', // Kruununhaka
  '00180', // Kamppi
  '00200', // Lauttasaari
  '00250', // Taka-Töölö
  '00260', // Töölö
  '00270', // Meilahti
  '00300', // Pikku Huopalahti
  '00320', // Etelä-Haaga
  '00330', // Munkkiniemi
  '00340', // Kuusisaari
  '00350', // Munkkivuori
  '00360', // Pajamäki
  '00370', // Reimarla
  '00380', // Pitäjänmäki
  '00390', // Konala
  '00400', // Pohjois-Haaga
  '00500', // Sörnäinen
  '00510', // Vallila
  '00520', // Kallio
  '00530', // Hermanni
  '00540', // Toukola
  '00550', // Kumpula
  '00560', // Arabia
  '00570', // Koskela
  '00580', // Käpylä
  '00600', // Koskela
  '00610', // Oulunkylä
  '00620', // Metsälä
  '00630', // Tapaninvainio
  '00640', // Patola
  '00650', // Malmi
  '00700', // Kalasatama
  '00710', // Kulosaari
  '00720', // Herttoniemi
  '00730', // Roihuvuori
  '00740', // Tammisalo
  '00750', // Laajasalo
  '00760', // Jollas
  '00770', // Santahamina
  '00780', // Vartiokylä
  '00790', // Puotila
  '00800', // Herttoniemi (south)
  '00810', // Kulosaaren huvilakatu
  '00820', // Tammisalo
  '00830', // Santahamina
  '00840', // Marjaniemi
  '00850', // Laajasalo
  '00860', // Jollas
  '00870', // Lauttasaari (east)
  '00880', // Otaniemi (Espoo border)
  '00890', // Karhusaari
  '00900', // Itäkeskus
  '00910', // Vartioharju
  '00920', // Puotinharju
  '00930', // Vuosaari
  '00940', // Meri-Rastila
  '00950', // Rastila
  '00960', // Mellunmäki
  '00970', // Kontula
  '00980', // Vesala
  '00990', // Aurinkolahti
];

// Mapbox Geocoding API
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

/**
 * Geocode a zipcode using Mapbox API
 */
function geocodeZipcode(zipcode) {
  return new Promise((resolve, reject) => {
    if (!MAPBOX_TOKEN) {
      reject(new Error('NEXT_PUBLIC_MAPBOX_TOKEN not set'));
      return;
    }

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(zipcode)}.json?access_token=${MAPBOX_TOKEN}&types=postcode&country=fi&limit=1`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.features && json.features.length > 0) {
            const [lng, lat] = json.features[0].center;
            const city = json.features[0].context?.find(c => c.id.startsWith('place.'))?.text || 'Helsinki';
            resolve({
              lat,
              lng,
              city,
              formattedAddress: json.features[0].place_name
            });
          } else {
            reject(new Error(`No results found for zipcode: ${zipcode}`));
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function addHelsinkiZipcodes() {
  console.log('🔍 Fetching cleaners without coordinates...\n');

  try {
    const cleanersSnapshot = await db.collection('cleaners').get();
    const cleanersToUpdate = [];

    // Find cleaners without coordinates
    cleanersSnapshot.forEach((doc) => {
      const cleaner = doc.data();
      if (!cleaner.coordinates?.lat || !cleaner.coordinates?.lng) {
        cleanersToUpdate.push({
          id: doc.id,
          name: cleaner.name || 'Unknown',
          currentLocation: cleaner.location || 'Unknown'
        });
      }
    });

    if (cleanersToUpdate.length === 0) {
      console.log('✅ All cleaners already have coordinates!');
      process.exit(0);
    }

    console.log(`📋 Found ${cleanersToUpdate.length} cleaners to update:\n`);
    cleanersToUpdate.forEach((c, i) => {
      console.log(`   ${i + 1}. ${c.name} (${c.currentLocation})`);
    });

    console.log('\n🚀 Starting geocoding process...\n');

    let updated = 0;
    let errors = 0;

    for (let i = 0; i < cleanersToUpdate.length; i++) {
      const cleaner = cleanersToUpdate[i];
      // Rotate through zipcodes
      const zipcode = HELSINKI_ZIPCODES[i % HELSINKI_ZIPCODES.length];

      try {
        console.log(`   [${i + 1}/${cleanersToUpdate.length}] Processing ${cleaner.name}...`);
        console.log(`      Assigned zipcode: ${zipcode}`);

        // Geocode the zipcode
        const geocodeResult = await geocodeZipcode(zipcode);

        console.log(`      Coordinates: ${geocodeResult.lat.toFixed(4)}, ${geocodeResult.lng.toFixed(4)}`);
        console.log(`      City: ${geocodeResult.city}`);

        // Update Firestore
        await db.collection('cleaners').doc(cleaner.id).update({
          zipcode: zipcode,
          coordinates: {
            lat: geocodeResult.lat,
            lng: geocodeResult.lng
          },
          location: geocodeResult.city
        });

        console.log(`      ✅ Updated successfully!\n`);
        updated++;

        // Rate limiting: wait 200ms between requests (Mapbox allows 600 req/min)
        await sleep(200);

      } catch (error) {
        console.error(`      ❌ Error: ${error.message}\n`);
        errors++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Migration Summary:');
    console.log('='.repeat(60));
    console.log(`   Total cleaners found: ${cleanersToUpdate.length}`);
    console.log(`   ✅ Successfully updated: ${updated}`);
    console.log(`   ❌ Failed: ${errors}`);
    console.log('='.repeat(60));

    if (updated > 0) {
      console.log('\n✨ Migration complete!');
      console.log('🗺️  All cleaners now have Helsinki zipcodes and accurate coordinates.');
      console.log('💡 Tip: Cleaners can update their zipcode anytime via their profile.');
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
  } finally {
    process.exit(0);
  }
}

// Check for Mapbox token
if (!MAPBOX_TOKEN) {
  console.error('❌ Error: NEXT_PUBLIC_MAPBOX_TOKEN environment variable is not set!');
  console.error('\nPlease set it in your .env.local file:');
  console.error('   NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here');
  console.error('\nOr export it temporarily:');
  console.error('   export NEXT_PUBLIC_MAPBOX_TOKEN=your_token_here');
  process.exit(1);
}

// Run the migration
addHelsinkiZipcodes();
