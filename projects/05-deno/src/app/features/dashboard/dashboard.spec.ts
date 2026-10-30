import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Dashboard } from './dashboard';

describe('Dashboard', () => {
  let fixture: ComponentFixture<Dashboard>;
  let component: Dashboard;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Dashboard],
    }).compileComponents();

    fixture = TestBed.createComponent(Dashboard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('is created', () => {
    expect(component).toBeTruthy();
  });

  it('shows every package manager by default', () => {
    expect(component.rows().length).toBe(5);
  });

  it('renders one table row per package manager', () => {
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('[data-testid="row-npm"]')).toBeTruthy();
    expect(el.querySelector('[data-testid="row-deno"]')).toBeTruthy();
  });

  it('filters rows by name', async () => {
    component.query.set('pnpm');
    await fixture.whenStable();

    expect(component.rows().length).toBe(1);
    expect(component.rows()[0].id).toBe('pnpm');
  });

  it('filters rows by install strategy', async () => {
    component.query.set('hard-linked');
    await fixture.whenStable();

    expect(component.rows().map((pm) => pm.id)).toEqual(['pnpm']);
  });

  it('ignores case and surrounding whitespace in the filter', async () => {
    component.query.set('  BUN  ');
    await fixture.whenStable();

    expect(component.rows().map((pm) => pm.id)).toEqual(['bun']);
  });

  it('restores every row when the filter is cleared', async () => {
    component.query.set('bun');
    await fixture.whenStable();
    expect(component.rows().length).toBe(1);

    component.clear();
    await fixture.whenStable();
    expect(component.rows().length).toBe(5);
  });

  it('maps maturity onto a tag severity', () => {
    expect(component.severityFor('stable')).toBe('success');
    expect(component.severityFor('modern')).toBe('info');
    expect(component.severityFor('emerging')).toBe('warn');
  });

  it('highlights the fastest and leanest tools', () => {
    expect(component.fastest().id).toBe('bun');
    expect(component.leanest().id).toBe('pnpm');
  });
});
