import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ManagerService, TeamMemberDto, TeamPerformanceDto, TaskAssignmentRequest, TaskOperationResponse } from '../services/manager.service';
import { GorevDto } from '../services/gorev.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-manager-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './manager-panel.html',
  styleUrls: ['./manager-panel.scss']
})
export class ManagerPanelComponent implements OnInit {
  currentUser: any = null;
  teamMembers: TeamMemberDto[] = [];
  teamTasks: GorevDto[] = [];
  managerTasks: GorevDto[] = [];
  completedTasks: GorevDto[] = [];
  selectedCompletedTasks: GorevDto[] = [];
  teamPerformance: TeamPerformanceDto | null = null;

  
  // Form durumları
  showAssignForm = false;
  assignForm: FormGroup;
  
  // Edit modal durumları
  showEditModal = false;
  editForm: FormGroup | null = null;
  editingTask: GorevDto | null = null;
  
  // Raporlama modal için
  showReportModal = false;
  reportForm: FormGroup;
  reportingTask: GorevDto | null = null;
  
  loading = false;
  error = '';
  success = '';
  
  // Sekme yönetimi
  activeTab: 'active' | 'completed' = 'active';
  
  // Rapor/Arşiv yönetimi kaldırıldı
  
  // Sıralama
  sortColumn: keyof GorevDto | '' = '';
  sortDirection: 'asc' | 'desc' = 'asc';

