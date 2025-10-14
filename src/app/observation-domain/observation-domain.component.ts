import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { ToastService } from '../services/toast.service';
import * as urlConfig from '../constants/url-config.json';
import { MatDialog } from '@angular/material/dialog';
import { catchError, finalize } from 'rxjs';
import { UrlParamsService } from '../services/urlParams.service';
import { offlineSaveObservation } from '../services/offlineSaveObservation.service';
import { DownloadService } from '../services/download.service';
import { TranslateService } from '@ngx-translate/core';
import { DbService } from '../services/db.service';
import { GenericPopupComponent } from '../shared/generic-popup/generic-popup.component';
import { DownloadDataPayloadCreationService } from '../services/download-data-payload-creation.service';
@Component({
  selector: 'app-observation-domain',
  standalone: false,
  templateUrl: './observation-domain.component.html',
  styleUrl: './observation-domain.component.css'
})
export class ObservationDomainComponent implements OnInit {
  entityId: any;
  entityName: any;
  entityToAdd: any;
  observations: any = [];
  evidences: any;
  expandedIndex: number | null = null;
  remark: any = "";
  observationId: any = "";
  id: any = "";
  entities:any=[]
  @ViewChild('notApplicableModel') notApplicableModel: TemplateRef<any>;
  loaded = false;
  submissionNumber:any;
  submissionId: any;
  completeObservationData: any;
  stateData:any;
  observationDownloaded: boolean = false;
  isQuestionerDataInIndexDb: any;
  isDataInDownloadsIndexDb: any = [];
  observationDetails: any
  confirmModel:any;

  constructor(
    private apiService: ApiService, 
    private toaster: ToastService, 
    private router: Router,
    private dialog: MatDialog, 
    private urlParamsService:UrlParamsService,
    private route: ActivatedRoute,
    private offlineData:offlineSaveObservation,
    private downloadService: DownloadService,
    private translate:TranslateService,
    private db: DbService,
    private downloadDataPayloadCreationService:DownloadDataPayloadCreationService
     
  ) {
    const passedData = this.router.getCurrentNavigation()?.extras.state;
    this.observationDetails = passedData;
  }

  async ngOnInit() {
   setTimeout(async () => {
    window.addEventListener('message', this.handleMessage);
    this.stateData = history.state?.data;
    if(this.stateData){
      this.mapDataToVariables(this.stateData)
    }else{
      this.urlParamsService.parseRouteParams(this.route)
    this.observationId = this.urlParamsService?.observationId;
    this.entityId = this.urlParamsService?.entityId;
    this.id = this.urlParamsService?.solutionId;
    this.submissionId = this.urlParamsService?.solutionId;

    this.isQuestionerDataInIndexDb = await this.offlineData.checkAndMapIndexDbDataToVariables(this.submissionId);

      this.isDataInDownloadsIndexDb = await this.downloadService.checkAndFetchDownloadsData(this.observationId, "observation");
      
      if (this.isQuestionerDataInIndexDb?.data) {
        this.mapDataToVariables(this.isQuestionerDataInIndexDb?.data)
          
      }

      if (Array.isArray(this.isDataInDownloadsIndexDb) && this.isDataInDownloadsIndexDb.length > 0) {
        const existingIndex = this.isDataInDownloadsIndexDb.findIndex(
          (item: any) => 
            item.metaData.submissionId === this.submissionId &&
          item.metaData.entityId === this.entityId
        );

        if (existingIndex !== -1) {
        this.observationDownloaded = true;

        } else {
        this.observationDownloaded = false;
        }
      }else{
        this.observationDownloaded = false;
      }
    }
   }, 500);
  }

  mapDataToVariables(observationData) {
    this.entities = observationData?.assessment?.evidences;
    this.evidences = this.entities;
    this.evidences.forEach((element: any) => {
      element.show = false;
    });
    this.loaded = true
  }

  toggleExpand(entity:any){
    this.evidences = this.evidences.map((element: any) => {
      return {
        ...element,
        show: element.code === entity.code ? !element.show : false
      };
    });
  }

  getObservationsByStatus(statuses: ('All' | 'draft' | 'completed' | 'started')[]) {
    if (!this.observations) {
      return [];
    }
    return statuses.includes('All')
      ? this.observations
      : this.observations.filter(obs => statuses.includes(obs.status));
  }

  toggleAccordion(index: number) {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }

