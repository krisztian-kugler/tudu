import { provideHttpClient } from "@angular/common/http";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { TranslationService } from "./translation.service";
import { TestBed } from "@angular/core/testing";

describe("TranslationService", () => {
  let httpTesting: HttpTestingController;
  let service: any;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    httpTesting = TestBed.inject(HttpTestingController);

    service = TestBed.runInInjectionContext(() => new TranslationService());
  });

  it("should initialize without any translations", () => {
    expect(service).toBeDefined();
  });
});
