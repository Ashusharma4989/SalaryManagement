import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { ApiService, PagedResponse } from '../../shared/services/api.service';
import { SnackbarService } from '../../shared/services/snack-bar.service';
import { DataTableColumn, DataTableRowAction } from '../../shared/components/table/data-table.component';
import { FormFieldComponent } from '../../shared/components/form/form-field.component';
import { PageTemplateComponent } from '../../shared/components/page-template/page-template.component';
import { PayPeriodDTO } from '../../shared/models';

@Component({
  selector: 'app-pay-periods',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormFieldComponent,
    PageTemplateComponent,
  ],
  templateUrl: './pay-periods.component.html',
  styleUrls: ['./pay-periods.component.scss'],
})
export class PayPeriodsComponent implements OnInit {
  protected readonly periods = signal<PayPeriodDTO[] | null>(null);
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

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private snack: SnackbarService,
  ) {
    this.form = this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      status: ['OPEN', Validators.required],
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.periods.set(null);
    let settled = false;

    const minDisplay = setTimeout(() => {
      if (!settled && this.periods() === null) {
        this.periods.set([]);
      }
    }, 300);

    const safety = setTimeout(() => {
      if (!settled && this.periods() === null) {
        this.periods.set([]);
      }
    }, 5000);

    this.api
      .list<PayPeriodDTO>('/api/v1/pay-periods', {
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
          if (this.periods() === null) {
            this.periods.set([]);
          }
        })
      )
      .subscribe({
        next: (res: PagedResponse<PayPeriodDTO>) => {
          this.periods.set(res.content);
          this.total.set(res.totalElements);
        },
        error: () => this.snack.error('Failed to load pay periods'),
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

  get actions(): DataTableRowAction<PayPeriodDTO>[] {
    return [
      { label: '✏', variant: 'ghost', click: (r) => this.edit(r) },
      {
        label: 'CloseOperation',
        variant: 'ghost',
        hidden: (r) => r.status !== 'OPEN',
        click: (r) => this.close(r),
      },
      {
        label: 'Reopen',
        variant: 'ghost',
        hidden: (r) => r.status !== 'CLOSED',
        click: (r) => this.open(r),
      },
      { label: '🗑', variant: 'danger', click: (r) => this.delete(r) },
    ];
  }

  get columns(): DataTableColumn[] {
    return [
      { key: 'startDate', label: 'Start Date', type: 'date', sortable: true },
      { key: 'endDate', label: 'End Date', type: 'date', sortable: true },
      { key: 'status', label: 'Status', type: 'text', sortable: true },
    ];
  }

  edit(period: PayPeriodDTO): void {
    this.editingId.set(period.id ?? null);
    this.form.patchValue({
      startDate: period.startDate,
      endDate: period.endDate,
      status: period.status,
    });
    this.formExpanded.set(true);
  }

  add(): void {
    this.editingId.set(null);
    this.form.reset({ status: 'OPEN' });
    this.formExpanded.set(true);
  }

  cancel(): void {
    this.editingId.set(null);
    this.form.reset({ status: 'OPEN' });
    this.formExpanded.set(false);
  }

  submit(): void {
    if (this.form.invalid) {
      return;
    }
    const dto: PayPeriodDTO = {
      id: this.editingId() ?? undefined,
      startDate: this.form.value.startDate,
      endDate: this.form.value.endDate,
      status: this.form.value.status,
    };
    this.saving.set(true);
    const obs = dto.id
      ? this.api.put<PayPeriodDTO>(`/api/v1/pay-periods/${dto.id}`, dto)
      : this.api.post<PayPeriodDTO>('/api/v1/pay-periods', dto);

    obs.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.snack.success(dto.id ? 'Pay period updated' : 'Pay period created');
        this.cancel();
        this.load();
      },
      error: (err) =>
        this.snack.error(err?.error?.message ?? 'Save failed'),
    });
  }

  close(period: PayPeriodDTO): void {
    this.api.patch<PayPeriodDTO>(`/api/v1/pay-periods/${period.id}/close`).subscribe({
      next: () => {
        this.snack.success('Pay period closed');
        this.load();
      },
      error: (err) => this.snack.error(err?.error?.message ?? 'Close failed'),
    });
  }

  open(period: PayPeriodDTO): void {
    this.api.patch<PayPeriodDTO>(`/api/v1/pay-periods/${period.id}/open`).subscribe({
      next: () => {
        this.snack.success('Pay period reopened');
        this.load();
      },
      error: (err) => this.snack.error(err?.error?.message ?? 'Open failed'),
    });
  }

  delete(period: PayPeriodDTO): void {
    if (!confirm(`Delete pay period ${period.startDate} – ${period.endDate}?`)) {
      return;
    }
    this.api.delete<void>(`/api/v1/pay-periods/${period.id}`).subscribe({
      next: () => {
        this.snack.success('Pay period deleted');
        this.load();
      },
      error: () => this.snack.error('Delete failed'),
    });
  }
}
