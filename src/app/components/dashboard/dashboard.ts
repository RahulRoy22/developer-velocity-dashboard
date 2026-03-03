import { Component, OnInit, inject } from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { TaskService } from '../../services/task.service';
import { Task } from '../../models/task.model';

// Chart.js requires registering its components in modern setups
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  private taskService = inject(TaskService);
  
  tasks: Task[] = [];
  chart: any;

  ngOnInit() {
    // Subscribe to the real-time Firestore stream
    this.taskService.getTasks().subscribe((data) => {
      this.tasks = data;
      this.updateChartData();
    });
  }

  addTask(title: string) {
    if (title.trim()) {
      this.taskService.addTask(title);
    }
  }

  completeTask(id: string) {
    this.taskService.markAsCompleted(id);
  }

  // --- THE VELOCITY ENGINE ---
  private updateChartData() {
    // 1. Filter for completed tasks
    const completedTasks = this.tasks.filter(t => t.status === 'completed' && t.completedAt);

    // 2. Group by date (e.g., "Mar 3", "Mar 4")
    const completionsByDate: { [key: string]: number } = {};
    
    completedTasks.forEach(task => {
      const dateString = new Date(task.completedAt!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      completionsByDate[dateString] = (completionsByDate[dateString] || 0) + 1;
    });

    const labels = Object.keys(completionsByDate);
    const dataPoints = Object.values(completionsByDate);

    // 3. Render or Update the Chart
    this.renderChart(labels, dataPoints);
  }

  private renderChart(labels: string[], dataPoints: number[]) {
    // Destroy the old chart instance if it exists before redrawing
    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart('velocityChart', {
      type: 'line', // 'bar' also looks great here
      data: {
        labels: labels,
        datasets: [{
          label: 'Tasks Completed',
          data: dataPoints,
          borderColor: '#3f51b5',
          backgroundColor: 'rgba(63, 81, 181, 0.2)',
          tension: 0.3, // Adds a nice curve to the line
          fill: true
        }]
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  }
}