import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewEvidencesComponent } from './view-evidences.component';

describe('ViewEvidencesComponent', () => {
  let component: ViewEvidencesComponent;
  let fixture: ComponentFixture<ViewEvidencesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ViewEvidencesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ViewEvidencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
