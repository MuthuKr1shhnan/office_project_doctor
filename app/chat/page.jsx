"use client";
import Btn from "../../component/Btn";
import { useEffect, useRef, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  getDoc,
  addDoc,
  doc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

export default function DoctorChat() {
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  /* AUTH */
  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      if (!u) return;

      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists() && snap.data().role === "doctor") {
        setUser(u);
      }
    });
  }, []);

  /* LOAD APPROVED PATIENTS */
  useEffect(() => {
    if (!user) return;

    const load = async () => {
      const q = query(
        collection(db, "consultations"),
        where("doctorId", "==", user.uid),
        where("status", "==", "approved")
      );

      const snap = await getDocs(q);
      const list = [];

      for (const d of snap.docs) {
        const data = d.data();
        const patientSnap = await getDoc(doc(db, "users", data.patientId));

        list.push({
          roomId: d.id,
          patientId: data.patientId,
          patient: patientSnap.data(),
        });
      }

      setChats(list);
    };

    load();
  }, [user]);

  /* JOIN ROOM */
  useEffect(() => {
    if (!room || !user) return;
    loadHistory(room);
  }, [room]);

  /* LOAD MESSAGE HISTORY */
  const loadHistory = async (roomId) => {
    const q = query(collection(db, "messages"), where("roomId", "==", roomId));

    const snap = await getDocs(q);
    const history = snap.docs
      .map((d) => d.data())
      .sort((a, b) => a.createdAt - b.createdAt);

    setMessages(history);
  };

  /* GROUP MESSAGES BY DATE */
  const groupMessagesByDate = (msgs) => {
    const groups = {};
    msgs.forEach((msg) => {
      const date = new Date(msg.createdAt);
      const dateKey = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(msg);
    });
    return groups;
  };

  const isToday = (date) => {
    const today = new Date();
    const msgDate = new Date(date);
    return (
      msgDate.getDate() === today.getDate() &&
      msgDate.getMonth() === today.getMonth() &&
      msgDate.getFullYear() === today.getFullYear()
    );
  };

  const isYesterday = (date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const msgDate = new Date(date);
    return (
      msgDate.getDate() === yesterday.getDate() &&
      msgDate.getMonth() === yesterday.getMonth() &&
      msgDate.getFullYear() === yesterday.getFullYear()
    );
  };

  const groupedMessages = groupMessagesByDate(messages);

  const formatDateLabel = (dateKey) => {
    const firstMsg = groupedMessages[dateKey][0];
    if (isToday(firstMsg.createdAt)) return "Today";
    if (isYesterday(firstMsg.createdAt)) return "Yesterday";
    return dateKey;
  };

  /* SEND MESSAGE */
  const sendMessage = async () => {
    if (!input.trim() || !room || !user) return;

    const msg = {
      roomId: room,
      senderId: user.uid,
      senderRole: "doctor",
      text: input,
      createdAt: Date.now(),
    };

    await addDoc(collection(db, "messages"), msg);

    setMessages((prev) => [...prev, msg]);
    setInput("");
  };

  /* AUTO SCROLL */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className='flex h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex-col md:flex-row'>
      {/* Sidebar (Patients List) */}
      <div
        className={`w-full md:w-80 bg-white border-r border-slate-200 flex flex-col shadow-lg 
        ${room ? "hidden md:flex" : "flex"}`}
      >
        <h2 className='text-2xl font-bold text-white p-6 border-b border-slate-200 bg-gradient-to-r from-indigo-600 to-purple-600'>
          Patients
        </h2>

        <div className='flex-1 overflow-y-auto'>
          {chats.map((c) => {
            const isSelected = room === c.roomId;
            return (
              <button
                key={c.roomId}
                onClick={() => setRoom(c.roomId)}
                className={`w-full text-left p-4 border-b border-slate-100 transition-all duration-200 hover:bg-indigo-50 ${
                  isSelected
                    ? "bg-indigo-50 border-l-4 border-l-indigo-600"
                    : ""
                }`}
              >
                <div className='flex items-center gap-3'>
                  <div className='relative'>
                    <div className='w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-lg shadow-md'>
                      {c.patient.displayName?.charAt(0).toUpperCase() || "P"}
                    </div>
                  </div>
                  <div className='flex-1 min-w-0'>
                    <p className='font-semibold text-slate-800 truncate'>
                      {c.patient.displayName}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      <main
        className={`flex flex-col flex-1 ${!room ? "hidden md:flex" : "flex"}`}
      >
        <div className='flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-slate-50'>
          {Object.keys(groupedMessages).map((dateKey) => (
            <div key={dateKey} className='space-y-4'>
              <div className='flex items-center justify-center my-4'>
                <div className='bg-slate-200 text-slate-600 text-xs font-medium px-3 py-1 rounded-full'>
                  {formatDateLabel(dateKey)}
                </div>
              </div>
              {groupedMessages[dateKey].map((m, i) => {
                const isDoctor = m.senderRole === "doctor";
                return (
                  <div
                    key={i}
                    className={`flex ${
                      isDoctor ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[85%] sm:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
                        isDoctor
                          ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-br-sm"
                          : "bg-white text-slate-800 rounded-bl-sm border border-slate-200"
                      }`}
                    >
                      <p className='text-sm leading-relaxed'>{m.text}</p>
                      <p
                        className={`text-xs mt-1 ${
                          isDoctor ? "text-indigo-100" : "text-slate-400"
                        }`}
                      >
                        {formatTime(m.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className='bg-white border-t border-slate-200 p-3 sm:p-4 shadow-lg'>
          <div className='flex flex-col sm:flex-row gap-3 items-stretch sm:items-end max-w-4xl mx-auto'>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              className='flex-1 border border-slate-300 rounded-full px-4 sm:px-5 py-2 sm:py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all'
              placeholder='Type your message...'
            />
            <Btn onClick={sendMessage} disabled={!input.trim()}>
              Send
            </Btn>
          </div>
        </div>

        {/* Back button for mobile */}
        <div className='md:hidden p-3 border-t border-slate-200 bg-slate-50'>
          <button
            onClick={() => setRoom(null)}
            className='w-full bg-slate-200 text-slate-700 px-4 py-2 rounded-full font-medium hover:bg-slate-300 transition-all'
          >
            Back to Patients
          </button>
        </div>
      </main>
    </div>
  );
}
