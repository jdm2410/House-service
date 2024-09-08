import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Firestore, doc, setDoc, deleteDoc, collection, query, where, getDocs, DocumentData } from '@angular/fire/firestore';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-admin-board',
  templateUrl: './admin-board.component.html',
  styleUrls: ['./admin-board.component.css']
})
export class AdminBoardComponent implements OnInit {
  userForm: FormGroup;
  workerForm: FormGroup;
  users$: Observable<any[]>;
  workers$: Observable<any[]>;
  selectedUser: any;
  selectedWorker: any;

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private firestore: Firestore,
    private snackBar: MatSnackBar
  ) {
    this.userForm = this.fb.group({
      username: ['', [Validators.required]],
      name: ['', [Validators.required]],
      surname: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]],
      bio: ['']
    }, { validators: this.passwordMatchValidator });

    this.workerForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      score: ['', [Validators.required]],
      requests: ['', [Validators.required]],
      password: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.users$ = this.loadUsers();
    this.workers$ = this.loadWorkers();
  }

  ngOnInit(): void {
    // Additional initialization if needed
  }

  passwordMatchValidator(g: FormGroup) {
    return g.get('password')?.value === g.get('confirmPassword')?.value ? null : { notSame: true };
  }

  isFieldInvalid(fieldName: string, form: FormGroup): boolean {
    const control = form.get(fieldName);
    return control?.invalid && (control?.touched || control?.dirty) ? true : false;
  }

  async onUserSubmit() {
    if (this.userForm.invalid) {
      return;
    }

    const { username, name, surname, email, password, bio } = this.userForm.value;

    try {
      const userQuery = query(collection(this.firestore, 'users'), where('username', '==', username));
      const querySnapshot = await getDocs(userQuery);

      if (!querySnapshot.empty) {
        this.userForm.get('username')?.setErrors({ usernameTaken: true });
        this.snackBar.open('Username already taken. Please choose another one.', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
        return;
      }

      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      const userRef = doc(this.firestore, `users/${user.uid}`);
      await setDoc(userRef, { username, name, surname, email, bio });

      this.snackBar.open('User added successfully!', 'Close', { duration: 5000, panelClass: ['success-snackbar'] });
      this.userForm.reset();
    } catch (error) {
      console.error('Error adding user:', error);
      this.snackBar.open('Error adding user. Please try again.', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
    }
  }

  async onWorkerSubmit() {
    if (this.workerForm.invalid) {
      return;
    }

    const { name, email, score, requests, password } = this.workerForm.value;

    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;

      const workerRef = doc(this.firestore, `workers/${user.uid}`);
      await setDoc(workerRef, { name, email, score: Number(score), requests: Number(requests) });

      this.snackBar.open('Worker added successfully!', 'Close', { duration: 5000, panelClass: ['success-snackbar'] });
      this.workerForm.reset();
    } catch (error) {
      console.error('Error adding worker:', error);
      this.snackBar.open('Error adding worker. Please try again.', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
    }
  }

  async deleteUser(userId: string) {
    try {
      await deleteDoc(doc(this.firestore, `users/${userId}`));
      this.snackBar.open('User deleted successfully!', 'Close', { duration: 5000, panelClass: ['success-snackbar'] });
    } catch (error) {
      console.error('Error deleting user:', error);
      this.snackBar.open('Error deleting user. Please try again.', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
    }
  }

  async deleteWorker(workerId: string) {
    try {
      await deleteDoc(doc(this.firestore, `workers/${workerId}`));
      this.snackBar.open('Worker deleted successfully!', 'Close', { duration: 5000, panelClass: ['success-snackbar'] });
    } catch (error) {
      console.error('Error deleting worker:', error);
      this.snackBar.open('Error deleting worker. Please try again.', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
    }
  }

  loadUsers(): Observable<any[]> {
    const usersCollection = collection(this.firestore, 'users');
    return from(getDocs(usersCollection)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );
  }

  loadWorkers(): Observable<any[]> {
    const workersCollection = collection(this.firestore, 'workers');
    return from(getDocs(workersCollection)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );
  }

  selectUser(user: any) {
    this.selectedUser = user;
    this.userForm.patchValue({
      username: user.username,
      name: user.name,
      surname: user.surname,
      email: user.email,
      bio: user.bio
    });
  }

  selectWorker(worker: any) {
    this.selectedWorker = worker;
    this.workerForm.patchValue({
      name: worker.name,
      email: worker.email,
      score: worker.score,
      requests: worker.requests
    });
  }

  async updateUser() {
    if (this.userForm.invalid || !this.selectedUser) {
      return;
    }

    const { username, name, surname, email, bio } = this.userForm.value;

    try {
      const userRef = doc(this.firestore, `users/${email}`);
      await setDoc(userRef, { username, name, surname, email, bio });

      this.snackBar.open('User updated successfully!', 'Close', { duration: 5000, panelClass: ['success-snackbar'] });
    } catch (error) {
      console.error('Error updating user:', error);
      this.snackBar.open('Error updating user. Please try again.', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
    }
  }

  async updateWorker() {
    if (this.workerForm.invalid || !this.selectedWorker) {
      return;
    }

    const { name, email, score, requests } = this.workerForm.value;

    try {
      const workerRef = doc(this.firestore, `workers/${email}`);
      await setDoc(workerRef, { name, email, score: Number(score), requests: Number(requests) });

      this.snackBar.open('Worker updated successfully!', 'Close', { duration: 5000, panelClass: ['success-snackbar'] });
    } catch (error) {
      console.error('Error updating worker:', error);
      this.snackBar.open('Error updating worker. Please try again.', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
    }
  }
}
