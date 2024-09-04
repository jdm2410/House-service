import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarUserComponent } from './calendar-user.component';

describe('CalendarUserComponent', () => {
  let component: CalendarUserComponent;
  let fixture: ComponentFixture<CalendarUserComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CalendarUserComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalendarUserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
