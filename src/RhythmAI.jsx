import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  AreaChart, Area, LineChart, Line, ReferenceLine, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  Brain, TrendingUp, Activity, Terminal, Zap, 
  CheckCircle2, AlertCircle, Download, Upload, ChevronRight, Clock,
  Lock, User, Mail, LogOut, Lightbulb, Moon, Sun, Coffee, ArrowRight, FileJson
} from 'lucide-react';

// --- 1. SCIENTIFIC & UTILITY ENGINE ---

/**
 * Neuro-Probability Calculator
 * Uses circadian markers to predict cognitive capacity.
 */
const calculateNeuroProbability = (targetHour, duration, history, dailyLog) => {
  let probability = 0.5; 
  const relevantHistory = history.filter(h => Math.floor(h.hour) === Math.floor(targetHour));
  
  // A. Historical Baseline
  if (relevantHistory.length > 0) {
    const avgPerf = relevantHistory.reduce((acc, cur) => acc + (cur.focus + cur.energy), 0) / (relevantHistory.length * 10);
    probability = avgPerf;
  }

  // B. Circadian Modifiers (Biology)
  const hour = targetHour % 24;
  // Cortisol Awakening Response (Peak Alertness)
  if (hour >= 8 && hour <= 11) probability += 0.15; 
  // Post-Prandial Dip (Afternoon slump)
  if (hour >= 13 && hour <= 15) probability -= 0.15;
  // Late Night Melatonin Onset
  if (hour >= 22 || hour <= 4) probability -= 0.2;

  // C. Allostatic Load (Fatigue accumulation from today's work)
  // We look at the *immediate previous* hour.
  const prevHourKey = Math.floor(targetHour) - 1;
  const prevLog = dailyLog[prevHourKey];
  
  if (prevLog) {
    const intensity = prevLog.focus + prevLog.energy;
    if (intensity >= 8) probability -= 0.15; // High drain penalty
    if (intensity <= 4) probability += 0.05; // Recovery bonus
  }

  return Math.min(0.98, Math.max(0.1, probability));
};

/**
 * Time Parser
 * Handles "6a", "6.5a" (6:30am), "12p", "12.5p"
 */
const parseTimeToken = (token) => {
  const modifier = token.slice(-1).toLowerCase(); // 'a' or 'p'
  const valueStr = token.slice(0, -1); // '6' or '6.5'
  let value = parseFloat(valueStr);

  if (isNaN(value)) return null;

  if (modifier === 'a') {
    if (value === 12 || value === 12.0 || value === 12.5) return value === 12.5 ? 0.5 : 0;
    return value;
  }
  if (modifier === 'p') {
    return value >= 12 ? value : value + 12;
  }
  return value; // Fallback
};

/**
 * Formats decimal hour to string (e.g., 14.5 -> "2:30 PM")
 */
const formatDecimalTime = (decimalTime) => {
  const hrs = Math.floor(decimalTime);
  const mins = Math.round((decimalTime - hrs) * 60);
  const suffix = hrs >= 12 ? 'PM' : 'AM';
  const displayHrs = hrs % 12 || 12;
  const displayMins = mins < 10 ? `0${mins}` : mins;
  return `${displayHrs}:${displayMins} ${suffix}`;
};

// --- 2. DATA CONSTANTS ---

