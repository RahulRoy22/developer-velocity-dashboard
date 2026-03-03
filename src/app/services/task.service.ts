import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, doc, updateDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Task } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  // Inject Firestore directly (Angular 14+ style)
  private firestore: Firestore = inject(Firestore);
  
  // Reference to the 'tasks' collection in your database
  private tasksCollection = collection(this.firestore, 'tasks');

  constructor() {}

  /**
   * 1. GET ALL TASKS (Real-time stream)
   * The { idField: 'id' } grabs the hidden Firestore document ID 
   * and attaches it to your Task object.
   */
  getTasks(): Observable<Task[]> {
    return collectionData(this.tasksCollection, { idField: 'id' }) as Observable<Task[]>;
  }

  /**
   * 2. ADD A NEW TASK
   */
  addTask(taskTitle: string) {
    const newTask: Task = {
      title: taskTitle,
      status: 'pending',
      createdAt: Date.now()
    };
    return addDoc(this.tasksCollection, newTask);
  }

  /**
   * 3. MARK TASK AS COMPLETED
   * We need the ID to know which document to update.
   */
  markAsCompleted(taskId: string) {
    const taskDocRef = doc(this.firestore, `tasks/${taskId}`);
    return updateDoc(taskDocRef, {
      status: 'completed',
      completedAt: Date.now()
    });
  }
}