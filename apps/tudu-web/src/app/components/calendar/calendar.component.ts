import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "tudu-calendar",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./calendar.component.html",
  styleUrls: ["./calendar.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CalendarComponent {}
