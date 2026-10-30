import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { PackageManagerService } from '../../core/package-manager.service';
import { Maturity, PackageManager } from '../../core/package-manager';

type Severity = 'success' | 'info' | 'warn';

@Component({
  selector: 'app-dashboard',
  imports: [
    DecimalPipe,
    FormsModule,
    ButtonModule,
    CardModule,
    InputTextModule,
    TableModule,
    TagModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard {
  private readonly service = inject(PackageManagerService);

  readonly query = signal('');

  readonly fastest = this.service.fastest;
  readonly leanest = this.service.leanest;

  readonly rows = computed<PackageManager[]>(() => {
    const q = this.query().trim().toLowerCase();
    const all = [...this.service.all()];
    if (!q) {
      return all;
    }
    return all.filter(
      (pm) => pm.name.toLowerCase().includes(q) || pm.strategy.toLowerCase().includes(q),
    );
  });

  speedup(pm: PackageManager): number {
    return this.service.speedup(pm);
  }

  diskSaving(pm: PackageManager): number {
    return this.service.diskSavingPct(pm);
  }

  severityFor(maturity: Maturity): Severity {
    switch (maturity) {
      case 'stable':
        return 'success';
      case 'modern':
        return 'info';
      default:
        return 'warn';
    }
  }

  clear(): void {
    this.query.set('');
  }
}
