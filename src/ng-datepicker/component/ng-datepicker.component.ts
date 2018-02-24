import { Component, OnInit, Input, OnChanges, SimpleChanges, ElementRef, HostListener, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import {
    startOfMonth,
    endOfMonth,
    addMonths,
    subMonths,
    setYear,
    eachDay,
    getDate,
    getMonth,
    getYear,
    isToday,
    isSameDay,
    isSameMonth,
    isSameYear,
    format,
    getDay,
    subDays,
    setDay, isAfter, isBefore
} from 'date-fns';
import { ISlimScrollOptions } from 'ngx-slimscroll';

export interface DatepickerOptions {
  minYear?: number; // default: current year - 30
  maxYear?: number; // default: current year + 30
  displayFormat?: string; // default: 'MMM D[,] YYYY'
  barTitleFormat?: string; // default: 'MMMM YYYY'
  dayNamesFormat?: string; // default 'ddd'
  barTitleIfEmpty?: string;
  firstCalendarDay?: number; // 0 = Sunday (default), 1 = Monday, ..
  locale?: object;
  minDate?: Date;
  maxDate?: Date;
  isRange?: boolean;
}

/**
 * Internal library helper that helps to check if value is empty
 * @param value
 */
const isNil = (value: Date | DatepickerOptions) => {
  return (typeof value === 'undefined') || (value === null);
};

@Component({
  selector: 'ng-datepicker',
  templateUrl: 'ng-datepicker.component.html',
  styleUrls: ['ng-datepicker.component.sass'],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NgDatepickerComponent), multi: true }
  ]
})
export class NgDatepickerComponent implements ControlValueAccessor, OnInit, OnChanges {
  @Input() options: DatepickerOptions;
  /**
   * Disable datepicker's input
   */
  @Input() headless = false;


  innerValue: any;
  displayFormat: string;
  date: Date;
  endDate: Date;
  barTitle: string;
  barTitleFormat: string;
  barTitleIfEmpty: string;
  minYear: number;
  maxYear: number;
  firstCalendarDay: number;
  view: string;
  years: { year: number; isThisYear: boolean }[];
  dayNames: string[];
  dayNamesFormat: string;
  scrollOptions: ISlimScrollOptions;
  days: {
    date: Date;
    day: number;
    month: number;
    year: number;
    inThisMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    isStartDate: boolean;
    isEndDate: boolean;
    isInRange: boolean;
    isSelectable: boolean;
  }[];
  locale: object;
  isRange = false;
  isStartDateSelected = false;
  isEndDateSelected = false;

  private onTouchedCallback: () => void = () => { };
  private onChangeCallback: (_: any) => void = () => { };

  get value(): any {
    return this.innerValue;
  }

  set value(val: any) {
    if (this.isRange) {
        if (this.innerValue.length == 2) {
            this.innerValue.pop();
            this.innerValue.pop();
        }
        this.innerValue.push(val);
    } else {
        this.innerValue = val;
        this.onChangeCallback(this.innerValue);
    }
  }

  constructor(private elementRef: ElementRef) {
    this.scrollOptions = {
      barBackground: '#DFE3E9',
      gridBackground: '#FFFFFF',
      barBorderRadius: '3',
      gridBorderRadius: '3',
      barWidth: '6',
      gridWidth: '6',
      barMargin: '0',
      gridMargin: '0'
    };
  }

  ngOnInit() {
    this.view = 'days';
    this.date = new Date();
    this.setOptions();
    this.initDayNames();
    this.initYears();
    this.initRange();
  }

  ngOnChanges(changes: SimpleChanges) {
    if ('options' in changes) {
      this.setOptions();
      this.initDayNames();
      this.init();
      this.initYears();
    }
  }

  setOptions(): void {
    const today = new Date(); // this const was added because during my tests, I noticed that at this level this.date is undefined
    this.minYear = this.options && this.options.minYear || getYear(today) - 30;
    this.maxYear = this.options && this.options.maxYear || getYear(today) + 30;
    this.displayFormat = this.options && this.options.displayFormat || 'MMM D[,] YYYY';
    this.barTitleFormat = this.options && this.options.barTitleFormat || 'MMMM YYYY';
    this.dayNamesFormat = this.options && this.options.dayNamesFormat || 'ddd';
    this.barTitleIfEmpty = this.options && this.options.barTitleIfEmpty || 'Click to select a date';
    this.firstCalendarDay = this.options && this.options.firstCalendarDay || 0;
    this.locale = this.options && { locale: this.options.locale } || {};
  }

  nextMonth(): void {
    this.date = addMonths(this.date, 1);
    this.init();
  }

  prevMonth(): void {
    this.date = subMonths(this.date, 1);
    this.init();
  }

  setDate(i: number): void {
    if (!this.isRange) {
        this.date = this.days[i].date;
        this.value = this.date;
        this.init();
    } else {
        if (this.isStartDateSelected && this.isEndDateSelected) {
          this.isStartDateSelected = false;
          this.isEndDateSelected = false;
        }
        if (!this.isStartDateSelected) {
            this.isStartDateSelected = true;
            this.date = this.days[i].date;
            this.value = this.date;
        } else if (!this.isEndDateSelected) {
            this.isEndDateSelected = true;
            this.endDate = this.days[i].date;
            this.value = this.endDate;
        }
        this.init();
    }
  }



