import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileWorkerComponent } from './profile-worker.component';

describe('ProfileWorkerComponent', () => {
  let component: ProfileWorkerComponent;
  let fixture: ComponentFixture<ProfileWorkerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProfileWorkerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileWorkerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
