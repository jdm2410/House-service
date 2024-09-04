import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Firestore, doc, docData, updateDoc, collection, query, where, getDocs, deleteDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { Service } from '../../shared/services/interfaces/service.interface'; 
import { WorkerProfile } from '../../shared/services/interfaces/worker-profile.interface';
import { Request } from '../../shared/services/interfaces/request.interface'; // Import the Request interface
import { addDoc, Timestamp } from 'firebase/firestore';
import { DeniedRequest } from '../../shared/services/interfaces/denied-request.interface';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile-worker',
  templateUrl: './profile-worker.component.html',
  styleUrls: ['./profile-worker.component.css']
})
export class ProfileWorkerComponent implements OnInit {
  profileForm: FormGroup;
  worker: WorkerProfile = {};
  isEditingBio = false;
  workerId: string | null = null;
  services: Service[] = [];
  selectedService: Service | null = null;
  requests: Request[] = []; // Array to hold requests
  acceptedRequests: Request[] = []; // Array to hold requests
  confirmedRequests: Request[] = []; // Array to hold requests
  historyRequests: Request[] = []; // Array to hold requests
  selectedRequest: Request | null = null;
  isConfirmationVisible = false;
  confirmationText = '';
  denialReason = '';
  hasAcceptedRequests: boolean = false;
  hasConfirmedRequests: boolean = false;
  hasDeniedRequests: boolean = false;

  showServices: boolean = false;
  showConfirmedRequests: boolean = false;
  showRequests: boolean = false;
  showHistoryOfRequests: boolean = false;

