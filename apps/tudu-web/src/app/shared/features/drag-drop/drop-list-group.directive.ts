import { Directive, OnDestroy } from "@angular/core";

import type { DropListDirective } from "./drop-list.directive";

@Directive({
  selector: "[tuduDropListGroup]",
  standalone: true,
})
export class DropListGroupDirective implements OnDestroy {
  readonly items = new Set<DropListDirective>();

  addDropList(dropList: DropListDirective) {
    this.items.add(dropList);
  }

  removeDropList(dropList: DropListDirective) {
    this.items.delete(dropList);
  }

  ngOnDestroy() {
    this.items.clear();
  }
}
