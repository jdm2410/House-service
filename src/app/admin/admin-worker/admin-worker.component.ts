import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Firestore, doc, setDoc, deleteDoc, collection, getDocs } from '@angular/fire/firestore';
import { Auth, createUserWithEmailAndPassword } from '@angular/fire/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-admin-worker',
  templateUrl: './admin-worker.component.html',
  styleUrls: ['./admin-worker.component.css']
})
export class AdminWorkerComponent implements OnInit {
  workerForm: FormGroup;
  workers$: Observable<any[]>;
  selectedWorker: any;
  isEditMode = false; // Track if we are in edit mode

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private firestore: Firestore,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.workerForm = this.fb.group({
      username: ['', [Validators.required]],
      name: ['', [Validators.required]],
      surname: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      score: ['', [Validators.required, Validators.pattern('^[0-9]$')]], // Validates that the input is a single digit
      requests: ['', [Validators.required, Validators.pattern('^[0-9]$')]],
      password: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    this.workers$ = this.loadWorkers();
  }

  ngOnInit(): void {}

  // Custom password match validator
  passwordMatchValidator(g: FormGroup) {
    const password = g.get('password')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { notSame: true };
  }

  // Handle form submission to create a new worker
  async onWorkerSubmit() {
    if (this.workerForm.invalid) {
      return;
    }
  
    const { username, name,surname , email, score, requests, password } = this.workerForm.value;
  
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);
      const user = userCredential.user;
  
      // Set rating to null if not provided
      const workerData = {
        username,
        name,
        surname,
        email,
        score: Number(score) || "", // Ensure score is a number or an empty string
        requests: Number(requests) || 0, // Ensure requests is a number
        rating: null, // Default to null
      };
  
      const workerRef = doc(this.firestore, `workers/${user.uid}`);
      await setDoc(workerRef, workerData);
  
      this.snackBar.open('Worker added successfully!', 'Close', { duration: 5000, panelClass: ['success-snackbar'] });
      this.workerForm.reset();
      this.isEditMode = false; // Reset edit mode after adding a new worker
      this.workers$ = this.loadWorkers(); // Refresh the worker list
    } catch (error) {
      console.error('Error adding worker:', error);
      this.snackBar.open('Error adding worker. Please try again.', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
    }
  }
  

  // Load workers from Firestore
  loadWorkers(): Observable<any[]> {
    const workersCollection = collection(this.firestore, 'workers');
    return from(getDocs(workersCollection)).pipe(
      map(snapshot => snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    );
  }

  // Select a worker to edit and populate the form with their data
  selectWorker(worker: any) {
    this.router.navigate(['/admin/worker-info', worker.id]);
/*     this.isEditMode = true; // Set the form to edit mode
    this.selectedWorker = worker;
    this.workerForm.patchValue({
      username: worker.username,
      name: worker.name,
      email: worker.email,
      score: worker.score,
      requests: worker.requests
    }); */

    // Disable the email field since we don't want to update the email in this form
    this.workerForm.get('email')?.disable();
  }

  // Handle updating a worker
  async updateWorker() {
    const { username, name, score, requests } = this.workerForm.value;

    try {
      const workerRef = doc(this.firestore, `workers/${this.selectedWorker.id}`);
      await setDoc(workerRef, {
        username,
        name,
        email: this.selectedWorker.email, // Email remains unchanged
        score: Number(score),
        requests: Number(requests)
      });

      this.snackBar.open('Worker updated successfully!', 'Close', { duration: 5000, panelClass: ['success-snackbar'] });
      this.isEditMode = false; // Reset form state after updating
      this.workerForm.reset();
      this.selectedWorker = null;
      this.workers$ = this.loadWorkers(); // Refresh the worker list
    } catch (error) {
      console.error('Error updating worker:', error);
      this.snackBar.open('Error updating worker. Please try again.', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
    }
  }

  // Handle deleting a worker
  async deleteWorker(workerId: string) {
    try {
      await deleteDoc(doc(this.firestore, `workers/${workerId}`));
      this.snackBar.open('Worker deleted successfully!', 'Close', { duration: 5000, panelClass: ['success-snackbar'] });
      this.workers$ = this.loadWorkers(); // Refresh the worker list
    } catch (error) {
      console.error('Error deleting worker:', error);
      this.snackBar.open('Error deleting worker. Please try again.', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
    }
  }

  // Reset the form and exit edit mode
  cancelEdit() {
    this.isEditMode = false;
    this.selectedWorker = null;
    this.workerForm.reset();
    this.workerForm.get('email')?.enable(); // Enable email input when exiting edit mode
  }
}
