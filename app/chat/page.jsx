"use client";

import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
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

const socket = io("https://office-task-backend.onrender.com", {
  transports: ["websocket"],
});

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

    socket.emit("join_room", {
      roomId: room,
      userId: user.uid,
    });

    loadHistory(room);
  }, [room]);

  /* LOAD MESSAGE HISTORY */
  const loadHistory = async (roomId) => {
    const q = query(
      collection(db, "messages"),
      where("roomId", "==", roomId)
    );

    const snap = await getDocs(q);
    const history = snap.docs
      .map((d) => d.data())
      .sort((a, b) => a.createdAt - b.createdAt);

    setMessages(history);
  };

  /* SOCKET RECEIVE */
  useEffect(() => {
    const handler = (msg) => {
      setMessages((prev) => [...prev, msg]);
    };

    socket.on("r_message", handler);
    return () => socket.off("r_message", handler);
  }, []);

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
    socket.emit("send_message", msg);

    setMessages((prev) => [...prev, msg]);
    setInput("");
  };

  /* AUTO SCROLL */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex h-screen">
      <aside className="w-64 border-r p-4">
        <h2 className="font-semibold mb-3">Patients</h2>

        {chats.map((c) => (
          <button
            key={c.roomId}
            onClick={() => setRoom(c.roomId)}
            className="block w-full text-left px-3 py-2 rounded hover:bg-indigo-100"
          >
            {c.patient.displayName}
          </button>
        ))}
      </aside>

      <main className="flex flex-col flex-1 p-4">
        <div className="flex-1 overflow-y-auto space-y-2">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[70%] px-4 py-2 rounded-xl ${
                m.senderRole === "doctor"
                  ? "ml-auto bg-indigo-600 text-white"
                  : "bg-gray-200"
              }`}
            >
              {m.text}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
          className="flex gap-2 pt-3 border-t"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 border rounded px-3 py-2"
            placeholder="Type a message..."
          />
          <button className="bg-indigo-600 text-white px-4 rounded">
            Send
          </button>
        </form>
      </main>
    </div>
  );
}
