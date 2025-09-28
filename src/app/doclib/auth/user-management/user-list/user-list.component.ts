import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule, MatTable, MatTableDataSource } from '@angular/material/table';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { UserDialogComponent } from '../user-dialog/user-dialog.component';
import { FormsModule } from '@angular/forms';
import { MockUserService } from '../user.service.mock';
import { User, UserRole, UserStatus } from '../user.service';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatSortModule,
    MatPaginatorModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    FormsModule
  ],
  providers: [MockUserService],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>User Management</mat-card-title>
        <div class="header-actions">
          <mat-form-field appearance="outline" class="search-field">
            <mat-label>Search users</mat-label>
            <input matInput (keyup)="applyFilter($event)" placeholder="Search by name, email, or department" #input>
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
          <button mat-raised-button color="primary" (click)="addUser()">
            <mat-icon>person_add</mat-icon>
            Add User
          </button>
        </div>
      </mat-card-header>

      <mat-card-content>
        <div class="table-container mat-elevation-z8">
          <table mat-table [dataSource]="dataSource" matSort>
            <!-- Full Name Column -->
            <ng-container matColumnDef="fullName">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Name</th>
              <td mat-cell *matCellDef="let user">
                <div class="user-name">
                  <mat-icon [style.color]="getRoleColor(user.role)">{{getRoleIcon(user.role)}}</mat-icon>
                  {{user.fullName}}
                </div>
              </td>
            </ng-container>

            <!-- Email Column -->
            <ng-container matColumnDef="email">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Email</th>
              <td mat-cell *matCellDef="let user">{{user.email}}</td>
            </ng-container>

            <!-- Department Column -->
            <ng-container matColumnDef="department">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Department</th>
              <td mat-cell *matCellDef="let user">{{user.department}}</td>
            </ng-container>

            <!-- Role Column -->
            <ng-container matColumnDef="role">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Role</th>
              <td mat-cell *matCellDef="let user">
                <mat-chip [style.background-color]="getRoleChipColor(user.role)" [style.color]="'white'">
                  {{user.role}}
                </mat-chip>
              </td>
            </ng-container>

            <!-- Status Column -->
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
              <td mat-cell *matCellDef="let user">
                <mat-chip [style.background-color]="getStatusChipColor(user.status)" [style.color]="'white'">
                  {{user.status}}
                </mat-chip>
              </td>
            </ng-container>

            <!-- Actions Column -->
            <ng-container matColumnDef="actions">
              <th mat-header-cell *matHeaderCellDef>Actions</th>
              <td mat-cell *matCellDef="let user">
                <button mat-icon-button color="primary" matTooltip="Edit user" (click)="editUser(user)">
                  <mat-icon>edit</mat-icon>
                </button>
                <button mat-icon-button [color]="user.status === 'active' ? 'warn' : 'primary'"
                        [matTooltip]="user.status === 'active' ? 'Deactivate user' : 'Activate user'"
                        (click)="toggleUserStatus(user)">
                  <mat-icon>{{user.status === 'active' ? 'block' : 'check_circle'}}</mat-icon>
                </button>
                <button mat-icon-button color="warn" matTooltip="Delete user" (click)="deleteUser(user)">
                  <mat-icon>delete</mat-icon>
                </button>
              </td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>

            <!-- Row shown when no matching data -->
            <tr class="mat-row" *matNoDataRow>
              <td class="mat-cell" colspan="6">No users found matching: "{{input.value}}"</td>
            </tr>
          </table>

          <mat-paginator [pageSizeOptions]="[5, 10, 25, 100]" aria-label="Select page of users"></mat-paginator>
        </div>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    :host {
      display: block;
      padding: 20px;
    }

    mat-card {
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 16px;
      width: 100%;
    }

    .search-field {
      flex: 1;
    }

    .table-container {
      margin-top: 16px;
      border-radius: 8px;
      overflow: hidden;
    }

    table {
      width: 100%;
    }

    .mat-mdc-row:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }

    .user-name {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    mat-chip {
      min-width: 80px;
      justify-content: center;
    }

    .mat-column-actions {
      width: 120px;
      text-align: center;
    }

    .mat-column-role,
    .mat-column-status {
      width: 120px;
    }
  `]
})
export class UserListComponent implements OnInit {
  displayedColumns: string[] = ['fullName', 'email', 'department', 'role', 'status', 'actions'];
  dataSource: MatTableDataSource<User>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild(MatTable) table!: MatTable<User>;

  constructor(
    private userService: MockUserService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.dataSource = new MatTableDataSource<User>();
  }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getUsers().subscribe(users => {
      this.dataSource.data = users;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getRoleIcon(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'admin_panel_settings';
      case UserRole.CREATOR:
        return 'edit_note';
      case UserRole.VIEWER:
        return 'visibility';
      default:
        return 'person';
    }
  }

  getRoleColor(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return '#9C27B0';
      case UserRole.CREATOR:
        return '#2196F3';
      case UserRole.VIEWER:
        return '#4CAF50';
      default:
        return '#757575';
    }
  }

  getRoleChipColor(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return '#9C27B0';
      case UserRole.CREATOR:
        return '#2196F3';
      case UserRole.VIEWER:
        return '#4CAF50';
      default:
        return '#757575';
    }
  }

  getStatusChipColor(status: UserStatus): string {
    switch (status) {
      case UserStatus.ACTIVE:
        return '#4CAF50';
      case UserStatus.DEACTIVATED:
        return '#FFA000';
      case UserStatus.SUSPENDED:
        return '#F44336';
      default:
        return '#757575';
    }
  }

  addUser() {
    const dialogRef = this.dialog.open(UserDialogComponent);

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.userService.registerUser(result).subscribe({
          next: () => {
            this.loadUsers();
            this.snackBar.open('User added successfully', 'Close', {
              duration: 3000
            });
          },
          error: (error) => {
            this.snackBar.open(error.message || 'Failed to add user', 'Close', {
              duration: 3000
            });
          }
        });
      }
    });
  }

  editUser(user: User) {
    // TODO: Implement edit user dialog
    this.snackBar.open('Edit user functionality coming soon', 'Close', {
      duration: 3000
    });
  }

  toggleUserStatus(user: User) {
    if (user.status === UserStatus.ACTIVE) {
      this.userService.deactivateAccount(user.id).subscribe({
        next: () => {
          this.loadUsers();
          this.snackBar.open('User deactivated successfully', 'Close', {
            duration: 3000
          });
        },
        error: (error) => {
          this.snackBar.open(error.message || 'Failed to deactivate user', 'Close', {
            duration: 3000
          });
        }
      });
    } else {
      // TODO: Implement activate user
      this.snackBar.open('Activate user functionality coming soon', 'Close', {
        duration: 3000
      });
    }
  }

  deleteUser(user: User) {
    // TODO: Implement delete confirmation dialog
    this.userService.deleteAccount(user.id).subscribe({
      next: () => {
        this.loadUsers();
        this.snackBar.open('User deleted successfully', 'Close', {
          duration: 3000
        });
      },
      error: (error) => {
        this.snackBar.open(error.message || 'Failed to delete user', 'Close', {
          duration: 3000
        });
      }
    });
  }
}