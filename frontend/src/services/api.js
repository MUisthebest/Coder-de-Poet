// Mock API service cho frontend-only development
const mockUsers = [
  {
    id: 1,
    name: 'Annette Black',
    email: 'annette@example.com',
    friends: 274
  }
];

const mockCourses = [
  {
    id: 1,
    title: 'Crawler with Python for Beginners',
    category: 'Data Science',
    students: 9530,
    rating: 4.9,
    progress: 75
  }
];

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const api = {
  // Mock login
  async post(url, data) {
    await delay(500);
    
    if (url === '/auth/login') {
      const user = mockUsers.find(u => u.email === data.email);
      if (user && data.password === 'password') {
        return {
          data: {
            user,
            accessToken: 'mock-jwt-token-' + Date.now()
          }
        };
      }
      throw new Error('Invalid credentials');
    }
    
    if (url === '/auth/signup') {
      const newUser = {
        id: mockUsers.length + 1,
        ...data,
        friends: 0
      };
      mockUsers.push(newUser);
      return {
        data: {
          user: newUser,
          accessToken: 'mock-jwt-token-' + Date.now()
        }
      };
    }
    
    return { data: {} };
  },

  // Mock get requests
  async get(url) {
    await delay(300);
    
    if (url === '/auth/me') {
      const token = sessionStorage.getItem('accessToken');
      if (token) {
        return { data: mockUsers[0] };
      }
      throw new Error('Not authenticated');
    }
    
    return { data: {} };
  }
};

export default api;