import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { Auth, createUserWithEmailAndPassword, updateProfile } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-registration',
  templateUrl: './register.component.html'
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private firestore: Firestore,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.registerForm = this.fb.group({
      userType: ['user', Validators.required],
      username: ['', [Validators.required]],
      name: ['', [Validators.required]],
      surname: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { notSame: true };
  }

  async onSubmit() {
    if (this.registerForm.invalid) {
      return;
    }
  
    const { userType, username, name, surname, email, password, confirmPassword, service, score, requests, bio } = this.registerForm.value;
  
    try {
      // Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
  
      // Update user profile
      await updateProfile(user, { displayName: username });
  
      // Determine which collection to use based on userType
      const collectionName = userType === 'worker' ? 'workers' : 'users';
      const userRef = doc(this.firestore, `${collectionName}/${user.uid}`);
  
      // Prepare user data
      const userData: any = {
        username,
        name,
        surname,
        email,
      };
  
      // Add worker-specific data if applicable
      if (userType === 'worker') {
        userData.service = service ?? null; // Use null if undefined
        userData.score = score ?? null;     // Use null if undefined
        userData.requests = requests ?? []; // Use empty array if undefined
      }
  
      // Add user-specific data if applicable
      if (userType === 'user') {
        userData.bio = bio ?? ''; // Use empty string if undefined
      }
  
      // Save user data to the appropriate collection
      await setDoc(userRef, userData);
  
      // Redirect after successful registration
      this.snackBar.open('Register complete!', 'Close', {
        duration: 5000,
        panelClass: ['success-snackbar'] // Optional: Custom styling
      });
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Error during registration:', error);
    }
  }
}
