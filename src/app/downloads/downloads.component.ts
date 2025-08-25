import { Component, TemplateRef, ViewChild } from '@angular/core';
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

  filters = [
    { value: 'observation', label: 'OBSERVATION' },
    { value: 'survey', label: 'SURVEY' },
    { value: 'projects', label: 'PROJECTS' },
  ];

  selectedIndex = 0;
  @ViewChild('confirmDialogModel') confirmDialogModel: TemplateRef<any>;

  downloadsData: Record<string, any[]> = {
    observation: [],
    survey: [],
    projects: []
  };

  constructor(
    private router: Router,
    private dbDownloadService: DbDownloadService,
    private dialog: MatDialog,
    private translate: TranslateService
  ) {}

  async ngOnInit() {
    this.loaded = true;
    await this.fetchDownloadedData(this.filters[0].value);
  }

  async onTabChange(index: number) {
    const selectedTab = this.filters[index].value;
    if (!this.downloadsData[selectedTab]?.length) {
      await this.fetchDownloadedData(selectedTab);
    }
  }

  async fetchDownloadedData(type: string) {
    const results = await this.dbDownloadService.getAllDownloadsDatas(type) || [];
    this.downloadsData[type] = results.map((item: any) => ({
      key: item.key,
      data: Array.isArray(item.data) ? item.data[0] : item.data
    }));
  }

  navigateTo(route?: string, type?: string) {
    if (!route) return;
    const url = route.trim();
  
    if (type === 'projects') {
      window.location.href = url;
      return;
    } else {
      this.router.navigateByUrl(url);
    }
  }
  

  deleteData(key: string, type: string) {
    const dialogRef = this.dialog.open(this.confirmDialogModel);
    dialogRef.afterClosed().subscribe(async result => {
      if (result === 'delete') {
        await this.dbDownloadService.deleteData(key, type);
        await this.fetchDownloadedData(type);
      }
    });
  }

  setLanguage() {
    this.translate.setDefaultLang('en');
    this.translate.use('en');
  }
}
