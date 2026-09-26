import axios from 'axios'
const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api', timeout: 12000 })
export const getSummary = (day) => api.get('/dashboard/summary', { params: { lead_time: day } }).then(r => r.data)
export const getMap = (day) => api.get('/confidence-map', { params: { lead_time: day } }).then(r => r.data)
export const getForecast = (region, day) => api.get('/forecast', { params: { region, lead_time: day } }).then(r => r.data)
export const getRegions = () => api.get('/regions').then(r => r.data)
export const getRegion = (id) => api.get(`/regions/${id}`).then(r => r.data)
export const getErrors = (params) => api.get('/errors/history', { params }).then(r => r.data)
export const getExplain = (id, day) => api.get(`/explanation/${id}/${day}`).then(r => r.data)
export const getPerformance = () => api.get('/model/performance').then(r => r.data)
export const getStatus = () => api.get('/nwp/status').then(r => r.data)
export const ingest = () => api.post('/nwp/ingest').then(r => r.data)
export default api
