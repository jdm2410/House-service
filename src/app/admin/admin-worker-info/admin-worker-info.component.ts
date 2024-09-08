import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Firestore, doc, docData, setDoc, collection, getDocs, query, where, updateDoc, deleteDoc } from '@angular/fire/firestore';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Observable, of } from 'rxjs';
import { ServiceService } from '../../shared/services/service.service';
import { Service } from '../../shared/services/interfaces/service.interface';
import { addDoc } from 'firebase/firestore';
import { Request } from '../../shared/services/interfaces/request.interface';

@Component({
  selector: 'app-admin-worker-info',
  templateUrl: './admin-worker-info.component.html',
  styleUrls: ['./admin-worker-info.component.css']
})
export class AdminWorkerInfoComponent implements OnInit {
  workerId: string | null = null;
  worker$: Observable<any> | null = null; // Observable for worker data

  requests: Request[] = [];
  acceptedRequests: Request[] = [];
  confirmedRequests: Request[] = [];
  historyRequests: Request[] = [];
  hasAcceptedRequests: boolean = false;
  hasConfirmedRequests: boolean = false;
  hasDeniedRequests: boolean = false;

  services: Service[] = [];
  editingServiceId: string | null = null; // Ensure the type matches
  showEditForm: boolean = false;
  showRequests: boolean = false;

  workerForm: FormGroup;
  serviceForm: FormGroup;

  constructor(
    private firestore: Firestore,
    private snackBar: MatSnackBar,
    private route: ActivatedRoute, // To get the worker ID from the URL
    private fb: FormBuilder // For building forms
  ) {
    this.workerForm = this.fb.group({
      name: ['', Validators.required],
      surname: [''],
      email: ['', [Validators.required, Validators.email]]
    });

    this.serviceForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      category: [''],
      startTime: [''],
      endTime: [''],
      cost: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.workerId = this.route.snapshot.paramMap.get('id') ?? null; // Default to null if undefined¸
    console.log(this.workerId);
    if (this.workerId) {
      this.loadWorker(); // Load worker data
      this.loadRequests(); // Load requests related to the worker
      this.loadServices(); // Load services related to the worker
    }
  }

  // Load worker data as an observable
  loadWorker() {
    if (!this.workerId) return;
    const workerRef = doc(this.firestore, `workers/${this.workerId}`);
    this.worker$ = docData(workerRef); // Observable for worker data
  }

  // Load requests and categorize them
  async loadRequests() {
    if (!this.workerId) return;

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

  // Load services related to the worker
  async loadServices() {
    if (!this.workerId) return;

    const servicesRef = collection(this.firestore, 'services');
    const q = query(servicesRef, where('workerId', '==', this.workerId));
    const querySnapshot = await getDocs(q);

    this.services = querySnapshot.docs.map(doc => {
      const serviceData = doc.data() as Service;
      return {
        id: doc.id,
        ...serviceData
      };
    });
  }

  // Toggle the edit form visibility
  toggleEditForm() {
    this.showEditForm = !this.showEditForm;
  }

  // Update worker information
  async updateWorker() {
    if (!this.workerId) return;

    const workerRef = doc(this.firestore, `workers/${this.workerId}`);
    const updatedData = this.workerForm.value;
    await updateDoc(workerRef, updatedData);
    
    this.snackBar.open('Worker information updated successfully', 'Close', {
      duration: 2000
    });
    
    this.toggleEditForm();
  }

  // Add or update service
  async onSubmit() {
    if (!this.workerId) return;

    if (this.editingServiceId) {
      // Update service
      const serviceRef = doc(this.firestore, `services/${this.editingServiceId}`);
      const updatedService = this.serviceForm.value;
      await updateDoc(serviceRef, updatedService);
      this.snackBar.open('Service updated successfully', 'Close', {
        duration: 2000
      });
    } else {
      // Add new service
      const newService = this.serviceForm.value;
      await addDoc(collection(this.firestore, 'services'), { ...newService, workerId: this.workerId });
      this.snackBar.open('Service added successfully', 'Close', {
        duration: 2000
      });
    }

    this.serviceForm.reset();
    this.editingServiceId = null;
    this.loadServices(); // Reload services after adding/updating
  }

  // Start editing a service
  editService(service: Service) {
    this.editingServiceId = service.id ?? null; 
    this.serviceForm.setValue({
      name: service.name ?? '',
      description: service.description ?? '',
      category: service.category ?? '',
      startTime: service.startTime ?? '',
      endTime: service.endTime ?? '',
      cost: service.cost ?? ''
    });
  }

  // Cancel editing a service
  cancelEdit() {
    this.editingServiceId = null;
    this.serviceForm.reset();
  }

  // Delete a service
  async deleteService(serviceId: string) {
    if (!this.workerId) return;

    const serviceRef = doc(this.firestore, `services/${serviceId}`);
    await deleteDoc(serviceRef);
    this.snackBar.open('Service deleted successfully', 'Close', {
      duration: 2000
    });
    this.loadServices(); // Reload services after deleting
  }

  // Toggle the visibility of the requests section
  toggleRequestsSection() {
    this.showRequests = !this.showRequests;
  }

  // View request details
  viewRequestDetails(request: Request) {
    // Implement viewing details logic or open a dialog/modal here
    console.log('Viewing details for request:', request);
  }
}

