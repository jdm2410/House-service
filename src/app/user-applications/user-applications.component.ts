import { Component, OnInit } from '@angular/core';
import { Firestore, collection, query, where, getDocs, doc, updateDoc, deleteDoc, addDoc } from '@angular/fire/firestore';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { getDoc } from 'firebase/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-user-applications',
  templateUrl: './user-applications.component.html',
  styleUrls: ['./user-applications.component.css']
})
export class UserApplicationsComponent implements OnInit {
  tickets: any[] = [];
  userId: string | null = null;

  constructor(private firestore: Firestore, private auth: Auth, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.userId = user.uid;
        this.loadTickets();
      }
    });
  }

  async loadTickets() {
    if (!this.userId) return;
  
    // Fetch tickets for the user
    const ticketQuery = query(collection(this.firestore, 'tickets'), where('userId', '==', this.userId));
    const ticketSnapshot = await getDocs(ticketQuery);
  
    // Fetch applications for each ticket
    this.tickets = await Promise.all(ticketSnapshot.docs.map(async (ticketDoc) => {
      const ticketData = ticketDoc.data();
      const applicationsQuery = query(
        collection(this.firestore, 'ticketApplications'),
        where('ticketId', '==', ticketDoc.id)
      );
      const applicationsSnapshot = await getDocs(applicationsQuery);
  
      // Fetch worker names
      const applications = await Promise.all(applicationsSnapshot.docs.map(async appDoc => {
        const appData = appDoc.data();
        const workerName = await this.getWorkerName(appData['workerId']);
        return {
          id: appDoc.id,
          userName: appData['userName'],
          userId: appData['userId'],
          workerId: appData['workerId'],
          workerName: workerName,
          requestText: appData['requestText'],
          cost: appData['cost'],
          startTime: appData['startTime'],
          endTime: appData['endTime'],
          startDate: appData['startDate'],
          endDate: appData['endDate'],
          category: appData['cateogry'],
          ticketName: appData['ticketName'],
          status: appData['status']
        };
      }));
  
      return {
        id: ticketDoc.id,
        name: ticketData['name'],
        description: ticketData['description'],
        startDate: ticketData['startDate'],
        endDate: ticketData['endDate'],
        applications: applications
      };
    }));
  }
  

  async acceptApplication(ticketId: string, application: any) {
    try {
      // Move the application to the "requests" collection
      const request = {
        userName: application.userName,
        serviceName: application.ticketName,
        serviceId: ticketId,
        workerId: application.workerId,
        workerName: application.workerName,
        userId: this.userId,
        requestText: application.requestText,
        startDate: application.startDate,
        endDate: application.endDate,
        startTime: application.startTime,
        endTime: application.endTime,
        status: 'Accepted'
      };

      // Add the request to the "requests" collection
      await addDoc(collection(this.firestore, 'requests'), request);

      this.snackBar.open('Application accepted!', 'Close', {
        duration: 5000,
        panelClass: ['success-snackbar'] // Optional: Custom styling
      });

      // Update the ticket to remove the other applications
      await this.removeApplicationsFromTicket(ticketId, application.workerId);

      // Remove the ticket itself
      await deleteDoc(doc(this.firestore, 'tickets', ticketId));

      // Remove from local list to update UI
      this.tickets = this.tickets.filter(ticket => ticket.id !== ticketId);
    } catch (error) {
      console.error('Error accepting application: ', error);
    }
  }

  async denyApplication(ticketId: string, application: any) {
    try {
      // Remove the denied application
      await deleteDoc(doc(this.firestore, 'ticketApplications', application.id));

      // Update local list
      this.snackBar.open('Application denied!', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar'] // Optional: Custom styling
      });
      this.tickets = this.tickets.filter(app => app.id !== application.id);
    } catch (error) {
      console.error('Error accepting application: ', error);
    }
    this.loadTickets();
  }

  private async removeApplicationsFromTicket(ticketId: string, acceptedWorkerId: string) {
    // Remove all other applications for this ticket
    const q = query(
      collection(this.firestore, 'ticketApplications'),
      where('ticketId', '==', ticketId),
      where('workerId', '!=', acceptedWorkerId)
    );

    const querySnapshot = await getDocs(q);
    await Promise.all(querySnapshot.docs.map(doc => deleteDoc(doc.ref)));
  }

  async getWorkerName(workerId: string): Promise<string> {
    try {
      const workerDoc = await getDoc(doc(this.firestore, 'workers', workerId));
      if (workerDoc.exists()) {
        const workerData = workerDoc.data() as { username?: string }; // Type assertion
        return workerData.username || 'Unknown'; // Adjust based on your data structure
      } else {
        console.error('No such worker!');
        return 'Unknown';
      }
    } catch (error) {
      console.error('Error fetching worker details: ', error);
      return 'Unknown';
    }
  }
  
  
  
  
}
