import { Component, OnInit, Input } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { DocumentReference } from '@angular/fire/firestore';
import { ServiceService } from '../shared/services/service.service';
import { Service } from '../shared/services/interfaces/service.interface';
import flatpickr from 'flatpickr';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-service-form',
  templateUrl: './service-form.component.html',
})
export class ServiceFormComponent implements OnInit {
  @Input() service?: Service;
  serviceForm: FormGroup;
  isEditMode: boolean = false;

  constructor(
    private fb: FormBuilder,
    private serviceService: ServiceService,
    private auth: Auth,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.serviceForm = this.fb.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      category: ['', Validators.required],
      startTime: ['', Validators.required],  // Start time field
      endTime: ['', Validators.required],    // End time field
      cost: ['', [Validators.required, Validators.min(0)]],
    });
  }

  ngOnInit(): void {
/*     flatpickr('#startTime', {
      enableTime: true,
      noCalendar: true,
      dateFormat: 'H:i',
      time_24hr: true
    });
    flatpickr('#endTime', {
      enableTime: true,
      noCalendar: true,
      dateFormat: 'H:i',
      time_24hr: true
    }); */
    if (this.service) {
      this.isEditMode = true;
      this.serviceForm.patchValue(this.service);
    }
  }

  async onSubmit() {
    const user = await this.auth.currentUser;
    if (user) {
      const serviceData: Service = {
        ...this.serviceForm.value,
        userId: user.uid,
      };

      if (this.isEditMode && this.service?.id) {
        await this.serviceService.updateService(this.service.id, serviceData);
        this.router.navigate(['/profile-user']);
      } else {
        const serviceRef: DocumentReference = await this.serviceService.createService(serviceData);
        this.snackBar.open('Service created successfully!', 'Close', {
          duration: 5000,
          panelClass: ['success-snackbar'] // Optional: Custom styling
        });
        this.router.navigate(['/profile-worker']);
      }
    }
  }
}
