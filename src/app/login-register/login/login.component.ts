import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Auth, signInWithEmailAndPassword } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { FirebaseError } from '@firebase/util'; // Import FirebaseError type
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  errorMessage: string | null = null;

  constructor(private fb: FormBuilder, private auth: Auth, private router: Router, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }

  async onSubmit(): Promise<void> {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      
      try {
        // Sign in with email and password
        const userCredential = await signInWithEmailAndPassword(this.auth, email, password);
        console.log('User signed in:', userCredential);
        
        // Navigate to another page after successful login
        this.snackBar.open('Logging in!', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar'] // Optional: Custom styling
        });
        this.router.navigate(['/dashboard']);  // Replace with your desired route
      } catch (error: unknown) {
        console.error('Login error:', error);
        
        // Type assertion to handle FirebaseError
        if (error instanceof FirebaseError) {
          switch (error.code) {
            case 'auth/user-not-found':
              this.errorMessage = 'No user found with this email address.';
              break;
            case 'auth/wrong-password':
              this.errorMessage = 'Incorrect password. Please try again.';
              break;
            default:
              this.errorMessage = 'Login failed. Please check your credentials and try again.';
              break;
          }
        } else {
          this.errorMessage = 'An unexpected error occurred. Please try again later.';
        }
      }
    }
  }
}
