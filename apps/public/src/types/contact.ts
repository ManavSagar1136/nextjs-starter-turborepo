export interface ContactFormData {
  firstName: string;
  lastName: string;
  email: string;
  contactNumber?: string;
  message: string;
}

export interface ContactFormResponse {
  success: boolean;
  message: string;
}
