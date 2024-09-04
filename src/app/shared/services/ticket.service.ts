import { Ticket } from './interfaces/ticket.interface';
import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, doc, updateDoc, deleteDoc, query, where, collectionData, DocumentReference } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { getDocs } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private ticketsCollection = collection(this.firestore, 'tickets');

  constructor(private firestore: Firestore, private auth: Auth) {}

  // Return Promise<DocumentReference> for createTicket
  createTicket(ticket: Ticket): Promise<DocumentReference> {
    return addDoc(this.ticketsCollection, ticket);
  }

  getTicketsByUser(userId: string): Observable<Ticket[]> {
    const userTicketsQuery = query(this.ticketsCollection, where('userId', '==', userId));
    return collectionData(userTicketsQuery, { idField: 'id' }) as Observable<Ticket[]>;
  }

  updateTicket(id: string, ticket: Ticket): Promise<void> {
    const ticketDocRef = doc(this.firestore, `tickets/${id}`);
    return updateDoc(ticketDocRef, { ...ticket });
  }

  deleteTicket(id: string): Promise<void> {
    const ticketDocRef = doc(this.firestore, `tickets/${id}`);
    return deleteDoc(ticketDocRef);
  }

  async getTickets(): Promise<Ticket[]> {
    const ticketsRef = collection(this.firestore, 'tickets');
    const querySnapshot = await getDocs(ticketsRef);
    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data['title'],
        description: data['description'],
        category: data['category'],
        startDate: data['startDate'],
        endDate: data['endDate'] // Ensure this is stored as a string or formatted date
      } as Ticket;
    });
  }
}
