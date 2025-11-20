# Migration Scripts

## Add Helsinki Zipcodes to Existing Cleaners

This script adds real Helsinki postal codes and accurate coordinates to cleaners who don't have location data yet.

### What it does:

1. Finds all cleaners without `coordinates` or `zipcode`
2. Assigns them **real Helsinki postal codes** from 60+ different districts
3. Uses Mapbox Geocoding API to get **accurate coordinates** for each zipcode
4. Updates each cleaner's Firestore document with:
   - `zipcode`: e.g., "00100", "00250", "00520"
   - `coordinates`: `{ lat: 60.1699, lng: 24.9384 }`
   - `location`: "Helsinki" (or specific district)

### Prerequisites:

- Firebase Admin credentials (already configured in `.env.local`)
- Mapbox token (`NEXT_PUBLIC_MAPBOX_TOKEN` in `.env.local`)

### Usage:

```bash
# Make sure you're in the project root
cd /Users/amorimm1/Documents/random/sparkle/sparkleapp/sparkle

# Run the script
node scripts/add-helsinki-zipcodes.js
```

### What you'll see:

```
🔍 Fetching cleaners without coordinates...

📋 Found 5 cleaners to update:

   1. Maria Virtanen (Dublin)
   2. Mikko Korhonen (Helsinki)
   3. Anna Lehto (Unknown)
   4. Petri Mäkinen (Helsinki)
   5. Laura Järvinen (Dublin)

🚀 Starting geocoding process...

   [1/5] Processing Maria Virtanen...
      Assigned zipcode: 00100
      Coordinates: 60.1699, 24.9384
      City: Helsinki
      ✅ Updated successfully!

   [2/5] Processing Mikko Korhonen...
      Assigned zipcode: 00120
      Coordinates: 60.1575, 24.9344
      City: Helsinki
      ✅ Updated successfully!

   ...

============================================================
📊 Migration Summary:
============================================================
   Total cleaners found: 5
   ✅ Successfully updated: 5
   ❌ Failed: 0
============================================================

✨ Migration complete!
🗺️  All cleaners now have Helsinki zipcodes and accurate coordinates.
💡 Tip: Cleaners can update their zipcode anytime via their profile.
```

### Helsinki Zipcodes Used:

The script rotates through 60+ real Helsinki postal codes including:

- **00100** - Keskusta (City Center)
- **00120** - Punavuori
- **00180** - Kamppi
- **00260** - Töölö
- **00520** - Kallio
- **00650** - Malmi
- **00900** - Itäkeskus
- **00930** - Vuosaari

And many more covering all districts of Helsinki!

### Rate Limiting:

The script automatically waits 200ms between API requests to respect Mapbox's rate limits (600 requests/minute).

### Safety:

- ✅ Only updates cleaners **without** coordinates
- ✅ Skips cleaners who already have location data
- ✅ Uses real, validated Helsinki postal codes
- ✅ Gets accurate coordinates from Mapbox
- ✅ Non-destructive (only adds/updates fields)

### After Running:

1. All cleaners will appear on the map at their zipcode location
2. Cleaners can update their zipcode anytime via `/cleaner/profile`
3. New cleaners get accurate coordinates during signup (Step 1)

---

## Troubleshooting

**Error: "NEXT_PUBLIC_MAPBOX_TOKEN not set"**

Make sure your `.env.local` has:
```
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1lIiwiYSI6ImNsLi4uIn0...
```

**Error: "No results found for zipcode"**

This shouldn't happen with the predefined Helsinki zipcodes, but if it does, the script will continue with other cleaners.

**Want to use different zipcodes?**

Edit `HELSINKI_ZIPCODES` array in the script to add/remove postal codes.
