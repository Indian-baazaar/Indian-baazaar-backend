import dotenv from 'dotenv';
dotenv.config();

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  RETAILER: 'RETAILER',  
  SELLER: 'SELLER',
  USER: 'USER',
  CUSTOMER: 'CUSTOMER'
};

export const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: [ROLES.ADMIN, ROLES.RETAILER, ROLES.SELLER, ROLES.USER, ROLES.CUSTOMER],
  [ROLES.ADMIN]: [ROLES.RETAILER, ROLES.SELLER, ROLES.USER, ROLES.CUSTOMER],
  [ROLES.RETAILER]: [ROLES.SELLER],
  [ROLES.SELLER]: [],
  [ROLES.USER]: [ROLES.CUSTOMER],
  [ROLES.CUSTOMER]: []
};

// Define permissions that can be assigned to roles
export const PERMISSIONS = {
  // Seller permissions
  MANAGE_OWN_PRODUCTS: 'manage_own_products',
  VIEW_OWN_ORDERS: 'view_own_orders',
  MANAGE_OWN_INVENTORY: 'manage_own_inventory',
  VIEW_OWN_PAYOUTS: 'view_own_payouts',
  
  // Admin permissions
  MANAGE_ALL_SELLERS: 'manage_all_sellers',
  MANAGE_ALL_PRODUCTS: 'manage_all_products',
  MANAGE_ALL_ORDERS: 'manage_all_orders',
  MANAGE_CATEGORIES: 'manage_categories',
  VIEW_ANALYTICS: 'view_analytics',
  
  // Super Admin permissions
  MANAGE_ADMINS: 'manage_admins',
  SYSTEM_CONFIG: 'system_config'
};

// Map roles to their permissions
export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: Object.values(PERMISSIONS),
  [ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_ALL_SELLERS,
    PERMISSIONS.MANAGE_ALL_PRODUCTS,
    PERMISSIONS.MANAGE_ALL_ORDERS,
    PERMISSIONS.MANAGE_CATEGORIES,
    PERMISSIONS.VIEW_ANALYTICS
  ],
  [ROLES.RETAILER]: [
    PERMISSIONS.MANAGE_OWN_PRODUCTS,
    PERMISSIONS.VIEW_OWN_ORDERS,
    PERMISSIONS.MANAGE_OWN_INVENTORY,
    PERMISSIONS.VIEW_OWN_PAYOUTS
  ],
  [ROLES.SELLER]: [
    PERMISSIONS.MANAGE_OWN_PRODUCTS,
    PERMISSIONS.VIEW_OWN_ORDERS,
    PERMISSIONS.MANAGE_OWN_INVENTORY,
    PERMISSIONS.VIEW_OWN_PAYOUTS
  ],
  [ROLES.USER]: [],
  [ROLES.CUSTOMER]: []
};

export const hasPermission = (role, permission) => {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return rolePermissions.includes(permission);
};

export const isRoleAllowed = (userRole, allowedRoles) => {
  // Direct match
  if (allowedRoles.includes(userRole)) {
    return true;
  }
  const inheritedRoles = ROLE_HIERARCHY[userRole] || [];
  return allowedRoles.some(allowedRole => inheritedRoles.includes(allowedRole));
};

export const rolePermission = (allowedRoles, options = {}) => {
  const { useHierarchy = false } = options;
  
  return (req, res, next) => {
    try {
      const user = req.user || req.seller;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: true,
          message: 'Authentication required'
        });
      }
      
      const userRole = user.role || (req.seller ? ROLES.SELLER : null);
      
      if (!userRole) {
        return res.status(403).json({
          success: false,
          error: true,
          message: 'User role not found'
        });
      }
      
      let isAllowed = false;
      
      if (useHierarchy) {
        isAllowed = isRoleAllowed(userRole, allowedRoles);
      } else {
        isAllowed = allowedRoles.includes(userRole);
      }
      
      if (!isAllowed) {
        return res.status(403).json({
          success: false,
          error: true,
          message: 'Access denied. Insufficient permissions.'
        });
      }
      
      next();
    } catch (error) {
      console.error('Role Permission Error:', error);
      return res.status(500).json({
        success: false,
        error: true,
        message: 'Permission check failed'
      });
    }
  };
};

export const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    try {
      const user = req.user || req.seller;
      
      if (!user) {
        return res.status(401).json({
          success: false,
          error: true,
          message: 'Authentication required'
        });
      }
      
      const userRole = user.role || (req.seller ? ROLES.SELLER : null);
      
      if (!userRole) {
        return res.status(403).json({
          success: false,
          error: true,
          message: 'User role not found'
        });
      }
      
      if (!hasPermission(userRole, requiredPermission)) {
        return res.status(403).json({
          success: false,
          error: true,
          message: `Access denied. Missing permission: ${requiredPermission}`
        });
      }
      
      next();
    } catch (error) {
      console.error('Permission Check Error:', error);
      return res.status(500).json({
        success: false,
        error: true,
        message: 'Permission check failed'
      });
    }
  };
};

export default rolePermission;
