const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  FINANCE_MANAGER: 'FINANCE_MANAGER',
  CONTENT_MANAGER: 'CONTENT_MANAGER',
  SUPPORT_AGENT: 'SUPPORT_AGENT',
  EMPLOYER: 'EMPLOYER',
  SEEKER: 'SEEKER',
};

const hasAdminPermission = (userRole, requiredRole = UserRole.ADMIN) => {
  const roleHierarchy = {
    [UserRole.SUPER_ADMIN]: 100,
    [UserRole.ADMIN]: 80,
    [UserRole.FINANCE_MANAGER]: 60,
    [UserRole.CONTENT_MANAGER]: 50,
    [UserRole.SUPPORT_AGENT]: 40,
    [UserRole.EMPLOYER]: 10,
    [UserRole.SEEKER]: 0,
  };
  return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
};

console.log("hasAdminPermission('ADMIN'):", hasAdminPermission('ADMIN'));
console.log("hasAdminPermission('SUPER_ADMIN'):", hasAdminPermission('SUPER_ADMIN'));
console.log("hasAdminPermission('ADMIN', 'ADMIN'):", hasAdminPermission('ADMIN', 'ADMIN'));
console.log("hasAdminPermission(undefined):", hasAdminPermission(undefined));
