import axios from 'axios';

const BASE = import.meta.env.VITE_API_BASE_URL;
const SETUP_TOKEN = import.meta.env.VITE_SETUP_TOKEN;

const api = axios.create({ baseURL: BASE });

export const checkSuperAdminStatus = () =>
  api.get('/setup/status/');

export const validateInstitutionId = (id) =>
  api.get(`/setup/validate-institution/${id}/`);

export const createSuperAdmin = (data) =>
  api.post('/setup/create-super-admin/', data, {
    headers: { 'X-Setup-Token': SETUP_TOKEN },
  });
