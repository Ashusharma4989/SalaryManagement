import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer class="footer">
      <span>© {{ year }} Salary Management System</span>
    </footer>
  `,
  styleUrls: ['./footer.component.scss'],
})
export class FooterComponent {
  protected readonly year = new Date().getFullYear();
}
