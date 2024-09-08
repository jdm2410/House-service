import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Firestore, collection, doc, setDoc, deleteDoc, getDocs } from '@angular/fire/firestore';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-user',
  templateUrl: './admin-user.component.html',
  styleUrls: ['./admin-user.component.css']
})
export class AdminUserComponent implements OnInit {
  userForm: FormGroup;
  users$: Observable<any[]>;
  selectedUser: any;
  isEditMode = false; // Track if we are in edit mode

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private auth: Auth,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.userForm = this.fb.group({
      username: ['', [Validators.required]],
      name: ['', [Validators.required]],
      surname: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]], // Make password fields optional for editing
      confirmPassword: [''],
      bio: ['']
    }, { validators: this.passwordMatchValidator });

    this.users$ = this.loadUsers();
  }

  ngOnInit(): void {}

  // Validate that password and confirmPassword match if password is provided
  passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;

    // If password is provided (only in create mode), check if it matches confirmPassword
    if (password || confirmPassword) {
      return password === confirmPassword ? null : { notSame: true };
    }
    return null; // Valid when both are empty (during updates)
  }

  // Handle form submission for adding a new user
  async onUserSubmit() {
    if (this.userForm.invalid) {
      return;
    }

    const { username, name, surname, email, password, bio } = this.userForm.value;

    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      const userRef = doc(this.firestore, `users/${user.uid}`);
      await setDoc(userRef, { username, name, surname, email, bio });

      this.snackBar.open('User added successfully!', 'Close', { duration: 5000, panelClass: ['success-snackbar'] });
      this.userForm.reset();
      this.loadUsers();
      this.userForm.get('email')?.enable(); // Ensure the email field is enabled after user creation
      this.users$ = this.loadUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      this.snackBar.open('Error adding user. Please try again.', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
    }
  }

  // Load users from Firestore
  loadUsers(): Observable<any[]> {
    const usersCollection = collection(this.firestore, 'users');
    return from(getDocs(usersCollection)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );
  }

  // Select a user to edit and populate the form with their data
  selectUser(user: any) {
      this.router.navigate(['/admin/user-info', user.id]); // Navigate to the user info page with the user ID
/*     this.isEditMode = true; // Set the form to edit mode
    this.selectedUser = user;
    this.userForm.patchValue({
      username: user.username,
      name: user.name,
      surname: user.surname,
      email: user.email,
      bio: user.bio
    }); */
    
    // Disable the email field since we don't want to update the email in this form
  }

  // Handle user updates
  async updateUser() {

    const { username, name, surname, bio } = this.userForm.value;

    try {
      const userRef = doc(this.firestore, `users/${this.selectedUser.id}`);
      await setDoc(userRef, { username, name, surname, email: this.selectedUser.email, bio });
      this.loadUsers();
      this.snackBar.open('User updated successfully!', 'Close', { duration: 5000, panelClass: ['success-snackbar'] });
      this.isEditMode = false; // Reset the form state
      this.userForm.reset();
      this.selectedUser = null; // Clear selectedUser after update
      this.userForm.get('email')?.enable(); // Enable the email field for creating new users
      this.users$ = this.loadUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      this.snackBar.open('Error updating user. Please try again.', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
    }
  }

  // Delete a user
  async deleteUser(userId: string) {
    try {
      await deleteDoc(doc(this.firestore, `users/${userId}`));
      this.snackBar.open('User deleted successfully!', 'Close', { duration: 5000, panelClass: ['success-snackbar'] });
      this.users$ = this.loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      this.snackBar.open('Error deleting user. Please try again.', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
    }
  }
}
