import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileAlterPopupComponent } from './profile-alter-popup.component';

describe('ProfileAlterPopupComponent', () => {
  let component: ProfileAlterPopupComponent;
  let fixture: ComponentFixture<ProfileAlterPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ProfileAlterPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfileAlterPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
