import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, signOut } from '@angular/fire/auth';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-admin-header',
  templateUrl: './admin-header.component.html',
  styleUrls: ['./admin-header.component.css']
})
export class AdminHeaderComponent {

  constructor(
    private auth: Auth,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  logout(): void {
    signOut(this.auth).then(() => {
      console.log('Admin logged out');
      this.snackBar.open('Logging out!', 'Close', {
        duration: 5000,
        panelClass: ['success-snackbar']
      });
      window.location.href = '/login';
    }).catch(error => {
      console.error('Logout error:', error);
      this.snackBar.open('Error during logout. Please try again.', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    });
  }
}
