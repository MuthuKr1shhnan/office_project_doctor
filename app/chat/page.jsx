"use client";
import { useState } from "react";

export default function Page() {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello Doctor 👋", sender: "user" },
    { id: 2, text: "Hi, how can I help you?", sender: "doctor" },
  ]);

  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;

    setMessages((prev) => [
      ...prev,
      { id: Date.now(), text: input, sender: "user" },
    ]);
    setInput("");
  };

  return (
    <div className='flex  h-[calc(100dvh-75px)] items-center justify-center bg-gray-100  '>
      {/* Messages */}

      <div className='flex flex-col gap-2.5 p-4 md:w-1/2 h-full md:pt-4'>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`max-w-[80%] rounded-lg px-3 py-2 text-sm sm:text-base
                    ${
                      msg.sender === "user"
                        ? "self-end bg-indigo-600 text-white"
                        : "self-start bg-gray-200 text-gray-900"
                    }`}
          >
            {msg.text}
          </div>
        ))}
        {/* Input */}
        <div className='flex w-full justify-center items-center gap-2 border-t px-3 py-4 mt-auto '>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='Type a message...'
            className='flex-1 rounded-lg border px-3 py-2 text-sm outline-none focus:border-indigo-500 sm:text-base'
          />
          <button
            onClick={sendMessage}
            className='rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 sm:text-base'
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
