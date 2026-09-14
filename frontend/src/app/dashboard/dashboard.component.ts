import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="dashboard">
      <h1>Dashboard</h1>
      <p>
        Welcome, {{ auth.username() }}! You are signed in as
        {{ auth.role() }}.
      </p>
      <nav class="quick-nav">
        <a routerLink="/departments">Departments</a>
        <a routerLink="/employees">Employees</a>
        <a routerLink="/pay-periods">Pay Periods</a>
        <a routerLink="/salary-records">Salary Records</a>
        @if (auth.hasRole('ADMIN')) {
          <a routerLink="/users">Users</a>
        }
      </nav>
    </section>
  `,
  styles: [`
    .dashboard { padding: 1rem 0; }
    h1 { margin: 0 0 0.5rem; font-size: 1.5rem; color: #1e293b; }
    p { color: #475569; }
    .quick-nav { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; }
    .quick-nav a {
      padding: 0.4rem 0.85rem;
      background: #f1f5f9;
      border-radius: 0.3rem;
      text-decoration: none;
      color: #334159;
      font-size: 0.9rem;
    }
    .quick-nav a:hover { background: #e2e8f0; }
  `],
})
export class DashboardComponent {
  protected readonly auth = inject(AuthService);
}
