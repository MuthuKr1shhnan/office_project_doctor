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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setDoctor(u));
    return () => unsub();
  }, []);

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
  if (loading) {
    return (
      <div className='w-full mt-auto h-full justify-center items-center bg-white rounded-xl p-12 flex flex-col gap-4'>
        <div className='flex flex-col items-center justify-center py-20'>
          <div className='w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4'></div>
          <p className='text-gray-500'>Loading patients...</p>
        </div>
      </div>
    );
  }
  if (!doctor) {
    return <div className='p-8'>Please log in as a doctor.</div>;
  }
  /* ---------- UI ---------- */
  return (
    <div className='w-full p-4 md:p-12'>
      <h1 className='text-xl font-bold mb-6'>My Consultation Requests</h1>
      {requests.length === 0 ? (
        <div className='bg-white rounded-2xl p-12 text-center shadow-lg border border-slate-200'>
          <div className='w-16 h-16 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <svg
              className='w-8 h-8 text-indigo-600'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
              />
            </svg>
          </div>
          <p className='text-slate-600 text-lg'>
            No consultation requests yet.
          </p>
        </div>
      ) : (
        <div className='grid gap-4 md:gap-6'>
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
                    rounded-2xl
                    p-6
                    md:p-8
                    flex
                    flex-col
                    md:flex-row
                    md:justify-between
                    md:items-center
                    gap-6
                    bg-white
                    border
                    border-slate-200
                    shadow-lg
                    hover:shadow-xl
                    transition-all
                    duration-300
                    group
                  '
              >
                {/* LEFT CONTENT */}
                <div className='flex-1 space-y-3'>
                  {/* Patient Name with Avatar */}
                  <div className='flex items-center gap-3 mb-4'>
                    <div className='w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg shadow-md'>
                      {req.patientName?.charAt(0).toUpperCase() || "P"}
                    </div>
                    <h3 className='font-bold text-xl text-slate-800'>
                      {req.patientName || "Unknown patient"}
                    </h3>
                  </div>

                  {/* Contact Details */}
                  <div className='grid gap-2 text-sm'>
                    <div className='flex items-center gap-2 text-slate-600'>
                      <svg
                        className='w-4 h-4 text-indigo-500'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                        />
                      </svg>
                      <span className='font-medium'>Email:</span>
                      <span>{req.patientEmail || "-"}</span>
                    </div>

                    <div className='flex items-center gap-2 text-slate-600'>
                      <svg
                        className='w-4 h-4 text-indigo-500'
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
                      <span className='font-medium'>Phone:</span>
                      <span>{req.patientPhone || "-"}</span>
                    </div>
                  </div>

                  {/* Status and Date */}
                  <div className='flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100'>
                    <span
                      className={`
                        px-3 py-1 rounded-full text-xs font-semibold
                        ${
                          isApproved
                            ? "bg-green-100 text-green-700 border border-green-200"
                            : "bg-amber-100 text-amber-700 border border-amber-200"
                        }
                      `}
                    >
                      {req.status === "approved" ? "✓ Approved" : "⏳ Pending"}
                    </span>

                    <span className='text-xs text-slate-500 flex items-center gap-1'>
                      <svg
                        className='w-3 h-3'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                        />
                      </svg>
                      {created ? new Date(created).toLocaleString() : "—"}
                    </span>
                  </div>
                </div>

                {/* ACTION BUTTON */}
                {(req.status === "pending" || req.status === "approved") && (
                  <div className='flex flex-col items-center gap-3 md:border-l md:border-slate-200 md:pl-8'>
                    <span className='text-xs font-medium text-slate-500 uppercase tracking-wider'>
                      Approval Status
                    </span>
                    <button
                      onClick={() => toggleApproval(req)}
                      className={`
                          w-16 h-16
                          text-3xl
                          font-bold
                          border-2
                          rounded-2xl
                          transition-all
                          duration-300
                          hover:scale-110
                          active:scale-95
                          shadow-md
                          hover:shadow-lg
                          ${
                            isApproved
                              ? "bg-gradient-to-br from-green-50 to-green-100 text-green-600 border-green-400 hover:from-green-100 hover:to-green-200"
                              : "bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400 border-slate-300 hover:from-indigo-50 hover:to-purple-50 hover:border-indigo-400"
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
                    <span
                      className={`text-xs font-medium ${
                        isApproved ? "text-green-600" : "text-slate-500"
                      }`}
                    >
                      {isApproved ? "Approved" : "Click to approve"}
                    </span>
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
