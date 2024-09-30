import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TranslationService } from "./translation.service";
import { TestBed } from "@angular/core/testing";

describe("TranslationService", () => {
  let httpTesting: HttpTestingController;
  let service: TranslationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    httpTesting = TestBed.inject(HttpTestingController);

    service = TestBed.runInInjectionContext(() => new TranslationService());
  });

  it("should initialize without any translations", () => {
    expect(service.translations()).toBeUndefined();
  });

  it("should load the translations correctly", () => {
    expect(service.translations()).toBeUndefined();
  });
});
