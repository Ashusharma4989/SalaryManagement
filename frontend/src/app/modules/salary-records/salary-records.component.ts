import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
} from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { ApiService, PagedResponse } from '../../shared/services/api.service';
import { SnackbarService } from '../../shared/services/snack-bar.service';
import { AuthService } from '../../auth/auth.service';
import { DataTableColumn, DataTableRowAction } from '../../shared/components/table/data-table.component';
import { FormFieldComponent } from '../../shared/components/form/form-field.component';
import { SalaryItemsFieldComponent } from '../../shared/components/form/salary-items-field.component';
import { PageTemplateComponent } from '../../shared/components/page-template/page-template.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { EmployeeDTO, PayPeriodDTO, SalaryRecordDTO, UserDTO } from '../../shared/models';
import { SelectOption } from '../../shared/components/form/form-field.component';

@Component({
  selector: 'app-salary-records',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormFieldComponent,
    SalaryItemsFieldComponent,
    PageTemplateComponent,
  ],
  templateUrl: './salary-records.component.html',
  styleUrls: ['./salary-records.component.scss'],
})
export class SalaryRecordsComponent implements OnInit {
  protected readonly records = signal<SalaryRecordDTO[] | null>(null);
  protected readonly employees = signal<EmployeeDTO[]>([]);
  protected readonly payPeriods = signal<PayPeriodDTO[]>([]);
  protected readonly currentUserId = signal<number | null>(null);
  protected readonly saving = signal(false);
  protected readonly editingId = signal<number | null>(null);
  protected readonly total = signal(0);
  protected readonly pageIndex = signal(0);
  protected readonly pageSize = signal(25);

