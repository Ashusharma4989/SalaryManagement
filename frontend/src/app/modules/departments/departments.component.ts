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
  protected readonly departments = signal<DepartmentDTO[] | null>(null);
  protected readonly saving = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly formExpanded = signal(false);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(25);
  protected readonly searchTerm = signal('');
  protected readonly sortField = signal<string | null>(null);
  protected readonly sortDirection = signal<'asc' | 'desc'>('asc');

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
    this.departments.set(null);
    let settled = false;

    const minDisplay = setTimeout(() => {
      if (!settled && this.departments() === null) {
        this.departments.set([]);
      }
    }, 300);

    const safety = setTimeout(() => {
      if (!settled && this.departments() === null) {
        this.departments.set([]);
      }
    }, 5000);

    this.api
      .list<DepartmentDTO>('/api/v1/departments', {
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
          if (this.departments() === null) {
            this.departments.set([]);
          }
        })
      )
      .subscribe({
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

  edit(dept: DepartmentDTO): void {
    this.editingId.set(dept.id ?? null);
    this.form.patchValue({ name: dept.name });
    this.formExpanded.set(true);
  }

  add(): void {
    this.editingId.set(null);
    this.form.reset();
    this.formExpanded.set(true);
  }

  cancel(): void {
    this.editingId.set(null);
    this.form.reset();
    this.formExpanded.set(false);
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
