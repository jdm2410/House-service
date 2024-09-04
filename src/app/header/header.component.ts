import { Component, OnInit } from '@angular/core';
import { Auth, signOut, User, onAuthStateChanged } from '@angular/fire/auth';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { BehaviorSubject, of } from 'rxjs';
import {  catchError, switchMap} from 'rxjs/operators';
import { UserProfile } from '../shared/services/interfaces/user-profile.interface';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {
  user$ = new BehaviorSubject<UserProfile | null>(null);
  userType: string | undefined;
  isLoading = true; // Add loading state

  constructor(
    private auth: Auth,
    private firestore: Firestore,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Listen for authentication state changes
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.fetchUserProfile(user.uid);
      } else {
        this.user$.next(null);
        this.isLoading = false; // Set loading to false if no user
      }
    });
  }

  fetchUserProfile(userId: string) {
    this.isLoading = true; // Start loading
  
    // Reference to the users collection
    let userRef = doc(this.firestore, `users/${userId}`);
  
    // Check the users collection first
    docData<UserProfile>(userRef).pipe(
      switchMap((userProfile: UserProfile | undefined) => {
        if (userProfile) {
          this.user$.next(userProfile);
          this.userType = 'user'; // Mark as user
          return of(userProfile); // Return the user profile to complete the observable chain
        } else {
          // If not found, check the workers collection
          userRef = doc(this.firestore, `workers/${userId}`);
          return docData<UserProfile>(userRef).pipe(
            switchMap((workerProfile: UserProfile | undefined) => {
              if (workerProfile) {
                this.user$.next(workerProfile);
                this.userType = 'worker'; // Mark as worker
                return of(workerProfile); // Return the worker profile
              } else {
                this.user$.next(null);
                return of(null); // Return null if not found in either collection
              }
            })
          );
        }
      }),
      catchError((error) => {
        console.error('Error fetching user profile:', error);
        this.user$.next(null);
        return of(null); // Handle the error and return null
      })
    ).subscribe(() => {
      this.isLoading = false; // Ensure loading is stopped after the process is done
    });
  }

  logout(): void {
    signOut(this.auth).then(() => {
      console.log('User logged out');
      window.location.href = '/login';
      this.snackBar.open('Logging out!', 'Close', {
        duration: 5000,
        panelClass: ['success-snackbar'] // Optional: Custom styling
      });
    }).catch(error => {
      console.error('Logout error:', error);
    });
  }
}
