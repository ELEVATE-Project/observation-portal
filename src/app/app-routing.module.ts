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
import { AuthGuard } from './services/auth.guard';

const routes: Routes = [ 
  { path: APP_ROUTES.LISTING, component: ListingComponent, canActivate: [AuthGuard] },
  { path: APP_ROUTES.ENTITY_LIST, component: ObservationEntityComponent, canActivate: [AuthGuard] },
  { path: APP_ROUTES.ENTITY_LIST_NO_TYPE, component: ObservationEntityComponent, canActivate: [AuthGuard] },
  { path: APP_ROUTES.DETAILS, component: ObservationDetailsComponent, canActivate: [AuthGuard] },
  { path: APP_ROUTES.DOMAIN, component: ObservationDomainComponent, canActivate: [AuthGuard] },
  { path: APP_ROUTES.QUESTIONNAIRE, component: QuestionnaireComponent, canActivate: [AuthGuard] },
  { path: APP_ROUTES.REPORTS, component: ReportComponent,canActivate: [AuthGuard] },
  { path: APP_ROUTES.Observation_Led_Imp, component: ObservationLedImpComponent, canActivate: [AuthGuard] },
  { path: APP_ROUTES.OBSERVATION_AS_TASK,component:ObservationAsTaskComponent, canActivate: [AuthGuard]},
  { path: APP_ROUTES.VERIFYLINK,component:DeeplinkRedirectComponent, canActivate: [AuthGuard]},
  { path:APP_ROUTES.SURVEYREPORTS,component:SurveyReportsComponent, canActivate: [AuthGuard]},
  { path: APP_ROUTES.DOWNLOADS,component:DownloadsComponent, canActivate: [AuthGuard]},
  { path:APP_ROUTES.SURVEYEXPIRED,component:SurveyExpiredComponent, canActivate: [AuthGuard]},
  { path:APP_ROUTES.VIEWALLEVIDENCES,component:ViewEvidencesComponent, canActivate: [AuthGuard]},
  { path: '', redirectTo: 'listing/observation', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
