import { getFeaturePermissionValue } from 'fe-lib-entitlements';

export const getEntitlementsByFeatureCode = (memberId: number, featureCode: string): Promise<number> => {
  const entitlementsResponse = getFeaturePermissionValue(memberId, featureCode);
  if (entitlementsResponse instanceof Promise) {
    return entitlementsResponse.then(response => {
      return response?.data?.permission?.value;
    });
  }
  return Promise.resolve(0);
};
