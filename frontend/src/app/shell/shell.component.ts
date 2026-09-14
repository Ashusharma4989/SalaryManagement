import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './header/header.component';
import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { SnackbarComponent } from '../shared/components/snack-bar/snack-bar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, NavbarComponent, FooterComponent, SnackbarComponent],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent {
  protected readonly sidebarCollapsed = signal(false);

  toggleSidebar(): void {
    this.sidebarCollapsed.set(!this.sidebarCollapsed());
  }

  signOut(): void {
    this.toggleSidebar();
  }
}
