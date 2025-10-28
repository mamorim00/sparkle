"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../../../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
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
  const [showPhoneLogin, setShowPhoneLogin] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

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
        userId: uid,
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
          router.push("/cleaner-dashboard");
          return;
        }

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          if (userData?.role === "admin") {
            router.push("/admin/dashboard");
          } else if (userData?.role === "cleaner") {
            router.push("/cleaner-dashboard");
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

  const handleSocialLogin = async (provider: GoogleAuthProvider | OAuthProvider) => {
    setError("");
    setMessage("");

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (!user) return;

      // Check if user document exists
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      const cleanerRef = doc(db, "cleaners", user.uid);
      const cleanerSnap = await getDoc(cleanerRef);

      // If user doesn't exist, create new user document
      if (!userSnap.exists() && !cleanerSnap.exists()) {
        // For new social auth users, create as customer by default
        await setDoc(userRef, {
          username: user.displayName || user.email?.split("@")[0] || "User",
          email: user.email,
          role: role,
          photoURL: user.photoURL,
          reservations: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        if (role === "cleaner") {
          await setDoc(cleanerRef, {
            userId: user.uid,
            username: user.displayName || user.email?.split("@")[0] || "Cleaner",
            email: user.email,
            role: "cleaner",
            status: "pending",
            photoURL: user.photoURL,
            services: [],
            schedule: [],
            phone: "",
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          router.push("/cleaner/setup");
          return;
        }

        router.push("/");
        return;
      }

      // Existing user - redirect based on role
      if (cleanerSnap.exists()) {
        const cleanerData = cleanerSnap.data();
        if (cleanerData?.status === "pending") {
          alert("Your account is pending approval.");
          return;
        }
        router.push("/cleaner-dashboard");
        return;
      }

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData?.role === "admin") {
          router.push("/admin/dashboard");
        } else if (userData?.role === "cleaner") {
          router.push("/cleaner-dashboard");
        } else {
          router.push("/");
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred during social login.");
      }
    }
  };

  const handleGoogleLogin = () => {
    const provider = new GoogleAuthProvider();
    handleSocialLogin(provider);
  };

  // Commented out Apple login - to be configured later
  // const handleAppleLogin = () => {
  //   const provider = new OAuthProvider("apple.com");
  //   handleSocialLogin(provider);
  // };

  const setupRecaptcha = () => {
    interface WindowWithRecaptcha extends Window {
      recaptchaVerifier?: RecaptchaVerifier;
    }
    const windowWithRecaptcha = window as unknown as WindowWithRecaptcha;

    if (!windowWithRecaptcha.recaptchaVerifier) {
      windowWithRecaptcha.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
          callback: () => {
            // reCAPTCHA solved
          },
        }
      );
    }
  };

  const handlePhoneSignIn = async () => {
    setError("");
    setMessage("");

    if (!phoneNumber) {
      setError("Please enter your phone number.");
      return;
    }

    try {
      setupRecaptcha();
      interface WindowWithRecaptcha extends Window {
        recaptchaVerifier?: RecaptchaVerifier;
      }
      const windowWithRecaptcha = window as unknown as WindowWithRecaptcha;
      const appVerifier = windowWithRecaptcha.recaptchaVerifier;

      if (!appVerifier) {
        setError("Failed to initialize reCAPTCHA. Please refresh and try again.");
        return;
      }

      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
      setConfirmationResult(confirmation);
      setMessage("Verification code sent to your phone!");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to send verification code.");
      }
    }
  };

  const handleVerifyCode = async () => {
    setError("");
    setMessage("");

    if (!confirmationResult) {
      setError("Please request a verification code first.");
      return;
    }

    if (!verificationCode) {
      setError("Please enter the verification code.");
      return;
    }

    try {
      const result = await confirmationResult.confirm(verificationCode);
      const user = result.user;

      if (!user) return;

      // Check if user document exists
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      const cleanerRef = doc(db, "cleaners", user.uid);
      const cleanerSnap = await getDoc(cleanerRef);

      // If user doesn't exist, create new user document
      if (!userSnap.exists() && !cleanerSnap.exists()) {
        await setDoc(userRef, {
          username: user.phoneNumber || "User",
          email: user.email || "",
          phone: user.phoneNumber,
          role: role,
          reservations: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        if (role === "cleaner") {
          await setDoc(cleanerRef, {
            userId: user.uid,
            username: user.phoneNumber || "Cleaner",
            email: user.email || "",
            phone: user.phoneNumber,
            role: "cleaner",
            status: "pending",
            services: [],
            schedule: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          router.push("/cleaner/setup");
          return;
        }

        router.push("/");
        return;
      }

      // Existing user - redirect based on role
      if (cleanerSnap.exists()) {
        const cleanerData = cleanerSnap.data();
        if (cleanerData?.status === "pending") {
          alert("Your account is pending approval.");
          return;
        }
        router.push("/cleaner-dashboard");
        return;
      }

      if (userSnap.exists()) {
        const userData = userSnap.data();
        if (userData?.role === "admin") {
          router.push("/admin/dashboard");
        } else if (userData?.role === "cleaner") {
          router.push("/cleaner-dashboard");
        } else {
          router.push("/");
        }
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Invalid verification code.");
      }
    }
  };

  const alternateRole = role === "cleaner" ? "customer" : "cleaner";

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
        <h2 className="text-3xl font-bold mb-2 text-center text-primary-dark">
          {isRegister ? "Register" : "Login"}
        </h2>

        {isRegister && !isAdminMode && (
          <p className="text-center text-sm mb-4 text-neutral">
            Registering as <span className="font-semibold text-accent">{role.charAt(0).toUpperCase() + role.slice(1)}</span>
          </p>
        )}

        {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg mb-4">{error}</p>}
        {message && <p className="text-green-600 text-sm bg-green-50 p-3 rounded-lg mb-4">{message}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <input
              type="text"
              placeholder="Username"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-primary-dark"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          )}

          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-primary-dark"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-primary-dark"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="w-full bg-accent text-white py-3 rounded-lg font-semibold hover:bg-accent-dark transition-colors shadow-md hover:shadow-lg"
          >
            {isRegister ? "Register" : "Login"}
          </button>
        </form>

        {!isRegister && (
          <p
            className="text-right mt-3 text-sm text-accent hover:text-accent-dark underline cursor-pointer font-medium"
            onClick={handleForgotPassword}
          >
            Forgot your password?
          </p>
        )}

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with</span>
          </div>
        </div>

        {/* Social Login Buttons */}
        {!showPhoneLogin ? (
          <div className="space-y-3">
            {/* Google Sign In */}
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Apple Sign In - Commented out for later configuration */}
            {/* <button
              onClick={handleAppleLogin}
              type="button"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              <span>Continue with Apple</span>
            </button> */}

            {/* Phone Sign In */}
            <button
              onClick={() => setShowPhoneLogin(true)}
              type="button"
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
              <span>Continue with Phone</span>
            </button>
          </div>
        ) : (
          // Phone Authentication UI
          <div className="space-y-4">
            {!confirmationResult ? (
              <>
                <input
                  type="tel"
                  placeholder="Phone Number (e.g., +1234567890)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-primary-dark"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
                <button
                  onClick={handlePhoneSignIn}
                  type="button"
                  className="w-full bg-accent text-white py-3 rounded-lg font-semibold hover:bg-accent-dark transition-colors"
                >
                  Send Verification Code
                </button>
                <button
                  onClick={() => setShowPhoneLogin(false)}
                  type="button"
                  className="w-full text-sm text-gray-600 hover:text-gray-800"
                >
                  ← Back to other options
                </button>
              </>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent text-primary-dark text-center text-2xl tracking-widest"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                />
                <button
                  onClick={handleVerifyCode}
                  type="button"
                  className="w-full bg-accent text-white py-3 rounded-lg font-semibold hover:bg-accent-dark transition-colors"
                >
                  Verify Code
                </button>
                <button
                  onClick={() => {
                    setConfirmationResult(null);
                    setVerificationCode("");
                  }}
                  type="button"
                  className="w-full text-sm text-gray-600 hover:text-gray-800"
                >
                  ← Resend Code
                </button>
              </>
            )}
          </div>
        )}

        {/* Hidden reCAPTCHA container */}
        <div id="recaptcha-container"></div>

        {isRegister && !isAdminMode && (
          <p className="text-center mt-4 text-sm text-primary-dark">
            Register as{" "}
            <span
              className="cursor-pointer underline text-accent hover:text-accent-dark font-semibold"
              onClick={() => setRole(alternateRole)}
            >
              {alternateRole.charAt(0).toUpperCase() + alternateRole.slice(1)}
            </span>
          </p>
        )}

        <p className="text-center mt-4 text-primary-dark">
          {isRegister ? "Already have an account?" : "Do not have an account?"}{" "}
          <span
            className="text-accent hover:text-accent-dark underline cursor-pointer font-semibold"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? "Login" : "Register"}
          </span>
        </p>
      </div>
    </div>
  );
}
