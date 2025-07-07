import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ApiService } from '../services/api.service';
import * as urlConfig from '../constants/url-config.json';
import { ToastService } from '../services/toast.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { catchError, finalize } from 'rxjs';
import { MatSelectionListChange } from '@angular/material/list';
import { UrlParamsService } from '../services/urlParams.service';
import { GenericPopupComponent } from '../shared/generic-popup/generic-popup.component';
@Component({
  selector: 'app-observation-entity',
  standalone: false,
  templateUrl: './observation-entity.component.html',
  styleUrl: './observation-entity.component.css'
})
export class ObservationEntityComponent  {
  selectedEntities: any;
  solutionId: any;
  solutionName: any;
  entityToAdd: string;
  filteredEntities: any;
  filteredEntitiesOne: any;
  entity:any;
  addedEntities: string[] = [];
  entities = new FormControl();
  @ViewChild('searchEntityModal') searchEntityModal: TemplateRef<any>;
  dialogRef: any;
  observationId: any;
  searchEntities: any = [];
  loaded = false;
  searchValue: string = "";
  searchAddEntityValue: string = "";

  constructor(
    private apiService: ApiService, 
    private toaster: ToastService, 
    private router: Router, 
    private dialog: MatDialog,
    private urlParamsService:UrlParamsService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.urlParamsService.parseRouteParams(this.route);
    this.solutionId = this.urlParamsService?.solutionId;
    this.entity=this.urlParamsService?.entity;
    this.solutionName=decodeURIComponent(decodeURIComponent(this.urlParamsService?.name || ''))
    this.entityToAdd=this.urlParamsService?.entityType || "entity";
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
          this.filteredEntitiesOne = [...this.selectedEntities.entities]
        } else {
          this.toaster.showToast(res.message, 'Close');
        }
      })
  }

  openAllEntityList() {
    this.filteredEntities =[];
    this.searchAddEntityValue ="";
    this.getSearchEntities();
    this.dialogRef = this.dialog.open(this.searchEntityModal, {
      width: '80%',
      height: 'auto',
      enterAnimationDuration: 300,
      exitAnimationDuration: 150,
      disableClose: true,
    })

    this.dialogRef.afterClosed().subscribe((selectedIds: any[]) => {
      if (selectedIds) {
        this.updateEntities(selectedIds);
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

  getSearchEntities() {
    this.apiService.post(urlConfig.observation.searchEntities + this.observationId + `&parentEntityId=${this.apiService.profileData?.state}`, this.apiService.profileData)

      .subscribe((res: any) => {
        if (res.result) {
          const searchEntities = res?.result[0];
          this.searchEntities = searchEntities?.data;
          this.filteredEntities = [...searchEntities?.data]

        } else {
          this.toaster.showToast(res.message, 'Close');
        }
      }, (err: any) => {
        this.toaster.showToast(err.error.message, 'Close');
      })
  }

  closeDialog() {
    this.dialogRef.close();
  }

  handleEntitySearchInput(event?: any) {
    this.searchValue = event ? event.target.value.toLowerCase() : "";

    this.filteredEntitiesOne = this.selectedEntities?.entities.filter((item: any) =>
      item?.name.toLowerCase().includes(this.searchValue)
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

  submitDialog() {
    this.dialogRef.close(this.addedEntities);
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

  isEntityInFilteredEntitiesOne(entity: any): boolean {
    return this.selectedEntities?.entities?.some(
      (filteredEntity: any) => filteredEntity._id === entity._id
    ) ?? false;
  }
  
  isEntitySelected(entity: any): boolean {
    return (
      this.selectedEntities?.entities?.some(
        (filteredEntity: any) => filteredEntity._id === entity._id
      ) ||
      this.addedEntities.includes(entity._id)
    );
  }
  
  onSelectionChange(event: MatSelectionListChange): void {
    event?.options.forEach(option => {
      const entityId = option.value;
      if (option.selected) {
        if (!this.addedEntities.includes(entityId)) {
          this.addedEntities.push(entityId);
        }
      } else {
        this.addedEntities = this.addedEntities.filter(id => id !== entityId);
      }
    });
  }
  
  handleSearchInput(event?: any): void {
    const searchValue = event?.target?.value?.toLowerCase() || "";
    this.searchAddEntityValue = searchValue;
    this.filteredEntities = this.searchEntities?.filter((item: any) =>
      item?.name?.toLowerCase().includes(searchValue)
    ) || [];
  }
}
