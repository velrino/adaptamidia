import React from "react";
import { ChevronDownIcon } from "@/icons";

interface IAccordion {
  isOpen: boolean; // Controls whether the accordion is open or closed
  title: string; // Title of the accordion
  children: React.ReactNode; // Content to be displayed when the accordion is open
  toggleAccordion: () => void; // Function to toggle the accordion state
}

const Accordion: React.FC<IAccordion> = ({
  title,
  children,
  isOpen,
  toggleAccordion,
}) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Accordion Header */}
      <div
        onClick={toggleAccordion} // Use the passed toggle function
        className={`flex cursor-pointer items-center justify-between py-1 pl-6 pr-3 ${
          isOpen ? "bg-gray-50 dark:bg-white/[0.03]" : ""
        }`}
      >
        <h4 className="text-lg font-medium text-gray-800 dark:text-white/90">
          {title}
        </h4>
        <button
          className={`flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 duration-200 transition-transform ease-linear dark:bg-white/[0.03] ${
            isOpen
              ? "text-gray-800 dark:text-white/90 rotate-180"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          <ChevronDownIcon />
        </button>
      </div>

      {/* Accordion Content */}
      {isOpen && <div className="p-2">{children}</div>}
    </div>
  );
};

export default Accordion;
