import React from "react";
import type { IconType } from "react-icons";

interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: "text" | "email" | "password" | "url";
  placeholder?: string;
  icon?: IconType;
  disabled?: boolean;
  error?: boolean;
  hint?: string;
  className?: string;
}

const FormInput: React.FC<FormInputProps> = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  icon: Icon,
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
        {Icon && <Icon className="inline mr-2" />}
        {label}
      </label>
      <input
        type={type}
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

export default FormInput;