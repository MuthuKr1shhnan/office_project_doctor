"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Btn from "@/component/Btn";
import { updateProfile, updatePassword, deleteUser } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { toast } from "sonner";

export default function ProfileDrawer({ isOpen, onClose, user, onLogout }) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [loading, setLoading] = useState(true);

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

  // Load user data from Firestore
  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.uid) return;

      setLoading(true);
      try {
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);
        console.log("Data", userDoc);
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
          console.log(userData.role);
          // localStorage.setItem("role",userData.role);
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

    if (isOpen) {
      loadUserData();
    }
  }, [user, isOpen]);

  if (!user) return null;
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

          localStorage.setItem("userRole", role);
          setDegree(userData.degree || "");
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
    // Remove the regex validation for 10 digits since phone now has country code

    if (!address.trim()) {
      setAddressError("Address is required");
      isValid = false;
    }

    if (age === " ") {
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

      // Add degree only if user is a doctor
      if (role === "doctor") {
        userData.degree = degree;
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
      toast(error.message);
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
      if (error.code === "auth/wrong-password") {
        setCurrentPasswordError("Current password is incorrect");
      } else {
        alert(error.message);
      }
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const currentUser = auth.currentUser;
      localStorage.removeItem("isLoggedIn");
      const ref = doc(db, "users", user.uid);
      await deleteDoc(ref); // Delete Firebase Auth account
      await deleteUser(currentUser);

      toast("Account deleted successfully");
      onClose();
      window.location.href = "/";
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
        {isOpen && (
          <div
            className='fixed inset-0 bg-black/50 backdrop-blur-sm z-40'
            onClick={onClose}
          />
        )}
        <div
          className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-out z-50 flex items-center justify-center ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className='text-center'>
            <div className='w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2'></div>
            <p className='text-sm text-gray-500'>Loading...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className='fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300'
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-80 bg-white shadow-2xl transform transition-transform duration-300 ease-out z-50 overflow-y-auto
        ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header with Close Button */}
        <div className='flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10'>
          <h3 className='text-lg font-semibold text-gray-800'>Profile</h3>
          <button
            onClick={onClose}
            className='p-2 hover:bg-gray-100 rounded-full transition-colors duration-200'
            aria-label='Close drawer'
          >
            <svg
              className='w-5 h-5 text-gray-600'
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

        {/* Content */}
        <div className='p-6 flex flex-col items-center'>
          {/* Profile Image */}
          <div className='relative'>
            <div className='absolute inset-0 bg-linear-to-tr from-blue-500 to-purple-500 rounded-full blur-sm opacity-75'></div>
            <div className='relative h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-lg'>
              <Image
                src={"/dummy.jpg"}
                alt='Profile'
                width={96}
                height={96}
                className='object-cover'
              />
            </div>
          </div>

          {/* Success Message */}
          {updateSuccess && (
            <div className='mt-4 w-full bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm text-center'>
              {updateSuccess}
            </div>
          )}

          {/* View/Edit Mode */}
          {!isEditing ? (
            <>
              {/* User Info - View Mode */}
              <div className='text-center mt-5'>
                <h2 className='text-xl font-semibold text-gray-800'>
                  {displayName || "User"}
                </h2>
                <p className='text-sm text-gray-500 mt-2'>{user?.email}</p>
              </div>

              <div className='my-6 border-t border-gray-200 w-full' />

              {/* Info Cards */}
              <div className='space-y-3 w-full'>
                {phoneNumber && (
                  <div className='bg-gray-50 rounded-lg p-3'>
                    <div className='flex justify-between items-center'>
                      <span className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
                        Phone
                      </span>
                      <span className='text-sm text-gray-700'>
                        {phoneNumber}
                      </span>
                    </div>
                  </div>
                )}

                {age && (
                  <div className='bg-gray-50 rounded-lg p-3'>
                    <div className='flex justify-between items-center'>
                      <span className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
                        Age
                      </span>
                      <span className='text-sm text-gray-700'>{age} years</span>
                    </div>
                  </div>
                )}

                {gender && (
                  <div className='bg-gray-50 rounded-lg p-3'>
                    <div className='flex justify-between items-center'>
                      <span className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
                        Gender
                      </span>
                      <span className='text-sm text-gray-700 capitalize'>
                        {gender}
                      </span>
                    </div>
                  </div>
                )}

                <div>
                  <div className='w-full text-sm bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-gray-500 cursor-not-allowed'>
                    <div className='flex justify-between items-center'>
                      <span className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
                        Role
                      </span>

                      {role
                        ? role.charAt(0).toUpperCase() + role.slice(1)
                        : "Not set"}
                    </div>
                  </div>
                  <p className='text-xs text-gray-500 mt-1'>
                    Role cannot be changed after registration
                  </p>
                </div>
                <div className='w-full text-sm bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-gray-500 '>
                  <div className='flex justify-between items-center'>
                    <span className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
                      Fee
                    </span>

                    {fee}
                  </div>
                </div>

                {address && (
                  <div className='bg-gray-50 rounded-lg p-3'>
                    <div className='flex flex-col'>
                      <span className='text-xs font-medium text-gray-500 uppercase tracking-wide mb-1'>
                        Address
                      </span>
                      <span className='text-sm text-gray-700'>{address}</span>
                    </div>
                  </div>
                )}

                <div className='bg-gray-50 rounded-lg p-3'>
                  <div className='flex justify-between items-center'>
                    <span className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
                      Email Verified
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        user?.emailVerified
                          ? "text-green-600"
                          : "text-amber-600"
                      }`}
                    >
                      {user?.emailVerified ? "✓ Verified" : "⚠ Not Verified"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='mt-8 w-full space-y-3'>
                <Btn
                  variant='second'
                  className='w-full py-3 rounded-lg'
                  onClick={handleEditToggle}
                >
                  {phoneNumber ? "Edit Profile" : "Complete Profile"}
                </Btn>
                <button
                  onClick={() => setShowPasswordChange(true)}
                  className='w-full py-3 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 border border-gray-200'
                >
                  Change Password
                </button>
                <Btn
                  variant='primary'
                  className='w-full py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-200'
                  onClick={onLogout}
                >
                  Logout
                </Btn>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className='w-full py-3 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors duration-200 border border-red-200'
                >
                  Delete Account
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Edit Mode */}
              <div className='mt-5 w-full space-y-4'>
                <h3 className='text-lg font-medium text-gray-800'>
                  Edit Profile
                </h3>

                {/* Name */}
                <div>
                  <label className='block text-xs text-gray-600 mb-1'>
                    Full Name
                  </label>
                  <input
                    type='text'
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className={`w-full text-sm bg-white border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      nameError ? "border-red-300" : "border-gray-200"
                    }`}
                    placeholder='Your full name'
                  />
                  {nameError && (
                    <p className='text-xs text-red-600 mt-1'>{nameError}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className='block text-xs text-gray-600 mb-1'>
                    Phone Number
                  </label>
                  <input
                    type='tel'
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className={`w-full text-sm bg-white border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      phoneError ? "border-red-300" : "border-gray-200"
                    }`}
                    placeholder='1234567890'
                  />
                  {phoneError && (
                    <p className='text-xs text-red-600 mt-1'>{phoneError}</p>
                  )}
                </div>

                {/* Age */}
                <div>
                  <label className='block text-xs text-gray-600 mb-1'>
                    Age
                  </label>
                  <input
                    type='number'
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className={`w-full text-sm bg-white border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      ageError ? "border-red-300" : "border-gray-200"
                    }`}
                    placeholder='25'
                  />
                  {ageError && (
                    <p className='text-xs text-red-600 mt-1'>{ageError}</p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className='block text-xs text-gray-600 mb-1'>
                    Gender
                  </label>
                  <div className='flex gap-4'>
                    {["male", "female", "other"].map((g) => (
                      <div
                        key={g}
                        onClick={() => setGender(g)}
                        className='flex items-center gap-2 cursor-pointer select-none'
                      >
                        <span
                          className={`h-4 w-4 rounded-full border flex items-center justify-center ${
                            gender === g ? "border-blue-500" : "border-gray-300"
                          }`}
                        >
                          {gender === g && (
                            <span className='h-2 w-2 rounded-full bg-blue-500'></span>
                          )}
                        </span>
                        <span className='text-sm text-gray-700 capitalize'>
                          {g}
                        </span>
                      </div>
                    ))}
                  </div>
                  {genderError && (
                    <p className='text-xs text-red-600 mt-1'>{genderError}</p>
                  )}
                </div>

                {/* Address */}
                <div>
                  <label className='block text-xs text-gray-600 mb-1'>
                    Address
                  </label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={`w-full text-sm bg-white border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      addressError ? "border-red-300" : "border-gray-200"
                    }`}
                    placeholder='Your address'
                    rows='2'
                  />
                  {addressError && (
                    <p className='text-xs text-red-600 mt-1'>{addressError}</p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className='flex gap-3 pt-4'>
                  <Btn
                    variant='second'
                    className='flex-1 py-2.5 rounded-lg'
                    onClick={handleEditToggle}
                  >
                    Cancel
                  </Btn>
                  <Btn
                    variant='primary'
                    className='flex-1 py-2.5 rounded-lg'
                    onClick={handleSaveChanges}
                  >
                    Save Changes
                  </Btn>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm z-60 flex items-center justify-center p-4'>
          <div className='bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all'>
            <div className='flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4'>
              <svg
                className='w-6 h-6 text-red-600'
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

            <h3 className='text-xl font-semibold text-gray-900 text-center mb-2'>
              Delete Account?
            </h3>
            <p className='text-sm text-gray-600 text-center mb-6'>
              This action cannot be undone. All your data will be permanently
              deleted.
            </p>

            <div className='flex gap-3'>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className='flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200'
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                className='flex-1 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors duration-200'
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPasswordChange && (
        <div className='fixed inset-0 bg-black/60 backdrop-blur-sm z-60 flex items-center justify-center p-4'>
          <div className='bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-xl font-semibold text-gray-900'>
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
                className='p-2 hover:bg-gray-100 rounded-full transition-colors duration-200'
              >
                <svg
                  className='w-5 h-5 text-gray-600'
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

            {/* Success Message */}
            {passwordSuccess && (
              <div className='mb-4 w-full bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm text-center'>
                {passwordSuccess}
              </div>
            )}

            <div className='space-y-4'>
              {/* Current Password */}
              <div>
                <label className='block text-xs text-gray-600 mb-1'>
                  Current Password
                </label>
                <input
                  type='password'
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={`w-full text-sm bg-white border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    currentPasswordError ? "border-red-300" : "border-gray-200"
                  }`}
                  placeholder='Enter current password'
                />
                {currentPasswordError && (
                  <p className='text-xs text-red-600 mt-1'>
                    {currentPasswordError}
                  </p>
                )}
              </div>

              {/* New Password */}
              <div>
                <label className='block text-xs text-gray-600 mb-1'>
                  New Password
                </label>
                <input
                  type='password'
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full text-sm bg-white border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    passwordError ? "border-red-300" : "border-gray-200"
                  }`}
                  placeholder='Enter new password'
                />
                {passwordError && (
                  <p className='text-xs text-red-600 mt-1'>{passwordError}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className='block text-xs text-gray-600 mb-1'>
                  Confirm New Password
                </label>
                <input
                  type='password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full text-sm bg-white border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    confirmError ? "border-red-300" : "border-gray-200"
                  }`}
                  placeholder='Confirm new password'
                />
                {confirmError && (
                  <p className='text-xs text-red-600 mt-1'>{confirmError}</p>
                )}
              </div>

              {/* Action Buttons */}
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
                  className='flex-1 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200'
                >
                  Cancel
                </button>
                <button
                  onClick={handlePasswordChange}
                  className='flex-1 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200'
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
