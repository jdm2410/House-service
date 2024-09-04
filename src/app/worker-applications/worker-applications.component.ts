import { Component, OnInit } from '@angular/core';
import { Firestore, collection, query, where, getDocs, doc, updateDoc, deleteDoc, addDoc } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { ProfileWorkerComponent } from '../profiles/profile-worker/profile-worker.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-worker-applications',
  templateUrl: './worker-applications.component.html',
  styleUrls: ['./worker-applications.component.css']
})
export class WorkerApplicationsComponent implements OnInit {
  applications: any[] = [];
  userId: string | null = null;

  constructor(private firestore: Firestore, private auth: Auth, private loadReq: ProfileWorkerComponent, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.userId = user.uid;
        this.loadApplications();
      }
    });
  }

  async loadApplications() {
    if (!this.userId) return;

    const q = query(
      collection(this.firestore, 'serviceApplications'),
      where('workerId', '==', this.userId),
      where('status', '==', 'Pending')
    );

    const querySnapshot = await getDocs(q);
    this.applications = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        serviceId: data['serviceId'],
        serviceName: data['serviceName'],
        requestText: data['requestText'],
        userId: data['userId'],
        category: data['category'],
        userName: data['userName'],
        startDate: data['startDate'],
        endDate: data['endDate'],
        startTime: data['startTime'],
        endTime: data['endTime'],
        status: data['status']
      };
    });
  }

  async acceptApplication(application: any) {
    try {
      // Move the application to the "requests" collection
      const request = {
        serviceName: application.serviceName,
        serviceId: application.serviceId,
        workerId: this.userId,
        workerName: this.auth.currentUser?.displayName,
        category: application.category,
        userId: application.userId,
        userName: application.userName,
        requestText: application.requestText,
        startDate: application.startDate,
        endDate: application.endDate,
        startTime: application.startTime,
        endTime: application.endTime,
        status: 'Accepted'
      };

      console.log('Request data before sending to Firestore:', request);
      // Add the request to the "requests" collection
      await addDoc(collection(this.firestore, 'requests'), request);

      // Remove the application from the "serviceApplications" collection
      await deleteDoc(doc(this.firestore, 'serviceApplications', application.id));

      // Remove from local list to update UI
      this.snackBar.open('Application accepted!', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'] // Optional: Custom styling
      });
      this.applications = this.applications.filter(app => app.id !== application.id);
    } catch (error) {
      console.error('Error accepting application: ', error);
    }
    this.loadReq.loadRequests();
  }

  async denyApplication(application: any) {
    try {
      // Delete the application from the "serviceApplications" collection
      await deleteDoc(doc(this.firestore, 'serviceApplications', application.id));

      // Remove from local list to update UI
      this.snackBar.open('Application denied!', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'] // Optional: Custom styling
      });
      this.applications = this.applications.filter(app => app.id !== application.id);
    } catch (error) {
      console.error('Error denying application: ', error);
    }
    this.loadReq.loadRequests();
  }
  
}
