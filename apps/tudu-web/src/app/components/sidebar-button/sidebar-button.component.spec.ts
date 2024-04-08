import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidebarButtonComponent } from './sidebar-button.component';

describe('SidebarButtonComponent', () => {
  let component: SidebarButtonComponent;
  let fixture: ComponentFixture<SidebarButtonComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SidebarButtonComponent]
    });
    fixture = TestBed.createComponent(SidebarButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
