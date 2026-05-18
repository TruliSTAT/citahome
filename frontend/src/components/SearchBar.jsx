import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SearchBar({ placeholder = 'Enter a property address...', onResults }) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  async function handleSearch(e) {
    e.preventDefault();
    if (!query.trim() || query.trim().length < 5) {
      setError('Please enter a full address (street, city, state)');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const resp = await fetch(`/api/property/search?address=${encodeURIComponent(query.trim())}`);
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Search failed');

      if (data.length === 1) {
        // Single result — go straight to report
        navigate(`/report/${data[0].id}`);
      } else if (onResults) {
        onResults(data);
      } else {
        navigate(`/report/${data[0].id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSearch} className="w-full max-w-2xl">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-5 py-4 text-lg border-2 border-gray-300 rounded-xl focus:outline-none focus:border-brand-500 bg-white shadow-sm"
          aria-label="Property address"
        />
        <button
          type="submit"
          disabled={loading}
          className="btn-primary text-lg px-8 py-4 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Searching...
            </span>
          ) : 'Search'}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-red-600 text-sm">{error}</p>
      )}
    </form>
  );
}
