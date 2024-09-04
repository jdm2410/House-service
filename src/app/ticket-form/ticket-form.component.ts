import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ValidationErrors } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { DocumentReference } from '@angular/fire/firestore';
import { TicketService } from '../shared/services/ticket.service';
import { Ticket } from '../shared/services/interfaces/ticket.interface';
import { endDateValidator, startDateValidator } from './date-validators';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-ticket-form',
  templateUrl: './ticket-form.component.html',
})
export class TicketFormComponent implements OnInit {
  @Input() ticket?: Ticket;
  ticketForm: FormGroup;
  isEditMode: boolean = false;

  constructor(
    private fb: FormBuilder,
    private ticketService: TicketService,
    private auth: Auth,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.ticketForm = this.fb.group({
      name: ['', Validators.required],
      category: ['', Validators.required],
      description: ['', Validators.required],
      startDate: ['', [Validators.required, startDateValidator()]],
      endDate: ['', [Validators.required]]
    }, { validator: this.dateValidator });
  }

  ngOnInit(): void {
    if (this.ticket) {
      this.isEditMode = true;
      this.ticketForm.patchValue(this.ticket);
    }
  }

  // Custom validation function for the form group
  dateValidator(formGroup: FormGroup): ValidationErrors | null {
    const startDateCtrl = formGroup.get('startDate');
    const endDateCtrl = formGroup.get('endDate');

    if (!startDateCtrl || !endDateCtrl) {
      return null;
    }

    const startDateValue = startDateCtrl.value;
    const endDateValue = endDateCtrl.value;

    // Apply validators directly to the controls
    const startDateError = startDateValidator()(startDateCtrl);
    const endDateError = endDateValidator(startDateCtrl)(endDateCtrl);

    // Collect errors
    const errors = {
      ...startDateError,
      ...endDateError
    };

    return Object.keys(errors).length ? errors : null;
  }
  
  async onSubmit() {
    const user = await this.auth.currentUser;
    if (user) {
      const ticketData: Ticket = {
        ...this.ticketForm.value,
        userId: user.uid,
        userName: user.displayName
      };

      if (this.isEditMode && this.ticket?.id) {
        await this.ticketService.updateTicket(this.ticket.id, ticketData);
        this.router.navigate(['/profile-user']);
      } else {
        const ticketRef: DocumentReference = await this.ticketService.createTicket(ticketData);
        this.snackBar.open('Ticket created successfully!', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar'] // Optional: Custom styling
        });
        this.router.navigate(['/profile-user']);
      }
    }
  }
}
