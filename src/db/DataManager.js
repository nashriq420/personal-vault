const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:3001' : '';
const API_URL = `${API_BASE}/api/people`;
const AUTH_URL = `${API_BASE}/api/login`;

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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(person)
    });
    if (!response.ok) throw new Error('Failed to add person');
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(person)
    });
    if (!response.ok) throw new Error('Failed to update person');
    return await response.json();
  } catch (err) {
    console.error('API Error:', err);
    throw err;
  }
};

export const deletePerson = async (id) => {
  try {
    const response = await fetch(`${API_URL}/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete person');
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
