import { Injectable, inject } from '@angular/core';
import { Firestore, collection, collectionData, addDoc, doc, updateDoc, deleteDoc, query, where } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Task } from '../models/task.model';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private firestore = inject(Firestore);
  private tasksCollection = collection(this.firestore, 'tasks');

  getTasks(userId: string): Observable<Task[]> {
    const userTasksQuery = query(this.tasksCollection, where('userId', '==', userId));
    return collectionData(userTasksQuery, { idField: 'id' }) as Observable<Task[]>;
  }

  addTask(taskTitle: string, userId: string) {
    const newTask: Task = {
      userId: userId,
      title: taskTitle,
      status: 'pending',
      createdAt: Date.now()
    };
    return addDoc(this.tasksCollection, newTask);
  }

  markAsCompleted(taskId: string) {
    const taskDocRef = doc(this.firestore, `tasks/${taskId}`);
    return updateDoc(taskDocRef, {
      status: 'completed',
      completedAt: Date.now()
    });
  }

  updateTask(taskId: string, title: string) {
    const taskDocRef = doc(this.firestore, `tasks/${taskId}`);
    return updateDoc(taskDocRef, { title });
  }

  deleteTask(taskId: string) {
    const taskDocRef = doc(this.firestore, `tasks/${taskId}`);
    return deleteDoc(taskDocRef);
  }
}