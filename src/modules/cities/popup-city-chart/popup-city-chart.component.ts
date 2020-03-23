import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import Chart from "chart.js";

@Component({
  selector: 'app-popup-city-chart',
  templateUrl: './popup-city-chart.component.html',
  styleUrls: ['./popup-city-chart.component.css']
})
export class PopupCityChartComponent implements AfterViewInit {
  @Input()
  municipio;

  @ViewChild("grafico") private graficoEl: ElementRef;

  constructor() { }
  ngAfterViewInit(): void {
    const ctx = this.graficoEl.nativeElement.getContext('2d');
    const chart = new Chart(ctx, {
      // The type of chart we want to create
    type: 'line',

    // The data for our dataset
    data: {
        labels: ['January', 'February', 'March', 'April', 'May', 'June', 'July'],
        datasets: [{
            label: 'My First dataset',
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: 'rgb(255, 99, 132)',
            data: [0, 10, 5, 2, 20, 30, 45]
        }]
    },

    // Configuration options go here
    options: {}
    });
  }

}