const SCIENCE_TIPS = [
  {
    id: 1,
    category: 'Circadian',
    icon: Sun,
    title: 'Morning Sunlight Protocol',
    desc: 'View sunlight for 5-10 mins within 1 hour of waking. This sets your circadian pacemaker (suprachiasmatic nucleus) to release cortisol early and melatonin 16 hours later.',
    color: 'text-amber-500 bg-amber-50'
  },
  {
    id: 2,
    category: 'Focus',
    icon: Brain,
    title: 'Ultradian Cycles (90 Mins)',
    desc: ' The brain can only maintain high-intensity focus for about 90 minutes. After this, you hit a "biological floor." Take a 20-min non-sleep deep rest (NSDR) or walk.',
    color: 'text-emerald-600 bg-emerald-50'
  },
  {
    id: 3,
    category: 'Rest',
    icon: Moon,
    title: 'The 10-3-2-1 Rule',
    desc: '10h before bed: No caffeine. 3h before: No food. 2h before: No work. 1h before: No screens. This optimizes sleep architecture and memory consolidation.',
    color: 'text-indigo-600 bg-indigo-50'
  },
  {
    id: 4,
    category: 'Alertness',
    icon: Coffee,
    title: 'Adenosine Delay',
    desc: 'Wait 90 minutes after waking before drinking caffeine. This allows your body to naturally clear adenosine (sleep pressure) instead of just masking it.',
    color: 'text-rose-600 bg-rose-50'
  }
];

// --- 3. AUTH COMPONENT ---

