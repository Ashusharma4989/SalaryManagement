import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { SnackbarComponent } from '../shared/components/snack-bar/snack-bar.component';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    HeaderComponent,
    NavbarComponent,
    FooterComponent,
    SnackbarComponent,
    RouterOutlet,
  ],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent {
  protected readonly sidebarCollapsed = signal(false);
  protected readonly auth: AuthService;

  constructor(auth: AuthService) {
    this.auth = auth;
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }

  signOut(): void {
    this.auth.logout();
  }
}
