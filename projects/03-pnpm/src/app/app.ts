import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ToolbarModule } from 'primeng/toolbar';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ToolbarModule, ButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly title = signal('Package Manager Lab');

  /**
   * Which package manager built this copy of the app. Replaced per project
   * folder so participants can see at a glance which one they are running.
   */
  protected readonly builtWith = signal('pnpm');

  protected readonly links = [
    { path: '/dashboard', label: 'Dashboard', icon: 'pi pi-table' },
    { path: '/benchmark', label: 'Benchmarks', icon: 'pi pi-chart-bar' },
  ];
}
