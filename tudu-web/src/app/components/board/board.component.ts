import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CommonModule } from "@angular/common";

import { MinimapComponent } from "../minimap/minimap.component";
import { DraggableDirective } from "src/app/directives/draggable/draggable.directive";
import { DropListDirective } from "src/app/directives/drop-list/drop-list.directive";
import { DragAreaDirective } from "src/app/directives/drag-area/drag-area.directive";
import { AutoScrollDirective } from "src/app/directives/auto-scroll/auto-scroll.directive";
import { DragAndDropService } from "src/app/services/drag-and-drop/drag-and-drop.service";
import { moveItemInArray } from "src/utils/array";

type Ticket = number;

@Component({
  selector: "tudu-board",
  standalone: true,
  imports: [
    CommonModule,
    MinimapComponent,
    DraggableDirective,
    DropListDirective,
    DragAreaDirective,
    AutoScrollDirective,
  ],
  templateUrl: "./board.component.html",
  styleUrls: ["./board.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BoardComponent {
  board = [
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    [11, 12, 13, 14, 15, 16, 17, 18],
    [21, 22, 23, 24, 25, 26, 27],
    [31, 32, 33, 34],
    [],
    [41, 42, 43, 44, 45, 46, 47],
    [51, 52, 53, 54, 55, 56, 57, 58, 59],
    [61, 62, 63, 64, 65, 66, 67, 68],
    [71, 72, 73, 74, 75, 76],
    [81, 82, 83, 84, 85, 86, 87, 88, 89],
    [91, 92, 93, 94, 95, 96, 97],
    [101, 102, 103, 104, 105, 106, 107, 108, 109],
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    [11, 12, 13, 14, 15, 16, 17, 18],
    [21, 22, 23, 24, 25, 26, 27],
    [31, 32, 33, 34],
    [41, 42, 43, 44, 45, 46, 47],
    [51, 52, 53, 54, 55, 56, 57, 58, 59],
    [61, 62, 63, 64, 65, 66, 67, 68],
    [71, 72, 73, 74, 75, 76],
    [81, 82, 83, 84, 85, 86, 87, 88, 89],
    [91, 92, 93, 94, 95, 96, 97],
    [101, 102, 103, 104, 105, 106, 107, 108, 109],
    [1, 2, 3, 4, 5, 6, 7, 8, 9],
    [11, 12, 13, 14, 15, 16, 17, 18],
    [21, 22, 23, 24, 25, 26, 27],
    [31, 32, 33, 34],
    [41, 42, 43, 44, 45, 46, 47],
    [51, 52, 53, 54, 55, 56, 57, 58, 59],
    [61, 62, 63, 64, 65, 66, 67, 68],
    [71, 72, 73, 74, 75, 76],
    [81, 82, 83, 84, 85, 86, 87, 88, 89],
    [91, 92, 93, 94, 95, 96, 97],
    [101, 102, 103, 104, 105, 106, 107, 108, 109],
  ];

  board2 = [
    [1, 2, 3],
    [11, 12, 13],
    [21, 22, 23],
  ];

  constructor(public dragAndDropService: DragAndDropService) {}

  ticketTrackBy(_: number, ticket: Ticket): number {
    return ticket;
  }

  onDrop({ fromIndex, toIndex }: any) {
    console.log(fromIndex, toIndex);
    moveItemInArray(this.board[2], fromIndex, toIndex);
  }
}
