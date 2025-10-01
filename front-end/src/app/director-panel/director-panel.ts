import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DirectorService } from '../services/director.service';
import { AuthService } from '../services/auth.service';
import { GorevDto } from '../services/gorev.service';

@Component({
  selector: 'app-director-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './director-panel.html',
  styleUrls: ['./director-panel.scss']
})
export class DirectorPanelComponent implements OnInit {
  currentUser: any = null;
  loading = false;
  error = '';

  tasks: GorevDto[] = [];
  activeTab: 'active' | 'completed' | 'reported' = 'active';

  constructor(
    private directorService: DirectorService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUserSync();
    if (this.currentUser && this.currentUser.role === 'DIRECTOR') {
      this.loadTasks(this.currentUser.id);
    } else {
      this.authService.getCurrentUser().subscribe({
        next: (user) => {
          this.currentUser = user;
          if (user && user.role === 'DIRECTOR') {
            this.loadTasks(user.id);
          } else {
            this.error = 'Direktör yetkisi gerekli!';
          }
        },
        error: () => this.error = 'Kullanıcı bilgisi alınamadı'
      });
    }
  }

  switchTab(tab: 'active' | 'completed' | 'reported'): void {
    this.activeTab = tab;
  }

  private loadTasks(directorId: number): void {
    this.loading = true;
    this.error = '';
    this.directorService.getDirectorTasks(directorId).subscribe({
      next: (tasks) => {
        this.tasks = tasks || [];
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Görevler yüklenemedi';
        console.error(err);
        this.loading = false;
      }
    });
  }

  trackByTaskId(index: number, task: GorevDto): number {
    return task.gorevid;
  }

  get activeTasks(): GorevDto[] {
    return this.tasks.filter(t => (t.status || '').toUpperCase() !== 'COMPLETED');
  }

  get completedTasks(): GorevDto[] {
    return this.tasks.filter(t => (t.status || '').toUpperCase() === 'COMPLETED');
  }
}

 