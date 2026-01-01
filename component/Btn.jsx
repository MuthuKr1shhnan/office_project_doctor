"use client";

export default function Btn({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const baseStyles =
    "text-sm font-medium py-2 rounded-lg transition backdrop-blur-md bg-opacity-80 shadow-lg";

  const variantStyles =
    variant === "primary"
      ? "bg-[#FE5B63] text-white bg-gradient-to-r from-white/10 to-white/5 p-4 border border-white/20 hover:bg-[#ff6b71]/90"
      : "p-4 text-[#FE5B63] border-1 border-[#FE5B63]/25 hover:bg-[#fff1f2]/70";

  return (
    <button
      {...props}
      className={`${baseStyles} ${variantStyles} ${className}`}
    >
      {children}
    </button>
  );
}
