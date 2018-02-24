import {
  inject,
  async,
  TestBed,
  ComponentFixture
} from '@angular/core/testing';
import { NgDatepickerInlineModule } from '../../ng-datepicker/module/ng-datepicker-inline.module';
import { AppHomeComponent } from './app-home.component';

describe(`App`, () => {
  let comp: AppHomeComponent;
  let fixture: ComponentFixture<AppHomeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppHomeComponent ],
      imports: [ NgDatepickerInlineModule ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppHomeComponent);
    comp    = fixture.componentInstance;

    fixture.detectChanges();
  });

  it(`should be readly initialized`, () => {
    expect(fixture).toBeDefined();
    expect(comp).toBeDefined();
  });
});
