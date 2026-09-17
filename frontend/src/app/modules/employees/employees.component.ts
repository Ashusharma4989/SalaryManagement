import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { ApiService, PagedResponse } from '../../shared/services/api.service';
import { SnackbarService } from '../../shared/services/snack-bar.service';
import { DataTableColumn, DataTableRowAction } from '../../shared/components/table/data-table.component';
import { FormFieldComponent } from '../../shared/components/form/form-field.component';
import { PageTemplateComponent } from '../../shared/components/page-template/page-template.component';
import { DepartmentDTO, EmployeeDTO } from '../../shared/models';
import { SelectOption } from '../../shared/components/form/form-field.component';

@Component({
  selector: 'app-employees',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormFieldComponent,
    PageTemplateComponent,
  ],
  templateUrl: './employees.component.html',
  styleUrls: ['./employees.component.scss'],
})
export class EmployeesComponent implements OnInit {
  protected readonly employees = signal<EmployeeDTO[] | null>(null);
  protected readonly departments = signal<DepartmentDTO[]>([]);
  protected readonly saving = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(25);
  protected readonly searchTerm = signal('');
  protected readonly sortField = signal<string | null>(null);
  protected readonly sortDirection = signal<'asc' | 'desc'>('asc');

  protected form: FormGroup;

  protected readonly columns: DataTableColumn[] = [
    { key: 'employeeNumber', label: 'Emp. No.', sortable: true, type: 'text' },
    { key: 'firstName', label: 'First Name', sortable: true, type: 'text' },
    { key: 'lastName', label: 'Last Name', sortable: true, type: 'text' },
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
      currencyCode: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
      hireDate: [''],
    });
  }

  ngOnInit(): void {
    this.load();
    this.loadDepartments();
  }

  load(): void {
    this.employees.set(null);
    let settled = false;

    const minDisplay = setTimeout(() => {
      if (!settled && this.employees() === null) {
        this.employees.set([]);
      }
    }, 300);

    const safety = setTimeout(() => {
      if (!settled && this.employees() === null) {
        this.employees.set([]);
      }
    }, 5000);

    this.api
      .list<EmployeeDTO>('/api/v1/employees', {
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
          if (this.employees() === null) {
            this.employees.set([]);
          }
        })
      )
      .subscribe({
        next: (res: PagedResponse<EmployeeDTO>) => {
          this.employees.set(res.content);
          this.total.set(res.totalElements);
        },
        error: () => this.snack.error('Failed to load employees'),
      });
  }

  loadDepartments(): void {
    this.api.list<DepartmentDTO>('/api/v1/departments').subscribe({
      next: (res: PagedResponse<DepartmentDTO>) => {
        this.departments.set(res.content);
      },
      error: () => {
        this.departments.set([]);
        this.snack.error('Failed to load departments');
      },
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

  get departmentOptions(): SelectOption[] {
    const deps = this.departments();
    if (!Array.isArray(deps)) return [];
    return deps.map((d) => ({ value: d.id, label: d.name }));
  }
}
