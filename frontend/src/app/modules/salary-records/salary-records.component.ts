import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  FormArray,
  FormsModule,
} from '@angular/forms';
import { finalize } from 'rxjs/operators';

import { ApiService, PagedResponse } from '../../shared/services/api.service';
import { SnackbarService } from '../../shared/services/snack-bar.service';
import { AuthService } from '../../auth/auth.service';
import { DataTableComponent, DataTableColumn, DataTableRowAction } from '../../shared/components/table/data-table.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { FormFieldComponent } from '../../shared/components/form/form-field.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { EmployeeDTO, PayPeriodDTO, SalaryRecordDTO, SalaryItemDTO, UserDTO } from '../../shared/models';

@Component({
  selector: 'app-salary-records',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    DataTableComponent,
    ButtonComponent,
    FormFieldComponent,
    CardComponent,
    PageHeaderComponent,
  ],
  templateUrl: './salary-records.component.html',
  styleUrls: ['./salary-records.component.scss'],
})
export class SalaryRecordsComponent implements OnInit {
  protected readonly records = signal<SalaryRecordDTO[]>([]);
  protected readonly employees = signal<EmployeeDTO[]>([]);
  protected readonly payPeriods = signal<PayPeriodDTO[]>([]);
  protected readonly currentUserId = signal<number | null>(null);
  protected readonly loading = signal(false);
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
    this.loading.set(true);
    this.api.list<SalaryRecordDTO>('/api/v1/salary-records', {
      page: this.pageIndex(),
      size: this.pageSize(),
    }).pipe(
      finalize(() => this.loading.set(false))
    ).subscribe({
      next: (res: PagedResponse<SalaryRecordDTO>) => {
        this.records.set(res.content);
        this.total.set(res.totalElements);
      },
      error: () => this.snack.error('Failed to load salary records'),
    });
  }

  loadReferenceData(): void {
    this.api.get<EmployeeDTO[]>('/api/v1/employees').subscribe({
      next: (list) => this.employees.set(list),
      error: () => this.snack.error('Failed to load employees'),
    });
    this.api.get<PayPeriodDTO[]>('/api/v1/pay-periods').subscribe({
      next: (list) => this.payPeriods.set(list),
      error: () => this.snack.error('Failed to load pay periods'),
    });
  }

  loadCurrentUserId(): void {
    this.api.get<UserDTO[]>('/api/v1/users').subscribe({
      next: (users) => {
        const me = users.find((u) => u.username === this.auth.username());
        this.currentUserId.set(me?.id ?? null);
      },
      error: () => {},
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
          const emp = this.employees().find((e) => e.id === v);
          return emp ? `${emp.firstName} ${emp.lastName}` : String(v ?? '');
        },
      },
      {
        key: 'payPeriodId',
        label: 'Pay Period',
        type: 'text',
        render: (v) => {
          const pp = this.payPeriods().find((p) => p.id === v);
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
    this.addItemRow();
    this.form.reset({
      currencyCode: 'USD',
    });
  }

  cancel(): void {
    this.editingId.set(null);
    this.items.clear();
    this.form.reset({ currencyCode: 'USD' });
  }

  addItemRow(): void {
    this.items.push(this.fb.group({
      name: ['', Validators.required],
      type: ['EARNING', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
    }));
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
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
}
