import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private api: ApiService) {}

  canActivate(): boolean {
    let token: string | null = this.api.userAuthToken;
  
    if (!token) {
      try {
        token = localStorage.getItem('accToken');
      } catch (error) {
        console.error('Failed to access localStorage:', error);
        token = null;
      }
    }
  
    if (!token) {
      setTimeout(() => {
        const baseUrl = window.location.origin;
        window.location.href = baseUrl;
      }, 0);
      return false;
    }
  
    return true;
  }
  
}
