import { Component, computed, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TaskService } from '../../services/task.service';
import { AuthService } from '../../services/auth.service';
import { Task } from '../../models/task.model';
import { Subscription, switchMap } from 'rxjs';

export type TaskTag = 'devops' | 'backend' | 'testing' | 'frontend';

export const TAG_COLORS: Record<TaskTag, { bg: string; text: string; border: string }> = {
  devops:   { bg: '#1a2a1a', text: '#4ade80', border: '#166534' },
  backend:  { bg: '#1a1a2e', text: '#818cf8', border: '#3730a3' },
  testing:  { bg: '#2a1a1a', text: '#fb923c', border: '#9a3412' },
  frontend: { bg: '#1a2530', text: '#38bdf8', border: '#0369a1' },
};

@Component({
  selector: 'app-velocity-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class VelocityDashboardComponent implements OnInit, OnDestroy {
  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private router = inject(Router);
  
  tasks = signal<Task[]>([]);
  currentUser$ = this.authService.currentUser$;
  private tasksSubscription?: Subscription;
  private currentUserId?: string;

  newTaskTitle = '';
  selectedTag: TaskTag = 'backend';
  editingTaskId: string | null = null;
  editingTitle = '';
  editingTag: TaskTag = 'backend';
  readonly tagOptions: TaskTag[] = ['devops', 'backend', 'testing', 'frontend'];
  readonly tagColors = TAG_COLORS;

  readonly weekData   = [3, 5, 2, 8, 6, 4, 7];
  readonly weekDays   = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  readonly maxWeekVal = Math.max(...[3, 5, 2, 8, 6, 4, 7]);

  // --- computed stats ---
  total     = computed(() => this.tasks().length);
  completed = computed(() => this.tasks().filter(t => t.status === 'completed').length);
  pending   = computed(() => this.tasks().filter(t => t.status === 'pending').length);
  rate      = computed(() =>
    Math.round((this.completed() / Math.max(this.total(), 1)) * 100)
  );

  stats = computed(() => [
    { label: 'Total',    value: String(this.total()),     icon: '◈', color: '#a78bfa' },
    { label: 'Shipped',  value: String(this.completed()), icon: '◉', color: '#4ade80' },
    { label: 'In Flight',value: String(this.pending()),   icon: '◎', color: '#fb923c' },
    { label: 'Velocity', value: `${this.rate()}%`,        icon: '▲', color: '#38bdf8' },
  ]);

  // --- sparkline SVG path ---
  sparklinePoints = computed(() => {
    const data = [40, 55, 48, 62, 58, 71, this.rate()];
    const max  = Math.max(...data);
    const w = 200, h = 50;
    return data.map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - (v / max) * (h - 8) - 4;
      return `${x},${y}`;
    }).join(' ');
  });

  sparklineDots = computed(() => {
    const data = [40, 55, 48, 62, 58, 71, this.rate()];
    const max  = Math.max(...data);
    const w = 200, h = 50;
    return data.map((v, i) => ({
      cx: (i / (data.length - 1)) * w,
      cy: h - (v / max) * (h - 8) - 4,
    }));
  });

  ngOnInit() {
    this.tasksSubscription = this.currentUser$.pipe(
      switchMap(user => {
        if (user) {
          this.currentUserId = user.uid;
          return this.taskService.getTasks(user.uid);
        }
        return [];
      })
    ).subscribe(tasks => {
      this.tasks.set(tasks);
    });
  }

  ngOnDestroy() {
    this.tasksSubscription?.unsubscribe();
  }

  async addTask(): Promise<void> {
    if (!this.newTaskTitle.trim() || !this.currentUserId) return;
    await this.taskService.addTask(this.newTaskTitle.trim(), this.currentUserId);
    this.newTaskTitle = '';
  }

  async completeTask(id: string): Promise<void> {
    await this.taskService.markAsCompleted(id);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  barHeight(v: number): string {
    return `${(v / this.maxWeekVal) * 100}%`;
  }

  trackById(_: number, task: Task) { return task.id; }
}
