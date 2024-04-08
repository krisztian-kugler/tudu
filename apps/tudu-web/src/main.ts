import { HttpClient, provideHttpClient } from "@angular/common/http";
import { importProvidersFrom } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideRouter } from "@angular/router";
import { TranslateModule, TranslateLoader } from "@ngx-translate/core";
import { TranslateHttpLoader } from "@ngx-translate/http-loader";

import { AppComponent } from "./app/app.component";
import { routes } from "./app/routes";
import { provideIcons } from "./provide-icons";
import { DragAndDropService } from "./app/services/drag-and-drop/drag-and-drop.service";

export const HttpLoaderFactory = (http: HttpClient) => new TranslateHttpLoader(http);

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideIcons(),
    provideHttpClient(),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: {
          provide: TranslateLoader,
          useFactory: HttpLoaderFactory,
          deps: [HttpClient],
        },
        defaultLanguage: "en",
      })
    ),
    DragAndDropService,
  ],
});
