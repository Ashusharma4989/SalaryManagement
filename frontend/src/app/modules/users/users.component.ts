import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { ApiService, PagedResponse } from '../../shared/services/api.service';
import { SnackbarService } from '../../shared/services/snack-bar.service';
import { DataTableComponent, DataTableColumn, DataTableRowAction } from '../../shared/components/table/data-table.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { FormFieldComponent } from '../../shared/components/form/form-field.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { UserDTO } from '../../shared/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DataTableComponent,
    ButtonComponent,
    FormFieldComponent,
    CardComponent,
    PageHeaderComponent,
  ],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class UsersComponent implements OnInit {
  protected readonly users = signal<UserDTO[]>([]);
  protected readonly loading = signal(false);
  protected readonly creating = signal(false);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(25);

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
    { key: 'employeeId', label: 'Employee ID', type: 'text' },
  ];

  protected readonly actions: DataTableRowAction<UserDTO>[] = [
    { label: '🗑', variant: 'danger', click: (r) => this.delete(r) },
  ];

  protected readonly roleOptions = [
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
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.list<UserDTO>('/api/v1/users', {
      page: this.pageIndex(),
      size: this.pageSize(),
    }).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
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

  resetForm(): void {
    this.form.reset({ role: 'ROLE_HR' });
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
}
