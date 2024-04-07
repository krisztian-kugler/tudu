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
    loadComponent: () => import("./components/board/board.component").then((mod) => mod.BoardComponent),
  },
  {
    path: "backlog",
    title: getTitle("Backlog"),
    loadComponent: () => import("./components/backlog/backlog.component").then((mod) => mod.BacklogComponent),
  },
  {
    path: "calendar",
    title: getTitle("Calendar"),
    loadComponent: () => import("./components/calendar/calendar.component").then((mod) => mod.CalendarComponent),
  },
  {
    path: "",
    redirectTo: "home",
    pathMatch: "full",
  },
];
