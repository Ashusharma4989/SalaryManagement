import { Component, EventEmitter, Output, input, computed, ChangeDetectionStrategy, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CardComponent } from '../card/card.component';
import { ButtonComponent } from '../button/button.component';
import { DataTableComponent } from '../table/data-table.component';
import { PageHeaderComponent } from '../page-header/page-header.component';

@Component({
  selector: 'app-page-template',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CardComponent, ButtonComponent, DataTableComponent, PageHeaderComponent],
  templateUrl: './page-template.component.html',
  styleUrls: ['./page-template.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageTemplateComponent<T = unknown> {
  readonly pageTitle = input('');
  readonly pageDescription = input<string | null>(null);
  readonly pageForm = input<FormGroup>(new FormGroup({}));
  readonly saving = input(false);
  readonly submitLabel = input('Create');
  readonly cardTitle = input('Add New');
  readonly columns = input<any[]>([]);
  readonly rows = input<T[] | null>(null);
  readonly total = input(0);
  readonly pageIndex = input(0);
  readonly pageSize = input(25);
  readonly rowKey = input('id');
  readonly actions = input<any[]>([]);

  readonly formExpanded = signal(false);

  private readonly _formInvalid = signal(true);

  readonly canSubmit = computed(() => !this._formInvalid() && !this.saving());

  @Output() formSubmit = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<{ page: number; size: number }>();

  constructor() {
    effect(() => {
      const form = this.pageForm();
      this._formInvalid.set(form.invalid);
      form.statusChanges.subscribe(() => {
        this._formInvalid.set(form.invalid);
      });
    });
  }

  onSubmit(): void {
    if (this.formSubmit.observed) {
      this.formSubmit.emit();
    }
  }

  onPageChange({ page, size }: { page: number; size: number }): void {
    this.pageChange.emit({ page, size });
  }

  toggleForm(): void {
    this.formExpanded.update((v) => !v);
  }
}