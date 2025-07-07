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

  async setDownloadsDataInIndexDb(observationData, submissionId) {
    const data = {
      key: submissionId,
      data: [observationData]
    }
    try {
      await this.dbDownloadService.addDownloadsData(data);
    } catch (error) {
      console.error("Failed to store data in IndexedDB", error);
    }
  }

  async checkAndMapIndexDbDataToVariables(submissionId) {
    let indexdbData = await this.dbDownloadService.getDownloadsData(submissionId);
    let currentObservation = {
      data: indexdbData?.data

    };
    return currentObservation;
  }


  async checkAndFetchDownloadsData(submissionId, type) {
    let indexdbData = await this.dbDownloadService.getDownloadsData(submissionId, type);
    let data= indexdbData?.data
    return data;
  }

  async downloadObservation( observationId, entityId, observationDetails, submissionId) {

    // return
    const newItem = {
      title: observationDetails?.observationName,
      subTitle: observationDetails?.program?.name,
      route: `/details/${observationId}/${entityId}/${observationDetails?.allowMultipleAssessemts}`,
      metaData: {
        isRubric: observationDetails?.isRubricDriven,
        observationId: observationId,
        submissionId: submissionId,
        entityId: entityId,
        observationName: observationDetails?.title,
        observationCreatedDate: observationDetails?.createdAt,
        status: observationDetails?.status
      }
    };

    let existingData: any[] = await this.dbDownloadService.getAllDownloadsData();
    let matchedEntry = existingData.find(entry => entry.key === observationId);
    if (matchedEntry) {
      const existingIndex = matchedEntry.data.findIndex(
        (item: any) => 
          item.metaData.submissionId === submissionId &&
          item.metaData.entityId === entityId
      );

      if (existingIndex !== -1) {
        matchedEntry.data[existingIndex] = newItem;
      } else {
        matchedEntry.data.push(newItem);
      }
      await this.dbDownloadService.updateData(matchedEntry);
    } else {
      await this.setDownloadsDataInIndexDb(newItem, observationId);
    }
  }
}