import React, { useState } from 'react';
import StepService from '../services/StepService';

const LogStepsForm = ({ onSuccess }) => {
  const [date, setDate] = useState('');
  const [steps, setSteps] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await StepService.updateSteps(date, Number(steps));
      setDate('');
      setSteps('');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('Failed to log steps. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label>
        Date:
        <input
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          required
          style={{ marginLeft: 8 }}
        />
      </label>
      <label>
        Steps:
        <input
          type="number"
          value={steps}
          onChange={e => setSteps(e.target.value)}
          min="0"
          required
          style={{ marginLeft: 8, width: 100 }}
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        style={{
          marginTop: 8,
          padding: '6px 16px',
          backgroundColor: '#238636',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? 'Logging...' : 'Log Steps'}
      </button>
      {error && <div style={{ color: '#da3633', marginTop: 8 }}>{error}</div>}
    </form>
  );
};

export default LogStepsForm;