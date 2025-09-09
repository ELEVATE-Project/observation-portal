import { Injectable } from '@angular/core';
import { firstValueFrom ,Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import * as fileConstant from '../constants/file.formats.json';
import { ProfileService } from './profile.service';
import { ApiService } from './api.service';
import { MatDialog } from '@angular/material/dialog';
import { ProfileAlterPopupComponent } from '../shared/profile-alter-popup/profile-alter-popup.component';
import { Location } from '@angular/common';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
 error?(msg);

 getPreSingedUrls?(payload): Observable<any>;

 cloudStorageUpload?(payload): Observable<any>;

  constructor(private profileService: ProfileService,private apiServie:ApiService,private dialog: MatDialog,private location:Location,private toaster:ToastService) {}

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
  mapEvidences(evidences: any[]): any[] {
    return evidences.map(evidence => {
      const match = fileConstant.types.find(type =>
        type.formats.includes(evidence.extension)
      );
  
      return match
        ? { ...evidence, type: match.type, toolTip: match.toolTip, icon: match.icon }
        : evidence;
    });
  }

  backTologin(){
    this.toaster.showToast("LOGOUT_MSG",'danger')
    window.location.href = `${this.apiServie.baseUrl}/login`
  }

  async getProfileDetails() {
    const profileData:any = await this.profileService.getProfileAndEntityConfigData()
    if(profileData){
      localStorage.setItem('profileData',JSON.stringify(profileData))
      this.apiServie.profileData = JSON.parse(localStorage.getItem('profileData'))
    }else {
      await this.showProfileUpdateAlert();
      return;
    }
  }

  async showProfileUpdateAlert(){
    let data:any = {
      title: "ALERT",
      message:"UPDATE_PROFILE_MSG",
      actionButtons:[
        { label: "BACK", action: false },
        { label: "UPDATE_PROFILE", action: true, class: "dialog-primary-button" }
      ],
      disableClose: true
    }
    const popupRef = this.dialog.open(ProfileAlterPopupComponent,{
      width: data.width || "400px",
      data: data,
      disableClose: data.disableClose || false
    })
    let response = await firstValueFrom(popupRef.afterClosed())
    if(response){
      this.location.back()
    }else{
      this.location.back()
    }
  }

  isMobile(){
    return /iPhone|iPad|iPod|Android/i.test(window.navigator.userAgent);
  }
}
