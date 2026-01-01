"use client";

import { useState } from "react";
import emailjs from "emailjs-com";
import Btn from "@/component/Btn";
import { toast } from "sonner";
export default function FeedbackForm() {
  
  const [formData, setFormData] = useState({
    email: "",
    message: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.email.trim() || !formData.message.trim()) {
      alert("Email and message are required.");
      return;
    }

    setLoading(true);

    emailjs
      .sendForm(
        process.env.NEXT_PUBLIC_SERVICE_ID,
        process.env.NEXT_PUBLIC_TEMPLATE_ID,
        e.target,
        process.env.NEXT_PUBLIC_KEY
      )
      .then(() => {
        toast("Message sent successfully.");
        setFormData({ email: "", message: "" });
      })
      .catch(() => {
        alert("Something went wrong. Please try again.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <section
      className=' flex items-center justify-center px-4'
      style={{ height: "calc(100dvh)" }}
    >
      <form
        onSubmit={handleSubmit}
        className='w-full p-5 md:p-0 md:max-w-md text-black'
      >
        <h2 className='text-3xl font-semibold mb-12'>Give Your Feedback</h2>

        <label className='block mb-2 text-gray-800'>Email</label>
        <input
          type='email'
          name='email'
          value={formData.email}
          onChange={handleChange}
          className='w-full bg-transparent border-b-[.25px] border-gray-600/55 py-2 mb-6 focus:outline-none'
        />

        <label className='block mb-2 text-gray-800'>Message</label>
        <textarea
          name='message'
          rows='4'
          value={formData.message}
          onChange={handleChange}
          className='w-full bg-transparent border-b border-gray-600/55  py-2 mb-8 resize-none focus:outline-none'
        />

        <Btn
          type='submit'
          variant='primary'
          disabled={loading}
          className='w-full bg-[#FE656D] text-white py-3 font-medium disabled:opacity-50 hover:bg-[#fc7c83]'
        >
          {loading ? "Sending..." : "Send Feedback"}
        </Btn>
      </form>
    </section>
  );
}
