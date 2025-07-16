import { Injectable } from '@angular/core';
import * as urlConfig from '../constants/url-config.json';
import { ApiService } from './api.service';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  constructor(
    private apiBaseService: ApiService,
    private toastService: ToastService,
  ) {}

  async getProfileAndEntityConfigData(): Promise<any> {
    try {
      const entityConfigRes:any = await this.apiBaseService.get(urlConfig.formListing.entityConfigUrl).toPromise();
      const profileFormDataRes:any = await this.apiBaseService.get(urlConfig.formListing.profileUrl).toPromise();

      if (entityConfigRes?.status === 200 && profileFormDataRes?.status === 200) {
        const profileKeys = entityConfigRes?.result?.meta?.profileKeys;
        const profileDetails = profileFormDataRes?.result;

        if (profileDetails?.state) {
          return this.fetchEntitieIds(profileDetails, profileKeys);
        } else {
          this.toastService.showToast('PROFILE_LOAD_ERROR', 'danger');
          return;
        }
      } else {
        this.toastService.showToast('PROFILE_LOAD_ERROR', 'danger');
        return;
      }
    } catch (err: any) {
      this.toastService.showToast(err?.error?.message);
      return;
    }
  }

  private fetchEntitieIds(data: any, keys: any): any {
    const result: any = {};

    keys.forEach((key: any) => {
      const value = data[key];

      if (key === 'roles' && data.user_roles) {
        result['role'] = data.user_roles.map((role: any) => role.title).join(',');
      } else if (value) {
        if (Array.isArray(value)) {
          if (value.length > 0 && typeof value[0] === 'object' && 'value' in value[0]) {
            result[key] = value.map((item: any) => item.value).join(',');
          } else {
            result[key] = value.join(',');
          }
        } else if (typeof value === 'object' && 'value' in value) {
          result[key] = value.value;
        } else if (typeof value !== 'object') {
          result[key] = value;
        }
      }
    });

    return result;
  }
}
