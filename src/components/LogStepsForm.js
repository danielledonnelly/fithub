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
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: '1' }}>
          <label style={{
            fontSize: '11px',
            fontWeight: '600',
            color: '#f0f6fc'
          }}>
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            style={{
              padding: '4px 6px',
              backgroundColor: '#0d1117',
              border: '1px solid #30363d',
              borderRadius: '4px',
              color: '#8b949e',
              fontSize: '11px',
              width: '100%'
            }}
          />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: '1' }}>
          <label style={{
            fontSize: '11px',
            fontWeight: '600',
            color: '#f0f6fc'
          }}>
            Steps
          </label>
          <input
            type="number"
            value={steps}
            onChange={e => setSteps(e.target.value)}
            min="0"
            required
            style={{
              padding: '4px 6px',
              backgroundColor: '#0d1117',
              border: '1px solid #30363d',
              borderRadius: '4px',
              color: '#c9d1d9',
              fontSize: '11px',
              width: '100%'
            }}
          />
        </div>
      </div>
      
      <button
        type="submit"
        disabled={loading}
        style={{
          marginTop: '4px',
          padding: '6px 12px',
          backgroundColor: '#BB1F21',
          color: '#ffffff',
          border: '1px solid #BB1F21',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '11px',
          fontWeight: '600',
          transition: 'all 0.2s ease',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}
        onMouseEnter={(e) => {
          if (!loading) {
            e.target.style.backgroundColor = '#a01a1c';
            e.target.style.borderColor = '#a01a1c';
            e.target.style.transform = 'translateY(-1px)';
            e.target.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
          }
        }}
        onMouseLeave={(e) => {
          if (!loading) {
            e.target.style.backgroundColor = '#BB1F21';
            e.target.style.borderColor = '#BB1F21';
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
          }
        }}
      >
        {loading ? 'Logging...' : 'Log Steps'}
      </button>
      
      {error && (
        <div style={{ 
          color: '#f85149', 
          fontSize: '11px',
          padding: '4px 6px',
          backgroundColor: '#da3633',
          border: '1px solid #f85149',
          borderRadius: '4px'
        }}>
          {error}
        </div>
      )}
    </form>
  );
};

export default LogStepsForm;