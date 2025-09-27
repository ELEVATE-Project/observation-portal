import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ApiService } from '../services/api.service';
import * as urlConfig from '../constants/url-config.json';
import { ToastService } from '../services/toast.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { catchError, finalize } from 'rxjs';
import { UrlParamsService } from '../services/urlParams.service';
import { GenericPopupComponent } from '../shared/generic-popup/generic-popup.component';
import { AddEntityPopupComponent } from '../shared/add-entity-popup/add-entity-popup.component';
import { UtilsService } from '../services/utils.service';
@Component({
  selector: 'app-observation-entity',
  standalone: false,
  templateUrl: './observation-entity.component.html',
  styleUrl: './observation-entity.component.css'
})
export class ObservationEntityComponent  {
  selectedEntities: any;
  solutionId: any;
  entityToAdd: string;
  filteredEntitiesOne: any;
  entity:any;
  addedEntities: string[] = [];
  entities = new FormControl();
  dialogRef: any;
  observationId: any;
  loaded = false;
  headerConfig:any;


  constructor(
    private apiService: ApiService, 
    private toaster: ToastService, 
    private router: Router, 
    private dialog: MatDialog,
    private urlParamsService:UrlParamsService,
    private route: ActivatedRoute,
    private utils:UtilsService,
  ) {}

  async ngOnInit() {
    this.urlParamsService.parseRouteParams(this.route);
    this.solutionId = this.urlParamsService?.solutionId;
    this.entity=this.urlParamsService?.entity;
    try {
      if (!this.apiService?.profileData) {
        await this.utils.getProfileDetails();
      }
    } catch (err: any) {
      this.toaster.showToast(
        err?.error?.message ?? 'PROFILE FETCH FAILED',
        'danger'
      );
      this.loaded = true;
      return; 
    }
    this.getEntities();
  }

   getEntities() {
    this.selectedEntities = [];
    this.observationId = "";
    this.apiService.post(urlConfig.observation.getSelectedEntities + this.solutionId, this.apiService.profileData)
      .pipe(
        finalize(() => this.loaded = true),
        catchError((err: any) => {
          this.toaster.showToast(err.error.message, 'Close');
          throw Error(err);
        })
      )
      .subscribe((res: any) => {
        if (res.result) {
          this.observationId = res?.result?._id;
          this.selectedEntities = res?.result;
          this.filteredEntitiesOne = [...(this.selectedEntities?.entities ?? [])];
          this.entityToAdd=res?.result?.entityType || "entity";
          this.setHeaderConfig();
        } else {
          this.toaster.showToast(res.message, 'Close');
        }
      })
  }

  openAllEntityList() {
    const dialogRef = this.dialog.open(AddEntityPopupComponent, {
          width: '80%',
          height: 'auto',
          data: { 
            entityToAdd: this.entityToAdd,
            observationId:this.observationId,
            selectedEntities:this.selectedEntities
          }  
        });
      
        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            this.updateEntities(result);
          }
        });
  }

  updateEntities(selectedEntities) {
    this.apiService.post(urlConfig.observation.updateEntities + this.observationId, { data: selectedEntities })
      .subscribe((res: any) => {
        if (res.status == 200) {
          this.getEntities();
        } else {
          this.toaster.showToast(res.message, 'Close');
        }
      }, (err: any) => {
        this.toaster.showToast(err.error.message, 'Close');
      })
  }

  handleEntitySearchInput(value?: any) {
    this.headerConfig.searchTerm = value;
    this.filteredEntitiesOne = this.selectedEntities?.entities.filter((item: any) =>
      item?.name.toLowerCase().includes(this.headerConfig.searchTerm)
    );
  }
  navigateToDetails(data) {
    this.router.navigate([
      'details',
      this.observationId,
      data?._id,
      this.selectedEntities?.allowMultipleAssessemts
    ],{
      queryParams:{
        'name':data?.name,
        'submissionId': data?.submissionId,
      }
    });
  }


  deleteEntity(id) {
    const dialogRef = this.dialog.open(GenericPopupComponent,{
      width: '400px',
      data: {
        title: 'CONFIRM_DELETION',
        message: 'CONFIRM_DELETE',
        entityType: this.selectedEntities?.entityType
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'yes') {
        this.apiService.delete(urlConfig.observation.updateEntities + this.observationId, { data: [id] })

          .subscribe((res: any) => {
            if (res.status == 200) {
              this.toaster.showToast(res.message, 'success', 5000);
              this.addedEntities = [];
              this.getEntities();
            } else {
              this.toaster.showToast(res.message, 'Close');
            }
          }, (err: any) => {
            this.toaster.showToast(err.error.message, 'Close');
          })
      }
    });
  }

  setHeaderConfig(){
    this.headerConfig = {
      title:decodeURIComponent(decodeURIComponent(this.urlParamsService?.name || '')),
      description:'SELECT_ENTITY_FROM_LIST',
      placeholder:'SEARCH_ENTITY_PLACEHOLDER',
      searchTerm:'',
      showSearch:false,
      type:this.entityToAdd
    }
  }
  
}
