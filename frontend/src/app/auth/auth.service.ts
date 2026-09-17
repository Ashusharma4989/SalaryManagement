import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'auth_sid';
  private readonly userKey = 'auth_user';
  private readonly roleKey = 'auth_role';

  private readonly _token = signal<string | null>(this.read(this.tokenKey));
  private readonly _user = signal<string | null>(this.read(this.userKey));
  private readonly _role = signal<string | null>(this.read(this.roleKey));

  readonly token = this._token.asReadonly();
  readonly username = this._user.asReadonly();
  readonly role = this._role.asReadonly();

  readonly isAuthenticated = computed(() => !!this._token());

  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string) {
    return this.http
      .post<LoginResponse>('/api/v1/auth/login', { username, password })
      .pipe(
        tap((res) => {
          this._token.set(res.token);
          this._user.set(res.username);
          this._role.set(res.role);
          localStorage.setItem(this.tokenKey, res.token);
          localStorage.setItem(this.userKey, res.username);
          localStorage.setItem(this.roleKey, res.role);
        })
      );
  }

  logout() {
    const token = this._token();
    if (token) {
      this.http.post('/api/v1/auth/logout', {}).subscribe({
        next: () => this.clearAuth(),
        error: () => this.clearAuth(),
      });
    } else {
      this.clearAuth();
    }
  }

  private clearAuth(): void {
    this._token.set(null);
    this._user.set(null);
    this._role.set(null);
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.roleKey);
    this.router.navigate(['/login']);
  }

  hasRole(...roles: string[]): boolean {
    const r = this._role();
    if (!r) {
      return false;
    }
    return roles.some(
      (role) => r === role || r === `ROLE_${role}` || r === `role-${role}`
    );
  }

  private read(key: string): string | null {
    return typeof localStorage !== 'undefined'
      ? localStorage.getItem(key)
      : null;
  }
}
