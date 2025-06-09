import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize } from 'rxjs/operators';
import * as urlConfig from '../constants/url-config.json';
import { ToastService } from '../services/toast.service';
import { ApiService } from '../services/api.service';
import { UrlParamsService } from '../services/urlParams.service';
import { listingConfig} from '../constants/actionContants';
import { TranslateService } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';

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
  searchTerm: string = "";
  stateData: any;
  page: number = 1;
  limit: number = 10;
  pageTitle: any;
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
  observationReportPage: any;
  description:any;

  constructor(
    public router: Router,
    private toaster: ToastService,
    private apiService: ApiService,
    private urlParamService:UrlParamsService,
    private route:ActivatedRoute,
    private translate: TranslateService,
    private datePipe: DatePipe
  ) {
  }
 
  ngOnInit(): void {
    this.urlParamService.parseRouteParams(this.route)
    this.setPageTitle()
    this.observationReportPage = this.pageTitle?.title === 'Observation Reports';
    this.surveyPage = this.pageTitle?.title === 'Survey'
    this.loadInitialData();
  }
  setPageTitle() {
    const solutionType = this.urlParamService.solutionType;
    this.pageTitle = listingConfig[solutionType]
    this.description = this.pageTitle?.description
    this.translate.get(this.pageTitle?.description).subscribe((msg: string) => {
      this.description = msg;
    });
  }

  loadInitialData(): void {
    this.page = 1;
    this.solutionList = [];
    this.getListData();
  }

  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.handleInput(event);
    }
  }

  handleInput(event?: any): void {
    this.searchTerm = event ? event?.target?.value : "";
    this.page = 1;
    this.solutionList = [];
    this.solutionListCount = 0;
    this.getListData();
  }



  async getListData(): Promise<void> {
    let urlPath:any = this.observationReportPage ? urlConfig[this.listType].reportListing : urlConfig[this.listType].listing
    let queryParams;
    switch (this.pageTitle?.title){
      case 'Survey':
      case 'Survey Reports':
        queryParams =`?type=${this.pageTitle?.solutionType}&page=${this.page}&limit=${this.limit}&search=${this.searchTerm}&surveyReportPage=${this.pageTitle?.title === 'Survey Reports'}`
        break;
      case 'Observation Reports':
        queryParams = `?page=${this.page}&limit=${this.limit}&entityType=${this.selectedEntityType}`
        break;
      case 'Observation':
        queryParams = `?type=${this.pageTitle?.solutionType}&page=${this.page}&limit=${this.limit}&search=${this.searchTerm}`
        break;

      default:
          console.warn('Unknown Page:', this.pageTitle?.title);
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
          this.observationReportPage && (this.entityType = res?.result?.entityType);
          this.solutionList = [...this.solutionList, ...res?.result?.data];
          if(this.surveyPage){
            this.solutionList.forEach((element: any) => {
              element.endDate = this.formatDate(element.endDate);
              this.checkAndUpdateExpiry(element);
              this.assignStatusAndClasses(element);
              this.calculateExpiryDetails(element);
              this.solutionExpiryStatus(element);
            });
          }
          this.initialSolutionData = this.solutionList;
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
    switch (this.pageTitle?.title){
      case 'Observation':
      case 'Observation Reports':
        this.navigateObservation(data)
        break ;

      case 'Survey':
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
        console.warn('Unknown listType:', this.pageTitle);

    }
  }

  navigateObservation(data:any){
    if (!(this.pageTitle?.title === 'Observation')) {
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
          false,
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
      if (index !== selectedIndex) {
        entity.selected = false;
      }
    });
    this.isAnyEntitySelected = this.allEntities.some(entity => entity.selected);
  }

  solutionExpiryStatus(element: any): void {
    let message = '';
    if (element?.status === 'expired') {
      const formattedEndDate = this.datePipe.transform(element?.endDate, 'mediumDate');
      message = `${this.translate.instant('EXPIRED_ON')} ${formattedEndDate}`;
    } else if (element?.endDate && element.isExpiringSoon) {
      message = `${this.translate.instant('EXPIRED_IN')} ${element.daysUntilExpiry} days`;
    } else if (element?.completedDate) {
      const formattedCompletedDate = this.datePipe.transform(element?.completedDate, 'mediumDate');
      message = `${this.translate.instant('COMPLETED_ON')} ${formattedCompletedDate}`;
    } else if (element?.endDate) {
      const formattedEndDate = this.datePipe.transform(element?.endDate, 'mediumDate');
      message = `${this.translate.instant('VALID_TILL')} ${formattedEndDate}`;
    }
    element.surveyExpiry = message;
  }
  
  
  formatDate(endDate: string): string {
    if (!endDate) {
      return '';
    }
    const date = new Date(endDate);
    const localTime = new Date(date.getTime() + date.getTimezoneOffset() * 60000);
    return localTime.toDateString();
  }
  checkAndUpdateExpiry(element: any) {
    const expiryDate = new Date(element.endDate);
    const currentDate = new Date();

    expiryDate.setHours(0, 0, 0, 0);
    currentDate.setHours(0, 0, 0, 0);

    if (currentDate > expiryDate) {
      element.status = 'expired';
    }
  }
  calculateExpiryDetails(element: any) {
    if (element.endDate) {
      element.isExpiringSoon = this.isExpiringSoon(element.endDate);
      element.daysUntilExpiry = this.getDaysUntilExpiry(element.endDate);
    } else {
      element.isExpiringSoon = false;
      element.daysUntilExpiry = 0;
    }
  }
  isExpiringSoon(endDate: string | Date): boolean {
    const currentDate = new Date();
    const expiryDate = new Date(endDate);
  
    const diffTime = expiryDate.getTime() - currentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
    return diffDays <= 2 && diffDays > 0;
  }

  getDaysUntilExpiry(endDate: string | Date): number {
    const currentDate = new Date();
    const expiryDate = new Date(endDate);
  
    const diffTime = expiryDate.getTime() - currentDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
    return Math.max(diffDays, 0);
  }
  assignStatusAndClasses(element: any) {
    const statusMappings = {
      'active': { tagClass: 'tag-not-started', statusLabel: 'Not Started' },
      'draft': { tagClass: 'tag-in-progress', statusLabel: 'In Progress' },
      'started': { tagClass: 'tag-in-progress', statusLabel: 'In Progress' },
      'completed': { tagClass: 'tag-completed', statusLabel: 'Completed' },
      'expired': { tagClass: 'tag-expired', statusLabel: 'Expired' }
    };
  
    const statusInfo = (statusMappings as any)[element.status] || { tagClass: 'tag-not-started', statusLabel: 'Not Started' };
    element.tagClass = statusInfo.tagClass;
    element.statusLabel = statusInfo.statusLabel;
  }
}
