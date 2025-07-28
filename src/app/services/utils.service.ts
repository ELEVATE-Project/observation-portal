import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import * as fileConstant from '../constants/file.formats.json';
import { ProfileService } from './profile.service';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
 error?(msg);

 getPreSingedUrls?(payload): Observable<any>;

 cloudStorageUpload?(payload): Observable<any>;

  constructor(private profileService: ProfileService,private apiServie:ApiService) {}

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
  async getProfileDetails() {
    const profileData:any = await this.profileService.getProfileAndEntityConfigData()
    if(profileData){
      localStorage.setItem('profileData',JSON.stringify(profileData))
      this.apiServie.profileData = JSON.parse(localStorage.getItem('profileData'))
    }
  }

  isMobile(){
    return /iPhone|iPad|iPod|Android/i.test(window.navigator.userAgent);
  }
}
