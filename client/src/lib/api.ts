import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? '/api';

export const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('edupredict_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export type UserRole = 'student' | 'lecturer' | 'admin';

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  registrationNumber?: string | null;
  department?: string | null;
  course?: string | null;
  yearOfStudy?: number | null;
};

export type Profile = {
  id?: string;
  userId?: string;
  studentId?: string | null;
  course?: string | null;
  department?: string | null;
  semester?: string | null;
  yearOfStudy?: number | null;
  previousSemesterGpa?: number | null;
  currentSemesterAverage?: number | null;
  catPerformance?: number | null;
  attendanceRate?: number | null;
  assignmentCompletion?: number | null;
  studyHours?: number | null;
  previousExamsFailures?: number | null;
  financialRisk?: number | null;
};
