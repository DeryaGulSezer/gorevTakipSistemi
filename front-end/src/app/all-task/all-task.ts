import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GorevService, GorevDto } from '../services/gorev.service';
import { DirectorService } from '../services/director.service';
import { AdminService } from '../services/admin.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-all-task',
  imports: [CommonModule],
  templateUrl: './all-task.html',
  styleUrl: './all-task.scss'
})
export class AllTask implements OnInit {
  // Sekme yönetimi
  activeTab: 'my-assigned' | 'completed-reports' = 'my-assigned';
  
  // Direktörün müdürlere verdiği görevler
  myAssignedTasks: GorevDto[] = [];
  // Müdürlerden gelen raporlanan görevler  
  completedReports: GorevDto[] = [];
  
  // Legacy properties for backward compatibility
  private _originalGorevler: GorevDto[] = [];
  deleteSuccess: string | null = null;
  
  loading = true;
  error: string | null = null;
  success: string | null = null;
  deletingIds: Set<number> = new Set(); // Silme işlemi devam eden görevler
  selectedTasks: Set<number> = new Set(); // Bulk delete için seçilen görevler
  bulkDeleteMode = false; // Bulk delete modu
  showDeleteConfirm = false; // Confirmation dialog
  taskToDelete: GorevDto | null = null; // Silinecek görev
  
  // Sorting state
  sortColumn: keyof GorevDto | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';
  
  // Current user
  currentUser: any = null;
  
  // Raporlanan görev silme için
  showDeleteReportedTaskConfirm = false;
  reportedTaskToDelete: GorevDto | null = null;

