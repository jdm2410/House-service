import { Injectable } from '@angular/core';
import { Firestore, doc, docData, updateDoc, collection, query, where, getDocs, deleteDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadBytes, getDownloadURL } from '@angular/fire/storage';
import { Auth } from '@angular/fire/auth';
import { Observable, from } from 'rxjs';
import { UserProfile } from './interfaces/user-profile.interface';
import { Ticket } from './interfaces/ticket.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(
    private firestore: Firestore,
    private storage: Storage,
    private auth: Auth
  ) {}

  getUserProfile(userId: string): Observable<UserProfile> {
    const userRef = doc(this.firestore, `users/${userId}`);
    return docData<UserProfile>(userRef);
  }

  updateUserProfile(userId: string, profileData: Partial<UserProfile>): Promise<void> {
    const userRef = doc(this.firestore, `users/${userId}`);
    return updateDoc(userRef, profileData);
  }

  uploadProfilePicture(userId: string, file: File): Promise<string> {
    const storageRef = ref(this.storage, `profile_pictures/${userId}/${file.name}`);
    return uploadBytes(storageRef, file).then(() => getDownloadURL(storageRef));
  }

  getUserTickets(userId: string): Promise<Ticket[]> {
    const ticketsRef = collection(this.firestore, 'tickets');
    const q = query(ticketsRef, where('userId', '==', userId));
    return getDocs(q).then(querySnapshot => 
      querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as Ticket }))
    );
  }

  deleteUser(userId: string): Promise<void> {
    const userRef = doc(this.firestore, `users/${userId}`);
    return deleteDoc(userRef);
  }

  deleteUserTickets(userId: string): Promise<void[]> {
    const ticketsRef = collection(this.firestore, 'tickets');
    const q = query(ticketsRef, where('userId', '==', userId));
    return getDocs(q).then(querySnapshot => 
      Promise.all(querySnapshot.docs.map(doc => deleteDoc(doc.ref)))
    );
  }

  deleteAccount(): Promise<void> {
    return this.auth.currentUser?.delete() ?? Promise.reject('No current user');
  }
}
