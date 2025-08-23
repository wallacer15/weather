import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WeatherControlsComponent } from './weather-controls.component';

describe('WeatherControlsComponent', () => {
  let component: WeatherControlsComponent;
  let fixture: ComponentFixture<WeatherControlsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WeatherControlsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(WeatherControlsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
