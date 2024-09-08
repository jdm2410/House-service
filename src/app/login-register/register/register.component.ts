import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Firestore, doc, setDoc, query, where, collection, getDocs } from '@angular/fire/firestore';
import { Auth, createUserWithEmailAndPassword, updateProfile } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-registration',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'] // Include your styles here
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
      service: [''], // Additional fields for worker
      score: [''],
      requests: [''],
      bio: [''] // Additional fields for user
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() {
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value
      ? null : { notSame: true };
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.registerForm.get(fieldName);
    return control?.invalid && (control?.touched || control?.dirty) ? true : false;
  }
  

  async onSubmit() {
    if (this.registerForm.invalid) {
      return;
    }
    
    const { userType, username, name, surname, email, password, confirmPassword, service, score, requests, bio } = this.registerForm.value;
    
    try {
      // Check if username already exists
      const userCollection = userType === 'worker' ? 'workers' : 'users';
      const userQuery = query(collection(this.firestore, userCollection), where('username', '==', username));
      const querySnapshot = await getDocs(userQuery);

      if (!querySnapshot.empty) {
        // Username already exists
        this.registerForm.get('username')?.setErrors({ usernameTaken: true });
        this.snackBar.open('Username already taken. Please choose another one.', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'] // Optional: Custom styling
        });
        return;
      }
  
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
        userData.requests = requests ?? [];
        userData.bio = bio ?? ''; // Use empty array if undefined
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
      this.snackBar.open('Error during registration. Please try again.', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'] // Optional: Custom styling
      });
    }
  }
}
