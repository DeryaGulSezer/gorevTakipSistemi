import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService, UserDto, CreateUserRequest, UpdateUserRequest } from '../services/admin.service';
import { GorevDto } from '../services/gorev.service';

@Component({
  selector: 'app-user-management',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss'
})
export class UserManagement implements OnInit {
  users: UserDto[] = [];
  managers: UserDto[] = []; // Müdürler listesi
  reportedTasks: GorevDto[] = []; // Direktöre rapor edilen görevler
  loading = false;
  error: string | null = null;
  success: string | null = null;

  // Form yönetimi
  userForm: FormGroup;
  showCreateForm = false;
  editingUser: UserDto | null = null;

  // Modal state
  showDeleteModal = false;
  userToDelete: UserDto | null = null;

  // Sekme yönetimi
  activeTab: 'users' | 'reports' = 'users';

  constructor(
    private adminService: AdminService,
    private fb: FormBuilder
  ) {
    this.userForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      email: ['', [Validators.required, Validators.email]],
      fullName: ['', [Validators.required]],
      role: ['TEAM_MEMBER', [Validators.required]],
      managerType: ['', [Validators.required]], // Müdür tipi - zorunlu
      managerId: [null, [Validators.required]] // Ekip üyesi için başlangıçta zorunlu
    });
    
    // Rol değişikliği dinleyicisini kur
    this.setupRoleChangeListener();
  }

  ngOnInit(): void {
    this.loadUsers();
    this.loadManagers();
    this.loadReportedTasks();
  }

  /**
   * Kullanıcıları yükle
   */
  loadUsers(): void {
    this.loading = true;
    this.error = null;

    this.adminService.getAllUsers().subscribe({
      next: (users) => {
        // "teammember" adlı varsayılan kullanıcıyı listeden gizle (sunum/demonstrasyon için)
        this.users = users.filter(u => !(u.role === 'TEAM_MEMBER' && (u.username?.toLowerCase() === 'teammember' || u.fullName?.toLowerCase() === 'teammember')));
        this.loading = false;
      },
      error: (err) => {
        console.error('Kullanıcılar yüklenirken hata:', err);
        this.error = 'Kullanıcılar yüklenirken bir hata oluştu.';
        this.loading = false;
      }
    });
  }

  /**
   * Müdürleri yükle
   */
  loadManagers(): void {
    this.adminService.getAllManagers().subscribe({
      next: (managers) => {
        this.managers = managers;
      },
      error: (err) => {
        console.error('Müdürler yüklenirken hata:', err);
        // Müdür listesi kritik değil, error göstermiyoruz
      }
    });
  }

  /**
   * Rapor edilen görevleri yükle
   */
  loadReportedTasks(): void {
    this.adminService.getReportedTasks().subscribe({
      next: (tasks) => {
        this.reportedTasks = tasks;
        console.log('📊 Rapor edilen görevler yüklendi:', tasks.length);
      },
      error: (err) => {
        console.error('❌ Rapor edilen görevler yüklenemedi:', err);
      }
    });
  }

  /**
   * Yeni kullanıcı oluşturma formunu aç/kapat
   */
  toggleCreateForm(): void {
    this.showCreateForm = !this.showCreateForm;
    this.editingUser = null;
    this.resetForm();
    this.clearMessages();
  }

  /**
   * Kullanıcı düzenleme formunu aç
   */
  editUser(user: UserDto): void {
    this.editingUser = user;
    this.showCreateForm = true;
    
    // Form'u doldur (şifre hariç)
    this.userForm.patchValue({
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      managerType: user.managerType || '',
      managerId: user.managerId || null,
      password: '' // Şifre boş bırakılacak
    });

    // Düzenleme modunda şifre zorunlu değil
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    
    this.clearMessages();
  }

  /**
   * Form gönderme
   */
  onSubmit(): void {
    if (this.userForm.valid) {
      if (this.editingUser) {
        this.updateUser();
      } else {
        this.createUser();
      }
    } else {
      this.markFormGroupTouched();
    }
  }

  /**
   * Yeni kullanıcı oluştur
   */
  createUser(): void {
    const formValue = this.userForm.value;
    const request: CreateUserRequest = {
      username: formValue.username,
      password: formValue.password,
      email: formValue.email,
      fullName: formValue.fullName,
      role: formValue.role,
      managerType: formValue.managerType || undefined
    };

    // Ekip üyesi ise müdür atama
    if (formValue.role === 'TEAM_MEMBER' && formValue.managerId) {
      request.managerId = formValue.managerId;
    }

    this.loading = true;
    this.error = null;

    this.adminService.createUser(request).subscribe({
      next: (newUser) => {
        this.success = `Kullanıcı "${newUser.username}" başarıyla oluşturuldu!`;
        this.users.push(newUser);
        this.resetForm();
        this.showCreateForm = false;
        this.loading = false;
        
        setTimeout(() => this.success = null, 5000);
      },
      error: (err) => {
        console.error('Kullanıcı oluşturulurken hata:', err);
        if (err.status === 409) {
          this.error = 'Bu kullanıcı adı zaten mevcut!';
        } else {
          this.error = 'Kullanıcı oluşturulurken bir hata oluştu.';
        }
        this.loading = false;
      }
    });
  }

  /**
   * Kullanıcıyı güncelle
   */
  updateUser(): void {
    if (!this.editingUser) return;

    const formValue = this.userForm.value;
    const request: UpdateUserRequest = {
      username: formValue.username,
      email: formValue.email,
      fullName: formValue.fullName,
      role: formValue.role,
      managerType: formValue.managerType || undefined
    };

    // Ekip üyesi ise müdür atama
    if (formValue.role === 'TEAM_MEMBER' && formValue.managerId) {
      request.managerId = formValue.managerId;
    }

    // Şifre varsa ekle
    if (formValue.password && formValue.password.trim() !== '') {
      (request as any).password = formValue.password;
    }

    this.loading = true;
    this.error = null;

    this.adminService.updateUser(this.editingUser.id, request).subscribe({
      next: (updatedUser) => {
        this.success = `Kullanıcı "${updatedUser.username}" başarıyla güncellendi!`;
        
        // Listede güncelle
        const index = this.users.findIndex(u => u.id === updatedUser.id);
        if (index !== -1) {
          this.users[index] = updatedUser;
        }
        
        this.resetForm();
        this.showCreateForm = false;
        this.editingUser = null;
        this.loading = false;
        
        setTimeout(() => this.success = null, 5000);
      },
      error: (err) => {
        console.error('Kullanıcı güncellenirken hata:', err);
        if (err.status === 409) {
          this.error = 'Bu kullanıcı adı zaten mevcut!';
        } else {
          this.error = 'Kullanıcı güncellenirken bir hata oluştu.';
        }
        this.loading = false;
      }
    });
  }

  /**
   * Silme modalını aç
   */
  openDeleteModal(user: UserDto): void {
    this.userToDelete = user;
    this.showDeleteModal = true;
    this.clearMessages();
  }

  /**
   * Silme modalını kapat
   */
  closeDeleteModal(): void {
    this.userToDelete = null;
    this.showDeleteModal = false;
  }

  /**
   * Kullanıcıyı sil
   */
  confirmDelete(): void {
    if (!this.userToDelete) return;

    this.loading = true;
    this.error = null;

    this.adminService.deleteUser(this.userToDelete.id).subscribe({
      next: (message) => {
        this.success = `Kullanıcı "${this.userToDelete!.username}" başarıyla silindi!`;
        this.users = this.users.filter(u => u.id !== this.userToDelete!.id);
        this.closeDeleteModal();
        this.loading = false;
        
        setTimeout(() => this.success = null, 5000);
      },
      error: (err) => {
        console.error('Kullanıcı silinirken hata:', err);
        if (err.status === 404) {
          this.error = 'Kullanıcı bulunamadı!';
        } else {
          this.error = err.error || 'Kullanıcı silinirken bir hata oluştu.';
        }
        this.closeDeleteModal();
        this.loading = false;
      }
    });
  }

  /**
   * Form'u sıfırla
   */
  resetForm(): void {
    this.userForm.reset({
      username: '',
      password: '',
      email: '',
      fullName: '',
      role: 'TEAM_MEMBER',
      managerId: null
    });

    // Şifre validation'ını geri ekle
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(6)]);
    this.userForm.get('password')?.updateValueAndValidity();
    
    // Rol değişikliği dinleyicisi
    this.setupRoleChangeListener();
  }

  /**
   * Rol değişikliği dinleyicisi kur
   */
  setupRoleChangeListener(): void {
    this.userForm.get('role')?.valueChanges.subscribe(role => {
      const managerControl = this.userForm.get('managerId');
      const managerTypeControl = this.userForm.get('managerType');
      
      if (role === 'TEAM_MEMBER') {
        // Ekip üyesi seçildiğinde müdür seçimi zorunlu, müdür tipi opsiyonel
        managerControl?.setValidators([Validators.required]);
        managerTypeControl?.clearValidators();
        managerTypeControl?.setValue('');
      } else if (role === 'MANAGER') {
        // Müdür seçildiğinde müdür tipi zorunlu, müdür seçimi opsiyonel
        managerControl?.clearValidators();
        managerControl?.setValue(null);
        managerTypeControl?.setValidators([Validators.required]);
      } else {
        // Direktör seçildiğinde her ikisi de opsiyonel
        managerControl?.clearValidators();
        managerControl?.setValue(null);
        managerTypeControl?.clearValidators();
        managerTypeControl?.setValue('');
      }
      
      managerControl?.updateValueAndValidity();
      managerTypeControl?.updateValueAndValidity();
    });
  }

  /**
   * Form alanlarını touched yap
   */
  markFormGroupTouched(): void {
    Object.keys(this.userForm.controls).forEach(key => {
      this.userForm.get(key)?.markAsTouched();
    });
  }

  /**
   * Mesajları temizle
   */
  clearMessages(): void {
    this.error = null;
    this.success = null;
  }

  /**
   * Form validation helper'ları
   */
  isFieldInvalid(fieldName: string): boolean {
    if (fieldName === 'userId') {
      const userId = this.userForm.get('userId')?.value;
      return !userId;
    }
    
    const field = this.userForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.userForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${fieldName} gereklidir.`;
      if (field.errors['minlength']) return `${fieldName} en az ${field.errors['minlength'].requiredLength} karakter olmalıdır.`;
      if (field.errors['email']) return 'Geçerli bir email adresi giriniz.';
    }
    return '';
  }

  /**
   * Rol badge class'ı
   */
  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'DIRECTOR': return 'role-director';
      case 'MANAGER': return 'role-manager';
      case 'TEAM_MEMBER': return 'role-team-member';
      default: return 'role-default';
    }
  }

  /**
   * Rol gösterim metni
   */
  getRoleDisplayText(role: string): string {
    switch (role) {
      case 'DIRECTOR': return '🏢 Direktör';
      case 'MANAGER': return '👨‍💼 Müdür';
      case 'TEAM_MEMBER': return '👤 Ekip Üyesi';
      default: return role;
    }
  }

  /**
   * Müdür adını getir
   */
  getManagerName(user: UserDto): string {
    if (!user.managerId) return '-';
    const manager = this.users.find(u => u.id === user.managerId);
    if (!manager) return 'Bilinmiyor';
    const base = manager.fullName || manager.username;
    return manager.managerType ? `${base} (${manager.managerType})` : base;
  }

  /**
   * Kullanıcı durumu
   */
  getUserStatusText(user: UserDto): string {
    return user.isActive !== false ? 'Aktif' : 'Pasif';
  }

  getUserStatusClass(user: UserDto): string {
    return user.isActive !== false ? 'status-active' : 'status-inactive';
  }

  

  /**
   * TrackBy fonksiyonu - performans için
   */
  trackByUserId(index: number, user: UserDto): number {
    return user.id;
  }

  /**
   * Sekme değiştir
   */
  switchTab(tab: 'users' | 'reports'): void {
    this.activeTab = tab;
  }

  /**
   * Görev atayan müdürün adını getir
   */
  getAssignerName(task: GorevDto): string {
    // Task'ın oluşturan/atayan kişinin bilgisi olmadığı için basit bir çözüm
    const user = this.users.find(u => u.id === task.userid);
    return user?.fullName || 'Bilinmiyor';
  }

  /**
   * Öncelik sınıfını getir
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
   * TrackBy function for tasks
   */
  trackByTaskId(index: number, task: GorevDto): number {
    return task.gorevid;
  }
}