import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PopupCityChartComponent } from './popup-city-chart.component';

describe('PopupCityChartComponent', () => {
  let component: PopupCityChartComponent;
  let fixture: ComponentFixture<PopupCityChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PopupCityChartComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PopupCityChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
