import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService, UserDto } from './services/auth.service';

@Component({
  selector: 'app-root',
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('Görev Takip Sistemi');
  
  currentUser: UserDto | null = null;
  isLoggedIn = false;
  private subscriptions: Subscription[] = [];

  constructor(
    public router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Auth state değişikliklerini dinle
    const userSub = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    const loginSub = this.authService.isLoggedIn$.subscribe(isLoggedIn => {
      this.isLoggedIn = isLoggedIn;
    });

    this.subscriptions.push(userSub, loginSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Login sayfasında mı kontrol et
   */
  isLoginPage(): boolean {
    return this.router.url === '/login';
  }

  /**
   * Kullanıcı panelinde mi kontrol et
   */
  isUserPanel(): boolean {
    return this.router.url === '/user-tasks';
  }

  /**
   * Admin panelinde mi kontrol et
   */
  isAdminPanel(): boolean {
    return this.router.url !== '/user-tasks' && this.router.url !== '/login';
  }

  /**
   * Direktör mü?
   */
  isDirector(): boolean {
    return this.currentUser?.role === 'DIRECTOR';
  }

  /**
   * Müdür mü?
   */
  isManager(): boolean {
    return this.currentUser?.role === 'MANAGER';
  }

  /**
   * Ekip üyesi mi?
   */
  isTeamMember(): boolean {
    return this.currentUser?.role === 'TEAM_MEMBER';
  }

  /**
   * Kullanıcı avatarını getir
   */
  getUserAvatar(): string {
    switch (this.currentUser?.role) {
      case 'DIRECTOR': return '🏢';
      case 'MANAGER': return '👨‍💼';
      case 'TEAM_MEMBER': return '👤';
      default: return '👤';
    }
  }

  /**
   * Kullanıcı rol metnini getir
   */
  getUserRoleText(): string {
    switch (this.currentUser?.role) {
      case 'DIRECTOR': return 'Direktör';
      case 'MANAGER': return 'Müdür';
      case 'TEAM_MEMBER': return 'Ekip Üyesi';
      default: return 'Kullanıcı';
    }
  }

  // Backward compatibility (geçici)
  isAdmin(): boolean {
    return this.isDirector();
  }

  isUser(): boolean {
    return this.isTeamMember();
  }

  /**
   * Çıkış işlemi
   */
  logout(): void {
    if (confirm('Çıkış yapmak istediğinizden emin misiniz?')) {
      this.authService.logout().subscribe({
        next: () => {
          console.log('Çıkış başarılı');
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error('Çıkış hatası:', err);
          // Hata olsa bile force logout yap
          this.authService.forceLogout();
          this.router.navigate(['/login']);
        }
      });
    }
  }
}
