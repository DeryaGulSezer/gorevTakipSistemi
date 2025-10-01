import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ekle } from './ekle';

describe('Ekle', () => {
  let component: Ekle;
  let fixture: ComponentFixture<Ekle>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ekle]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Ekle);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
