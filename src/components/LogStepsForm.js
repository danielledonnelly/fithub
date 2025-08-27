import React, { useState } from 'react';
import StepService from '../services/StepService';

const LogStepsForm = ({ onSuccess }) => {
  // Get today's date in YYYY-MM-DD format using local time
  const today = new Date().toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD format
  
  const [date, setDate] = useState(today);
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
              padding: '8px 6px',
              backgroundColor: '#0d1117',
              border: '1px solid #30363d',
              borderRadius: '4px',
              color: '#8b949e',
              fontSize: '11px',
              width: '100%',
              colorScheme: 'dark',
              height: '32px'
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
              padding: '8px 6px',
              backgroundColor: '#0d1117',
              border: '1px solid #30363d',
              borderRadius: '4px',
              color: '#c9d1d9',
              fontSize: '11px',
              width: '100%',
              height: '32px'
            }}
          />
        </div>
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="mt-1 px-3 py-2 bg-fithub-bright-red text-white rounded cursor-pointer hover:bg-fithub-dark-red disabled:opacity-60 disabled:cursor-not-allowed text-xs font-semibold h-8 border-0 outline-none"
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