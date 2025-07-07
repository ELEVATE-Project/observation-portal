import { Component, TemplateRef, ViewChild } from '@angular/core';
import { DownloadService } from '../services/download.service';
import { DbDownloadService } from '../services/dbDownload.service';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-downloads',
  standalone: false,
  templateUrl: './downloads.component.html',
  styleUrl: './downloads.component.css'
})
export class DownloadsComponent {
  loaded = false;
  filters: any[] = [
    { value: 'observation', label: 'OBSERVATION' },
    { value: 'survey', label: 'SURVEY' },
    { value: 'projects', label: 'PROJECTS' },
  ];
  selectedIndex: number = 0;
  @ViewChild('confirmDialogModel') confirmDialogModel: TemplateRef<any>;
  dialogRef: any;

constructor(
  public router: Router,
  private dbDownloadService: DbDownloadService,
  private dialog: MatDialog,
  private translate:TranslateService
) {
}

ngOnInit(): void {
  this.loaded = true;
  this.fetchDownloadedData("observation");
}

onTabChange(index: number) {
  const selectedTab = this.filters[index];
  console.log('Selected Tab:', selectedTab.value);
}

isDataInDownloadsIndexDb:any;

async fetchDownloadedData(type){
  if(type == "observation"){
    this.isDataInDownloadsIndexDb = await this.dbDownloadService.getAllDownloadsData();
    console.log("isDataInDownloadsIndexDb", this.isDataInDownloadsIndexDb);
  }
}

navigateTo(route){
  this.router.navigateByUrl(route);
}


deleteData(key) {
  const dialogRef = this.dialog.open(this.confirmDialogModel);

  dialogRef.afterClosed().subscribe(result => {
    if (result === 'delete') {
      this.dbDownloadService.deleteData(key);
  this.fetchDownloadedData("observation");
    }
  });
}

setLanguage() {
  this.translate.setDefaultLang('en');
  this.translate.use('en');
}
}