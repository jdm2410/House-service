export interface UserProfile {
    username?: string;
    name?: string;
    surname?: string;
    userType?: string;
    bio?: string;
    profilePicture?: string | null; // Allow 'null' if profilePicture might be intentionally not set
  }
  