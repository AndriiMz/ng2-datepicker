import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgSlimScrollModule } from 'ngx-slimscroll';
import { NgDatepickerInlineComponent } from '../component/ng-datepicker-inline.component';

@NgModule({
  declarations: [ NgDatepickerInlineComponent ],
  imports: [ CommonModule, FormsModule, NgSlimScrollModule ],
  exports: [ NgDatepickerInlineComponent, CommonModule, FormsModule, NgSlimScrollModule ]
})
export class NgDatepickerInlineModule { }
