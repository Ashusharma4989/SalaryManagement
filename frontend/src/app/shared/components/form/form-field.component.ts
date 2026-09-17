import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';

export interface SelectOption {
  value: unknown;
  label: string;
}

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="form-field" [class.compact]="compact">
      <label *ngIf="label && !compact" [attr.for]="controlName">{{ label }}</label>

      <textarea
        *ngIf="shouldRenderTextarea()"
        [formControl]="control()!"
        [id]="controlName"
        [placeholder]="placeholder"
        [autocomplete]="autocomplete"
        [rows]="rows"
      ></textarea>

      <select
        *ngIf="shouldRenderSelect()"
        [formControl]="control()!"
        [id]="controlName"
        [class.compact]="compact"
      >
        <option *ngIf="placeholder" [value]="null" disabled>{{ placeholder }}</option>
        <option *ngFor="let opt of options; trackBy: trackByIndex" [value]="opt.value">{{ opt.label }}</option>
      </select>

      <input
        *ngIf="shouldRenderInput()"
        [formControl]="control()!"
        [id]="controlName"
        [type]="type"
        [placeholder]="placeholder"
        [autocomplete]="autocomplete"
      />

      <span *ngIf="hasError()" class="error" role="alert">{{ errorMessage() }}</span>
    </div>
  `,
  styleUrls: ['./form-field.component.scss'],
})
export class FormFieldComponent {
  private readonly _form = signal<FormGroup | null>(null);
  private readonly _controlName = signal<string>('');
  private readonly _type = signal<'text' | 'email' | 'password' | 'number' | 'date' | 'textarea' | 'select'>('text');
  private readonly _label = signal<string>('');
  private readonly _placeholder = signal<string>('');

  @Input({ required: true }) set form(value: FormGroup) {
    this._form.set(value);
  }
  get form(): FormGroup {
    return this._form()!;
  }

  @Input({ required: true }) set controlName(value: string) { this._controlName.set(value); }
  get controlName(): string { return this._controlName(); }

  @Input() set label(value: string) { this._label.set(value); }
  get label(): string { return this._label(); }

  @Input() set type(value: 'text' | 'email' | 'password' | 'number' | 'date' | 'textarea' | 'select') { this._type.set(value); }
  get type(): 'text' | 'email' | 'password' | 'number' | 'date' | 'textarea' | 'select' { return this._type(); }

  @Input() set placeholder(value: string) { this._placeholder.set(value); }
  get placeholder(): string { return this._placeholder(); }

  @Input() autocomplete = 'off';
  @Input() rows = 3;
  @Input() options: SelectOption[] = [];
  @Input() compact = false;

  readonly showTextarea = computed(() => this._type() === 'textarea');
  readonly showSelect = computed(() => this._type() === 'select');
  readonly showInput = computed(() => this._type() !== 'textarea' && this._type() !== 'select');

  readonly control = computed<FormControl | null>(() => {
    const f = this._form();
    const name = this._controlName();
    if (!f || !name) return null;
    const c = f.get(name);
    if (!c) return null;
    return c as FormControl;
  });

  readonly shouldRenderTextarea = computed(() => this.showTextarea() && !!this.control());
  readonly shouldRenderSelect = computed(() => this.showSelect() && !!this.control());
  readonly shouldRenderInput = computed(() => this.showInput() && !!this.control());

  readonly hasError = computed(() => {
    const c = this.control();
    return !!c && c.invalid && (c.dirty || c.touched);
  });

  readonly errorMessage = computed(() => {
    const c = this.control();
    if (!c?.errors) {
      return '';
    }
    const errors = c.errors;
    const name = this._label() || this._controlName();
    if (errors['required']) return `${name} is required`;
    if (errors['email']) return 'Enter a valid email address';
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} characters`;
    if (errors['maxlength']) return `Maximum ${errors['maxlength'].requiredLength} characters`;
    if (errors['min']) return `Minimum value is ${errors['min'].min}`;
    if (errors['pattern']) return 'Invalid format';
    return 'Invalid value';
  });

  trackByIndex(index: number): number {
    return index;
  }
}
