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
      setError('Failed to add steps. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
      <div className="flex flex-row gap-2">
        <div className="flex flex-col gap-0.5 flex-1">
          <label className="text-xs font-semibold text-fithub-white">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
            className="px-1.5 py-2 bg-fithub-dark-grey border border-solid border-fithub-light-grey rounded text-fithub-text text-xs w-full h-8 outline-none focus:outline-none focus:ring-0 focus:border-fithub-peach transition-colors"
          />
        </div>
        
        <div className="flex flex-col gap-0.5 flex-1">
          <label className="text-xs font-semibold text-fithub-white">
            Steps
          </label>
          <input
            type="number"
            value={steps}
            onChange={e => setSteps(e.target.value)}
            min="0"
            required
            className="px-1.5 py-2 bg-fithub-dark-grey border border-solid border-fithub-light-grey rounded text-fithub-text text-xs w-full h-8 outline-none focus:outline-none focus:ring-0 focus:border-fithub-peach transition-colors"
          />
        </div>
      </div>
      
      <button
        type="submit"
        disabled={loading}
        className="mt-1 px-3 py-2 bg-fithub-bright-red text-white rounded cursor-pointer hover:bg-fithub-dark-red disabled:opacity-60 disabled:cursor-not-allowed text-xs font-semibold h-8 border-0 outline-none"
      >
        {loading ? 'Adding...' : 'Add Steps'}
      </button>
      
      {error && (
        <div className="text-fithub-bright-red text-xs px-1.5 py-1 bg-fithub-dark-red border border-fithub-red rounded">
          {error}
        </div>
      )}
    </form>
  );
};

export default LogStepsForm;