import { InjectionToken } from "@angular/core";

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Home,
  Moon,
  Sidebar,
  Sun,
  Trello,
  User,
  X,
} from "./icons";

const icons = {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Home,
  Moon,
  Sidebar,
  Sun,
  Trello,
  User,
  X,
} as const;

type IconKey = keyof typeof icons;
export type IconName = (typeof icons)[IconKey]["name"];
export type IconRegistry = { [Key in IconName]?: string };

const createIconRegistry = (iconCollection: typeof icons) =>
  Object.values(iconCollection).reduce((iconRegistry, { name, svg }) => {
    iconRegistry[name] = svg;
    return iconRegistry;
  }, {} as IconRegistry);

export const Icons = new InjectionToken<IconRegistry>("icons");

export const provideIcons = () => ({ provide: Icons, useValue: createIconRegistry(icons) });
