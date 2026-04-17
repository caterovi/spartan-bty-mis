import { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosConfig';

export const useApi = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(url, options);
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      console.error(`API Error [${url}]:`, err);
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    if (url) {
      fetchData();
    }
  }, [fetchData, url]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
};

export const useMutation = (url, options = {}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (method = 'post', data) => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      switch (method.toLowerCase()) {
        case 'post':
          response = await api.post(url, data, options);
          break;
        case 'put':
          response = await api.put(url, data, options);
          break;
        case 'delete':
          response = await api.delete(url, options);
          break;
        default:
          throw new Error(`Unsupported method: ${method}`);
      }
      
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(errorMessage);
      console.error(`Mutation Error [${method} ${url}]:`, err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  return { execute, loading, error };
};
