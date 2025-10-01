import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, map, catchError, of } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    
    // Token var mı kontrol et
    if (!this.authService.hasToken()) {
      console.log('AuthGuard: Token yok, login sayfasına yönlendiriliyor');
      this.router.navigate(['/login']);
      return of(false);
    }

    // Token varsa kullanıcı bilgilerini doğrula
    return this.authService.getCurrentUser().pipe(
      map(user => {
        if (user) {
          // Route data'sından gerekli rol bilgisini al
          const requiredRole = route.data?.['role'];
          
          if (requiredRole) {
            // Rol kontrolü yap
            if (user.role === requiredRole) {
              return true;
            } else {
              console.log(`AuthGuard: Yetkisiz erişim! Gerekli rol: ${requiredRole}, Kullanıcı rolü: ${user.role}`);
              
              // Yetkisiz erişim - kullanıcıyı kendi sayfasına yönlendir
              if (user.role === 'DIRECTOR') {
                this.router.navigate(['/all-tasks']);
              } else if (user.role === 'MANAGER') {
                this.router.navigate(['/manager-panel']); // Müdür paneli (gelecekte)
              } else {
                this.router.navigate(['/user-tasks']);
              }
              return false;
            }
          }
          
          // Rol kontrolü gerekmiyorsa geçerli kullanıcı varsa geçir
          return true;
        } else {
          // Kullanıcı bilgisi alınamadı
          console.log('AuthGuard: Kullanıcı bilgisi alınamadı, login sayfasına yönlendiriliyor');
          this.router.navigate(['/login']);
          return false;
        }
      }),
      catchError(error => {
        console.log('AuthGuard: Token doğrulama hatası, login sayfasına yönlendiriliyor', error);
        
        // Token geçersiz - temizle ve login'e yönlendir
        this.authService.forceLogout();
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}

/**
 * Admin-only routes için özel guard
 */
@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    
    if (!this.authService.hasToken()) {
      this.router.navigate(['/login']);
      return of(false);
    }

    return this.authService.getCurrentUser().pipe(
      map(user => {
        if (user && user.role === 'DIRECTOR') {
          return true;
        } else {
          console.log('AdminGuard: Direktör yetkisi gerekli!');
          
          // Diğer kullanıcıları kendi sayfalarına yönlendir
          if (user && user.role === 'MANAGER') {
            this.router.navigate(['/manager-panel']); // Müdür paneli (gelecekte)
          } else if (user && user.role === 'TEAM_MEMBER') {
            this.router.navigate(['/user-tasks']);
          } else {
            this.router.navigate(['/login']);
          }
          return false;
        }
      }),
      catchError(error => {
        console.log('AdminGuard: Hata oluştu, login sayfasına yönlendiriliyor', error);
        this.authService.forceLogout();
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}

/**
 * User-only routes için özel guard
 */
@Injectable({
  providedIn: 'root'
})
export class UserGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    
    if (!this.authService.hasToken()) {
      this.router.navigate(['/login']);
      return of(false);
    }

    return this.authService.getCurrentUser().pipe(
      map(user => {
        if (user && (user.role === 'TEAM_MEMBER' || user.role === 'MANAGER')) {
          return true;
        } else {
          console.log('UserGuard: Ekip üyesi veya müdür yetkisi gerekli!');
          
          // Direktörü kendi sayfasına yönlendir
          if (user && user.role === 'DIRECTOR') {
            this.router.navigate(['/all-tasks']);
          } else {
            this.router.navigate(['/login']);
          }
          return false;
        }
      }),
      catchError(error => {
        console.log('UserGuard: Hata oluştu, login sayfasına yönlendiriliyor', error);
        this.authService.forceLogout();
        this.router.navigate(['/login']);
        return of(false);
      })
    );
  }
}