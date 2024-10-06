import { inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { createTranslationService } from "./create-translation-service";

import type translations from "../../../../assets/translations/en.json";
import type { Language } from "./types";

type Translations = typeof translations;

export const TranslationService = createTranslationService<Translations>({
  availableLanguages: ["en", "hu"],
  initialLanguage: "en",
  fetchTranslations: (language: Language) => {
    const http = inject(HttpClient);
    return http.get<Translations>(`assets/translations/${language}.json`);
  },
});
