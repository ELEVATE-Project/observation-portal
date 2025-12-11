import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ObservationFilterComponent } from './observation-filter.component';

describe('ObservationFilterComponent', () => {
  let component: ObservationFilterComponent;
  let fixture: ComponentFixture<ObservationFilterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ObservationFilterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ObservationFilterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
