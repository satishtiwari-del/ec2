import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UserRegisterComponent } from './user-register/user-register.component';
import { UserListComponent } from './user-list/user-list.component';
import { RoleGuard } from '../guards/role.guard';
import { UserRole } from './user.service';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'list',
    pathMatch: 'full'
  },
  {
    path: 'register',
    component: UserRegisterComponent,
    canActivate: [RoleGuard],
    data: { role: UserRole.ADMIN }
  },
  {
    path: 'list',
    component: UserListComponent,
    canActivate: [RoleGuard],
    data: { role: UserRole.ADMIN }
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class UserManagementRoutingModule { }