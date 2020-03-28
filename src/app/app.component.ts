import { Component } from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import moment from "moment-timezone"

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'covid19brasilmap';

  constructor(private translate: TranslateService) {
    translate.setDefaultLang(navigator.language.match(/^pt/) ? "pt-BR" : 'en');
    moment.locale(navigator.language);
  }
}
