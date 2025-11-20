"use client";

import { useState } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "@/lib/firebase";
import { useLanguage } from "@/context/LanguageContext";
import { geocodeZipcode, validateZipcode, type Coordinates } from "@/lib/geocoding";

interface Step1ProfileProps {
  onNext: (data: {
    username: string;
    name: string;
    photoUrl: string;
    zipcode: string;
    coordinates: Coordinates;
    location: string;
  }) => void;
  initialData: { username: string; name?: string; zipcode?: string };
}

export default function Step1Profile({ onNext, initialData }: Step1ProfileProps) {
  const { t } = useLanguage();
  const [username, setUsername] = useState(initialData.username || "");
  const [name, setName] = useState(initialData.name || "");
  const [zipcode, setZipcode] = useState(initialData.zipcode || "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [zipcodeError, setZipcodeError] = useState<string>("");
  const [validatingZipcode, setValidatingZipcode] = useState(false);

  const handleZipcodeBlur = async () => {
    if (!zipcode.trim()) {
      setZipcodeError("");
      return;
    }

    // Basic format validation
    if (!validateZipcode(zipcode)) {
      setZipcodeError("Invalid zipcode format");
      return;
    }

    // Geocode to verify zipcode exists
    setValidatingZipcode(true);
    setZipcodeError("");

    const result = await geocodeZipcode(zipcode);
    setValidatingZipcode(false);

    if (!result) {
      setZipcodeError("Could not find this zipcode. Please check and try again.");
    }
  };

  const handleContinue = async () => {
    if (!username.trim() || !name.trim() || !photoFile || !zipcode.trim()) {
      alert(t('cleanerSetup.step1.fillAllFields'));
      return;
    }

    if (zipcodeError) {
      alert("Please fix the zipcode error before continuing.");
      return;
    }

    setUploading(true);

    // Geocode the zipcode
    const geocodeResult = await geocodeZipcode(zipcode);
    if (!geocodeResult) {
      alert("Failed to geocode zipcode. Please check and try again.");
      setUploading(false);
      return;
    }

    // Upload photo
    const storage = getStorage(app);
    const storageRef = ref(storage, `cleaners/${Date.now()}-${photoFile.name}`);
    await uploadBytes(storageRef, photoFile);
    const photoUrl = await getDownloadURL(storageRef);

    setUploading(false);
    onNext({
      username,
      name,
      photoUrl,
      zipcode,
      coordinates: geocodeResult.coordinates,
      location: geocodeResult.city || geocodeResult.formattedAddress,
    });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">{t('cleanerSetup.step1.title')}</h2>
      <input
        type="text"
        placeholder={t('cleanerSetup.step1.fullNamePlaceholder')}
        className="border p-2 rounded w-full mb-4"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="text"
        placeholder={t('cleanerSetup.step1.usernamePlaceholder')}
        className="border p-2 rounded w-full mb-4"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      {/* Zipcode Input */}
      <div className="mb-4">
        <label htmlFor="zipcode" className="block text-sm font-medium mb-2">
          Zipcode / Postal Code
        </label>
        <input
          id="zipcode"
          type="text"
          placeholder="e.g., D02 XY45, 00100"
          className={`border p-2 rounded w-full ${
            zipcodeError ? 'border-red-500' : ''
          }`}
          value={zipcode}
          onChange={(e) => {
            setZipcode(e.target.value);
            setZipcodeError("");
          }}
          onBlur={handleZipcodeBlur}
          disabled={validatingZipcode}
        />
        {validatingZipcode && (
          <p className="text-sm text-gray-500 mt-1">Validating zipcode...</p>
        )}
        {zipcodeError && (
          <p className="text-sm text-red-500 mt-1">{zipcodeError}</p>
        )}
        {!zipcodeError && zipcode && !validatingZipcode && (
          <p className="text-sm text-green-600 mt-1">✓ Zipcode validated</p>
        )}
      </div>

      <h4 className="text-xl font-bold mb-4">{t('cleanerSetup.step1.profilePic')}</h4>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
        className="mb-4"
      />
      <button
        onClick={handleContinue}
        disabled={uploading || validatingZipcode}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
      >
        {uploading ? t('cleanerSetup.step1.uploading') : t('cleanerSetup.step1.continue')}
      </button>
    </div>
  );
}
