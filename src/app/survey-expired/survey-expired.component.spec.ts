import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SurveyExpiredComponent } from './survey-expired.component';

describe('SurveyExpiredComponent', () => {
  let component: SurveyExpiredComponent;
  let fixture: ComponentFixture<SurveyExpiredComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SurveyExpiredComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SurveyExpiredComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
