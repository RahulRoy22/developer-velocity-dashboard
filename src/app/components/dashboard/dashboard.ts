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
  currentUser: any = null;

  newTaskTitle = '';
  selectedTag: TaskTag = 'backend';
  editingTaskId: string | null = null;
  editingTitle = '';
  editingTag: TaskTag = 'backend';
  readonly tagOptions: TaskTag[] = ['devops', 'backend', 'testing', 'frontend'];
  readonly tagColors = TAG_COLORS;

  readonly weekDays   = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  // Dynamic week and quarter display
  currentWeekQuarter = computed(() => {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    const quarter = Math.ceil((now.getMonth() + 1) / 3);
    return `WEEK ${weekNumber} · Q${quarter} ${now.getFullYear()}`;
  });

  // --- computed stats ---
  total     = computed(() => this.tasks().length);
  completed = computed(() => this.tasks().filter(t => t.status === 'completed').length);
  pending   = computed(() => this.tasks().filter(t => t.status === 'pending').length);
  rate      = computed(() =>
    Math.round((this.completed() / Math.max(this.total(), 1)) * 100)
  );

  // Dynamic weekly data based on user's completed tasks
  weekData = computed(() => {
    const completedTasks = this.tasks().filter(t => t.status === 'completed' && t.completedAt);
    const weeklyData = [0, 0, 0, 0, 0, 0, 0]; // M, T, W, T, F, S, S
    
    completedTasks.forEach(task => {
      const completedDate = new Date(task.completedAt!);
      const dayOfWeek = completedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const mappedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Map to our array (0 = Monday)
      weeklyData[mappedDay]++;
    });
    
    return weeklyData;
  });

  maxWeekVal = computed(() => Math.max(...this.weekData(), 1));

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

  // Dynamic completion trend calculation
  completionTrend = computed(() => {
    const data = [40, 55, 48, 62, 58, 71, this.rate()];
    const current = data[data.length - 1];
    const previous = data[data.length - 2];
    const change = current - previous;
    const direction = change >= 0 ? '↑' : '↓';
    return `${direction} ${Math.abs(change)}%`;
  });

  ngOnInit() {
    this.tasksSubscription = this.currentUser$.pipe(
      switchMap(user => {
        this.currentUser = user;
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

  async loginWithGoogle(): Promise<void> {
    try {
      await this.authService.loginWithGoogle();
    } catch (error: any) {
      console.error('Google login failed:', error);
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  async addTask(): Promise<void> {
    if (!this.newTaskTitle.trim() || !this.currentUserId) return;
    await this.taskService.addTask(this.newTaskTitle.trim(), this.currentUserId);
    this.newTaskTitle = '';
  }

  async completeTask(id: string): Promise<void> {
    await this.taskService.markAsCompleted(id);
  }

  startEdit(task: Task): void {
    this.editingTaskId = task.id!;
    this.editingTitle = task.title;
  }

  async saveEdit(): Promise<void> {
    if (this.editingTaskId && this.editingTitle.trim()) {
      await this.taskService.updateTask(this.editingTaskId, this.editingTitle.trim());
      this.editingTaskId = null;
      this.editingTitle = '';
    }
  }

  cancelEdit(): void {
    this.editingTaskId = null;
    this.editingTitle = '';
  }

  async deleteTask(id: string): Promise<void> {
    await this.taskService.deleteTask(id);
  }

  async logout(): Promise<void> {
    await this.authService.logout();
    this.router.navigate(['/login']);
  }

  barHeight(v: number): string {
    return `${(v / this.maxWeekVal()) * 100}%`;
  }

  trackById(_: number, task: Task) { return task.id; }
}
