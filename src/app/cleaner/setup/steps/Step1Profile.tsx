"use client";

import { useState } from "react";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { app } from "@/lib/firebase";

interface Step1ProfileProps {
  onNext: (data: { username: string; name: string; photoUrl: string }) => void;
  initialData: { username: string; name?: string };
}

export default function Step1Profile({ onNext, initialData }: Step1ProfileProps) {
  const [username, setUsername] = useState(initialData.username || "");
  const [name, setName] = useState(initialData.name || "");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleContinue = async () => {
    if (!username.trim() || !name.trim() || !photoFile) {
      alert("Please provide a username, full name, and profile picture.");
      return;
    }

    setUploading(true);
    const storage = getStorage(app);
    const storageRef = ref(storage, `cleaners/${Date.now()}-${photoFile.name}`);
    await uploadBytes(storageRef, photoFile);
    const photoUrl = await getDownloadURL(storageRef);

    setUploading(false);
    onNext({ username, name, photoUrl });
  };

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Step 1: Your Profile</h2>
      <input
        type="text"
        placeholder="Full Name (e.g., John Smith)"
        className="border p-2 rounded w-full mb-4"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <input
        type="text"
        placeholder="Username (displayed on profile)"
        className="border p-2 rounded w-full mb-4"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
        className="mb-4"
      />
      <button
        onClick={handleContinue}
        disabled={uploading}
        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Continue"}
      </button>
    </div>
  );
}
