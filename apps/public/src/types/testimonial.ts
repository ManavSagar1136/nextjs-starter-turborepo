export interface ITestimonial {
  id: number;
  author: {
    name: string;
    username: string;
    avatar: string;
    verified: boolean;
    role?: string;
  };
  content: string;
  date: string;
  metrics: {
    likes: number;
    replies: number;
  };
}
