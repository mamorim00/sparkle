"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { auth, db } from "../../../lib/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState(""); 
  const [role, setRole] = useState("customer"); // default
  const [error, setError] = useState("");
  const [isAdminMode, setIsAdminMode] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const roleFromQuery = searchParams.get("role");
    if (roleFromQuery === "admin") {
      setRole("admin");
      setIsAdminMode(true);
    }
  }, [searchParams]);

  // Firestore doc creation
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
        reservations: [], // can hold booking references in the future
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegister) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await createUserDoc(user.uid);

        console.log("Registered as:", { username, email, role });

        if (role === "cleaner") {
          alert("Registration successful! Let's set up your profile.");
          router.push("/cleaner/setup");
        } else if (role === "admin") {
          router.push("/admin/dashboard");
        } else {
          router.push("/"); // customer
        }

      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        if (!user) return;

        // Check cleaner first
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

        // If not cleaner, check users collection
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData?.role === "admin") {
            router.push("/admin/dashboard");
          } else {
            router.push("/"); // customer
          }
          return;
        }

        // fallback
        router.push("/");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <div className="bg-white p-6 rounded shadow w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center">
          {isRegister ? "Register" : "Login"}
        </h2>
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <input
                type="text"
                placeholder="Username"
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-primary"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <div className="flex justify-between">
                <button
                  type="button"
                  className={`px-4 py-2 rounded ${
                    role === "customer" ? "bg-primary text-white" : "bg-gray-200"
                  }`}
                  onClick={() => setRole("customer")}
                >
                  Customer
                </button>
                <button
                  type="button"
                  className={`px-4 py-2 rounded ${
                    role === "cleaner" ? "bg-primary text-white" : "bg-gray-200"
                  }`}
                  onClick={() => setRole("cleaner")}
                >
                  Cleaner
                </button>
                {isAdminMode && (
                  <button
                    type="button"
                    className={`px-4 py-2 rounded ${
                      role === "admin" ? "bg-primary text-white" : "bg-gray-200"
                    }`}
                    onClick={() => setRole("admin")}
                  >
                    Admin
                  </button>
                )}
              </div>
            </>
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

        <p className="text-center mt-4">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <button
            type="button"
            className="text-primary underline"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? "Login" : "Register"}
          </button>
        </p>
      </div>
    </div>
  );
}
