import { Injectable } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { GenericDialogComponent } from '../shared/generic-dialog/generic-dialog.component';
import { Location } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
 error?(msg);

 getPreSingedUrls?(payload): Observable<any>;

 cloudStorageUpload?(payload): Observable<any>;

  constructor(private translate: TranslateService, private dialog: MatDialog, private location: Location) {}

  isEmpty(value: any): boolean {
    if (value == null) {
      return true;
    }
    if (typeof value === 'string' && value.trim() === '') {
      return true;
    }

    if (Array.isArray(value) && value.length === 0) {
      return true;
    }
    if (typeof value === 'object' && Object.keys(value).length === 0) {
      return true;
    }
    return false;
  }

  async validateToken(token:any){
    const tokenDecoded: any = await jwtDecode(token);
    const tokenExpiryTime = new Date(tokenDecoded.exp * 1000);
    const currentTime = new Date();
    return currentTime < tokenExpiryTime;
  }
  translateMessage(message: string): Promise<string> {
    return new Promise((resolve) => {
      this.translate.get(message).subscribe((translatedMsg: string) => {
        resolve(translatedMsg);
      });
    });
  }
  async createExpiryMsg(survey) {
    if (!survey?.endDate) return survey;
  
    const today = Date.now();
    const expiryDate = new Date(survey.endDate);
    const diffDays = Math.ceil((expiryDate.getTime() - today) / (1000 * 60 * 60 * 24));
    const formattedDate = this.formatDateWithSuffix(expiryDate);
    let key: any;
    if (expiryDate.getTime() < today) {
      if (survey?.status === 'completed') {
        key = 'COMPLETED_ON';
      } else {
        key = 'EXPIRED_ON';
        survey.status = 'expired';
      }
      const msg = await this.translateMessage(key);
      survey.generatedExpMsg = `${msg} ${formattedDate}`;
    } else {
      switch (diffDays) {
        case 1:
          survey.generatedExpMsg = await this.translateMessage('EXPIRE_IN_ONE_DAY');
          break;
        case 2:
          survey.generatedExpMsg = await this.translateMessage('EXPIRE_IN_TWO_DAY');
          break;
        default:
          key = 'VALID_TILL';
          const msg = await this.translateMessage(key);
          survey.generatedExpMsg = `${msg} ${formattedDate}`;
      }
    }
  
    return survey;
  }
  
  private formatDateWithSuffix(date: Date): string {
    const day = date.getDate();
    const suffix = this.getDaySuffix(day);
    const shortMonth = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear().toString().slice(-2);
  
    return `${day}${suffix} ${shortMonth} ${year}`;
  }
  
  private getDaySuffix(day: number): string {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }
  postMessageListener(data:any):Promise<boolean>{
    return new Promise((resolve) => {
      try {
        if ((window as any).FlutterChannel) {
          (window as any).FlutterChannel.postMessage(data);
          resolve(true);
        } else {
          resolve(false);
        }
      } catch (err: any) {
        console.error('FlutterChannel Error:', err);
        resolve(false);
      }
    });
  }

  async getProfileData(){
    let dialogData = {
      title: "ALERT",
      message:"UPDATE_PROFILE_MSG",
      actionButtons:[
        { label: "BACK", action: false },
        { label: "UPDATE_PROFILE", action: true, class: "dialog-primary-button" }
      ],
      disableClose: true
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
    let data = await JSON.parse(localStorage.getItem('profileData'))
    if(data && data?.state){
      return data
    }else{
      this.showProfileUpdateAlert(dialogData)
      return null
    }
  }

  async showProfileUpdateAlert(data: any){
    const popupRef = this.dialog.open(GenericDialogComponent,{
      width: data.width || "400px",
      data: data,
      disableClose: data.disableClose || false
    })
    let response = await firstValueFrom(popupRef.afterClosed())
    let options:any
    if(response){
      options = {
        type: "redirect",
        pathType: "profile"
      }
    }else{
      options = {
        type: "redirect",
        pathType: "home"
      }
    }
    let eventResponse = await this.postMessageListener(options)
    if(!eventResponse) this.location.back()
  }
}
