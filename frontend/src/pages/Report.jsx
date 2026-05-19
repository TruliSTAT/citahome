import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import PropertyReport from '../components/PropertyReport.jsx';
import SearchBar from '../components/SearchBar.jsx';
import AddHistoryModal from '../components/AddHistoryModal.jsx';
import MakeOfferModal from '../components/MakeOfferModal.jsx';

// ── Category config ──────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'roof',         label: 'Roof',         icon: '🏠', coins: 50 },
  { key: 'hvac',         label: 'HVAC',         icon: '❄️', coins: 50 },
  { key: 'electrical',   label: 'Electrical',   icon: '⚡', coins: 50 },
  { key: 'plumbing',     label: 'Plumbing',     icon: '🔧', coins: 50 },
  { key: 'appliances',   label: 'Appliances',   icon: '🍳', coins: 30 },
  { key: 'improvements', label: 'Improvements', icon: '🏗️', coins: 30 },
  { key: 'permits',      label: 'Permits',      icon: '📄', coins: 50 },
  { key: 'warranties',   label: 'Warranties',   icon: '📋', coins: 20 },
];

const BADGES = [
  { id: 'mechanically_sound', icon: '🔧', label: 'Mechanically Sound',   desc: 'All major systems documented',     threshold: 4 },
  { id: 'renovation_ready',   icon: '🏗️', label: 'Renovation Ready',     desc: '3+ improvement projects logged',   threshold: 3 },
  { id: 'platinum_home',      icon: '🌟', label: 'Platinum Home',         desc: '90+ Health Score achieved',        threshold: 7 },
  { id: 'move_in_ready',      icon: '📋', label: 'Move-In Ready',         desc: 'Full CitaHome profile complete',   threshold: 8 },
];

