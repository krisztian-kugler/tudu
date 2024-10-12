import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { of } from "rxjs";

import { createTranslationService } from "./create-translation-service";

const testTranslations = {
  en: {
    a: "value A (en)",
    b: {
      c: "value C (en)",
      d: {
        e: "value E (en)",
      },
    },
  },
  hu: {
    a: "value A (hu)",
    b: {
      c: "value C (hu)",
      d: {
        e: "value E (hu)",
      },
    },
  },
};

const TranslationService = createTranslationService<typeof testTranslations.en>({
  availableLanguages: ["en", "hu"],
  initialLanguage: "en",
  loadTranslations: (language) => of(testTranslations[language]),
});

describe("createTranslationService", () => {
  let httpTesting: HttpTestingController;
  let service: InstanceType<typeof TranslationService>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    httpTesting = TestBed.inject(HttpTestingController);
    service = TestBed.runInInjectionContext(() => new TranslationService());
  });

  it("should initialize correctly", () => {
    expect(service.availableLanguages).toEqual(["en", "hu"]);
    expect(service.language()).toBe("en");
  });
});
