import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CardComponent } from '../card/card.component';
import { ButtonComponent } from '../button/button.component';
import { DataTableComponent, DataTableColumn, DataTableRowAction } from '../table/data-table.component';
import { PageHeaderComponent } from '../page-header/page-header.component';

@Component({
  selector: 'app-page-template',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardComponent,
    ButtonComponent,
    DataTableComponent,
    PageHeaderComponent,
  ],
  templateUrl: './page-template.component.html',
  styleUrls: ['./page-template.component.scss'],
})
export class PageTemplateComponent<T = unknown> {
  @Input() pageTitle: string = '';
  @Input() pageDescription: string | null = null;

  @Input() pageForm!: FormGroup;
  @Input() saving: boolean = false;
  @Input() submitLabel: string = 'Create';
  @Input() cardTitle: string = 'Add New';

  @Input() columns: DataTableColumn[] = [];
  @Input() rows: T[] = [];
  @Input() loading: boolean = false;
  @Input() total: number = 0;
  @Input() pageIndex: number = 0;
  @Input() pageSize: number = 25;
  @Input() rowKey: string = 'id';
  @Input() actions: DataTableRowAction<T>[] = [];

  @Output() formSubmit = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<{ page: number; size: number }>();

  onSubmit(): void {
    if (this.formSubmit.observed) {
      this.formSubmit.emit();
    }
  }

  onPageChange({ page, size }: { page: number; size: number }): void {
    this.pageChange.emit({ page, size });
  }

  get canSubmit(): boolean {
    return !this.pageForm.invalid && !this.saving;
  }
}
