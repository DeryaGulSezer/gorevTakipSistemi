import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { GorevService, GorevDto } from '../services/gorev.service';

@Component({
  selector: 'app-edit',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit.html',
  styleUrl: './edit.scss'
})
export class Edit implements OnInit {
  gorevForm: FormGroup;
  loading = false;
  error: string | null = null;
  success: string | null = null;
  taskLoading = true;
  taskNotFound = false;
  currentTaskId: number | null = null;
  currentTaskStatus: string = 'PENDING'; // Mevcut task'ın status'unu sakla

  // Öncelik seçenekleri
  priorityOptions = [
    { value: 'yüksek', label: 'Yüksek', color: 'high' },
    { value: 'orta', label: 'Orta', color: 'medium' },
    { value: 'düşük', label: 'Düşük', color: 'low' }
  ];

  constructor(
    private fb: FormBuilder,
    private gorevService: GorevService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.gorevForm = this.createForm();
  }

  ngOnInit(): void {
    // Route parametresinden ID'yi al
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.currentTaskId = +id;
        this.loadTask(this.currentTaskId);
      } else {
        this.taskNotFound = true;
        this.taskLoading = false;
      }
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
   * Mevcut görevi yükle
   */
  loadTask(id: number): void {
    this.taskLoading = true;
    this.error = null;

    this.gorevService.gorevGetirById(id).subscribe({
      next: (gorev) => {
        this.taskLoading = false;
        if (gorev) {
          // Mevcut task'ın status'unu sakla
          this.currentTaskStatus = gorev.status || 'PENDING';
          
          // Form'u mevcut görev verileri ile doldur
          this.gorevForm.patchValue({
            isim: gorev.isim,
            description: gorev.description,
            userid: gorev.userid,
            priority: gorev.priority
          });
        } else {
          this.taskNotFound = true;
        }
      },
      error: (err) => {
        this.taskLoading = false;
        console.error('Görev yüklenirken hata oluştu:', err);
        this.error = 'Görev bilgileri yüklenirken bir hata oluştu.';
      }
    });
  }

  /**
   * Form submit işlemi
   */
  onSubmit(): void {
    if (this.gorevForm.valid && this.currentTaskId) {
      this.loading = true;
      this.error = null;
      this.success = null;

      const gorevData: Omit<GorevDto, 'gorevid'> = {
        isim: this.gorevForm.value.isim?.trim(),
        description: this.gorevForm.value.description?.trim(),
        userid: Number(this.gorevForm.value.userid),
        priority: this.gorevForm.value.priority,
        status: this.currentTaskStatus // Mevcut status'u koru
      };

      this.gorevService.gorevGuncelle(this.currentTaskId, gorevData).subscribe({
        next: (response) => {
          this.loading = false;
          this.success = `"${response.isim}" görevi başarıyla güncellendi!`;
          
          // 2 saniye sonra görev listesine yönlendir
          setTimeout(() => {
            this.router.navigate(['/all-tasks']);
          }, 2000);
        },
        error: (err) => {
          this.loading = false;
          console.error('Görev güncellenirken hata oluştu:', err);
          this.error = 'Görev güncellenirken bir hata oluştu. Lütfen tekrar deneyin.';
        }
      });
    } else {
      // Form geçersizse hata mesajlarını göster
      this.markFormGroupTouched();
    }
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

  /**
   * Görev listesine geri dön
   */
  goBack(): void {
    this.router.navigate(['/all-tasks']);
  }

  /**
   * Formu orijinal değerlerle resetle
   */
  resetForm(): void {
    if (this.currentTaskId) {
      this.loadTask(this.currentTaskId);
    }
    this.error = null;
    this.success = null;
  }
}
