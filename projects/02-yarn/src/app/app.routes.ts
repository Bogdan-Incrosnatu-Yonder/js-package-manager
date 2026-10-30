import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    title: 'Dashboard · Package Manager Lab',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'benchmark',
    title: 'Benchmarks · Package Manager Lab',
    loadComponent: () => import('./features/benchmark/benchmark').then((m) => m.Benchmark),
  },
  { path: '**', redirectTo: 'dashboard' },
];
