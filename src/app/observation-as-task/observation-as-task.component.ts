import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { ToastService } from '../services/toast.service';
import * as urlConfig from '../constants/url-config.json';
import { catchError, finalize } from 'rxjs';
import { UrlParamsService } from '../services/urlParams.service';
import { QueryParamsService } from '../services/queryParams.service';
import { Location } from '@angular/common';
import { UtilsService } from '../services/utils.service';

@Component({
  selector: 'app-observation-as-task',
  standalone: false,
  templateUrl: './observation-as-task.component.html',
  styleUrl: './observation-as-task.component.css'
})
export class ObservationAsTaskComponent implements OnInit {
  loaded: boolean = false;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private urlParamsService: UrlParamsService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private queryParamsService: QueryParamsService,
    private location: Location,
  private utils:UtilsService,
  ) {
  }

  ngOnInit(): void {
    window.addEventListener('message', this.fetchStateDataFromQuestionerPlayer);
    this.queryParamsService.parseQueryParams();
    this.urlParamsService.parseRouteParams(this.route);
    let solutionId = this.urlParamsService?.solutionId;
    this.fetchTemplateDetails(solutionId);
  }

  fetchStateDataFromQuestionerPlayer = async (event: MessageEvent) => {
    if (event.data?.type === 'START') {
      const stateData = event.data.data;

      if (stateData?.observationAsTask) {
        this.router.navigate([
          'entityList',
          stateData?.solution?._id,
          stateData?.solution?.name
        ],
        );
      }
    }
  };

  async fetchTemplateDetails(solutionId) {
    if(!this.apiService?.profileData){
      await this.utils.getProfileDetails()
    }
    this.apiService.post(urlConfig.observation.templateDetails + `${solutionId}`, this.apiService.profileData)
      .pipe(finalize(() => this.loaded = true),
        catchError((err: any) => {
          this.toastService.showToast(err?.error?.message, 'Close');
          throw Error(err);
        })
      ).subscribe((res: any) => {
        if (
          (Array.isArray(res.result) && res.result.length > 0) ||
          (res.result && typeof res.result === 'object' && !Array.isArray(res.result))
        ) {
          const templateData = {
            ...res.result
          };
          this.redirectObservation(templateData);
        } else {
          this.toastService.showToast('MSG_TEMPLATE_DETAILS_NOTFOUND', 'danger');
          setTimeout(() => {
            this.location.back();
          }, 2000);
        }
        
      }, error => {
        this.toastService.showToast('MSG_TEMPLATE_DETAILS_NOTFOUND', 'danger');
        setTimeout(() => {
          this.location.back();
        }, 2000);
      });
  }

  async redirectObservation(resp) {
    if (resp?.solution?.isRubricDriven) {
      this.router.navigate([
        'domain',
        resp?.solution?._id,
        resp?.assessment?.name,
        resp?.solution?._id
      ], {
        state: { data: { ...resp, isSurvey: false, observationAsTask: true } }
      });
    } else {
      this.router.navigate(['questionnaire'], {
        state: { data: { ...resp, isSurvey: false, observationAsTask: true } }
      });
    }
  }
}