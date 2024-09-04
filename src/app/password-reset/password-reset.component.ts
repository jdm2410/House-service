import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../shared/services/auth.service';
import { Router } from '@angular/router';


@Component({
  selector: 'app-password-reset',
  templateUrl: './password-reset.component.html',
  styleUrls: ['./password-reset.component.css']
})
export class PasswordResetComponent {
  resetForm: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.resetForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  onSubmit(): void {
    if (this.resetForm.valid) {
      const email = this.resetForm.get('email')?.value;
      this.authService.sendPasswordResetEmail(email).subscribe({
        next: () => {
          alert('Password reset email sent!');
          this.router.navigate(['/login']);
        },
        error: (error) => {
          alert('Error sending password reset email: ' + error.message);
        }
      });
    }
  }
}
