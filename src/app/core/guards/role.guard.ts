import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RoleName } from '../models/user.model';

/**
 * Restricts a route to one or more roles, specified via route data:
 * `data: { roles: ['BUSINESS_ADMIN', 'SUPER_ADMIN'] }`.
 * Unauthenticated users are redirected to login; authenticated users
 * without the required role are redirected to the home page.
 */
export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }

  const allowedRoles = route.data['roles'] as RoleName[] | undefined;
  const currentRole = authService.currentRole();

  if (!allowedRoles || !currentRole || allowedRoles.includes(currentRole)) {
    return true;
  }

  return router.createUrlTree(['/']);
};
