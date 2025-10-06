import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Brain, Calendar, TrendingUp, Target, Clock, Zap, CheckCircle, XCircle, Download, Upload, LogOut, AlertCircle, CheckCircle2 } from 'lucide-react';

// --- UTILITY FUNCTIONS ---

/**
 * Custom hook for managing UI messages (replacing alert())
 * @param {string} initialMessage
 * @returns {{message: object, showMessage: function, clearMessage: function}}
 */
const useMessage = (initialMessage = null) => {
  const [message, setMessage] = useState(initialMessage);

  // FIXED: Wrap showMessage in useCallback to ensure stability, preventing infinite re-render loops
  const showMessage = useCallback((text, type = 'error') => { 
    setMessage({ text, type });
    // Auto-clear message after 5 seconds
    setTimeout(() => setMessage(null), 5000);
  }, []); 

  const clearMessage = useCallback(() => setMessage(null), []);

  return { message, showMessage, clearMessage };
};

// --- MAIN COMPONENT ---

const RhythmAI = () => {
  // State for Authentication and User Data
  const [currentUser, setCurrentUser] = useState(null);
  const [authView, setAuthView] = useState('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });
  const [currentView, setCurrentView] = useState('timeline');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [timelineData, setTimelineData] = useState({});

  // State for Task Predictor
  const [taskInput, setTaskInput] = useState({ name: '', hour: 9, duration: 30 });
  const [prediction, setPrediction] = useState(null);

  // Custom Message Hook (replaces alert())
  const { message, showMessage, clearMessage } = useMessage();

  const hours = Array.from({ length: 17 }, (_, i) => i + 7); // 7 AM to 11 PM

  // Helper: Generates the unique storage key for the current user's timeline data
  const getUserDataKey = useCallback((email) => `rhythmAI_data_${email}`, []);
  
  // Helper: Load user's personal timeline data
  const loadUserData = useCallback((email) => {
    try {
      const userDataKey = getUserDataKey(email);
      const stored = localStorage.getItem(userDataKey);
      if (stored) {
        setTimelineData(JSON.parse(stored));
      } else {
        setTimelineData({});
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      showMessage('Failed to load productivity data.', 'error');
      setTimelineData({});
    }
  }, [getUserDataKey, showMessage]); // loadUserData is now stable because showMessage is stable

  // Effect 1: Initialize Auth State on Load
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('rhythmAI_currentUser');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        loadUserData(user.email);
      }
    } catch (error) {
      console.error('Error loading user session:', error);
      localStorage.removeItem('rhythmAI_currentUser');
    }
  }, [loadUserData]); // loadUserData is the correct dependency here

  // Effect 2: Save Data when timelineData or currentUser changes
  useEffect(() => {
    if (currentUser) {
      try {
        const userDataKey = getUserDataKey(currentUser.email);
        // NOTE: In a production PWA (per spec), this should be an async Dexie.js update
        localStorage.setItem(userDataKey, JSON.stringify(timelineData));
      } catch (error) {
        console.error('Error saving user data:', error);
        // showMessage('Error saving data locally. Storage may be full.', 'error');
      }
    }
  }, [timelineData, currentUser, getUserDataKey]);

  // --- AUTHENTICATION HANDLERS (Mock Client-Side) ---

  const handleRegister = (e) => {
    e.preventDefault();
    clearMessage();

    if (!authForm.name || authForm.name.trim().length < 2) {
      showMessage('Name must be at least 2 characters.', 'error');
      return;
    }
    if (!authForm.email || !authForm.email.includes('@')) {
      showMessage('Please enter a valid email.', 'error');
      return;
    }
    if (!authForm.password || authForm.password.length < 6) {
      showMessage('Password must be at least 6 characters.', 'error');
      return;
    }

    try {
      const users = JSON.parse(localStorage.getItem('rhythmAI_users') || '{}');
      if (users[authForm.email]) {
        showMessage('Email already registered! Please login instead.', 'error');
        return;
      }

      users[authForm.email] = {
        name: authForm.name.trim(),
        password: authForm.password,
        email: authForm.email.toLowerCase(),
      };

      localStorage.setItem('rhythmAI_users', JSON.stringify(users));
      
      const user = { name: authForm.name.trim(), email: authForm.email.toLowerCase() };
      
      setCurrentUser(user);
      localStorage.setItem('rhythmAI_currentUser', JSON.stringify(user));
      loadUserData(user.email);
      setAuthForm({ email: '', password: '', name: '' });
      showMessage('Registration successful! Welcome.', 'success');
    } catch (error) {
      console.error('Registration error:', error);
      showMessage('Registration failed. Please try again.', 'error');
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    clearMessage();

    if (!authForm.email || !authForm.password) {
      showMessage('Please enter both email and password.', 'error');
      return;
    }

    try {
      const users = JSON.parse(localStorage.getItem('rhythmAI_users') || '{}');
      const emailLower = authForm.email.toLowerCase();
      const user = users[emailLower];
      
      if (!user) {
        showMessage('Email not found. Please register first.', 'error');
        return;
      }

      if (user.password !== authForm.password) {
        showMessage('Incorrect password. Please try again.', 'error');
        return;
      }

      const userData = { name: user.name, email: user.email };
      
      setCurrentUser(userData);
      localStorage.setItem('rhythmAI_currentUser', JSON.stringify(userData));
      loadUserData(user.email);
      setAuthForm({ email: '', password: '', name: '' });
      showMessage('Login successful!', 'success');
    } catch (error) {
      console.error('Login error:', error);
      showMessage('Login failed. Please try again.', 'error');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('rhythmAI_currentUser');
    setTimelineData({});
    setAuthForm({ email: '', password: '', name: '' });
    setCurrentView('timeline');
    setPrediction(null);
  };

  // --- DATA MANIPULATION & LOGIC ---

  const updateHourData = (date, hour, field, value) => {
    setTimelineData(prev => {
      const newData = { ...prev };
      const dateData = newData[date] || {};
      const hourData = dateData[hour] || {};
      
      // Ensure numerical fields are stored as numbers or undefined if empty
      const finalValue = (field === 'focus' || field === 'energy') && value === '' ? undefined : value;

      newData[date] = { 
        ...dateData, 
        [hour]: { ...hourData, [field]: finalValue } 
      };
      
      // Clean up empty hour entry if all fields are empty/undefined
      const hourEntry = newData[date][hour];
      if (Object.keys(hourEntry).every(key => hourEntry[key] === undefined || hourEntry[key] === '' || hourEntry[key] === null || hourEntry[key] === false)) {
        delete newData[date][hour];
      }
      // Clean up empty day entry
      if (Object.keys(newData[date] || {}).length === 0) { // Added null check on newData[date]
          delete newData[date];
      }

      return newData;
    });
  };

  const getYesterdayDate = () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };
  
  /**
   * Predicts today's focus probability based on yesterday's rhythm or last hour's performance (Portion 1 logic).
   */
  const predictFocus = (todayHour, yesterdayData, lastHourData) => {
    const yesterdayHour = yesterdayData && yesterdayData[todayHour];
    let base = 0.5;

    if (yesterdayHour && yesterdayHour.focus && yesterdayHour.energy) {
      base = (yesterdayHour.focus + yesterdayHour.energy) / 10;
    } else if (lastHourData && lastHourData.focus && lastHourData.energy) {
      base = (lastHourData.focus + lastHourData.energy) / 10 - 0.05;
    }

    if (todayHour >= 13 && todayHour <= 15) base -= 0.1; // afternoon dip
    if (todayHour >= 6 && todayHour <= 9) base += 0.1;  // morning boost

    return Math.min(1, Math.max(0, base));
  };

  /**
   * Predicts task completion probability based on historical data for that hour and duration (Portion 1 logic).
   */
  const predictTask = (task) => {
    // Flatten all history into a single array for analysis
    const allHistory = Object.values(timelineData).flatMap(day =>
      Object.entries(day)
        .filter(([_, v]) => v.focus && v.energy) // Filter out incomplete entries
        .map(([hour, data]) => ({ hour: parseInt(hour), ...data }))
    );

    const relevant = allHistory.filter(h => h.hour === task.hour);
    
    if (relevant.length === 0) {
      return { probability: 0.5, suggestion: 'Not enough data for this hour yet. Log more activities to improve predictions!' };
    }

    const avgFocus = relevant.reduce((a, b) => a + b.focus, 0) / relevant.length;
    const avgEnergy = relevant.reduce((a, b) => a + b.energy, 0) / relevant.length;

    let probability = (avgFocus + avgEnergy) / 10;
    if (task.duration > 45) probability -= 0.1;
    if (task.hour >= 6 && task.hour <= 10) probability += 0.1; // morning boost

    probability = Math.min(1, Math.max(0, probability));

    let suggestion = '';
    if (probability < 0.65) {
      const betterHours = hours.filter(h => {
        const hData = allHistory.filter(hist => hist.hour === h);
        const avg = hData.length > 0 ? (hData.reduce((a, b) => a + (b.focus + b.energy) / 10, 0) / hData.length) : 0;
        return avg > probability + 0.1;
      }).sort((a, b) => a - b);
      
      if (betterHours.length > 0) {
        suggestion = `Try moving this task to ${betterHours[0]}:00 for a higher success chance.`;
      }
      if (task.duration > 30 && probability > 0.4) {
        suggestion += suggestion ? ' Also consider reducing the duration to 30 mins.' : 'Reduce the duration to 30 mins for a higher success rate.';
      }
    } else {
      suggestion = 'Great timing! Your historical data suggests a high success rate at this hour.';
    }

    return { probability, suggestion };
  };

  const analyzeTodayPredictions = () => {
    const yesterday = getYesterdayDate();
    const yesterdayData = timelineData[yesterday];
    const today = getTodayDate();
    const todayData = timelineData[today];

    // Get the last completed hour's data from today's log for fallback prediction
    const currentHour = new Date().getHours();
    let lastHourData = null;
    for (let h = currentHour - 1; h >= hours[0]; h--) {
        if (todayData?.[h]?.focus && todayData?.[h]?.energy) {
            lastHourData = todayData[h];
            break;
        }
    }

    return hours.map(hour => {
      const focusProb = predictFocus(hour, yesterdayData, lastHourData);
      
      return {
        hour: hour + ':00',
        predicted: parseFloat((focusProb * 100).toFixed(0)),
        actual: todayData && todayData[hour] && todayData[hour].focus ? parseFloat((todayData[hour].focus * 20).toFixed(0)) : null
      };
    });
  };

  const analyzeYesterday = () => {
    const yesterday = getYesterdayDate();
    const data = timelineData[yesterday];

    if (!data) return null;

    const entries = Object.entries(data)
      .filter(([_, v]) => v.focus && v.energy)
      .map(([h, v]) => ({ hour: parseInt(h), ...v }));

    if (entries.length === 0) return null;

    const avgFocus = entries.reduce((a, b) => a + b.focus, 0) / entries.length;
    const avgEnergy = entries.reduce((a, b) => a + b.energy, 0) / entries.length;
    const completed = entries.filter(e => e.completed).length;
    const completionRate = (completed / entries.length) * 100;

    const scores = entries.map(e => ({ ...e, totalScore: e.focus + e.energy }));
    const best = scores.reduce((a, b) => a.totalScore > b.totalScore ? a : b);
    const worst = scores.reduce((a, b) => a.totalScore < b.totalScore ? a : b);

    return {
      avgFocus: avgFocus.toFixed(1),
      avgEnergy: avgEnergy.toFixed(1),
      completionRate: completionRate.toFixed(0),
      bestHour: best.hour,
      worstHour: worst.hour,
      chartData: entries.map(e => ({
        hour: e.hour + ':00',
        focus: e.focus,
        energy: e.energy
      }))
    };
  };

  const handlePredictTask = () => {
    if (!taskInput.name.trim()) {
      showMessage('Please enter a task name before predicting.', 'error');
      return;
    }
    const result = predictTask(taskInput);
    setPrediction({
      task: taskInput.name,
      hour: taskInput.hour,
      duration: taskInput.duration,
      ...result
    });
  };

  // --- EXPORT/IMPORT HANDLERS ---
  
  const exportData = () => {
    try {
      const exportObj = {
        app: "Rhythm.AI",
        user: currentUser.email,
        exportDate: new Date().toISOString(),
        data: timelineData
      };
      const dataStr = JSON.stringify(exportObj, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rhythm-ai-backup-${currentUser.email}-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      showMessage('Data exported successfully!', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showMessage('Failed to export data.', 'error');
    }
  };

  const importData = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          // Check for the nested data structure used in exports
          const importedData = imported.data || imported;
          setTimelineData(importedData);
          showMessage('Data imported successfully! Reload to verify.', 'success');
        } catch (err) {
          console.error('Import error:', err);
          showMessage('Invalid data file. Please upload a valid Rhythm.AI backup file.', 'error');
        }
      };
      reader.readAsText(file);
      // Clear file input value to allow re-importing the same file
      e.target.value = null;
    }
  };

  // FIXED: Memoize these calculations. They depend only on timelineData and hours (which is constant).
  const yesterdayAnalysis = useMemo(() => analyzeYesterday(), [timelineData, hours]);
  const todayPredictions = useMemo(() => analyzeTodayPredictions(), [timelineData, hours]);

  // --- AUTH UI RENDER ---

  if (!currentUser) {
    const isLogin = authView === 'login';
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8 mb-4">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-3 rounded-2xl">
                <Brain className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Rhythm.AI
                </h1>
                <p className="text-gray-600 text-sm">Focus & Productivity Tracker</p>
              </div>
            </div>

            {/* Auth Toggle */}
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => setAuthView('login')}
                className={`flex-1 py-2 rounded-xl font-semibold transition ${isLogin ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => setAuthView('register')}
                className={`flex-1 py-2 rounded-xl font-semibold transition ${!isLogin ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Register
              </button>
            </div>

            {/* Custom Message/Error Display */}
            {message && (
              <div className={`mb-4 p-3 border rounded-lg flex items-start gap-2 ${message.type === 'error' ? 'bg-red-50 border-red-300 text-red-700' : 'bg-green-50 border-green-300 text-green-700'}`}>
                {message.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                <p className="text-sm font-medium flex-1">{message.text}</p>
                <button onClick={clearMessage} className="ml-auto text-gray-400 hover:text-gray-600">
                    <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}

            <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    required
                    value={authForm.name}
                    onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                    placeholder="John Doe"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  required
                  value={authForm.email}
                  onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  required
                  value={authForm.password}
                  onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-semibold hover:shadow-xl hover:from-emerald-600 hover:to-teal-600 transition duration-200 mt-6"
              >
                {isLogin ? 'Login to Rhythm.AI' : 'Create Account'}
              </button>
            </form>
          </div>

          <div className="text-center text-sm text-gray-700 bg-white/50 backdrop-blur rounded-2xl p-4 shadow-inner">
            <p>🔒 **Local Persistence:** Data is stored only in your browser's local storage. </p>
            <p className="mt-1">Use a unique email/password combination to manage your separate datasets.</p>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN APP UI RENDER ---

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-50 p-4 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-3 rounded-xl">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Rhythm.AI
                </h1>
                <p className="text-gray-600 text-sm">Welcome back, {currentUser.name} ({currentUser.email})</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2 items-center">
                <button 
                  onClick={exportData} 
                  className="p-2 hover:bg-emerald-50 rounded-lg transition"
                  title="Export Data"
                >
                  <Download className="w-5 h-5 text-emerald-600" />
                </button>
                <label className="p-2 hover:bg-emerald-50 rounded-lg transition cursor-pointer" title="Import Data">
                  <Upload className="w-5 h-5 text-emerald-600" />
                  <input type="file" onChange={importData} className="hidden" accept=".json" />
                </label>
                <button 
                  onClick={handleLogout} 
                  className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100 transition shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
            </div>
          </div>
        </div>
        
        {/* Custom Message/Error Display */}
        {message && (
          <div className={`mb-6 p-4 border rounded-xl flex items-start gap-3 ${message.type === 'error' ? 'bg-red-50 border-red-300 text-red-700' : 'bg-green-50 border-green-300 text-green-700'}`}>
            {message.type === 'error' ? <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" /> : <CheckCircle2 className="w-6 h-6 flex-shrink-0 mt-0.5" />}
            <p className="text-base font-medium flex-1">{message.text}</p>
            <button onClick={clearMessage} className="ml-auto text-gray-400 hover:text-gray-600 p-1">
                <XCircle className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'timeline', icon: Calendar, label: 'Timeline Input' },
            { id: 'yesterday', icon: TrendingUp, label: 'Yesterday Analysis' },
            { id: 'today', icon: Zap, label: 'Today Prediction' },
            { id: 'task', icon: Target, label: 'Task Predictor' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCurrentView(tab.id)}
              className={'flex items-center gap-2 px-4 py-2 rounded-xl transition whitespace-nowrap text-sm sm:text-base ' + (currentView === tab.id ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg' : 'bg-white text-gray-600 hover:bg-emerald-50 shadow-sm')}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* --- VIEW: TIMELINE INPUT --- */}
        {currentView === 'timeline' && (
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <h2 className="text-2xl font-bold text-gray-800">Daily Timeline Logger</h2>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 text-xs sm:text-sm font-semibold text-gray-500 border-b border-gray-200">
                  <div className="w-20">Time</div>
                  <div className="flex-1 min-w-[150px]">Activity</div>
                  <div className="w-16 text-center">Focus (1-5)</div>
                  <div className="w-16 text-center">Energy (1-5)</div>
                  <div className="w-10 text-center">Done</div>
              </div>
              {hours.map(hour => {
                const data = (timelineData[selectedDate] && timelineData[selectedDate][hour]) || {};
                const bgColor = data.focus > 3 && data.energy > 3 ? 'bg-emerald-50 hover:bg-emerald-100' : 'bg-gray-50 hover:bg-gray-100';

                return (
                  <div key={hour} className={`flex items-center gap-3 p-4 rounded-xl transition flex-wrap ${bgColor}`}>
                    <div className="w-20 font-semibold text-gray-700 text-sm">
                      {hour}:00
                    </div>
                    <input
                      type="text"
                      placeholder="Activity"
                      value={data.activity || ''}
                      onChange={(e) => updateHourData(selectedDate, hour, 'activity', e.target.value)}
                      className="flex-1 min-w-[150px] px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none transition"
                    />
                    <select
                      value={data.focus || ''}
                      onChange={(e) => updateHourData(selectedDate, hour, 'focus', parseInt(e.target.value) || undefined)}
                      className="w-16 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-center"
                    >
                      <option value="">-</option>
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <select
                      value={data.energy || ''}
                      onChange={(e) => updateHourData(selectedDate, hour, 'energy', parseInt(e.target.value) || undefined)}
                      className="w-16 px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-center"
                    >
                      <option value="">-</option>
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                    <button
                      onClick={() => updateHourData(selectedDate, hour, 'completed', !data.completed)}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg transition shadow-sm ${
                        data.completed ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
                      }`}
                      title={data.completed ? 'Completed' : 'Mark as completed'}
                    >
                      {data.completed ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- VIEW: YESTERDAY ANALYSIS --- */}
        {currentView === 'yesterday' && (
          <div className="space-y-6">
            {yesterdayAnalysis ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white rounded-xl p-6 shadow-lg border-b-4 border-emerald-500">
                    <div className="text-sm text-gray-600 mb-1">Avg Focus</div>
                    <div className="text-3xl font-bold text-emerald-600">{yesterdayAnalysis.avgFocus}/5</div>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-lg border-b-4 border-teal-500">
                    <div className="text-sm text-gray-600 mb-1">Avg Energy</div>
                    <div className="text-3xl font-bold text-teal-600">{yesterdayAnalysis.avgEnergy}/5</div>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-lg border-b-4 border-green-500">
                    <div className="text-sm text-gray-600 mb-1">Completion Rate</div>
                    <div className="text-3xl font-bold text-green-600">{yesterdayAnalysis.completionRate}%</div>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-lg border-b-4 border-amber-500">
                    <div className="text-sm text-gray-600 mb-1">Best Hour</div>
                    <div className="text-3xl font-bold text-amber-600">{yesterdayAnalysis.bestHour}:00</div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Focus & Energy Pattern</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={yesterdayAnalysis.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e0f2f1" />
                      <XAxis dataKey="hour" />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="focus" stroke="#059669" fill="#059669" fillOpacity={0.7} name="Focus (5 max)" />
                      <Area type="monotone" dataKey="energy" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.5} name="Energy (5 max)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl shadow-xl p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">💡 Yesterday's Insight</h3>
                  <p className="text-lg">
                    Your most productive hour was <span className="font-bold">{yesterdayAnalysis.bestHour}:00</span>.
                    Consider scheduling demanding tasks here today.
                  </p>
                  <p className="text-lg mt-2">
                    Avoid high-priority tasks around <span className="font-bold">{yesterdayAnalysis.worstHour}:00</span>, which was a weak spot.
                  </p>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-xl text-gray-600 mb-2">No data for yesterday</p>
                <p className="text-gray-500">Log your timeline activities to unlock this powerful analysis!</p>
              </div>
            )}
          </div>
        )}

        {/* --- VIEW: TODAY PREDICTOR --- */}
        {currentView === 'today' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Hour-by-Hour Focus Prediction</h3>
              <p className="text-sm text-gray-500 mb-4">Prediction uses yesterday's data; fallbacks to current day's last hour if unavailable.</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={todayPredictions}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0f2f1" />
                  <XAxis dataKey="hour" />
                  <YAxis domain={[0, 100]} label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Bar dataKey="predicted" fill="#059669" name="Predicted Focus %" radius={[10, 10, 0, 0]} />
                  {todayPredictions.some(d => d.actual) && (
                    <Bar dataKey="actual" fill="#14b8a6" name="Actual Focus % (logged today)" radius={[10, 10, 0, 0]} />
                  )}
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl shadow-xl p-6 text-white">
              <h3 className="text-xl font-bold mb-2">🔮 Today's Forecast</h3>
              <p className="text-lg">
                Based on your historical rhythm, identify your predicted high-focus hours from the chart above.
                Schedule your **Deep Work** during these windows for maximum efficiency.
              </p>
            </div>
          </div>
        )}

        {/* --- VIEW: TASK PREDICTOR --- */}
        {currentView === 'task' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Task Success Predictor</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Task Name</label>
                  <input
                    type="text"
                    value={taskInput.name}
                    onChange={(e) => setTaskInput({ ...taskInput, name: e.target.value })}
                    placeholder="e.g., Study Quant for 40 mins at 9PM."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time (Start Hour)</label>
                    <select
                      value={taskInput.hour}
                      onChange={(e) => setTaskInput({ ...taskInput, hour: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
                    >
                      {hours.map(h => <option key={h} value={h}>{h}:00</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Duration (mins)</label>
                    <input
                      type="number"
                      value={taskInput.duration}
                      onChange={(e) => setTaskInput({ ...taskInput, duration: parseInt(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition"
                      min="1"
                      max="120"
                    />
                  </div>
                </div>

                <button
                  onClick={handlePredictTask}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-3 rounded-xl font-semibold hover:shadow-xl transition mt-4"
                >
                  Predict Success Rate
                </button>
              </div>
            </div>

            {prediction && (
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <div className="text-center mb-6">
                  <div className="text-6xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                    {(prediction.probability * 100).toFixed(0)}%
                  </div>
                  <div className="text-lg font-medium text-gray-600">Success Probability</div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200">
                  <div className="font-semibold text-gray-800 mb-1">Task: {prediction.task}</div>
                  <div className="text-sm text-gray-600">
                    Time: {prediction.hour}:00 • Duration: {prediction.duration} mins
                  </div>
                </div>

                <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-emerald-800 mb-1">Optimization Tip</div>
                      <div className="text-sm text-emerald-700">{prediction.suggestion}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RhythmAI;
