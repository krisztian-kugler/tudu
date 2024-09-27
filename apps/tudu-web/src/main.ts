import { APP_INITIALIZER } from "@angular/core";
import { provideHttpClient } from "@angular/common/http";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideRouter } from "@angular/router";
import { Observable } from "rxjs";

import { AppComponent } from "./app/app.component";
import { routes } from "./app/routes";
import { provideIcons } from "./provide-icons";
import { TranslationService } from "./app/shared/features/translation/translation.service";

import type { Translations } from "./app/shared/features/translation/types";

const initializeApp =
  (translationService: TranslationService): (() => Observable<Translations | undefined>) =>
  () =>
    translationService.loadTranslations("en");

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    provideIcons(),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [TranslationService],
      multi: true,
    },
  ],
});
