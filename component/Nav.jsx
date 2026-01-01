"use client"; // if using Next.js App Router
import logo from "../assets/logo.png";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Btn from "../component/Btn";
import Image from "next/image";
import ProfileDrawer from "../component/ProfileDrawer";
import { auth, db } from "../lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { menu, login, account } from "../config/navData";
import { Doctor as doctor } from "../assets/icon";

export default function Nav() {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenDrawer, setIsOpenDrawer] = useState(false);
  const [user, setUser] = useState(null);
  const [otpVerified, setOtpVerified] = useState(false);
  const [roleVerified, setRoleVerified] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  // 🔐 Check auth state and get user role
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        setUser(null);
      } else {
        setUser(currentUser);
        // Get user role from Firestore
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setOtpVerified(true);
          }
          if (userDoc.exists() && userDoc.data().role === "patient") {
            setRoleVerified(true);
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
        }
      }
    });
    return () => unsubscribe();
  }, [user]);

  // 🚪 Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/");
      localStorage.removeItem("isLoggedIn");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const isActiveLink = (link) => pathname === link;

  return (
    <nav className='bg-white w-64 h-screen border-r border-slate-200 fixed left-0 top-0'>
      <div className=' flex flex-col  justify-between p-3'>
        {/* Brand */}
        <Link href='/' className='flex gap-2 items-center'>
          <Image src={doctor} alt='Logo' className='h-12 w-auto' />
          <Image src={logo} alt='Logo' className='h-8 w-auto' />
        </Link>

        {/* Desktop Menu */}
        <div className='hidden md:flex flex-col items-start space-y-6 mt-8'>
          {menu.map((d, i) => (
            <Link
              key={i}
              href={d.link}
              className={`font-medium transition-colors ${
                isActiveLink(d.link)
                  ? "text-[#FE676E]" // ✅ Active state for mobile
                  : "text-slate-600 hover:text-[#f97c83]"
              }`}
            >
              {d.label}
            </Link>
          ))}

          {otpVerified && user ? (
            <Btn
              onClick={() => {
                setIsOpen(false);
                setIsOpenDrawer(true);
              }}
              variant='primary'
              className='w-full'
            >
              {account.label}
            </Btn>
          ) : (
            <Btn variant='primary' className='w-full'>
              <Link href={login.path}>{login.label}</Link>
            </Btn>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className='md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg border border-[#FE636B] bg-slate-50'
        >
          <span className='sr-only'>Open menu</span>
          <svg className='w-5 h-5 stroke-[#FE636B]' viewBox='0 0 24 24'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2.5}
              className={`transition-all duration-300 origin-center ${
                isOpen ? "rotate-45 translate-y-0" : ""
              }`}
              d={isOpen ? "M4 12h16" : "M4 6h16"}
            />
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2.5}
              className={`transition-opacity duration-300 ${
                isOpen ? "opacity-0" : "opacity-100"
              }`}
              d='M4 12h16'
            />
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2.5}
              className={`transition-all duration-300 origin-center ${
                isOpen ? "-rotate-45 translate-y-0" : ""
              }`}
              d={isOpen ? "M4 12h16" : "M4 18h16"}
            />
          </svg>
        </button>

        {/* Mobile Panel 📱📱📱 */}
        {isOpen && (
          <div
            className={`fixed top-16 pointer-none left-0 backdrop-blur-md h-full w-full bg-white/1 pl-8 pr-8 shadow-2xl 
            transform transition-transform duration-800 ease-in-out 
            z-60 overflow-y-auto ${
              isOpen ? "translate-x-0" : "translate-x-full"
            }`}
            onClick={() => setIsOpen(false)}
          >
            <div className='w-full md:hidden   pt-10'>
              <div className='flex flex-col space-y-8'>
                {menu.map((m, i) => (
                  <Link
                    key={i}
                    href={m.link}
                    onClick={() => setIsOpen(false)}
                    className={`font-medium transition-colors ${
                      isActiveLink(m.link)
                        ? "text-[#FE676E]" // ✅ Active state for mobile
                        : "text-slate-600 hover:text-[#f97c83]"
                    }`}
                  >
                    {m.label}
                  </Link>
                ))}
                <div className='flex flex-col-reverse gap-2 w-full justify-center'>
                  <Btn variant='primary'>
                    <Link href={"https://office-project-doctor.vercel.app/"}>
                      For Doctors
                    </Link>
                  </Btn>
                  {otpVerified && user && roleVerified ? (
                    <Btn
                      onClick={() => {
                        setIsOpen(false);
                        setIsOpenDrawer(true);
                      }}
                      variant='primary'
                    >
                      {account.label}
                    </Btn>
                  ) : (
                    <Btn variant='primary'>
                      <Link href={login.path}>{login.label}</Link>
                    </Btn>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ✅ Profile Drawer plugged in */}
        <ProfileDrawer
          isOpen={isOpenDrawer}
          onClose={() => setIsOpenDrawer(false)}
          user={user}
          onLogout={handleLogout}
        />
      </div>
    </nav>
  );
}
