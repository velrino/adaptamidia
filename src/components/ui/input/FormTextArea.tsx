import React from "react";

interface FormTextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  error?: boolean;
  hint?: string;
  className?: string;
}

const FormTextArea: React.FC<FormTextAreaProps> = ({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
  disabled = false,
  error = false,
  hint,
  className = "",
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  let textareaClasses = `w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${className}`;

  if (disabled) {
    textareaClasses += " opacity-50 cursor-not-allowed";
  }

  if (error) {
    textareaClasses += " border-red-500 focus:ring-red-500";
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <textarea
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={textareaClasses}
      />
      {hint && (
        <p className={`mt-1 text-sm ${error ? "text-red-500" : "text-gray-500 dark:text-gray-400"}`}>
          {hint}
        </p>
      )}
    </div>
  );
};

export default FormTextArea;