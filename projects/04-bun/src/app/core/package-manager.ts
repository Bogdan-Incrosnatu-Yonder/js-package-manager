/**
 * Domain model for the workshop dataset.
 *
 * Figures come from the 2026 package-manager benchmarks discussed in the
 * accompanying deck. They are hard-coded on purpose: this app exists to be
 * installed five different ways, not to fetch data.
 */
export type Maturity = 'stable' | 'modern' | 'emerging';

export interface PackageManager {
  /** Stable id, also used as the router param. */
  readonly id: string;
  readonly name: string;
  /** Lockfile the tool writes. */
  readonly lockfile: string;
  /** How dependencies are laid out on disk. */
  readonly strategy: string;
  /** Cold install, 50-dependency project, in seconds. */
  readonly coldInstallSmall: number;
  /** Cold install, 800-dependency monorepo, in seconds. */
  readonly coldInstallMonorepo: number;
  /** Disk footprint of a 200-dependency project, in megabytes. */
  readonly diskMb: number;
  /** Rough share of the npm ecosystem that installs cleanly, 0-100. */
  readonly compatibility: number;
  readonly hasBuiltInAudit: boolean;
  readonly maturity: Maturity;
}

/** Ratio of this tool's install time against npm's, e.g. 17.9 for "17.9x faster". */
export function speedupVsNpm(pm: PackageManager, npm: PackageManager): number {
  if (pm.coldInstallSmall <= 0) {
    return 0;
  }
  return npm.coldInstallSmall / pm.coldInstallSmall;
}
