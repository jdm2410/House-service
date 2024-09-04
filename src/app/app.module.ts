import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { LoginComponent } from './login-register/login/login.component';
import { RegisterComponent } from './login-register/register/register.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MainComponent } from './main/main.component';
import { HeaderComponent } from './header/header.component';
import { PasswordResetComponent } from './password-reset/password-reset.component';
import { AuthService } from './shared/services/auth.service';
import { ProfileUserComponent } from './profiles/profile-user/profile-user.component';
import { provideStorage } from '@angular/fire/storage';
import { getStorage } from 'firebase/storage';
import { CalendarComponent } from './calendar/calendar.component';
import { TicketFormComponent } from './ticket-form/ticket-form.component';
import { ServiceFormComponent } from './service-form/service-form.component';
import { ProfileWorkerComponent } from './profiles/profile-worker/profile-worker.component';
import { WorkerApplicationsComponent } from './worker-applications/worker-applications.component';
import { UserApplicationsComponent } from './user-applications/user-applications.component';
import { CalendarUserComponent } from './calendar-user/calendar-user.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';


@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    RegisterComponent,
    MainComponent,
    HeaderComponent,
    PasswordResetComponent,
    ProfileUserComponent,
    CalendarComponent,
    TicketFormComponent,
    ServiceFormComponent,
    ProfileWorkerComponent,
    WorkerApplicationsComponent,
    UserApplicationsComponent,
    CalendarUserComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    ReactiveFormsModule,
    FormsModule,
    MatSnackBarModule
  
  ],
  providers: [
    AuthService,
    provideAnimationsAsync(),
    provideFirebaseApp(() => initializeApp({"projectId":"house-seriv","appId":"1:660101816936:web:8b4c8521565a0d13d591dd","storageBucket":"house-seriv.appspot.com","apiKey":"AIzaSyCbT_hnS5wXinQodtizLmSDr-x3vInK9D8","authDomain":"house-seriv.firebaseapp.com","messagingSenderId":"660101816936"})),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore()),
    provideStorage(() => getStorage())
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
