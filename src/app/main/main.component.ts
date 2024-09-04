import { Component, OnInit } from '@angular/core';
import { Firestore, collection, getDocs, doc, getDoc, addDoc } from '@angular/fire/firestore';
import { Ticket } from '../shared/services/interfaces/ticket.interface';
import { Service } from '../shared/services/interfaces/service.interface';
import { UserProfile } from '../shared/services/interfaces/user-profile.interface';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { WorkerProfile } from '../shared/services/interfaces/worker-profile.interface';
import flatpickr from 'flatpickr';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent implements OnInit {
  isSidebarOpen = false;
  tickets: Ticket[] = [];
  services: Service[] = [];
  filteredTickets: Ticket[] = [];
  filteredServices: Service[] = [];
  categories: string[] = ['Kitchen', 'Bedroom', 'Garden']; // Populate categories as needed
  dateRange = { from: '', to: '' };
  selectedCategory = '';
  userProfiles: { [userId: string]: UserProfile } = {};
  userType: string | undefined;

  // Variables for the service application modal
  selectedService: Service | null = null;
  selectedWorker: WorkerProfile | null = null;
  requestText = '';
  startDate = '';
  endDate = '';
  todayDate = new Date().toISOString().split('T')[0]; // Today's date in YYYY-MM-DD format
  minEndDate = ''; // Minimum end date
  dateError: string | null = null; // Error message for invalid dates

  // Variables for the ticket application modal
  selectedTicket: Ticket | null = null;
  selectedTicketUser: UserProfile | null = null;
  ticketRequestText = '';
  ticketRequestCost = '';
  ticketRequestStartTime = '';
  ticketRequestEndTime = '';

  constructor(private firestore: Firestore, private auth: Auth, private snackBar: MatSnackBar ) {}

  ngOnInit(): void {

    onAuthStateChanged(this.auth, (user) => {
      if (user) {
        this.fetchUserType(user.uid);
      }
    });
  }

  async fetchUserType(userId: string) {
    const userRef = doc(this.firestore, `users/${userId}`);
    const userDocSnap = await getDoc(userRef);

    if (userDocSnap.exists()) {
      this.userType = 'user';
      this.loadServices();
    } else {
      const workerRef = doc(this.firestore, `workers/${userId}`);
      const workerDocSnap = await getDoc(workerRef);

      if (workerDocSnap.exists()) {
        this.userType = 'worker';
        this.loadTickets();
      }
    }
  }

  async loadTickets() {
    try {
      const ticketsRef = collection(this.firestore, 'tickets');
      const querySnapshot = await getDocs(ticketsRef);

      const tickets: Ticket[] = [];
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        const ticket: Ticket = {
          id: docSnap.id,
          name: data['name'],
          userName: data['userName'],
          description: data['description'],
          category: data['category'],
          startDate: data['startDate'],
          endDate: data['endDate'],
          userId: data['userId'],
          status: data['status'],
          applications: data['applications'] || [],
          selectedWorker: data['selectedWorker'] || []
        };

        // Fetch user details for this ticket
        const userDocRef = doc(this.firestore, 'users', ticket.userId);
        const userDocSnap = await getDoc(userDocRef);
        const userData = userDocSnap.data();
        if (userData) {
          this.userProfiles[ticket.userId] = {
            profilePicture: userData['profilePicture'],
            username: userData['username']
          } as UserProfile;
        }

        tickets.push(ticket);
      }

      this.tickets = tickets;
      this.filterTickets(); // Apply initial filtering
    } catch (error) {
      console.error('Error loading tickets or user profiles: ', error);
    }
  }

  async loadServices() {
    try {
      const servicesRef = collection(this.firestore, 'services');
      const querySnapshot = await getDocs(servicesRef);

      const services: Service[] = [];
      for (const docSnap of querySnapshot.docs) {
        const data = docSnap.data();
        const service: Service = {
          id: docSnap.id,
          name: data['name'],
          description: data['description'],
          category: data['category'],
          startTime: data['startTime'],
          endTime: data['endTime'],
          userId: data['userId'],
          cost: data['cost']
        };

        // Fetch worker details for this service
        const workerDocRef = doc(this.firestore, 'workers', service.userId);
        const workerDocSnap = await getDoc(workerDocRef);
        const workerData = workerDocSnap.data();
        if (workerData) {
          this.userProfiles[service.userId] = {
            profilePicture: workerData['profilePicture'],
            username: workerData['username'],
            score: workerData['score'] || 0,
            requestsDone: workerData['requestsDone'] || 0
          } as UserProfile;
        }

        services.push(service);
      }

      this.services = services;
      this.filterServices(); // Apply initial filtering
    } catch (error) {
      console.error('Error loading services or worker profiles: ', error);
    }
  }

  filterTickets() {
    this.filteredTickets = this.tickets.filter(ticket => {
      const ticketDate = new Date(ticket.startDate);
      const fromDate = new Date(this.dateRange.from);
      const toDate = new Date(this.dateRange.to);

      return (!this.selectedCategory || ticket.category === this.selectedCategory) &&
             (!this.dateRange.from || ticketDate >= fromDate) &&
             (!this.dateRange.to || ticketDate <= toDate);
    });
  }

  filterServices() {
    this.filteredServices = this.services.filter(service => {
      return (!this.selectedCategory || service.category === this.selectedCategory);
    });
  }

  toggleSidebar() {
    this.isSidebarOpen = !this.isSidebarOpen;
  }

  // Handle applying for a ticket (worker view)
  applyForTicket(ticket: Ticket) {
    this.selectedTicket = ticket;

    // Fetch user information based on ticket.userId
    const userId = ticket.userId;
    const userRef = doc(this.firestore, `users/${userId}`);
    getDoc(userRef).then((docSnap) => {
      if (docSnap.exists()) {
        this.selectedTicketUser = docSnap.data() as UserProfile;
      }
    });
  }

  // Handle closing the ticket application form
  closeTicketApplyForm() {
    this.selectedTicket = null;
    this.ticketRequestText = '';
  }

  // Handle submitting the ticket application
  async applyForTicketRequest() {
    if (!this.selectedTicket) return;

    try {
      // Create a new application in Firestore (or update the ticket's applications)
      const application = {
        ticketId: this.selectedTicket.id,
        userId: this.selectedTicket.userId,
        userName: this.selectedTicket.userName,
        ticketName: this.selectedTicket.name,
        ticketDesc: this.selectedTicket.description,
        startDate: this.selectedTicket.startDate,
        endDate: this.selectedTicket.endDate,
        workerId: this.auth.currentUser?.uid,
        requestText: this.ticketRequestText,
        cost: this.ticketRequestCost,
        category: this.selectedTicket.category,
        startTime: this.ticketRequestStartTime,
        endTime: this.ticketRequestEndTime,
        status: 'Pending'
      };

      await addDoc(collection(this.firestore, 'ticketApplications'), application);
      this.snackBar.open('Application submitted successfully!', 'Close', {
        duration: 5000,
        panelClass: ['success-snackbar'] // Optional: Custom styling
      });
      this.closeTicketApplyForm(); // Close the form after submission
    } catch (error) {
      console.error('Error applying for ticket: ', error);
    }
  }

  // Handle applying for a service (user view)
  applyForService(service: Service) {
    this.selectedService = service;

    // Fetch worker information based on service.userId
    const workerId = service.userId;
    const workerRef = doc(this.firestore, `workers/${workerId}`);
    getDoc(workerRef).then((docSnap) => {
      if (docSnap.exists()) {
        this.selectedWorker = docSnap.data() as WorkerProfile;
      }
    });
  }

  // Handle closing the service application form
  closeApplyForm() {
    this.selectedService = null;
    this.selectedWorker = null;
    this.requestText = '';
    this.startDate = '';
    this.endDate = '';
    this.dateError = null;
  }

  // Handle submitting the service application
  async applyForServiceRequest() {
    if (!this.selectedService) return;

    if (this.dateError) {
      console.error('Dates are not valid.');
      return;
    }


    try {
      // Create a new application in Firestore (or update the service's applications)
      const application = {
        serviceName: this.selectedService.name,
        serviceId: this.selectedService.id,
        userId: this.auth.currentUser?.uid,
        userName: this.auth.currentUser?.displayName,
        workerId: this.selectedService.userId,
        startTime: this.selectedService.startTime,
        endTime: this.selectedService.endTime,
        category: this.selectedService.category,
        requestText: this.requestText,
        startDate: this.startDate,
        endDate: this.endDate,
        status: 'Pending'
      };

      await addDoc(collection(this.firestore, 'serviceApplications'), application);
      this.snackBar.open('Application submitted successfully!', 'Close', {
        duration: 5000,
        panelClass: ['success-snackbar'] // Optional: Custom styling
      });
      this.closeApplyForm(); // Close the form after submission
    } catch (error) {
      console.error('Error applying for service: ', error);
    }
  }

  onStartDateChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.startDate = input.value;

    if (new Date(this.startDate) < new Date(this.todayDate)) {
      this.dateError = 'Start date cannot be older than today.';
      this.minEndDate = this.todayDate;
    } else {
      this.dateError = null;
      this.minEndDate = this.getNextDay(this.startDate);
      this.validateEndDate();
    }
  }

  // Handle changes to end date
  onEndDateChange(event: Event) {
    const input = event.target as HTMLInputElement;
    this.endDate = input.value;
    this.validateEndDate();
  }

  // Validate end date
  validateEndDate() {
    if (this.startDate && this.endDate) {
      const start = new Date(this.startDate);
      const end = new Date(this.endDate);
      const minEnd = new Date(this.minEndDate);

      if (end <= start || end < minEnd) {
        this.dateError = 'End date must be at least one day after the start date.';
      } else {
        this.dateError = null;
      }
    }
  }

  // Get the next day date in YYYY-MM-DD format
  getNextDay(date: string): string {
    const dt = new Date(date);
    dt.setDate(dt.getDate() + 1);
    return dt.toISOString().split('T')[0];
  }

}
