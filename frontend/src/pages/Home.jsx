import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar.jsx';

// ── Circular Health Score Widget ─────────────────────────────────────────────
function HomeHealthScore({ score = 32, animated = true }) {
  const [display, setDisplay] = useState(animated ? 0 : score);
  const radius = 70;
  const circ = 2 * Math.PI * radius;
  const color = display < 40 ? '#ef4444' : display < 70 ? '#f97316' : '#4BBDB5';

  useEffect(() => {
    if (!animated) return;
    let cur = 0;
    const step = score / 60;
    const id = setInterval(() => {
      cur += step;
      if (cur >= score) { setDisplay(score); clearInterval(id); }
      else setDisplay(Math.floor(cur));
    }, 16);
    return () => clearInterval(id);
  }, [score, animated]);

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-48 h-48">
        <svg className="w-48 h-48 -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r={radius} fill="none" stroke="#161c28" strokeWidth="14" />
          <circle
            cx="80" cy="80" r={radius} fill="none"
            stroke={color} strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ - (display / 100) * circ}
            style={{ transition: 'stroke-dashoffset 0.08s linear, stroke 0.3s ease', filter: `drop-shadow(0 0 8px ${color}60)` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-extrabold" style={{ color }}>{Math.floor(display)}</span>
          <span className="text-xs text-gray-500 mt-1">out of 100</span>
        </div>
      </div>
      <p className="text-sm text-gray-400 mt-3 text-center font-medium">Home Documentation Score™</p>
      <p className="text-xs text-gray-600 mt-1 text-center">Claim your address to see yours</p>
    </div>
  );
}

// ── FAQ Accordion ────────────────────────────────────────────────────────────
function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-brand-border rounded-xl overflow-hidden">
      <button
        className="w-full text-left px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-colors"
        style={{ background: '#0e1118' }}
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold text-[#e2e8f0] text-sm pr-4">{question}</span>
        <span className="text-brand text-2xl leading-none flex-shrink-0">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="px-6 py-5 text-gray-400 text-sm leading-relaxed border-t border-brand-border" style={{ background: '#0a0d14' }}>
          {answer}
        </div>
      )}
    </div>
  );
}

// ── Activity Feed Item ───────────────────────────────────────────────────────
function ActivityItem({ text, time }) {
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-brand-border last:border-0">
      <span className="text-brand text-base mt-0.5 flex-shrink-0">🏠</span>
      <div className="min-w-0">
        <p className="text-sm text-[#e2e8f0] leading-snug">{text}</p>
        <p className="text-xs text-gray-600 mt-1">{time}</p>
      </div>
    </div>
  );
}