  navigateToDetails(data,sectionIndex,entityIndex,notApplicable) {
    if(notApplicable){
      return;
    }
    this.stateData ? this.statenavigation(entityIndex) :
      this.router.navigate(['questionnaire'], {
        queryParams: { 
          observationId:this.observationId,  
          entityId:this.entityId, 
          submissionNumber:this.submissionNumber, 
          evidenceCode:data?.code, 
          index:entityIndex, 
          submissionId: this.submissionId,
          sectionIndex:sectionIndex
        },
        state: { data: {
          isSurvey:true
        }}
      });
  }

  async statenavigation(entityIndex:any){
    await this.router.navigate(['/listing/observation'],{replaceUrl:true});
    this.router.navigate(['questionnaire'], {
      queryParams:{
        solutionType:this.stateData?.solutionType,
        sectionIndex:entityIndex
      },
      state:{data:{
        ...this.stateData,
        isSurvey:false
      }}
    })
  }

  notApplicable(entity,selectedIndex) {
    this.remark = "";
    const dialogRefEcm = this.dialog.open(GenericPopupComponent,{
      width: '400px',
      data: {
        title:'CONFIRM',
        message: 'ECM_NOT_APPLICABLE',
        yesLabel: 'CONFIRM',
        noLabel: 'CANCEL'
      }
    });
    dialogRefEcm.afterClosed().subscribe(result => {
      if (result === 'yes') {
        const dialogRef = this.dialog.open(this.notApplicableModel);
        dialogRef.afterClosed().subscribe(result => {
          if (result === 'add') {
            const evidence = {
              externalId: entity?.code,
              remarks: this.remark,
              notApplicable: true
            };
            this.updateEntity(evidence,selectedIndex);
          }
        });
      }
    });
  }

  updateEntity(evidences,code) {
    let payload = {
      evidence:{
        ...evidences
      },
      ...this.apiService.profileData
    }
    this.apiService.post(urlConfig.observation.update + this.id, payload).subscribe(async (res: any) => {
      if (res.status == 200) {
      let data: any = await this.offlineData.checkAndMapIndexDbDataToVariables(this.submissionId);
      if (data?.data?.assessment?.evidences?.[code]) {
        data.data.assessment.evidences[code].notApplicable = true;
        await this.db.updateDB(data?.data,this.submissionId)
        this.isQuestionerDataInIndexDb = await this.offlineData.checkAndMapIndexDbDataToVariables(this.submissionId);
        if(this.isQuestionerDataInIndexDb?.data){
          this.mapDataToVariables(this.isQuestionerDataInIndexDb?.data)
        }
      }
        } else {
          this.toaster.showToast(res.message, 'Close');
        }
      }, (err: any) => {
        this.toaster.showToast(err.error.message, 'Close');
      })

  }
  async downloadObservation() {
    const submissionId = this.observationDetails?._id ?? this.submissionId;
  
    let isDataInIndexDb: any = await this.offlineData.checkAndMapIndexDbDataToVariables(submissionId);
  
    if (!isDataInIndexDb?.data) {
      const fetched = await this.offlineData.getFullQuestionerData(
        "observation",
        this.observationId,
        this.entityId,
        submissionId,
        this.observationDetails?.submissionNumber,
        ""
      );
  
      // normalize to same structure
      isDataInIndexDb =
        fetched?.data ??
        (await this.offlineData.checkAndMapIndexDbDataToVariables(submissionId))?.data;
    } else {
      isDataInIndexDb = isDataInIndexDb.data;
    }
  
    const subTitle =
      isDataInIndexDb?.assessment?.description ??
      this.observationDetails?.description ??
      "";
  
    const newItem = this.downloadDataPayloadCreationService.buildObservationItem(
      this.observationDetails,
      this.observationId,
      this.entityId,
      this.observationDetails?.allowMultipleAssessemts,
      submissionId,
      subTitle
    );
  
    await this.downloadService.downloadData("observation", newItem);
    this.observationDownloaded = true;
  }
  
  downloadPop() {
      const dialogRef = this.dialog.open(GenericPopupComponent,{
        width: '400px',
      data: {
        message: 'DOWNLOAD_MSG',
      }
      });
      dialogRef.afterClosed().subscribe(result => {
        if (result === 'yes') {
          this.downloadObservation()
        }
      });
    }
    handleMessage = async(event: MessageEvent) => {
      if (event.data?.type === 'START') {
        const stateData = event.data.data;
          if(stateData?.solution?.isRubricDriven){
            await this.router.navigate(['/listing/observation'],{replaceUrl:true});
            this.router.navigate([
            'entityList',
            stateData?.solution?._id,
            stateData?.solution?.name]);
          }
      }
    };
}