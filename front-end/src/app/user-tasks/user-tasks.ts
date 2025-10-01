import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GorevService, GorevDto, UserTaskStats } from '../services/gorev.service';
import { AuthService, UserDto } from '../services/auth.service';

@Component({
  selector: 'app-user-tasks',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-tasks.html',
  styleUrl: './user-tasks.scss'
})
export class UserTasks implements OnInit, OnDestroy {
  gorevler: GorevDto[] = [];
  originalGorevler: GorevDto[] = [];
  stats: UserTaskStats = { totalTasks: 0, activeTasks: 0, completedTasks: 0 };
  
  loading = true;
  error: string | null = null;
  success: string | null = null;
  
  // Kullanıcı bilgileri
  currentUser: UserDto | null = null;
  currentUserId: number | null = null;
  private subscriptions: Subscription[] = [];
  
  // Filtreleme ve sıralama
  filterStatus: string = 'active'; // 'all', 'active', 'completed'
  completingIds: Set<number> = new Set(); // Tamamlanma işlemi devam eden görevler
  
  // Otomatik yenileme için
  private autoRefreshInterval: any;
  private readonly REFRESH_INTERVAL = 30000; // 30 saniyede bir yenile

  constructor(
    private gorevService: GorevService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Kullanıcı bilgilerini al
    const userSub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.currentUserId = user?.id || null;
      
      if (this.currentUserId) {
        this.loadUserTasks();
        this.loadUserStats();
      } else {
        console.error('User ID bulunamadı, login sayfasına yönlendiriliyor');
        this.router.navigate(['/login']);
      }
    });

    this.subscriptions.push(userSub);
    
    // Otomatik yenileme başlat
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    
    // Otomatik yenilemeyi durdur
    this.stopAutoRefresh();
  }

  /**
   * Kullanıcının görevlerini yükle
   */
  loadUserTasks(): void {
    if (!this.currentUserId) {
      console.error('Kullanıcı ID bulunamadı');
      return;
    }

    this.loading = true;
    this.error = null;
    
    const request$ = this.filterStatus === 'active' 
      ? this.gorevService.kullaniciAktifGorevleriGetir(this.currentUserId)
      : this.filterStatus === 'all'
      ? this.gorevService.kullaniciGorevleriGetir(this.currentUserId)
      : this.gorevService.kullaniciGorevleriStatuseGore(this.currentUserId, 'COMPLETED');

    request$.subscribe({
      next: (gorevler) => {
        this.originalGorevler = [...gorevler];
        this.gorevler = [...gorevler];
        this.loading = false;
      },
      error: (err) => {
        console.error('Görevler yüklenirken hata oluştu:', err);
        this.error = 'Görevler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.';
        this.loading = false;
      }
    });
  }

  /**
   * Kullanıcının istatistiklerini yükle
   */
  loadUserStats(): void {
    if (!this.currentUserId) {
      console.error('Kullanıcı ID bulunamadı');
      return;
    }

    this.gorevService.kullaniciIstatistikleriGetir(this.currentUserId).subscribe({
      next: (stats) => {
        this.stats = stats;
      },
      error: (err) => {
        console.error('İstatistikler yüklenirken hata oluştu:', err);
      }
    });
  }

  /**
   * Görevi tamamla
   */
  completeTask(gorev: GorevDto): void {
    if (!this.currentUserId) {
      this.error = 'Kullanıcı bilgisi bulunamadı!';
      return;
    }

    this.completingIds.add(gorev.gorevid);
    this.error = null;
    this.success = null;

    this.gorevService.gorevTamamla(gorev.gorevid, this.currentUserId).subscribe({
      next: (message) => {
        this.completingIds.delete(gorev.gorevid);
        this.success = `"${gorev.isim}" görevi tamamlandı! 🎉`;
        
        // Görevi listeden kaldır (optimistic update)
        this.gorevler = this.gorevler.filter(g => g.gorevid !== gorev.gorevid);
        this.originalGorevler = this.originalGorevler.filter(g => g.gorevid !== gorev.gorevid);
        
        // İstatistikleri güncelle
        this.loadUserStats();
        
        // Success mesajını temizle
        setTimeout(() => {
          this.success = null;
        }, 5000);
      },
      error: (err) => {
        this.completingIds.delete(gorev.gorevid);
        console.error('Görev tamamlanırken hata oluştu:', err);
        
        if (err.status === 404) {
          this.error = 'Görev bulunamadı. Sayfa yenileniyor...';
          setTimeout(() => {
            this.loadUserTasks();
          }, 2000);
        } else {
          this.error = `"${gorev.isim}" görevi tamamlanırken bir hata oluştu.`;
        }
        
        setTimeout(() => {
          this.error = null;
        }, 5000);
      }
    });
  }

  /**
   * Görev durumunu güncelle
   */
  updateTaskStatus(gorev: GorevDto, newStatus: string): void {
    if (!this.currentUserId) {
      this.error = 'Kullanıcı bilgisi bulunamadı!';
      return;
    }

    this.gorevService.gorevDurumGuncelle(gorev.gorevid, this.currentUserId, newStatus).subscribe({
      next: (message) => {
        this.success = `"${gorev.isim}" görevinin durumu güncellendi!`;
        
        // Görevi güncelle
        const gorevIndex = this.gorevler.findIndex(g => g.gorevid === gorev.gorevid);
        if (gorevIndex !== -1) {
          this.gorevler[gorevIndex].status = newStatus;
        }
        
        // İstatistikleri güncelle
        this.loadUserStats();
        
        setTimeout(() => {
          this.success = null;
        }, 3000);
      },
      error: (err) => {
        console.error('Görev durumu güncellenirken hata oluştu:', err);
        this.error = `"${gorev.isim}" görevinin durumu güncellenemedi.`;
        
        setTimeout(() => {
          this.error = null;
        }, 5000);
      }
    });
  }

  /**
   * Filtreyi değiştir ve görevleri yeniden yükle
   */
  changeFilter(newFilter: string): void {
    this.filterStatus = newFilter;
    this.loadUserTasks();
  }



  /**
   * Görev tamamlanıyor mu kontrol et
   */
  isCompleting(taskId: number): boolean {
    return this.completingIds.has(taskId);
  }

  /**
   * Öncelik rengini belirle
   */
  getPriorityClass(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'yüksek':
      case 'high':
        return 'priority-high';
      case 'orta':
      case 'medium':
        return 'priority-medium';
      case 'düşük':
      case 'low':
        return 'priority-low';
      default:
        return 'priority-default';
    }
  }

  /**
   * Status rengini belirle
   */
  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'status-pending';
      case 'IN_PROGRESS':
        return 'status-in-progress';
      case 'COMPLETED':
        return 'status-completed';
      default:
        return 'status-default';
    }
  }

  /**
   * Status Türkçe karşılığı
   */
  getStatusText(status: string): string {
    switch (status?.toUpperCase()) {
      case 'PENDING':
        return 'Bekliyor';
      case 'IN_PROGRESS':
        return 'Devam Ediyor';
      case 'COMPLETED':
        return 'Tamamlandı';
      default:
        return status;
    }
  }

  /**
   * TrackBy function for ngFor performance optimization
   */
  trackByGorevId(index: number, gorev: GorevDto): number {
    return gorev.gorevid;
  }
  
  /**
   * Otomatik yenileme başlat
   */
  private startAutoRefresh(): void {
    this.autoRefreshInterval = setInterval(() => {
      if (this.currentUserId && !this.loading) {
        console.log('🔄 Otomatik yenileme çalışıyor...');
        this.loadUserTasks();
        this.loadUserStats();
      }
    }, this.REFRESH_INTERVAL);
  }
  
  /**
   * Otomatik yenilemeyi durdur
   */
  private stopAutoRefresh(): void {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }
  
  /**
   * Manuel yenileme (otomatik yenileme sıfırlanır)
   */
  refresh(): void {
    this.loadUserTasks();
    this.loadUserStats();
    
    // Otomatik yenileme sıfırla
    this.stopAutoRefresh();
    this.startAutoRefresh();
  }
}