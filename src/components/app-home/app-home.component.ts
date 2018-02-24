import { Component } from '@angular/core';
import { DatepickerOptions } from '../../ng-datepicker/component/ng-datepicker-inline.component';
import * as enLocale from 'date-fns/locale/en';
import * as frLocale from 'date-fns/locale/fr';

@Component({
  selector: 'app-home',
  templateUrl: 'app-home.component.html'
})
export class AppHomeComponent {
  date: Date;
  range: Array<Date>;
  options: DatepickerOptions = {
    locale: enLocale
  };
  constructor() {
    this.date = new Date();
    this.range = new Array<Date>(0);
    this.range.push(new Date(2018, 1, 21));
    this.range.push(new Date(2018, 1, 26));
  }
}
