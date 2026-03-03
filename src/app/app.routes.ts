import { Routes } from '@angular/router';
import { VelocityDashboardComponent } from './components/dashboard/dashboard';
import { LoginComponent } from './components/login/login';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { map } from 'rxjs/operators';

const authGuard = () => {
  const authService = inject(AuthService);
  return authService.currentUser$.pipe(
    map(user => user ? true : ['/login'])
  );
};

const loginGuard = () => {
  const authService = inject(AuthService);
  return authService.currentUser$.pipe(
    map(user => user ? ['/dashboard'] : true)
  );
};

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent, canActivate: [loginGuard] },
  { path: 'dashboard', component: VelocityDashboardComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/login' }
];
