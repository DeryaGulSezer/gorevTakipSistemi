import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { GorevService, GorevDto } from '../services/gorev.service';
import { AdminService, UserDto } from '../services/admin.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-ekle',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ekle.html',
  styleUrl: './ekle.scss'
})
export class Ekle implements OnInit {
  gorevForm: FormGroup;
  loading = false;
  error: string | null = null;
  success: string | null = null;

  // Modal & kullanıcı listesi durumu
  showUserSelectModal = false;
  candidateUsers: UserDto[] = [];
  currentUser: UserDto | null = null;

  // Öncelik seçenekleri
  priorityOptions = [
    { value: 'yüksek', label: 'Yüksek', color: 'high' },
    { value: 'orta', label: 'Orta', color: 'medium' },
    { value: 'düşük', label: 'Düşük', color: 'low' }
  ];

  constructor(
    private fb: FormBuilder,
    private gorevService: GorevService,
    private adminService: AdminService,
    private authService: AuthService,
    private router: Router
  ) {
    this.gorevForm = this.createForm();
  }

  ngOnInit(): void {
    // Component başlatıldığında form'u sıfırla
    this.resetForm();

    // Aktif kullanıcıyı al ve aday listesini role göre yükle
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.loadCandidateUsers();
    });
  }

  /**
   * Reactive form oluştur
   */
  private createForm(): FormGroup {
    return this.fb.group({
      isim: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      description: ['', [
        Validators.required,
        Validators.minLength(10),
        Validators.maxLength(500)
      ]],
      userid: ['', [
        Validators.required,
        Validators.min(1)
      ]],
      priority: ['orta', [
        Validators.required
      ]]
    });
  }

  /**
   * Form'u sıfırla
   */
  resetForm(): void {
    this.gorevForm.reset({
      isim: '',
      description: '',
      userid: '',
      priority: 'orta'
    });
    this.error = null;
    this.success = null;
  }

  /**
   * Aday kullanıcıları yükle
   * - Direktör ise: sadece kendisine bağlı müdürler
   * - Müdür ise: sadece kendisine bağlı ekip üyeleri
   */
  private loadCandidateUsers(): void {
    const role = this.currentUser?.role;
    const myId = this.currentUser?.id;

    if (!role || !myId) {
      this.candidateUsers = [];
      return;
    }

    if (role === 'DIRECTOR') {
      // Müdürleri çek ve direktöre bağlı olanları filtrele
      this.adminService.getAllManagers().subscribe({
        next: (managers) => {
          const allManagers = managers || [];
          const assigned = allManagers.filter(m => m.managerId === myId);
          // Eğer hiyerarşi henüz kurulmadıysa, boş sonuç yerine tüm müdürleri göster (geçici çözüm)
          this.candidateUsers = assigned.length > 0 ? assigned : allManagers;
        },
        error: (err) => console.error('Müdürler yüklenirken hata:', err)
      });
    } else if (role === 'MANAGER') {
      // Ekip üyelerini çek ve bu müdüre bağlı olanları filtrele
      this.adminService.getAllUsers().subscribe({
        next: (users) => {
          this.candidateUsers = (users || []).filter(u => u.role === 'TEAM_MEMBER' && u.managerId === myId);
        },
        error: (err) => console.error('Ekip üyeleri yüklenirken hata:', err)
      });
    } else {
      this.candidateUsers = [];
    }
  }

  /**
   * Form submit işlemi
   */
  onSubmit(): void {
    if (this.gorevForm.valid) {
      this.loading = true;
      this.error = null;
      this.success = null;

      const gorevData: Omit<GorevDto, 'gorevid'> = {
        isim: this.gorevForm.value.isim?.trim(),
        description: this.gorevForm.value.description?.trim(),
        userid: Number(this.gorevForm.value.userid),
        priority: this.gorevForm.value.priority,
        status: 'PENDING' // Yeni görevler için default status
      };

      this.gorevService.gorevEkle(gorevData).subscribe({
        next: (response) => {
          this.loading = false;
          this.success = `"${response.isim}" görevi başarıyla eklendi!`;
          this.resetForm();
          
          // 2 saniye sonra görev listesine yönlendir
          setTimeout(() => {
            this.router.navigate(['/all-tasks']);
          }, 2000);
        },
        error: (err) => {
          this.loading = false;
          console.error('Görev eklenirken hata oluştu:', err);
          this.error = 'Görev eklenirken bir hata oluştu. Lütfen tekrar deneyin.';
        }
      });
    } else {
      // Form geçersizse hata mesajlarını göster
      this.markFormGroupTouched();
    }
  }

  /** Modal kontrolü */
  openUserSelect(): void {
    this.showUserSelectModal = true;
  }

  closeUserSelect(): void {
    this.showUserSelectModal = false;
  }

  selectTeamMember(user: UserDto): void {
    this.gorevForm.patchValue({ userid: user.id });
    this.closeUserSelect();
  }

  getSelectedUserDisplay(): string {
    const id = this.gorevForm.get('userid')?.value;
    if (!id) return '';
    const u = this.candidateUsers.find(tm => tm.id === Number(id));
    return u ? `${u.fullName || u.username} (ID: ${u.id})` : `ID: ${id}`;
  }

  trackByUserId(index: number, user: UserDto): number { return user.id; }

  getSelectionLabel(): string {
    return this.currentUser?.role === 'DIRECTOR' ? 'Müdür' : 'Ekip Üyesi';
  }

  /**
   * Tüm form alanlarını touched olarak işaretle (validation mesajlarını göstermek için)
   */
  private markFormGroupTouched(): void {
    Object.keys(this.gorevForm.controls).forEach(key => {
      const control = this.gorevForm.get(key);
      control?.markAsTouched();
    });
  }

  /**
   * Belirli alan için hata mesajı al
   */
  getFieldError(fieldName: string): string | null {
    const field = this.gorevForm.get(fieldName);
    
    if (field && field.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} alanı zorunludur.`;
      }
      if (field.errors['minlength']) {
        const requiredLength = field.errors['minlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} en az ${requiredLength} karakter olmalıdır.`;
      }
      if (field.errors['maxlength']) {
        const maxLength = field.errors['maxlength'].requiredLength;
        return `${this.getFieldLabel(fieldName)} en fazla ${maxLength} karakter olabilir.`;
      }
      if (field.errors['min']) {
        return `${this.getFieldLabel(fieldName)} 1'den büyük olmalıdır.`;
      }
    }
    
    return null;
  }

  /**
   * Alan adından label al
   */
  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'isim': 'Görev Adı',
      'description': 'Açıklama',
      'userid': 'Kullanıcı ID',
      'priority': 'Öncelik'
    };
    return labels[fieldName] || fieldName;
  }

  /**
   * Alan geçerli mi kontrol et
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.gorevForm.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  /**
   * Alan geçerli mi kontrol et
   */
  isFieldValid(fieldName: string): boolean {
    const field = this.gorevForm.get(fieldName);
    return !!(field && field.valid && field.touched);
  }

  /**
   * Görev listesine geri dön
   */
  goBack(): void {
    this.router.navigate(['/all-tasks']);
  }

  /**
   * Seçili öncelik değerini al
   */
  get selectedPriority(): string | null {
    return this.gorevForm.get('priority')?.value || null;
  }

  /**
   * Seçili öncelik için CSS class döndür
   */
  getPriorityClass(): string {
    const currentPriority = this.selectedPriority;
    if (!currentPriority) return 'priority-default';
    
    const priorityOption = this.priorityOptions.find(p => p.value === currentPriority);
    return priorityOption ? `priority-${priorityOption.color}` : 'priority-default';
  }

  /**
   * Seçili öncelik için label döndür
   */
  getPriorityLabel(): string {
    const currentPriority = this.selectedPriority;
    if (!currentPriority) return 'Seçilmedi';
    
    const priorityOption = this.priorityOptions.find(p => p.value === currentPriority);
    return priorityOption ? priorityOption.label : 'Bilinmiyor';
  }
}
