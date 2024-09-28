import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterModule } from "@angular/router";

@Component({
  selector: "tudu-settings",
  standalone: true,
  imports: [RouterModule],
  templateUrl: "./settings.component.html",
  styleUrl: "./settings.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  navItems = [
    {
      label: "General",
      path: "general",
    },
    {
      label: "Notifications",
      path: "notifications",
    },
    {
      label: "Appearance",
      path: "appearance",
    },
    {
      label: "Chat",
      path: "chat",
    },
    {
      label: "Account",
      path: "account",
    },
  ];
}
