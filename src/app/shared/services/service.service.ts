import { Injectable } from '@angular/core';
import { Firestore, addDoc, collection, doc, updateDoc } from '@angular/fire/firestore';
import { Service } from './interfaces/service.interface';

@Injectable({
  providedIn: 'root'
})
export class ServiceService {

  constructor(private firestore: Firestore) {}

  createService(serviceData: Service) {
    const servicesCollection = collection(this.firestore, `services`);
    // Spread the serviceData into a plain object
    return addDoc(servicesCollection, { ...serviceData });
  }

  updateService(serviceId: string, serviceData: Service) {
    const serviceDoc = doc(this.firestore, `services/${serviceId}`);
    // Spread the serviceData into a plain object
    return updateDoc(serviceDoc, { ...serviceData });
  }
}
