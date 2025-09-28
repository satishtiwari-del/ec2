import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../user-management/user.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.authService.isAuthenticated()) {
      try { sessionStorage.setItem('returnUrl', state.url); } catch {}
      this.router.navigate(['/login']);
      return false;
    }

    const requiredRole = route.data['role'] as UserRole;
    if (requiredRole && !this.authService.hasRole(requiredRole)) {
      this.router.navigate(['/']);
      return false;
    }

    return true;
  }
}