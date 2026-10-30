import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { routes } from './app.routes';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('Hello, Package Manager Lab');
  });

  it('should show which package manager built it', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const badge = (fixture.nativeElement as HTMLElement).querySelector('[data-testid="built-with"]');
    expect(badge?.textContent).toContain('built with');
  });

  it('should render a link for every route in the nav', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[data-testid="nav-dashboard"]')).toBeTruthy();
    expect(compiled.querySelector('[data-testid="nav-benchmarks"]')).toBeTruthy();
  });
});
