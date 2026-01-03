"use client";

import Image from "next/image";
import "./globals.css";
import heroImage from "../assets/heroimage.png";
import Btn from "../component/Btn";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import Link from "next/link";
import { useEffect, useState } from "react";
export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          setRole(snap.data().role);
        }
      } catch (error) {
        console.error("Error loading user details:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  return (
   <section
  className="w-full h-[calc(100dvh)] bg-cover bg-left-4 bg-center relative"
  style={{ backgroundImage: `url(${heroImage.src})` }}
>
  <div className="flex flex-col justify-center items-start h-full px-8">
    <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-black ">
      Doctor vs Patient
    </h1>

    <p className="mt-4 text-sm md:text-lg lg:text-xl text-black max-w-xl">
      Connecting healthcare professionals with patients anytime, anywhere.
    </p>

    <Btn
      variant="primary"
      className="mt-6 px-6 py-3"
      disabled={loading}
    >
      <Link href="/patients">
        {loading ? "Loading..." : "Get Started"}
      </Link>
    </Btn>
  </div>
</section>
  );
}
