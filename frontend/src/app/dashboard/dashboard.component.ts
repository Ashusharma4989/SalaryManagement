import { Component, signal, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { ApiService, PagedResponse } from '../shared/services/api.service';
import { DepartmentDTO, EmployeeDTO, PayPeriodDTO, SalaryRecordDTO } from '../shared/models';

interface SummaryCard {
  title: string;
  count: number;
  route: string;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  protected readonly cards = signal<SummaryCard[]>([
    { title: 'Departments', count: 0, route: '/departments', color: 'blue' },
    { title: 'Employees', count: 0, route: '/employees', color: 'green' },
    { title: 'Pay Periods', count: 0, route: '/pay-periods', color: 'purple' },
    { title: 'Salary Records', count: 0, route: '/salary-records', color: 'amber' },
  ]);

  ngOnInit(): void {
    this.loadCounts();
  }

  private loadCounts(): void {
    this.api.list<DepartmentDTO>('/api/v1/departments').subscribe({
      next: (res: PagedResponse<DepartmentDTO>) => {
        this.updateCardCount('Departments', res.totalElements);
      },
      error: () => {},
    });

    this.api.list<EmployeeDTO>('/api/v1/employees').subscribe({
      next: (res: PagedResponse<EmployeeDTO>) => {
        this.updateCardCount('Employees', res.totalElements);
      },
      error: () => {},
    });

    this.api.list<PayPeriodDTO>('/api/v1/pay-periods').subscribe({
      next: (res: PagedResponse<PayPeriodDTO>) => {
        this.updateCardCount('Pay Periods', res.totalElements);
      },
      error: () => {},
    });

    this.api.list<SalaryRecordDTO>('/api/v1/salary-records').subscribe({
      next: (res: PagedResponse<SalaryRecordDTO>) => {
        this.updateCardCount('Salary Records', res.totalElements);
      },
      error: () => {},
    });
  }

  private updateCardCount(title: string, count: number): void {
    this.cards.update((cards) =>
      cards.map((c) => (c.title === title ? { ...c, count } : c))
    );
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }
}
