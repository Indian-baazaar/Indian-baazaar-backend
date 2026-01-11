export function buildRoleBasedFilter(user, baseFilter = {}) {
  if (!user) {
    return baseFilter;
  }

  // SUPER_ADMIN and ADMIN can see everything
  if (user.role === 'SUPER_ADMIN') {
    return baseFilter;
  }

  // RETAILER can only see their own data
  if (user.role === 'RETAILER') {
    return {
      ...baseFilter,
      createdBy: user._id,
    };
  }

  // USER can see all data (for browsing products)
  return baseFilter;
}

export function canModifyResource(user, resource) {
  if (!user || !resource) {
    return false;
  }

  // SUPER_ADMIN and ADMIN can modify anything
  if (user.role === 'SUPER_ADMIN') {
    return true;
  }

  // RETAILER can only modify their own resources
  if (user.role === 'RETAILER') {
    return resource.createdBy && resource.createdBy.toString() === user._id.toString();
  }

  return false;
}

export function filterResourcesByRole(user, resources) {
  if (!user || !resources) {
    return resources;
  }

  // SUPER_ADMIN and ADMIN can see everything
  if (user.role === 'SUPER_ADMIN') {
    return resources;
  }

  // RETAILER can only see their own data
  if (user.role === 'RETAILER') {
    return resources.filter(resource => 
      resource.createdBy && resource.createdBy.toString() === user._id.toString()
    );
  }

  return resources;
}

export default {
  buildRoleBasedFilter,
  canModifyResource,
  filterResourcesByRole,
};
