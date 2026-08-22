import { describe, expect, it } from 'vitest';
import { PERMISSIONS, permissionsForRole } from './permissions';

describe('permissionsForRole', () => {
  it('ADMIN tiene todos los permisos', () => {
    expect(permissionsForRole('ADMIN')).toEqual(Object.values(PERMISSIONS));
  });

  it('CUSTOMER solo tiene permisos de perfil propio', () => {
    expect(permissionsForRole('CUSTOMER')).toEqual([
      PERMISSIONS.PROFILE_READ_SELF,
      PERMISSIONS.PROFILE_WRITE_SELF,
    ]);
  });

  it('WORKER tiene permisos operativos pero no de administración', () => {
    const worker = permissionsForRole('WORKER');
    expect(worker).toContain(PERMISSIONS.ORDER_TRANSITION);
    expect(worker).toContain(PERMISSIONS.PAYMENT_VERIFY);
    expect(worker).not.toContain(PERMISSIONS.ROLE_MANAGE);
    expect(worker).not.toContain(PERMISSIONS.BUSINESS_DAY_OPEN);
    expect(worker).not.toContain(PERMISSIONS.CASH_OPEN);
  });

  it('devuelve null para roles desconocidos', () => {
    expect(permissionsForRole('DESCONOCIDO')).toBeNull();
  });
});
