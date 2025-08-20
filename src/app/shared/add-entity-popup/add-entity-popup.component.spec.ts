import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEntityPopupComponent } from './add-entity-popup.component';

describe('AddEntityPopupComponent', () => {
  let component: AddEntityPopupComponent;
  let fixture: ComponentFixture<AddEntityPopupComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AddEntityPopupComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEntityPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
