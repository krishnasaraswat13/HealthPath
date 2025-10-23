import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  Bell,
  Brain,
  Building2,
  CalendarClock,
  ChevronRight,
  Clock3,
  Heart,
  Menu,
  Pill,
  ShieldCheck,
  Sparkles,
  Star,
  Stethoscope,
  TrendingUp,
  UserCheck,
  Video,
  X,
  Zap,
} from 'lucide-react';

const HomePage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeReview, setActiveReview] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveReview((prev) => (prev + 1) % reviews.length);
    }, 4200);
    return () => clearInterval(timer);
  }, []);

  const modules = [
    {
      icon: CalendarClock,
      title: 'Smart Scheduling',
      text: 'Live booking slots with smooth follow-up planning.',
    },
    {
      icon: Video,
      title: 'Consult Mode',
      text: 'Video and chat workflows designed for fast care action.',
    },
    {
      icon: Brain,
      title: 'Assist Layer',
      text: 'Clinical support blocks for decisions and summaries.',
    },
    {
      icon: ShieldCheck,
      title: 'Secure Records',
      text: 'Protected patient, pharmacy, and hospital data paths.',
    },
  ];

  const portals = [
    {
      name: 'Patient',
      icon: Heart,
      path: '/patient/register',
      shade: 'from-cyan-500 to-teal-500',
      points: ['Book specialists', 'Track consults', 'Manage reports'],
    },
    {
      name: 'Doctor',
      icon: Stethoscope,
      path: '/doctor/register',
      shade: 'from-sky-500 to-cyan-500',
      points: ['Run sessions', 'Write notes', 'Use smart tools'],
    },
    {
      name: 'Pharmacy',
      icon: Pill,
      path: '/pharmacy/register',
      shade: 'from-amber-500 to-orange-500',
      points: ['Handle eRx', 'Control stock', 'Process orders'],
    },
    {
      name: 'Hospital',
      icon: Building2,
      path: '/hospital/register',
      shade: 'from-rose-500 to-pink-500',
      points: ['Track services', 'Update emergency info', 'Bulk orders'],
    },
  ];

  const reviews = [
    {
      person: 'Aarushi Verma',
      role: 'Patient',
      text: 'Everything is clearer now. I can move from booking to follow-up without friction.',
    },
    {
      person: 'Dr. Karan Shah',
      role: 'General Physician',
      text: 'The dashboard blocks are practical. I see what matters and act quickly.',
    },
    {
      person: 'Riya Kapoor',
      role: 'Pharmacy Lead',
      text: 'Prescription handoff and order visibility improved a lot in daily operations.',
    },
  ];

  const smoothScroll = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_8%,rgba(56,189,248,0.24),transparent_34%),radial-gradient(circle_at_86%_14%,rgba(20,184,166,0.2),transparent_36%),radial-gradient(circle_at_52%_92%,rgba(14,165,233,0.12),transparent_38%),linear-gradient(180deg,#f8fbff_0%,#f1f6fb_42%,#f7fafd_100%)] text-slate-900">
      <nav
        className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-white/78 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_8px_28px_rgba(2,132,199,0.08)]'
            : 'bg-transparent'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <button onClick={() => smoothScroll('top')} className="flex items-center gap-3">
              <img src="/top-logo.svg" alt="HealthPath" className="h-10 w-10" />
              <div className="text-left">
                <p className="text-lg font-black leading-none">HealthPath</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Care Workspace</p>
              </div>
            </button>

            <div className="hidden items-center gap-8 md:flex">
              {[
                { name: 'Highlights', id: 'highlights' },
                { name: 'Portals', id: 'portals' },
                { name: 'Workspace', id: 'workspace' },
                { name: 'Reviews', id: 'reviews' },
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => smoothScroll(item.id)}
                  className="text-sm font-semibold text-slate-700 hover:text-sky-600 transition-colors"
                >
                  {item.name}
                </button>
              ))}
            </div>

            <div className="hidden items-center gap-3 md:flex">
              <button
                onClick={() => navigate('/login')}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-sky-300 hover:text-sky-700 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/login')}
                className="rounded-xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 px-5 py-2 text-sm font-bold text-white shadow-lg shadow-sky-500/25 hover:shadow-sky-500/35 transition-all"
              >
                Get Started
              </button>
            </div>

            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="rounded-lg p-2 text-slate-700 hover:text-sky-700 md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-slate-200 bg-white/95 backdrop-blur-xl md:hidden">
            <div className="space-y-2 px-4 py-4">
              {[
                { name: 'Highlights', id: 'highlights' },
                { name: 'Portals', id: 'portals' },
                { name: 'Workspace', id: 'workspace' },
                { name: 'Reviews', id: 'reviews' },
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => smoothScroll(item.id)}
                  className="block w-full rounded-lg px-2 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  {item.name}
                </button>
              ))}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => navigate('/login')}
                  className="rounded-lg border border-slate-300 py-2 text-sm font-semibold"
                >
                  Sign In
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="rounded-lg bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 py-2 text-sm font-bold text-white"
                >
                  Start
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <section id="top" className="pt-28 pb-12 sm:pt-32 sm:pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-7 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="rounded-3xl border border-slate-200/75 bg-white/80 p-7 shadow-[0_20px_45px_rgba(30,64,175,0.09)] backdrop-blur-xl sm:p-10">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white px-4 py-2">
                <Sparkles className="h-4 w-4 text-sky-600" />
                <span className="text-sm font-semibold text-slate-700">HealthPath Care Workspace</span>
              </div>
              <h1 className="text-4xl font-black leading-tight text-slate-900 sm:text-5xl lg:text-6xl">
                White Glass UI,
                <span className="block bg-gradient-to-r from-sky-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  Dark Shaded Precision
                </span>
              </h1>
              <p className="mt-6 max-w-xl text-lg text-slate-600">
                A redesigned home surface that keeps a clean light look with stronger dark depth for readability and focus.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 px-7 py-4 font-bold text-white shadow-lg shadow-sky-500/30"
                >
                  Start on HealthPath
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => smoothScroll('portals')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border-2 border-slate-300 bg-white px-7 py-4 font-bold text-slate-700 hover:border-sky-300 hover:text-sky-700 transition-colors"
                >
                  Explore Portals
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div id="workspace" className="rounded-3xl border border-slate-200/75 bg-white/80 p-6 shadow-[0_20px_45px_rgba(30,64,175,0.09)] backdrop-blur-xl sm:p-8">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-sky-700">Today on platform</p>
                  <h3 className="mt-1 text-3xl font-black text-slate-900">Live Care Workspace</h3>
                </div>
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-bold text-rose-700">Live</span>
              </div>

              <div className="space-y-3">
                {[
                  { time: '09:30', task: 'Cardiology consult confirmed', tag: 'Consult' },
                  { time: '11:00', task: 'Prescription sent to pharmacy', tag: 'Rx' },
                  { time: '13:15', task: 'Follow-up reminders scheduled', tag: 'Follow-up' },
                ].map((row) => (
                  <div key={row.time} className="flex items-center gap-3 rounded-xl border border-slate-600/70 bg-gradient-to-r from-slate-800 to-slate-700 px-4 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.25)]">
                    <span className="w-14 text-xs font-bold text-sky-300">{row.time}</span>
                    <span className="flex-1 text-sm font-semibold text-slate-100">{row.task}</span>
                    <span className="rounded-md bg-slate-900/90 px-2 py-1 text-xs font-semibold text-slate-200 border border-slate-600">
                      {row.tag}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-50 to-white p-4">
                  <p className="text-xs font-bold text-sky-700">Patients online</p>
                  <p className="mt-1 text-2xl font-black text-sky-900">2,164</p>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-sky-100">
                    <div className="h-1.5 w-[76%] rounded-full bg-sky-500" />
                  </div>
                </div>
                <div className="rounded-xl border border-teal-200/80 bg-gradient-to-br from-teal-50 to-white p-4">
                  <p className="text-xs font-bold text-teal-700">Average wait</p>
                  <p className="mt-1 text-2xl font-black text-teal-900">6 min</p>
                  <div className="mt-2 h-1.5 w-full rounded-full bg-teal-100">
                    <div className="h-1.5 w-[60%] rounded-full bg-teal-500" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Active Patients', value: '50K+', icon: UserCheck },
              { label: 'Verified Doctors', value: '2,500+', icon: Stethoscope },
              { label: 'Success Rate', value: '98%', icon: TrendingUp },
              { label: 'Support Window', value: '24/7', icon: Clock3 },
            ].map((item) => (
              <article key={item.label} className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-[0_12px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl">
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sky-300">
                  <item.icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-black text-slate-900">{item.value}</p>
                <p className="text-sm font-medium text-slate-500">{item.label}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="highlights" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-200/80 bg-sky-50/80 px-4 py-2">
                <Zap className="h-4 w-4 text-sky-700" />
                <span className="text-sm font-bold text-sky-700">Highlights</span>
              </div>
              <h2 className="text-3xl font-black text-slate-900 sm:text-4xl">Modular, practical, daily ready</h2>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-sky-300 hover:text-sky-700 transition-colors"
            >
              Open Platform
            </button>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {modules.map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-200/80 bg-white/85 p-6 shadow-[0_14px_30px_rgba(2,132,199,0.08)] backdrop-blur-xl">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-sky-300">
                  <item.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-black text-slate-900">{item.title}</h3>
                <p className="mt-2 text-slate-600">{item.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="portals" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black text-slate-900 sm:text-4xl">Role Portals with unique workflows</h2>
            <p className="mt-3 text-slate-600">Pick your role and move into a focused workspace.</p>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {portals.map((portal) => (
              <button
                key={portal.name}
                onClick={() => navigate(portal.path)}
                className="group rounded-2xl border border-slate-200/80 bg-white/85 p-6 text-left shadow-[0_14px_30px_rgba(2,132,199,0.08)] backdrop-blur-xl hover:shadow-[0_18px_36px_rgba(2,132,199,0.14)] transition-all"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r ${portal.shade} text-white`}>
                    <portal.icon className="h-6 w-6" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{portal.name}</p>
                <p className="mb-3 mt-1 text-sm font-semibold text-slate-600">{portal.points[0]}</p>
                <ul className="space-y-2">
                  {portal.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-slate-600">
                      <ChevronRight className="mt-0.5 h-4 w-4 text-sky-500" />
                      {p}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section id="reviews" className="py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-slate-200/80 bg-white/85 p-8 shadow-[0_18px_38px_rgba(15,23,42,0.09)] backdrop-blur-xl">
            <div className="mb-4 flex items-center gap-2 text-amber-500">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className="h-5 w-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-xl font-semibold leading-relaxed text-slate-800">
              "{reviews[activeReview].text}"
            </p>
            <div className="mt-4">
              <p className="font-black text-slate-900">{reviews[activeReview].person}</p>
              <p className="text-sm text-slate-500">{reviews[activeReview].role}</p>
            </div>
            <div className="mt-5 flex items-center gap-2">
              {reviews.map((r, idx) => (
                <button
                  key={r.person}
                  onClick={() => setActiveReview(idx)}
                  className={`h-2 rounded-full transition-all ${
                    activeReview === idx ? 'w-8 bg-sky-600' : 'w-2 bg-slate-300'
                  }`}
                  aria-label={`Open review ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-9 text-white shadow-[0_24px_45px_rgba(15,23,42,0.28)]">
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <h2 className="text-3xl font-black sm:text-4xl">Ready to use HealthPath?</h2>
                <p className="mt-3 max-w-2xl text-slate-300">
                  Launch your role-specific workspace and begin coordinated healthcare operations.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 px-7 py-4 font-bold text-white"
                >
                  Enter Platform
                  <ArrowRight className="h-5 w-5" />
                </button>
                <button
                  onClick={() => smoothScroll('highlights')}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-600 px-7 py-4 font-bold text-slate-200 hover:border-slate-400"
                >
                  View Highlights
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
