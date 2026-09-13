import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormGroup } from '@angular/forms';

@Component({
  selector: 'app-form-field',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './form-field.component.html',
  styleUrls: ['./form-field.component.scss'],
})
export class FormFieldComponent {
  @Input({ required: true }) form!: FormGroup;
  @Input({ required: true }) controlName!: string;
  @Input() label = '';
  @Input() type: 'text' | 'email' | 'password' | 'number' | 'date' | 'textarea' = 'text';
  @Input() placeholder = '';
  @Input() autocomplete = 'off';
  @Input() rows = 3;

  readonly control = computed(() => this.form.get(this.controlName));

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
    const name = this.label || this.controlName;
    if (errors['required']) return `${name} is required`;
    if (errors['email']) return 'Enter a valid email address';
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} characters`;
    if (errors['maxlength']) return `Maximum ${errors['maxlength'].requiredLength} characters`;
    if (errors['min']) return `Minimum value is ${errors['min'].min}`;
    if (errors['pattern']) return 'Invalid format';
    return 'Invalid value';
  });
}
