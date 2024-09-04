import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Firestore, doc, docData, updateDoc, collection, query, where, getDocs, deleteDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { UserProfile } from '../../shared/services/interfaces/user-profile.interface';
import { Ticket } from '../../shared/services/interfaces/ticket.interface'; // Import the Ticket interface
import { addDoc, getDoc } from 'firebase/firestore';
import { Request } from '../../shared/services/interfaces/request.interface';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-profile-user',
  templateUrl: './profile-user.component.html',
  styleUrls: ['./profile-user.component.css']
})
export class ProfileUserComponent implements OnInit {
  profileForm: FormGroup;
  user: UserProfile = {};
  isEditingBio = false;
  userId: string | null = null;
  tickets: Ticket[] = [];
  selectedTicket: Ticket | null = null;
  confirmedRequests: any[] = [];
  deniedRequests: any[] = [];
  isConfirmationVisible = false;
  confirmationText = '';
  selectedRequest: any | null = null;
  isRatingModalVisible = false;
  ratingForm: FormGroup;
  requests: Request[]  = [];
  showTickets: boolean = false;
  showConfirmedRequests: boolean = false;
  showDeniedRequests: boolean = false;
  showHistoryOfRequests: boolean = false;
  isRequestDetailModalVisible: boolean = false;

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
    this.ratingForm = this.fb.group({
      description: [''],
      rating: [null, [Validators.required, Validators.min(1), Validators.max(5)]]
    });
  }

  ngOnInit(): void {
    this.auth.onAuthStateChanged(user => {
      if (user) {
        this.userId = user.uid;
        this.loadUserData();
        this.loadUserTickets();
        this.loadConfirmedRequests();
        this.loadDeniedRequests();
        this.loadRequests();
      } else {
        console.error('No user is logged in.');
      }
    });
  }

  toggleSection(section: string) {
    switch (section) {
      case 'tickets':
        this.showTickets = !this.showTickets;
        break;
      case 'confirmedRequests':
        this.showConfirmedRequests = !this.showConfirmedRequests;
        break;
      case 'deniedRequests':
        this.showDeniedRequests = !this.showDeniedRequests;
        break;
      case 'historyOfRequests':
        this.showHistoryOfRequests = !this.showHistoryOfRequests;
        break;
    }
  }

  loadUserData() {
    if (!this.userId) return;

    const userRef = doc(this.firestore, `users/${this.userId}`);
    docData<UserProfile>(userRef).subscribe(
      (data: UserProfile) => {
        this.user = data || {};
        this.profileForm.patchValue({
          bio: this.user['bio']
        });
      },
      (error: any) => {
        console.error('Error fetching user data:', error);
      }
    );
  }

  async loadUserTickets() {
    if (!this.userId) return;

    const ticketsRef = collection(this.firestore, 'tickets');
    const q = query(ticketsRef, where('userId', '==', this.userId));
    const querySnapshot = await getDocs(q);

    this.tickets = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Ticket)
    }));
  }

  async loadConfirmedRequests() {
    if (!this.userId) return;

    const confirmedRequestsRef = collection(this.firestore, 'confirmedRequests');
    const q = query(confirmedRequestsRef, where('userId', '==', this.userId));
    const querySnapshot = await getDocs(q);

    this.confirmedRequests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data()['createdAt'].toDate() 
    }));
    console.log(this.confirmedRequests);
  }

  async loadDeniedRequests() {
    if (!this.userId) return;

    const deniedRequestsRef = collection(this.firestore, 'deniedRequests');
    const q = query(deniedRequestsRef, where('userID', '==', this.userId));
    const querySnapshot = await getDocs(q);

    this.deniedRequests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log(this.deniedRequests)
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.uploadProfilePicture(file);
    }
  }

  async uploadProfilePicture(file: File) {
    if (!this.userId) return;

    const fileRef = ref(this.storage, `profilePictures/${this.userId}/${file.name}`);
    await uploadBytes(fileRef, file);
    const photoURL = await getDownloadURL(fileRef);

    const userRef = doc(this.firestore, `users/${this.userId}`);
    await updateDoc(userRef, { profilePicture: photoURL });
    this.loadUserData();
  }

  toggleEdit() {
    if (this.isEditingBio) {
      const bio = this.profileForm.get('bio')?.value;
      const userRef = doc(this.firestore, `users/${this.userId}`);
      updateDoc(userRef, { bio }).then(() => {
        this.user['bio'] = bio;
      }).catch(error => console.error('Error updating bio:', error));
      this.snackBar.open('Profile info updated!', 'Close', {
        duration: 5000,
        panelClass: ['success-snackbar'] // Optional: Custom styling
      });
    }

    this.isEditingBio = !this.isEditingBio;
  }

  openTicketDetail(ticket: Ticket) {
    this.selectedTicket = ticket;
  }

  closeTicketDetail() {
    this.selectedTicket = null;
  }

  async updateTicket() {
    if (this.selectedTicket) {
      const ticketRef = doc(this.firestore, `tickets/${this.selectedTicket.id}`);
      await updateDoc(ticketRef, {
        name: this.selectedTicket.name,
        description: this.selectedTicket.description,
        startDate: this.selectedTicket.startDate,
        endDate: this.selectedTicket.endDate
      });
      this.snackBar.open('Ticket updated!', 'Close', {
        duration: 5000,
        panelClass: ['success-snackbar'] // Optional: Custom styling
      });
      this.closeTicketDetail();
      this.loadUserTickets();
    }
  }

  async deleteTicket(ticketId: string) {
    const ticketRef = doc(this.firestore, `tickets/${ticketId}`);
    this.snackBar.open('Ticket deleted!', 'Close', {
      duration: 5000,
      panelClass: ['success-snackbar'] // Optional: Custom styling
    });
    await deleteDoc(ticketRef);
    this.closeTicketDetail();
    this.loadUserTickets();
  }

  openConfirmationModal() {
    this.isConfirmationVisible = true;
  }

  closeConfirmationModal() {
    this.isConfirmationVisible = false;
    this.confirmationText = '';
  }

  async confirmDeletion() {
    if (this.confirmationText === 'DELETE' && this.userId) {
        try {
            const userRef = doc(this.firestore, `users/${this.userId}`);
            await deleteDoc(userRef);

            // Delete associated data
            await this.deleteUserTickets();
            await this.deleteUserConfirmedRequests();
            await this.deleteUserDeniedRequests();

            // Delete user from Firebase Authentication
            const user = this.auth.currentUser;
            if (user) {
                await user.delete();
            }

            // Show confirmation snackbar
            this.snackBar.open('Account deleted!', 'Close', {
                duration: 5000,
                panelClass: ['error-snackbar'] // Optional: Custom styling
            });

            // Navigate to the login page
            this.router.navigate(['/login']);
        } catch (error) {
            console.error("Error deleting user: ", error);
            this.snackBar.open('Failed to delete account. Please try again later.', 'Close', {
                duration: 5000,
                panelClass: ['error-snackbar']
            });
        } finally {
            this.closeConfirmationModal();
        }
    } else {
        this.closeConfirmationModal();
    }
}


  async deleteUserTickets() {
    if (!this.userId) return;
    const ticketsRef = collection(this.firestore, 'tickets');
    const q = query(ticketsRef, where('userId', '==', this.userId));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });
  }

  async deleteUserConfirmedRequests() {
    if (!this.userId) return;
    const confirmedRequestsRef = collection(this.firestore, 'confirmedRequests');
    const q = query(confirmedRequestsRef, where('userId', '==', this.userId));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });
  }

  async deleteUserDeniedRequests() {
    if (!this.userId) return;
    const deniedRequestsRef = collection(this.firestore, 'deniedRequests');
    const q = query(deniedRequestsRef, where('userID', '==', this.userId));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(async (doc) => {
      await deleteDoc(doc.ref);
    });
  }

  
  async loadRequests() {
    if (!this.userId) return;

  
    const requestsRef = collection(this.firestore, 'requests');
    const q = query(requestsRef, where('userId', '==', this.userId));
    const querySnapshot = await getDocs(q);
  
  
    this.requests = querySnapshot.docs.map(doc => {
      const requestData = doc.data() as Request;
      const request = {
        id: doc.id,
        ...requestData
      };
  
    
      
  
      return request;
    });
  }

  openRequestDetail(request: Request) {
    this.selectedRequest = request;
    this.isRequestDetailModalVisible = true;
  }

  closeRequestDetail() {
    this.selectedRequest = null;
    this.isRequestDetailModalVisible = false;
  }


  async deleteUserDeniedRequest(requestId: string) {
    if (!this.userId) return;
  
    try {
      const deniedRequestsRef = collection(this.firestore, 'deniedRequests');
      const q = query(deniedRequestsRef, where('userID', '==', this.userId), where('__name__', '==', requestId));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        console.log('No matching request found to delete.');
        return;
      }
  
      // There should be only one document, but we loop just in case
      querySnapshot.forEach(async (doc) => {
        await deleteDoc(doc.ref);
        console.log(`Deleted denied request with ID: ${doc.id}`);
      });
  
      // Optionally remove the deleted request from the local state to update the UI
      this.deniedRequests = this.deniedRequests.filter(request => request.id !== requestId);
      this.snackBar.open('Denied request deleted!', 'Close', {
        duration: 5000,
        panelClass: ['success-snackbar'] // Optional: Custom styling
      });
    } catch (error) {
      console.error('Error deleting denied request:', error);
    }
  }
  

  openRatingModal(request: any) {
    this.selectedRequest = request;
    this.isRatingModalVisible = true;
  }

  closeRatingModal() {
    this.isRatingModalVisible = false;
    this.selectedRequest = null;
    this.ratingForm.reset();
  }

  async submitRating(): Promise<void> {
    if (this.ratingForm.invalid || !this.selectedRequest) {
      return;
    }
    console.log(this.selectedRequest);
    const { description, rating } = this.ratingForm.value;
    const newRating = {
      userId : this.selectedRequest.userId,
      userName: this.selectedRequest.userName,
      workerId : this.selectedRequest.workerId,
      description,
      requestStatus:'done',
      rating: Number(rating), // Convert rating to number if necessary
      requestId: this.selectedRequest.id, // Add request ID for reference
      timestamp: new Date() // Add timestamp for when the rating was submitted
    };
    try {
      // Reference to the collection where ratings are stored
      const ratingsCollection = collection(this.firestore, 'workersRatedRequests');
      // Add a new document with a generated ID
      await addDoc(ratingsCollection, newRating);
      console.log('Rating submitted successfully');

      this.snackBar.open('Request rated!', 'Close', {
        duration: 5000,
        panelClass: ['success-snackbar'] // Optional: Custom styling
      });

      const requestDocsRef = doc(this.firestore, `requests/${this.selectedRequest.requestId}`);
      await updateDoc(requestDocsRef, { status: 'rated' });
      console.log('Request status updated to "rated" successfully');
      
      // Delete the confirmed request
      const requestDocRef = doc(this.firestore, `confirmedRequests/${this.selectedRequest.id}`);
      await deleteDoc(requestDocRef);
      console.log('Confirmed request deleted successfully');
      
    } catch (error) {
      console.error('Error submitting rating:', error);
    }

  
    this.loadDeniedRequests();
    this.loadConfirmedRequests();
    this.closeRatingModal();

  }
}
