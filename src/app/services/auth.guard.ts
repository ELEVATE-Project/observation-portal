import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private api: ApiService, private router: Router) {}

  canActivate(): boolean {
    const token = this.api.userAuthToken || localStorage.getItem('accToken');
    if (!token) {
      const baseUrl = window.location.origin;
      window.location.href = baseUrl;
      return false;
    }
    return true;
  }
}
