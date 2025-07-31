import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';
import { of, throwError } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { ListingComponent } from './listing.component';
import { ToastService } from '../services/toast.service';
import { ApiService } from '../services/api.service';
import { UrlParamsService } from '../services/urlParams.service';
import { UtilsService } from '../services/utils.service';
import { NetworkServiceService } from 'network-service';

describe('ListingComponent', () => {
  let component: ListingComponent;
  let fixture: ComponentFixture<ListingComponent>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockUrlParamsService: jasmine.SpyObj<UrlParamsService>;
  let mockUtilsService: jasmine.SpyObj<UtilsService>;
  let mockTranslateService: jasmine.SpyObj<TranslateService>;
  let mockNetworkService: jasmine.SpyObj<NetworkServiceService>;

  beforeEach(async () => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', ['snapshot']);
    const toastServiceSpy = jasmine.createSpyObj('ToastService', ['showToast']);
    const apiServiceSpy = jasmine.createSpyObj('ApiService', ['post'], { profileData: {} });
    const urlParamsServiceSpy = jasmine.createSpyObj('UrlParamsService', ['parseRouteParams'], { solutionType: 'observation' });
    const utilsServiceSpy = jasmine.createSpyObj('UtilsService', ['getProfileData', 'createExpiryMsg']);
    const translateServiceSpy = jasmine.createSpyObj('TranslateService', ['get']);
    const networkServiceSpy = jasmine.createSpyObj('NetworkServiceService', [], { isOnline$: of(true) });

    await TestBed.configureTestingModule({
      declarations: [ListingComponent],
      imports: [
        TranslateModule.forRoot(),
        FormsModule,
        MatCardModule,
        MatFormFieldModule,
        MatSelectModule,
        MatIconModule,
        MatButtonModule,
        BrowserAnimationsModule
      ],
      providers: [
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
        { provide: ToastService, useValue: toastServiceSpy },
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: UrlParamsService, useValue: urlParamsServiceSpy },
        { provide: UtilsService, useValue: utilsServiceSpy },
        { provide: TranslateService, useValue: translateServiceSpy },
        { provide: NetworkServiceService, useValue: networkServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ListingComponent);
    component = fixture.componentInstance;
    
    mockRouter = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    mockActivatedRoute = TestBed.inject(ActivatedRoute) as jasmine.SpyObj<ActivatedRoute>;
    mockToastService = TestBed.inject(ToastService) as jasmine.SpyObj<ToastService>;
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    mockUrlParamsService = TestBed.inject(UrlParamsService) as jasmine.SpyObj<UrlParamsService>;
    mockUtilsService = TestBed.inject(UtilsService) as jasmine.SpyObj<UtilsService>;
    mockTranslateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;
    mockNetworkService = TestBed.inject(NetworkServiceService) as jasmine.SpyObj<NetworkServiceService>;
  });

  describe('Component Creation and Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(component.listType).toBe('observation');
      expect(component.searchTerm).toBe('');
      expect(component.page).toBe(1);
      expect(component.limit).toBe(10);
      expect(component.reportPage).toBe(false);
      expect(component.loaded).toBe(false);
      expect(component.solutionListCount).toBe(0);
      expect(component.isEntityFilterModalOpen).toBe(false);
      expect(component.isAnyEntitySelected).toBe(false);
      expect(component.selectedEntityType).toBe('');
    });

    it('should subscribe to network status on construction', () => {
      expect(component.isOnline).toBe(true);
    });
  });

  describe('ngOnInit', () => {
    beforeEach(() => {
      mockTranslateService.get.and.returnValue(of('Test Description'));
      mockUtilsService.getProfileData.and.returnValue({ userId: 'test123' });
      mockApiService.post.and.returnValue(of({ status: 200, result: { data: [], count: 0 } }));
    });

    it('should call parseRouteParams, setPageTitle, and loadInitialData', () => {
      spyOn(component, 'setPageTitle');
      spyOn(component, 'loadInitialData');

      component.ngOnInit();

      expect(mockUrlParamsService.parseRouteParams).toHaveBeenCalledWith(mockActivatedRoute);
      expect(component.setPageTitle).toHaveBeenCalled();
      expect(component.loadInitialData).toHaveBeenCalled();
    });

    it('should set reportPage to true when pageTitle is Observation', () => {
      component.pageTitle = 'Observation';
      component.ngOnInit();
      expect(component.reportPage).toBe(true);
    });
  });

  describe('setPageTitle', () => {
    beforeEach(() => {
      mockTranslateService.get.and.returnValue(of('Test Description'));
    });

    it('should set page title from TITLE_MAP based on solution type', () => {
      mockUrlParamsService.solutionType = 'survey';
      component.setPageTitle();
      expect(component.pageTitle).toBeDefined();
    });

    it('should default to observation type when solutionType not in TITLE_MAP', () => {
      mockUrlParamsService.solutionType = 'unknown';
      component.setPageTitle();
      expect(component.pageTitle).toBeDefined();
    });

    it('should translate description using TranslateService', () => {
      component.setPageTitle();
      expect(mockTranslateService.get).toHaveBeenCalled();
      expect(component.description).toBe('Test Description');
    });
  });

  describe('loadInitialData', () => {
    beforeEach(() => {
      mockUtilsService.getProfileData.and.returnValue({ userId: 'test123' });
      mockApiService.post.and.returnValue(of({ status: 200, result: { data: [], count: 0 } }));
      spyOn(component, 'getListData');
    });

    it('should reset page and solutionList', () => {
      component.page = 5;
      component.solutionList = [{ id: 1 }];
      
      component.loadInitialData();
      
      expect(component.page).toBe(1);
      expect(component.solutionList).toEqual([]);
    });

    it('should call getListData when profileData exists', () => {
      component.loadInitialData();
      expect(component.getListData).toHaveBeenCalled();
    });

    it('should not call getListData when profileData is null', () => {
      mockUtilsService.getProfileData.and.returnValue(null);
      component.loadInitialData();
      expect(component.getListData).not.toHaveBeenCalled();
    });
  });

  describe('handleKeyDown', () => {
    it('should call handleInput when Enter key is pressed', () => {
      spyOn(component, 'handleInput');
      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      
      component.handleKeyDown(event);
      
      expect(component.handleInput).toHaveBeenCalledWith(event);
    });

    it('should not call handleInput for other keys', () => {
      spyOn(component, 'handleInput');
      const event = new KeyboardEvent('keydown', { key: 'Escape' });
      
      component.handleKeyDown(event);
      
      expect(component.handleInput).not.toHaveBeenCalled();
    });
  });

  describe('handleInput', () => {
    beforeEach(() => {
      mockApiService.post.and.returnValue(of({ status: 200, result: { data: [], count: 0 } }));
      spyOn(component, 'getListData');
    });

    it('should update searchTerm from event target value', () => {
      const mockEvent = { target: { value: 'test search' } };
      
      component.handleInput(mockEvent);
      
      expect(component.searchTerm).toBe('test search');
    });

    it('should clear searchTerm when no event provided', () => {
      component.searchTerm = 'existing search';
      
      component.handleInput();
      
      expect(component.searchTerm).toBe('');
    });

    it('should reset page, solutionList, and solutionListCount', () => {
      component.page = 3;
      component.solutionList = [{ id: 1 }];
      component.solutionListCount = 5;
      
      component.handleInput();
      
      expect(component.page).toBe(1);
      expect(component.solutionList).toEqual([]);
      expect(component.solutionListCount).toBe(0);
    });

    it('should call getListData', () => {
      component.handleInput();
      expect(component.getListData).toHaveBeenCalled();
    });
  });

  describe('getListData', () => {
    beforeEach(() => {
      component.pageTitle = 'Observation';
      component.page = 1;
      component.limit = 10;
      component.searchTerm = 'test';
      component.solutionType = 'observation';
      component.selectedEntityType = '';
    });

    it('should make API call and handle successful response', async () => {
      const mockResponse = {
        status: 200,
        result: {
          data: [{ id: 1, name: 'Test Solution' }],
          count: 1
        }
      };
      mockApiService.post.and.returnValue(of(mockResponse));

      await component.getListData();

      expect(mockApiService.post).toHaveBeenCalled();
      expect(component.solutionListCount).toBe(1);
      expect(component.loaded).toBe(true);
    });

    it('should handle API error response', async () => {
      const mockError = { error: { message: 'API Error' } };
      mockApiService.post.and.returnValue(throwError(mockError));

      await component.getListData();

      expect(mockToastService.showToast).toHaveBeenCalledWith('API Error', 'Close');
      expect(component.loaded).toBe(true);
    });

    it('should handle Survey page type with status assignment', async () => {
      component.pageTitle = 'Survey';
      const mockResponse = {
        status: 200,
        result: {
          data: [{ id: 1, name: 'Test Survey', status: 'active' }],
          count: 1
        }
      };
      mockApiService.post.and.returnValue(of(mockResponse));
      spyOn(component, 'assignStatusAndClasses');

      await component.getListData();

      expect(mockUtilsService.createExpiryMsg).toHaveBeenCalled();
      expect(component.assignStatusAndClasses).toHaveBeenCalled();
    });

    it('should handle Observation Reports page type', async () => {
      component.pageTitle = 'Observation Reports';
      const mockResponse = {
        status: 200,
        result: {
          data: [{ id: 1, name: 'Test Report' }],
          count: 1,
          entityType: ['School', 'District']
        }
      };
      mockApiService.post.and.returnValue(of(mockResponse));

      await component.getListData();

      expect(component.entityType).toEqual(['School', 'District']);
    });

    it('should return early if no config found for pageTitle', async () => {
      component.pageTitle = 'Unknown Page';
      
      await component.getListData();
      
      expect(mockApiService.post).not.toHaveBeenCalled();
    });
  });

  describe('loadData', () => {
    beforeEach(() => {
      mockApiService.post.and.returnValue(of({ status: 200, result: { data: [], count: 0 } }));
      spyOn(component, 'getListData');
    });

    it('should increment page number', () => {
      component.page = 1;
      component.loadData();
      expect(component.page).toBe(2);
    });

    it('should restore solutionList from initialSolutionData', () => {
      component.initialSolutionData = [{ id: 1 }];
      component.solutionList = [];
      
      component.loadData();
      
      expect(component.solutionList).toEqual([{ id: 1 }]);
    });

    it('should call getListData', () => {
      component.loadData();
      expect(component.getListData).toHaveBeenCalled();
    });
  });

  describe('navigateTo', () => {
    beforeEach(() => {
      component.pageTitle = 'Survey';
    });

    it('should navigate to surveyStatus for expired surveys', () => {
      const data = { status: 'expired' };
      
      component.navigateTo(data);
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(['surveyStatus'], {
        queryParams: { status: 'expired' }
      });
    });

    it('should navigate to questionnaire for active surveys', () => {
      const data = {
        status: 'active',
        observationId: 'obs1',
        entityId: 'entity1',
        submissionNumber: 1,
        submissionId: 'sub1',
        solutionId: 'sol1'
      };
      
      component.navigateTo(data);
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/questionnaire'], {
        queryParams: {
          observationId: 'obs1',
          entityId: 'entity1',
          submissionNumber: 1,
          index: 0,
          submissionId: 'sub1',
          solutionId: 'sol1',
          solutionType: 'survey'
        }
      });
    });

    it('should navigate to survey reports for Survey Reports page', () => {
      component.pageTitle = 'Survey Reports';
      const data = { submissionId: 'sub1', solutionId: 'sol1' };
      
      component.navigateTo(data);
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(['surveyReports', 'sub1', 'sol1']);
    });

    it('should open filter for observations with multiple entities', () => {
      component.pageTitle = 'Observation';
      component.reportPage = false;
      const data = { entities: [{ _id: '1' }, { _id: '2' }] };
      spyOn(component, 'openFilter');
      
      component.navigateTo(data);
      
      expect(component.allEntities).toEqual(data.entities);
      expect(component.selectedObservation).toEqual(data);
      expect(component.openFilter).toHaveBeenCalled();
    });

    it('should navigate directly for observations with single entity', () => {
      component.pageTitle = 'Observation';
      component.reportPage = false;
      const data = {
        entities: [{ _id: 'entity1' }],
        observationId: 'obs1',
        entityType: 'School',
        allowMultipleAssessemts: false,
        isRubricDriven: true
      };
      
      component.navigateTo(data);
      
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        'reports', 'obs1', 'entity1', 'School', false, true
      ]);
    });

    it('should show toast for observations with no entities', () => {
      component.pageTitle = 'Observation';
      component.reportPage = false;
      const data = { entities: [] };
      
      component.navigateTo(data);
      
      expect(mockToastService.showToast).toHaveBeenCalledWith('NO_SOLUTION_MSG', 'Close');
    });

    it('should navigate to entityList for report page', () => {
      component.reportPage = true;
      const data = {
        solutionId: 'sol1',
        name: 'Test Solution',
        entityType: 'School',
        _id: 'id1'
      };
      
      component.navigateTo(data);
      
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        'entityList', 'sol1', 'Test Solution', 'School', 'id1'
      ]);
    });
  });

  describe('changeEntityType', () => {
    beforeEach(() => {
      mockApiService.post.and.returnValue(of({ status: 200, result: { data: [], count: 0 } }));
      spyOn(component, 'getListData');
    });

    it('should update selectedEntityType and call getListData', () => {
      component.changeEntityType('School');
      
      expect(component.selectedEntityType).toBe('School');
      expect(component.getListData).toHaveBeenCalled();
    });
  });

  describe('Modal Operations', () => {
    it('should open filter modal', () => {
      component.openFilter();
      expect(component.isEntityFilterModalOpen).toBe(true);
    });

    it('should close filter modal', () => {
      component.isEntityFilterModalOpen = true;
      component.closeFilter();
      expect(component.isEntityFilterModalOpen).toBe(false);
    });

    it('should apply filter and navigate', () => {
      component.allEntities = [
        { _id: '1', selected: true },
        { _id: '2', selected: false }
      ];
      component.selectedObservation = {
        observationId: 'obs1',
        entityType: 'School',
        isRubricDriven: true
      };
      
      component.applyFilter();
      
      expect(mockRouter.navigate).toHaveBeenCalledWith([
        'reports', 'obs1', '1', 'School', false, true
      ]);
    });
  });

  describe('onEntityChange', () => {
    beforeEach(() => {
      component.allEntities = [
        { _id: '1', selected: false },
        { _id: '2', selected: false },
        { _id: '3', selected: false }
      ];
    });

    it('should deselect other entities when one is selected', () => {
      component.allEntities[0].selected = true;
      component.allEntities[1].selected = true;
      
      component.onEntityChange(1);
      
      expect(component.allEntities[0].selected).toBe(false);
      expect(component.allEntities[1].selected).toBe(true);
      expect(component.allEntities[2].selected).toBe(false);
    });

    it('should update isAnyEntitySelected flag', () => {
      component.allEntities[0].selected = true;
      
      component.onEntityChange(0);
      
      expect(component.isAnyEntitySelected).toBe(true);
    });

    it('should set isAnyEntitySelected to false when no entities selected', () => {
      component.onEntityChange(0);
      expect(component.isAnyEntitySelected).toBe(false);
    });
  });

  describe('assignStatusAndClasses', () => {
    it('should assign correct status and classes for active status', () => {
      const element = { status: 'active' };
      
      component.assignStatusAndClasses(element);
      
      expect(element.tagClass).toBe('tag-not-started');
      expect(element.statusLabel).toBe('Not Started');
    });

    it('should assign correct status and classes for draft status', () => {
      const element = { status: 'draft' };
      
      component.assignStatusAndClasses(element);
      
      expect(element.tagClass).toBe('tag-in-progress');
      expect(element.statusLabel).toBe('In Progress');
    });

    it('should assign correct status and classes for completed status', () => {
      const element = { status: 'completed' };
      
      component.assignStatusAndClasses(element);
      
      expect(element.tagClass).toBe('tag-completed');
      expect(element.statusLabel).toBe('Completed');
    });

    it('should assign correct status and classes for expired status', () => {
      const element = { status: 'expired' };
      
      component.assignStatusAndClasses(element);
      
      expect(element.tagClass).toBe('tag-expired');
      expect(element.statusLabel).toBe('Expired');
    });

    it('should assign default status for unknown status', () => {
      const element = { status: 'unknown' };
      
      component.assignStatusAndClasses(element);
      
      expect(element.tagClass).toBe('tag-not-started');
      expect(element.statusLabel).toBe('Not Started');
    });
  });

  describe('Template Integration', () => {
    beforeEach(() => {
      component.loaded = true;
      component.solutionListCount = 1;
      component.solutionList = [{ name: 'Test Solution' }];
      fixture.detectChanges();
    });

    it('should display page title and description', () => {
      component.pageTitle = 'Test Page';
      component.description = 'Test Description';
      fixture.detectChanges();
      
      const titleElement = fixture.debugElement.query(By.css('.heading'));
      const descElement = fixture.debugElement.query(By.css('.heading-paragraph'));
      
      expect(titleElement?.nativeElement.textContent).toContain('Test Page');
      expect(descElement?.nativeElement.textContent).toContain('Test Description');
    });

    it('should show search bar when reportPage is true', () => {
      component.reportPage = true;
      fixture.detectChanges();
      
      const searchElement = fixture.debugElement.query(By.css('.search-input'));
      expect(searchElement).toBeTruthy();
    });

    it('should render solution cards', () => {
      const cardElements = fixture.debugElement.queryAll(By.css('.observation-card'));
      expect(cardElements.length).toBe(1);
    });

    it('should show load more button when appropriate', () => {
      component.solutionListCount = 20;
      component.initialSolutionData = [{ id: 1 }];
      fixture.detectChanges();
      
      const loadMoreButton = fixture.debugElement.query(By.css('button[color="accent"]'));
      expect(loadMoreButton).toBeTruthy();
    });

    it('should show no data message when solutionListCount is 0', () => {
      component.solutionListCount = 0;
      component.isOnline = true;
      fixture.detectChanges();
      
      const noDataElement = fixture.debugElement.query(By.css('.no-data-container'));
      expect(noDataElement).toBeTruthy();
    });

    it('should show offline message when offline and no data', () => {
      component.solutionListCount = 0;
      component.isOnline = false;
      fixture.detectChanges();
      
      const offlineElement = fixture.debugElement.query(By.css('.offline-no-data-wrapper'));
      expect(offlineElement).toBeTruthy();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle undefined data in navigateTo', () => {
      expect(() => component.navigateTo(undefined)).not.toThrow();
    });

    it('should handle null entities array', () => {
      const data = { entities: null };
      expect(() => component.navigateTo(data)).not.toThrow();
    });

    it('should handle missing properties in solution data', () => {
      const element = {};
      expect(() => component.assignStatusAndClasses(element)).not.toThrow();
    });

    it('should handle API response without result', async () => {
      mockApiService.post.and.returnValue(of({ status: 400, message: 'Bad Request' }));
      
      await component.getListData();
      
      expect(mockToastService.showToast).toHaveBeenCalledWith('Bad Request', 'Close');
    });

    it('should handle empty search term', () => {
      spyOn(component, 'getListData');
      component.handleInput({ target: { value: '' } });
      
      expect(component.searchTerm).toBe('');
      expect(component.getListData).toHaveBeenCalled();
    });
  });
});
