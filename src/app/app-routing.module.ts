import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListingComponent } from './listing/listing.component';
import { ObservationEntityComponent } from './observation-entity/observation-entity.component';
import { ObservationDetailsComponent } from './observation-details/observation-details.component';
import { ObservationDomainComponent } from './observation-domain/observation-domain.component';
import { QuestionnaireComponent } from './questionnaire/questionnaire.component';
import { ReportComponent } from './report/report.component';
import { APP_ROUTES } from './constants/app.routes';
import { ObservationLedImpComponent } from './observation-led-imp/observation-led-imp.component';
import { ObservationAsTaskComponent } from './observation-as-task/observation-as-task.component';
import { DeeplinkRedirectComponent } from './deeplink-redirect/deeplink-redirect.component';
import { SurveyReportsComponent } from './survey-reports/survey-reports.component';
import { DownloadsComponent } from './downloads/downloads.component';
import { SurveyExpiredComponent } from './survey-expired/survey-expired.component';
import { ViewEvidencesComponent } from './shared/view-evidences/view-evidences.component';
import { navigateGuard } from './services/navigate.guard';
import { NotFoundComponent } from './not-found/not-found.component';

const routes: Routes = [ 
  { path: APP_ROUTES.LISTING, component: ListingComponent },
  { path: APP_ROUTES.ENTITY_LIST, component: ObservationEntityComponent,data: { title: 'Observation Entity' } },
  { path: APP_ROUTES.ENTITY_LIST_NO_TYPE, component: ObservationEntityComponent,data: { title: 'Observation Entity' } },
  { path: APP_ROUTES.DETAILS, component: ObservationDetailsComponent,data: { title: 'Observation Details' } },
  { path: APP_ROUTES.DOMAIN, component: ObservationDomainComponent,data: { title: 'Observation Domain' } },
  { path: APP_ROUTES.QUESTIONNAIRE, component: QuestionnaireComponent,data: { title: 'Questionnaire' } },
  { path: APP_ROUTES.REPORTS, component: ReportComponent,data: { title: 'Observation Reports' } },
  { path: APP_ROUTES.Observation_Led_Imp, component: ObservationLedImpComponent,data: { title: 'Observation LedImprovements' } },
  { path: APP_ROUTES.OBSERVATION_AS_TASK,component:ObservationAsTaskComponent,data: { title: 'Observation As Task' }},
  { path: APP_ROUTES.VERIFYLINK,component:DeeplinkRedirectComponent,data: { title: 'DeepLink Redirect' }},
  { path:APP_ROUTES.SURVEYREPORTS,component:SurveyReportsComponent,data: { title: 'Survey Reports' }},
  { path: APP_ROUTES.DOWNLOADS,component:DownloadsComponent,data: { title: 'Downloads' }},
  { path:APP_ROUTES.SURVEYEXPIRED,component:SurveyExpiredComponent,data: { title: 'Suvery Expired' }},
  { path:APP_ROUTES.VIEWALLEVIDENCES,component:ViewEvidencesComponent,data: { title: 'View Evidences' }},
  { path: '**',component:NotFoundComponent,canActivate:[navigateGuard]}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