// ── Search Results Dropdown ───────────────────────────────────────────────────
function SearchResults({ results, onClose }) {
  const navigate = useNavigate();
  if (!results || results.length === 0) return null;
  return (
    <div className="w-full max-w-2xl mt-3">
      <div className="rounded-xl shadow-2xl border border-brand-border divide-y divide-brand-border overflow-hidden" style={{ background: '#0e1118' }}>
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-400">
            {results.length} address{results.length !== 1 ? 'es' : ''} found
          </span>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl leading-none">×</button>
        </div>
        {results.map(r => (
          <button
            key={r.id}
            onClick={() => navigate(`/report/${r.id}`)}
            className="w-full text-left px-4 py-3.5 hover:bg-white/5 transition-colors"
          >
            <div className="font-semibold text-[#e2e8f0] text-sm">{r.address_raw}</div>
            <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
              <span>{r.record_count} record{r.record_count !== 1 ? 's' : ''}</span>
              {r.last_service_date && (
                <span>Last: {new Date(r.last_service_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              )}
              {r.record_count === 0 && (
                <span className="text-brand">New — start building history</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
const FAQS = [
  {
    q: 'What counts as valid proof?',
    a: 'Anything that ties the work to your property with a date and a dollar amount. The gold standard is a permit number — CitaHome can verify those automatically. After that, an invoice paired with proof of payment (receipt, bank transfer, check) works great. Contractor receipts and work orders are also accepted. The more detail, the faster the verification.',
  },
  {
    q: 'How long does verification take?',
    a: 'Permit-backed entries verify instantly — CitaHome checks public records in real time. Document uploads typically verify within 1–3 business days as our team reviews them. You\'ll get a notification the moment your entry is confirmed and your CitaCoins are credited.',
  },
  {
    q: 'What if no permit exists for my project?',
    a: 'Not every job requires a permit, and that\'s totally fine. Upload your invoice and proof of payment and you\'ll earn 30 CitaCoins. If you only have a contractor receipt or partial documentation, go ahead and add it — you\'ll earn 10 CitaCoins as a self-reported entry and we\'ll upgrade your balance automatically if additional verification comes through later.',
  },
  {
    q: 'Can I earn CitaCoins on work done before CitaHome existed?',
    a: 'Absolutely. CitaHome is a historical record — that\'s the whole point. If you put a new roof on in 2015, dig up the old invoice, add the entry, and earn your coins. There\'s no cutoff date. Older work is often less documented, but even partial records count, and permit history goes back decades in most municipalities.',
  },
];

export default function Home() {
  const [searchResults, setSearchResults] = useState(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0a0d14' }}>

      {/* ── Urgency Banner ── */}
      {!bannerDismissed && (
        <div className="relative px-4 py-2.5 text-center" style={{ background: 'rgba(212,168,58,0.12)', borderBottom: '1px solid rgba(212,168,58,0.25)' }}>
          <p className="text-sm font-medium" style={{ color: '#D4A83A' }}>
            ⏰ 2x CitaCoin bonus this week — add your HVAC history before Sunday
          </p>
          <button
            onClick={() => setBannerDismissed(true)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xl leading-none opacity-60 hover:opacity-100 transition-opacity"
            style={{ color: '#D4A83A' }}
          >×</button>
        </div>
      )}

      {/* ── Header ── */}
      <header className="sticky top-0 z-40 px-4 py-4 border-b border-brand-border backdrop-blur-xl" style={{ background: 'rgba(14,17,24,0.85)' }}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🏠</span>
            <span className="text-xl font-extrabold text-[#e2e8f0]">Cita<span className="text-brand">Home</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm text-gray-400">
            <a href="#how-it-works" className="hover:text-brand transition-colors">How It Works</a>
            <a href="#citacoin"      className="hover:text-brand transition-colors">CitaCoin Rewards</a>
            <a href="#for-pros"      className="hover:text-brand transition-colors">For Agents</a>
          </nav>
          <button
            className="btn-primary text-sm py-2 px-5 hidden sm:block"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Search My Address
          </button>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-28 px-4">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[800px] h-[500px] rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(75,189,181,0.07) 0%, transparent 70%)' }} />
          <div className="absolute left-1/4 bottom-0 w-[400px] h-[300px] rounded-full" style={{ background: 'radial-gradient(ellipse, rgba(212,168,58,0.05) 0%, transparent 70%)' }} />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm text-brand mb-8 border border-brand/20" style={{ background: 'rgba(75,189,181,0.08)' }}>
            <span>🚗</span>
            <span>Like CARFAX — but for your home.</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-extrabold mb-6 leading-[1.1] text-[#e2e8f0]">
            What's Your Home<br/>
            <span className="text-brand" style={{ textShadow: '0 0 40px rgba(75,189,181,0.35)' }}>Hiding?</span>
          </h1>

          <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
            Every home has a history. Buyers, agents, and banks already know what you don't.
            See your full record — and build one that works for you.
          </p>

          <div className="flex flex-col items-center gap-4">
            <SearchBar
              placeholder="Enter your home address..."
              onResults={setSearchResults}
            />
            <SearchResults results={searchResults} onClose={() => setSearchResults(null)} />
          </div>

          {/* Stats bar */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1.5"><span className="text-brand">🔍</span> 2.3M addresses searched</span>
            <span className="text-brand-border hidden sm:block">·</span>
            <span className="flex items-center gap-1.5"><span className="text-brand">⭐</span> Free to start</span>
            <span className="text-brand-border hidden sm:block">·</span>
            <span className="flex items-center gap-1.5"><span className="text-brand">🏆</span> Trusted by agents</span>
          </div>
        </div>
      </section>

      {/* ── Home Health Score Preview ── */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="card grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-brand mb-3">Home Health Score™</p>
              <h2 className="text-3xl font-extrabold text-[#e2e8f0] mb-5 leading-tight">
                Your Home Has a Score.<br/>Do You Know It?
              </h2>
              <p className="text-gray-400 mb-7 leading-relaxed">
                Like a credit score, but for your property. Every verified improvement, permit, and repair bumps your score — making your home more valuable and more attractive to buyers.
              </p>
              <div className="space-y-3 text-sm mb-8">
                {[
                  { dot: 'bg-red-500',    text: '0–40: Undocumented — buyers see red flags' },
                  { dot: 'bg-orange-500', text: '40–70: Partial record — room to improve' },
                  { dot: 'bg-brand',      text: '70–100: Well documented — command premium pricing' },
                ].map(({ dot, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${dot}`} />
                    <span className="text-gray-400">{text}</span>
                  </div>
                ))}
              </div>
              <button className="btn-primary" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                Claim Your Address →
              </button>
            </div>
            <div className="flex flex-col items-center gap-4">
              <HomeHealthScore score={32} animated={true} />
              <p className="text-xs text-gray-600 text-center max-w-xs">
                Sample score for an unclaimed home. Yours could be higher — or lower.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-24 px-4" style={{ background: 'rgba(14,17,24,0.6)' }}>
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand mb-3">Simple Process</p>
          <h2 className="text-3xl font-extrabold text-[#e2e8f0] mb-4">How CitaHome Works</h2>
          <p className="text-gray-400 mb-14 max-w-xl mx-auto">Three steps to a complete home record that protects your investment.</p>

          <div className="grid sm:grid-cols-3 gap-6 relative">
            {[
              { icon: '🔍', num: '01', title: 'Search',   desc: 'Enter your address to instantly see what public records already exist for your home — permits, contractor history, and more.' },
              { icon: '📋', num: '02', title: 'Report',   desc: 'View your Home Health Score, permit history, contractor records, system ages, and exactly what documentation gaps exist.' },
              { icon: '✅', num: '03', title: 'Complete', desc: 'Add your improvements, upload proof, and earn CitaCoins while boosting your documented value and resale power.' },
            ].map((item, i) => (
              <div key={i} className="relative card hover:border-brand/30 transition-all duration-200 text-left">
                <div className="flex items-start gap-4 mb-4">
                  <span className="text-4xl">{item.icon}</span>
                  <span className="text-xs font-mono font-bold text-brand-border mt-2">{item.num}</span>
                </div>
                <h3 className="text-xl font-bold text-[#e2e8f0] mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
                {i < 2 && (
                  <div className="hidden sm:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full text-brand-border text-lg" style={{ background: '#0a0d14', border: '1px solid #161c28' }}>→</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Estimated Value Impact ── */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl p-10 border" style={{ background: 'linear-gradient(135deg, rgba(75,189,181,0.07) 0%, rgba(75,189,181,0.02) 100%)', borderColor: 'rgba(75,189,181,0.2)' }}>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-brand mb-3">Estimated Value Impact</p>
                <h2 className="text-3xl font-extrabold text-[#e2e8f0] mb-5 leading-tight">
                  Your Documentation Is Worth Real Money
                </h2>
                <p className="text-gray-400 leading-relaxed mb-4">
                  Homes with complete CitaHome profiles sell for an estimated{' '}
                  <span className="font-bold" style={{ color: '#D4A83A' }}>$8,200–$14,500 more</span>.
                  You unlock estimated value with every verified entry.
                </p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  * Estimates based on aggregated real estate market data. Individual results vary by market, property type, and documentation completeness. Not a guarantee of value.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  { cat: 'Roof History',          val: '~$3,200', icon: '🏠' },
                  { cat: 'HVAC Documentation',    val: '~$2,800', icon: '❄️' },
                  { cat: 'Electrical / Plumbing', val: '~$1,900', icon: '⚡' },
                  { cat: 'Permit History',         val: '~$1,400', icon: '📄' },
                ].map(item => (
                  <div key={item.cat} className="card flex items-center justify-between py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-sm text-gray-300">{item.cat}</span>
                    </div>
                    <span className="font-bold text-sm" style={{ color: '#D4A83A' }}>{item.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CitaCoin Earn Section ── */}
      <section id="citacoin" className="py-24 px-4" style={{ background: 'rgba(14,17,24,0.6)' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#D4A83A' }}>🪙 CitaCoin Rewards</p>
            <h2 className="text-3xl font-extrabold text-[#e2e8f0] mb-5 leading-tight">
              Your Home Has a History.<br/>Now It Pays You For It.
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Every upgrade, every repair, every improvement you've made — document it on CitaHome,
              get verified, and earn CitaCoins that spend like cash across the entire Cita family.
            </p>
          </div>

          {/* 3-step */}
          <div className="grid sm:grid-cols-3 gap-6 mb-16">
            {[
              { icon: '📝', title: 'Add Your Work',   desc: 'Log any improvement — a new HVAC system, a roof replacement, updated electrical — with a quick entry including year, scope, and contractor details.' },
              { icon: '✅', title: 'Get Verified',    desc: 'CitaHome verifies your entry against public permit records and the documents you upload. Stronger proof = more CitaCoins.' },
              { icon: '🪙', title: 'Earn CitaCoins',  desc: 'Verified entries drop CitaCoins into your CitaWallet — redeemable for perks, discounts, and booking credits across every Cita property.' },
            ].map((item, i) => (
              <div key={i} className="card text-center">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-bold text-[#e2e8f0] mb-3">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Value Table */}
          <div className="card overflow-hidden p-0 mb-12">
            <div className="px-8 py-6 border-b border-brand-border" style={{ background: 'rgba(212,168,58,0.05)' }}>
              <h3 className="text-lg font-bold text-[#e2e8f0]">🪙 CitaCoin Value at a Glance</h3>
              <p className="text-sm text-gray-400 mt-1">100 CitaCoins = $1 in credits — redeemable at CitaRewards, CitaCentral, and CitaPros (10% off your first booking)</p>
            </div>
            <div className="divide-y divide-brand-border">
              {[
                { action: 'Permit auto-verified entry',                              coins: '50 CC',         gold: false },
                { action: 'Document-verified entry (invoice + proof of payment)',    coins: '30 CC',         gold: false },
                { action: 'Self-reported entry (auto-upgrades to 50 CC when verified)', coins: '10 CC',      gold: false },
                { action: 'All major systems documented (bonus)',                    coins: '+100 CC',       gold: true  },
                { action: 'Maximum per property',                                    coins: '500 CC total',  gold: true  },
              ].map((row, i) => (
                <div key={i} className={`flex items-center justify-between px-8 py-4 ${row.gold ? 'bg-brand-gold/5' : ''}`}>
                  <span className="text-sm text-gray-300">{row.action}</span>
                  <span className={`font-bold text-sm ml-6 flex-shrink-0 ${row.gold ? 'text-brand-gold' : 'text-brand'}`}>{row.coins}</span>
                </div>
              ))}
            </div>
          </div>

          {/* FAQ */}
          <div className="space-y-3 mb-12">
            {FAQS.map((faq, i) => (
              <FAQItem key={i} question={faq.q} answer={faq.a} />
            ))}
          </div>

          <div className="text-center">
            <button
              className="btn-primary text-lg px-12 py-4"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              Start Earning — Add Your First Entry
            </button>
          </div>
        </div>
      </section>

      {/* ── Social Proof ── */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12">
          {/* Live activity */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand mb-3">Live Activity</p>
            <h2 className="text-2xl font-extrabold text-[#e2e8f0] mb-6">What's Happening Now</h2>
            <div className="card p-0 overflow-hidden">
              <div className="px-6">
                {[
                  { text: 'A home on Oak Ave just completed their CitaHome profile', time: '2 min ago' },
                  { text: "Sarah T. in Austin unlocked her full report — \"Worth every minute\"", time: '14 min ago' },
                  { text: '47 homes documented in your zip code this week', time: '1 hr ago' },
                  { text: 'Marcus on Elm St earned 100 CitaCoins for his HVAC documentation', time: '3 hr ago' },
                  { text: '1,247 homes in 78701 now have CitaHome profiles', time: '5 hr ago' },
                ].map((item, i) => (
                  <ActivityItem key={i} text={item.text} time={item.time} />
                ))}
              </div>
            </div>
          </div>

          {/* Endorsements + Neighborhood */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand mb-3">Trusted By Pros</p>
            <h2 className="text-2xl font-extrabold text-[#e2e8f0] mb-6">What Experts Say</h2>
            <div className="space-y-4">
              <div className="card">
                <p className="text-gray-300 text-sm leading-relaxed italic mb-4">
                  "I ask every seller for their CitaHome report now. It cuts negotiation time in half."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-brand font-bold text-sm flex-shrink-0" style={{ background: 'rgba(75,189,181,0.15)' }}>MD</div>
                  <div>
                    <p className="text-sm font-semibold text-[#e2e8f0]">Marcus D.</p>
                    <p className="text-xs text-gray-500">RE/MAX Agent, Dallas TX ⭐⭐⭐⭐⭐</p>
                  </div>
                </div>
              </div>

              <div className="card">
                <p className="text-gray-300 text-sm leading-relaxed italic mb-4">
                  "CitaHome profiles flag deferred maintenance before it becomes a deal-breaker."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0" style={{ background: 'rgba(212,168,58,0.15)', color: '#D4A83A' }}>JK</div>
                  <div>
                    <p className="text-sm font-semibold text-[#e2e8f0]">Jennifer K.</p>
                    <p className="text-xs text-gray-500">Licensed Home Inspector ⭐⭐⭐⭐⭐</p>
                  </div>
                </div>
              </div>

              {/* Neighborhood comparison teaser */}
              <div className="rounded-2xl p-5 border" style={{ background: 'rgba(75,189,181,0.07)', borderColor: 'rgba(75,189,181,0.2)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-brand">📊</span>
                  <span className="text-sm font-semibold text-brand">Neighborhood Comparison</span>
                </div>
                <p className="text-sm text-gray-300 mb-3">
                  Your home is documented better than <span className="text-[#e2e8f0] font-bold">18%</span> of homes nearby.
                </p>
                <div className="w-full rounded-full h-2" style={{ background: '#161c28' }}>
                  <div className="bg-brand h-2 rounded-full" style={{ width: '18%' }} />
                </div>
                <p className="text-xs text-gray-600 mt-2">Claim your address to see your exact ranking on the block.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── For Pros ── */}
      <section id="for-pros" className="py-24 px-4" style={{ background: 'rgba(14,17,24,0.6)' }}>
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-brand mb-3">For Professionals</p>
          <h2 className="text-3xl font-extrabold text-[#e2e8f0] mb-4">Built for Every Stage of Homeownership</h2>
          <p className="text-gray-400 mb-14">From purchase to sale — CitaHome is your home's permanent record.</p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { label: 'For Homeowners', icon: '🏡', desc: "Know your home's full history. Document improvements. Earn CitaCoins. Protect your resale value." },
              { label: 'For Buyers',     icon: '🔑', desc: 'Due diligence before you close. See open permits, system ages, documentation gaps, and past issues.' },
              { label: 'For Agents',     icon: '📊', desc: 'Unlimited reports for $149/mo. Add CitaHome to every listing and buyer packet. Cut negotiation time in half.' },
            ].map(item => (
              <div key={item.label} className="card hover:border-brand/30 transition-all duration-200">
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="text-lg font-bold text-[#e2e8f0] mb-3">{item.label}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-28 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-extrabold text-[#e2e8f0] mb-5 leading-tight">
            Your home has a story.<br/>
            <span className="text-brand" style={{ textShadow: '0 0 30px rgba(75,189,181,0.3)' }}>Tell it right.</span>
          </h2>
          <p className="text-gray-400 mb-10 text-lg">
            Join 2.3 million homeowners who know exactly what their home is worth — and why.
          </p>
          <button
            className="btn-primary text-lg px-14 py-4"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            Search My Address — It's Free
          </button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-brand-border px-4 py-14" style={{ background: '#0e1118' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid sm:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🏠</span>
                <span className="text-lg font-extrabold text-[#e2e8f0]">Cita<span className="text-brand">Home</span></span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                The verified home history platform.<br/>Part of the Cita Empire.
              </p>
            </div>
            {[
              { title: 'Product',    links: ['For Homeowners', 'For Buyers', 'For Agents', 'CitaCoin Rewards'] },
              { title: 'Ecosystem',  links: ['CitaPros', 'CitaTodo', 'CitaRewards', 'CitaCentral'] },
              { title: 'Legal',      links: ['Privacy Policy', 'Terms of Service', 'Data Accuracy'] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">{col.title}</h4>
                <ul className="space-y-2.5 text-xs">
                  {col.links.map(link => (
                    <li key={link}>
                      <a href="#" className="text-gray-600 hover:text-brand transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-brand-border pt-6 text-xs text-gray-600 text-center">
            © 2026 CitaHome. All rights reserved. · Powered by{' '}
            <a href="https://citapros.com" className="text-brand hover:text-brand-300 transition-colors">CitaPros</a> verified operators
          </div>
        </div>
      </footer>

    </div>
  );
}
