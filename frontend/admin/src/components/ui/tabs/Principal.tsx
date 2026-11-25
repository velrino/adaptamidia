"use client";

import React, { useState, ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  content: ReactNode; // Conteúdo da aba
}

interface TabsProps {
  tabs: Tab[]; // Lista de abas
  defaultTabId?: string; // Aba padrão (opcional)
  styles?: {
    nav?: string;
    navMenu?: string;
  };
}

export const Tabs: React.FC<TabsProps> = ({ tabs, defaultTabId, styles }) => {
  const [currentTab, setCurrentTab] = useState<string>(
    defaultTabId || tabs[0].id
  );

  return (
    <div>
      {/* Navegação das abas */}
      <nav
        className={`-mb-px flex space-x-2 overflow-x-auto [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-gray-200 dark:[&::-webkit-scrollbar-thumb]:bg-gray-600 dark:[&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1.5 ${styles?.nav}`}
      >
        <div className={`${styles?.navMenu}`}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`inline-flex items-center border-b-2 px-2.5 py-2 text-sm font-medium transition-colors duration-200 ease-in-out ${
                currentTab === tab.id
                  ? "text-brand-500 dark:text-brand-400 border-brand-500 dark:border-brand-400"
                  : "bg-transparent text-gray-500 border-transparent hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
              onClick={() => setCurrentTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Conteúdo das abas */}
      <div className="pt-4 dark:border-gray-800">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            style={{ display: currentTab === tab.id ? "block" : "none" }} // Mostra/esconde o conteúdo
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
};
