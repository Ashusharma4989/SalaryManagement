import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { ApiService, PagedResponse } from '../../shared/services/api.service';
import { SnackbarService } from '../../shared/services/snack-bar.service';
import { DataTableColumn, DataTableRowAction } from '../../shared/components/table/data-table.component';
import { FormFieldComponent, SelectOption } from '../../shared/components/form/form-field.component';
import { PageTemplateComponent } from '../../shared/components/page-template/page-template.component';
import { UserDTO, EmployeeDTO } from '../../shared/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormFieldComponent,
    PageTemplateComponent,
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit {
  protected readonly users = signal<UserDTO[] | null>(null);
  protected readonly employees = signal<EmployeeDTO[]>([]);
  protected readonly creating = signal(false);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(25);
  protected readonly searchTerm = signal('');
  protected readonly sortField = signal<string | null>(null);
  protected readonly sortDirection = signal<'asc' | 'desc'>('asc');

  protected form: FormGroup;

  protected readonly columns: DataTableColumn[] = [
    { key: 'username', label: 'Username', sortable: true, type: 'text' },
    {
      key: 'role',
      label: 'Role',
      type: 'text',
      render: (v) => {
        const r = (v as string) ?? '';
        if (r === 'ROLE_ADMIN') return 'Admin';
        if (r === 'ROLE_HR') return 'HR';
        return r;
      },
    },
    {
      key: 'employeeId',
      label: 'Employee',
      type: 'text',
      render: (v) => {
        const emp = this.employees().find((e) => e.id === v);
        return emp ? `${emp.firstName} ${emp.lastName}` : String(v ?? '');
      },
    },
  ];

  protected readonly actions: DataTableRowAction<UserDTO>[] = [
    { label: '🗑', variant: 'danger', click: (r) => this.delete(r) },
  ];

  protected readonly roleOptions: SelectOption[] = [
    { value: 'ROLE_HR', label: 'HR User' },
    { value: 'ROLE_ADMIN', label: 'Admin' },
  ];

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private snack: SnackbarService,
  ) {
    this.form = this.fb.group({
      username: ['', [Validators.required, Validators.maxLength(50)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      role: ['ROLE_HR', Validators.required],
      employeeId: [null],
    });
  }

  ngOnInit(): void {
    this.load();
    this.loadEmployees();
  }

  load(): void {
    this.users.set(null);
    let settled = false;

    const minDisplay = setTimeout(() => {
      if (!settled && this.users() === null) {
        this.users.set([]);
      }
    }, 300);

    const safety = setTimeout(() => {
      if (!settled && this.users() === null) {
        this.users.set([]);
      }
    }, 5000);

    this.api
      .list<UserDTO>('/api/v1/users', {
        page: this.pageIndex(),
        size: this.pageSize(),
        search: this.searchTerm(),
        sort: this.sortField() ? `${this.sortField()},${this.sortDirection()}` : undefined,
      })
      .pipe(
        finalize(() => {
          settled = true;
          clearTimeout(minDisplay);
          clearTimeout(safety);
          if (this.users() === null) {
            this.users.set([]);
          }
        })
      )
      .subscribe({
        next: (res: PagedResponse<UserDTO>) => {
          this.users.set(res.content);
          this.total.set(res.totalElements);
        },
      error: () => this.snack.error('Failed to load users'),
    });
  }

  onPageChange({ page, size }: { page: number; size: number }): void {
    this.pageIndex.set(page);
    this.pageSize.set(size);
    this.load();
  }

  onSort(field: string, direction: 'asc' | 'desc'): void {
    this.sortField.set(field);
    this.sortDirection.set(direction);
    this.load();
  }

  onSearch(term: string): void {
    this.searchTerm.set(term);
    this.pageIndex.set(0);
    this.load();
  }

  loadEmployees(): void {
    this.api.list<EmployeeDTO>('/api/v1/employees').subscribe({
      next: (res: PagedResponse<EmployeeDTO>) => {
        this.employees.set(res.content);
      },
      error: () => {
        this.employees.set([]);
        this.snack.error('Failed to load employees');
      },
    });
  }

  resetForm(): void {
    this.form.reset({ role: 'ROLE_HR', employeeId: null });
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    this.creating.set(true);
    this.api.post<UserDTO>('/api/v1/auth/register', this.form.value).pipe(
      finalize(() => this.creating.set(false))
    ).subscribe({
      next: () => {
        this.snack.success(`User created (${this.form.value.role})`);
        this.resetForm();
        this.load();
      },
      error: (err) =>
        this.snack.error(err?.error?.message ?? 'Create failed'),
    });
  }

  delete(user: UserDTO): void {
    if (!confirm(`Delete user "${user.username}"?`)) {
      return;
    }
    this.api.delete<void>(`/api/v1/users/${user.id}`).subscribe({
      next: () => {
        this.snack.success('User deleted');
        this.load();
      },
      error: () => this.snack.error('Delete failed'),
    });
  }

  get employeeOptions(): SelectOption[] {
    const emps = this.employees();
    if (!Array.isArray(emps)) return [];
    return emps.map((e) => ({
      value: e.id,
      label: `${e.firstName} ${e.lastName} (${e.employeeNumber})`,
    }));
  }
}
