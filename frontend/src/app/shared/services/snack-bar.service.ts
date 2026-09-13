import { Injectable, computed, signal } from '@angular/core';

export type SnackbarType = 'info' | 'success' | 'warning' | 'error';

export interface SnackbarConfig {
  message: string;
  type?: SnackbarType;
  action?: string;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class SnackbarService {
  private readonly _current = signal<SnackbarConfig | null>(null);
  readonly current = this._current.asReadonly();
  readonly open = computed(() => this._current() !== null);

  openMessage(config: SnackbarConfig): void {
    this._current.set({
      duration: 4000,
      type: 'info',
      action: 'Undo',
      ...config,
    });
  }

  success(message: string, config: Partial<SnackbarConfig> = {}): void {
    this.openMessage({ message, type: 'success', ...config });
  }

  error(message: string, config: Partial<SnackbarConfig> = {}): void {
    this.openMessage({ message, type: 'error', duration: 6000, ...config });
  }

  warning(message: string, config: Partial<SnackbarConfig> = {}): void {
    this.openMessage({ message, type: 'warning', ...config });
  }

  info(message: string, config: Partial<SnackbarConfig> = {}): void {
    this.openMessage({ message, type: 'info', ...config });
  }

  close(): void {
    this._current.set(null);
  }
}
