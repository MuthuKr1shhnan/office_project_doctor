"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Btn from "@/component/Btn";
import {
  updateProfile,
  updatePassword,
  deleteUser,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

export default function ProfileDrawer() {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // Edit form state
  const [displayName, setDisplayName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [address, setAddress] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [degree, setDegree] = useState("");
  const [role, setRole] = useState("");
  const [fee, setFee] = useState("");

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Error states
  const [nameError, setNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [ageError, setAgeError] = useState("");
  const [genderError, setGenderError] = useState("");

  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [updateSuccess, setUpdateSuccess] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Monitor auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
        setLoading(false);
      } else {
        setUser(currentUser);
        // Get user role from Firestore
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setOtpVerified(true);
            if (userDoc.data().role === "doctor") {
              setRoleVerified(true);
            }
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Load user data from Firestore
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setDisplayName(userData.displayName || user.displayName || "");
          setPhoneNumber(userData.phoneNumber || "");
          setAddress(userData.address || "");
          setAge(userData.age || "");
          setGender(userData.gender || "");
          setRole(userData.role || "");
          setDegree(userData.degree || "");
          setFee(userData.fee || "");
        } else {
          // Initialize with Firebase Auth data if Firestore doc doesn't exist
          setDisplayName(user.displayName || "");
        }
      } catch (error) {
        console.error("Error loading user data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadUserData();
    }
  }, [user]);

  const handleEditToggle = async () => {
    if (isEditing) {
      // Reload data when canceling
      setLoading(true);
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setDisplayName(userData.displayName || user.displayName || "");
          setPhoneNumber(userData.phoneNumber || "");
          setAddress(userData.address || "");
          setAge(userData.age || "");
          setGender(userData.gender || "");
          setRole(userData.role || "");
          setDegree(userData.degree || "");
          setFee(userData.fee || "");
        }
      } catch (error) {
        console.error("Error reloading user data:", error);
      } finally {
        setLoading(false);
      }
      clearErrors();
    }
    setIsEditing(!isEditing);
  };

  const clearErrors = () => {
    setNameError("");
    setPhoneError("");
    setAddressError("");
    setAgeError("");
    setGenderError("");
    setCurrentPasswordError("");
    setPasswordError("");
    setConfirmError("");
    setUpdateSuccess("");
    setPasswordSuccess("");
  };

  const validateForm = () => {
    clearErrors();
    let isValid = true;

    if (!displayName.trim()) {
      setNameError("Name is required");
      isValid = false;
    }
    if (!phoneNumber.trim()) {
      setPhoneError("Phone number is required");
      isValid = false;
    }

    if (!address.trim()) {
      setAddressError("Address is required");
      isValid = false;
    }

    if (age === "" || age === " ") {
      setAgeError("Age is required");
      isValid = false;
    } else if (isNaN(age) || age < 1 || age > 120) {
      setAgeError("Enter a valid age");
      isValid = false;
    }

    if (!gender) {
      setGenderError("Gender is required");
      isValid = false;
    }

    return isValid;
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("isLoggedIn");
      router.push("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleSaveChanges = async () => {
    if (!validateForm()) return;

    try {
      const currentUser = auth.currentUser;

      // Update Firebase Auth display name
      if (displayName !== user.displayName) {
        await updateProfile(currentUser, {
          displayName: displayName,
        });
      }

      // Update Firestore document
      const userDocRef = doc(db, "users", user.uid);
      const userData = {
        displayName,
        email: user.email,
        phoneNumber,
        address,
        age: parseInt(age),
        gender,
        role: role,
        updatedAt: new Date().toISOString(),
      };

      // Add degree and fee only if user is a doctor
      if (role === "doctor") {
        userData.degree = degree;
        userData.fee = fee;
      }

      // Check if document exists
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        // Update existing document
        await updateDoc(userDocRef, userData);
      } else {
        // Create new document with uid
        await setDoc(userDocRef, {
          ...userData,
          uid: user.uid,
          createdAt: new Date().toISOString(),
        });
      }

      setUpdateSuccess("Profile updated successfully!");
      setTimeout(() => {
        setUpdateSuccess("");
        setIsEditing(false);
      }, 2000);
    } catch (error) {
      console.error("Update error:", error);
      alert(error.message);
    }
  };

  const handlePasswordChange = async () => {
    // Clear previous errors
    setCurrentPasswordError("");
    setPasswordError("");
    setConfirmError("");
    setPasswordSuccess("");

    let isValid = true;

    if (!currentPassword.trim()) {
      setCurrentPasswordError("Current password is required");
      isValid = false;
    }

    if (!newPassword.trim()) {
      setPasswordError("New password is required");
      isValid = false;
    } else if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      isValid = false;
    }

    if (newPassword !== confirmPassword) {
      setConfirmError("Passwords do not match");
      isValid = false;
    }

    if (!isValid) return;

    try {
      const currentUser = auth.currentUser;

      // Re-authenticate user with current password
      const { signInWithEmailAndPassword } = await import("firebase/auth");
      await signInWithEmailAndPassword(auth, user.email, currentPassword);

      // Update password
      await updatePassword(currentUser, newPassword);

      setPasswordSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setTimeout(() => {
        setPasswordSuccess("");
        setShowPasswordChange(false);
      }, 2000);
    } catch (error) {
      console.error("Password change error:", error);
      if (
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        setCurrentPasswordError("Current password is incorrect");
      } else {
        alert(error.message);
      }
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      const userDocRef = doc(db, "users", currentUser.uid);

      // Delete Firestore document first
      await deleteDoc(userDocRef);

      // Then delete Firebase Auth account
      await deleteUser(currentUser);

      localStorage.removeItem("isLoggedIn");
      alert("Account deleted successfully");

      router.push("/");
    } catch (error) {
      console.error("Delete error:", error);
      if (error.code === "auth/requires-recent-login") {
        alert("Please log out and log in again to delete your account");
      } else {
        alert(error.message);
      }
    }
  };
  if (loading) {
    return (
      <>
        <div
          className={`fixed  top-0 right-0 h-full w-full bg-white/80 backdrop-blur-xl border-l border-white/40 shadow-[0_0_40px_rgba(0,0,0,0.15)]  flex items-center justify-center
          
          }`}
        >
          <div className='text-center'>
            <div className='w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2'></div>
            <p className='text-xl text-gray-500'>Loading...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className='w-full min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8'>
        <div className='max-w-4xl mx-auto'>
          <div className='bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden'>
            <div className='p-6 md:p-8'>
              <div className='flex flex-col items-center mb-8'>
                <div className='relative mb-4'>
                  <div className='h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-lg ring-4 ring-indigo-100'>
                    <div className='w-full h-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold'>
                      {displayName?.charAt(0).toUpperCase() || "U"}
                    </div>
                  </div>
                </div>

                {updateSuccess && (
                  <div className='w-full bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm text-center mb-4'>
                    {updateSuccess}
                  </div>
                )}
              </div>

              {!isEditing ? (
                <>
                  <div className='text-center mb-8'>
                    <h2 className='text-2xl font-bold text-slate-800 mb-2'>
                      {displayName || "User"}
                    </h2>
                    <p className='text-sm text-slate-500'>{user?.email}</p>
                  </div>

                  <div className='grid md:grid-cols-2 gap-4 mb-8'>
                    {phoneNumber && (
                      <div className='bg-slate-50 rounded-xl p-4 border border-slate-200'>
                        <div className='flex items-center gap-3'>
                          <div className='w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center'>
                            <svg
                              className='w-5 h-5 text-indigo-600'
                              fill='none'
                              viewBox='0 0 24 24'
                              stroke='currentColor'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z'
                              />
                            </svg>
                          </div>
                          <div className='flex-1'>
                            <span className='text-xs font-medium text-slate-500 uppercase tracking-wide block'>
                              Phone
                            </span>
                            <span className='text-sm text-slate-800 font-medium'>
                              {phoneNumber}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {age && (
                      <div className='bg-slate-50 rounded-xl p-4 border border-slate-200'>
                        <div className='flex items-center gap-3'>
                          <div className='w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center'>
                            <svg
                              className='w-5 h-5 text-purple-600'
                              fill='none'
                              viewBox='0 0 24 24'
                              stroke='currentColor'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                              />
                            </svg>
                          </div>
                          <div className='flex-1'>
                            <span className='text-xs font-medium text-slate-500 uppercase tracking-wide block'>
                              Age
                            </span>
                            <span className='text-sm text-slate-800 font-medium'>
                              {age} years
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {gender && (
                      <div className='bg-slate-50 rounded-xl p-4 border border-slate-200'>
                        <div className='flex items-center gap-3'>
                          <div className='w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center'>
                            <svg
                              className='w-5 h-5 text-pink-600'
                              fill='none'
                              viewBox='0 0 24 24'
                              stroke='currentColor'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                              />
                            </svg>
                          </div>
                          <div className='flex-1'>
                            <span className='text-xs font-medium text-slate-500 uppercase tracking-wide block'>
                              Gender
                            </span>
                            <span className='text-sm text-slate-800 font-medium capitalize'>
                              {gender}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className='bg-slate-100 rounded-xl p-4 border border-slate-200'>
                      <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center'>
                          <svg
                            className='w-5 h-5 text-slate-600'
                            fill='none'
                            viewBox='0 0 24 24'
                            stroke='currentColor'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                            />
                          </svg>
                        </div>
                        <div className='flex-1'>
                          <span className='text-xs font-medium text-slate-500 uppercase tracking-wide block'>
                            Role
                          </span>
                          <span className='text-sm text-slate-600 font-medium capitalize'>
                            {role
                              ? role.charAt(0).toUpperCase() + role.slice(1)
                              : "Not set"}
                          </span>
                        </div>
                      </div>
                      <p className='text-xs text-slate-500 mt-2 ml-13'>
                        Role cannot be changed after registration
                      </p>
                    </div>

                    {fee && role === "doctor" && (
                      <div className='bg-slate-50 rounded-xl p-4 border border-slate-200'>
                        <div className='flex items-center gap-3'>
                          <div className='w-10 h-10 rounded-full bg-green-100 flex items-center justify-center'>
                            <svg
                              className='w-5 h-5 text-green-600'
                              fill='none'
                              viewBox='0 0 24 24'
                              stroke='currentColor'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                              />
                            </svg>
                          </div>
                          <div className='flex-1'>
                            <span className='text-xs font-medium text-slate-500 uppercase tracking-wide block'>
                              Fee
                            </span>
                            <span className='text-sm text-slate-800 font-medium'>
                              {fee}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {degree && role === "doctor" && (
                      <div className='bg-slate-50 rounded-xl p-4 border border-slate-200'>
                        <div className='flex items-center gap-3'>
                          <div className='w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center'>
                            <svg
                              className='w-5 h-5 text-blue-600'
                              fill='none'
                              viewBox='0 0 24 24'
                              stroke='currentColor'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M12 14l9-5-9-5-9 5 9 5z'
                              />
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z'
                              />
                            </svg>
                          </div>
                          <div className='flex-1'>
                            <span className='text-xs font-medium text-slate-500 uppercase tracking-wide block'>
                              Degree
                            </span>
                            <span className='text-sm text-slate-800 font-medium'>
                              {degree}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {address && (
                      <div className='bg-slate-50 rounded-xl p-4 border border-slate-200 md:col-span-2'>
                        <div className='flex items-start gap-3'>
                          <div className='w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0'>
                            <svg
                              className='w-5 h-5 text-amber-600'
                              fill='none'
                              viewBox='0 0 24 24'
                              stroke='currentColor'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                              />
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                              />
                            </svg>
                          </div>
                          <div className='flex-1'>
                            <span className='text-xs font-medium text-slate-500 uppercase tracking-wide block mb-1'>
                              Address
                            </span>
                            <span className='text-sm text-slate-800'>
                              {address}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className='bg-slate-50 rounded-xl p-4 border border-slate-200 md:col-span-2'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                          <div className='w-10 h-10 rounded-full bg-green-100 flex items-center justify-center'>
                            <svg
                              className='w-5 h-5 text-green-600'
                              fill='none'
                              viewBox='0 0 24 24'
                              stroke='currentColor'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                              />
                            </svg>
                          </div>
                          <span className='text-xs font-medium text-slate-500 uppercase tracking-wide'>
                            Email Verified
                          </span>
                        </div>
                        <span
                          className={`text-sm font-semibold px-3 py-1 rounded-full ${
                            user?.emailVerified
                              ? "bg-green-100 text-green-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {user?.emailVerified
                            ? "✓ Verified"
                            : "⚠ Not Verified"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className='grid md:grid-cols-2 gap-3'>
                    <button
                      onClick={handleEditToggle}
                      className='w-full py-3 rounded-xl font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg'
                    >
                      {phoneNumber ? "Edit Profile" : "Complete Profile"}
                    </button>
                    <button
                      onClick={() => setShowPasswordChange(true)}
                      className='w-full py-3 text-sm font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200'
                    >
                      Change Password
                    </button>
                    <button
                      onClick={handleLogout}
                      className='w-full py-3 rounded-xl font-medium bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition-all shadow-md hover:shadow-lg'
                    >
                      Logout
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className='w-full py-3 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors border border-red-200'
                    >
                      Delete Account
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className='space-y-5'>
                    <h3 className='text-xl font-bold text-slate-800 mb-6'>
                      Edit Profile
                    </h3>

                    <div className='grid md:grid-cols-2 gap-5'>
                      <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                          Full Name
                        </label>
                        <input
                          type='text'
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className={`w-full text-sm bg-white border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                            nameError ? "border-red-300" : "border-slate-200"
                          }`}
                          placeholder='Your full name'
                        />
                        {nameError && (
                          <p className='text-xs text-red-600 mt-1'>
                            {nameError}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                          Phone Number
                        </label>
                        <input
                          type='tel'
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className={`w-full text-sm bg-white border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                            phoneError ? "border-red-300" : "border-slate-200"
                          }`}
                          placeholder='1234567890'
                        />
                        {phoneError && (
                          <p className='text-xs text-red-600 mt-1'>
                            {phoneError}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                          Age
                        </label>
                        <input
                          type='number'
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          className={`w-full text-sm bg-white border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                            ageError ? "border-red-300" : "border-slate-200"
                          }`}
                          placeholder='25'
                        />
                        {ageError && (
                          <p className='text-xs text-red-600 mt-1'>
                            {ageError}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className='block text-sm font-medium text-slate-700 mb-2'>
                          Gender
                        </label>
                        <div className='flex gap-4 pt-2'>
                          {["male", "female", "other"].map((g) => (
                            <div
                              key={g}
                              onClick={() => setGender(g)}
                              className='flex items-center gap-2 cursor-pointer select-none'
                            >
                              <span
                                className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                  gender === g
                                    ? "border-indigo-600"
                                    : "border-slate-300"
                                }`}
                              >
                                {gender === g && (
                                  <span className='h-3 w-3 rounded-full bg-indigo-600'></span>
                                )}
                              </span>
                              <span className='text-sm text-slate-700 capitalize'>
                                {g}
                              </span>
                            </div>
                          ))}
                        </div>
                        {genderError && (
                          <p className='text-xs text-red-600 mt-1'>
                            {genderError}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className='block text-sm font-medium text-slate-700 mb-2'>
                        Address
                      </label>
                      <textarea
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className={`w-full text-sm bg-white border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                          addressError ? "border-red-300" : "border-slate-200"
                        }`}
                        placeholder='Your address'
                        rows='3'
                      />
                      {addressError && (
                        <p className='text-xs text-red-600 mt-1'>
                          {addressError}
                        </p>
                      )}
                    </div>

                    {role === "doctor" && (
                      <div className='grid md:grid-cols-2 gap-5'>
                        <div>
                          <label className='block text-sm font-medium text-slate-700 mb-2'>
                            Degree
                          </label>
                          <input
                            type='text'
                            value={degree}
                            onChange={(e) => setDegree(e.target.value)}
                            className='w-full text-sm bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all'
                            placeholder='MBBS, MD, etc.'
                          />
                        </div>

                        <div>
                          <label className='block text-sm font-medium text-slate-700 mb-2'>
                            Consultation Fee
                          </label>
                          <input
                            type='text'
                            value={fee}
                            onChange={(e) => setFee(e.target.value)}
                            className='w-full text-sm bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all'
                            placeholder='₹500'
                          />
                        </div>
                      </div>
                    )}

                    <div className='flex gap-3 pt-4'>
                      <button
                        onClick={handleEditToggle}
                        className='flex-1 py-3 rounded-xl font-medium bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 transition-all'
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveChanges}
                        className='flex-1 py-3 rounded-xl font-medium bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg'
                      >
                        Save Changes
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {showDeleteConfirm && (
          <div className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
            <div className='bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all border border-slate-200'>
              <div className='flex items-center justify-center w-14 h-14 mx-auto bg-red-100 rounded-full mb-4'>
                <svg
                  className='w-7 h-7 text-red-600'
                  fill='none'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z'></path>
                </svg>
              </div>

              <h3 className='text-xl font-bold text-slate-900 text-center mb-2'>
                Delete Account?
              </h3>
              <p className='text-sm text-slate-600 text-center mb-6'>
                This action cannot be undone. All your data will be permanently
                deleted.
              </p>

              <div className='flex gap-3'>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className='flex-1 px-4 py-3 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all'
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className='flex-1 px-4 py-3 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-md hover:shadow-lg'
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        )}

        {showPasswordChange && (
          <div className='fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
            <div className='bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all border border-slate-200'>
              <div className='flex items-center justify-between mb-6'>
                <h3 className='text-xl font-bold text-slate-900'>
                  Change Password
                </h3>
                <button
                  onClick={() => {
                    setShowPasswordChange(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmPassword("");
                    setCurrentPasswordError("");
                    setPasswordError("");
                    setConfirmError("");
                    setPasswordSuccess("");
                  }}
                  className='p-2 hover:bg-slate-100 rounded-full transition-all'
                >
                  <svg
                    className='w-5 h-5 text-slate-600'
                    fill='none'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth='2'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path d='M6 18L18 6M6 6l12 12'></path>
                  </svg>
                </button>
              </div>

              {passwordSuccess && (
                <div className='mb-4 w-full bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm text-center'>
                  {passwordSuccess}
                </div>
              )}

              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-2'>
                    Current Password
                  </label>
                  <input
                    type='password'
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={`w-full text-sm bg-white border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                      currentPasswordError
                        ? "border-red-300"
                        : "border-slate-200"
                    }`}
                    placeholder='Enter current password'
                  />
                  {currentPasswordError && (
                    <p className='text-xs text-red-600 mt-1'>
                      {currentPasswordError}
                    </p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-2'>
                    New Password
                  </label>
                  <input
                    type='password'
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`w-full text-sm bg-white border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                      passwordError ? "border-red-300" : "border-slate-200"
                    }`}
                    placeholder='Enter new password'
                  />
                  {passwordError && (
                    <p className='text-xs text-red-600 mt-1'>{passwordError}</p>
                  )}
                </div>

                <div>
                  <label className='block text-sm font-medium text-slate-700 mb-2'>
                    Confirm New Password
                  </label>
                  <input
                    type='password'
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full text-sm bg-white border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${
                      confirmError ? "border-red-300" : "border-slate-200"
                    }`}
                    placeholder='Confirm new password'
                  />
                  {confirmError && (
                    <p className='text-xs text-red-600 mt-1'>{confirmError}</p>
                  )}
                </div>

                <div className='flex gap-3 pt-2'>
                  <button
                    onClick={() => {
                      setShowPasswordChange(false);
                      setCurrentPassword("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setCurrentPasswordError("");
                      setPasswordError("");
                      setConfirmError("");
                      setPasswordSuccess("");
                    }}
                    className='flex-1 px-4 py-3 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all'
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordChange}
                    className='flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl transition-all shadow-md hover:shadow-lg'
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
