import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllTask } from './all-task';

describe('AllTask', () => {
  let component: AllTask;
  let fixture: ComponentFixture<AllTask>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllTask]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllTask);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
