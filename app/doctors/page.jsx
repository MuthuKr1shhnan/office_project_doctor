"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import "../globals.css";
import { db } from "../../lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import {
  LocationIcon as location,
  TickIcon as tick,
  PhoneIcon as phone,
  DegreeIcon as degree,
} from "../../assets/icon";

import heroImage from "../../assets/heroimage.png";

const auth = getAuth();

export default function DoctorsPage() {
  const [search, setSearch] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  


  const [userProfile, setUserProfile] = useState(null);


  const [requestStatus, setRequestStatus] = useState({});

  const usersCollectionRef = collection(db, "users");

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  /* ---------------- LOAD USER PROFILE ---------------- */
  useEffect(() => {
    if (!user) return;

    const loadUserProfile = async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          setUserProfile(snap.data());
        }
      } catch (err) {
        console.error("Failed to load user profile:", err);
      }
    };

    loadUserProfile();
  }, [user]);

  /* ---------------- FETCH DOCTORS ---------------- */
  useEffect(() => {
    const getDoctorList = async () => {
      try {
        const q = query(usersCollectionRef, where("role", "==", "doctor"));
        const snap = await getDocs(q);

        const list = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setDoctors(list);
      } catch (err) {
        console.error("Error loading doctors:", err);
      } finally {
        setLoading(false);
      }
    };

    getDoctorList();
  });

  /* ---------------- FETCH USER REQUEST STATUS ---------------- */
  useEffect(() => {
    if (!user) return;

    const loadRequests = async () => {
      try {
        const q = query(
          collection(db, "consultations"),
          where("patientId", "==", user.uid)
        );

        const snap = await getDocs(q);
        const statusMap = {};

        snap.docs.forEach((doc) => {
          const data = doc.data();
          statusMap[data.doctorId] = data.status;
        });

        setRequestStatus(statusMap);
      } catch (err) {
        console.error("Error loading consultation status:", err);
      }
    };

    loadRequests();
  }, [user]);

  /* ---------------- SEND REQUEST ---------------- */
  const sendRequest = async (doctor) => {
    try {
      if (!user) {
        alert("Please login as a patient to send a request.");
        return;
      }

      const doctorUid = doctor.uid || doctor.userId || doctor.id;

      if (!doctorUid) {
        alert("Doctor UID missing.");
        return;
      }

      await addDoc(collection(db, "consultations"), {
        doctorId: doctorUid,
        patientId: user.uid,

        patientName:
          userProfile?.displayName || user.displayName || "Anonymous",
        patientEmail: userProfile?.email || user.email || "",
        patientPhone: userProfile?.phoneNumber || "",

        status: "pending",
        createdAt: serverTimestamp(),
      });

      // Update UI instantly
      setRequestStatus((prev) => ({
        ...prev,
        [doctorUid]: "pending",
      }));
    } catch (err) {
      console.error("Failed to send request:", err);
      alert("Failed to send request.");
    }
  };

  /* ---------------- FILTER ---------------- */
  const filteredDoctors = doctors.filter((doc) => {
    const q = search.toLowerCase();
    return (
      doc.displayName?.toLowerCase().includes(q) ||
      doc.phoneNumber?.includes(q) ||
      doc.degree?.toLowerCase().includes(q) ||
      doc.address?.toLowerCase().includes(q)
    );
  });

  /* ---------------- LOADING ---------------- */
  if (loading) {
    return (
      <div className='w-full mt-auto h-full justify-center items-center bg-white rounded-xl p-12 flex flex-col gap-4'>
        <div className='flex flex-col items-center justify-center py-20'>
          <div className='w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4'></div>
          <p className='text-gray-500'>Loading doctors...</p>
        </div>
      </div>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <div className='w-full mt-auto  justify-center items-center rounded-xl md:p-12 flex flex-col gap-4'>
      <div className='w-3/4 '>
        <input
          type='text'
          placeholder='Search by Name, Phone, Degree or Location...'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='w-full backdrop-saturate-150
         border-[#fc8086] px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500'
        />
      </div>

      {filteredDoctors.map((doctor) => {
        const doctorUid = doctor.uid || doctor.userId || doctor.id;
        const status = requestStatus[doctorUid];

        const isDisabled = Boolean(status);
        const buttonText = status
          ? status.charAt(0).toUpperCase() + status.slice(1)
          : "Send Request";

        const buttonColor = status
          ? "bg-green-500 hover:bg-green-500"
          : "bg-[#FE5B63] hover:bg-[#e5525a]";

        return (
          <div
            key={doctor.id}
            className='
          w-3/4
         
          rounded-xl
          p-4
          flex
          flex-col
          md:flex-row
          gap-4
          items-start
          bg-white/70
          backdrop-blur-xl
          backdrop-saturate-150
         border-[#FE5B63]
         border-[.10px]
          shadow-[0_20px_40px_-10px_rgba(254,91,99,0.35)]
          transition-all
          duration-300
          hover:shadow-[0_28px_55px_-12px_rgba(254,91,99,0.45)]
        '
          >
            <Image
              src={doctor.photoURL || heroImage}
              alt={doctor.displayName || "Doctor"}
              width={64}
              height={64}
              className='md:w-16 md:h-16 w-full h-auto rounded-lg object-cover relative z-10'
            />

            <div className='flex-1'>
              <div className='flex items-center gap-1'>
                <h2 className='font-semibold text-lg text-gray-900'>
                  {doctor.displayName || "Doctor"}
                </h2>
                {doctor.isVerified && (
                  <Image src={tick} alt='verified' width={16} height={16} />
                )}
              </div>

              {doctor.degree && (
                <div className='flex items-center gap-2 mt-1 text-sm text-gray-600'>
                  <Image src={degree} alt='degree' width={16} height={16} />
                  <span>{doctor.degree}</span>
                </div>
              )}

              {doctor.address && (
                <div className='flex items-center gap-2 mt-1 text-sm text-gray-600'>
                  <Image src={location} alt='location' width={16} height={16} />
                  <span>{doctor.address}</span>
                </div>
              )}

              {doctor.phoneNumber && (
                <div className='flex items-center gap-2 mt-1 text-sm text-gray-600'>
                  <Image src={phone} alt='phone' width={16} height={16} />
                  <span>{doctor.phoneNumber}</span>
                </div>
              )}

              {doctor.fee && (
                <div className='mt-3 text-red-500 font-bold text-lg'>
                  Rs {doctor.fee}/-
                </div>
              )}

              <button
                disabled={isDisabled}
                onClick={() => sendRequest(doctor)}
                className={`mt-3 w-full text-white py-2 rounded-lg text-sm font-medium transition-colors ${buttonColor}`}
              >
                {buttonText}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