// ── Category Progress Bar ────────────────────────────────────────────────────
function ProgressBar({ category, pct, status }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setDisplay(pct), 150 + Math.random() * 200);
    return () => clearTimeout(t);
  }, [pct]);

  const statusColor = status === 'Documented' ? 'text-brand' : status === 'Partial' ? 'text-yellow-400' : 'text-red-400';
  const barColor    = status === 'Documented' ? 'bg-brand'  : status === 'Partial' ? 'bg-yellow-500' : 'bg-red-900/60';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="text-lg">{category.icon}</span>
          <span className="text-[#e2e8f0] font-medium">{category.label}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold ${statusColor}`}>{status}</span>
          <span className="text-gray-600 text-xs tabular-nums">{display}%</span>
        </div>
      </div>
      <div className="w-full rounded-full h-2" style={{ background: '#161c28' }}>
        <div
          className={`${barColor} h-2 rounded-full transition-all duration-700 ease-out`}
          style={{ width: `${display}%` }}
        />
      </div>
      {status === 'Unknown' && (
        <p className="text-xs text-red-400">⚠️ This is a red flag for buyers</p>
      )}
    </div>
  );
}

// ── Main Report Page ─────────────────────────────────────────────────────────
export default function Report() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddHistory, setShowAddHistory] = useState(false);
  const [buyerAlert, setBuyerAlert] = useState(true);
  const [shareToast, setShareToast] = useState(false);
  const [accessToken, setAccessToken] = useState(
    () => localStorage.getItem(`citahome_token_${id}`) || null
  );
  const [showMakeOffer, setShowMakeOffer] = useState(false);

  // Demo category data (wired to real history entries in future)
  const [categoryData] = useState([
    { ...CATEGORIES[0], pct: 65, status: 'Partial'    },
    { ...CATEGORIES[1], pct: 0,  status: 'Unknown'    },
    { ...CATEGORIES[2], pct: 80, status: 'Documented' },
    { ...CATEGORIES[3], pct: 0,  status: 'Unknown'    },
    { ...CATEGORIES[4], pct: 40, status: 'Partial'    },
    { ...CATEGORIES[5], pct: 100,status: 'Documented' },
    { ...CATEGORIES[6], pct: 0,  status: 'Unknown'    },
    { ...CATEGORIES[7], pct: 0,  status: 'Unknown'    },
  ]);

  const documentedCount = categoryData.filter(c => c.status === 'Documented').length;
  const overallPct      = Math.round(categoryData.reduce((a, c) => a + c.pct, 0) / categoryData.length);
  const earnedCoins     = categoryData.filter(c => c.status === 'Documented').reduce((a, c) => a + c.coins, 0);
  const availableCoins  = categoryData.filter(c => c.status !== 'Documented').reduce((a, c) => a + c.coins, 0);

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

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const resp = await fetch(`/api/reports/verify?token=${encodeURIComponent(accessToken || '')}`);
          const data = await resp.json();
          if (data.valid) { clearInterval(poll); fetchReport(accessToken); }
        } catch {}
        if (attempts >= 5) { clearInterval(poll); fetchReport(accessToken); }
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

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
    });
  }

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0d14' }}>
        <div className="text-center">
          <div className="text-6xl mb-5 animate-bounce">🏠</div>
          <p className="text-gray-400 font-medium">Loading property report…</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#0a0d14' }}>
        <div className="card max-w-md w-full text-center p-10">
          <div className="text-5xl mb-5">❌</div>
          <h2 className="text-xl font-bold text-[#e2e8f0] mb-3">Failed to load report</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button onClick={() => navigate('/')} className="btn-secondary">Back to Search</button>
        </div>
      </div>
    );
  }

  const address = report?.property?.address || 'Property';

  return (
    <div className="min-h-screen" style={{ background: '#0a0d14' }}>

      {/* Share toast */}
      {shareToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl text-sm font-semibold shadow-2xl" style={{ background: '#0e1118', border: '1px solid #4BBDB5', color: '#4BBDB5' }}>
          ✓ Report link copied to clipboard
        </div>
      )}

      {/* ── Buyer Alert Banner ── */}
      {buyerAlert && (
        <div className="relative flex items-center justify-between px-4 py-3" style={{ background: 'rgba(212,168,58,0.1)', borderBottom: '1px solid rgba(212,168,58,0.2)' }}>
          <p className="text-sm" style={{ color: '#D4A83A' }}>
            👀 <strong>A buyer searched your address.</strong> They saw an incomplete profile. Here's how to fix it.
          </p>
          <button onClick={() => setBuyerAlert(false)} className="text-xl leading-none ml-4 flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity" style={{ color: '#D4A83A' }}>×</button>
        </div>
      )}

      {/* ── Header ── */}
      <header className="sticky top-0 z-30 px-4 py-4 border-b border-brand-border backdrop-blur-xl" style={{ background: 'rgba(14,17,24,0.9)' }}>
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 font-extrabold text-[#e2e8f0] hover:text-brand transition-colors text-sm flex-shrink-0"
          >
            <span className="text-xl">🏠</span>
            <span className="hidden sm:inline">Cita<span className="text-brand">Home</span></span>
          </button>
          <div className="flex-1 max-w-md">
            <SearchBar placeholder="Search another address…" />
          </div>
          <button
            onClick={() => setShowAddHistory(true)}
            className="btn-primary text-sm py-2 px-4 flex-shrink-0"
          >
            + Add History
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <button onClick={() => navigate('/')} className="hover:text-brand transition-colors">Home</button>
          <span>/</span>
          <span className="text-gray-300 truncate">{address}</span>
        </div>

        {/* ── Make an Offer CTA ── */}
        <div className="mb-6 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ background: 'rgba(212,168,58,0.06)', border: '1px solid rgba(212,168,58,0.2)' }}
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">💌</span>
              <span className="text-xs font-bold uppercase tracking-wide" style={{ color: '#D4A83A' }}>Offers Accepted</span>
            </div>
            <p className="text-sm text-gray-400 leading-snug">
              Interested in this property? Make a direct offer — even if it's not listed for sale.
            </p>
            <p className="text-xs text-gray-600 mt-1">Sometimes the best deals aren't on the market.</p>
          </div>
          <button
            onClick={() => setShowMakeOffer(true)}
            className="flex-shrink-0 rounded-xl px-6 py-3 font-extrabold text-sm transition-all hover:opacity-90"
            style={{ background: '#D4A83A', color: '#0a0d14' }}
          >
            🏷️ Make an Offer on This Home
          </button>
        </div>

        {/* Header row — streak + share */}
        <div className="flex items-center justify-between mb-7 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="card py-2 px-4 flex items-center gap-2 rounded-xl">
              <span className="text-orange-400">🔥</span>
              <span className="text-sm font-bold text-[#e2e8f0]">Day 1</span>
              <span className="text-xs text-gray-500">streak</span>
            </div>
            <div className="card py-2 px-4 flex items-center gap-2 rounded-xl">
              <span className="text-brand">🪙</span>
              <span className="text-sm font-bold text-[#e2e8f0]">{earnedCoins} CC earned</span>
            </div>
          </div>
          <button onClick={handleShare} className="btn-secondary text-sm py-2 px-4">
            📤 Share Report
          </button>
        </div>

        {/* ── Grid layout ── */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Main (2 cols) ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Progress Dashboard */}
            <div className="card">
              <div className="flex items-start justify-between mb-7">
                <div>
                  <h2 className="text-lg font-bold text-[#e2e8f0]">Documentation Progress</h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Your home is <span className="text-brand font-bold">{overallPct}% documented</span>
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-3xl font-extrabold text-brand leading-none">{overallPct}%</div>
                  <div className="text-xs text-gray-600 mt-1">overall</div>
                </div>
              </div>

              <div className="space-y-5">
                {categoryData.map(cat => (
                  <ProgressBar key={cat.key} category={cat} pct={cat.pct} status={cat.status} />
                ))}
              </div>

              <button
                onClick={() => setShowAddHistory(true)}
                className="mt-7 w-full btn-primary py-3"
              >
                + Add Home History to Improve Your Score
              </button>
            </div>

            {/* Completion Badges */}
            <div className="card">
              <h2 className="text-lg font-bold text-[#e2e8f0] mb-1">Achievement Badges</h2>
              <p className="text-sm text-gray-400 mb-6">Earn badges by documenting your home. They appear on your shareable report.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {BADGES.map(badge => {
                  const earned = documentedCount >= badge.threshold;
                  return (
                    <div
                      key={badge.id}
                      className={`rounded-xl p-4 text-center border transition-all ${
                        earned
                          ? 'border-brand/40 shadow-teal'
                          : 'border-brand-border opacity-40 grayscale'
                      }`}
                      style={{ background: earned ? 'rgba(75,189,181,0.08)' : '#0a0d14' }}
                    >
                      <div className="text-3xl mb-2">{badge.icon}</div>
                      <p className={`text-xs font-bold mb-1 ${earned ? 'text-brand' : 'text-gray-500'}`}>{badge.label}</p>
                      <p className="text-xs text-gray-600 leading-snug">{badge.desc}</p>
                    </div>
                  );
                })}
              </div>
              {documentedCount < 8 && (
                <p className="text-xs text-gray-600 mt-4 text-center">
                  {8 - documentedCount} more entries to earn <span className="text-brand">Move-In Ready</span> badge
                </p>
              )}
            </div>

            {/* Existing PropertyReport — keeps all logic, gets dark styling via global .card */}
            <PropertyReport report={report} onUnlocked={handleUnlocked} />

          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-6">

            {/* CitaCoin Earnings Panel */}
            <div className="card sticky top-24">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-xl">🪙</span>
                <h3 className="font-bold text-[#e2e8f0]">CitaHome Rewards</h3>
              </div>

              <div className="border-t border-brand-border pt-4 space-y-1">
                {categoryData.map(cat => (
                  <div key={cat.key} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                        cat.status === 'Documented' ? 'text-brand' : 'text-gray-600'
                      }`} style={{ background: cat.status === 'Documented' ? 'rgba(75,189,181,0.15)' : '#161c28' }}>
                        {cat.status === 'Documented' ? '✓' : '○'}
                      </span>
                      <span className={`text-xs ${cat.status === 'Documented' ? 'text-gray-300' : 'text-gray-600'}`}>
                        {cat.label}
                      </span>
                      {cat.key === categoryData.find(c => c.status !== 'Documented')?.key && (
                        <span className="text-xs text-brand-gold ml-1">← next</span>
                      )}
                    </div>
                    <span className={`text-xs font-bold ${cat.status === 'Documented' ? 'text-brand' : 'text-gray-700'}`}>
                      {cat.status === 'Documented' ? `+${cat.coins} CC` : `${cat.coins} CC`}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-brand-border mt-5 pt-5 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Earned:</span>
                  <span className="text-brand font-bold">{earnedCoins} CC</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Available:</span>
                  <span className="text-gray-300 font-bold">{availableCoins} CC more</span>
                </div>
                <p className="text-xs text-gray-600 pt-1">100 CC = $1 in Cita credits</p>
              </div>

              <button
                onClick={() => setShowAddHistory(true)}
                className="mt-5 w-full btn-primary py-2.5 text-sm"
              >
                Earn More CitaCoins →
              </button>
            </div>

            {/* Locked section teaser */}
            <div className="card text-center py-8 border-dashed">
              <div className="text-3xl mb-3">🔒</div>
              <p className="text-sm font-semibold text-[#e2e8f0] mb-1">More insights locked</p>
              <p className="text-xs text-gray-500 mb-4">Add history entries to unlock neighborhood comparison, value impact breakdown, and your full shareable report.</p>
              <button onClick={() => setShowAddHistory(true)} className="btn-secondary text-xs py-2 px-4">
                Unlock Now
              </button>
            </div>

          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-10 text-xs text-gray-600 text-center border-t border-brand-border pt-6 pb-4">
          <p>CitaHome reports are based on verified jobs from CitaPros operators and permit records from CitaTodo. Data may not be complete for all properties.</p>
          <p className="mt-1">Questions? <a href="mailto:support@citahome.com" className="hover:text-gray-400 transition-colors">support@citahome.com</a></p>
        </div>
      </main>

      {/* ── Add History Modal ── */}
      {showAddHistory && (
        <AddHistoryModal
          propertyId={id}
          onClose={() => setShowAddHistory(false)}
          onSuccess={() => {
            setShowAddHistory(false);
            fetchReport(accessToken);
          }}
        />
      )}

      {/* ── Make an Offer Modal ── */}
      {showMakeOffer && (
        <MakeOfferModal
          propertyId={id}
          address={address}
          onClose={() => setShowMakeOffer(false)}
        />
      )}
    </div>
  );
}
