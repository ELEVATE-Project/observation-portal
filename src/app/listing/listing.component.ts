import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize } from 'rxjs/operators';
import * as urlConfig from '../constants/url-config.json';
import { ToastService } from '../services/toast.service';
import { ApiService } from '../services/api.service';
import { UrlParamsService } from '../services/urlParams.service';
import { listingConfig, statusMappings} from '../constants/actionContants';
import { TranslateService } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import { UtilsService } from '../services/utils.service';
import { DownloadService } from '../services/download.service';
import { MatDialog } from '@angular/material/dialog';
import { GenericPopupComponent } from '../shared/generic-popup/generic-popup.component';
import { offlineSaveObservation } from '../services/offlineSaveObservation.service';
import { DownloadDataPayloadCreationService } from '../services/download-data-payload-creation.service';

@Component({
  selector: 'app-listing',
  standalone: false,
  templateUrl: './listing.component.html',
  styleUrl: './listing.component.css'
})
export class ListingComponent implements OnInit {
  solutionList: any;
  solutionId!: string;
  listType = 'observation';
  stateData: any;
  page: number = 1;
  limit: number = 10;
  entityType: any;
  initialSolutionData: any = [];
  selectedEntityType: any = '';
  loaded = false;
  entityId: any;
  isEntityFilterModalOpen: boolean = false;
  allEntities: any;
  solutionListCount :any = 0;
  selectedObservation:any;
  isAnyEntitySelected: boolean = false;
  surveyPage:any;
  description:any;
  headerConfig:any;
  selectedEntityName:any;
  observationDownloaded: boolean = false;
    isDataInDownloadsIndexDb: any = [];
    submissionId: any;

  constructor(
    public router: Router,
    private toaster: ToastService,
    private apiService: ApiService,
    private urlParamService:UrlParamsService,
    private route:ActivatedRoute,
    private translate: TranslateService,
    private datePipe: DatePipe,
    private utils:UtilsService,
    private downloadService: DownloadService,
        private dialog: MatDialog,
        private offlineData:offlineSaveObservation,
        private downloadDataPayloadCreationService:DownloadDataPayloadCreationService

  ) {
  }
 
  ngOnInit(): void {
    this.urlParamService.parseRouteParams(this.route)
    this.setHeader()
    this.surveyPage = this.headerConfig?.title === 'Survey'
    this.loadInitialData();
  }

  onSearchChange(value?:any):void {
    this.headerConfig = {
      ...this.headerConfig,
      searchTerm : value ? value : ''
    }
    this.page = 1;
    this.solutionList = [];
    this.solutionListCount = 0;
    this.getListData();
  }

  setHeader(){
    const solutionType = this.urlParamService.solutionType;
    let config = listingConfig[solutionType]
    this.headerConfig = {
      ...config,
      searchTerm:'',
      showSearch:config.title === 'Observation Reports',
      type:config.solutionType,
      placeholder:'SEARCH_PLACEHOLDER'
    }
  }

  loadInitialData(): void {
    this.page = 1;
    this.solutionList = [];
    this.getListData();
  }

  async getListData(): Promise<void> {
    if(!this.apiService?.profileData){
      await this.utils.getProfileDetails()
    }
    let urlPath:any = this.headerConfig?.showSearch ? urlConfig[this.listType].reportListing : urlConfig[this.listType].listing
    let queryParams;
    switch (this.headerConfig?.title){
      case 'Survey':
      case 'Survey Reports':
        queryParams =`?type=${this.headerConfig?.solutionType}&page=${this.page}&limit=${this.limit}&search=${this.headerConfig.searchTerm}&surveyReportPage=${this.headerConfig?.title === 'Survey Reports'}`
        break;
      case 'Observation Reports':
        queryParams = `?page=${this.page}&limit=${this.limit}&entityType=${this.selectedEntityType}`
        break;
      case 'Observation':
        queryParams = `?type=${this.headerConfig?.solutionType}&page=${this.page}&limit=${this.limit}&search=${this.headerConfig.searchTerm}`
        break;

      default:
          console.warn('Unknown Page:', this.headerConfig?.title);
    }
    this.apiService.post(
      urlPath + queryParams,
      this.apiService?.profileData
    ).pipe(
      finalize(() => this.loaded = true),
      catchError((err: any) => {
        this.toaster.showToast(err?.error?.message, 'Close');
        throw Error(err);
      })
    )
      .subscribe((res: any) => {
        if (res?.status === 200) {
          this.solutionListCount = res?.result?.count;
          this.headerConfig?.showSearch && (this.entityType = res?.result?.entityType);
          let list:any = res?.result?.data ;
          list.forEach((element: any) => {
            element.status = new Date().setHours(0, 0, 0, 0) > new Date(element.endDate).setHours(0, 0, 0, 0) ? 'expired': element.status;
            element.endDate = element.endDate ? new Date(element.endDate).toDateString() : '';
            Object.assign(element, statusMappings[element.status] ?? { tagClass: '', statusLabel: '' });
            if(this.surveyPage){
              const diffDays = element.endDate ? this.getDateDiff(element.endDate) : 0;
              element.daysUntilExpiry = Math.max(diffDays, 0);
              element.isExpiringSoon = diffDays > 0 && diffDays <= 2 ? true : false;
              this.solutionExpiryStatus(element);
            }
          });
          this.solutionList = [...this.solutionList, ...list];
          this.initialSolutionData = this.solutionList;
          this.checkDataInDB()
        } else {
          this.toaster.showToast(res?.message, 'Close');
        }
      });
  }

