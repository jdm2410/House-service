import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, isToday, isSameDay, isValid } from 'date-fns';
import { Firestore, collection, getDocs, query, where } from '@angular/fire/firestore';
import { Ticket } from '../shared/services/interfaces/ticket.interface';
import { Auth } from '@angular/fire/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { Request } from '../shared/services/interfaces/request.interface';

interface CalendarDay {
  day: number | null;
  isToday: boolean;
  isSelected: boolean;
  isInSelectedRange: boolean;
  date: Date | null;
}

interface PlaceholderDay {
  day: null;
  isToday: false;
  isSelected: false;
  isInSelectedRange: false;
  date: null;
}
type CalendarDayOrPlaceholder = CalendarDay | PlaceholderDay;


@Component({
  selector: 'app-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.css']
})
export class CalendarComponent implements OnInit {
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  currentMonth: number;
  currentYear: number;
  selectedDate: Date | null = null;
  calendarDays: CalendarDay[] = [];
  ticketsByDate: { [key: string]: Ticket[] } = {}; // Store tickets by date
  requestsByDate: { [key: string]: Request[] } = {}; // Store requests by date
  userId: string | null = null; // Store the current user ID

  constructor(private firestore: Firestore, private auth: Auth, private cdr: ChangeDetectorRef) { 
    const today = new Date();
    this.currentMonth = today.getMonth();
    this.currentYear = today.getFullYear();
  }

  ngOnInit(): void {
    // Listen to auth state changes to get the signed-in user's ID
    onAuthStateChanged(this.auth, user => {
      if (user) {
        this.userId = user.uid;
        this.generateCalendar();
        this.loadRequests(); // Load service requests for the current user
      }
    });
  }

  isDateInSelectedRange(date: Date): boolean {
    if (!this.selectedDate) return false;
  
    const selectedRequest = this.getTicketsOrRequestsForDate(this.selectedDate)
      .find(item => {
        if (!item.startDate || !item.endDate) return false;
        const startDate = new Date(item.startDate);
        const endDate = new Date(item.endDate);
        return startDate <= date && date <= endDate;
      });
  
    return !!selectedRequest;
  }
  

  generateCalendar() {
    const start = startOfMonth(new Date(this.currentYear, this.currentMonth));
    const end = endOfMonth(new Date(this.currentYear, this.currentMonth));
    const startWeekday = start.getDay();
    const endWeekday = end.getDay();
    
    let date = start;
    this.calendarDays = [];
  
    // Add placeholders for the days before the start of the month
    for (let i = 0; i < startWeekday; i++) {
      this.calendarDays.push({
        day: null,
        isToday: false,
        isSelected: false,
        isInSelectedRange: this.isDateInSelectedRange(date),
        date: null
      });
    }
  
    // Add the days of the current month
    while (date <= end) {
      this.calendarDays.push({
        day: date.getMonth() === this.currentMonth ? date.getDate() : null,
        isToday: isToday(date),
        isSelected: isSameDay(date, this.selectedDate || new Date()),
        isInSelectedRange: false,
        date: date.getMonth() === this.currentMonth ? date : null // Only assign dates within the current month
      });
      date = addDays(date, 1);
    }
    // Add placeholders for the days after the end of the month
    for (let i = endWeekday + 1; i < 7; i++) {
      this.calendarDays.push({
        day: null,
        isToday: false,
        isSelected: false,
        isInSelectedRange: false,
        date: null
      });
    }

    this.cdr.detectChanges(); 
  }
  
  
  

  previousMonth() {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateCalendar();
    this.loadRequests(); // Reload requests when changing month
  }

  nextMonth() {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateCalendar();
    this.loadRequests(); // Reload requests when changing month
  }

  selectRequest(request: Request) {
    const startDate = new Date(request.startDate);
    const endDate = new Date(request.endDate);
  
    this.calendarDays.forEach(calendarDay => {
      if (calendarDay.date) { // Type guard to ensure date is not null
        calendarDay.isInSelectedRange = calendarDay.date >= startDate && calendarDay.date <= endDate;
      } else {
        calendarDay.isInSelectedRange = false; // Ensure placeholder days are not in any range
      }
    });
  }
  

