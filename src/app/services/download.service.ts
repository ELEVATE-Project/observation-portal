import { Injectable } from '@angular/core';
import { DbDownloadService } from './dbDownload.service';
@Injectable({
  providedIn: 'root'
})
export class DownloadService {
  constructor(
    private dbDownloadService: DbDownloadService
  ) {
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

  async setDownloadsDataInIndexDb(dataObjectToStore:any, submissionId:any, storeName:any) {
    const data = {
      key: submissionId,
      data: [dataObjectToStore] 
    };
    try {
      await this.dbDownloadService.addDownloadsData(data, storeName);
    } catch (error) {
      console.error("Failed to store data in IndexedDB", error);
    }
  }
  
  async downloadData(storeName: any, dataObjectToStore: any) {
    const existingData: any[] = await this.dbDownloadService.getAllDownloadsDatas(storeName);
    const matchedEntry = existingData.find(entry => entry.key === dataObjectToStore?.id);
  
    if (matchedEntry) {
      matchedEntry.data = Array.isArray(matchedEntry.data) ? matchedEntry.data : [matchedEntry.data];
  
      const existingIndex = matchedEntry.data.findIndex(
        (item: any) =>
          item?.metaData?.submissionId === dataObjectToStore?.submissionId &&
          item?.metaData?.entityId === dataObjectToStore?.entityId
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