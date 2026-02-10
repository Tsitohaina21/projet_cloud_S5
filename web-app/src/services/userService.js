import apiClient from './authService';

export const userService = {
  // Get all users from dedicated endpoint
  getAllUsers: async () => {
    try {
      console.log('📋 [userService] Fetching all users from /api/users/all endpoint...');
      
      const token = localStorage.getItem('auth_token');
      if (!token) {
        console.error('❌ No auth token found');
        return [];
      }
      
      const response = await fetch('http://localhost:8080/api/users/all', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📊 [userService] Response status:', response.status);
      const text = await response.text();
      console.log('📊 [userService] Response (first 400 chars):', text.substring(0, 400));
      
      if (!text) {
        console.error('❌ Empty response');
        return [];
      }
      
      const json = JSON.parse(text);
      console.log('✅ [userService] Parsed JSON:', json);
      
      if (!json.data || !Array.isArray(json.data)) {
        console.warn('⚠️ [userService] No data array in response');
        return [];
      }
      
      if (json.data.length === 0) {
        console.log('ℹ️ [userService] Empty users list');
        return [];
      }
      
      // Transform database field names to app format
      const transformedUsers = json.data.map(u => ({
        id: u.id,
        email: u.email,
        firstName: u.first_name,
        lastName: u.last_name,
        role: u.role,
        isActive: u.is_active,
        createdAt: u.created_at,
        blockedUntil: u.locked_until,
      }));
      
      console.log('✅ [userService] Transformed users count:', transformedUsers.length);
      console.log('✅ [userService] Sample user:', transformedUsers[0]);
      return transformedUsers;
    } catch (error) {
      console.error('❌ [userService] Error fetching users:', error);
      return [];
    }
  },

  // Get blocked users
  getBlockedUsers: async () => {
    try {
      console.log('📋 [userService] Fetching blocked users...');
      const response = await apiClient.get('/admin/users');
      console.log('✅ [userService] All users response:', response);
      const data = response.data.data || [];
      
      // Filter blocked users (locked_until is not null or is_active is false)
      const blockedUsers = data
        .filter(u => u.locked_until || !u.is_active)
        .map(u => ({
          id: u.id,
          email: u.email,
          firstName: u.first_name,
          lastName: u.last_name,
          role: u.role,
          isActive: u.is_active,
          createdAt: u.created_at,
          blockedUntil: u.locked_until,
        }));
      
      console.log('✅ [userService] Blocked users data:', blockedUsers);
      return blockedUsers;
    } catch (error) {
      console.error('❌ [userService] Failed to fetch blocked users:', error);
      return [];
    }
  },

  // Unlock user
  unlockUser: async (userId) => {
    try {
      console.log('🔓 [userService] Unlocking user:', userId);
      const response = await apiClient.post(`/admin/unlock-user`, { email: userId });
      console.log('✅ [userService] Unlock response:', response);
      return response.data.success || false;
    } catch (error) {
      console.error('❌ [userService] Failed to unlock user:', error);
      return false;
    }
  },

  // Create user (manager only)
  createUser: async (email, password, firstName, lastName, role = 'user') => {
    try {
      console.log('👤 [userService] Creating user:', email);
      const response = await apiClient.post('/admin/users/create', {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
        role,
      });
      console.log('✅ [userService] Create user response:', response);
      return response.data.data || null;
    } catch (error) {
      console.error('❌ [userService] Failed to create user:', error);
      return null;
    }
  },
};

export default userService;
