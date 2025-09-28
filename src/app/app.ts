import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavSidebarComponent } from './shared/components/nav-sidebar/nav-sidebar.component';
import { AuthService } from './doclib/auth/services/auth.service';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavSidebarComponent],
  template: `
    <div class="app-container" [class.with-sidebar]="showSidebar">
      <app-nav-sidebar *ngIf="showSidebar"></app-nav-sidebar>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      height: 100vh;
    }

    .app-container:not(.with-sidebar) {
      background-color: #f5f5f5;
    }

    .with-sidebar .main-content {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
    }

    .main-content {
      flex: 1;
      width: 100%;
    }
  `]
})
export class AppComponent implements OnInit {
  showSidebar = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {
    // Subscribe to router events to update sidebar visibility
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.updateSidebarVisibility();
    });
  }

  ngOnInit() {
    // Initial check for authentication and redirect
    if (!this.authService.isAuthenticated() && !this.router.url.includes('/login')) {
      try { sessionStorage.setItem('returnUrl', this.router.url); } catch {}
      this.router.navigate(['/login']);
      return;
    }

    // Handle old shared route
    if (this.router.url.includes('/documents/shared')) {
      this.router.navigate(['/documents/search']);
    }

    // Set initial sidebar visibility
    this.updateSidebarVisibility();
  }

  private updateSidebarVisibility() {
    const isLoginPage = this.router.url.includes('/login');
    this.showSidebar = this.authService.isAuthenticated() && !isLoginPage;
  }
}
