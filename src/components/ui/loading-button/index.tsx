/* eslint-disable @typescript-eslint/no-explicit-any */

import { Loader2 } from "lucide-react";

export function LoadingButton({
  onClick,
  loading,
  icon: Icon,
  children,
  variant = "primary",
}: {
  onClick: () => void;
  loading: boolean;
  icon: any;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
}) {
  const baseClasses =
    "flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 font-medium text-sm";
  const variants = {
    primary:
      "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl",
    secondary:
      "bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300",
  };

  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`${baseClasses} ${variants[variant]} ${
        loading ? "opacity-75 cursor-not-allowed" : "hover:scale-105"
      }`}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Icon className="w-4 h-4" />
      )}
      <span>{children}</span>
    </button>
  );
}
