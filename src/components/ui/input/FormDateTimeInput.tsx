import React from "react";
import { LuCalendar, LuClock } from "react-icons/lu";

interface FormDateTimeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  hint?: string;
  className?: string;
  showTime?: boolean;
}

const FormDateTimeInput: React.FC<FormDateTimeInputProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  error = false,
  hint,
  className = "",
  showTime = false,
}) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      if (showTime) {
        onChange(new Date(e.target.value).toISOString());
      } else {
        // Para apenas data, definir horário como meio-dia UTC para evitar problemas de timezone
        const date = new Date(e.target.value + "T12:00:00.000Z");
        onChange(date.toISOString());
      }
    } else {
      onChange("");
    }
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (value && e.target.value) {
      const dateOnly = value.slice(0, 10);
      const timeValue = e.target.value;
      const newDateTime = new Date(dateOnly + "T" + timeValue + ":00.000Z");
      onChange(newDateTime.toISOString());
    }
  };

  let inputClasses = `flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`;

  if (disabled) {
    inputClasses += " opacity-50 cursor-not-allowed";
  }

  if (error) {
    inputClasses += " border-red-500 focus:ring-red-500";
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {showTime ? (
          <LuClock className="inline mr-2" />
        ) : (
          <LuCalendar className="inline mr-2" />
        )}
        {label}
      </label>

      <div className="flex gap-2">
        <input
          type={showTime ? "datetime-local" : "date"}
          value={
            value
              ? showTime
                ? new Date(value).toISOString().slice(0, -1)
                : new Date(value).toISOString().slice(0, 10)
              : ""
          }
          onChange={handleInputChange}
          disabled={disabled}
          className={inputClasses}
        />
        {showTime && value && (
          <input
            type="time"
            value={value ? new Date(value).toTimeString().slice(0, 5) : ""}
            onChange={handleTimeChange}
            disabled={disabled}
            className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        )}
      </div>

      {hint && (
        <p
          className={`mt-1 text-sm ${
            error ? "text-red-500" : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

export default FormDateTimeInput;
