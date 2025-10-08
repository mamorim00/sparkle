"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState("customer");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isAdminMode, setIsAdminMode] = useState(false);

  const router = useRouter();

  // Read query params client-side inside useEffect
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const modeFromQuery = searchParams.get("mode");
    const roleFromQuery = searchParams.get("role");

    if (roleFromQuery === "admin") setIsAdminMode(true);
    setIsRegister(modeFromQuery === "register");

    if (roleFromQuery === "cleaner") setRole("cleaner");
    else if (roleFromQuery === "customer") setRole("customer");
    else if (roleFromQuery === "admin") setRole("admin");
  }, []);

  const createUserDoc = async (uid: string) => {
    if (role === "cleaner") {
      const cleanerRef = doc(db, "cleaners", uid);
      await setDoc(cleanerRef, {
        username,
        email,
        role: "cleaner",
        status: "pending",
        services: [],
        schedule: [],
        phone: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      const userRef = doc(db, "users", uid);
      await setDoc(userRef, {
        username,
        email,
        role,
        reservations: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        await createUserDoc(user.uid);

        if (role === "cleaner") {
          alert("Registration successful! Let's set up your profile.");
          router.push("/cleaner/setup");
        } else if (role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/");
        }
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        if (!user) return;

        const cleanerRef = doc(db, "cleaners", user.uid);
        const cleanerSnap = await getDoc(cleanerRef);
        if (cleanerSnap.exists()) {
          const cleanerData = cleanerSnap.data();
          if (cleanerData?.status === "pending") {
            alert("Your account is pending approval.");
            return;
          }
          router.push("/cleaner/dashboard");
          return;
        }

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData?.role === "admin") {
            router.push("/admin/dashboard");
          } else if (userData?.role === "cleaner") {
            router.push("/cleaner/dashboard");
          } else if (userData?.role === "customer") {
            router.push("/user/bookings");
          } else {
            router.push("/");
          }          
          return;
        }

        router.push("/");
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred.");
      }
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setMessage("");
    if (!email) {
      setError("Please enter your email first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Check your inbox.");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred while sending reset email.");
      }
    }
  };

  const alternateRole = role === "cleaner" ? "customer" : "cleaner";

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white p-6 rounded shadow w-full max-w-md">
        <h2 className="text-2xl font-bold mb-2 text-center">
          {isRegister ? "Register" : "Login"}
        </h2>

        {isRegister && !isAdminMode && (
          <p className="text-center text-sm mb-4 text-gray-600">
            Registering as {role.charAt(0).toUpperCase() + role.slice(1)}
          </p>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {message && <p className="text-green-500 text-sm">{message}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <input
              type="text"
              placeholder="Username"
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          )}

          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full bg-primary text-white py-2 rounded hover:bg-green-600"
          >
            {isRegister ? "Register" : "Login"}
          </button>
        </form>

        {!isRegister && (
          <p
            className="text-right mt-2 text-sm text-primary underline cursor-pointer"
            onClick={handleForgotPassword}
          >
            Forgot your password?
          </p>
        )}

        {isRegister && !isAdminMode && (
          <p className="text-center mt-2 text-sm text-gray-700">
            Register as{" "}
            <span
              className="cursor-pointer underline text-primary"
              onClick={() => setRole(alternateRole)}
            >
              {alternateRole.charAt(0).toUpperCase() + alternateRole.slice(1)}
            </span>
          </p>
        )}

        <p className="text-center mt-4">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <span
            className="text-primary underline cursor-pointer"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? "Login" : "Register"}
          </span>
        </p>
      </div>
    </div>
  );
}
