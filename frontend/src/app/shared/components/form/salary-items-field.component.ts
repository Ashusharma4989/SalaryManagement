import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormArray, FormBuilder, Validators } from '@angular/forms';
import { FormFieldComponent, SelectOption } from '../form/form-field.component';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-salary-items-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormFieldComponent, ButtonComponent],
  template: `
    <div class="items-section">
      <label>Salary Items</label>
      <div class="items-list" [formGroup]="form" [formArrayName]="controlName">
        <div *ngFor="let item of itemControls; let i = index" [formGroup]="item" class="item-row">
          <app-form-field
            [form]="item"
            controlName="name"
            type="text"
            placeholder="Item name"
            [compact]="true"
          />
          <app-form-field
            [form]="item"
            controlName="type"
            type="select"
            [options]="typeOptions"
            [compact]="true"
          />
          <app-form-field
            [form]="item"
            controlName="amount"
            type="number"
            placeholder="Amount"
            [compact]="true"
          />
          <button
            app-button
            variant="danger"
            size="sm"
            type="button"
            (clicked)="remove(i)"
          >
            ✕
          </button>
        </div>
      </div>
      <button
        app-button
        variant="secondary"
        size="sm"
        type="button"
        (clicked)="add()"
      >
        + Add Item
      </button>
    </div>
  `,
  styleUrls: ['./salary-items-field.component.scss'],
})
export class SalaryItemsFieldComponent {
  @Input({ required: true }) form!: FormGroup;
  @Input({ required: true }) controlName!: string;

  protected typeOptions: SelectOption[] = [
    { value: 'EARNING', label: 'EARNING' },
    { value: 'DEDUCTION', label: 'DEDUCTION' },
  ];

  constructor(private fb: FormBuilder) {}

  get items(): FormArray {
    return this.form.get(this.controlName) as FormArray;
  }

  get itemControls(): FormGroup[] {
    return this.items.controls as FormGroup[];
  }

  add(): void {
    this.items.push(this.fb.group({
      name: ['', Validators.required],
      type: ['EARNING', Validators.required],
      amount: ['', [Validators.required, Validators.min(0.01)]],
    }));
  }

  remove(index: number): void {
    this.items.removeAt(index);
  }
}
