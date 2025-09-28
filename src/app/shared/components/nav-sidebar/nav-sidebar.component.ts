import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../doclib/auth/services/auth.service';
import { UserRole } from '../../../doclib/auth/user-management/user.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  children?: NavItem[];
  requiresAdmin?: boolean;
}

@Component({
  selector: 'app-nav-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="nav-sidebar">
      <div class="nav-header">
    <h2>Hayagriva Poc</h2>
      </div>
      
      <div class="nav-content">
        <ng-container *ngFor="let item of navItems">
          <div class="nav-item" [class.has-children]="item.children?.length">
            <a [routerLink]="item.route" routerLinkActive="active" class="nav-link">
              <i class="material-icons">{{ item.icon }}</i>
              <span>{{ item.label }}</span>
            </a>
            
            <div class="nav-children" *ngIf="item.children?.length">
              <a *ngFor="let child of item.children" 
                 [routerLink]="child.route" 
                 routerLinkActive="active"
                 class="nav-link child">
                <i class="material-icons">{{ child.icon }}</i>
                <span>{{ child.label }}</span>
              </a>
            </div>
          </div>
        </ng-container>
      </div>
    </nav>
  `,
  styles: [`
    .nav-sidebar {
      width: 250px;
      height: 100vh;
      background-color: #2c3e50;
      color: white;
      display: flex;
      flex-direction: column;
      box-shadow: 2px 0 5px rgba(0, 0, 0, 0.1);
    }

    .nav-header {
      padding: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .nav-header h2 {
      margin: 0;
      font-size: 1.5rem;
      color: #ecf0f1;
    }

    .nav-content {
      flex: 1;
      overflow-y: auto;
      padding: 10px 0;
    }

    .nav-item {
      margin: 5px 0;
    }

    .nav-link {
      display: flex;
      align-items: center;
      padding: 12px 20px;
      color: #ecf0f1;
      text-decoration: none;
      transition: background-color 0.3s;
    }

    .nav-link:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .nav-link.active {
      background-color: #34495e;
      border-left: 4px solid #3498db;
    }

    .nav-link i {
      margin-right: 10px;
      font-size: 20px;
    }

    .nav-children {
      margin-left: 20px;
    }

    .nav-link.child {
      padding: 8px 20px;
      font-size: 0.9em;
    }

    .nav-link.child i {
      font-size: 18px;
    }
  `]
})
export class NavSidebarComponent implements OnInit {
  private baseNavItems: NavItem[] = [
    {
      label: 'Documents',
      icon: 'folder',
      route: '/documents',
      children: [
        {
          label: 'My Files',
          icon: 'description',
          route: '/documents/files'
        },
        {
          label: 'Search',
          icon: 'search',
          route: '/documents/search'
        }
      ]
    },
    {
      label: 'User Management',
      icon: 'people',
      route: '/users',
      children: [
        {
          label: 'User List',
          icon: 'list',
          route: '/users/list'
        }
      ],
      requiresAdmin: true
    },
    {
      label: 'Settings',
      icon: 'settings',
      route: '/settings'
    }
  ];

  navItems: NavItem[] = [];
  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.updateNavItems();
  }

  private updateNavItems() {
    const user = this.authService.getAuthUser();
    const isAdmin = user?.role === UserRole.ADMIN;

    this.navItems = this.baseNavItems.filter(item => {
      if (item.requiresAdmin) {
        return isAdmin;
      }
      return true;
    });
}
}