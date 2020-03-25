import { Component } from '@angular/core';

@Component({
  selector: 'app-body',
  templateUrl: './body.component.html',
  styleUrls: ['./body.component.scss']
})
export class BodyReduxComponent  {

 // Set our map properties
 mapCenter = [-91.9672633, 41.01768];
 basemapType = 'satellite';
 mapZoomLevel = 18;

 // See app.component.html
 mapLoadedEvent(status: boolean) {
   console.log('The map loaded: ' + status);
 }

}
