"use client";
import { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import "../globals.css";

const auth = getAuth();

export default function DoctorDashboard() {
  const [doctor, setDoctor] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ---------- AUTH ---------- */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setDoctor(u));
    return () => unsub();
  }, []);

  /* ---------- FETCH REQUESTS ---------- */
  useEffect(() => {
    const fetchRequests = async () => {
      if (!doctor) return;

      try {
        const q = query(
          collection(db, "consultations"),
          where("doctorId", "==", doctor.uid)
        );

        const snap = await getDocs(q);
        const list = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        setRequests(list);
      } catch (err) {
        console.error("Error loading requests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [doctor]);

  /* ---------- TOGGLE APPROVAL ---------- */
  const toggleApproval = async (req) => {
    const newStatus = req.status === "approved" ? "pending" : "approved";

    try {
      await updateDoc(doc(db, "consultations", req.id), {
        status: newStatus,
        ...(newStatus === "approved"
          ? { approvedAt: serverTimestamp() }
          : { approvedAt: null }),
      });

      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? { ...r, status: newStatus } : r))
      );
    } catch (err) {
      console.error("Failed to toggle approval:", err);
      alert("Failed to update request status.");
    }
  };

  /* ---------- GUARDS ---------- */
  if (!doctor) {
    return <div className='p-8'>Please log in as a doctor.</div>;
  }

  if (loading) {
    return (
      <>
        <div
          className={`fixed top-0 right-0 h-full w-full bg-white/80 backdrop-blur-xl border-l border-white/40 shadow-[0_0_40px_rgba(0,0,0,0.15)]  flex items-center justify-center
          
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

  /* ---------- UI ---------- */
  return (
    <div className='w-full p-4 md:p-12'>
      <h1 className='text-xl font-bold mb-6'>My Consultation Requests</h1>

      {requests.length === 0 ? (
        <p>No requests yet.</p>
      ) : (
        <div className='flex flex-col gap-4'>
          {requests.map((req) => {
            const created =
              req.createdAt?.toDate?.() ||
              (typeof req.createdAt === "string" ? req.createdAt : null);

            const isApproved = req.status === "approved";

            return (
              <div
                key={req.id}
                className='
                  w-full
                  rounded-xl
                  p-5
                  flex
                  md:justify-between
                  md:items-start
                  bg-white/70
                  backdrop-blur-xl
                  backdrop-saturate-150
                  border border-white/40
                  shadow-[0_18px_38px_-12px_rgba(34,197,94,0.25)]
                  transition-all
                  duration-300
                  hover:shadow-[0_24px_48px_-14px_rgba(34,197,94,0.35)]
                '
              >
                {/* LEFT CONTENT */}
                <div className='space-y-1 text-sm text-gray-700'>
                  <h3 className='font-semibold text-base text-gray-900'>
                    {req.patientName || "Unknown patient"}
                  </h3>
                  <p>Email: {req.patientEmail || "-"}</p>
                  <p>Phone: {req.patientPhone || "-"}</p>
                  <p>
                    Status:{" "}
                    <span className='font-medium capitalize'>{req.status}</span>
                  </p>
                  <p className='text-xs text-gray-500'>
                    Requested At:{" "}
                    {created ? new Date(created).toLocaleString() : "—"}
                  </p>
                </div>

                {/* ACTION */}
                {(req.status === "pending" || req.status === "approved") && (
                  <div className='flex flex-col items-center gap-2'>
                    <span className='text-xs text-gray-500'>Approved</span>
                    <button
                      onClick={() => toggleApproval(req)}
                      className={`
                        text-xl
                        font-bold
                        border-2
                        rounded-2xl
                        px-3
                        py-1
                        transition
                        hover:scale-110
                        ${
                          isApproved
                            ? "text-green-600 border-green-500"
                            : "text-gray-400 border-red-500"
                        }
                      `}
                      title={
                        isApproved
                          ? "Click to revert approval"
                          : "Approve request"
                      }
                    >
                      ✓
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
