import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class DragAndDropService {
  isDragging$ = new BehaviorSubject<boolean>(false);
}