  constructor(
    private managerService: ManagerService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.assignForm = this.fb.group({
      teamMemberId: ['', Validators.required],
      taskName: ['', [Validators.required, Validators.minLength(3)]],
      taskDescription: ['', [Validators.required, Validators.minLength(10)]],
      priority: ['orta', Validators.required],
      parentTaskId: ['']
    });
    
    this.reportForm = this.fb.group({
      reportDescription: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  ngOnInit(): void {
    console.log('🔍 ManagerPanel ngOnInit başladı');
    
    // Ensure arrays are properly initialized
    this.completedTasks = [];
    this.selectedCompletedTasks = [];
    
    // Sync olarak mevcut kullanıcı bilgisini al
    this.currentUser = this.authService.getCurrentUserSync();
    console.log('👤 CurrentUser (sync):', this.currentUser);
    
    if (this.currentUser && this.currentUser.role === 'MANAGER') {
      console.log('✅ Müdür yetkisi doğrulandı, veriler yükleniyor...');
      this.loadManagerData();
    } else {
      console.log('❌ Müdür yetkisi yok! User:', this.currentUser);
      
      // Async olarak da dene
      this.authService.getCurrentUser().subscribe({
        next: (user) => {
          console.log('👤 CurrentUser (async):', user);
          this.currentUser = user;
          
          if (user && user.role === 'MANAGER') {
            console.log('✅ Müdür yetkisi doğrulandı (async), veriler yükleniyor...');
            this.loadManagerData();
            this.error = ''; // Hatayı temizle
          } else {
            console.log('❌ Müdür yetkisi yok (async)! User:', user);
            this.error = 'Müdür yetkisi gerekli!';
          }
        },
        error: (err) => {
          console.error('❌ Kullanıcı bilgisi alınamadı:', err);
          this.error = 'Kullanıcı bilgisi alınamadı';
        }
      });
    }
  }

  /**
   * Müdür paneli verilerini yükle
   */
  loadManagerData(): void {
    this.loading = true;
    const managerId = this.currentUser.id;

    // Paralel olarak tüm verileri yükle
    Promise.all([
      this.loadTeamMembers(managerId),
      this.loadTeamTasks(managerId),
      this.loadManagerTasks(managerId),
      this.loadCompletedTasks(managerId),
      this.loadTeamPerformance(managerId)
    ]).finally(() => {
      this.loading = false;
    });
  }

  /**
   * Ekip üyelerini yükle
   */
  private loadTeamMembers(managerId: number): Promise<void> {
    return new Promise(resolve => {
      console.log('🔍 Frontend: Ekip üyeleri yükleniyor - Manager ID:', managerId);
      
      this.managerService.getTeamMembers(managerId).subscribe({
        next: (members) => {
          // Demo/varsayılan hesabı ve pasif kullanıcıları gizle
          this.teamMembers = (members || []).filter(m => {
            const isDemo = (m.username || '').toLowerCase() === 'teammember' || (m.fullName || '').toLowerCase() === 'teammember';
            const isInactive = m.isActive === false;
            return !isDemo && !isInactive;
          });
          console.log('✅ Frontend: Ekip üyeleri yüklendi:', members.length, members);
          resolve();
        },
        error: (err) => {
          console.error('❌ Frontend: Ekip üyeleri yüklenemedi:', err);
          console.error('HTTP Status:', err.status, 'URL:', err.url);
          resolve();
        }
      });
    });
  }

  /**
   * Ekip görevlerini yükle
   */
  private loadTeamTasks(managerId: number): Promise<void> {
    return new Promise(resolve => {
      console.log('🔍 loadTeamTasks başladı - managerId:', managerId);
      this.managerService.getTeamTasks(managerId).subscribe({
        next: (tasks) => {
          this.teamTasks = tasks || [];
          console.log('✅ Ekip görevleri yüklendi:', this.teamTasks.length);
          console.log('📊 teamTasks detayları:', this.teamTasks.map(t => ({id: t.gorevid, name: t.isim, status: t.status, userid: t.userid})));
          
          // UI güvenliği: Tamamlananları buradan da türet
          this.completedTasks = (this.teamTasks || []).filter(t => (t.status || '').toUpperCase() === 'COMPLETED');

          // Ekip dışında kalan kullanıcıların görevlerini gizle
          this.applyTeamMemberFilters();
          console.log('🔄 loadTeamTasks içinde türetilen completed:', this.completedTasks.length);
          resolve();
        },
        error: (err) => {
          console.error('❌ Ekip görevleri yüklenemedi:', err);
          resolve();
        }
      });
    });
  }

  /**
   * Ekip üyesi listesine göre görevleri filtreler.
   * Silinen/gizlenen ekip üyelerine ait görevler görünmez.
   */
  private applyTeamMemberFilters(): void {
    // Ekip üyeleri henüz yüklenmediyse, görev listelerini boşaltma.
    // Aksi halde eşzamanlı yükleme sırasında görevler silinmiş gibi görünüyor.
    if (!this.teamMembers || this.teamMembers.length === 0) {
      return;
    }
    const validMemberIds = new Set(this.teamMembers.map(m => m.id));

    // Sadece listede bulunan ekip üyelerine ait görevleri göster
    this.teamTasks = (this.teamTasks || []).filter(t => validMemberIds.has(t.userid));
    this.completedTasks = (this.teamTasks || []).filter(t => (t.status || '').toUpperCase() === 'COMPLETED');
  }

  /**
   * Müdürün kendi görevlerini yükle
   */
  private loadManagerTasks(managerId: number): Promise<void> {
    return new Promise(resolve => {
      this.managerService.getManagerTasks(managerId).subscribe({
        next: (tasks) => {
          this.managerTasks = tasks;
          console.log('✅ Müdür görevleri yüklendi:', this.managerTasks.length);
          resolve();
        },
        error: (err) => {
          console.error('❌ Müdür görevleri yüklenemedi:', err);
          resolve();
        }
      });
    });
  }

  /**
   * Ekip performansını yükle
   */
  private loadTeamPerformance(managerId: number): Promise<void> {
    return new Promise(resolve => {
      this.managerService.getTeamPerformance(managerId).subscribe({
        next: (performance) => {
          this.teamPerformance = performance;
          console.log('✅ Ekip performansı yüklendi:', performance);
          resolve();
        },
        error: (err) => {
          console.error('❌ Ekip performansı yüklenemedi:', err);
          resolve();
        }
      });
    });
  }

  /**
   * Tamamlanan görevleri yükle
   */
  private loadCompletedTasks(managerId: number): Promise<void> {
    return new Promise(resolve => {
      console.log('✅ Frontend: Tamamlanan görevler yükleniyor - Manager ID:', managerId);
      console.log('🔍 Mevcut teamTasks sayısı:', this.teamTasks.length);
      
      this.managerService.getCompletedTasks(managerId).subscribe({
        next: (tasks) => {
          console.log('📊 Backend\'den gelen completed tasks:', tasks?.length, tasks);
          this.completedTasks = tasks || [];
          // Backend boş dönerse, teamTasks üzerinden türet
          if (!this.completedTasks.length && this.teamTasks.length) {
            console.log('🔄 Backend boş, teamTasks\'tan türetiliyor...');
            this.completedTasks = this.teamTasks.filter(t => (t.status || '').toUpperCase() === 'COMPLETED');
            console.log('📊 teamTasks\'tan türetilen completed:', this.completedTasks.length);
          }
          console.log('✅ Frontend: Tamamlanan görevler yüklendi:', this.completedTasks.length, this.completedTasks);
          resolve();
        },
        error: (err) => {
          console.error('❌ Frontend: Tamamlanan görevler yüklenemedi:', err);
          // Hata durumunda da görünürlük için teamTasks'tan türet
          if (this.teamTasks.length) {
            console.log('🔄 Hata durumunda teamTasks\'tan türetiliyor...');
            this.completedTasks = this.teamTasks.filter(t => (t.status || '').toUpperCase() === 'COMPLETED');
            console.log('📊 Hata sonrası türetilen completed:', this.completedTasks.length);
          }
          resolve();
        }
      });
    });
  }

  // loadReportDirectorTasks kaldırıldı

  /**
   * Görev atama formunu göster/gizle
   */
  toggleAssignForm(): void {
    this.showAssignForm = !this.showAssignForm;
    if (!this.showAssignForm) {
      this.assignForm.reset();
      this.assignForm.patchValue({ priority: 'orta' });
    }
  }

  /**
   * Ekip üyesine görev ata
   */
  onAssignTask(): void {
    if (this.assignForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    this.error = '';
    
    const formValue = this.assignForm.value;
    const taskData: TaskAssignmentRequest = {
      isim: formValue.taskName,
      description: formValue.taskDescription,
      userid: parseInt(formValue.teamMemberId),
      priority: formValue.priority,
      status: 'PENDING',
      parentTaskId: formValue.parentTaskId ? Number(formValue.parentTaskId) : undefined
    };

    console.log('🔍 Frontend: Görev atanıyor:', taskData);
    
    this.managerService.assignTask(taskData).subscribe({
      next: (response) => {
        console.log('✅ Frontend: Görev atama response:', response);
        
        if (response.success) {
          this.success = '✅ Görev başarıyla atandı!';
          this.assignForm.reset();
          this.assignForm.patchValue({ priority: 'orta' });
          this.showAssignForm = false;
          
          // Ekip görevlerini yenile
          this.loadTeamTasks(this.currentUser.id);
          
          setTimeout(() => this.success = '', 3000);
        } else {
          this.error = response.message || 'Görev atanamadı';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Frontend: Görev atama hatası:', err);
        console.error('HTTP Status:', err.status, 'URL:', err.url);
        console.error('Error Details:', err.error);
        this.error = 'Görev atanırken hata oluştu';
        this.loading = false;
      }
    });
  }

  /**
   * Form hatalarını göster
   */
  private markFormGroupTouched(): void {
    Object.keys(this.assignForm.controls).forEach(key => {
      this.assignForm.get(key)?.markAsTouched();
    });
  }

  /**
   * Form hata kontrolü
   */
  getFieldError(fieldName: string): string {
    const field = this.assignForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) return `${fieldName} zorunludur`;
      if (field.errors['minlength']) return `En az ${field.errors['minlength'].requiredLength} karakter olmalı`;
    }
    return '';
  }

  /**
   * Görevleri sırala
   */
  sortTasks(column: keyof GorevDto, tasks: GorevDto[]): GorevDto[] {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    return tasks.sort((a, b) => {
      const valueA = a[column];
      const valueB = b[column];
      
      if (column === 'priority') {
        const priorityOrder: Record<string, number> = { 
          'yüksek': 1, 'high': 1, 'orta': 2, 'medium': 2, 'düşük': 3, 'low': 3 
        };
        const priorityA = priorityOrder[valueA as string] || 0;
        const priorityB = priorityOrder[valueB as string] || 0;
        
        return this.sortDirection === 'asc' ? priorityA - priorityB : priorityB - priorityA;
      }

      // Undefined değerler için kontrol
      if (valueA === undefined && valueB === undefined) return 0;
      if (valueA === undefined) return 1;
      if (valueB === undefined) return -1;

      if (valueA < valueB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  /**
   * Sıralama aktif mi kontrol
   */
  isSortActive(column: keyof GorevDto): boolean {
    return this.sortColumn === column;
  }

  /**
   * Sıralama yön ikonu
   */
  getSortIcon(column: keyof GorevDto): string {
    if (this.sortColumn !== column) return '↕️';
    return this.sortDirection === 'asc' ? '⬆️' : '⬇️';
  }

  /**
   * Görev durumu sınıfı
   */
  getStatusClass(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'status-completed';
      case 'IN_PROGRESS': return 'status-in-progress';
      case 'PENDING': return 'status-pending';
      default: return 'status-unknown';
    }
  }

  /**
   * Görev durumu metni
   */
  getStatusText(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'Tamamlandı';
      case 'IN_PROGRESS': return 'Devam Ediyor';
      case 'PENDING': return 'Bekliyor';
      default: return 'Bilinmiyor';
    }
  }

  /**
   * Öncelik sınıfı
   */
  getPriorityClass(priority: string): string {
    switch (priority?.toLowerCase()) {
      case 'yüksek':
      case 'high': return 'priority-high';
      case 'orta':
      case 'medium': return 'priority-medium';
      case 'düşük':
      case 'low': return 'priority-low';
      default: return '';
    }
  }

  /**
   * Kullanıcı adı bulma
   */
  getTeamMemberName(userId: number): string {
    const member = this.teamMembers.find(m => m.id === userId);
    return member ? member.fullName : 'Silinmiş Kullanıcı';
  }

  /**
   * Kullanıcının görev sayısını getir
   */
  getTaskCountForUser(userId: number): number {
    return this.teamTasks.filter(task => task.userid === userId).length;
  }

  /**
   * Parent task olarak kullanılabilecek görevleri getir (tamamlanan görevler hariç)
   */
  getAvailableParentTasks(): GorevDto[] {
    return this.managerTasks.filter(task => {
      // Tamamlanan, arşivlenen ve iptal edilen görevleri hariç tut
      const excludedStatuses = ['COMPLETED', 'ARCHIVED', 'CANCELLED'];
      if (excludedStatuses.includes(task.status?.toUpperCase() || '')) {
        return false;
      }
      
      // Sadece aktif ve devam eden görevleri göster
      const allowedStatuses = ['PENDING', 'IN_PROGRESS', 'ASSIGNED'];
      return allowedStatuses.includes(task.status?.toUpperCase() || '');
    });
  }

  /**
   * Kullanılabilir parent task sayısını getir
   */
  getAvailableParentTasksCount(): number {
    return this.getAvailableParentTasks().length;
  }

  /**
   * TrackBy function for performance
   */
  trackByTaskId(index: number, task: GorevDto): number {
    return task.gorevid;
  }

  trackByMemberId(index: number, member: TeamMemberDto): number {
    return member.id;
  }

  /**
   * Görev düzenleme modalını aç
   */
  editTask(task: GorevDto): void {
    this.editingTask = task;
    
    // Edit form oluştur
    this.editForm = this.fb.group({
      teamMemberId: [task.userid, Validators.required],
      taskName: [task.isim, [Validators.required, Validators.minLength(3)]],
      taskDescription: [task.description, [Validators.required, Validators.minLength(10)]],
      priority: [task.priority, Validators.required]
    });
    
    this.showEditModal = true;
  }

  /**
   * Görev düzenleme modalını kapat
   */
  closeEditModal(): void {
    this.showEditModal = false;
    this.editForm = null;
    this.editingTask = null;
    this.error = '';
    this.success = '';
  }

  /**
   * Edit form field hata kontrolü
   */
  getEditFieldError(fieldName: string): string {
    if (!this.editForm) return '';
    
    const field = this.editForm.get(fieldName);
    if (field && field.invalid && (field.dirty || field.touched)) {
      if (field.errors?.['required']) {
        return 'Bu alan zorunludur';
      }
      if (field.errors?.['minlength']) {
        return `En az ${field.errors['minlength'].requiredLength} karakter olmalıdır`;
      }
    }
    return '';
  }

  /**
   * Görev güncelleme form submit
   */
  onSubmitEdit(): void {
    if (!this.editForm || !this.editingTask || this.editForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const updatedTaskData: GorevDto = {
      gorevid: this.editingTask.gorevid,
      isim: this.editForm.value.taskName,
      description: this.editForm.value.taskDescription,
      userid: Number(this.editForm.value.teamMemberId),
      priority: this.editForm.value.priority,
      status: 'PENDING' // Düzenlemede görevi yeniden aktif hale getir
    };

    console.log('🔄 Görev güncelleniyor:', updatedTaskData);

    this.managerService.updateTask(this.editingTask.gorevid!, updatedTaskData).subscribe({
      next: (response: TaskOperationResponse) => {
        this.loading = false;
        console.log('✅ Görev güncellendi:', response);

        if (response.success) {
          this.success = response.message || 'Görev başarıyla güncellendi';
          
          // Görev listesini yenile
          this.loadTeamTasks(this.currentUser.id);
          
          // Modal'ı kapat
          setTimeout(() => {
            this.closeEditModal();
          }, 1000);
        } else {
          this.error = response.message || 'Görev güncellenemedi';
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('❌ Görev güncelleme hatası:', err);
        this.error = err.error?.message || 'Görev güncellenirken hata oluştu';
      }
    });
  }

  /**
   * Görev durumunu bekletmeye al
   */
  pauseTask(task: GorevDto): void {
    if (!confirm(`"${task.isim}" görevini bekletmeye almak istediğinizden emin misiniz?`)) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const updatedTaskData: GorevDto = {
      ...task,
      status: 'PENDING'
    };

    console.log('⏸️ Görev bekletmeye alınıyor:', updatedTaskData);

    this.managerService.updateTask(task.gorevid!, updatedTaskData).subscribe({
      next: (response: TaskOperationResponse) => {
        this.loading = false;
        console.log('⏸️ Görev bekletmeye alındı:', response);

        if (response.success) {
          this.success = 'Görev başarıyla bekletmeye alındı!';
          
          // Görev listesini yenile
          this.loadTeamTasks(this.currentUser.id);
          
          setTimeout(() => this.success = '', 3000);
        } else {
          this.error = response.message || 'Görev bekletmeye alınamadı';
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('❌ Görev bekletme hatası:', err);
        this.error = err.error?.message || 'Görev bekletmeye alınırken hata oluştu';
      }
    });
  }

  /**
   * Görev durumunu devam ediyor olarak işaretle
   */
  startTask(task: GorevDto): void {
    if (!confirm(`"${task.isim}" görevini devam ediyor olarak işaretlemek istediğinizden emin misiniz?`)) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const updatedTaskData: GorevDto = {
      ...task,
      status: 'IN_PROGRESS'
    };

    console.log('🔄 Görev başlatılıyor:', updatedTaskData);

    this.managerService.updateTask(task.gorevid!, updatedTaskData).subscribe({
      next: (response: TaskOperationResponse) => {
        this.loading = false;
        console.log('🔄 Görev başlatıldı:', response);

        if (response.success) {
          this.success = 'Görev başarıyla başlatıldı!';
          
          // Görev listesini yenile
          this.loadTeamTasks(this.currentUser.id);
          
          setTimeout(() => this.success = '', 3000);
        } else {
          this.error = response.message || 'Görev başlatılamadı';
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('❌ Görev başlatma hatası:', err);
        this.error = err.error?.message || 'Görev başlatılırken hata oluştu';
      }
    });
  }

  /**
   * Görev durumunu tamamlandı olarak işaretle
   */
  completeTask(task: GorevDto): void {
    if (!confirm(`"${task.isim}" görevini tamamlandı olarak işaretlemek istediğinizden emin misiniz?`)) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const updatedTaskData: GorevDto = {
      ...task,
      status: 'COMPLETED'
    };

    console.log('✅ Görev tamamlanıyor:', updatedTaskData);

    this.managerService.updateTask(task.gorevid!, updatedTaskData).subscribe({
      next: (response: TaskOperationResponse) => {
        this.loading = false;
        console.log('✅ Görev tamamlandı:', response);

        if (response.success) {
          this.success = 'Görev başarıyla tamamlandı ve direktöre otomatik raporlandı!';
          
          // Görev listesini yenile
          this.loadTeamTasks(this.currentUser.id);
          
          // Görevi direktöre otomatik raporla
          this.autoReportCompletedTaskToDirector(task);
          
          setTimeout(() => this.success = '', 5000);
        } else {
          this.error = response.message || 'Görev tamamlanamadı';
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('❌ Görev tamamlama hatası:', err);
        this.error = err.error?.message || 'Görev tamamlanırken hata oluştu';
      }
    });
  }

  /**
   * Tamamlanan görevi direktöre otomatik raporla
   */
  private autoReportCompletedTaskToDirector(task: GorevDto): void {
    console.log('📊 Tamamlanan görev direktöre otomatik raporlanıyor:', task.gorevid);
    
    // Geçici olarak sadece taskIds ile raporlama yap
    this.managerService.reportTasksToDirector(this.currentUser.id, [task.gorevid]).subscribe({
      next: (response: any) => {
        if (response?.success) {
          console.log('✅ Görev direktöre otomatik raporlandı');
          // UI'da görevi güncelle
          task.reportedToDirector = true;
        } else {
          console.warn('⚠️ Görev otomatik raporlanamadı:', response?.message);
        }
      },
      error: (err) => {
        console.error('❌ Otomatik raporlama hatası:', err);
        // Hata durumunda görevi işaretleme, sadece log
        if (err.status === 400) {
          console.warn('⚠️ Backend henüz açıklama alanını desteklemiyor');
        }
      }
    });
  }

  /**
   * Görev sil
   */
  deleteTask(task: GorevDto): void {
    if (!confirm(`"${task.isim}" görevini silmek istediğinizden emin misiniz?`)) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    console.log('🗑️ Görev siliniyor:', {
      taskId: task.gorevid,
      taskName: task.isim,
      taskStatus: task.status,
      taskUser: task.userid,
      currentUser: this.currentUser?.id
    });

    if (!task.gorevid) {
      this.error = 'Görev ID bulunamadı!';
      this.loading = false;
      setTimeout(() => this.error = '', 5000);
      return;
    }

    // Debug: Görev ID'sini string'e çevir
    const taskId = Number(task.gorevid);
    if (isNaN(taskId) || taskId <= 0) {
      this.error = `Geçersiz görev ID: ${task.gorevid}`;
      this.loading = false;
      setTimeout(() => this.error = '', 5000);
      return;
    }

    console.log('🔍 Backend\'e gönderilen task ID:', taskId);
    
    this.managerService.deleteTask(taskId).subscribe({
      next: (response: TaskOperationResponse) => {
        this.loading = false;
        console.log('✅ Görev silindi:', response);

        if (response.success) {
          this.success = response.message || 'Görev başarıyla silindi';
          
          // Tüm görev listelerini yenile
          this.loadTeamTasks(this.currentUser.id);
          this.loadManagerTasks(this.currentUser.id);
          this.loadCompletedTasks(this.currentUser.id);
          
          setTimeout(() => this.success = '', 3000);
        } else {
          this.error = response.message || 'Görev silinemedi';
          setTimeout(() => this.error = '', 5000);
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('❌ Görev silme hatası:', err);
        console.error('❌ Hata detayları:', {
          status: err.status,
          statusText: err.statusText,
          error: err.error,
          message: err.message,
          url: err.url
        });
        
        // Hata objesinin tüm özelliklerini göster
        console.error('❌ Tam hata objesi:', err);
        console.error('❌ Error property:', err.error);
        console.error('❌ Error type:', typeof err.error);
        
        // Daha detaylı hata mesajı
        let errorMessage = 'Görev silinirken hata oluştu';
        
        if (err.status === 400) {
          if (err.error?.message) {
            errorMessage = `Görev silinemedi: ${err.error.message}`;
          } else if (err.error?.detail) {
            errorMessage = `Görev silinemedi: ${err.error.detail}`;
          } else {
            errorMessage = 'Görev silinemedi: Backend hatası';
          }
        } else if (err.status === 404) {
          errorMessage = 'Görev bulunamadı';
        } else if (err.status === 500) {
          errorMessage = 'Sunucu hatası';
        }
        
        this.error = errorMessage;
        setTimeout(() => this.error = '', 5000);
      }
    });
  }

  reportTaskToDirector(task: GorevDto): void {
    if (!task?.gorevid) return;
    this.loading = true;
    this.error = '';
    this.success = '';

    this.managerService.reportTasksToDirector(this.currentUser.id, [task.gorevid]).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response?.success) {
          this.success = response.message || 'Görev direktöre raporlandı';
          // UI: ilgili satırı güncelle
          task.reportedToDirector = true;
          // listeleri tazele
          this.loadTeamTasks(this.currentUser.id);
          setTimeout(() => this.success = '', 2000);
        } else {
          this.error = response?.message || 'Rapor gönderilemedi';
        }
      },
      error: (err: any) => {
        this.loading = false;
        console.error('❌ Rapor gönderme hatası:', err);
        this.error = err?.error?.message || 'Rapor gönderilirken hata oluştu';
      }
    })
  }

  /**
   * Raporlama modal'ını aç
   */
  openReportModal(task: GorevDto): void {
    this.reportingTask = task;
    this.reportForm.reset();
    this.showReportModal = true;
    this.error = '';
    this.success = '';
  }

  /**
   * Raporlama modal'ını kapat
   */
  closeReportModal(): void {
    this.reportingTask = null;
    this.showReportModal = false;
    this.reportForm.reset();
  }

  /**
   * Raporlama form'unu gönder
   */
  onSubmitReport(): void {
    if (!this.reportForm.valid || !this.reportingTask) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const reportDescription = this.reportForm.value.reportDescription;
    console.log('📊 Görev raporlanıyor:', {
      taskId: this.reportingTask.gorevid,
      managerId: this.currentUser.id,
      description: reportDescription
    });

    // Geçici olarak açıklamayı localStorage'da sakla
    const reportKey = `task_report_${this.reportingTask.gorevid}`;
    localStorage.setItem(reportKey, JSON.stringify({
      description: reportDescription,
      managerId: this.currentUser.id,
      reportedAt: new Date().toISOString()
    }));

    // Geçici olarak sadece taskIds ile raporlama yap
    // Backend description desteği eklendiğinde description parametresi eklenebilir
    this.managerService.reportTasksToDirector(this.currentUser.id, [this.reportingTask.gorevid]).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response?.success) {
          this.success = `Görev başarıyla direktöre raporlandı!${reportDescription ? ` (Açıklama: ${reportDescription})` : ''}`;
          // UI: ilgili satırı güncelle
          this.reportingTask!.reportedToDirector = true;
          // listeleri tazele
          this.loadTeamTasks(this.currentUser.id);
          // Modal'ı kapat
          this.closeReportModal();
          setTimeout(() => this.success = '', 5000);
        } else {
          this.error = response?.message || 'Rapor gönderilemedi';
        }
      },
              error: (err: any) => {
          this.loading = false;
          console.error('❌ Rapor gönderme hatası:', err);
          this.error = err?.error?.message || 'Rapor gönderilirken hata oluştu';
          
          // Hata detaylarını göster
          if (err.status === 400) {
            this.error += ' (Backend henüz açıklama alanını desteklemiyor)';
          }
        }
    });
  }

  /**
   * Görev arşivle
   */
  // archiveTask kaldırıldı

  /**
   * Sekme değiştir
   */
  switchTab(tab: 'active' | 'completed'): void {
    this.activeTab = tab;
    console.log('🔄 Sekme değiştirildi:', tab);
  }

  /**
   * Tüm tamamlanan görevleri seç/seçme
   */
  toggleAllCompletedTasks(): void {
    if (this.selectedCompletedTasks.length === this.completedTasks.length) {
      // Tümü seçiliyse, seçimi kaldır
      this.selectedCompletedTasks = [];
    } else {
      // Tümünü seç
      this.selectedCompletedTasks = [...this.completedTasks];
    }
    console.log('📊 Seçili tamamlanan görevler:', this.selectedCompletedTasks.length);
  }

  /**
   * Seçili tamamlanan görevleri direktöre raporla
   */
  reportSelectedCompletedTasksToDirector(): void {
    if (this.selectedCompletedTasks.length === 0) {
      this.error = 'Lütfen raporlanacak görevleri seçin';
      return;
    }

    this.loading = true;
    this.error = '';

    // Her seçili görevi tek tek raporla
    const reportPromises = this.selectedCompletedTasks.map(task => 
      this.managerService.reportTasksToDirector(this.currentUser.id, [task.gorevid])
    );

    Promise.all(reportPromises).then(() => {
      this.success = `${this.selectedCompletedTasks.length} görev başarıyla raporlandı`;
      this.selectedCompletedTasks = [];
      this.loadManagerData(); // Verileri yenile
    }).catch(err => {
      console.error('❌ Toplu raporlama hatası:', err);
      if (err.status === 400) {
        this.error = 'Görevler raporlanırken hata oluştu (Backend henüz açıklama alanını desteklemiyor)';
      } else {
        this.error = 'Görevler raporlanırken hata oluştu';
      }
    }).finally(() => {
      this.loading = false;
    });
  }

  /**
   * Tamamlanan görev seçimini yönet
   */
  // toggleCompletedTaskSelection kaldırıldı

  /**
   * Direktöre rapor edilecek görev seçimini yönet
   */
  // toggleReportDirectorTaskSelection kaldırıldı

  /**
   * Tüm direktöre rapor edilecek görevleri seç/kaldır
   */
  // toggleAllReportDirectorTasks kaldırıldı



  /**
   * Seçili direktör rapor görevlerini direktöre rapor et
   */
  // reportSelectedReportDirectorTasksToDirector kaldırıldı

  /**
   * Seçili tamamlanan görevleri direktöre rapor et
   */
  // reportSelectedCompletedTasksToDirector kaldırıldı



  /**
   * Görev rapor durumunu kontrol et
   */
  // isTaskReported kaldırıldı

}