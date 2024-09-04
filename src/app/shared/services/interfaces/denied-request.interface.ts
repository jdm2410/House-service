export interface DeniedRequest {
    userID?: string;
    workerName?: string;
    requestId?: string;
    serviceName?: string;
    userName?: string;
    requestText?: string;
    startDate?: string;
    endDate?: string;
    denialReason?: string;
    deniedAt: string; // Timestamp of when the request was denied
  }
  