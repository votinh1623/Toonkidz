// frontend/src/services/reportService.js
import api from './api'; // (Đây là axios instance của bạn)

export const submitReport = async (reportData) => {
  try {
    const { data } = await api.post('/reports', reportData);
    return data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getAdminReports = async (page = 1, status = 'pending') => {
  try {
    const { data } = await api.get(`/reports/admin?page=${page}&status=${status}`);
    return data;
  } catch (error) {
    throw error.response.data;
  }
}

export const updateReportStatusAdmin = async (reportId, status) => {
  try {
    const { data } = await api.put(`/reports/admin/${reportId}`, { status });
    return data;
  } catch (error) {
    throw error.response.data;
  }
}