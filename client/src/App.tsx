import { type FormEvent, type ReactNode, useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api, type AuthUser, type Profile } from './lib/api';

const tokenKey = 'edupredict_token';

type DashboardData = {
  role: string;
  summary: {
    averageGpa?: number;
    attendance?: number;
    riskScore?: number;
    totalStudents?: number;
    atRiskStudents?: number;
    averageRiskScore?: number;
  };
  profile?: Profile | null;
  assessment?: {
    riskScore?: number;
    riskLevel?: string;
    summary?: string;
    recommendations?: string;
    aiExplanation?: string;
  } | null;
  students?: Array<{
    id: string;
    name: string;
    email: string;
    course: string;
    department: string;
    riskScore: number;
    riskLevel: string;
    attendance: number;
  }>;
};

const defaultProfile: Profile = {
  studentId: '',
  course: '',
  department: '',
  semester: 'Semester 1',
  yearOfStudy: 1,
  previousSemesterGpa: 3.2,
  currentSemesterAverage: 68,
  catPerformance: 72,
  attendanceRate: 80,
  assignmentCompletion: 78,
  studyHours: 7,
  previousExamsFailures: 0,
  financialRisk: 2,
};

const platformFeatures = [
  {
    number: '01',
    title: 'See the signals sooner',
    description: 'Bring attendance, coursework and academic history into one clear view of student progress.',
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    number: '02',
    title: 'Understand every assessment',
    description: 'Review the factors behind a risk level instead of relying on an unexplained score.',
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    number: '03',
    title: 'Turn insight into support',
    description: 'Give students and lecturers practical next steps for timely, focused intervention.',
    icon: <Users className="h-5 w-5" />,
  },
];

function formatPercent(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'N/A';
  return `${Math.round(value)}%`;
}

function classForRisk(level?: string) {
  switch (level) {
    case 'High':
      return 'bg-red-500/15 text-red-300 border border-red-500/30';
    case 'Medium':
      return 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
    default:
      return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
  }
}

