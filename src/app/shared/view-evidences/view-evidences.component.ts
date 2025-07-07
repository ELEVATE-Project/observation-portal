import { Component ,OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from 'src/app/services/api.service';
import * as urlConfig from '../../constants/url-config.json';
import { ToastService } from '../../services/toast.service';
import { catchError, finalize } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { SurveyPreviewComponent } from '../survey-preview/survey-preview.component';
import { UtilsService } from '../../services/utils.service';

@Component({
  selector: 'app-view-evidences',
  standalone: false,
  templateUrl: './view-evidences.component.html',
  styleUrl: './view-evidences.component.css'
})
export class ViewEvidencesComponent implements OnInit{
  queryPayload: any;
  loaded = false;
  remarks: any;
  images: any;
  videos: any;
  documents: any;
  audios: any;
  isSurvey:any;
  selectedTabIndex: number = 0;
  constructor(
    private routerParam: ActivatedRoute,
    public apiService: ApiService,
    private toaster: ToastService,
    private dialog: MatDialog,
    private utils:UtilsService
  ) {}
  ngOnInit() {
    this.routerParam.queryParams.subscribe((params:any) => {
      this.queryPayload = {
        submissionId: params.submissionId,
        questionId: params.questionExternalId,
        observationId: params.observationId,
        entityId: params.entityId,
        entityType: params.entityType,
        solutionId: params.solutionId,
      };
      this.isSurvey = params?.surveyEvidence 
      this.getEvidence()
  });
}
getEvidence(){
  let url = this.isSurvey ? urlConfig.survey.surveyEvidences : urlConfig.observation.observationEvidences
  let payload={...this.apiService.profileData,...this.queryPayload}
  this.apiService.post(url,payload).pipe(
        finalize(() => this.loaded = true),
        catchError((err: any) => {
          this.toaster.showToast(err?.error?.message, 'Close');
          throw Error(err);
        })
      ).subscribe((res: any) => {
        if (res?.result) {  
        this.images=res?.data?.images
        this.videos = res?.data?.videos
        this.audios =res?.data?.audios
        this.documents =res?.data?.documents
        this.remarks =res?.data?.remarks
        }else {
          this.toaster.showToast(res?.message, 'Close');
        }
    });
}

openDialog(url: any, type: string) {
    this.dialog.open(SurveyPreviewComponent, {
      width: '400px',
      data: {
        objectType:type,
        objectUrl:url
      }
    })
  }

  openUrl(evidence: any) {
    window.open(evidence.url, '_blank');
  }
}
