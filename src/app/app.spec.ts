import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app';
import { RouterTestingModule } from '@angular/router/testing';
import { NavSidebarComponent } from './shared/components/nav-sidebar/nav-sidebar.component';
import { Router } from '@angular/router';

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        RouterTestingModule,
        NavSidebarComponent
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have correct title', () => {
  expect(component.title).toBe('Hayagriva Poc');
  });

  it('should redirect from old shared route', () => {
    spyOn(router, 'navigate');
    
    // Simulate old route
    Object.defineProperty(router, 'url', { value: '/documents/shared' });
    
    component.ngOnInit();
    
    expect(router.navigate).toHaveBeenCalledWith(['/documents/search']);
  });
});
