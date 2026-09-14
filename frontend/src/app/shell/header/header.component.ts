import { Component, EventEmitter, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  protected readonly auth = inject(AuthService);

  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() signOut = new EventEmitter<void>();
}
