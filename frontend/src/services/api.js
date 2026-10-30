import axios from 'axios'

const rawApi = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').trim().replace(/\/+$/, '')
const API_BASE = rawApi.endsWith('/api') ? rawApi : `${rawApi}/api`

const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const getHealth = () => api.get('/health').then(r => r.data)
export const getSummary = (lead_time = 1) => api.get('/dashboard/summary', { params: { lead_time } }).then(r => r.data)
export const getMap = (lead_time = 1) => api.get('/confidence-map', { params: { lead_time } }).then(r => r.data)
export const getForecast = (region, lead_time = 1, model = 'GFS') => 
  api.get('/forecast', { params: { region, lead_time, model } }).then(r => r.data)
export const getConfidence = (region, lead_time = 1) => 
  api.get('/confidence', { params: { region, lead_time } }).then(r => r.data)
export const getBustProbability = (region, lead_time = 1) => 
  api.get('/bust-probability', { params: { region, lead_time } }).then(r => r.data)
export const getRegions = () => api.get('/regions').then(r => r.data)
export const getRegion = (region_id) => api.get(`/regions/${region_id}`).then(r => r.data)
export const getErrors = (params = {}) => api.get('/errors/history', { params }).then(r => r.data)
export const getExplain = (region_id, lead_time = 5) => 
  api.get(`/explanation/${region_id}/${lead_time}`).then(r => r.data)
export const getNWPVariables = () => api.get('/nwp/variables').then(r => r.data)
export const getNWPMetadata = () => api.get('/nwp/metadata').then(r => r.data)
export const getNWPStatus = () => api.get('/nwp/status').then(r => r.data)
export const getPerformance = () => api.get('/model/performance').then(r => r.data)
export const retrainModel = () => api.post('/model/train').then(r => r.data)
export const getAlerts = () => api.get('/alerts').then(r => r.data)
export const searchRegions = (q) => api.get('/search', { params: { q } }).then(r => r.data)
export const getSettings = () => api.get('/settings').then(r => r.data)
export const updateSettings = (data) => api.post('/settings', data).then(r => r.data)
export const getDataStatus = () => api.get('/data/status').then(r => r.data)

export default api
