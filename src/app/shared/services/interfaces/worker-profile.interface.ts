export interface WorkerProfile {
    username?: string;
    name?: string;
    surname?: string;
    userType?: string;
    bio?: string;
    rating?: number | null;
    requests?: number;
    profilePicture?: string | null; // Allow 'null' if profilePicture might be intentionally not set
  }
  