  loadData(): void {
    this.page++;
    this.solutionList = this.initialSolutionData;
    this.getListData();
  }

  navigateTo(data?: any) {
    switch (this.headerConfig?.title){
      case 'Observation':
      case 'Observation Reports':
        this.navigateObservation(data)
        break ;

      case 'Survey':
        if(data.status === "expired"){
            this.toaster.showToast('FORM_EXPIRED','danger')
            break;
        }
        this.router.navigate(['/questionnaire'], {
          queryParams: {observationId: data?.observationId, entityId: data?.entityId, submissionNumber: data?.submissionNumber, index: 0, submissionId:data?.submissionId,solutionId:data?.solutionId,solutionType:"survey"
          }
        });
        break ;

      case 'Survey Reports':
        this.router.navigate(['surveyReports',
          data?.submissionId
        ])
        break;

      default:
        console.warn('Unknown listType:', this.headerConfig);

    }
  }

  navigateObservation(data:any){
    if (!(this.headerConfig?.title === 'Observation')) {
      if (data?.entities?.length > 1) {
        this.allEntities = data?.entities;
        this.selectedObservation = data
        this.openFilter();
      }
      else if (data?.entities?.length == 1) {
        this.router.navigate([
          'reports',
          data?.observationId,
          data?.entities[0]?._id,
          data?.entityType,
          data?.allowMultipleAssessemts,
          data?.isRubricDriven
        ]);
      } else {
        this.toaster.showToast("NO_SOLUTION_MSG", 'Close');
      }
    } else {
      this.router.navigate([
        'entityList',
        data.solutionId,
        data.name,
        data.entityType,
        data?._id
      ],
      );
    }
  }

  changeEntityType(selectedType: any) {
    this.selectedEntityType = selectedType;
    this.solutionList = this.initialSolutionData.filter(solution => solution?.entityType === selectedType);
  }

  openFilter() {
    if (this.allEntities?.length > 0) {
      this.allEntities = this.allEntities.map((entity, index) => ({
        ...entity,
        selected: index === 0
      }));
      this.selectedEntityName = this.allEntities[0].name;
      this.isAnyEntitySelected = true;
    }
    this.isEntityFilterModalOpen = true;
  }

  closeFilter() {
    this.isEntityFilterModalOpen = false;
  }

  applyFilter() {
    let selectedEntity = this.allEntities.filter(question => question.selected);
    this.router.navigate([
      'reports',
      this.selectedObservation?.observationId,
      selectedEntity[0]?._id,
      this.selectedObservation?.entityType,
      false,
      this.selectedObservation?.isRubricDriven
    ]);
  }

  onEntityChange(selectedIndex: number): void {
    this.allEntities.forEach((entity, index) => {
      entity.selected = index === selectedIndex;
    });
    this.isAnyEntitySelected = true;
  }

  solutionExpiryStatus(element: any): void {
    const format = (date: any) => this.datePipe.transform(date, 'mediumDate');
    const t = this.translate.instant.bind(this.translate);
    element.surveyExpiry = element.status === 'expired' ? `${t('EXPIRED_ON')} ${format(element.endDate)}` 
        : element.endDate && element.isExpiringSoon
        ? `${t('EXPIRED_IN')} ${element.daysUntilExpiry} days`
        : element.completedDate
        ? `${t('COMPLETED_ON')} ${format(element.completedDate)}`
        : element.endDate
        ? `${t('VALID_TILL')} ${format(element.endDate)}`
        : '';
  }
  getDateDiff(endDateStr: string): number {
    const endDate = new Date(endDateStr);
    const today = new Date();
    endDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };


  downloadPop(solution: any, index: number) {
    if(solution?.downloaded) return
    const dialogRef = this.dialog.open(GenericPopupComponent, {
      width: '400px',
      data: {
        message: 'DOWNLOAD_MSG',
      }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {
        this.downloadSurvey(solution, index);
      }
    });
  }
  

  async downloadSurvey(solution: any, index: number) {
    try {
      const newItem = this.downloadDataPayloadCreationService.buildSurveyItem(solution);
  
      const check = await this.offlineData.checkAndMapIndexDbDataToVariables(solution?.submissionId);
      if (!check?.data) {
        await this.offlineData.getFullQuestionerData(
          "survey", "", "", solution?.submissionId, 0, solution?.solutionId
        );
      }
  
      await this.downloadService.downloadData("survey", newItem);
  
      this.solutionList[index].downloaded = true;
    } catch (e) {
      this.solutionList[index].downloaded = false;
    }
  }
  

  async checkDataInDB() {
    const storedSurveys = await this.downloadService.checkAndFetchDownloadsDatas("survey") || [];
    this.solutionList = this.solutionList.map((solution: any) => {
      const isDownloaded = storedSurveys.some((item: any) => {
        const entries = Array.isArray(item?.data) ? item.data : [item?.data].filter(Boolean);
        return entries.some(
          (d: any) =>
            d?.metaData?.solutionId === solution?._id &&
            d?.metaData?.submissionId === solution?.submissionId
        );
      });
  
      return { ...solution, downloaded: isDownloaded };
    });
  }

}