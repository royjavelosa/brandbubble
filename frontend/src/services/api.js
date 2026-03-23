import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const API_KEY = import.meta.env.VITE_API_SECRET_KEY;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "x-api-key": API_KEY,
    "Content-Type": "application/json",
  },
});

export const getBrands = async () => {
  const response = await api.get("/brands");
  return response.data.brands;
};

export const getBrandHistory = async (brandId) => {
  const response = await api.get(`/brands/${brandId}/history`);
  return response.data.history;
};

export const getBrandPlatforms = async (brandId) => {
  const response = await api.get(`/brands/${brandId}/platforms`);
  return response.data.platforms;
};

export const getGlobalNarrative = async () => {
  const response = await api.post("/narrative/global");
  return response.data.narrative;
};

export const getBrandNarrative = async (brandId) => {
  const response = await api.post(`/narrative/brand/${brandId}`);
  return response.data.narrative;
};

export default api;
