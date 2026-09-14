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
import { PayPeriodDTO } from '../../shared/models';

@Component({
  selector: 'app-pay-periods',
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
  templateUrl: './pay-periods.component.html',
  styleUrls: ['./pay-periods.component.scss'],
})
export class PayPeriodsComponent implements OnInit {
  protected readonly periods = signal<PayPeriodDTO[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(25);

  protected form: FormGroup;

  protected readonly columns: DataTableColumn[] = [
    { key: 'startDate', label: 'Start Date', type: 'date' },
    { key: 'endDate', label: 'End Date', type: 'date' },
    { key: 'status', label: 'Status', type: 'text' },
  ];

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private snack: SnackbarService,
  ) {
    this.form = this.fb.group({
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      status: ['OPEN'],
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.list<PayPeriodDTO>('/api/v1/pay-periods', {
      page: this.pageIndex(),
      size: this.pageSize(),
    }).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
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

  edit(period: PayPeriodDTO): void {
    this.editingId.set(period.id ?? null);
    this.form.patchValue({
      startDate: period.startDate,
      endDate: period.endDate,
      status: period.status,
    });
  }

  add(): void {
    this.editingId.set(null);
    this.form.reset({ status: 'OPEN' });
  }

  cancel(): void {
    this.editingId.set(null);
    this.form.reset({ status: 'OPEN' });
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
