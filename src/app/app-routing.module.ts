import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './login-register/login/login.component';
import { RegisterComponent } from './login-register/register/register.component';
import { MainComponent } from './main/main.component';
import { PasswordResetComponent } from './password-reset/password-reset.component';
import { ProfileUserComponent } from './profiles/profile-user/profile-user.component';
import { TicketFormComponent } from './ticket-form/ticket-form.component';
import { ServiceFormComponent } from './service-form/service-form.component';
import { ProfileWorkerComponent } from './profiles/profile-worker/profile-worker.component';
import { WorkerApplicationsComponent } from './worker-applications/worker-applications.component';
import { AdminBoardComponent } from './admin/admin-board/admin-board.component';
import { AdminUserComponent } from './admin/admin-user/admin-user.component';
import { AdminWorkerComponent } from './admin/admin-worker/admin-worker.component';
import { AdminUserInfoComponent } from './admin/admin-user-info/admin-user-info.component';
import { AdminWorkerInfoComponent } from './admin/admin-worker-info/admin-worker-info.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent},
  { path: 'dashboard', component: MainComponent},
  { path: 'password-reset', component: PasswordResetComponent},
  { path: 'profile-user', component: ProfileUserComponent},
  { path: 'profile-worker', component: ProfileWorkerComponent},
  { path: 'create-ticket', component: TicketFormComponent},
  { path: 'create-service', component: ServiceFormComponent},
  { path: 'worker-applications', component: WorkerApplicationsComponent},
  { path: 'admin-board', component: AdminBoardComponent},
  { path: 'admin-users', component: AdminUserComponent},
  {path: 'admin-workers', component: AdminWorkerComponent},
  {
    path: 'admin/user-info/:id',
    component: AdminUserInfoComponent
  },
  {
    path: 'admin/worker-info/:id',
    component: AdminWorkerInfoComponent
  },

  { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
