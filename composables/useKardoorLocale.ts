import { useState } from "#app";

export const useKardoorLocale = () => {
  const locale = useState<"tr" | "en">("kardoor-locale", () => "tr");

  const setLocale = (value: "tr" | "en") => {
    locale.value = value;
  };

  return {
    locale,
    setLocale
  };
};
