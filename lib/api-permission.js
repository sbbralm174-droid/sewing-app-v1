// lib/api-permission.js
import { getApisForPage, matchApiPattern } from '@/utils/permission-mapping';

export const checkApiPermission = async (userId, method, path, isAdmin) => {
  if (isAdmin) return true;
  
  try {
    const response = await fetch(
      `${process.env.NEXTAUTH_URL}/api/permissions?userId=${userId}`
    );
    
    if (!response.ok) return false;
    
    const { permissions } = await response.json();
    
    for (const permission of permissions) {
      const pageApis = getApisForPage(permission.path);
      if (matchApiPattern(pageApis, method, path)) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
};