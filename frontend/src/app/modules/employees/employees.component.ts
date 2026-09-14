import { Component, signal, OnInit, inject } from '@angular/core';
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
import { DepartmentDTO, EmployeeDTO } from '../../shared/models';

@Component({
  selector: 'app-employees',
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
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.scss'],
})
export class EmployeesComponent implements OnInit {
  protected readonly employees = signal<EmployeeDTO[]>([]);
  protected readonly departments = signal<DepartmentDTO[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(25);

  protected form: FormGroup;

  protected readonly columns: DataTableColumn[] = [
    { key: 'employeeNumber', label: 'Emp. No.', sortable: true, type: 'text' },
    { key: 'firstName', label: 'First Name', type: 'text' },
    { key: 'lastName', label: 'Last Name', type: 'text' },
    { key: 'email', label: 'Email', type: 'text' },
    { key: 'departmentName', label: 'Department', type: 'text' },
    { key: 'location', label: 'Location', type: 'text' },
  ];

  protected readonly actions: DataTableRowAction<EmployeeDTO>[] = [
    { label: '✏', variant: 'ghost', click: (r) => this.edit(r) },
    { label: '🗑', variant: 'danger', click: (r) => this.delete(r) },
  ];

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private snack: SnackbarService,
  ) {
    this.form = this.fb.group({
      employeeNumber: ['', [Validators.required, Validators.maxLength(50)]],
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.email]],
      departmentId: [null],
      location: [''],
      currencyCode: ['', [Validators.minLength(3), Validators.maxLength(3)]],
      hireDate: [''],
    });
  }

  ngOnInit(): void {
    this.load();
    this.loadDepartments();
  }

  load(): void {
    this.loading.set(true);
    this.api.list<EmployeeDTO>('/api/v1/employees', {
      page: this.pageIndex(),
      size: this.pageSize(),
    }).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (res: PagedResponse<EmployeeDTO>) => {
        this.employees.set(res.content);
        this.total.set(res.totalElements);
      },
      error: () => this.snack.error('Failed to load employees'),
    });
  }

  loadDepartments(): void {
    this.api.get<DepartmentDTO[]>('/api/v1/departments').subscribe({
      next: (list) => this.departments.set(list),
      error: () => this.departments.set([]),
    });
  }

  onPageChange({ page, size }: { page: number; size: number }): void {
    this.pageIndex.set(page);
    this.pageSize.set(size);
    this.load();
  }

  edit(emp: EmployeeDTO): void {
    this.editingId.set(emp.id ?? null);
    this.form.patchValue({
      employeeNumber: emp.employeeNumber,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email ?? null,
      departmentId: emp.departmentId ?? null,
      location: emp.location ?? null,
      currencyCode: emp.currencyCode ?? null,
      hireDate: emp.hireDate ?? null,
    });
  }

  add(): void {
    this.editingId.set(null);
    this.form.reset();
  }

  cancel(): void {
    this.editingId.set(null);
    this.form.reset();
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    const dto: EmployeeDTO = {
      id: this.editingId() ?? undefined,
      ...this.form.value,
    };
    this.saving.set(true);
    const obs = dto.id
      ? this.api.put<EmployeeDTO>(`/api/v1/employees/${dto.id}`, dto)
      : this.api.post<EmployeeDTO>('/api/v1/employees', dto);

    obs.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.snack.success(dto.id ? 'Employee updated' : 'Employee created');
        this.cancel();
        this.load();
      },
      error: (err) =>
        this.snack.error(err?.error?.message ?? 'Save failed'),
    });
  }

  delete(emp: EmployeeDTO): void {
    if (!confirm(`Delete employee "${emp.firstName} ${emp.lastName}"?`)) {
      return;
    }
    this.api.delete<void>(`/api/v1/employees/${emp.id}`).subscribe({
      next: () => {
        this.snack.success('Employee deleted');
        this.load();
      },
      error: () => this.snack.error('Delete failed'),
    });
  }

  compareFn(a: unknown, b: unknown): boolean {
    return a === b || (a != null && b != null && a === b);
  }
}
