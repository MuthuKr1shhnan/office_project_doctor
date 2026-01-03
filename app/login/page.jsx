"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth, googleAuthProvider, db } from "../../lib/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import {
  loginSchema,
  registerSchema,
  passwordRules,
} from "../../utils/validators";
import { Register } from "../../component/Register";
import { Login } from "../../component/Login";
import "../globals.css";

const Page = () => {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");

  /* ================= USER STATE RESOLUTION ================= */

  const resolveUserState = async (uid) => {
    const userRef = doc(db, "users", uid);
    const tempRef = doc(db, "tempUsers", uid);

    const userSnap = await getDoc(userRef);
    console.log("\x1b[33mUSER DATA CHECK\x1b[0m", userSnap.data().role);
    if (userSnap.exists() && userSnap.data().role === "doctor") {
      router.replace("/home");
      return;
    } else {
      await signOut(auth);
    }

    const tempSnap = await getDoc(tempRef);
    if (tempSnap.exists()) {
      // 🔑 BLOCKED OR NOT → OTP PAGE DECIDES
      router.replace("/otp-validation");
      return;
    }

    setError("User not found. Please register.");
  };

  /* ================= EMAIL LOGIN ================= */

  const handleLoginSubmit = async (values, { setSubmitting }) => {
    try {
      setError("");

      const result = await signInWithEmailAndPassword(
        auth,
        values.emailLogin,
        values.passwordLogin
      );

      await resolveUserState(result.user.uid);
    } catch {
      setError("Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= GOOGLE LOGIN ================= */

  const handleGoogleLogin = async () => {
    try {
      setError("");
      const result = await signInWithPopup(auth, googleAuthProvider);
      await resolveUserState(result.user.uid);
    } catch {
      setError("Google login failed. Please try again.");
    }
  };

  /* ================= REGISTRATION ================= */

  const handleRegisterSubmit = async (values, { setSubmitting }) => {
    try {
      setError("");

      const result = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      await setDoc(doc(db, "tempUsers", result.user.uid), {
        uid: result.user.uid,
        email: values.email,
        role: "doctor",

        displayName: values.name,
        phoneNumber: `+${values.phone}`,
        address: values.address,
        degree: values.role === "doctor" ? values.degree : "",
        fee: values.fee || "",
        blacked: false,
        blockedUntil: null,
        createdAt: Date.now(),
      });

      router.replace("/otp-validation");
    } catch (err) {
      if (err?.message?.includes("email-already-in-use")) {
        setError("Account already exists. Please log in.");
        setMode("login");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= UI ================= */

  return (
    <div className='min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4'>
      <div className='max-w-md w-full bg-white rounded-2xl shadow-xl p-8'>
        <div className='text-center mb-6'>
          <h2 className='text-2xl font-bold text-gray-800'>
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h2>
          <p className='text-sm text-gray-600 mt-1'>
            {mode === "login"
              ? "Sign in to continue"
              : "Fill your details to get started"}
          </p>
        </div>

        {error && (
          <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-lg'>
            <p className='text-sm text-red-600'>{error}</p>
          </div>
        )}

        {mode === "login" ? (
          <Login
            onLoginSuccess={handleLoginSubmit}
            onGoogleLogin={handleGoogleLogin}
            loginSchema={loginSchema}
          />
        ) : (
          <Register
            onRegisterSuccess={handleRegisterSubmit}
            registerSchema={registerSchema}
            passwordRules={passwordRules}
          />
        )}

        <div className='text-center mt-6 text-sm text-gray-600'>
          {mode === "login"
            ? "Don't have an account?"
            : "Already have an account?"}
          <button
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
            }}
            className='ml-1 font-medium text-[#FE5B63] hover:underline'
          >
            {mode === "login" ? "Register" : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Page;
