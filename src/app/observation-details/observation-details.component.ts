import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { ToastService } from '../services/toast.service';
import * as urlConfig from '../constants/url-config.json';
import { MatDialog } from '@angular/material/dialog';
import { catchError, finalize } from 'rxjs';
import { MatTabChangeEvent } from '@angular/material/tabs';
import { UrlParamsService } from '../services/urlParams.service';
import { QueryParamsService } from '../services/queryParams.service';
import { offlineSaveObservation } from '../services/offlineSaveObservation.service';
import { DownloadService } from '../services/download.service';
import { DbDownloadService } from '../services/dbDownload.service';
import { NetworkServiceService } from 'network-service';
import {TranslateService} from '@ngx-translate/core';
import { dialogConfirmationMap } from '../constants/actionContants';
import { GenericPopupComponent } from '../shared/generic-popup/generic-popup.component';
import { DownloadDataPayloadCreationService } from '../services/download-data-payload-creation.service';

@Component({
  selector: 'app-observation-details',
  standalone: false,
  templateUrl: './observation-details.component.html',
  styleUrl: './observation-details.component.css'
})
export class ObservationDetailsComponent implements OnInit {
  entityId: any;
  observationId: any;
  observations: any = [];
  observationName: any;
  observationInit: boolean = false;
  selectedTabIndex = 0;
  allowMultipleAssessemts: any;
  loaded = false;
  isPendingTabSelected: boolean = true;
  filteredObservations:any =[];
  isRubricDriven:any;
  isQuestionerDataInIndexDb: any;
  allObservationDownloadedDataInIndexDb: any;
  dbKeys: any;
  submissionIdSet = new Set<string>();
  confirmModel:any;

  @ViewChild('updateDialogModel') updateDialogModel: TemplateRef<any>;


  constructor(
    private apiService: ApiService, 
    private toaster: ToastService, 
    private router: Router,
    private dialog: MatDialog,
    private urlParamsService:UrlParamsService,
    private route: ActivatedRoute,
    private queryParamsService: QueryParamsService,
    private offlineData:offlineSaveObservation,
    private downloadService: DownloadService,
    private dbDownloadService: DbDownloadService,
    private network: NetworkServiceService,
    private translate: TranslateService,
    private downloadDataPayloadCreationService:DownloadDataPayloadCreationService
    
  ) {
  }

  ngOnInit(): void {
    this.queryParamsService.parseQueryParams()
    this.urlParamsService.parseRouteParams(this.route)
    this.entityId=this.urlParamsService?.entityId
    this.observationId = this.urlParamsService?.observationId;
    this.allowMultipleAssessemts = this.urlParamsService?.allowMultipleAssessemts;
    this.observationInit = true;
    this.network.isOnline$.subscribe(status => {
      if (status == true) {
        this.getObservationByEntityId();
        this.fetchDownloadedData(false);
      } else {
        this.loaded = true;
        this.setLanguage();
        this.fetchDownloadedData(true);
      }});
}

dialogMessage(data: any, entity?: any) {
  this.confirmModel = dialogConfirmationMap[data];
  const actionsMap = {
    observeAgain: () => this.observeAgain(),
    downloadPop: () => this.downloadObservation(entity),
  };

  const dialogRef = this.dialog.open(GenericPopupComponent,{
    width: '400px',
      data: {
        title: this.confirmModel?.title,
        message: this.confirmModel?.message,
      }
  });
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes' && actionsMap[data]) {
        actionsMap[data]();
      }
    });
}
close(){
  this.dialog.closeAll()
}

