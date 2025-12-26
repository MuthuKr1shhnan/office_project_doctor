"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function Loader() {
  const pathname = usePathname();
  const [showLoader, setShowLoader] = useState(false);

  // paths where loader is allowed
  const whenToLoad = [
    { path: "/", loaded: false },
    { path: "/about", loaded: false },
    { path: "/doctors", loaded: false },
    { path: "/feedback", loaded: false },
    { path: "/login", loaded: false },
    { path: "/otp-validation", loaded: false },
  ];

  useEffect(() => {
    // get stored data
    const stored = JSON.parse(sessionStorage.getItem("route-loader") || "[]");

    // find current path object
    const current = whenToLoad.filter((item) => item.path === pathname);

    // if path exists and not loaded before
    if (current && !stored.includes(pathname)) {
      setShowLoader(true);

      // mark as loaded
      sessionStorage.setItem(
        "route-loader",
        JSON.stringify([...stored, pathname])
      );

      // hide loader after time
      const timer = setTimeout(() => {
        setShowLoader(false);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  if (!showLoader) return null;

  return (
    <div className='fixed inset-0 flex items-center justify-center bg-white z-50'>
      <div className='flex flex-col items-center'>
        <div className='w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3' />
        <p className='text-gray-500'>Loading...</p>
      </div>
    </div>
  );
}
