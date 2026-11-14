import { LanguagePicker } from "@harmo-ui/react";
import { useState } from "react";

const many = [
  { value: "id", label: "Bahasa Indonesia", description: "Indonesian" },
  { value: "de", label: "Deutsch", description: "German" },
  { value: "en", label: "English" },
  { value: "es", label: "Español", description: "Spanish" },
  { value: "fr", label: "Français", description: "French" },
  { value: "it", label: "Italiano", description: "Italian" },
  { value: "nl", label: "Nederlands", description: "Dutch" },
  { value: "pl", label: "Polski", description: "Polish" },
  { value: "pt", label: "Português", description: "Portuguese" },
  { value: "vi", label: "Tiếng Việt", description: "Vietnamese" },
  { value: "tr", label: "Türkçe", description: "Turkish" },
  { value: "ru", label: "Русский", description: "Russian" },
  { value: "uk", label: "Українська", description: "Ukrainian" },
  { value: "ar", label: "العربية", description: "Arabic" },
  { value: "hi", label: "हिन्दी", description: "Hindi" },
  { value: "zh", label: "中文", description: "Chinese" },
  { value: "ja", label: "日本語", description: "Japanese" },
  { value: "ko", label: "한국어", description: "Korean" },
];

export const examples = {
  Default: () => {
    const [language, setLanguage] = useState("en");
    return (
      <LanguagePicker
        aria-label="Language"
        value={language}
        onValueChange={setLanguage}
        languages={[
          { value: "en", label: "English" },
          { value: "de", label: "Deutsch" },
          { value: "es", label: "Español" },
          { value: "fr", label: "Français" },
        ]}
      />
    );
  },

  "Names in the page's language": () => (
    <LanguagePicker
      aria-label="Language"
      defaultValue="en"
      languages={[
        { value: "en", label: "English" },
        { value: "de", label: "Deutsch", description: "German" },
        { value: "es", label: "Español", description: "Spanish" },
        { value: "fr", label: "Français", description: "French" },
      ]}
    />
  ),

  "By region": () => (
    <LanguagePicker
      aria-label="Region and language"
      defaultValue="en-US"
      languages={[
        {
          label: "France",
          icon: <img src="images/flags/fr.svg" alt="" />,
          languages: [
            { value: "fr-FR", label: "Français" },
            { value: "en-FR", label: "English" },
          ],
        },
        {
          label: "Germany",
          icon: <img src="images/flags/de.svg" alt="" />,
          languages: [
            { value: "de-DE", label: "Deutsch" },
            { value: "en-DE", label: "English" },
          ],
        },
        {
          label: "Japan",
          icon: <img src="images/flags/jp.svg" alt="" />,
          languages: [
            { value: "ja-JP", label: "日本語" },
            { value: "en-JP", label: "English" },
          ],
        },
        {
          label: "Mexico",
          icon: <img src="images/flags/mx.svg" alt="" />,
          languages: [
            { value: "es-MX", label: "Español" },
            { value: "en-MX", label: "English" },
          ],
        },
        {
          label: "Spain",
          icon: <img src="images/flags/es.svg" alt="" />,
          languages: [
            { value: "es-ES", label: "Español" },
            { value: "en-ES", label: "English" },
          ],
        },
        {
          label: "Switzerland",
          icon: <img src="images/flags/ch.svg" alt="" />,
          languages: [
            { value: "de-CH", label: "Deutsch" },
            { value: "fr-CH", label: "Français" },
            { value: "it-CH", label: "Italiano" },
            { value: "en-CH", label: "English" },
          ],
        },
        {
          label: "United Kingdom",
          icon: <img src="images/flags/gb.svg" alt="" />,
          languages: [
            { value: "en-GB", label: "English" },
          ],
        },
        {
          label: "United States",
          icon: <img src="images/flags/us.svg" alt="" />,
          languages: [
            { value: "en-US", label: "English" },
            { value: "es-US", label: "Español" },
          ],
        },
      ]}
    />
  ),

  "Regions with search": () => (
    <LanguagePicker
      aria-label="Region and language"
      defaultValue="en-US"
      searchLabel="Search regions and languages"
      emptyMessage="Nothing found"
      languages={[
        {
          label: "France",
          icon: <img src="images/flags/fr.svg" alt="" />,
          languages: [
            { value: "fr-FR", label: "Français" },
            { value: "en-FR", label: "English" },
          ],
        },
        {
          label: "Germany",
          icon: <img src="images/flags/de.svg" alt="" />,
          languages: [
            { value: "de-DE", label: "Deutsch" },
            { value: "en-DE", label: "English" },
          ],
        },
        {
          label: "Spain",
          icon: <img src="images/flags/es.svg" alt="" />,
          languages: [
            { value: "es-ES", label: "Español" },
            { value: "en-ES", label: "English" },
          ],
        },
        {
          label: "Switzerland",
          icon: <img src="images/flags/ch.svg" alt="" />,
          languages: [
            { value: "de-CH", label: "Deutsch" },
            { value: "fr-CH", label: "Français" },
            { value: "it-CH", label: "Italiano" },
            { value: "en-CH", label: "English" },
          ],
        },
        {
          label: "United States",
          icon: <img src="images/flags/us.svg" alt="" />,
          languages: [
            { value: "en-US", label: "English" },
            { value: "es-US", label: "Español" },
          ],
        },
      ]}
    />
  ),

  "With search": () => (
    <LanguagePicker
      aria-label="Language"
      defaultValue="en"
      searchLabel="Search languages"
      emptyMessage="No languages found"
      languages={many}
    />
  ),

  "Right to left": () => (
    <div dir="rtl" lang="ar">
      <LanguagePicker
        aria-label="اللغة"
        defaultValue="ar"
        languages={[
          { value: "ar", label: "العربية" },
          { value: "en", label: "English", description: "الإنجليزية" },
          { value: "fr", label: "Français", description: "الفرنسية" },
          { value: "es", label: "Español", description: "الإسبانية" },
        ]}
      />
    </div>
  ),
};
