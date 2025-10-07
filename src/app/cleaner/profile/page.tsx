"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { auth, db, storage } from "@/lib/firebase";
import { onAuthStateChanged, User, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import CleanerSchedule from "@/components/CleanerAvailability";

// Define types for schedule items and cleaner profile
interface ScheduleItem {
  date: string;
  start: string;
  end: string;
}

interface CleanerProfile {
  username: string;
  photoUrl: string;
  pricePerHour: number;
  phone: string;
  schedule: ScheduleItem[];
}

export default function CleanerProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<CleanerProfile>({
    username: "",
    photoUrl: "",
    pricePerHour: 0,
    phone: "",
    schedule: [],
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const cleanerRef = doc(db, "cleaners", firebaseUser.uid);
        const snap = await getDoc(cleanerRef);
        if (snap.exists()) {
          setProfile(snap.data() as CleanerProfile);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const cleanerRef = doc(db, "cleaners", user.uid);
    await setDoc(
      cleanerRef,
      {
        ...profile,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    setSaving(false);
    alert("Profile updated!");
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !user) return;
    const file = e.target.files[0];
    const fileRef = ref(storage, `cleaners/${Date.now()}-${file.name}`);
    await uploadBytes(fileRef, file);
    const url = await getDownloadURL(fileRef);
    setProfile((prev) => ({ ...prev, photoUrl: url }));
    await updateProfile(user, { photoURL: url });
  };

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>Please log in to see your profile.</p>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center">My Cleaner Profile</h1>

      {/* Profile Editing Section */}
      <div className="bg-white p-6 rounded shadow space-y-4">
        <h2 className="text-xl font-semibold">Profile Info</h2>

        <label className="block mb-1 font-semibold">Name</label>
        <input
          type="text"
          className="w-full border px-3 py-2 rounded"
          value={profile.username}
          onChange={(e) =>
            setProfile((prev) => ({ ...prev, username: e.target.value }))
          }
        />

        <label className="block mb-1 font-semibold">Phone</label>
        <input
          type="text"
          className="w-full border px-3 py-2 rounded"
          value={profile.phone}
          onChange={(e) =>
            setProfile((prev) => ({ ...prev, phone: e.target.value }))
          }
        />

        <label className="block mb-1 font-semibold">Price / Hour (€)</label>
        <input
          type="number"
          className="w-full border px-3 py-2 rounded"
          value={profile.pricePerHour}
          onChange={(e) =>
            setProfile((prev) => ({
              ...prev,
              pricePerHour: Number(e.target.value),
            }))
          }
        />

        <label className="block mb-1 font-semibold">Profile Photo</label>
        <input type="file" onChange={handlePhotoChange} />
        {profile.photoUrl && (
          <Image
            src={profile.photoUrl}
            alt="Profile"
            width={128}
            height={128}
            className="w-32 h-32 mt-2 rounded-full object-cover"
          />
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Schedule Section */}
      <div className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Manage Schedule</h2>
        <CleanerSchedule cleanerId={user.uid} />
      </div>
    </div>
  );
}
