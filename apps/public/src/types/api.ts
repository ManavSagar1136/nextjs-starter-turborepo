export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface ContactFormRequest {
  firstName: string;
  lastName: string;
  contactNumber: string;
  email: string;
  message: string;
  subject: string;
}

export interface NewsletterSubscribeRequest {
  email: string;
  html?: {
    thankYouHTML?: string;
    infoHTML?: string;
  };
}

export interface NewsletterUnsubscribeRequest {
  email?: string;
  token?: string;
}
