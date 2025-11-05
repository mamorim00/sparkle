"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

// Supported languages
export type Language = "en" | "fi";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translation cache
// eslint-disable-next-line prefer-const
let translationsCache: Record<Language, Record<string, unknown>> = {
  en: {},
  fi: {},
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [translations, setTranslations] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load translations
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        // Check if already cached
        if (Object.keys(translationsCache[language]).length > 0) {
          setTranslations(translationsCache[language]);
          setIsLoading(false);
          return;
        }

        // Load translation file
        const response = await fetch(`/locales/${language}.json`);
        const data = await response.json();

        translationsCache[language] = data;
        setTranslations(data);
      } catch (error) {
        console.error(`Error loading translations for ${language}:`, error);
        // Fallback to English if loading fails
        if (language !== "en") {
          try {
            const fallbackResponse = await fetch("/locales/en.json");
            const fallbackData = await fallbackResponse.json();
            setTranslations(fallbackData);
          } catch (fallbackError) {
            console.error("Error loading fallback translations:", fallbackError);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadTranslations();
  }, [language]);

  // Initialize language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem("sparkle_language") as Language;
    if (savedLanguage && (savedLanguage === "en" || savedLanguage === "fi")) {
      setLanguageState(savedLanguage);
    } else {
      // Default to English
      setLanguageState("en");
    }
  }, []);

  // Save language to localStorage when it changes
  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("sparkle_language", lang);
  };

  // Translation function
  const t = (key: string): string => {
    if (isLoading) {
      return key;
    }

    const keys = key.split(".");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = translations;

    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }

    return typeof value === "string" ? value : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook to use language context
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
