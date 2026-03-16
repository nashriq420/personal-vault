export const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:8000' : '';
export const API_URL = `${API_BASE}/api/people`;
export const AUTH_URL = `${API_BASE}/api/login`;

const getHeaders = () => {
  const userStr = localStorage.getItem('vault_user');
  const user = userStr ? JSON.parse(userStr) : null;
  // Fallback to 'admin' for legacy sessions that logged in before roles existed
  const role = user ? (user.role || 'admin') : 'viewer';
  return {
    'Content-Type': 'application/json',
    'X-Role': role
  };
};

export const getAllPeople = async () => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error('Failed to fetch people');
    return await response.json();
  } catch (err) {
    console.error('API Error:', err);
    return [];
  }
};

export const addPerson = async (person) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(person)
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to add person');
    }
    return await response.json();
  } catch (err) {
    console.error('API Error:', err);
    throw err;
  }
};

export const addPeople = async (peopleArray) => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(peopleArray)
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to add people in bulk');
    }
    return await response.json();
  } catch (err) {
    console.error('API Error:', err);
    throw err;
  }
};

export const updatePerson = async (id, person) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(person)
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to update person');
    }
    return await response.json();
  } catch (err) {
    console.error('API Error:', err);
    throw err;
  }
};

export const deletePerson = async (id) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: { 'X-Role': getHeaders()['X-Role'] }
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || 'Failed to delete person');
    }
    return await response.json();
  } catch (err) {
    console.error('API Error:', err);
    throw err;
  }
};

export const findPersonByUnique = async (name, nric) => {
  try {
    const all = await getAllPeople();
    if (nric) {
      const byNric = all.find(p => p.nric?.toLowerCase() === nric.toLowerCase());
      if (byNric) return byNric;
    }
    return all.find(p => p.name?.toLowerCase() === name?.toLowerCase());
  } catch (err) {
    console.error('Search Error:', err);
    return null;
  }
};
