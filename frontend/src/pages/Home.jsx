import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar.jsx';

function FeatureCard({ icon, title, description }) {
  return (
    <div className="card text-center hover:shadow-md transition-shadow">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 text-sm">{description}</p>
    </div>
  );
}

function SearchResults({ results, onClose }) {
  const navigate = useNavigate();
  if (!results || results.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mt-4">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 divide-y divide-gray-100">
        <div className="px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">{results.length} address{results.length !== 1 ? 'es' : ''} found</span>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        {results.map(r => (
          <button
            key={r.id}
            onClick={() => navigate(`/report/${r.id}`)}
            className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="font-medium text-gray-900">{r.address_raw}</div>
            <div className="text-sm text-gray-500 mt-0.5 flex items-center gap-3">
              <span>{r.record_count} record{r.record_count !== 1 ? 's' : ''}</span>
              {r.last_service_date && (
                <span>Last: {new Date(r.last_service_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
              )}
              {r.record_count === 0 && (
                <span className="text-blue-600">New — start building history</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [searchResults, setSearchResults] = useState(null);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏠</span>
            <span className="text-xl font-bold text-brand-700">CitaHome</span>
          </div>
          <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
            <a href="#how-it-works" className="hover:text-brand-600 transition-colors">How it works</a>
            <a href="#for-agents" className="hover:text-brand-600 transition-colors">For Agents</a>
            <a href="#pricing" className="hover:text-brand-600 transition-colors">Pricing</a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-brand-900 to-brand-700 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6">
            <span>🚗</span>
            <span>Like CARFAX — but for your home.</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 leading-tight">
            Every home has a history.<br />
            <span className="text-brand-200">Now you can see it.</span>
          </h1>
          <p className="text-xl text-brand-100 mb-10 max-w-2xl mx-auto">
            CitaHome is the verified service record for residential properties — powered by real operators, real permits, real history.
          </p>

          {/* Search */}
          <div className="flex flex-col items-center gap-4">
            <SearchBar
              placeholder="123 Main St, Chicago, IL 60601"
              onResults={setSearchResults}
            />
            <SearchResults results={searchResults} onClose={() => setSearchResults(null)} />
          </div>

          <p className="mt-6 text-brand-300 text-sm">
            Trusted by homeowners, buyers, and agents across the country
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="how-it-works" className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-3">
            What's inside a CitaHome report?
          </h2>
          <p className="text-center text-gray-500 mb-10">
            We pull from CitaPros verified operator jobs and CitaTodo permit records to build your home's history.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            <FeatureCard
              icon="✅"
              title="Verified Operators"
              description="See every CitaPros-verified contractor who worked on the property, with ratings and trade type."
            />
            <FeatureCard
              icon="📄"
              title="Permit History"
              description="Open and closed permits from CitaTodo — know if work was properly permitted and inspected."
            />
            <FeatureCard
              icon="🚩"
              title="Red Flag Detection"
              description="Automatic alerts for open permits, recurring issues, and unverified contractors."
            />
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            The CARFAX you never had — for your home
          </h2>
          <p className="text-gray-600 mb-8">
            You wouldn't buy a used car without a CARFAX. Why buy a home without checking its service history?
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { label: 'For Homeowners', desc: 'Know your home\'s full history. Document improvements. Protect resale value.', icon: '🏡' },
              { label: 'For Buyers', desc: 'Due diligence before you close. See open permits, system ages, past issues.', icon: '🔑', id: 'for-agents' },
              { label: 'For Agents', desc: 'Unlimited reports for $149/mo. Add CitaHome to every listing and buyer packet.', icon: '📊' },
            ].map(item => (
              <div key={item.label} id={item.id} className="card text-center">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{item.label}</h3>
                <p className="text-gray-600 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-10">Simple, transparent pricing</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="card border-2 border-gray-200 hover:border-brand-300 transition-colors">
              <h3 className="text-lg font-bold mb-1">Single Report</h3>
              <div className="text-4xl font-extrabold text-brand-700 my-3">$39</div>
              <p className="text-gray-500 text-sm mb-4">One-time · 30-day access</p>
              <ul className="text-left text-sm text-gray-600 space-y-2 mb-6">
                <li>✓ Full service history for one address</li>
                <li>✓ Permit history</li>
                <li>✓ Red flag detection</li>
                <li>✓ System age estimates</li>
              </ul>
              <a href="#" className="btn-secondary block text-center" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                Get Report
              </a>
            </div>
            <div className="card border-2 border-brand-500 bg-brand-50 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                Best for Agents
              </div>
              <h3 className="text-lg font-bold mb-1">Agent Plan</h3>
              <div className="text-4xl font-extrabold text-brand-700 my-3">$149<span className="text-lg font-normal">/mo</span></div>
              <p className="text-gray-500 text-sm mb-4">Monthly subscription</p>
              <ul className="text-left text-sm text-gray-600 space-y-2 mb-6">
                <li>✓ Unlimited reports</li>
                <li>✓ All Single Report features</li>
                <li>✓ Priority data refresh</li>
                <li>✓ Agent branding (coming soon)</li>
              </ul>
              <a href="#" className="btn-primary block text-center" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                Start Agent Plan
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-10 px-4 mt-auto">
        <div className="max-w-5xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-2xl">🏠</span>
            <span className="text-lg font-bold text-white">CitaHome</span>
          </div>
          <p className="text-sm mb-4">
            Powered by <a href="https://citapros.com" className="text-brand-400 hover:text-brand-300">CitaPros</a> verified operators
            and <a href="#" className="text-brand-400 hover:text-brand-300">CitaTodo</a> permit data
          </p>
          <div className="flex justify-center gap-6 text-sm">
            <a href="#" className="hover:text-white transition-colors">For Homeowners</a>
            <a href="#" className="hover:text-white transition-colors">For Agents</a>
            <a href="#" className="hover:text-white transition-colors">For Lenders</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
          </div>
          <p className="text-xs mt-6 text-gray-600">© 2026 CitaHome. All rights reserved. Part of the Cita Empire.</p>
        </div>
      </footer>
    </div>
  );
}