  protected form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private snack: SnackbarService,
    private auth: AuthService,
  ) {
    this.form = this.fb.group({
      employeeId: [null, Validators.required],
      payPeriodId: [null, Validators.required],
      baseSalary: ['', [Validators.required, Validators.min(0.01)]],
      currencyCode: ['USD', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
      salaryItems: this.fb.array([]),
    });
  }

  get items(): FormArray {
    return this.form.get('salaryItems') as FormArray;
  }

  get itemControls(): FormGroup[] {
    return this.items.controls as FormGroup[];
  }

  ngOnInit(): void {
    this.load();
    this.loadReferenceData();
    this.loadCurrentUserId();
  }

  load(): void {
    this.records.set(null);
    let settled = false;

    const minDisplay = setTimeout(() => {
      if (!settled && this.records() === null) {
        this.records.set([]);
      }
    }, 300);

    const safety = setTimeout(() => {
      if (!settled && this.records() === null) {
        this.records.set([]);
      }
    }, 5000);

    this.api
      .list<SalaryRecordDTO>('/api/v1/salary-records', {
        page: this.pageIndex(),
        size: this.pageSize(),
      })
      .pipe(
        finalize(() => {
          settled = true;
          clearTimeout(minDisplay);
          clearTimeout(safety);
          if (this.records() === null) {
            this.records.set([]);
          }
        })
      )
      .subscribe({
        next: (res: PagedResponse<SalaryRecordDTO>) => {
          this.records.set(res.content);
          this.total.set(res.totalElements);
        },
        error: () => this.snack.error('Failed to load salary records'),
      });
  }

  loadReferenceData(): void {
    this.api.list<EmployeeDTO>('/api/v1/employees').subscribe({
      next: (res: PagedResponse<EmployeeDTO>) => {
        this.employees.set(res.content);
      },
      error: () => {
        this.employees.set([]);
        this.snack.error('Failed to load employees');
      },
    });
    this.api.list<PayPeriodDTO>('/api/v1/pay-periods').subscribe({
      next: (res: PagedResponse<PayPeriodDTO>) => {
        this.payPeriods.set(res.content);
      },
      error: () => {
        this.payPeriods.set([]);
        this.snack.error('Failed to load pay periods');
      },
    });
  }

  loadCurrentUserId(): void {
    this.api.list<UserDTO>('/api/v1/users').subscribe({
      next: (res: PagedResponse<UserDTO>) => {
        const me = res.content.find((u) => u.username === this.auth.username());
        this.currentUserId.set(me?.id ?? null);
      },
      error: () => {
        this.currentUserId.set(null);
      },
    });
  }

  onPageChange({ page, size }: { page: number; size: number }): void {
    this.pageIndex.set(page);
    this.pageSize.set(size);
    this.load();
  }

  get actions(): DataTableRowAction<SalaryRecordDTO>[] {
    return [
      {
        label: '✏',
        variant: 'ghost',
        click: (r) => this.edit(r),
      },
      {
        label: '▶ Process',
        variant: 'primary',
        hidden: (r) => r.status !== 'DRAFT',
        click: (r) => this.process(r),
      },
      {
        label: '📤 Post',
        variant: 'primary',
        hidden: (r) => r.status !== 'PROCESSED',
        click: (r) => this.post(r),
      },
      { label: '🗑', variant: 'danger', click: (r) => this.delete(r) },
    ];
  }

  get columns(): DataTableColumn[] {
    return [
      {
        key: 'employeeId',
        label: 'Employee',
        type: 'text',
        render: (v) => {
          const emps = this.employees();
          const emp = Array.isArray(emps) ? emps.find((e) => e.id === v) : null;
          return emp ? `${emp.firstName} ${emp.lastName}` : String(v ?? '');
        },
      },
      {
        key: 'payPeriodId',
        label: 'Pay Period',
        type: 'text',
        render: (v) => {
          const periods = this.payPeriods();
          const pp = Array.isArray(periods) ? periods.find((p) => p.id === v) : null;
          return pp ? `${pp.startDate} – ${pp.endDate}` : String(v ?? '');
        },
      },
      { key: 'baseSalary', label: 'Base', type: 'currency' },
      { key: 'gross', label: 'Gross', type: 'currency' },
      { key: 'totalDeductions', label: 'Deductions', type: 'currency' },
      { key: 'net', label: 'Net', type: 'currency' },
      { key: 'status', label: 'Status', type: 'text' },
    ];
  }

  edit(record: SalaryRecordDTO): void {
    this.editingId.set(record.id ?? null);
    this.items.clear();
    (record.salaryItems ?? []).forEach((item) => {
      this.items.push(this.fb.group({
        name: [item.name, Validators.required],
        type: [item.type, Validators.required],
        amount: [item.amount, [Validators.required, Validators.min(0.01)]],
      }));
    });
    this.form.patchValue({
      employeeId: record.employeeId,
      payPeriodId: record.payPeriodId,
      baseSalary: record.baseSalary,
      currencyCode: record.currencyCode ?? 'USD',
    });
  }

  add(): void {
    this.editingId.set(null);
    this.items.clear();
    this.form.reset({
      currencyCode: 'USD',
    });
  }

  cancel(): void {
    this.editingId.set(null);
    this.items.clear();
    this.form.reset({ currencyCode: 'USD' });
  }

  submit(): void {
    if (this.form.invalid || this.items.length === 0) {
      return;
    }
    const dto: SalaryRecordDTO = {
      id: this.editingId() ?? undefined,
      employeeId: this.form.value.employeeId,
      payPeriodId: this.form.value.payPeriodId,
      baseSalary: this.form.value.baseSalary,
      currencyCode: this.form.value.currencyCode,
      status: this.editingId() ? undefined : 'DRAFT',
      salaryItems: this.items.getRawValue().map((i: any) => ({
        name: i.name,
        type: i.type,
        amount: i.amount,
      })),
    };
    this.saving.set(true);
    const obs = dto.id
      ? this.api.put<SalaryRecordDTO>(`/api/v1/salary-records/${dto.id}`, dto)
      : this.api.post<SalaryRecordDTO>('/api/v1/salary-records', dto);

    obs.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.snack.success(dto.id ? 'Salary record updated' : 'Salary record created');
        this.cancel();
        this.load();
      },
      error: (err) =>
        this.snack.error(err?.error?.message ?? 'Save failed'),
    });
  }

  process(record: SalaryRecordDTO): void {
    const userId = this.currentUserId();
    if (!userId) {
      this.snack.error('User ID not loaded');
      return;
    }
    this.api.patch<SalaryRecordDTO>(
      `/api/v1/salary-records/${record.id}/process?processedById=${userId}`
    ).subscribe({
      next: () => {
        this.snack.success('Salary record processed');
        this.load();
      },
      error: (err) => this.snack.error(err?.error?.message ?? 'Process failed'),
    });
  }

  post(record: SalaryRecordDTO): void {
    this.api.patch<SalaryRecordDTO>(`/api/v1/salary-records/${record.id}/post`).subscribe({
      next: () => {
        this.snack.success('Salary record posted');
        this.load();
      },
      error: (err) => this.snack.error(err?.error?.message ?? 'Post failed'),
    });
  }

  delete(record: SalaryRecordDTO): void {
    if (!confirm(`Delete salary record #${record.id}?`)) {
      return;
    }
    this.api.delete<void>(`/api/v1/salary-records/${record.id}`).subscribe({
      next: () => {
        this.snack.success('Salary record deleted');
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
      label: `${e.firstName} ${e.lastName}`,
    }));
  }

  get payPeriodOptions(): SelectOption[] {
    const periods = this.payPeriods();
    if (!Array.isArray(periods)) return [];
    return periods.map((p) => ({
      value: p.id,
      label: `${p.startDate} – ${p.endDate} (${p.status})`,
    }));
  }
}
