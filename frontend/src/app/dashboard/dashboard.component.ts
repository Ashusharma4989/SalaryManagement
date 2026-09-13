import { Component, inject } from '@angular/core';

import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  template: `
    <section class="dashboard">
      <h1>Dashboard</h1>
      <p>
        Welcome, {{ auth.username() }}! You are signed in as
        {{ auth.role() }}.
      </p>
    </section>
  `,
})
export class DashboardComponent {
  protected readonly auth = inject(AuthService);
}
