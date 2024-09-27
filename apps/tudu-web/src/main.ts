import { provideHttpClient } from "@angular/common/http";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideRouter } from "@angular/router";

import { AppComponent } from "./app/app.component";
import { routes } from "./app/routes";
import { provideIcons } from "./provide-icons";

bootstrapApplication(AppComponent, {
  providers: [provideRouter(routes), provideHttpClient(), provideIcons()],
});
