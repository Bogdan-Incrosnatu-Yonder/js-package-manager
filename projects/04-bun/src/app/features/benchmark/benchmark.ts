import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ChartModule } from 'primeng/chart';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';
import { PackageManagerService } from '../../core/package-manager.service';

export type Metric = 'small' | 'monorepo' | 'disk';

interface MetricOption {
  readonly label: string;
  readonly value: Metric;
}

@Component({
  selector: 'app-benchmark',
  imports: [FormsModule, CardModule, ChartModule, SelectButtonModule],
  templateUrl: './benchmark.html',
  styleUrl: './benchmark.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Benchmark {
  private readonly service = inject(PackageManagerService);

  readonly options: MetricOption[] = [
    { label: 'Small project', value: 'small' },
    { label: 'Monorepo', value: 'monorepo' },
    { label: 'Disk', value: 'disk' },
  ];

  readonly metric = signal<Metric>('small');

  readonly unit = computed(() => (this.metric() === 'disk' ? 'MB' : 'seconds'));

  readonly caption = computed(() => {
    switch (this.metric()) {
      case 'small':
        return 'Cold install, 50 dependencies — lower is better.';
      case 'monorepo':
        return 'Cold install, 800-dependency monorepo — lower is better.';
      default:
        return 'Disk footprint of a 200-dependency project — lower is better.';
    }
  });

  readonly values = computed(() =>
    this.service.all().map((pm) => {
      switch (this.metric()) {
        case 'small':
          return pm.coldInstallSmall;
        case 'monorepo':
          return pm.coldInstallMonorepo;
        default:
          return pm.diskMb;
      }
    }),
  );

  readonly chartData = computed(() => ({
    labels: this.service.all().map((pm) => pm.name),
    datasets: [
      {
        label: this.unit(),
        data: this.values(),
        backgroundColor: ['#e05252', '#4a9fd4', '#f2a93b', '#ec6fa8', '#6fd6a0'],
        borderRadius: 4,
      },
    ],
  }));

  readonly chartOptions = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { beginAtZero: true },
    },
  };

  setMetric(metric: Metric): void {
    this.metric.set(metric);
  }
}
