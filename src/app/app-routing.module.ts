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
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
