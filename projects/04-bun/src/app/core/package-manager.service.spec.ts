import { TestBed } from '@angular/core/testing';
import { PackageManagerService } from './package-manager.service';

describe('PackageManagerService', () => {
  let service: PackageManagerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PackageManagerService);
  });

  it('is created', () => {
    expect(service).toBeTruthy();
  });

  it('exposes all five package managers', () => {
    expect(service.all().length).toBe(5);
    expect(service.all().map((pm) => pm.id)).toEqual(['npm', 'yarn', 'pnpm', 'bun', 'deno']);
  });

  it('uses npm as the baseline', () => {
    expect(service.baseline().id).toBe('npm');
  });

  it('finds a package manager by id', () => {
    expect(service.byId('pnpm')?.name).toBe('pnpm');
    expect(service.byId('cargo')).toBeUndefined();
  });

  it('reports Bun as the fastest cold install', () => {
    expect(service.fastest().id).toBe('bun');
  });

  it('reports pnpm as the leanest on disk', () => {
    expect(service.leanest().id).toBe('pnpm');
  });

  it('computes a speed-up against npm', () => {
    const bun = service.byId('bun')!;
    // 14.3s / 0.8s
    expect(service.speedup(bun)).toBeCloseTo(17.875, 3);
  });

  it('gives npm a speed-up of exactly 1', () => {
    expect(service.speedup(service.baseline())).toBe(1);
  });

  it('computes disk saving against npm', () => {
    const pnpm = service.byId('pnpm')!;
    // (487 - 124) / 487
    expect(service.diskSavingPct(pnpm)).toBe(75);
  });

  it('returns a negative disk saving for tools that use more than npm', () => {
    const yarn = service.byId('yarn')!;
    expect(service.diskSavingPct(yarn)).toBeLessThan(0);
  });
});
