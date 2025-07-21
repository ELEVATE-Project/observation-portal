import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize } from 'rxjs/operators';
import * as urlConfig from '../constants/url-config.json';
import { ToastService } from '../services/toast.service';
import { ApiService } from '../services/api.service';
import { UrlParamsService } from '../services/urlParams.service';
import { UtilsService } from '../services/utils.service';
import { TranslateService } from '@ngx-translate/core';
import { TITLE_MAP, DESC_KEY_MAP, solutionTypeMap } from '../constants/actionContants';
import { NetworkServiceService } from 'network-service';

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
  reportPage: any = false;
  pageTitle: string;
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
  surveyDate:any;
  solutionType:any;
  description:any;
  isOnline:any;
  profileData:any
  constructor(
    public router: Router,
    private toaster: ToastService,
    private apiService: ApiService,
    private urlParamService:UrlParamsService,
    private route:ActivatedRoute,
    private utils:UtilsService,
    private translate: TranslateService,
    private network:NetworkServiceService
  ) {
    this.network.isOnline$.subscribe((status: any)=>{
      this.isOnline=status
    })
  }
  ngOnInit(): void {
    this.urlParamService.parseRouteParams(this.route)
    this.setPageTitle()
    this.reportPage = this.pageTitle === 'Observation';
    this.loadInitialData();
  }

  setPageTitle() {
    const solutionType = this.urlParamService.solutionType;
    const typeKey = Object.keys(TITLE_MAP).includes(solutionType) ? solutionType : 'observation';
  
    this.pageTitle = TITLE_MAP[typeKey];
    this.solutionType =solutionTypeMap[solutionType];
    this.translate.get(DESC_KEY_MAP[typeKey]).subscribe((translatedDesc: string) => {
      this.description = translatedDesc;
    });
  }
  
  loadInitialData(): void {
    this.page = 1;
    this.solutionList = [];
    this.profileData = this.utils.getProfileData()
    if(this.profileData){
      this.getListData();
    }
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
    const configMap = {
      'Survey': {
        urlPath: () => urlConfig[this.listType].listing,
        queryParams: () => `?type=${this.solutionType}&page=${this.page}&limit=${this.limit}&surveyReportPage=false`
      },
      'Survey Reports': {
        urlPath: () => urlConfig[this.listType].listing,
        queryParams: () => `?type=${this.solutionType}&page=${this.page}&limit=${this.limit}&surveyReportPage=true`
      },
      'Observation Reports': {
        urlPath: () => urlConfig[this.listType].reportListing,
        queryParams: () => `?page=${this.page}&limit=${this.limit}&entityType=${this.selectedEntityType}`
      },
      'Observation': {
        urlPath: () => urlConfig[this.listType].listing,
        queryParams: () => `?type=${this.solutionType}&page=${this.page}&limit=${this.limit}&search=${this.searchTerm}`
      }
    };
    const config = configMap[this.pageTitle as keyof typeof configMap];
    if (!config) return;
    const [urlPath, queryItems] = [config.urlPath(), config.queryParams()];
    this.apiService.post(
      urlPath + queryItems,
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
          this.pageTitle === 'Observation Reports' && (this.entityType = res?.result?.entityType);
          this.solutionList = this.selectedEntityType 
          ? res?.result?.data 
          : [...this.solutionList, ...res?.result?.data];
          if(this.pageTitle === 'Survey'){
            this.solutionList.forEach((element: any) => {
              this.utils.createExpiryMsg(element)
              this.assignStatusAndClasses(element);
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
    if(this.pageTitle === 'Survey'){
      if(data?.status === 'expired'){
        this.router.navigate(['surveyStatus'],{
          queryParams:{
            status:data?.status
          }
        })
        return
      }
      this.router.navigate(['/questionnaire'], {
        queryParams: {observationId: data?.observationId, entityId: data?.entityId, submissionNumber: data?.submissionNumber, index: 0, submissionId:data?.submissionId,solutionId:data?.solutionId, solutionType:"survey"
        }
      });
      return
    }
    if(this.pageTitle === 'Survey Reports'){
      this.router.navigate(['surveyReports',data?.submissionId,data?.solutionId])
        return
    }
    if (!this.reportPage) {
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
    this.getListData()
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
