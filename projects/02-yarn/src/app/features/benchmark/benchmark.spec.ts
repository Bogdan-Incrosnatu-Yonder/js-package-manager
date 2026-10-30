import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Benchmark } from './benchmark';

describe('Benchmark', () => {
  let fixture: ComponentFixture<Benchmark>;
  let component: Benchmark;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Benchmark],
    }).compileComponents();

    fixture = TestBed.createComponent(Benchmark);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('is created', () => {
    expect(component).toBeTruthy();
  });

  it('defaults to the small-project metric', () => {
    expect(component.metric()).toBe('small');
    expect(component.unit()).toBe('seconds');
  });

  it('charts one bar per package manager', () => {
    expect(component.chartData().labels.length).toBe(5);
    expect(component.chartData().datasets[0].data.length).toBe(5);
  });

  it('switches the dataset when the metric changes', () => {
    const small = [...component.values()];

    component.setMetric('monorepo');
    const monorepo = [...component.values()];

    expect(monorepo).not.toEqual(small);
    expect(monorepo[0]).toBe(134.2);
  });

  it('switches the unit label for the disk metric', () => {
    component.setMetric('disk');

    expect(component.unit()).toBe('MB');
    expect(component.values()).toEqual([487, 502, 124, 461, 150]);
  });

  it('describes the selected metric', () => {
    expect(component.caption()).toContain('50 dependencies');

    component.setMetric('monorepo');
    expect(component.caption()).toContain('800-dependency');

    component.setMetric('disk');
    expect(component.caption()).toContain('Disk footprint');
  });

  it('offers exactly the three metrics', () => {
    expect(component.options.map((o) => o.value)).toEqual(['small', 'monorepo', 'disk']);
  });
});