  constructor(
    private gorevService: GorevService,
    private directorService: DirectorService,
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Getter for current task list based on active tab
   */
  get gorevler(): GorevDto[] {
    return this.activeTab === 'my-assigned' ? this.myAssignedTasks : this.completedReports;
  }

  /**
   * Setter for current task list based on active tab
   */
  set gorevler(tasks: GorevDto[]) {
    if (this.activeTab === 'my-assigned') {
      this.myAssignedTasks = tasks;
    } else {
      this.completedReports = tasks;
    }
  }

  /**
   * Getter for original task list (for filtering/sorting)
   */
  get originalGorevler(): GorevDto[] {
    return this._originalGorevler;
  }

  /**
   * Setter for original task list
   */
  set originalGorevler(tasks: GorevDto[]) {
    this._originalGorevler = tasks;
  }

  ngOnInit(): void {
    // Kullanıcı bilgilerini al ve görevleri yükle
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.currentUser = user;
        this.loadDirectorTasks();
      }
    });
  }

  /**
   * Direktör görevlerini yükle
   */
  loadDirectorTasks(): void {
    this.loading = true;
    this.error = null;
    
    // Paralel olarak her iki türdeki görevleri yükle
    Promise.all([
      this.loadMyAssignedTasks(),
      this.loadCompletedReports()
    ]).finally(() => {
      this.loading = false;
      // Original data'yı güncelle
      this.updateOriginalData();
    });
  }

  /**
   * Tüm görevleri yükle (legacy method for backward compatibility)
   */
  tumGorevleriYukle(): void {
    this.loadDirectorTasks();
  }

  /**
   * Original data'yı güncelle
   */
  private updateOriginalData(): void {
    this._originalGorevler = [...this.gorevler];
  }

  /**
   * Direktörün müdürlere verdiği görevleri yükle
   */
  private loadMyAssignedTasks(): Promise<void> {
    return new Promise(resolve => {
      console.log('📋 Direktör görünür görevler yükleniyor...');
      const directorId = this.currentUser?.id;
      this.directorService.getDirectorTasks(directorId).subscribe({
        next: (tasks) => {
          // Silinen görevleri filtrele
          const deletedTasksKey = 'deleted_tasks';
          const deletedTasks = JSON.parse(localStorage.getItem(deletedTasksKey) || '[]');
          const deletedTaskIds = deletedTasks.map((dt: any) => dt.taskId);
          
          // Silinen görevleri çıkar
          this.myAssignedTasks = (tasks || []).filter(task => !deletedTaskIds.includes(task.gorevid));
          
          console.log('✅ Direktör görünür görevler yüklendi:', this.myAssignedTasks.length);
          console.log('🗑️ Silinen görev sayısı:', deletedTaskIds.length);
          resolve();
        },
        error: (err) => {
          console.error('❌ Direktör görünür görevler yüklenemedi:', err);
          this.error = 'Görevler yüklenirken hata oluştu';
          resolve();
        }
      });
    });
  }

    /**
   * Müdürlerden gelen raporlanan görevleri yükle
   */
  private loadCompletedReports(): Promise<void> {
    return new Promise(resolve => {
      console.log('📊 Raporlanan görevler yükleniyor...');

      this.adminService.getReportedTasks().subscribe({
        next: (tasks) => {
          this.completedReports = tasks;
          
          // LocalStorage'dan açıklamaları yükle
          this.completedReports.forEach(task => {
            const reportKey = `task_report_${task.gorevid}`;
            const reportData = localStorage.getItem(reportKey);
            if (reportData) {
              try {
                const parsed = JSON.parse(reportData);
                task.reportDescription = parsed.description;
                task.reportedAt = parsed.reportedAt;
              } catch (e) {
                console.warn('⚠️ Açıklama parse edilemedi:', e);
              }
            }
          });
          
          console.log('✅ Raporlanan görevler yüklendi:', this.completedReports.length);
          resolve();
        },
        error: (err) => {
          console.error('❌ Raporlanan görevler yüklenemedi:', err);
          resolve();
        }
      });
    });
  }

  /**
   * Sekme değiştir
   */
  switchTab(tab: 'my-assigned' | 'completed-reports'): void {
    this.activeTab = tab;
    // Seçimleri temizle
    this.selectedTasks.clear();
    this.bulkDeleteMode = false;
  }

  /**
   * Görev silme confirmation dialog aç
   */
  openDeleteConfirm(gorev: GorevDto): void {
    this.taskToDelete = gorev;
    this.showDeleteConfirm = true;
    this.error = null;
    this.deleteSuccess = null;
  }

  /**
   * Delete confirmation dialog kapat
   */
  closeDeleteConfirm(): void {
    this.taskToDelete = null;
    this.showDeleteConfirm = false;
  }

  /**
   * Raporlanan görev silme onayını aç
   */
  openDeleteReportedTaskConfirm(gorev: GorevDto): void {
    this.reportedTaskToDelete = gorev;
    this.showDeleteReportedTaskConfirm = true;
  }

  /**
   * Raporlanan görev silme onayını kapat
   */
  closeDeleteReportedTaskConfirm(): void {
    this.showDeleteReportedTaskConfirm = false;
    this.reportedTaskToDelete = null;
  }

  /**
   * Görev sil - Geçici çözüm (Backend endpoint'i henüz hazır değil)
   */
  confirmDelete(): void {
    if (!this.taskToDelete) return;

    const taskId = this.taskToDelete.gorevid;
    const taskName = this.taskToDelete.isim;
    
    this.deletingIds.add(taskId);
    this.closeDeleteConfirm();

    // Geçici olarak sadece UI'dan kaldır (backend'e istek gönderme)
    // Backend endpoint'i hazır olduğunda bu kodu aktif et
    try {
      // Silinen görevi localStorage'da sakla
      const deletedTasksKey = 'deleted_tasks';
      let deletedTasks = JSON.parse(localStorage.getItem(deletedTasksKey) || '[]');
      deletedTasks.push({
        taskId: taskId,
        deletedAt: new Date().toISOString(),
        taskName: taskName
      });
      localStorage.setItem(deletedTasksKey, JSON.stringify(deletedTasks));
      
      // Görev listesinden kaldır (optimistic update)
      this.gorevler = this.gorevler.filter((g: GorevDto) => g.gorevid !== taskId);
      this.originalGorevler = this.originalGorevler.filter((g: GorevDto) => g.gorevid !== taskId);
      this.deletingIds.delete(taskId);
      
      // Success message göster
      this.deleteSuccess = `"${taskName}" görevi başarıyla silindi! (Geçici: Sadece UI'dan kaldırıldı)`;
      setTimeout(() => {
        this.deleteSuccess = null;
      }, 5000);

      console.log(`Görev UI'dan kaldırıldı: ${taskName} (ID: ${taskId})`);
    } catch (error) {
      this.deletingIds.delete(taskId);
      console.error('Görev UI\'dan kaldırılırken hata oluştu:', error);
      this.error = `"${taskName}" görevi kaldırılırken bir hata oluştu.`;
      
      setTimeout(() => {
        this.error = null;
      }, 5000);
    }

    /* Backend endpoint'i hazır olduğunda bu kodu aktif et:
    this.gorevService.gorevSil(taskId).subscribe({
      next: () => {
        // Görev listesinden kaldır (optimistic update)
        this.gorevler = this.gorevler.filter((g: GorevDto) => g.gorevid !== taskId);
        this.originalGorevler = this.originalGorevler.filter((g: GorevDto) => g.gorevid !== taskId);
        this.deletingIds.delete(taskId);
        
        // Success message göster
        this.deleteSuccess = `"${taskName}" görevi başarıyla silindi!`;
        setTimeout(() => {
          this.deleteSuccess = null;
        }, 5000);

        console.log(`Görev silindi: ${taskName} (ID: ${taskId})`);
      },
      error: (err) => {
        this.deletingIds.delete(taskId);
        console.error('Görev silinirken hata oluştu:', err);
        
        // Spesifik hata mesajları
        if (err.status === 404) {
          this.error = `"${taskName}" görevi bulunamadı. Sayfa yenileniyor...`;
          // 404 durumunda veriyi yenile
          setTimeout(() => {
            this.tumGorevleriYukle();
          }, 2000);
        } else if (err.status === 0) {
          this.error = 'Sunucuya bağlanılamıyor. İnternet bağlantınızı kontrol edin.';
        } else {
          this.error = `"${taskName}" görevi silinirken bir hata oluştu. (${err.status}: ${err.error || err.message})`;
        }
        
        setTimeout(() => {
          this.error = null;
        }, 5000);
      }
    });
    */
  }

  /**
   * Görev siliniyor mu kontrol et
   */
  isDeleting(taskId: number): boolean {
    return this.deletingIds.has(taskId);
  }

  /**
   * Raporlanan görevi sil
   */
  confirmDeleteReportedTask(): void {
    if (!this.reportedTaskToDelete) return;

    const taskId = this.reportedTaskToDelete.gorevid;
    const taskName = this.reportedTaskToDelete.isim;
    
    this.deletingIds.add(taskId);
    this.closeDeleteReportedTaskConfirm();

    // LocalStorage'dan da temizle
    const reportKey = `task_report_${taskId}`;
    localStorage.removeItem(reportKey);

    // Görev listesinden kaldır (optimistic update)
    this.completedReports = this.completedReports.filter((g: GorevDto) => g.gorevid !== taskId);
    this.deletingIds.delete(taskId);
    
    // Success message göster
    this.success = `"${taskName}" raporlanan görevi başarıyla silindi!`;
    setTimeout(() => {
      this.success = null;
    }, 5000);

    console.log(`Raporlanan görev silindi: ${taskName} (ID: ${taskId})`);
  }

  /**
   * Bulk delete modunu toggle et
   */
  toggleBulkDeleteMode(): void {
    this.bulkDeleteMode = !this.bulkDeleteMode;
    if (!this.bulkDeleteMode) {
      this.selectedTasks.clear();
    }
    this.error = null;
    this.deleteSuccess = null;
  }

  /**
   * Görev seçimini toggle et (bulk delete için)
   */
  toggleTaskSelection(taskId: number): void {
    if (this.selectedTasks.has(taskId)) {
      this.selectedTasks.delete(taskId);
    } else {
      this.selectedTasks.add(taskId);
    }
  }

  /**
   * Görev seçili mi kontrol et
   */
  isTaskSelected(taskId: number): boolean {
    return this.selectedTasks.has(taskId);
  }

  /**
   * Tüm görevleri seç/seçimi kaldır
   */
  toggleAllTasks(): void {
    if (this.selectedTasks.size === this.gorevler.length) {
      this.selectedTasks.clear();
    } else {
      this.selectedTasks.clear();
      this.gorevler.forEach((gorev: GorevDto) => {
        this.selectedTasks.add(gorev.gorevid);
      });
    }
  }

  /**
   * Seçilen görevleri sil (bulk delete) - Geçici çözüm (Backend endpoint'i henüz hazır değil)
   */
  deleteSelectedTasks(): void {
    if (this.selectedTasks.size === 0) return;

    const taskCount = this.selectedTasks.size;
    const confirmMessage = `${taskCount} görevi silmek istediğinizden emin misiniz?`;
    
    if (confirm(confirmMessage)) {
      try {
        // Geçici olarak sadece UI'dan kaldır (backend'e istek gönderme)
        const selectedTaskIds = Array.from(this.selectedTasks);
        
        // Silinen görevleri localStorage'da sakla
        const deletedTasksKey = 'deleted_tasks';
        let deletedTasks = JSON.parse(localStorage.getItem(deletedTasksKey) || '[]');
        
        selectedTaskIds.forEach(taskId => {
          const task = this.gorevler.find(g => g.gorevid === taskId);
          if (task) {
            deletedTasks.push({
              taskId: taskId,
              deletedAt: new Date().toISOString(),
              taskName: task.isim
            });
          }
        });
        
        localStorage.setItem(deletedTasksKey, JSON.stringify(deletedTasks));
        
        // Seçili görevleri listeden kaldır
        this.gorevler = this.gorevler.filter(g => !selectedTaskIds.includes(g.gorevid));
        this.originalGorevler = this.originalGorevler.filter(g => !selectedTaskIds.includes(g.gorevid));

        // Feedback göster
        this.deleteSuccess = `${taskCount} görev başarıyla silindi! (Geçici: Sadece UI'dan kaldırıldı)`;
        
        // Messages'ları temizle
        setTimeout(() => {
          this.deleteSuccess = null;
        }, 5000);

        // Bulk delete modunu kapat
        this.selectedTasks.clear();
        this.bulkDeleteMode = false;

        console.log(`${taskCount} görev UI'dan kaldırıldı`);
      } catch (error) {
        console.error('Toplu silme işlemi hatası:', error);
        this.error = 'Toplu silme işlemi sırasında beklenmeyen bir hata oluştu.';
        setTimeout(() => this.error = null, 5000);
      }
    }

    /* Backend endpoint'i hazır olduğunda bu kodu aktif et:
    const deletePromises = Array.from(this.selectedTasks).map(taskId => {
      this.deletingIds.add(taskId);
      return this.gorevService.gorevSil(taskId).toPromise();
    });

    Promise.allSettled(deletePromises).then(results => {
      let successCount = 0;
      let errorCount = 0;

      results.forEach((result, index) => {
        const taskId = Array.from(this.selectedTasks)[index];
        
        if (result.status === 'fulfilled') {
          // Başarılı silinen görevleri listeden kaldır
          this.gorevler = this.gorevler.filter((g: GorevDto) => g.gorevid !== taskId);
          this.originalGorevler = this.originalGorevler.filter((g: GorevDto) => g.gorevid !== taskId);
          successCount++;
        } else {
          errorCount++;
          console.error(`Görev ${taskId} silinirken hata:`, result.reason);
        }
        
        this.deletingIds.delete(taskId);
      });

      // Feedback göster
      if (successCount > 0) {
        this.deleteSuccess = `${successCount} görev başarıyla silindi!`;
      }
      
      if (errorCount > 0) {
        this.error = `${errorCount} görev silinirken hata oluştu. Veriler yenileniyor...`;
        // Hata durumunda veriyi yenile (data consistency için)
        setTimeout(() => {
          this.tumGorevleriYukle();
        }, 2000);
      }

      // Messages'ları temizle
      setTimeout(() => {
        this.deleteSuccess = null;
        this.error = null;
      }, 5000);

      // Bulk delete modunu kapat
      this.selectedTasks.clear();
      this.bulkDeleteMode = false;
    });
    */
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
   * Yenile butonu
   */
  yenile(): void {
    this.tumGorevleriYukle();
  }

  /**
   * TrackBy function for ngFor performance optimization
   */
  trackByGorevId(index: number, gorev: GorevDto): number {
    return gorev.gorevid;
  }

  /**
   * Görev düzenle - Edit sayfasına yönlendir
   */
  editGorev(gorev: GorevDto): void {
    console.log('Düzenlenecek görev:', gorev);
    this.router.navigate(['/edit-task', gorev.gorevid]);
  }

  /**
   * Öncelik tipine göre görev sayısını say
   */
  countByPriority(priority: string): number {
    return this.gorevler.filter((gorev: GorevDto) => 
      gorev.priority?.toLowerCase() === priority.toLowerCase()
    ).length;
  }

  /**
   * Sütuna göre sıralama yap
   */
  sortBy(column: keyof GorevDto): void {
    if (this.sortColumn === column) {
      // Aynı sütuna tıklandıysa direction'ı değiştir
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Farklı sütuna tıklandıysa o sütunu seç ve ascending yap
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.applySorting();
  }

  /**
   * Sıralamayı uygula
   */
  private applySorting(): void {
    if (!this.sortColumn) {
      this.gorevler = [...this.originalGorevler];
      return;
    }

    this.gorevler.sort((a: GorevDto, b: GorevDto) => {
      let valueA = a[this.sortColumn as keyof GorevDto];
      let valueB = b[this.sortColumn as keyof GorevDto];

      // Null/undefined değerler için fallback
      if (valueA === null || valueA === undefined) valueA = '';
      if (valueB === null || valueB === undefined) valueB = '';

      // String değerler için case-insensitive karşılaştırma
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        valueA = valueA.toLowerCase();
        valueB = valueB.toLowerCase();
      }

      // Öncelik için özel sıralama (Yüksek > Orta > Düşük)
      if (this.sortColumn === 'priority') {
        const priorityOrder: Record<string, number> = { 
          'yüksek': 3, 'high': 3, 
          'orta': 2, 'medium': 2, 
          'düşük': 1, 'low': 1 
        };
        const priorityA = priorityOrder[valueA as string] || 0;
        const priorityB = priorityOrder[valueB as string] || 0;
        valueA = priorityA;
        valueB = priorityB;
      }

      let comparison = 0;
      if (valueA! > valueB!) {
        comparison = 1;
      } else if (valueA! < valueB!) {
        comparison = -1;
      }

      return this.sortDirection === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * Sıralama ikonu göster
   */
  getSortIcon(column: keyof GorevDto): string {
    if (this.sortColumn !== column) {
      return '↕️'; // Sıralanabilir ikonu
    }
    return this.sortDirection === 'asc' ? '⬆️' : '⬇️';
  }

  /**
   * Sıralama sütunu aktif mi?
   */
  isSortActive(column: keyof GorevDto): boolean {
    return this.sortColumn === column;
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
        return status || 'Bilinmiyor';
    }
  }
}