function ProtectedRoute({ user, children }: { user: AuthUser | null; children: ReactNode }) {
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AppShell({ user, setUser }: { user: AuthUser | null; setUser: (value: AuthUser | null) => void }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem(tokenKey);
    setUser(null);
    setMenuOpen(false);
    navigate('/login');
  };

  return (
    <div className="app-shell min-h-screen text-slate-100">
      <header className="site-header border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="site-header-inner mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/" className="flex min-w-0 items-center gap-3" onClick={() => setMenuOpen(false)}>
            <div className="rounded-xl bg-indigo-500/15 p-2 text-indigo-300">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="brand-name truncate text-base font-semibold sm:text-lg">EduPredict AI</p>
              <p className="hidden text-xs text-slate-400 sm:block">Academic early intervention</p>
            </div>
          </Link>

          <button
            type="button"
            className="nav-toggle"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <nav id="primary-navigation" aria-label="Main navigation" className={`site-nav ${menuOpen ? 'is-open' : ''}`}>
            {!user ? (
              <>
                <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`} onClick={() => setMenuOpen(false)}>Overview</NavLink>
                <span className="nav-divider" aria-hidden="true" />
                <NavLink to="/login" className={({ isActive }) => `nav-link ${isActive ? 'is-active' : ''}`} onClick={() => setMenuOpen(false)}>Sign in</NavLink>
                <Link to="/register" className="button-primary nav-register" onClick={() => setMenuOpen(false)}>Get started <ArrowRight className="h-3.5 w-3.5" /></Link>
              </>
            ) : (
              <>
                <NavLink to="/dashboard" className={({ isActive }) => `nav-link nav-route ${isActive ? 'is-active' : ''}`} onClick={() => setMenuOpen(false)}>
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </NavLink>
                <NavLink to="/profile" className={({ isActive }) => `nav-link nav-route ${isActive ? 'is-active' : ''}`} onClick={() => setMenuOpen(false)}>
                  <BookOpen className="h-4 w-4" />
                  Profile
                </NavLink>
                <span className="nav-divider" aria-hidden="true" />
                <button onClick={logout} className="nav-logout">
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<LandingPage user={user} />} />
          <Route path="/login" element={<LoginPage setUser={setUser} />} />
          <Route path="/register" element={<RegisterPage setUser={setUser} />} />
          <Route
            path="/dashboard"
            element={<ProtectedRoute user={user} children={<DashboardPage user={user!} />} />}
          />
          <Route
            path="/profile"
            element={<ProtectedRoute user={user} children={<ProfilePage user={user!} />} />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <SiteFooter user={user} />
    </div>
  );
}

function SiteFooter({ user }: { user: AuthUser | null }) {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner mx-auto max-w-7xl px-4 sm:px-6">
        <div className="site-footer-main">
          <section className="footer-brand" aria-labelledby="footer-brand-heading">
            <Link to="/" className="footer-brand-link">
              <span className="footer-brand-mark"><GraduationCap className="h-5 w-5" /></span>
              <span id="footer-brand-heading" className="footer-brand-name">EduPredict AI</span>
            </Link>
            <p className="footer-description">
              Clearer academic insight for more thoughtful, timely student support. Bringing progress signals together so educators and students can plan the next step with confidence.
            </p>
          </section>

          <nav className="footer-nav" aria-label="Explore EduPredict">
            <h2 className="footer-heading">Explore</h2>
            <Link to="/">Overview</Link>
            <a href="/#process-heading">How it works</a>
            {user && <Link to="/dashboard">Dashboard</Link>}
          </nav>

          <nav className="footer-nav" aria-label="Account">
            <h2 className="footer-heading">{user ? 'Your account' : 'Get started'}</h2>
            {user ? (
              <>
                <Link to="/profile">Academic profile</Link>
                <Link to="/dashboard">Student insights</Link>
              </>
            ) : (
              <>
                <Link to="/register">Create an account</Link>
                <Link to="/login">Sign in</Link>
              </>
            )}
          </nav>

          <section className="footer-note" aria-labelledby="footer-note-heading">
            <h2 id="footer-note-heading" className="footer-heading">Our approach</h2>
            <p>Assessment insights are designed to support human judgment and constructive conversations, not replace them.</p>
            <Link to={user ? '/dashboard' : '/register'} className="footer-action">
              {user ? 'Open your dashboard' : 'Start exploring'}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </section>
        </div>

        <div className="site-footer-bottom">
          <p>© {new Date().getFullYear()} EduPredict AI. All rights reserved.</p>
          <p>Built to help turn academic insight into meaningful support.</p>
        </div>
      </div>
    </footer>
  );
}

function LandingPage({ user }: { user: AuthUser | null }) {
  return (
    <div className="landing-page mx-auto flex max-w-7xl flex-col gap-16 px-4 pb-16 pt-9 sm:gap-24 sm:px-6 sm:pb-24 sm:pt-14">
      <section className="landing-hero grid min-w-0 items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div className="hero-copy">
          <div className="hero-eyebrow mb-6 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em]">
            <span className="hero-eyebrow-line" />
            Student success, with foresight
          </div>
          <h1 className="hero-title max-w-2xl text-5xl font-semibold leading-[1.03] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Every student deserves<br />
            <span className="hero-title-accent">a clearer way forward.</span>
          </h1>
          <p className="hero-description mt-6 max-w-xl text-base leading-8 text-slate-300 sm:mt-7 sm:text-lg">
            A more supportive way to understand academic progress. Bring performance signals together, see what may need attention, and find a thoughtful next step.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            {user ? (
              <Link to="/dashboard" className="button-primary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-semibold text-black">
                Open your dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link to="/register" className="button-primary inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 font-semibold text-black">
                  Create your account <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/login" className="button-secondary rounded-xl px-6 py-3.5 font-medium">
                  Sign in to your account
                </Link>
              </>
            )}
          </div>
          <div className="hero-assurance mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400 sm:mt-9">
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-amber-300" />Human-centered guidance</span>
            <span className="assurance-divider" aria-hidden="true" />
            <span>Built for students and educators</span>
          </div>
        </div>

        <figure className="hero-visual">
          <span className="hero-visual-orbit hero-visual-orbit-one" aria-hidden="true" />
          <span className="hero-visual-orbit hero-visual-orbit-two" aria-hidden="true" />
          <article className="hero-preview glass-panel rounded-[1.75rem] border border-slate-800 bg-slate-900/70 p-5 sm:p-7">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="hero-card-kicker">Illustrative student view</p>
                <h3 className="mt-2 text-xl font-semibold sm:text-2xl">Academic overview</h3>
              </div>
              <span className="sample-badge">Sample data</span>
            </div>

            <article className="hero-insight glass-card mb-4 flex items-center gap-4 rounded-2xl p-4 sm:gap-5 sm:p-5">
              <div className="risk-orbit" aria-label="Risk score 62 out of 100">
                <span><strong>62</strong><small>risk</small></span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-white">Needs a closer look</p>
                  <span className="sample-risk">Moderate</span>
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-400 sm:text-sm">Attendance and recent coursework may benefit from a supportive check-in.</p>
                <div className="risk-track mt-3"><span /></div>
              </div>
            </article>

            <dl className="hero-metrics grid grid-cols-2 gap-3 sm:gap-4">
              <div className="hero-metric glass-card rounded-2xl p-4">
                <dt className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Attendance</dt>
                <dd className="mt-3 text-2xl font-semibold text-white sm:text-3xl">76<span className="text-base text-slate-400">%</span></dd>
                <p className="hero-metric-footer mt-2 text-xs text-slate-500">A key participation signal</p>
              </div>
              <div className="hero-metric glass-card rounded-2xl p-4">
                <dt className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">Course average</dt>
                <dd className="mt-3 text-2xl font-semibold text-white sm:text-3xl">68<span className="text-base text-slate-400">%</span></dd>
                <p className="hero-metric-footer mt-2 text-xs text-slate-500">Across current coursework</p>
              </div>
            </dl>
            <div className="hero-preview-footer mt-5 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
              <span className="inline-flex items-center gap-2 text-xs text-slate-400"><span className="pulse-dot" />Signals brought into one view</span>
              <span className="text-xs text-slate-500">Example only</span>
            </div>
          </article>
        </figure>

      </section>

      <section className="landing-process" aria-labelledby="process-heading">
        <header className="process-heading mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <section>
            <p className="hero-eyebrow mb-3 text-xs font-semibold uppercase tracking-[0.2em]">A thoughtful process</p>
            <h2 id="process-heading" className="max-w-2xl text-3xl font-semibold text-white sm:text-4xl">From academic signals to meaningful support.</h2>
          </section>
          <p className="max-w-md text-sm leading-7 text-slate-400 sm:text-base">A simple, transparent flow that helps turn information into a timely conversation.</p>
        </header>
        <ol className="process-list">
          {platformFeatures.map((feature) => (
            <li key={feature.number} className="process-step">
              <span className="process-marker" aria-hidden="true">{feature.icon}</span>
              <article className="process-copy">
                <p className="process-kicker">STEP {feature.number}</p>
                <h3 className="mt-2 text-xl font-semibold text-white sm:text-2xl">{feature.title}</h3>
                <p className="mt-2 max-w-xl text-sm leading-7 text-slate-400 sm:text-base">{feature.description}</p>
              </article>
              <ArrowRight className="process-arrow hidden h-5 w-5 sm:block" aria-hidden="true" />
            </li>
          ))}
        </ol>
      </section>

      <section className="landing-cta" aria-labelledby="cta-heading">
        <header className="landing-cta-copy">
          <p className="hero-eyebrow mb-2 text-xs font-semibold uppercase tracking-[0.2em]">A better starting point</p>
          <h2 id="cta-heading" className="text-2xl font-semibold text-white sm:text-3xl">Make the next step a supportive one.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Bring academic signals together and start a clearer conversation about student progress.</p>
        </header>
        {user ? (
          <Link to="/dashboard" className="button-primary inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold">
            Go to dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        ) : (
          <Link to="/register" className="button-primary inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold">
            Get started <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </section>
    </div>
  );
}

function LoginPage({ setUser }: { setUser: (value: AuthUser | null) => void }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const token = response.data.token as string;
      const user = response.data.user as AuthUser;
      localStorage.setItem(tokenKey, token);
      setUser(user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 sm:py-16">
    <div className="glass-panel rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-indigo-500/15 p-2 text-indigo-300"><GraduationCap className="h-5 w-5" /></div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Welcome back</p>
            <h2 className="text-2xl font-semibold text-white">Sign in</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm text-slate-300">Email</label>
            <input className="form-control w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none ring-0 transition focus:border-indigo-400" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Password</label>
            <input className="form-control w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none transition focus:border-indigo-400" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          <button type="submit" disabled={isSubmitting} className="button-primary w-full rounded-xl px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60">
            {isSubmitting ? 'Signing in...' : 'Login'}
          </button>
          <p className="text-center text-sm text-slate-400">
            Need an account? <Link to="/register" className="text-indigo-300">Register here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}

function RegisterPage({ setUser }: { setUser: (value: AuthUser | null) => void }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    registrationNumber: '',
    department: '',
    course: '',
    yearOfStudy: '1',
    role: 'student',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (key: string, value: string) => setForm((current) => ({ ...current, [key]: value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await api.post('/auth/register', {
        ...form,
        yearOfStudy: Number(form.yearOfStudy),
      });
      const token = response.data.token as string;
      const user = response.data.user as AuthUser;
      localStorage.setItem(tokenKey, token);
      setUser(user);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Registration failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
    <div className="glass-panel rounded-3xl border border-slate-800 bg-slate-900/70 p-5 sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-indigo-500/15 p-2 text-indigo-300"><Sparkles className="h-5 w-5" /></div>
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-slate-400">New account</p>
            <h2 className="text-2xl font-semibold text-white">Create your EduPredict profile</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="grid min-w-0 gap-4 sm:gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm text-slate-300">Full name</label>
            <input className="form-control w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white focus:border-indigo-400" type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Email</label>
            <input className="form-control w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white focus:border-indigo-400" type="email" value={form.email} onChange={(e) => handleChange('email', e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Password</label>
            <input className="form-control w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white focus:border-indigo-400" type="password" value={form.password} onChange={(e) => handleChange('password', e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Registration number</label>
            <input className="form-control w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white focus:border-indigo-400" type="text" value={form.registrationNumber} onChange={(e) => handleChange('registrationNumber', e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Department</label>
            <input className="form-control w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white focus:border-indigo-400" type="text" value={form.department} onChange={(e) => handleChange('department', e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Course / programme</label>
            <input className="form-control w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white focus:border-indigo-400" type="text" value={form.course} onChange={(e) => handleChange('course', e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Year of study</label>
            <select className="form-control w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white focus:border-indigo-400" value={form.yearOfStudy} onChange={(e) => handleChange('yearOfStudy', e.target.value)}>
              {[1, 2, 3, 4, 5].map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Role</label>
            <select className="form-control w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white focus:border-indigo-400" value={form.role} onChange={(e) => handleChange('role', e.target.value)}>
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
            </select>
          </div>

          {error && <p className="md:col-span-2 text-sm text-red-300">{error}</p>}

          <button type="submit" disabled={isSubmitting} className="button-primary md:col-span-2 w-full rounded-xl px-4 py-3 font-medium text-white disabled:opacity-60">
            {isSubmitting ? 'Creating account...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}

function DashboardPage({ user }: { user: AuthUser }) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/dashboard/overview')
      .then((response) => setDashboard(response.data))
      .catch(() => setError('Unable to load dashboard data.'));
  }, []);

  if (error) {
    return <div className="mx-auto max-w-4xl px-6 py-20 text-red-300">{error}</div>;
  }

  if (!dashboard) {
    return <div className="mx-auto max-w-4xl px-6 py-20 text-slate-300">Loading dashboard...</div>;
  }

  const chartData = useMemo(() => {
    if (dashboard.role === 'student') {
      return [
        { name: 'Week 1', score: 70 },
        { name: 'Week 2', score: 74 },
        { name: 'Week 3', score: 68 },
        { name: 'Week 4', score: 77 },
        { name: 'Week 5', score: dashboard.assessment?.riskScore ?? 60 },
      ];
    }

    return (dashboard.students ?? []).map((student) => ({
      name: student.name.split(' ')[0],
      risk: student.riskScore,
      attendance: student.attendance,
    }));
  }, [dashboard]);

  const riskLevel = dashboard.assessment?.riskLevel ?? 'Low';
  const riskScore = dashboard.assessment?.riskScore ?? dashboard.summary.averageRiskScore ?? 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400 sm:text-sm">{user.role === 'student' ? 'Student dashboard' : 'Lecturer dashboard'}</p>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Welcome back, {user.name}</h1>
        </div>
        <span className={`rounded-full px-3 py-1.5 text-sm font-medium ${classForRisk(riskLevel)}`}>{riskLevel} risk</span>
      </div>

      <div className="dashboard-stats grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-4">
        <StatCard className="dashboard-stat-one" label="Current risk score" value={`${Math.round(riskScore)}`} footer="Latest assessment" tone="amber" icon={<BarChart3 className="h-5 w-5" />} />
        <StatCard className="dashboard-stat-two" label="Attendance" value={formatPercent(dashboard.profile?.attendanceRate ?? dashboard.summary.attendance)} footer="Academic profile" tone="emerald" icon={<Users className="h-5 w-5" />} />
        <StatCard className="dashboard-stat-three" label="Average GPA" value={(dashboard.profile?.previousSemesterGpa ?? dashboard.summary.averageGpa ?? 0).toFixed(1)} footer="Previous semester" tone="sky" icon={<BookOpen className="h-5 w-5" />} />
        <StatCard className="dashboard-stat-four" label="Recommendations" value={dashboard.assessment?.recommendations ? `${dashboard.assessment.recommendations.split(' ').length} points` : '1 plan'} footer="Personalized support plan" tone="violet" icon={<Sparkles className="h-5 w-5" />} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
        <div className="glass-panel min-w-0 rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">Risk trend</h2>
            <span className="text-sm text-slate-400">Updated this week</span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="riskFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#e0bd70" stopOpacity={0.58} />
                    <stop offset="95%" stopColor="#e0bd70" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#393326" strokeDasharray="3 3" />
                <XAxis dataKey="name" stroke="#a99b7c" />
                <YAxis stroke="#a99b7c" domain={[0, 100]} />
                <Tooltip contentStyle={{ background: '#11100d', border: '1px solid #5b4928', borderRadius: '12px', color: '#f1e4c4' }} />
                <Area type="monotone" dataKey={dashboard.role === 'student' ? 'score' : 'risk'} stroke="#d6b765" strokeWidth={2.5} fillOpacity={1} fill="url(#riskFill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel min-w-0 rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
          <h2 className="text-xl font-semibold text-white">AI insight</h2>
          <div className="glass-card mt-4 rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-4 text-sm leading-relaxed text-slate-200">
            {dashboard.assessment?.aiExplanation ?? 'No AI explanation available.'}
          </div>
          <div className="mt-6 space-y-3">
            <p className="text-sm font-medium text-slate-300">Recommended next steps</p>
            <ul className="space-y-2 text-sm text-slate-300">
              {(dashboard.assessment?.recommendations ?? 'Maintain current progress and continue academic planning.').split('. ').filter(Boolean).map((item, index) => (
                <li key={index} className="flex gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-indigo-400" />
                  <span>{item.trim().replace(/\.$/, '')}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="glass-panel min-w-0 rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
          <h2 className="text-xl font-semibold text-white">Academic overview</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <InsightTile label="Attendance" value={formatPercent(dashboard.profile?.attendanceRate ?? dashboard.summary.attendance)} />
            <InsightTile label="Current semester average" value={formatPercent(dashboard.profile?.currentSemesterAverage ?? 0)} />
            <InsightTile label="CAT performance" value={formatPercent(dashboard.profile?.catPerformance ?? 0)} />
            <InsightTile label="Study hours" value={`${dashboard.profile?.studyHours ?? 7} hrs/week`} />
          </div>
        </div>

        <div className="glass-panel min-w-0 rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
          <h2 className="text-xl font-semibold text-white">Priority alerts</h2>
          <div className="mt-5 space-y-3 text-sm text-slate-300">
            <AlertRow label="Attendance gap" value={dashboard.profile?.attendanceRate ? `${100 - dashboard.profile.attendanceRate}%` : '12%'} />
            <AlertRow label="Assignments" value={dashboard.profile?.assignmentCompletion ? `${100 - dashboard.profile.assignmentCompletion}%` : '18%'} />
            <AlertRow label="Financial support" value={dashboard.profile?.financialRisk ? `${dashboard.profile.financialRisk}/5` : '2/5'} />
          </div>
        </div>
      </div>

      {dashboard.role !== 'student' && (
        <div className="glass-panel mt-8 min-w-0 rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
          <h2 className="text-xl font-semibold text-white">Student support list</h2>
          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-800">
            <table className="min-w-[36rem] text-left text-sm text-slate-200 sm:min-w-full">
              <thead className="bg-slate-800/80 text-slate-300">
                <tr>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Course</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Attendance</th>
                </tr>
              </thead>
              <tbody>
                {(dashboard.students ?? []).map((student) => (
                  <tr key={student.id} className="border-t border-slate-800">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-white">{student.name}</p>
                        <p className="text-xs text-slate-400">{student.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">{student.course}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-xs ${classForRisk(student.riskLevel)}`}>{student.riskLevel}</span></td>
                    <td className="px-4 py-3">{student.attendance}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ProfilePage({ user }: { user: AuthUser }) {
  const [form, setForm] = useState<Profile>(defaultProfile);
  const [isSaving, setIsSaving] = useState(false);
  const [isAssessing, setIsAssessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    api.get('/students/profile')
      .then((response) => {
        const profile = response.data.profile ?? defaultProfile;
        setForm({
          ...defaultProfile,
          ...profile,
        });
      })
      .catch(() => {
        setForm(defaultProfile);
      });
  }, []);

  const updateField = (field: keyof Profile, value: string | number) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await api.post('/students/profile', form);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAssess = async () => {
    setIsAssessing(true);
    try {
      const response = await api.post('/students/assess', form);
      setResult(response.data.assessment);
    } finally {
      setIsAssessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-slate-400">Academic profile</p>
          <h1 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Update student performance details</h1>
        </div>
        <div className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-sm text-indigo-200">Student profile</div>
      </div>

      <div className="grid min-w-0 gap-5 lg:grid-cols-[1.2fr_0.8fr] lg:gap-8">
        <div className="glass-panel min-w-0 rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
            <Field label="Student ID" value={form.studentId ?? ''} onChange={(value) => updateField('studentId', value)} />
            <Field label="Course" value={form.course ?? ''} onChange={(value) => updateField('course', value)} />
            <Field label="Department" value={form.department ?? ''} onChange={(value) => updateField('department', value)} />
            <Field label="Semester" value={form.semester ?? ''} onChange={(value) => updateField('semester', value)} />
            <Field label="Year of study" type="number" value={form.yearOfStudy ?? 1} onChange={(value) => updateField('yearOfStudy', Number(value))} />
            <Field label="Previous semester GPA" type="number" value={form.previousSemesterGpa ?? 0} onChange={(value) => updateField('previousSemesterGpa', Number(value))} />
            <Field label="Current average" type="number" value={form.currentSemesterAverage ?? 0} onChange={(value) => updateField('currentSemesterAverage', Number(value))} />
            <Field label="CAT performance" type="number" value={form.catPerformance ?? 0} onChange={(value) => updateField('catPerformance', Number(value))} />
            <Field label="Attendance rate" type="number" value={form.attendanceRate ?? 0} onChange={(value) => updateField('attendanceRate', Number(value))} />
            <Field label="Assignment completion" type="number" value={form.assignmentCompletion ?? 0} onChange={(value) => updateField('assignmentCompletion', Number(value))} />
            <Field label="Study hours/week" type="number" value={form.studyHours ?? 0} onChange={(value) => updateField('studyHours', Number(value))} />
            <Field label="Failed exams" type="number" value={form.previousExamsFailures ?? 0} onChange={(value) => updateField('previousExamsFailures', Number(value))} />
            <Field label="Financial risk (1-5)" type="number" value={form.financialRisk ?? 0} onChange={(value) => updateField('financialRisk', Number(value))} />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button onClick={handleSave} disabled={isSaving} className="button-primary rounded-xl px-4 py-2.5 font-medium text-white disabled:opacity-60">
              {isSaving ? 'Saving...' : 'Save profile'}
            </button>
            <button onClick={handleAssess} disabled={isAssessing} className="button-secondary rounded-xl px-4 py-2.5 font-medium text-slate-100 disabled:opacity-60">
              {isAssessing ? 'Assessing...' : 'Run AI risk assessment'}
            </button>
          </div>
        </div>

        <div className="glass-panel min-w-0 rounded-3xl border border-slate-800 bg-slate-900/70 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-white">Latest assessment</h2>
          {result ? (
            <div className="mt-5 space-y-4">
              <div className="glass-card rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Risk level</p>
                <p className="mt-2 text-2xl font-bold">{result.riskLevel}</p>
                <p className="mt-1 text-emerald-100">Score: {result.riskScore}</p>
              </div>
              <div>
                <p className="text-sm text-slate-300">Summary</p>
                <p className="mt-2 text-sm text-slate-200">{result.summary}</p>
              </div>
              <div>
                <p className="text-sm text-slate-300">Recommendations</p>
                <p className="mt-2 text-sm text-slate-200">{result.recommendations}</p>
              </div>
              <div>
                <p className="text-sm text-slate-300">AI explanation</p>
                <p className="mt-2 text-sm text-slate-200">{result.aiExplanation}</p>
              </div>
            </div>
          ) : (
            <div className="glass-card mt-6 rounded-2xl border border-dashed border-slate-700 p-6 text-sm text-slate-400">
              Run the assessment to generate a student risk analysis and intervention plan.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, footer, tone, icon, className = '' }: { label: string; value: string; footer: string; tone: string; icon: ReactNode; className?: string }) {
  const toneMap: Record<string, string> = {
    amber: 'bg-amber-500/15 text-amber-200',
    emerald: 'bg-emerald-500/15 text-emerald-200',
    sky: 'bg-sky-500/15 text-sky-200',
    violet: 'bg-violet-500/15 text-violet-200',
  };

  return (
    <div className={`glass-panel flex flex-col rounded-3xl border border-slate-800 bg-slate-900/70 p-5 ${className}`}>
      <div className={`mb-4 inline-flex rounded-xl p-2 ${toneMap[tone]}`}>{icon}</div>
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
      <footer className="card-footer mt-5">{footer}</footer>
    </div>
  );
}

function InsightTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card rounded-2xl border border-slate-800 bg-slate-950 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
      <footer className="card-footer mt-4">Academic profile</footer>
    </div>
  );
}

function AlertRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-card flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950 px-3 py-2">
      <span className="text-slate-300">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: { label: string; value: string | number; onChange: (value: string) => void; type?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm text-slate-300">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="form-control w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none transition focus:border-indigo-400"
      />
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem(tokenKey);
    if (!token) {
      setIsAuthenticating(false);
      return;
    }

    api
      .get('/auth/me')
      .then((response) => setUser(response.data.user))
      .catch(() => localStorage.removeItem(tokenKey))
      .finally(() => setIsAuthenticating(false));
  }, []);

  if (isAuthenticating) {
    return <div className="flex min-h-screen items-center justify-center text-slate-300">Loading EduPredict AI...</div>;
  }

  return <AppShell user={user} setUser={setUser} />;
}
