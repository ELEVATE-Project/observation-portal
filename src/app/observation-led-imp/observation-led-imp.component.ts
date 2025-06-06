import { Router } from '@angular/router';
import { Component } from '@angular/core';
import { ApiService } from '../services/api.service';
import { ToastService } from '../services/toast.service';
import * as urlConfig from '../constants/url-config.json';
import { catchError, finalize } from 'rxjs';


@Component({
  selector: 'app-observation-led-imp',
  standalone: false,
  templateUrl: './observation-led-imp.component.html',
  styleUrl: './observation-led-imp.component.css'
})
export class ObservationLedImpComponent {
  improvementProjectSuggestions: any[];
  programName: any;
  loaded = true;


  constructor(public router: Router,
    public apiService: ApiService,
    public toaster: ToastService,) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || {};

    this.improvementProjectSuggestions = state['improvementProjectSuggestions'] || [];
    this.programName = state['programName'] || '';
  }

  navigateToProjectPlayer(project: any) {
    this.loaded = false;
    this.apiService.get(urlConfig.observation.project + `${project?._id}`)
      .pipe(
        finalize(() => this.loaded = true),
        catchError((err) => {
          this.toaster.showToast(err?.error?.message, 'danger', 5000)
          throw new Error('Could not fetch the details');
        })
      )
      .subscribe((res: any) => {
        let result = res?.result;
        if (result?.projectId) {
          window.location.href = `/ml/project-details?type=details&id=${result?.projectId}&_id=${result?.projectId}&solutionId=${result?.solutionId}`;
        } else {
          window.location.href = `/ml/project-details?externalId=${project?.externalId}&referenceFrom=observation`;
        }
      });
  }
}
