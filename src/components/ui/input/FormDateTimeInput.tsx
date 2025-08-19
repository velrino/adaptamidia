import React from "react";
import { LuCalendar } from "react-icons/lu";

interface FormDateTimeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  hint?: string;
  className?: string;
}

const FormDateTimeInput: React.FC<FormDateTimeInputProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  error = false,
  hint,
  className = "",
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(new Date(e.target.value).toISOString());
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
        <LuCalendar className="inline mr-2" />
        {label}
      </label>
      <input
        type="datetime-local"
        value={new Date(value).toISOString().slice(0, -1)}
        onChange={handleChange}
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

export default FormDateTimeInput;