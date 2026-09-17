import { Component, EventEmitter, Input, Output, HostBinding, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'button[app-button], app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (loading) {
      <span class="spinner" aria-hidden="true"></span>
    }
    @if (icon) {
      <span class="icon">{{ icon }}</span>
    }
    <ng-content></ng-content>
  `,
  styleUrls: ['./button.component.scss'],
  exportAs: 'appButton',
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() loading = false;
  @Input() disabled = false;
  @Input() icon: string | null = null;
  @Input() ariaLabel: string | null = null;
  @Output() clicked = new EventEmitter<MouseEvent>();

  @HostBinding('attr.type') get hostType(): string {
    return this.type;
  }

  @HostBinding('class') get classes(): string {
    return `btn btn-${this.variant} btn-${this.size} ${this.loading ? 'is-loading' : ''}`;
  }

  @HostBinding('attr.aria-label') get hostAriaLabel(): string | null {
    return this.ariaLabel;
  }

  @HostBinding('attr.disabled') get hostDisabled(): boolean | null {
    return this.disabled || this.loading ? true : null;
  }

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    if (this.disabled || this.loading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    this.clicked.emit(event);
  }
}