const AuthScreen = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    const users = JSON.parse(localStorage.getItem('rhythm_users') || '{}');
    
    if (isRegistering) {
      if (users[formData.email]) {
        setError('User already exists.');
        return;
      }
      users[formData.email] = { ...formData };
      localStorage.setItem('rhythm_users', JSON.stringify(users));
      onLogin(users[formData.email]);
    } else {
      const user = users[formData.email];
      if (user && user.password === formData.password) {
        onLogin(user);
      } else {
        setError('Invalid credentials.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-emerald-600 p-3 rounded-xl shadow-lg">
              <Brain className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-center text-slate-800 mb-2">Rhythm.AI</h2>
          <p className="text-center text-slate-500 mb-8">Neuro-Productivity Tracker</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    required 
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input 
                  type="email" 
                  required 
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                <input 
                  type="password" 
                  required 
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>
            </div>

            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition shadow-md">
              {isRegistering ? 'Create Account' : 'Sign In'}
            </button>
          </form>
        </div>
        <div className="bg-slate-50 p-4 text-center border-t border-slate-200">
          <button 
            onClick={() => setIsRegistering(!isRegistering)}
            className="text-sm text-emerald-600 font-medium hover:text-emerald-700 transition"
          >
            {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Register'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 4. MAIN APP COMPONENT ---

const RhythmAI = () => {
  // Auth State
  const [user, setUser] = useState(null);
  
  // App State
  const [view, setView] = useState('dashboard'); // 'dashboard' | 'tips'
  const [commandInput, setCommandInput] = useState('');
  const [timelineData, setTimelineData] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [lastCommandStatus, setLastCommandStatus] = useState(null);

  // Load User Session
  useEffect(() => {
    const storedUser = localStorage.getItem('rhythm_current_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      loadUserData(parsedUser.email);
    }
  }, []);

  const loadUserData = (email) => {
    const data = localStorage.getItem(`rhythm_data_${email}`);
    if (data) setTimelineData(JSON.parse(data));
    else setTimelineData({});
  };

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('rhythm_current_user', JSON.stringify(userData));
    loadUserData(userData.email);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('rhythm_current_user');
    setTimelineData({});
  };

  // --- IMPORT / EXPORT LOGIC ---

  const handleExport = () => {
    const dataStr = JSON.stringify(timelineData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rhythm_ai_backup_${user.email}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setLastCommandStatus({ type: 'success', msg: 'Data exported successfully.' });
  };

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        setTimelineData(imported);
        localStorage.setItem(`rhythm_data_${user.email}`, JSON.stringify(imported));
        setLastCommandStatus({ type: 'success', msg: 'Database imported successfully.' });
      } catch (err) {
        setLastCommandStatus({ type: 'error', msg: 'Invalid JSON file.' });
      }
    };
    reader.readAsText(file);
  };

  // --- CORE LOGIC: COMMAND PARSER ---

  const processCommand = (e) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    // Regex: 6a^10a%note%f4e5 OR 6.5a^7.5a%note%f4e5
    const regex = /^([\d\.]+[ap])\^([\d\.]+[ap])\%(.+)\%f(\d)e(\d)$/i;
    const match = commandInput.trim().match(regex);

    if (!match) {
      setLastCommandStatus({ type: 'error', msg: 'Format: 6a^10a%Task%f5e4 or 6.5a^7.5a%Task%f5e4' });
      return;
    }

    try {
      const [_, startStr, endStr, note, focusStr, energyStr] = match;
      let startVal = parseTimeToken(startStr);
      let endVal = parseTimeToken(endStr);
      const focus = parseInt(focusStr);
      const energy = parseInt(energyStr);

      if (startVal === null || endVal === null) throw new Error("Invalid time format.");
      if (focus < 1 || focus > 5 || energy < 1 || energy > 5) throw new Error("Scores must be 1-5.");
      if (endVal <= startVal) endVal += 24; // Handle overnight 11p^1a

      setTimelineData(prev => {
        const newData = { ...prev };
        const dayData = newData[selectedDate] || {};

        // CRITICAL: Loop through the range and log appropriately
        // If user enters 6a^9a, we log 6.0, 7.0, 8.0.
        // If user enters 6.5a^7.5a, we log 6.5.
        
        let current = startVal;
        while (current < endVal) {
          const hourKey = current; // Can be decimal (6.5)
          dayData[hourKey] = {
            activity: note,
            focus,
            energy,
            timestamp: new Date().toISOString()
          };
          
          // Increment logic:
          // If current is integer (6), next is 7.
          // If current is decimal (6.5), next is 7.5.
          // This prevents infinite loops and handles blocks properly.
          current += 1; 
        }

        newData[selectedDate] = dayData;
        localStorage.setItem(`rhythm_data_${user.email}`, JSON.stringify(newData));
        return newData;
      });

      setLastCommandStatus({ type: 'success', msg: `Logged: "${note}" (${startStr} - ${endStr})` });
      setCommandInput('');
    } catch (err) {
      setLastCommandStatus({ type: 'error', msg: err.message });
    }
  };

  // --- ANALYTICS ENGINE ---

  const analysis = useMemo(() => {
    const todayData = timelineData[selectedDate] || {};
    
    // Sort keys numerically to handle decimals properly
    const sortedKeys = Object.keys(todayData).map(Number).sort((a, b) => a - b);
    
    // If no data, generate empty shell from 6am to 10pm
    const hoursToDisplay = sortedKeys.length > 0 
      ? Array.from(new Set([...sortedKeys, ...Array.from({length: 15}, (_, i) => i + 6)])).sort((a,b) => a-b)
      : Array.from({ length: 15 }, (_, i) => i + 6);

    const chartData = hoursToDisplay.map(h => {
      const record = todayData[h];
      const history = Object.values(timelineData).flatMap(d => {
        // Find matches for this specific hour across all days
        return Object.entries(d)
          .filter(([k, v]) => Math.abs(parseFloat(k) - h) < 0.1)
          .map(([_, v]) => ({ ...v, hour: h }));
      });

      const predicted = calculateNeuroProbability(h, 60, history, todayData);

      return {
        rawHour: h,
        displayTime: formatDecimalTime(h),
        focus: record ? record.focus : 0,
        energy: record ? record.energy : 0,
        predicted: (predicted * 5).toFixed(1),
        activity: record ? record.activity : null,
      };
    });

    // Calculate Averages
    const validRecords = Object.values(todayData);
    const avgFocus = validRecords.length ? (validRecords.reduce((a, b) => a + b.focus, 0) / validRecords.length).toFixed(1) : 0;
    const avgEnergy = validRecords.length ? (validRecords.reduce((a, b) => a + b.energy, 0) / validRecords.length).toFixed(1) : 0;

    return { chartData, avgFocus, avgEnergy, count: validRecords.length };
  }, [timelineData, selectedDate]);

  // --- RENDER IF NOT LOGGED IN ---
  if (!user) return <AuthScreen onLogin={handleLogin} />;

  // --- MAIN DASHBOARD RENDER ---
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-emerald-100">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => setView('dashboard')}>
              <div className="bg-emerald-600 p-2 rounded-lg shadow-md">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 leading-none">Rhythm.AI</h1>
                <span className="text-xs text-slate-500 font-medium">Pro Edition v2.0</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button 
                onClick={() => setView(view === 'dashboard' ? 'tips' : 'dashboard')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition ${view === 'tips' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {view === 'dashboard' ? <Lightbulb className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                {view === 'dashboard' ? 'Neuro Tips' : 'Dashboard'}
              </button>
              
              <div className="h-6 w-px bg-slate-300 mx-1"></div>

              <button onClick={handleExport} className="p-2 hover:bg-slate-100 rounded-full text-slate-500" title="Export Data">
                <Download className="w-5 h-5" />
              </button>
              <label className="p-2 hover:bg-slate-100 rounded-full text-slate-500 cursor-pointer" title="Import Data">
                <Upload className="w-5 h-5" />
                <input type="file" accept=".json" className="hidden" onChange={handleImport} />
              </label>
              <button onClick={handleLogout} className="p-2 hover:bg-red-50 rounded-full text-red-500" title="Logout">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* COMMAND LINE INTERFACE */}
          {view === 'dashboard' && (
            <div className="bg-slate-900 rounded-xl p-1.5 shadow-xl ring-1 ring-slate-900/5">
              <div className="flex items-center justify-between px-3 py-1.5 text-[10px] sm:text-xs font-mono text-slate-400 border-b border-slate-700/50 mb-1">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <Terminal className="w-3 h-3" />
                    <span>COMMAND MODE</span>
                  </div>
                  <span className="hidden sm:inline opacity-50">|</span>
                  <span className="hidden sm:inline">Ranges: <span className="text-emerald-400">6a^9a</span> (6-9am)</span>
                  <span className="hidden sm:inline opacity-50">|</span>
                  <span className="hidden sm:inline">Decimals: <span className="text-emerald-400">6.5a</span> (6:30am)</span>
                  <span className="hidden sm:inline opacity-50">|</span>
                  <span className="hidden sm:inline">copy format from here: <span className="text-emerald-400">8a^12p%Deep Work%f5e4</span></span>
                </div>
                {lastCommandStatus && (
                  <span className={`font-bold ${lastCommandStatus.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>
                    {lastCommandStatus.type === 'error' ? 'ERR >' : 'OK >'} {lastCommandStatus.msg}
                  </span>
                )}
              </div>
              <form onSubmit={processCommand} className="flex items-center gap-3 px-3 pb-1">
                <ChevronRight className="w-5 h-5 text-emerald-500 animate-pulse flex-shrink-0" />
                <input
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  placeholder="6a^10a%Deep Work%f5e4"
                  className="w-full bg-transparent border-none text-white font-mono text-sm focus:ring-0 placeholder:text-slate-600 py-2"
                  autoFocus
                />
              </form>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* VIEW: NEURO TIPS */}
        {view === 'tips' && (
          <div className="animate-in fade-in duration-500 slide-in-from-bottom-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900">Neuro-Optimization Protocols</h2>
              <p className="text-slate-500 mt-2 max-w-2xl mx-auto">
                Scientific levers to control your autonomic nervous system, alertness, and recovery.
                Based on current peer-reviewed literature.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {SCIENCE_TIPS.map((tip) => (
                <div key={tip.id} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${tip.color}`}>
                      <tip.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-bold text-slate-800">{tip.title}</h3>
                        <span className="text-xs font-medium uppercase tracking-wider px-2 py-1 bg-slate-100 text-slate-500 rounded-full">{tip.category}</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed text-sm">
                        {tip.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">The "Refractory Period" Rule</h3>
                  <p className="text-indigo-100 max-w-xl">
                    High focus consumes massive amounts of glucose and catecholamines (dopamine/norepinephrine). 
                    Your brain *requires* a low-stimulation refractory period after a sprint. 
                    If you log a "f5e5" session, force a 15-minute break immediately after.
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                  <Activity className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: DASHBOARD */}
        {view === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">

            {/* LEFT: ANALYTICS */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* MAIN CHART */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Today's Rhythm</h2>
                    <p className="text-sm text-slate-500 flex items-center gap-2">
                      <Clock className="w-3 h-3" /> {formatDecimalTime(Math.min(...analysis.chartData.map(d=>d.rawHour)))} - {formatDecimalTime(Math.max(...analysis.chartData.map(d=>d.rawHour)))}
                    </p>
                  </div>
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-slate-50 border-none rounded-lg px-3 py-1 text-sm text-slate-600 focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                </div>

                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analysis.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="displayTime" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                      <YAxis domain={[0, 6]} hide />
                      <Tooltip 
                        cursor={{fill: '#f8fafc'}}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-700">
                                <p className="font-bold mb-2 text-emerald-400 text-sm">{data.displayTime}</p>
                                {data.activity && <div className="mb-2 pb-2 border-b border-slate-600 font-medium">{data.activity}</div>}
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                  <span className="text-slate-400">Focus:</span> <span>{data.focus}/5</span>
                                  <span className="text-slate-400">Energy:</span> <span>{data.energy}/5</span>
                                  <span className="text-slate-400">Predicted:</span> <span>{data.predicted}/5</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend verticalAlign="top" height={36} iconType="circle" />
                      <Bar name="Focus" dataKey="focus" fill="#10b981" radius={[4, 4, 0, 0]} barSize={16} />
                      <Bar name="Energy" dataKey="energy" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={16} />
                      <Line name="Capacity Limit" type="monotone" dataKey="predicted" stroke="#94a3b8" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* SUMMARY METRICS */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Focus</span>
                    <Brain className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-3xl font-bold text-slate-800">{analysis.avgFocus}</div>
                  <div className="text-xs text-slate-500 mt-1">Target: &gt; 3.5</div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Energy</span>
                    <Zap className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-3xl font-bold text-slate-800">{analysis.avgEnergy}</div>
                  <div className="text-xs text-slate-500 mt-1">Target: &gt; 3.0</div>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Logged Hours</span>
                    <Clock className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-3xl font-bold text-slate-800">{analysis.count}</div>
                  <div className="text-xs text-slate-500 mt-1">Total Entries</div>
                </div>
              </div>

            </div>

            {/* RIGHT: LOG FEED */}
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-[600px] flex flex-col">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-400" /> Activity Feed
                </h3>
                
                <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                  {analysis.chartData.filter(d => d.activity).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm text-center border-2 border-dashed border-slate-100 rounded-xl p-4">
                      <Terminal className="w-8 h-8 mb-2 opacity-50" />
                      <p>No logs found for {selectedDate}.</p>
                      <p className="mt-2 text-xs bg-slate-50 px-2 py-1 rounded">Try: 8a^12p%Deep Work%f5e4</p>
                    </div>
                  ) : (
                    [...analysis.chartData].reverse().filter(d => d.activity).map((log, idx) => (
                      <div key={idx} className="relative pl-4 pb-1 group">
                        {/* Timeline Line */}
                        <div className="absolute left-0 top-2 bottom-0 w-px bg-slate-200 group-last:bottom-auto group-last:h-full"></div>
                        <div className="absolute left-[-4px] top-2 w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-white"></div>
                        
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 hover:border-emerald-200 hover:shadow-sm transition-all">
                          <div className="flex justify-between items-start mb-1">
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                              {log.displayTime}
                            </span>
                            <div className="flex gap-1">
                              {log.focus >= 4 && <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />}
                            </div>
                          </div>
                          <p className="text-sm font-medium text-slate-800 mb-2">{log.activity}</p>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Brain className="w-3 h-3" /> {log.focus}
                            </span>
                            <span className="flex items-center gap-1">
                              <Activity className="w-3 h-3" /> {log.energy}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
};

export default RhythmAI;