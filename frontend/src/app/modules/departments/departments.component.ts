import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { ApiService, PagedResponse } from '../../shared/services/api.service';
import { SnackbarService } from '../../shared/services/snack-bar.service';
import { DataTableColumn, DataTableRowAction } from '../../shared/components/table/data-table.component';
import { FormFieldComponent } from '../../shared/components/form/form-field.component';
import { PageTemplateComponent } from '../../shared/components/page-template/page-template.component';
import { DepartmentDTO } from '../../shared/models';

@Component({
  selector: 'app-departments',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormFieldComponent,
    PageTemplateComponent,
  ],
  templateUrl: './departments.component.html',
  styleUrls: ['./departments.component.scss'],
})
export class DepartmentsComponent implements OnInit {
  protected readonly departments = signal<DepartmentDTO[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(25);

  protected form: FormGroup;

  protected readonly columns: DataTableColumn[] = [
    { key: 'name', label: 'Name', sortable: true, type: 'text' },
  ];

  protected readonly actions: DataTableRowAction<DepartmentDTO>[] = [
    { label: '✏', variant: 'ghost', icon: '', click: (r) => this.edit(r) },
    { label: '🗑', variant: 'danger', icon: '', click: (r) => this.delete(r) },
  ];

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private snack: SnackbarService,
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.list<DepartmentDTO>('/api/v1/departments', {
      page: this.pageIndex(),
      size: this.pageSize(),
    }).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (res: PagedResponse<DepartmentDTO>) => {
        this.departments.set(res.content);
        this.total.set(res.totalElements);
      },
      error: () => this.snack.error('Failed to load departments'),
    });
  }

  onPageChange({ page, size }: { page: number; size: number }): void {
    this.pageIndex.set(page);
    this.pageSize.set(size);
    this.load();
  }

  edit(dept: DepartmentDTO): void {
    this.editingId.set(dept.id ?? null);
    this.form.patchValue({ name: dept.name });
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
    const dto: DepartmentDTO = { id: this.editingId() ?? undefined, name: this.form.value.name };
    this.saving.set(true);
    const obs = dto.id
      ? this.api.put<DepartmentDTO>(`/api/v1/departments/${dto.id}`, dto)
      : this.api.post<DepartmentDTO>('/api/v1/departments', dto);

    obs.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.snack.success(dto.id ? 'Department updated' : 'Department created');
        this.cancel();
        this.load();
      },
      error: (err) =>
        this.snack.error(err?.error?.message ?? 'Save failed'),
    });
  }

  delete(dept: DepartmentDTO): void {
    if (!confirm(`Delete department "${dept.name}"?`)) {
      return;
    }
    this.api.delete<void>(`/api/v1/departments/${dept.id}`).subscribe({
      next: () => {
        this.snack.success('Department deleted');
        this.load();
      },
      error: () => this.snack.error('Delete failed'),
    });
  }
}
