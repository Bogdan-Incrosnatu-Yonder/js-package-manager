import { Injectable, computed, signal } from '@angular/core';
import { PackageManager, speedupVsNpm } from './package-manager';

const DATA: readonly PackageManager[] = [
  {
    id: 'npm',
    name: 'npm',
    lockfile: 'package-lock.json',
    strategy: 'Flat node_modules',
    coldInstallSmall: 14.3,
    coldInstallMonorepo: 134.2,
    diskMb: 487,
    compatibility: 100,
    hasBuiltInAudit: true,
    maturity: 'stable',
  },
  {
    id: 'yarn',
    name: 'Yarn',
    lockfile: 'yarn.lock',
    strategy: 'PnP or node_modules',
    coldInstallSmall: 6.8,
    coldInstallMonorepo: 52.3,
    diskMb: 502,
    compatibility: 96,
    hasBuiltInAudit: true,
    maturity: 'stable',
  },
  {
    id: 'pnpm',
    name: 'pnpm',
    lockfile: 'pnpm-lock.yaml',
    strategy: 'Hard-linked content store',
    coldInstallSmall: 4.2,
    coldInstallMonorepo: 28.6,
    diskMb: 124,
    compatibility: 98,
    hasBuiltInAudit: true,
    maturity: 'stable',
  },
  {
    id: 'bun',
    name: 'Bun',
    lockfile: 'bun.lock',
    strategy: 'Flat node_modules',
    coldInstallSmall: 0.8,
    coldInstallMonorepo: 4.8,
    diskMb: 461,
    compatibility: 98,
    hasBuiltInAudit: false,
    maturity: 'modern',
  },
  {
    id: 'deno',
    name: 'Deno',
    lockfile: 'deno.lock',
    strategy: 'Global cache (auto node_modules)',
    coldInstallSmall: 12.1,
    coldInstallMonorepo: 96.0,
    diskMb: 150,
    compatibility: 97,
    hasBuiltInAudit: false,
    maturity: 'emerging',
  },
];

@Injectable({ providedIn: 'root' })
export class PackageManagerService {
  private readonly data = signal<readonly PackageManager[]>(DATA);

  /** Every package manager in the dataset. */
  readonly all = this.data.asReadonly();

  /** npm, used as the baseline for every comparison. */
  readonly baseline = computed(() => this.data().find((pm) => pm.id === 'npm')!);

  /** Fastest cold install on the small project. */
  readonly fastest = computed(() =>
    this.data().reduce((best, pm) => (pm.coldInstallSmall < best.coldInstallSmall ? pm : best)),
  );

  /** Smallest disk footprint. */
  readonly leanest = computed(() =>
    this.data().reduce((best, pm) => (pm.diskMb < best.diskMb ? pm : best)),
  );

  byId(id: string): PackageManager | undefined {
    return this.data().find((pm) => pm.id === id);
  }

  /** How many times faster than npm this tool installs the small project. */
  speedup(pm: PackageManager): number {
    return speedupVsNpm(pm, this.baseline());
  }

  /** Disk saved against npm, as a percentage (negative means it uses more). */
  diskSavingPct(pm: PackageManager): number {
    const npm = this.baseline();
    return Math.round(((npm.diskMb - pm.diskMb) / npm.diskMb) * 100);
  }
}