  setYear(i: number): void {
    this.date = setYear(this.date, this.years[i].year);
    this.init();
    this.initYears();
    this.view = 'days';
  }

  /**
   * Checks if specified date is in range of min and max dates
   * @param date
   */
  private isDateSelectable(date: Date): boolean {
    if (isNil(this.options)) {
      return true;
    }

    const minDateSet = !isNil(this.options.minDate);
    const maxDateSet = !isNil(this.options.maxDate);
    const timestamp = date.valueOf();

    if (minDateSet && (timestamp < this.options.minDate.valueOf())) {
      return false;
    }

    if (maxDateSet && (timestamp > this.options.maxDate.valueOf())) {
      return false;
    }

    if (this.innerValue instanceof Array) {
      if (this.innerValue[0] instanceof Date && !(this.innerValue[1] instanceof Date)) {
        if (timestamp < this.innerValue[0].valueOf()){
          return false;
        }
      }
    }

    return true;
  }

  init(): void {
    const start = startOfMonth(this.date);
    const end = endOfMonth(this.date);
    let isSelectedInput = function(date) {
        let isSelected = function(date, value) {
            return isSameDay(date, value) && isSameMonth(date, value) && isSameYear(date, value);
        };
        if (this.innerValue instanceof Date) {
            return isSelected(date, this.innerValue);
        } else {
            return isSelected(date, this.innerValue[0]) || isSelected(date, this.innerValue[1]);
        }
    };
    let isStartDate = function(date) {
        if (this.innerValue instanceof Date) {
            return false;
        } else {
            return isSameDay(date, this.innerValue[0]) && isSameMonth(date, this.innerValue[0]) && isSameYear(date, this.innerValue[0]);
        }
    };
    let isEndDate = function(date) {
        if (this.innerValue instanceof Date) {
            return false;
        } else {
            return isSameDay(date, this.innerValue[1]) && isSameMonth(date, this.innerValue[1]) && isSameYear(date, this.innerValue[1]);
        }
    };
    let isInRange = function(date) {
        if (this.innerValue instanceof Date) {
          return false;
        } else {
          if (this.innerValue[0] instanceof Date && this.innerValue[1] instanceof Date) {
             return isAfter(date, this.innerValue[0]) && isBefore(date, this.innerValue[1]);
          } else {
            return false;
          }
        }
    };
    let isDateEmpty = function() {
        if (this.innerValue instanceof Array) {
           return !(this.innerValue[1] instanceof Date);
        } else {
           return !(this.innerValue instanceof Date);
        }
    };

    let instance = this;
    this.days = eachDay(start, end).map(date => {
        return {
            date: date,
            day: getDate(date),
            month: getMonth(date),
            year: getYear(date),
            inThisMonth: true,
            isToday: isToday(date),
            isInRange: isInRange.call(instance, date),
            isSelected: isSelectedInput.call(instance, date),
            isSelectable: this.isDateSelectable(date),
            isStartDate: isStartDate.call(instance, date),
            isEndDate: isEndDate.call(instance, date)
        };
    });

    const tmp = getDay(start) - this.firstCalendarDay;
    const prevDays = tmp < 0 ? 7 - this.firstCalendarDay : tmp;

    for (let i = 1; i <= prevDays; i++) {
        const date = subDays(start, i);
        this.days.unshift({
            date: date,
            day: getDate(date),
            month: getMonth(date),
            year: getYear(date),
            inThisMonth: false,
            isToday: isToday(date),
            isInRange: isInRange.call(instance, date),
            isSelected: isSelectedInput.call(instance, date),
            isSelectable: this.isDateSelectable(date),
            isStartDate: isStartDate.call(instance, date),
            isEndDate: isEndDate.call(instance, date)
        });
    }
    this.barTitle = !isDateEmpty.call(this) ? format(start, this.barTitleFormat, this.locale) : this.barTitleIfEmpty;

  }

  initYears(): void {
    const range = this.maxYear - this.minYear;
    this.years = Array.from(new Array(range), (x, i) => i + this.minYear).map(year => {
      return { year: year, isThisYear: year === getYear(this.date) };
    });
  }

  initDayNames(): void {
    this.dayNames = [];
    const start = this.firstCalendarDay;
    for (let i = start; i <= 6 + start; i++) {
      const date = setDay(new Date(), i);
      this.dayNames.push(format(date, this.dayNamesFormat, this.locale));
    }
  }

  initRange(): void {
    if (this.options.isRange !== undefined) {
      this.isRange = this.options.isRange;
    }
    if (this.isRange) {
      this.endDate = new Date();
    }
  }

  toggleView(): void {
    this.view = this.view === 'days' ? 'years' : 'days';
  }

  // reads from ngModel
  writeValue(val: any) {
      if (val) {
          if (this.isRange) {
            this.date = val[0];
          } else {
            this.date = val;
          }
          this.innerValue = val;
          this.init();
          this.barTitle = format(startOfMonth(this.date), this.barTitleFormat, this.locale);
      }
  }

  registerOnChange(fn: any) {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouchedCallback = fn;
  }
}
