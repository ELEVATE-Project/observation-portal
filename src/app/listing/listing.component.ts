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
import { UtilsService } from '../services/utils.service';

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

  constructor(
    public router: Router,
    private toaster: ToastService,
    private apiService: ApiService,
    private urlParamService:UrlParamsService,
    private route:ActivatedRoute,
    private translate: TranslateService,
    private datePipe: DatePipe,
    private utils:UtilsService
  ) {
  }
 
  ngOnInit(): void {
    this.setProfile()
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
    switch (this.headerConfig?.title){
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
 
  setProfile(){
    let refToken='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkIjo2NDgsIm5hbWUiOiJmYXJoYW4gcGFzaGEiLCJzZXNzaW9uX2lkIjo5NDA0LCJvcmdhbml6YXRpb25faWRzIjpbIjEwIl0sIm9yZ2FuaXphdGlvbl9jb2RlcyI6WyJkZWZhdWx0X2NvZGUiXSwidGVuYW50X2NvZGUiOiJzaGlrc2hhbG9rYW0iLCJvcmdhbml6YXRpb25zIjpbeyJpZCI6MTAsIm5hbWUiOiJEZWZhdWx0IE9yZ2FuaXphdGlvbiIsImNvZGUiOiJkZWZhdWx0X2NvZGUiLCJkZXNjcmlwdGlvbiI6IiIsInN0YXR1cyI6IkFDVElWRSIsInJlbGF0ZWRfb3JncyI6bnVsbCwidGVuYW50X2NvZGUiOiJzaGlrc2hhbG9rYW0iLCJtZXRhIjpudWxsLCJjcmVhdGVkX2J5IjoxLCJ1cGRhdGVkX2J5IjozMiwicm9sZXMiOlt7ImlkIjoyMywidGl0bGUiOiJtZW50ZWUiLCJsYWJlbCI6Im1lbnRlZSIsInVzZXJfdHlwZSI6MCwic3RhdHVzIjoiQUNUSVZFIiwib3JnYW5pemF0aW9uX2lkIjoxMCwidmlzaWJpbGl0eSI6IlBVQkxJQyIsInRlbmFudF9jb2RlIjoic2hpa3NoYWxva2FtIiwidHJhbnNsYXRpb25zIjpudWxsfV19XX0sImlhdCI6MTc1NDQ4MTQ3MCwiZXhwIjoxNzU1MDg2MjcwfQ.kEL19ZT7nqjx357YEf8xtsWhrk0PrcD-DM0CfIrvqqQ'
    let accToken='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkIjo2NDgsIm5hbWUiOiJmYXJoYW4gcGFzaGEiLCJzZXNzaW9uX2lkIjo5NDA0LCJvcmdhbml6YXRpb25faWRzIjpbIjEwIl0sIm9yZ2FuaXphdGlvbl9jb2RlcyI6WyJkZWZhdWx0X2NvZGUiXSwidGVuYW50X2NvZGUiOiJzaGlrc2hhbG9rYW0iLCJvcmdhbml6YXRpb25zIjpbeyJpZCI6MTAsIm5hbWUiOiJEZWZhdWx0IE9yZ2FuaXphdGlvbiIsImNvZGUiOiJkZWZhdWx0X2NvZGUiLCJkZXNjcmlwdGlvbiI6IiIsInN0YXR1cyI6IkFDVElWRSIsInJlbGF0ZWRfb3JncyI6bnVsbCwidGVuYW50X2NvZGUiOiJzaGlrc2hhbG9rYW0iLCJtZXRhIjpudWxsLCJjcmVhdGVkX2J5IjoxLCJ1cGRhdGVkX2J5IjozMiwicm9sZXMiOlt7ImlkIjoyMywidGl0bGUiOiJtZW50ZWUiLCJsYWJlbCI6Im1lbnRlZSIsInVzZXJfdHlwZSI6MCwic3RhdHVzIjoiQUNUSVZFIiwib3JnYW5pemF0aW9uX2lkIjoxMCwidmlzaWJpbGl0eSI6IlBVQkxJQyIsInRlbmFudF9jb2RlIjoic2hpa3NoYWxva2FtIiwidHJhbnNsYXRpb25zIjpudWxsfV19XX0sImlhdCI6MTc1NDQ4MTQ3MCwiZXhwIjoxNzU5NjY1NDcwfQ.07shepeCwHRVUQmj00erwDb6dn3e8dUnHP4ZLTDnSB0'
    
  let data:any={"org-id":"9"}
  let Theme:any={"primaryColor":"#572E91","secondaryColor":"#FF9911"}
  localStorage.setItem("headers",JSON.stringify(data))
  localStorage.setItem('accToken',accToken)
  localStorage.setItem('refToken',refToken)
  localStorage.setItem('theme',JSON.stringify(Theme))
  }
  // setProfile(){
  //   let refToken='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkIjoxNjE2LCJuYW1lIjoic2FuaXR5Y2hlY2sgYXVnIiwic2Vzc2lvbl9pZCI6MTA5ODcsIm9yZ2FuaXphdGlvbl9pZHMiOlsiMzkiXSwib3JnYW5pemF0aW9uX2NvZGVzIjpbInRyaXB1cmEiXSwidGVuYW50X2NvZGUiOiJzaGlrc2hhZ3JhaGFuZXciLCJvcmdhbml6YXRpb25zIjpbeyJpZCI6MzksIm5hbWUiOiJUcmlwdXJhIiwiY29kZSI6InRyaXB1cmEiLCJkZXNjcmlwdGlvbiI6InRyaXB1cmEgc3RhdGUgYXMgYW4gb3JnYW5pemF0aW9uIHRlc3QgaW4gU0ciLCJzdGF0dXMiOiJBQ1RJVkUiLCJyZWxhdGVkX29yZ3MiOm51bGwsInRlbmFudF9jb2RlIjoic2hpa3NoYWdyYWhhbmV3IiwibWV0YSI6bnVsbCwiY3JlYXRlZF9ieSI6MSwidXBkYXRlZF9ieSI6Mzc3LCJyb2xlcyI6W3siaWQiOjc3LCJ0aXRsZSI6Im1lbnRlZSIsImxhYmVsIjoibWVudGVlIiwidXNlcl90eXBlIjowLCJzdGF0dXMiOiJBQ1RJVkUiLCJvcmdhbml6YXRpb25faWQiOjM1LCJ2aXNpYmlsaXR5IjoiUFVCTElDIiwidGVuYW50X2NvZGUiOiJzaGlrc2hhZ3JhaGFuZXciLCJ0cmFuc2xhdGlvbnMiOm51bGx9LHsiaWQiOjc5LCJ0aXRsZSI6ImxlYXJuZXIiLCJsYWJlbCI6IkxlYXJuZXIiLCJ1c2VyX3R5cGUiOjAsInN0YXR1cyI6IkFDVElWRSIsIm9yZ2FuaXphdGlvbl9pZCI6MzUsInZpc2liaWxpdHkiOiJQVUJMSUMiLCJ0ZW5hbnRfY29kZSI6InNoaWtzaGFncmFoYW5ldyIsInRyYW5zbGF0aW9ucyI6bnVsbH1dfV19LCJpYXQiOjE3NTUwNjU3MzAsImV4cCI6MTc1NTY3MDUzMH0.Wv-8ga99GFr8l4rtgbVhUz1TPJC3nE3boz807CZ76j4'
  //   let accToken='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkIjoxNjE2LCJuYW1lIjoic2FuaXR5Y2hlY2sgYXVnIiwic2Vzc2lvbl9pZCI6MTA5ODcsIm9yZ2FuaXphdGlvbl9pZHMiOlsiMzkiXSwib3JnYW5pemF0aW9uX2NvZGVzIjpbInRyaXB1cmEiXSwidGVuYW50X2NvZGUiOiJzaGlrc2hhZ3JhaGFuZXciLCJvcmdhbml6YXRpb25zIjpbeyJpZCI6MzksIm5hbWUiOiJUcmlwdXJhIiwiY29kZSI6InRyaXB1cmEiLCJkZXNjcmlwdGlvbiI6InRyaXB1cmEgc3RhdGUgYXMgYW4gb3JnYW5pemF0aW9uIHRlc3QgaW4gU0ciLCJzdGF0dXMiOiJBQ1RJVkUiLCJyZWxhdGVkX29yZ3MiOm51bGwsInRlbmFudF9jb2RlIjoic2hpa3NoYWdyYWhhbmV3IiwibWV0YSI6bnVsbCwiY3JlYXRlZF9ieSI6MSwidXBkYXRlZF9ieSI6Mzc3LCJyb2xlcyI6W3siaWQiOjc3LCJ0aXRsZSI6Im1lbnRlZSIsImxhYmVsIjoibWVudGVlIiwidXNlcl90eXBlIjowLCJzdGF0dXMiOiJBQ1RJVkUiLCJvcmdhbml6YXRpb25faWQiOjM1LCJ2aXNpYmlsaXR5IjoiUFVCTElDIiwidGVuYW50X2NvZGUiOiJzaGlrc2hhZ3JhaGFuZXciLCJ0cmFuc2xhdGlvbnMiOm51bGx9LHsiaWQiOjc5LCJ0aXRsZSI6ImxlYXJuZXIiLCJsYWJlbCI6IkxlYXJuZXIiLCJ1c2VyX3R5cGUiOjAsInN0YXR1cyI6IkFDVElWRSIsIm9yZ2FuaXphdGlvbl9pZCI6MzUsInZpc2liaWxpdHkiOiJQVUJMSUMiLCJ0ZW5hbnRfY29kZSI6InNoaWtzaGFncmFoYW5ldyIsInRyYW5zbGF0aW9ucyI6bnVsbH1dfV19LCJpYXQiOjE3NTUwNjU3MzAsImV4cCI6MTc1NTE1MjEzMH0.jzpAcVZkximMpGVR9GWaXI3i0wfBn2GPAWD5uQJU4J0'
    
  // let data:any={"org-id":"9"}
  // let Theme:any={"primaryColor":"#572E91","secondaryColor":"#FF9911"}
  // localStorage.setItem("headers",JSON.stringify(data))
  // localStorage.setItem('accToken',accToken)
  // localStorage.setItem('refToken',refToken)
  // localStorage.setItem('theme',JSON.stringify(Theme))
  // }
}