  selectDate(day: CalendarDay) {

    if (!day.date) return; // Skip placeholder days or invalid dates
  
    this.selectedDate = day.date;
    
    this.generateCalendar(); 
    // Reset isInSelectedRange for all days
    this.calendarDays.forEach(calendarDay => {
      calendarDay.isInSelectedRange = false;
    });
  
    // Ensure that day.date is not null before using it
    const selectedRequest = this.getTicketsOrRequestsForDate(day.date)
      .find(item => {
        if (!item.startDate || !day.date) {
          return false; // Skip if startDate or day.date is null
        }
        const requestStartDate = new Date(item.startDate);
        return format(requestStartDate, 'yyyy-MM-dd') === format(day.date, 'yyyy-MM-dd');
      });
  
  
    if (selectedRequest) {
      const startDate = new Date(selectedRequest.startDate);
      const endDate = new Date(selectedRequest.endDate);
  

      // Highlight days within the startDate and endDate range
      this.calendarDays.forEach(calendarDay => {
        if (calendarDay.date && startDate && endDate) {
          calendarDay.isInSelectedRange = startDate <= calendarDay.date && calendarDay.date <= endDate;
        }
      });

    }
  
    // Re-generate calendar to apply changes
  }
  

  
  

  async loadRequests() {
    if (!this.userId) return; // If no user is logged in, don't load requests
  
    const requestsRef = collection(this.firestore, 'requests');
    const userRequestsQuery = query(requestsRef, where('workerId', '==', this.userId)); // Filter by workerId
    const querySnapshot = await getDocs(userRequestsQuery);
    const requests: Request[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        serviceName: data['serviceName'],
        endTime: data['endTime'],
        startTime: data['startTime'],
        endDate: data['endDate'],
        startDate: data['startDate'],
        serviceId: data['serviceId'],
        requestText: data['requestText'],
        status: data['status'],
        userId: data['userId'],
        userName: data['userName'],
        workerId: data['workerId'],
        workerName: data['workerName'],
      } as Request;
    });
    // Organize requests by date
    this.requestsByDate = requests.reduce((acc, request) => {
      const startDate = new Date(request.startDate);
      
      if (!isValid(startDate)) {
        return acc;
      }
  
      const dateKey = format(startDate, 'yyyy-MM-dd');
      
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
  
      // Include only requests with 'accepted' status
      if (request.status === 'Accepted') {
        acc[dateKey].push(request);
      }
  
      return acc;
    }, {} as { [key: string]: Request[] });
    
  }

  async loadRequestsUser() {
    if (!this.userId) return; // If no user is logged in, don't load requests
  
    const requestsRef = collection(this.firestore, 'requests');
    const userRequestsQuery = query(requestsRef, where('userId', '==', this.userId)); // Filter by workerId
    const querySnapshot = await getDocs(userRequestsQuery);
    const requests: Request[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        serviceName: data['serviceName'],
        endTime: data['endTime'],
        startTime: data['startTime'],
        endDate: data['endDate'],
        startDate: data['startDate'],
        serviceId: data['serviceId'],
        requestText: data['requestText'],
        status: data['status'],
        userId: data['userId'],
        userName: data['userName'],
        workerId: data['workerId'],
        workerName: data['workerName'],
      } as Request;
    });
    // Organize requests by date
    this.requestsByDate = requests.reduce((acc, request) => {
      const startDate = new Date(request.startDate);
      
      if (!isValid(startDate)) {
        return acc;
      }
  
      const dateKey = format(startDate, 'yyyy-MM-dd');
      
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
  
      // Include only requests with 'accepted' status
      if (request.status === 'Accepted') {
        acc[dateKey].push(request);
      }
  
      return acc;
    }, {} as { [key: string]: Request[] });
    
  }

  hasTicketsOrRequests(date: Date): boolean {
    const dateKey = format(date, 'yyyy-MM-dd');
    return (this.ticketsByDate[dateKey] && this.ticketsByDate[dateKey].length > 0) || 
           (this.requestsByDate[dateKey] && this.requestsByDate[dateKey].length > 0);
  }

  getTicketsOrRequestsForDate(date: Date): any[] {
    const dateKey = format(date, 'yyyy-MM-dd');
    const items = [...(this.ticketsByDate[dateKey] || []), ...(this.requestsByDate[dateKey] || [])];
    // Ensure that all items have valid startDate and endDate
    return items.filter(item => item.startDate && item.endDate);
  }
  
  

  // Getter to format the selected date
  get formattedSelectedDate(): string {
    return this.selectedDate ? format(this.selectedDate, 'MMMM d, yyyy') : '';
  }
}
