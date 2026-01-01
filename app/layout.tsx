"use client";

import Nav from "../component/Nav";
import Loader from "../component/Loader";
import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="w-full h-screen bg-gray-50 flex">

        <div className="w-64 p-4 bg-gray-800 text-white">
          <Nav />
        </div>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
