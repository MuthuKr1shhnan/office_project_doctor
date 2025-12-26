"use client";

export default function Btn({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  let baseStyles =
    "text-sm font-medium py-2 rounded-lg transition backdrop-blur-md bg-opacity-80 border border-white/20 shadow-lg";

  let variantStyles =
    variant === "primary"
      ? "bg-[#FE5B63] text-white bg-gradient-to-r from-white/10 to-white/5 p-4 hover:bg-[#ff6b71]/90"
      : "border border-[#FE5B63] p-4 text-[#FE5B63] hover:bg-[#fff1f2]/70";

  return (
    <button
      {...props}
      className={`${baseStyles} ${variantStyles} ${className}`}
    >
      {children}
    </button>
  );
}
