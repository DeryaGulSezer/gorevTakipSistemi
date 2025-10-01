import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginRequest } from '../services/auth.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login implements OnInit {
  loginForm: FormGroup;
  loading = false;
  error: string | null = null;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.createForm();
  }

  ngOnInit(): void {
    // Eğer zaten giriş yapılmışsa uygun sayfaya yönlendir
    if (this.authService.isLoggedInSync()) {
      this.redirectBasedOnRole();
    }
  }

  /**
   * Login formu oluştur
   */
  private createForm(): FormGroup {
    return this.fb.group({
      usernameOrEmail: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(3)]]
    });
  }

  /**
   * Login işlemi
   */
  onSubmit(): void {
    console.log('🚀 Login form submit edildi');
    console.log('📝 Form valid mi?', this.loginForm.valid);
    
    if (this.loginForm.valid) {
      this.loading = true;
      this.error = null;

      const loginRequest: LoginRequest = {
        usernameOrEmail: this.loginForm.value.usernameOrEmail.trim(),
        password: this.loginForm.value.password
      };
      
      console.log('📨 Login request gönderiliyor:', {
        usernameOrEmail: loginRequest.usernameOrEmail,
        password: '***'
      });

      this.authService.login(loginRequest).subscribe({
        next: (response) => {
          this.loading = false;
          console.log('📥 Login response alındı:', response);
          console.log('🔍 Response.token var mı?', !!response.token);
          
          if (response.token) {
            console.log('✅ Token mevcut, giriş başarılı:', response.username);
            
            // User state'in set edilmesi için kısa delay
            console.log('⏰ setTimeout ile redirect çağrılacak...');
            setTimeout(() => {
              console.log('🎯 setTimeout tetiklendi, redirect çağrılıyor...');
              this.redirectBasedOnRole();
            }, 100);
          } else {
            console.log('❌ Token yok! Response:', response);
            this.error = response.message || 'Giriş başarısız!';
          }
        },
        error: (err) => {
          this.loading = false;
          console.error('Login hatası:', err);
          
          if (err.error && err.error.message) {
            this.error = err.error.message;
          } else if (err.status === 401) {
            this.error = 'Kullanıcı adı veya şifre hatalı!';
          } else if (err.status === 0) {
            this.error = 'Sunucuya bağlanılamıyor. Lütfen daha sonra tekrar deneyin.';
          } else {
            this.error = 'Giriş işlemi sırasında bir hata oluştu!';
          }
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  /**
   * Role göre yönlendirme
   */
  private redirectBasedOnRole(): void {
    const user = this.authService.getCurrentUserSync();
    
    console.log('🔄 Redirect için user bilgisi:', user);
    
    if (user) {
      console.log('🎯 User rolü:', user.role);
      
      if (user.role === 'DIRECTOR') {
        console.log('➡️ Direktör -> /all-tasks');
        this.router.navigate(['/all-tasks']);
      } else if (user.role === 'MANAGER') {
        console.log('➡️ Müdür -> /manager-panel');
        this.router.navigate(['/manager-panel']); // Gelecekte müdür paneli
      } else if (user.role === 'TEAM_MEMBER') {
        console.log('➡️ Ekip üyesi -> /user-tasks');
        this.router.navigate(['/user-tasks']);
      } else {
        console.log('❌ Bilinmeyen rol -> /login');
        this.router.navigate(['/login']);
      }
    } else {
      console.log('❌ User bilgisi yok -> /login');
      this.router.navigate(['/login']);
    }
  }

  /**
   * Şifre görünürlüğünü toggle et
   */
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  /**
   * Form alanı geçersiz mi?
   */
  isFieldInvalid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  /**
   * Form alanı geçerli mi?
   */
  isFieldValid(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.valid && (field.dirty || field.touched));
  }

  /**
   * Field hatası mesajını al
   */
  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return fieldName === 'usernameOrEmail' 
          ? 'Kullanıcı adı veya email gerekli!' 
          : 'Şifre gerekli!';
      }
      if (field.errors['minlength']) {
        return fieldName === 'usernameOrEmail' 
          ? 'Kullanıcı adı en az 3 karakter olmalı!' 
          : 'Şifre en az 3 karakter olmalı!';
      }
    }
    
    return '';
  }

  /**
   * Tüm form alanlarını touched yap
   */
  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }




}