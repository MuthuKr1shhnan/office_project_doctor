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
    <html lang='en'>
      <body className='  md:flex'>
          <Nav />

        <main className='flex-1 h-screen overflow-y-auto'>{children}</main>
      </body>
    </html>
  );
}
