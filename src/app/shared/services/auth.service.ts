import { Injectable } from '@angular/core';
import { Auth, sendPasswordResetEmail } from '@angular/fire/auth';
import { from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private auth: Auth) {}

  sendPasswordResetEmail(email: string) {
    return from(sendPasswordResetEmail(this.auth, email));
  }
}
