export interface Task {
  id?: string; 
  userId: string; // <-- Add this new required property
  title: string;
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: number; 
  completedAt?: number; 
}