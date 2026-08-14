import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  LogIn,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Activity,
} from 'lucide-react';
import { EventCard, EmptyState, Navigation } from '../components';
import { HostelEvent } from '../types/index';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../context/ThemeContext';
import { getApiBaseUrl } from '../utils/apiBaseUrl';

const API_URL = getApiBaseUrl();
const EVENTS_PER_PAGE = 6;

export const PublicHome: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [events, setEvents] = useState<HostelEvent[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/events`)
      .then((res) => res.json())
      .then((data) => setEvents(data.events || []))
      .catch(() => setEvents([]));
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        searchQuery === '' ||
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesEventType = selectedEventType === 'all' || event.eventType === selectedEventType;

      return matchesSearch && matchesEventType;
    });
  }, [events, searchQuery, selectedEventType]);

  const totalPages = Math.ceil(filteredEvents.length / EVENTS_PER_PAGE);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * EVENTS_PER_PAGE,
    currentPage * EVENTS_PER_PAGE
  );

  const featureCards = [
    {
      icon: ShieldCheck,
      title: 'Secure issue handling',
      text: 'Turn hostel complaints into clear, trackable actions with admin visibility and faster follow-up.',
    },
    {
      icon: CalendarDays,
      title: 'Event discovery',
      text: 'Keep students informed with curated event listings and seamless registration moments.',
    },
    {
      icon: MessageSquare,
      title: 'AI-powered assistance',
      text: 'Answer routine questions instantly and help students navigate status, policies, and actions.',
    },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(155,188,255,0.28),transparent_38%),linear-gradient(145deg,#eef5ff_0%,#f9fbff_42%,#eef2ff_100%)] text-slate-900">
      {isAuthenticated ? (
        <Navigation />
      ) : (
        <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
          <nav className="glass-nav mx-auto flex max-w-7xl items-center justify-between rounded-[26px] px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-sm font-extrabold text-white shadow-lg shadow-blue-500/30">
                WA
              </div>
              <div>
                <p className="text-lg font-extrabold tracking-tight text-slate-900">WeAssist</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <ThemeToggle compact />
              <button
                onClick={() => navigate('/login')}
                className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-100/80 sm:px-4"
              >
                <LogIn size={16} />
                <span className="hidden sm:inline">Sign in</span>
              </button>
              <button
                onClick={() => navigate('/register')}
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800 sm:px-4"
              >
                <UserPlus size={16} />
                <span className="hidden sm:inline">Register</span>
              </button>
            </div>
          </nav>
        </header>
      )}

      <main className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <section className="premium-hero relative mt-4 px-5 pb-8 pt-6 sm:px-8 sm:pt-8 lg:px-10 lg:pb-10">
          <div className="hero-blur blue" />
          <div className="hero-blur violet" />
          <div className="hero-blur sky" />

          <div className="relative grid items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="relative z-10">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-white/75 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-700 shadow-sm backdrop-blur-sm">
                <Sparkles size={12} />
                Campus operations, reimagined
              </div>

              <h1 className="max-w-xl text-4xl font-black leading-[0.95] tracking-[-0.06em] text-slate-950 sm:text-5xl lg:text-6xl">
                The quietly powerful way to run hostel life.
              </h1>

              <p className="mt-5 max-w-lg text-base text-slate-600 sm:text-lg">
                WeAssist brings issue reporting, event updates, and student support into one refined digital experience built for modern campus communities.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => navigate('/register')}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-slate-900/20 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-800"
                >
                  Get started
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:border-slate-300 hover:bg-white"
                >
                  Sign in
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <div className="glass-pill bg-white/75 text-slate-700 ring-1 ring-slate-200/80">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  Real-time issue updates
                </div>
                <div className="glass-pill bg-white/75 text-slate-700 ring-1 ring-slate-200/80">
                  <BellRing size={14} className="text-violet-500" />
                  Smart event coordination
                </div>
              </div>
            </div>

            <div className="relative z-10 flex justify-center lg:justify-end">
              <div className="mock-phone">
                <div className="mock-notch" />
                <div className="mock-screen p-3">
                  <div className="flex items-center justify-between px-2 pb-3 pt-1">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Today</p>
                      <p className="text-sm font-bold text-slate-900">Campus Sync</p>
                    </div>
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25">
                      <Activity size={16} />
                    </div>
                  </div>

                  <div className="mock-metrics mb-3">
                    <div className="mock-metric">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Open</div>
                      <div className="mt-1 text-base font-extrabold text-slate-900">12</div>
                    </div>
                    <div className="mock-metric">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Due</div>
                      <div className="mt-1 text-base font-extrabold text-slate-900">3</div>
                    </div>
                    <div className="mock-metric">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Events</div>
                      <div className="mt-1 text-base font-extrabold text-slate-900">8</div>
                    </div>
                  </div>

                  <div className="space-y-2 rounded-[1.5rem] bg-white/80 p-3 shadow-sm ring-1 ring-slate-200/80">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">Issue feed</span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">Live</span>
                    </div>

                    <div className="space-y-2">
                      <div className="rounded-2xl border border-rose-100 bg-rose-50/80 p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-900">Water leak</p>
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-700">High</span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">Block A • 12 mins ago</p>
                      </div>

                      <div className="rounded-2xl border border-blue-100 bg-blue-50/80 p-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-slate-900">AC not cooling</p>
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">In progress</span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-500">Block C • 35 mins ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          {featureCards.map(({ icon: Icon, title, text }) => (
            <article key={title} className="premium-panel rounded-[28px] p-5 sm:p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                <Icon size={20} />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
            </article>
          ))}
        </section>

        <section className="mt-10 premium-panel rounded-[30px] p-4 sm:p-6 lg:p-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Upcoming</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">Explore hostel events</h2>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white">
              <CalendarDays size={12} />
              Campus calendar
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search events by name..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="form-input placeholder:text-slate-400"
              />
            </div>

            <select
              value={selectedEventType}
              onChange={(e) => {
                setSelectedEventType(e.target.value);
                setCurrentPage(1);
              }}
              className="form-select min-w-[180px]"
            >
              <option value="all">All event types</option>
              <option value="cultural">Cultural</option>
              <option value="sports">Sports</option>
            </select>
          </div>

          {paginatedEvents.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/60 p-8">
              <EmptyState
                title="No events found"
                description="Try a different search term or switch the filter to see more campus events."
              />
            </div>
          ) : (
            <>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {paginatedEvents.map((event) => (
                  <div key={event.id} className="animate-fade-in">
                    <EventCard event={event} onClick={() => navigate('/login')} />
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <div className="hidden gap-2 sm:flex">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`h-10 min-w-10 rounded-full px-3 text-sm font-semibold transition-all duration-200 ${
                          currentPage === page
                            ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/15'
                            : 'bg-white/80 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <div className="rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm font-semibold text-slate-700 sm:hidden">
                    {currentPage}/{totalPages}
                  </div>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {!isAuthenticated && (
          <section className="mt-10 rounded-[30px] bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 px-6 py-8 text-center text-white shadow-[0_25px_70px_rgba(15,23,42,0.25)] sm:px-8 lg:px-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-100">Ready to begin</p>
            <h3 className="mt-3 text-3xl font-black tracking-tight">Turn everyday campus support into a polished experience.</h3>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-blue-100 sm:text-base">
              Join WeAssist to manage issues, discover events, and access smart guidance built for student life.
            </p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                onClick={() => navigate('/register')}
                className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition-all duration-200 hover:-translate-y-0.5 hover:bg-slate-100"
              >
                Register now
              </button>
              <button
                onClick={() => navigate('/login')}
                className="rounded-full border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/10"
              >
                Sign in
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