getObservationsByStatus(statuses: ('draft' | 'inprogress' | 'completed' | 'started')[]): void {
  if (!this.observations) {
    this.filteredObservations = [];
    return;
  }

  if (statuses.includes('completed')) {
    this.filteredObservations = this.observations.filter(obs => obs?.status === 'completed');
  } else {
    this.filteredObservations = this.observations.filter(obs => statuses.includes(obs?.status));
  }
}


  getObservationByEntityId() {
    this.apiService.post(urlConfig.observation.observationSubmissions + this.observationId + `?entityId=${this.entityId}`, this.apiService.profileData)
    .pipe(
      finalize(() =>this.loaded = true),
      catchError((err: any) => {
        this.toaster.showToast(err?.error?.message, 'Close');
        throw Error(err);
      })
    )
      .subscribe((res: any) => {
        if (res?.result) {
          if (this.observationInit && !res?.result?.length) {
            this.observationInit = false;
            this.observeAgain();
          } else {
            this.observationInit = false;
            this.observations = res?.result;
            this.isRubricDriven = res?.result[0]?.isRubricDriven; 
            this.getObservationsByStatus(['draft', 'started', 'inprogress']);
          }
        } else {
          this.toaster.showToast(res?.message, 'danger');
        }
      })
  }

  async navigateToDetails(data) {
    let isDataInIndexDb = await this.offlineData.checkAndMapIndexDbDataToVariables(data?._id);

    if (!isDataInIndexDb?.data) {
      await this.offlineData.getFullQuestionerData("observation",this.observationId,this.entityId,data?._id,data?.submissionNumber,"");
    }


    if (data?.isRubricDriven) {
      this.router.navigate([
        'domain',
        data?.observationId,
        data.entityId,
        data?._id
      ],
      {
        state: {
          ...data,
          allowMultipleAssessemts: this.allowMultipleAssessemts
        }
      });
    } else {
      const evidenceCode = data?.evidenceCode ?? data?.evidencesStatus?.[0]?.code;
      this.router.navigate(['questionnaire'], {
        queryParams: {observationId: data?.observationId, entityId: data?.entityId, submissionNumber: data?.submissionNumber, evidenceCode, index: 0,submissionId:data?._id
        }
      });
    }
  }

  editEntity(entity: any, id: any) {
    this.observationName = entity;
    const dialogRef = this.dialog.open(this.updateDialogModel);

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'update') {
        this.updateEntity(id);
      }
    });
  }


  deleteEntity(id: any) {

    const dialogRef = this.dialog.open(GenericPopupComponent,{
      width: '400px',
      data: {
        title: 'CONFIRM_DELETION',
        message: 'DELETE_OBSERVATION_CONFIRMATION',
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {
        this.apiService.delete(urlConfig.observation.update + id, { data: [] })
          .subscribe((res: any) => {
            if (res.status == 200) {
              this.getObservationByEntityId();
            } else {
              this.toaster.showToast(res.message, 'Close');
            }
          }, (err: any) => {
            this.toaster.showToast(err.error.message, 'Close');
          })
      }
    });
  }

  updateEntity(id: any) {
    const payload = {
      title: this.observationName
    }
    this.apiService.post(urlConfig.observation.update + id, payload)
      .subscribe((res: any) => {
        if (res.status == 200) {
          this.getObservationByEntityId();
        } else {
          this.toaster.showToast(res.message, 'Close');
        }
      }, (err: any) => {
        this.toaster.showToast(err.error.message, 'Close');
      })
  }

  observeAgain() {
    this.apiService.post(urlConfig.observation.create + this.observationId + `?entityId=${this.entityId}`, {})
      .subscribe((res: any) => {
        if (res.result) {
          this.getObservationByEntityId();
        } else {
          this.toaster.showToast(res.message, 'danger');
        }
      })
  }

  viewReport(entity?) {
    this.router.navigate([
      'reports',
      this.observationId,
      this.entityId,
      entity ? entity?.entityType : this.observations[0]?.entityType,
      entity ? false : true,
      this.isRubricDriven
    ],{
      queryParams:{
        'submissionId': entity?._id,
      }
    });
  }

  toggleTabs(event: MatTabChangeEvent): void {
    const selectedTabLabel = event.tab.textLabel;
    if (selectedTabLabel === 'In progress') {
      this.isPendingTabSelected = true;
      this.getObservationsByStatus(['draft', 'started', 'inprogress']);
    } else if (selectedTabLabel === 'Completed') {
      this.isPendingTabSelected = false;
      this.getObservationsByStatus(['completed']);
    }
}
async downloadObservation(observationDetail: any) {
  try {
    const observationDetails = {
      ...observationDetail,
      allowMultipleAssessemts: this.allowMultipleAssessemts
    };

    let observationData: any = await this.offlineData.checkAndMapIndexDbDataToVariables(
      observationDetails?._id
    );

    observationData = observationData?.data
      ? observationData.data
      : await this.offlineData.getFullQuestionerData(
          "observation",
          this.observationId,
          this.entityId,
          observationDetails?._id,
          observationDetails?.submissionNumber,
          ""
        );

    const subTitle =
      observationData?.assessment?.description ??
      observationDetail?.program?.name ??
      "";

    const newItem = this.downloadDataPayloadCreationService.buildObservationItem(
      observationDetail,
      this.observationId,
      this.entityId,
      this.allowMultipleAssessemts,
      observationDetail?._id,
      subTitle
    );

    await this.downloadService.downloadData("observation", newItem);
    this.fetchDownloadedData(false);
  } catch (err) {
    this.toaster.showToast(
      this.translate.instant("DOWNLOAD_FAILED"),
      "Close"
    );
  }
}


updateDownloadedSubmissions() {
  this.submissionIdSet = new Set(
    this.dbKeys?.map(item => item.metaData?.submissionId)
  );
}

async fetchDownloadedData(mapData) {
  this.allObservationDownloadedDataInIndexDb = await this.dbDownloadService.getAllDownloadsDatas("observation");
  this.isQuestionerDataInIndexDb = this.allObservationDownloadedDataInIndexDb.find(
    item => item.key === this.observationId
  );
  this.dbKeys = this.isQuestionerDataInIndexDb?.data || [];
  this.updateDownloadedSubmissions();
  if (mapData) {
    this.observations = this.isQuestionerDataInIndexDb?.data.map((item:any) => ({
      title: item.metaData.observationName,
      createdAt: item.metaData.observationCreatedDate,
      isRubricDriven: item.metaData.isRubric,
      _id: item.metaData.submissionId,
      status: item.metaData.status,
      observationId: item.metaData.observationId,
      entityId: item.metaData.entityId,
      submissionNumber: item.metaData.submissionNumber,
      evidenceCode: item.metaData.evidenceCode
    }));
    this.observationInit = false;
    this.isRubricDriven = this.isQuestionerDataInIndexDb?.data[0]?.isRubric;
    this.getObservationsByStatus(['draft', 'started', 'inprogress']);
  }
}
setLanguage() {
  this.translate.setDefaultLang('en');
  this.translate.use('en');
}
}
