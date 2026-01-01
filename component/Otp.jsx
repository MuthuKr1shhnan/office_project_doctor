"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, setDoc, getDoc, deleteDoc, updateDoc } from "firebase/firestore";
import "../app/globals.css";

const OTP_EXPIRY_SECONDS = 60;
const MAX_ATTEMPTS = 3;
const MAX_ATTEMPTS_RESEND = 3;
const BLOCK_DURATION_SECONDS = 300;
const OTP_LENGTH = 6;

const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const Otp = () => {
  const router = useRouter();

  const [uid, setUid] = useState(null);
  const [otpInput, setOtpInput] = useState(
    Array.from({ length: OTP_LENGTH }).fill("")
  );
  const [timer, setTimer] = useState(OTP_EXPIRY_SECONDS);
  const [error, setError] = useState("");
  const [resendError, setResendError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const inputRefs = useRef([]);

  /* ================= AUTH ================= */
  const handleChange = (e, index) => {
    const value = e.target.value.replace(/\D/g, "");
    if (!value) return;

    const newOtp = [...otpInput];
    newOtp[index] = value[0];
    setOtpInput(newOtp);

    // Move forward ONLY after typing
    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };
  const handleKeyDown = (e, index) => {
    if (e.key !== "Backspace") return;

    const newOtp = [...otpInput];

    if (newOtp[index]) {
      newOtp[index] = "";
      setOtpInput(newOtp);
      return;
    }

    if (index > 0) {
      inputRefs.current[index - 1]?.focus();
      newOtp[index - 1] = "";
      setOtpInput(newOtp);
    }
  };
  const handlePaste = (e) => {
    e.preventDefault();

    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pasted) return;

    const newOtp = pasted.split("");
    while (newOtp.length < OTP_LENGTH) newOtp.push("");

    setOtpInput(newOtp);

    const lastIndex = Math.min(pasted.length, OTP_LENGTH) - 1;
    inputRefs.current[lastIndex]?.focus();
  };

  /* ================= BLOCK CHECK ================= */

  const checkIfBlocked = async (userId) => {
    const ref = doc(db, "tempUsers", userId);
    const snap = await getDoc(ref);

    if (!snap.exists()) return false;

    const { blacked, blockedUntil } = snap.data();

    if (!blacked) return false;

    if (Date.now() > blockedUntil) {
      await updateDoc(ref, {
        blacked: false,
        blockedUntil: null,
      });
      setIsBlocked(false);
      return false;
    }

    setIsBlocked(true);
    setBlockTimeRemaining(Math.ceil((blockedUntil - Date.now()) / 1000));
    return true;
  };
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/");
        return;
      }

      setUid(user.uid);
      await checkIfBlocked(user.uid);
    });

    return () => unsub();
  }, [router]);
  /* ================= BLOCK TIMER ================= */

  useEffect(() => {
    if (!isBlocked || blockTimeRemaining <= 0) return;

    const interval = setInterval(() => {
      setBlockTimeRemaining((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [isBlocked, blockTimeRemaining]);

  /* ================= OTP CREATION ================= */

  const createOtp = useCallback(async () => {
    if (!uid || isBlocked) return;

    const otp = generateOtp();
    const expiresAt = Date.now() + OTP_EXPIRY_SECONDS * 1000;

    await setDoc(
      doc(db, "otp_verifications", uid),
      {
        otp,
        expiresAt,
        attempts: 0,
      },
      { merge: true }
    );

    console.log("OTP:", otp); // remove in prod
    setTimer(OTP_EXPIRY_SECONDS);
    setError("");
    setResendError("");
  }, [uid, isBlocked]);

  useEffect(() => {
    if (!uid || isBlocked) return;
    createOtp();
  }, [uid, isBlocked, createOtp]);

  /* ================= OTP EXPIRY TIMER ================= */

  useEffect(() => {
    if (timer <= 0) return;

    const interval = setInterval(() => {
      setTimer((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [timer]);

  /* ================= BLOCK USER ================= */

  const blockUserAndCleanup = async () => {
    const blockedUntil = Date.now() + BLOCK_DURATION_SECONDS * 1000;

    await deleteDoc(doc(db, "otp_verifications", uid));

    await updateDoc(doc(db, "tempUsers", uid), {
      blacked: true,
      blockedUntil,
    });

    setIsBlocked(true);
    setBlockTimeRemaining(BLOCK_DURATION_SECONDS);
    setError("Account blocked due to too many attempts");
  };

  /* ================= TRANSFER USER ================= */

  const transferToUsersCollection = async () => {
    const tempRef = doc(db, "tempUsers", uid);
    const snap = await getDoc(tempRef);

    if (!snap.exists()) return;

    await setDoc(doc(db, "users", uid), snap.data());
    await deleteDoc(tempRef);
  };

  /* ================= VERIFY OTP ================= */

  const verifyOtp = async () => {
    if (!uid || isBlocked) return;

    const enteredOtp = otpInput.join("");
    if (enteredOtp.length !== OTP_LENGTH) {
      setError("Enter valid OTP");
      return;
    }

    setLoading(true);

    const ref = doc(db, "otp_verifications", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      setError("OTP expired");
      setLoading(false);
      return;
    }

    const { otp: storedOtp, expiresAt, attempts = 0 } = snap.data();

    if (Date.now() > expiresAt) {
      setError("OTP expired");
      setLoading(false);
      return;
    }

    if (enteredOtp !== storedOtp) {
      const newAttempts = attempts + 1;

      if (newAttempts >= MAX_ATTEMPTS) {
        await blockUserAndCleanup();
        setLoading(false);
        return;
      }

      await updateDoc(ref, { attempts: newAttempts });
      setError(`Attempts left: ${MAX_ATTEMPTS - newAttempts}`);
      setOtpInput(Array(OTP_LENGTH).fill(""));
      setLoading(false);
      return;
    }

    await deleteDoc(ref);
    await transferToUsersCollection();
    setLoading(false);
    router.push("/home");
  };

  /* ================= RESEND OTP ================= */

  const resendOtp = async () => {
    if (!uid || timer > 0 || isBlocked) return;

    const ref = doc(db, "otp_verifications", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      setResendError("Session expired");
      return;
    }

    const { attemptsResend = 0 } = snap.data();
    const newAttempts = attemptsResend + 1;

    if (newAttempts >= MAX_ATTEMPTS_RESEND) {
      await blockUserAndCleanup();
      return;
    }

    await setDoc(ref, { attemptsResend: newAttempts });
    await createOtp();

    setResendError(
      `Resend attempts left: ${MAX_ATTEMPTS_RESEND - newAttempts}`
    );
    setOtpInput(Array(OTP_LENGTH).fill(""));
  };

  const formatTime = (s) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  /* ================= BLOCKED UI ================= */

  if (isBlocked) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='bg-white p-6 rounded-xl shadow-md w-full max-w-sm'>
          <h2 className='text-xl font-semibold text-center text-red-600'>
            Account Blocked
          </h2>
          <p className='text-center mt-4'>
            Try again in {formatTime(blockTimeRemaining)}
          </p>
          <button
            onClick={async () => {
              await signOut(auth);
              router.push("/");
            }}
            className='w-full mt-6 bg-blue-600 text-white py-2 rounded-md'
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  /* ================= OTP UI ================= */

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50'>
      <div className='bg-white p-6 rounded-xl shadow-md w-full max-w-sm'>
        <h2 className='text-xl font-semibold text-center'>Verify OTP</h2>

        <div className='flex justify-between gap-2 mt-4'>
          <div
            className='flex justify-between gap-2 mt-4'
            onPaste={handlePaste}
          >
            {otpInput.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type='text'
                inputMode='numeric'
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className='w-12 h-12 text-center text-lg border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            ))}
          </div>
        </div>

        {error && <p className='text-red-500 mt-2'>{error}</p>}

        <button
          onClick={verifyOtp}
          disabled={loading || otpInput.length !== 6}
          className='w-full mt-4 bg-blue-600 text-white py-2 rounded-md'
        >
          {loading ? "Verifying..." : "Verify"}
        </button>

        <div className='flex justify-between mt-4 text-sm'>
          <span>Expires in: {timer}s</span>
          <button
            onClick={async () => await resendOtp()}
            disabled={timer > 0}
            className={timer > 0 ? "text-gray-400" : "text-blue-600"}
          >
            Resend OTP
          </button>
        </div>

        {resendError && (
          <p className='text-orange-500 text-center mt-2'>{resendError}</p>
        )}
      </div>
    </div>
  );
};
