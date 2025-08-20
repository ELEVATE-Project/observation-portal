import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { ToastService } from './toast.service';
import * as urlConfig from '../constants/url-config.json';
import { catchError, finalize } from 'rxjs';
import { DbDownloadService } from './dbDownload.service';
@Injectable({
  providedIn: 'root'
})
export class DownloadService {
  constructor(
    private apiService: ApiService,
    private toaster: ToastService,
    private dbDownloadService: DbDownloadService
  ) {
  }

  async setDownloadsDataInIndexDb(dataObjectToStore, submissionId, storeName) {
    const data = {
      key: submissionId,
      data: storeName === "observation" ? [dataObjectToStore] : dataObjectToStore
    }
    try {
      await this.dbDownloadService.addDownloadsData(data, storeName);
    } catch (error) {
      console.error("Failed to store data in IndexedDB", error);
    }
  }

  async checkAndFetchDownloadsData(submissionId, type) {
    let indexdbData = await this.dbDownloadService.getDownloadsDataByKeyId(submissionId, type);
    let data= indexdbData?.data
    return data;
  }

  async checkAndFetchDownloadsDatas(type) {
    let indexdbData = await this.dbDownloadService.getAllDownloadsDatas( type);
    return indexdbData;
  }

  async downloadData( storeName:any, dataObjectToStore:any) {


    let existingData: any[] = await this.dbDownloadService.getAllDownloadsDatas(storeName);
    let matchedEntry = existingData.find(entry => entry.key === dataObjectToStore?.id);
    if (matchedEntry) {
      const existingIndex = matchedEntry.data.findIndex(
        (item: any) => 
          item.metaData.submissionId === dataObjectToStore?.submissionId &&
          item.metaData.entityId === dataObjectToStore?.entityId
      );

      if (existingIndex !== -1) {
        matchedEntry.data[existingIndex] = dataObjectToStore;
      } else {
        matchedEntry.data.push(dataObjectToStore);
      }
      await this.dbDownloadService.updateData(matchedEntry, storeName);
    } else {
      await this.setDownloadsDataInIndexDb(dataObjectToStore, dataObjectToStore?.id, storeName);
    }
  }
}