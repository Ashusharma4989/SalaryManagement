import { Routes } from '@angular/router';

import { authGuard } from './auth/auth.guard';
import { LoginComponent } from './auth/login/login.component';
import { ShellComponent } from './shell/shell.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { UsersComponent } from './modules/users/users.component';
import { DepartmentsComponent } from './modules/departments/departments.component';
import { EmployeesComponent } from './modules/employees/employees.component';
import { PayPeriodsComponent } from './modules/pay-periods/pay-periods.component';
import { SalaryRecordsComponent } from './modules/salary-records/salary-records.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard()],
    children: [
      { path: '', component: DashboardComponent },
      { path: 'departments', component: DepartmentsComponent },
      { path: 'employees', component: EmployeesComponent },
      { path: 'pay-periods', component: PayPeriodsComponent },
      { path: 'salary-records', component: SalaryRecordsComponent },
      {
        path: 'users',
        component: UsersComponent,
        canActivate: [authGuard(['ADMIN'])],
      },
    ],
  },
  { path: '**', redirectTo: '/login' },
];
