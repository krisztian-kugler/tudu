import { Routes } from "@angular/router";

import { HomeComponent } from "./components/home/home.component";

const getTitle = (title: string) => `Tudu | ${title}`;

export const routes: Routes = [
  {
    path: "home",
    title: getTitle("Home"),
    component: HomeComponent,
  },
  {
    path: "board",
    title: getTitle("Board"),
    loadComponent: () => import("./components/board/board.component").then((m) => m.BoardComponent),
  },
  {
    path: "backlog",
    title: getTitle("Backlog"),
    loadComponent: () => import("./components/backlog/backlog.component").then((m) => m.BacklogComponent),
  },
  {
    path: "calendar",
    title: getTitle("Calendar"),
    loadComponent: () => import("./components/calendar/calendar.component").then((m) => m.CalendarComponent),
  },
  {
    path: "settings",
    title: getTitle("Settings"),
    loadComponent: () => import("./components/settings/settings.component").then((m) => m.SettingsComponent),
  },
  {
    path: "",
    redirectTo: "home",
    pathMatch: "full",
  },
];
