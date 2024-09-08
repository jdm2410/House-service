import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidationErrors } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TicketService } from '../../shared/services/ticket.service';
import { endDateValidator, startDateValidator } from '../../ticket-form/date-validators';
import { collection, doc, docData, Firestore, getDocs, query, where, deleteDoc, setDoc } from '@angular/fire/firestore';
import { Ticket } from '../../shared/services/interfaces/ticket.interface';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { Request } from '../../shared/services/interfaces/request.interface';

@Component({
  selector: 'app-admin-user-info',
  templateUrl: './admin-user-info.component.html',
  styleUrls: ['./admin-user-info.component.css']
})
export class AdminUserInfoComponent implements OnInit {
  userId: string | null = null;
  userName: string | null = null;
  user$: Observable<any> = new Observable();
  tickets: Ticket[] = [];
  requests: Request[] = [];
  ticketForm: FormGroup;
  userForm: FormGroup;
  editingTicketId: string | null = null;
  editingRequestId: string | null = null;
  isEditMode = false; // To track if we are in edit mode

  constructor(
    private route: ActivatedRoute,
    private firestore: Firestore,
    private fb: FormBuilder,
    private ticketService: TicketService,
    private auth: Auth,
    private snackBar: MatSnackBar
  ) {
    this.ticketForm = this.fb.group({
      name: ['', Validators.required],
      category: ['', Validators.required],
      description: ['', Validators.required],
      startDate: ['', [Validators.required, startDateValidator()]],
      endDate: ['', [Validators.required]]
    }, { validator: this.dateValidator });

    this.userForm = this.fb.group({
      username: ['', Validators.required],
      name: ['', Validators.required],
      surname: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      bio: ['']
    });
  }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('id');
    this.userName = this.route.snapshot.paramMap.get('username');
    if (this.userId) {
      this.loadUser();
      this.loadUserTickets();
      this.loadUserRequests();
    }
  }

  loadUser() {
    const userRef = doc(this.firestore, `users/${this.userId}`);
    this.user$ = docData(userRef);
    this.isEditMode = false;
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

  async loadUserRequests() {
    if (!this.userId) return;

    const requestsRef = collection(this.firestore, 'requests');
    const q = query(requestsRef, where('userId', '==', this.userId));
    const querySnapshot = await getDocs(q);

    this.requests = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...(doc.data() as Request)
    }));

    // You can also categorize requests similar to how you did with worker requests if needed
  }

  dateValidator(formGroup: FormGroup): ValidationErrors | null {
    const startDateCtrl = formGroup.get('startDate');
    const endDateCtrl = formGroup.get('endDate');

    if (!startDateCtrl || !endDateCtrl) return null;

    const startDateValue = startDateCtrl.value;
    const endDateValue = endDateCtrl.value;

    const startDateError = startDateValidator()(startDateCtrl);
    const endDateError = endDateValidator(startDateCtrl)(endDateCtrl);

    const errors = { ...startDateError, ...endDateError };

    return Object.keys(errors).length ? errors : null;
  }

  async onSubmit() {
    if (this.userId) {
      const ticketData: Ticket = {
        ...this.ticketForm.value,
        userId: this.userId,
        userName: this.userName,
      };

      if (this.editingTicketId) {
        // Update existing ticket
        await this.ticketService.updateTicket(this.editingTicketId, ticketData);
        this.snackBar.open('Ticket updated successfully!', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
      } else {
        // Create new ticket
        await this.ticketService.createTicket(ticketData);
        this.snackBar.open('Ticket created successfully!', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
      }

      this.loadUserTickets(); // Refresh the list of tickets
      this.cancelEdit(); // Reset form and cancel edit mode
    }
  }

  async deleteTicket(ticketId: string | undefined) {
    if (!ticketId) {
      this.snackBar.open('Invalid ticket ID', 'Close', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
      return;
    }
  
    if (this.userId) {
      try {
        await this.ticketService.deleteTicket(ticketId);
        this.snackBar.open('Ticket deleted successfully!', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar']
        });
        this.loadUserTickets(); // Refresh the list of tickets
      } catch (error) {
        console.error('Error deleting ticket:', error);
        this.snackBar.open('Failed to delete ticket', 'Close', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      }
    }
  }

  editTicket(ticket: Ticket) {
    this.editingTicketId = ticket.id ?? null;
    this.ticketForm.setValue({
      name: ticket.name,
      category: ticket.category,
      description: ticket.description,
      startDate: ticket.startDate,
      endDate: ticket.endDate,
    });
  }

  cancelEdit() {
    this.editingTicketId = null;
    this.ticketForm.reset();
  }

  async updateUser() {
    if (this.userId && this.userForm.valid) {
      const { username, name, surname, bio } = this.userForm.value;
      try {
        const userRef = doc(this.firestore, `users/${this.userId}`);
        await setDoc(userRef, { username, name, surname, email: this.userForm.get('email')?.value, bio });
        this.snackBar.open('User updated successfully!', 'Close', { duration: 5000, panelClass: ['success-snackbar'] });
        this.isEditMode = false;
        this.userForm.reset();
        this.loadUser(); // Refresh the user data
      } catch (error) {
        console.error('Error updating user:', error);
        this.snackBar.open('Error updating user. Please try again.', 'Close', { duration: 5000, panelClass: ['error-snackbar'] });
      }
    }
  }

  // Add logic to set the form to edit mode
  editUser() {
    this.isEditMode = true;
    this.user$.subscribe(user => {
      if (user) {
        this.userForm.patchValue({
          username: user.username,
          name: user.name,
          surname: user.surname,
          email: user.email,
          bio: user.bio
        });
      }
    });
  }

}
