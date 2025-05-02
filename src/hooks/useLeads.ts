import { useState } from 'react';
import config from '../config';
import axios from 'axios';

interface LeadData {
  name: string;
  business_email: string;
  company_name: string;
}

export const useLeads = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submitLead = async (data: LeadData) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      await axios.post(`${config.apiBaseUrl}${config.apiEndpoints.leads}`, data);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit lead');
    } finally {
      setLoading(false);
    }
  };

  return {
    submitLead,
    loading,
    error,
    success,
    reset: () => {
      setError(null);
      setSuccess(false);
    }
  };
}; 