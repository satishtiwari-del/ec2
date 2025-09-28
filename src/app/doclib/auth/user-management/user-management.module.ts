import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserManagementRoutingModule } from './user-management-routing.module';
import { UserRegisterComponent } from './user-register/user-register.component';

@NgModule({
  imports: [
    CommonModule,
    UserManagementRoutingModule,
    UserRegisterComponent // Import the standalone component
  ]
})
export class UserManagementModule { }