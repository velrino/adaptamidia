import React from "react";
import { LuLink } from "react-icons/lu";

interface FormUrlInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  error?: boolean;
  hint?: string;
  className?: string;
}

const FormUrlInput: React.FC<FormUrlInputProps> = ({
  label,
  value,
  onChange,
  placeholder,
  disabled = false,
  error = false,
  hint,
  className = "",
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  let inputClasses = `w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`;

  if (disabled) {
    inputClasses += " opacity-50 cursor-not-allowed";
  }

  if (error) {
    inputClasses += " border-red-500 focus:ring-red-500";
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        <LuLink className="inline mr-2" />
        {label}
      </label>
      <input
        type="url"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClasses}
      />
      {hint && (
        <p className={`mt-1 text-sm ${error ? "text-red-500" : "text-gray-500 dark:text-gray-400"}`}>
          {hint}
        </p>
      )}
    </div>
  );
};

export default FormUrlInput;