  constructor(
    private fb: FormBuilder,
    private firestore: Firestore,
    private storage: Storage,
    private auth: Auth,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      bio: [''],
      profilePicture: [null]
    });
  }

  ngOnInit(): void {
    this.auth.onAuthStateChanged(user => {
      if (user) {
        this.workerId = user.uid;
        this.loadWorkerData();
        this.loadWorkerServices();
        this.loadRequests(); // Load requests related to the worker
      } else {
        console.error('No user is logged in.');
      }
    });
  }

  toggleSection(section: string) {
    switch (section) {
      case 'services':
        this.showServices = !this.showServices;
        break;
      case 'confirmedRequests':
        this.showConfirmedRequests = !this.showConfirmedRequests;
        break;
      case 'requests':
        this.showRequests = !this.showRequests;
        break;
      case 'historyOfRequests':
        this.showHistoryOfRequests = !this.showHistoryOfRequests;
        break;
    }
  }

  loadWorkerData() {
    if (!this.workerId) return;

    const workerRef = doc(this.firestore, `workers/${this.workerId}`);
    docData<WorkerProfile>(workerRef).subscribe(
      async (data: WorkerProfile) => {
        this.worker = data || {};
        this.profileForm.patchValue({
          bio: this.worker.bio || ''
        });

        // Calculate the average rating from related requests
        await this.calculateAverageRating();
      },
      (error: any) => {
        console.error('Error fetching worker data:', error);
      }
    );
  }

  async calculateAverageRating() {
    if (!this.workerId) return;
  
    // Reference to the collection where rated requests are stored
    const requestsRef = collection(this.firestore, 'workersRatedRequests');
    
    // Query to get requests associated with the worker that are marked as 'done'
    const q = query(requestsRef, where('workerId', '==', this.workerId), where('requestStatus', '==', 'done'));
    const querySnapshot = await getDocs(q);
  
    let totalRating = 0;
    let ratingCount = 0;
  
    querySnapshot.forEach(doc => {
      const data = doc.data();
      if (data['rating']) {
        totalRating += data['rating'];
        ratingCount += 1;
      }
    });
  
    // Calculate the average rating
    const averageRating = ratingCount > 0 ? (totalRating / ratingCount) : null;
  
    // Prepare the updated worker data with the new rating information
    const updatedWorkerData: Partial<WorkerProfile> = {
      rating: averageRating,
      requests: ratingCount // Store the count of rated requests
    };
  
    // Reference to the worker document in Firestore
    const workerRef = doc(this.firestore, `workers/${this.workerId}`);
  
    // Update the worker profile with the calculated average rating and request count
    try {
      await updateDoc(workerRef, updatedWorkerData);
    } catch (error) {
      console.error('Error updating worker profile:', error);
    }
  
    // Update local worker object with the new data
    this.worker.rating = averageRating;
    this.worker.requests = ratingCount;
  }
  

  async onSubmit() {
    if (!this.workerId) return;

    if (this.profileForm.valid) {
      const { bio, profilePicture } = this.profileForm.value;
      const workerRef = doc(this.firestore, `workers/${this.workerId}`);

      try {
        let profilePictureUrl: string | undefined;

        if (profilePicture) {
          const storageRef = ref(this.storage, `profile_pictures/${this.workerId}/${profilePicture.name}`);
          await uploadBytes(storageRef, profilePicture);
          profilePictureUrl = await getDownloadURL(storageRef);
          this.snackBar.open('Profile picture updated!', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar'] // Optional: Custom styling
          });
        }

        const updateData: Partial<WorkerProfile> = { bio };
        if (profilePictureUrl) {
          updateData.profilePicture = profilePictureUrl;
        }

        await updateDoc(workerRef, updateData);
        console.log('Profile updated successfully');
        this.snackBar.open('Profile updated!', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar'] // Optional: Custom styling
        });
        this.isEditingBio = false;
      } catch (error: any) {
        console.error('Error updating profile:', error);
      }
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.profileForm.patchValue({
        profilePicture: input.files[0]
      });
    }
  }

  toggleEdit() {
    if (this.isEditingBio) {
      this.onSubmit();
    } else {
      this.profileForm.patchValue({
        bio: this.worker.bio || ''
      });
    }
    this.isEditingBio = !this.isEditingBio;
  }

  async loadWorkerServices() {
    if (!this.workerId) return;

    const servicesRef = collection(this.firestore, 'services');
    const q = query(servicesRef, where('userId', '==', this.workerId));
    const querySnapshot = await getDocs(q);

    this.services = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Service)
    }));
  }

  async loadRequests() {
    if (!this.workerId) return;

    this.acceptedRequests = [];
    this.confirmedRequests = [];
    this.historyRequests  = []; 
  
    const requestsRef = collection(this.firestore, 'requests');
    const q = query(requestsRef, where('workerId', '==', this.workerId));
    const querySnapshot = await getDocs(q);
  
  
    this.requests = querySnapshot.docs.map(doc => {
      const requestData = doc.data() as Request;
      const request = {
        id: doc.id,
        ...requestData
      };
  
      // Categorize the requests based on their status
      switch (request.status) {
        case 'Accepted':
          this.acceptedRequests.push(request);
          break;
        case 'denied':
          this.historyRequests.push(request);
          break;
        case 'rated':
          this.historyRequests.push(request);
          break;
        case 'confirmed':
          this.confirmedRequests.push(request);
          break;
      }
  
      return request;
    });
  
    // Set the boolean properties based on the categorized requests
    this.hasAcceptedRequests = this.acceptedRequests.length > 0;
    this.hasDeniedRequests = this.historyRequests.length > 0;
    this.hasConfirmedRequests = this.confirmedRequests.length > 0;
  }

  openServiceDetail(service: Service) {
    this.selectedService = service;
  }

  closeServiceDetail() {
    this.selectedService = null;
  }

  async updateService() {
    if (!this.selectedService) return;

    const serviceRef = doc(this.firestore, `services/${this.selectedService.id}`);
    try {
      await updateDoc(serviceRef, {
        name: this.selectedService.name,
        description: this.selectedService.description,
        endTime: this.selectedService.endTime,
        startTime: this.selectedService.startTime,
        cost: this.selectedService.cost
      });
      this.snackBar.open('Service updated!', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'] // Optional: Custom styling
      });
      this.closeServiceDetail();
    } catch (error: any) {
      console.error('Error updating service:', error);
    }
  }

  async deleteService(serviceId: string) {
    const serviceRef = doc(this.firestore, `services/${serviceId}`);
    try {
      await deleteDoc(serviceRef);
      this.services = this.services.filter(service => service.id !== serviceId);
      this.snackBar.open('Service deleted!', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'] // Optional: Custom styling
      });
      this.closeServiceDetail();
    } catch (error: any) {
      console.error('Error deleting service:', error);
    }
  }

  openRequestDetail(request: Request) {
    this.selectedRequest = request;
  }

  closeRequestDetail() {
    this.selectedRequest = null;
  }

  async updateRequest() {
    if (!this.selectedRequest) return;

    const requestRef = doc(this.firestore, `requests/${this.selectedRequest.id}`);
    try {
      await updateDoc(requestRef, {
        requestText: this.selectedRequest.requestText,
        status: this.selectedRequest.status
        // Update other fields if needed
      });
      this.snackBar.open('Request updated!', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'] // Optional: Custom styling
      });
      this.closeRequestDetail();
    } catch (error: any) {
      console.error('Error updating request:', error);
    }
  }

  async deleteRequest(requestId: string) {
    const requestRef = doc(this.firestore, `requests/${requestId}`);
    try {
      await deleteDoc(requestRef);
      this.requests = this.requests.filter(request => request.id !== requestId);
      this.snackBar.open('Request deleted!', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'] // Optional: Custom styling
      });
      this.closeRequestDetail();
    } catch (error: any) {
      console.error('Error deleting request:', error);
    }
  }

  openConfirmationModal() {
    this.isConfirmationVisible = true;
  }

  closeConfirmationModal() {
    this.isConfirmationVisible = false;
    this.confirmationText = '';
  }

  async confirmDeletion() {
    if (this.confirmationText === 'DELETE') {
      await this.deleteWorkerAccount();
    } else {
      console.error('Confirmation text does not match');
    }
  }

  async deleteWorkerAccount() {
    if (!this.workerId) return;

    try {
        // Delete worker document from Firestore
        const workerRef = doc(this.firestore, `workers/${this.workerId}`);
        await deleteDoc(workerRef);

        // Delete all related services where userId matches workerId
        const servicesRef = collection(this.firestore, 'services');
        const servicesQuery = query(servicesRef, where('userId', '==', this.workerId));
        const servicesSnapshot = await getDocs(servicesQuery);
        const deleteServicePromises = servicesSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deleteServicePromises);

        // Delete all related requests where workerId matches workerId
        const requestsRef = collection(this.firestore, 'requests');
        const requestsQuery = query(requestsRef, where('workerId', '==', this.workerId));
        const requestsSnapshot = await getDocs(requestsQuery);
        const deleteRequestPromises = requestsSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deleteRequestPromises);

        // Delete the user's authentication account
        const user = this.auth.currentUser;
        if (user) {
            await user.delete();
            console.log('Account deleted successfully');
        }

        // Sign out the user and show confirmation message
        await this.auth.signOut();
        this.snackBar.open('Account deleted!', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar'] // Optional: Custom styling
        });

        // Navigate to the login page
        this.router.navigate(['/login']);
    } catch (error) {
        console.error('Error deleting account:', error);
        this.snackBar.open('Failed to delete account. Please try again later.', 'Close', {
            duration: 5000,
            panelClass: ['error-snackbar']
        });
    } finally {
        this.closeConfirmationModal();
    }
}

  async acceptRequest(request: Request) {
    if (!this.workerId) return;

    // Update the request status to 'confirmed'
    const requestRef = doc(this.firestore, `requests/${request.id}`);
    try {
      await updateDoc(requestRef, { status: 'confirmed' });

      // Create a new confirmation document for the user to provide feedback or grade
      const confirmedRequestsRef = collection(this.firestore, `confirmedRequests`);
      await addDoc(confirmedRequestsRef, {
        userName: request.userName,
        requestName: request.serviceName,
        requestWorker: request.workerName,
        requestId: request.id,
        workerId: this.workerId,
        userId: request.userId,
        status: 'pendingConfirmation', // Status to track the confirmation process
        createdAt: new Date(),
      });

      this.snackBar.open('Request accepted!', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'] // Optional: Custom styling
      });
      this.closeRequestDetail();
      this.loadRequests();
    } catch (error: any) {
      console.error('Error accepting request:', error);
    }
  }

  async denyRequest(request: Request) {
    if (!this.workerId) return;
  
    // Prompt for a denial reason if not already set
    if (!this.denialReason) {
      this.denialReason = prompt('Please provide a reason for denying this request:') || '';
    }
  
    if (!this.denialReason) {
      console.error('Denial reason is required');
      return;
    }
  
    // References to Firestore collections
    const requestRef = doc(this.firestore, `requests/${request.id}`);
    const deniedRequestsRef = collection(this.firestore, 'deniedRequests');
  
    try {
      // Create a new document in the deniedRequests collection
      const deniedRequest: DeniedRequest = {
        requestId: request.id,
        serviceName: request.serviceName,
        userName: request.userName,
        requestText: request.requestText,
        startDate: request.startDate,
        endDate: request.endDate,
        userID: request.userId,
        workerName: request.workerName,
        denialReason: this.denialReason,
        deniedAt: Timestamp.now().toDate().toISOString() // Record the current timestamp
      };
  
      await addDoc(deniedRequestsRef, deniedRequest);
  
      // Update the original request document to reflect denial
      await updateDoc(requestRef, { 
        status: 'denied'
      });
  
      this.snackBar.open('Request denied!', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'] // Optional: Custom styling
      });
      this.closeRequestDetail();
      this.loadRequests();
    } catch (error: any) {
      console.error('Error denying request:', error);
    }
  }
}
