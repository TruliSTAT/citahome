import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import PropertyReport from '../components/PropertyReport.jsx';
import SearchBar from '../components/SearchBar.jsx';

export default function Report() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [accessToken, setAccessToken] = useState(() => {
    // Check localStorage for a saved token for this property
    return localStorage.getItem(`citahome_token_${id}`) || null;
  });

  async function fetchReport(token) {
    setLoading(true);
    setError(null);
    try {
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const resp = await fetch(`/api/property/${id}/report`, { headers });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'Failed to load report');
      setReport(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // On mount: check for Stripe session_id in URL (post-purchase redirect)
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      // Poll for purchase confirmation (Stripe webhook may have a brief delay)
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const resp = await fetch(`/api/reports/verify?token=${encodeURIComponent(accessToken || '')}`);
          const data = await resp.json();
          if (data.valid) {
            clearInterval(poll);
            setAccessToken(accessToken);
            fetchReport(accessToken);
          }
        } catch {}
        if (attempts >= 5) {
          clearInterval(poll);
          fetchReport(accessToken);
        }
      }, 2000);
      return () => clearInterval(poll);
    } else {
      fetchReport(accessToken);
    }
  }, [id]);

  function handleUnlocked(token) {
    setAccessToken(token);
    localStorage.setItem(`citahome_token_${id}`, token);
    fetchReport(token);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-bounce">🏠</div>
          <p className="text-gray-600 font-medium">Loading property report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Failed to load report</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => navigate('/')} className="btn-secondary">
            Back to Search
          </button>
        </div>
      </div>
    );
  }

  const address = report?.property?.address || 'Property';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-brand-700 hover:text-brand-900 font-semibold text-sm"
          >
            <span>🏠</span>
            <span className="hidden sm:inline">CitaHome</span>
          </button>
          <div className="flex-1 max-w-md">
            <SearchBar placeholder="Search another address..." />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <button onClick={() => navigate('/')} className="hover:text-brand-600 transition-colors">Home</button>
          <span>/</span>
          <span className="text-gray-700 truncate">{address}</span>
        </div>

        <PropertyReport report={report} onUnlocked={handleUnlocked} />

        {/* Disclaimer */}
        <div className="mt-8 text-xs text-gray-400 text-center border-t border-gray-200 pt-6">
          <p>
            CitaHome reports are based on verified jobs from CitaPros operators and permit records from CitaTodo.
            Data may not be complete for all properties. Report accuracy depends on operator adoption in your area.
          </p>
          <p className="mt-1">For questions, contact <a href="mailto:support@citahome.com" className="hover:text-gray-600">support@citahome.com</a></p>
        </div>
      </main>
    </div>
  );
}
