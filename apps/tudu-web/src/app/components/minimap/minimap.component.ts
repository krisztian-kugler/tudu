import { ChangeDetectionStrategy, Component, Input } from "@angular/core";
import { CommonModule } from "@angular/common";

@Component({
  selector: "tudu-minimap",
  standalone: true,
  imports: [CommonModule],
  template: `
    @for (column of columns; track $index) {
      <div class="column"></div>
    }
  `,
  styleUrls: ["./minimap.component.css"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MinimapComponent {
  @Input({ required: true }) columns: number[][] = [];
}
