"use client";

import Nav from "../component/Nav";
import Loader from "../component/Loader";
import "./globals.css";
import { Toaster } from "sonner";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body
        className='w-full bg-gray-50'
        style={{ height: "calc(100vh - 65px)" }}
      >
        <Loader />
        <Nav />
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}
