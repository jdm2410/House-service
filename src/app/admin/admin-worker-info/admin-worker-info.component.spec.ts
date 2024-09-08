import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminWorkerInfoComponent } from './admin-worker-info.component';

describe('AdminWorkerInfoComponent', () => {
  let component: AdminWorkerInfoComponent;
  let fixture: ComponentFixture<AdminWorkerInfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AdminWorkerInfoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminWorkerInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
