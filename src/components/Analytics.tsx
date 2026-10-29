import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { 
  BarChart3, Clock, Award, Flame, TrendingUp, CheckCircle, Play, 
  Square, Plus, Calendar, AlertTriangle, Zap, Activity, History,
  RotateCcw, Coffee, ShieldAlert, Sparkles, Check
} from 'lucide-react';
import { type ProductivityLog } from '../types';

interface AnalyticsProps {
  logs: ProductivityLog[];
  onLogFocusMinutes: (minutes: number) => void;
  addSystemLog: (message: string, type: 'info' | 'success' | 'warning') => void;
}

export default function Analytics({ logs, onLogFocusMinutes, addSystemLog }: AnalyticsProps) {
  // Pomodoro Focus Timer State
  const [timerMinutes, setTimerMinutes] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [timerActive, setTimerActive] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  // Stats calculation
  const totalFocusMinutes = logs.reduce((sum, log) => sum + log.focusMinutes, 0);
  const averageDailyScore = logs.length > 0
    ? Math.round(logs.reduce((sum, log) => sum + log.score, 0) / logs.length)
    : 75;

  const totalCompletedTasks = logs.reduce((sum, log) => sum + log.completedTasks, 0);

  // Pomodoro effect
  useEffect(() => {
    let interval: any = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timerActive && timeLeft === 0) {
      // Completed Pomodoro
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  const handleStartTimer = () => {
    setTimerActive(true);
    addSystemLog('Focus Session Started. Deep work protocol active.', 'info');
  };

  const handlePauseTimer = () => {
    setTimerActive(false);
    addSystemLog('Focus Session Paused.', 'info');
  };

  const handleResetTimer = () => {
    setTimerActive(false);
    setTimeLeft((isBreak ? 5 : timerMinutes) * 60);
  };

  const handleTimerComplete = () => {
    setTimerActive(false);
    if (!isBreak) {
      // Work period complete
      onLogFocusMinutes(timerMinutes);
      addSystemLog(`🎯 Outstanding work! Logged ${timerMinutes} productive focus minutes to your profile.`, 'success');
      setIsBreak(true);
      setTimeLeft(5 * 60); // 5 min break
    } else {
      // Break complete
      addSystemLog('Break session completed. Ready to resume focus?', 'info');
      setIsBreak(false);
      setTimeLeft(timerMinutes * 60);
    }
  };

  const handleSetTimerMinutes = (minutes: number) => {
    setTimerMinutes(minutes);
    if (!timerActive) {
      setTimeLeft(minutes * 60);
    }
  };

  // Render timer time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate circular progress for the Pomodoro face
  const totalSeconds = (isBreak ? 5 : timerMinutes) * 60;
  const progressRatio = timeLeft / totalSeconds;
  const strokeDashoffset = 439 * progressRatio; // 2 * pi * r (r=70)

  // Chart Data formatting
  const chartData = logs.length > 0
    ? logs.map(log => ({
        date: new Date(log.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        "Score": log.score,
        "Minutes": log.focusMinutes,
        "Completed": log.completedTasks
      }))
    : [
        { date: 'Jun 17', "Score": 65, "Minutes": 90, "Completed": 2 },
        { date: 'Jun 18', "Score": 78, "Minutes": 120, "Completed": 3 },
        { date: 'Jun 19', "Score": 70, "Minutes": 110, "Completed": 2 },
        { date: 'Jun 20', "Score": 85, "Minutes": 140, "Completed": 4 },
        { date: 'Jun 21', "Score": 92, "Minutes": 160, "Completed": 5 },
        { date: 'Jun 22', "Score": 75, "Minutes": 100, "Completed": 3 },
        { date: 'Jun 23', "Score": 82, "Minutes": 130, "Completed": 4 }
      ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } }
  };

  return (
    <motion.div 
      id="analytics-tab"
      className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      
      {/* COLUMN LEFT: Pomodoro Focus Timer Engine (5 columns) */}
      <motion.div 
        variants={cardVariants}
        className="lg:col-span-5 bg-[#111113] border border-border-tactical rounded-[24px] p-6 flex flex-col justify-between items-center text-center relative overflow-hidden min-h-[500px]"
      >
        {/* Background light glow */}
        <div className="absolute inset-0 hatch-pattern opacity-5 pointer-events-none" />

        <div className="w-full">
          <div className="flex items-center gap-2 mb-1 justify-center">
            <Zap size={16} className="text-accent-tactical" />
            <h3 className="font-bold text-ink-tactical text-sm tracking-wide uppercase font-mono">
              {isBreak ? '☕ Rest Protocol' : '⚡ Deep Focus Engine'}
            </h3>
          </div>
          <p className="text-[10px] text-ink-muted-tactical font-mono tracking-wider uppercase font-semibold">
            {timerActive ? 'ISOLATION FIELD ACTIVE • NO DISTRACTIONS' : 'LOCK IN PROGRESSIVE FOCUS INTERVAL'}
          </p>
        </div>

        {/* Large Countdown Face with Glowing Circular Progress */}
        <div className="my-8 relative flex items-center justify-center">
          <svg className="w-48 h-48 transform -rotate-90">
            {/* Background ring */}
            <circle 
              cx="96" 
              cy="96" 
              r="70" 
              stroke="#09090b" 
              strokeWidth="6" 
              fill="transparent" 
            />
            {/* Dynamic ring with gradients */}
            <motion.circle 
              cx="96" 
              cy="96" 
              r="70" 
              stroke={isBreak ? '#00ffaa' : '#ef4444'} 
              strokeWidth="6" 
              fill="transparent" 
              strokeDasharray="439"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>
          
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-ink-tactical font-mono tracking-wider">
              {formatTime(timeLeft)}
            </span>
            <span className="text-[9px] text-ink-muted-tactical font-mono mt-1 uppercase tracking-wider flex items-center gap-1 font-bold">
              {isBreak ? <Coffee size={10} className="text-accent-tactical" /> : <Activity size={10} className="text-rose-400 animate-pulse" />}
              {isBreak ? 'Rest Break' : 'Interval'}
            </span>
          </div>
        </div>

        {/* Preset selections */}
        <div className="flex gap-2.5 mb-6">
          {[15, 25, 45, 60].map(mins => (
            <button
              key={mins}
              onClick={() => handleSetTimerMinutes(mins)}
              disabled={timerActive}
              className={`px-3.5 py-1.5 text-xs rounded border font-mono transition-all cursor-pointer uppercase font-bold ${
                timerMinutes === mins && !isBreak
                  ? 'bg-accent-tactical text-black border-transparent'
                  : 'bg-[#09090b] text-ink-muted-tactical border-border-tactical hover:bg-[#111113]'
              }`}
            >
              {mins}m
            </button>
          ))}
        </div>

        {/* Timer Controls */}
        <div className="w-full flex gap-3">
          {timerActive ? (
            <button
              onClick={handlePauseTimer}
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-bold py-3 rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer uppercase"
            >
              <Square size={14} />
              <span>Pause Focus</span>
            </button>
          ) : (
            <button
              onClick={handleStartTimer}
              className="flex-1 bg-accent-tactical hover:bg-[#00e196] text-black text-xs font-mono font-bold py-3 rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer uppercase"
            >
              <Play size={14} />
              <span>Engage Focus</span>
            </button>
          )}

          <button
            onClick={handleResetTimer}
            className="bg-[#09090b] border border-border-tactical hover:bg-[#111113] text-ink-tactical text-xs font-mono font-bold px-4 rounded cursor-pointer"
          >
            <RotateCcw size={14} />
          </button>
        </div>

        <div className="w-full mt-5 border-t border-border-tactical pt-4">
          <p className="text-[10px] text-ink-muted-tactical leading-normal font-mono uppercase font-bold">
            Completing an interval writes productive focus minutes directly to your secure cloud database profile.
          </p>
        </div>
      </motion.div>

      {/* COLUMN RIGHT: Productivity Performance Metrics (7 columns) */}
      <div className="lg:col-span-7 space-y-6">
        {/* Core Stats Overview */}
        <motion.div 
          variants={cardVariants}
          className="bg-[#111113] border border-border-tactical rounded-[24px] p-5 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between pb-2 border-b border-border-tactical">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-accent-tactical" />
              <h3 className="font-bold text-ink-tactical text-sm uppercase font-mono">Productivity Analytics Engine</h3>
            </div>
            <span className="text-[9px] font-mono text-ink-muted-tactical uppercase font-bold">Interactive Diagnostics</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#09090b] border border-border-tactical rounded p-3 text-center space-y-1">
              <span className="text-[10px] font-mono text-ink-muted-tactical uppercase font-semibold">Focus Duration</span>
              <div className="text-base font-mono font-bold text-ink-tactical">{totalFocusMinutes} mins</div>
              <span className="text-[8px] text-ink-muted-tactical font-mono uppercase">Logged All-Time</span>
            </div>
            <div className="bg-[#09090b] border border-border-tactical rounded p-3 text-center space-y-1">
              <span className="text-[10px] font-mono text-ink-muted-tactical uppercase font-semibold">Average Score</span>
              <div className="text-base font-mono font-bold text-accent-tactical">{averageDailyScore}/100</div>
              <span className="text-[8px] text-accent-tactical font-mono uppercase">Autonomous Grade</span>
            </div>
            <div className="bg-[#09090b] border border-border-tactical rounded p-3 text-center space-y-1">
              <span className="text-[10px] font-mono text-ink-muted-tactical uppercase font-semibold">Goals Secured</span>
              <div className="text-base font-mono font-bold text-indigo-400">{totalCompletedTasks} Goals</div>
              <span className="text-[8px] text-ink-muted-tactical font-mono uppercase">On-Time Completion</span>
            </div>
          </div>

          {/* Interactive Recharts History Graph */}
          <div className="space-y-3 pt-2">
            <h4 className="text-[11px] font-mono text-ink-muted-tactical uppercase font-bold">Completion Rate & Performance history</h4>
            
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00ffaa" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#00ffaa" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="minutesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f1f23" vertical={false} />
                  <XAxis dataKey="date" stroke="#4b5563" fontSize={9} tickLine={false} />
                  <YAxis stroke="#4b5563" fontSize={9} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#09090b', 
                      borderColor: '#1a1a1e', 
                      borderRadius: '4px',
                      fontSize: '11px',
                      color: '#e4e4e7',
                      fontFamily: 'JetBrains Mono, monospace'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Score" 
                    stroke="#00ffaa" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#scoreGrad)" 
                    name="Performance Score (%)"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="Minutes" 
                    stroke="#ec4899" 
                    strokeWidth={2} 
                    fillOpacity={1} 
                    fill="url(#minutesGrad)" 
                    name="Focus Minutes (m)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            
            <div className="flex justify-center gap-6 text-[10px] text-ink-muted-tactical font-mono uppercase font-bold">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-accent-tactical rounded-sm" /> Performance Score (%)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-pink-500 rounded-sm" /> Focus Minutes (m)
              </span>
            </div>
          </div>
        </motion.div>

        {/* FEATURE 3: BURNOUT PREDICTION ENGINE */}
        <motion.div 
          variants={cardVariants}
          className="bg-[#111113] border border-border-tactical rounded-[24px] p-5 space-y-4 relative overflow-hidden"
        >
          {/* Background alert glow */}
          <div className="absolute inset-0 hatch-pattern opacity-5 pointer-events-none" />
          
          <div className="flex items-center justify-between border-b border-border-tactical pb-2.5">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-rose-400 animate-pulse" />
              <h3 className="font-semibold text-ink-tactical text-sm uppercase font-mono">Burnout Prediction Radar</h3>
            </div>
            <span className="text-[9px] font-mono text-rose-400 font-bold uppercase tracking-wider">Prediction Engine Active</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
            {/* Risk Gauge (4 cols) */}
            <div className="md:col-span-4 flex flex-col items-center justify-center space-y-1.5">
              <div className="relative h-24 w-24 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="42" stroke="#09090b" strokeWidth="5" fill="transparent" />
                  <circle cx="48" cy="48" r="42" stroke="#ef4444" strokeWidth="5" fill="transparent" 
                    strokeDasharray={263} strokeDashoffset={263 - (263 * 82) / 100} strokeLinecap="round" />
                </svg>
                <span className="absolute text-lg font-mono font-bold text-ink-tactical">82%</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-rose-400 uppercase">Burnout Threat</span>
            </div>

            {/* Metrics Breakdown (8 cols) */}
            <div className="md:col-span-8 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono">
                <div className="bg-[#09090b] p-2.5 rounded border border-border-tactical">
                  <span className="text-[9px] text-ink-muted-tactical block uppercase font-bold">Workload Score</span>
                  <span className="text-ink-tactical font-bold">8.2 / 10.0</span>
                </div>
                <div className="bg-[#09090b] p-2.5 rounded border border-border-tactical">
                  <span className="text-[9px] text-ink-muted-tactical block uppercase font-bold">Stress Index</span>
                  <span className="text-rose-400 font-bold uppercase">Critical High</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-mono text-ink-muted-tactical uppercase tracking-wide block font-bold">Active stress hazards:</span>
                <div className="flex flex-wrap gap-1.5 text-[9px] font-mono">
                  {["Overloaded Focus Queue", "High Task Density", "Delayed Rest Blocks", "Early Morning Shifts"].map(tag => (
                    <span key={tag} className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded">
                      ⚠️ {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Burnout Mitigation Advice */}
          <div className="bg-[#09090b] p-4 rounded border border-border-tactical space-y-1.5">
            <div className="flex items-center gap-1.5 text-accent-tactical">
              <Sparkles size={13} />
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Cognitive Mitigation Plan</span>
            </div>
            <p className="text-xs text-ink-muted-tactical leading-relaxed font-mono">
              "Workload parameters exceed standard endurance metrics. <span className="text-rose-400 font-semibold">Reduce scheduled focus workload tomorrow by 2.0 hours.</span> We suggest converting deep-work slots into hydration and rest buffers to avoid cognitive fatigue."
            </p>
          </div>
        </motion.div>

        {/* Database Logs Logbook */}
        <motion.div 
          variants={cardVariants}
          className="bg-[#111113] border border-border-tactical rounded-[24px] p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3 border-b border-border-tactical pb-2">
            <div className="flex items-center gap-2">
              <History size={16} className="text-indigo-400" />
              <h3 className="font-bold text-ink-tactical text-sm uppercase font-mono">Productive Activity Logbook</h3>
            </div>
            <span className="text-[10px] text-ink-muted-tactical font-mono uppercase font-bold">CLOUD BACKUP CONNECTED</span>
          </div>

          {logs.length === 0 ? (
            <div className="border border-dashed border-border-tactical rounded p-8 text-center text-xs text-ink-muted-tactical font-mono uppercase">
              No logged focus periods found. Finish a focus timer interval to save records here.
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-0.5 custom-scrollbar">
              {logs.slice().reverse().map((log, idx) => (
                <div 
                  key={log.id || idx} 
                  className="bg-[#09090b] hover:bg-[#111113] border border-border-tactical rounded p-3 flex justify-between items-center text-xs transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-ink-tactical font-mono">{new Date(log.date).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })}</h4>
                      <span className="text-[9px] font-mono bg-accent-tactical/10 text-accent-tactical border border-accent-tactical/20 px-2 py-0.5 rounded flex items-center gap-0.5 uppercase font-bold">
                        <Check size={8} /> Secured
                      </span>
                    </div>
                    <p className="text-[10px] text-ink-muted-tactical font-mono uppercase">
                      Focus Session: {log.focusMinutes}m • Resolved: {log.completedTasks} task(s)
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-accent-tactical bg-accent-tactical/10 border border-accent-tactical/20 px-2.5 py-1 rounded">
                      +{log.score} score
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

      </div>

    </motion.div>
  );
}
