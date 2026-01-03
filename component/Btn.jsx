"use client";

export default function Btn({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const baseStyles =
    "px-4 py-2 rounded-full font-medium transition-all shadow-md hover:shadow-lg";
  const variantStyles = {
    primary:
      "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700",
    sec: "bg-white border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50",
  };

  return (
    <button
      {...props}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
}