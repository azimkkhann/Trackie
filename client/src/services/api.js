const API_BASE = 'http://localhost:5500/api';

function getToken() {
  return localStorage.getItem('token');
}

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);

  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired');
  }

  // For CSV downloads
  if (response.headers.get('content-type')?.includes('text/csv')) {
    return response;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.errors?.[0]?.msg || 'Request failed');
  }

  return data;
}

// Auth
export const authAPI = {
  login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  getProfile: () => request('/auth/profile'),
  updateProfile: (data) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) }),
};

// Expenses
export const expenseAPI = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/expenses?${query}`);
  },
  get: (id) => request(`/expenses/${id}`),
  create: (data) => request('/expenses', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),
};

// Categories
export const categoryAPI = {
  list: () => request('/categories'),
  create: (data) => request('/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
};

// Budget
export const budgetAPI = {
  get: (month) => request(`/budget/${month}`),
  set: (month, amount) => request(`/budget/${month}`, { method: 'PUT', body: JSON.stringify({ amount }) }),
};

// Income
export const incomeAPI = {
  list: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/income?${query}`);
  },
  create: (data) => request('/income', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => request(`/income/${id}`, { method: 'DELETE' }),
};

// Analytics
export const analyticsAPI = {
  summary: (month) => request(`/analytics/summary?month=${month || ''}`),
  trend: (months = 6) => request(`/analytics/trend?months=${months}`),
  comparison: (month) => request(`/analytics/comparison?month=${month || ''}`),
};

// Reports
export const reportAPI = {
  generate: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/reports/generate?${query}`);
  },
  export: async (month) => {
    const response = await request(`/reports/export?month=${month || ''}`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${month || 'report'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};
