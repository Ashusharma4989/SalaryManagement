import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SnackbarService } from '../../services/snack-bar.service';

@Component({
  selector: 'app-snackbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './snack-bar.component.html',
  styleUrls: ['./snack-bar.component.scss'],
})
export class SnackbarComponent {
  readonly svc = inject(SnackbarService);

  private timer: ReturnType<typeof setTimeout> | null = null;

  readonly autoDismiss = effect(() => {
    const cfg = this.svc.current();
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (cfg && cfg.duration && cfg.duration > 0) {
      this.timer = setTimeout(() => this.svc.close(), cfg.duration);
    }
  });

  takeAction(): void {
    this.svc.close();
  }
}
