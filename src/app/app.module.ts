import { NgModule,CUSTOM_ELEMENTS_SCHEMA  } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import {
  MatNativeDateModule,
  DateAdapter,
  MAT_DATE_FORMATS,
  MAT_DATE_LOCALE,
} from '@angular/material/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ListingComponent } from './listing/listing.component';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSliderModule } from '@angular/material/slider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule, DatePipe } from '@angular/common';
import { HTTP_INTERCEPTORS, HttpClient, HttpClientModule } from '@angular/common/http';
import { SpinnerComponent } from './shared/spinner/spinner.component';
import { ApiInterceptor } from './services/api.interceptor';
import { ObservationEntityComponent } from './observation-entity/observation-entity.component';
import { ObservationDetailsComponent } from './observation-details/observation-details.component';
import { ObservationDomainComponent } from './observation-domain/observation-domain.component';
import { QuestionnaireComponent } from './questionnaire/questionnaire.component';
import { ReportComponent } from './report/report.component';
import { 
  TranslateLoader,
  TranslateModule,
  TranslateService,
} from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { ObservationLedImpComponent } from './observation-led-imp/observation-led-imp.component';
import { ObservationAsTaskComponent } from './observation-as-task/observation-as-task.component';
import { DeeplinkRedirectComponent } from './deeplink-redirect/deeplink-redirect.component';
import { MatChipsModule } from '@angular/material/chips';
import { SurveyReportsComponent } from './survey-reports/survey-reports.component';
import { SurveyFilterComponent } from './shared/survey-filter/survey-filter.component';
import { SurveyPreviewComponent } from './shared/survey-preview/survey-preview.component';
import { DownloadsComponent } from './downloads/downloads.component';
import { SurveyExpiredComponent } from './survey-expired/survey-expired.component';

export function translateHttpLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    ListingComponent,
    SpinnerComponent,
    ObservationEntityComponent,
    ObservationDetailsComponent,
    ObservationDomainComponent,
    QuestionnaireComponent,
    ReportComponent,
    ObservationLedImpComponent,
    ObservationAsTaskComponent,
    DeeplinkRedirectComponent,
    SurveyReportsComponent,
    SurveyFilterComponent,
    SurveyPreviewComponent,
    DownloadsComponent,
    SurveyExpiredComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    CommonModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatCheckboxModule,
    MatSliderModule,
    MatFormFieldModule,
    MatListModule,
    MatInputModule,
    MatRadioModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatPaginatorModule,
    HttpClientModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatGridListModule,
    MatToolbarModule,
    MatTabsModule,
    BrowserModule,
    AppRoutingModule,
    MatMenuModule,
    MatSelectModule,
    FormsModule,
    MatExpansionModule,
    MatChipsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: translateHttpLoaderFactory,
        deps: [HttpClient]
      }
    }),
  ],
  providers: [
    DatePipe,
    {
      provide:HTTP_INTERCEPTORS,
      useClass:ApiInterceptor,
      multi:true
    },
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  bootstrap: [AppComponent],
  
})
export class AppModule { 
  constructor(private translate:TranslateService){
    this.setLanguage();
  }
  setLanguage() {
    this.translate.setDefaultLang('en');
    this.translate.use('en');
    let theme:any=JSON.parse(localStorage.getItem('theme'))
    if(theme){
      document.documentElement.style.setProperty('--color-primary', theme?.primaryColor);
      document.documentElement.style.setProperty('--primary-color', theme?.primaryColor);
      document.documentElement.style.setProperty('--color-secondary', theme?.secondaryColor);
    }
  }
}
