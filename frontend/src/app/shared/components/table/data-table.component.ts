import { Component, EventEmitter, Output, computed, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';

export type ColumnType = 'text' | 'number' | 'currency' | 'date' | 'dateTime' | 'status' | 'boolean';

export interface DataTableColumn {
  key: string;
  label: string;
  type?: ColumnType;
  width?: string;
  class?: string;
  sortable?: boolean;
  render?: (value: unknown, row: unknown) => string;
}

export interface DataTableRowAction<T = unknown> {
  label: string;
  icon?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  hidden?: (row: T) => boolean;
  click: (row: T) => void;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataTableComponent<T = unknown> {
  readonly columns = input<DataTableColumn[]>([]);
  readonly rows = input<T[] | null>(null);
  readonly total = input(0);
  readonly pageIndex = input(0);
  readonly pageSize = input(10);
  readonly pageSizeOptions = input<number[]>([10, 25, 50]);
  readonly rowKey = input<string>();
  readonly rowClickable = input(false);
  readonly actions = input<DataTableRowAction<T>[]>([]);
  readonly emptyMessage = input('No records found.');

  readonly isLoading = computed(() => this.rows() === null);
  readonly hasData = computed(() => {
    const r = this.rows();
    return r !== null && r.length > 0;
  });
  readonly isEmpty = computed(() => {
    const r = this.rows();
    return r !== null && r.length === 0;
  });

  readonly pageLabel = computed(() => `Page ${this.pageIndex() + 1}`);

  readonly canPrev = computed(() => this.pageIndex() > 0);
  readonly canNext = computed(() =>
    this.total() <= this.pageSize() ||
    this.pageIndex() + 1 >= Math.ceil(this.total() / this.pageSize())
  );

  @Output() pageChange = new EventEmitter<{ page: number; size: number }>();
  @Output() rowClick = new EventEmitter<T>();

  trackByFn(index: number, row: T): string | number {
    const rk = this.rowKey();
    if (rk && row) {
      const value = (row as any)[rk];
      return value != null ? value : index;
    }
    return index;
  }

  isVisible(action: DataTableRowAction<T>, row: T): boolean {
    return action.hidden ? !action.hidden(row) : true;
  }

  formatValue(col: DataTableColumn, row: T): string {
    const raw = this.get(row as any, col.key);
    if (col.render) {
      return col.render(raw, row);
    }
    if (raw == null) {
      return '';
    }
    switch (col.type) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(Number(raw));
      case 'number':
        return new Intl.NumberFormat('en-US').format(Number(raw));
      case 'date':
        return new Date(raw as string | number | Date).toLocaleDateString();
      case 'dateTime':
        return new Date(raw as string | number | Date).toLocaleString();
      case 'boolean':
        return raw ? 'Yes' : 'No';
      default:
        return String(raw);
    }
  }

  private get(row: any, key: string): unknown {
    return key.split('.').reduce((acc: any, k: string) => (acc == null ? null : acc[k]), row);
  }

  prev(): void {
    if (this.canPrev()) {
      this.pageChange.emit({ page: this.pageIndex() - 1, size: this.pageSize() });
    }
  }

  next(): void {
    if (this.canNext()) {
      this.pageChange.emit({ page: this.pageIndex() + 1, size: this.pageSize() });
    }
  }

  changeSize(event: Event): void {
    const value = Number((event.target as HTMLSelectElement)?.value);
    const size = value && value > 0 ? value : this.pageSize();
    this.pageChange.emit({ page: 0, size });
  }

  onRowClick(row: T): void {
    if (this.rowClickable()) {
      this.rowClick.emit(row);
    }
  }
}
