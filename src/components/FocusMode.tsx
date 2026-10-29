import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, Pause, RotateCcw, CheckCircle, Sparkles, AlertTriangle, 
  Clock, Zap, Volume2, VolumeX, ListTodo, Award, HelpCircle
} from 'lucide-react';
import { type Task } from '../types';

interface FocusModeProps {
  tasks: Task[];
  onAddFocusMinutes: (mins: number) => void;
  onRewardXp: (xp: number) => void;
  addSystemLog: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

export default function FocusMode({
  tasks,
  onAddFocusMinutes,
  onRewardXp,
  addSystemLog
}: FocusModeProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60); // Default Pomodoro 25 mins
  const [initialSeconds, setInitialSeconds] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [pomodoroCycle, setPomodoroCycle] = useState(1);
  const [focusStage, setFocusStage] = useState<'work' | 'break'>('work');
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [aiEncouragement, setAiEncouragement] = useState('Select a commitment above to unlock real-time progress forecasting.');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Filter pending tasks
  const activeTasks = tasks.filter(t => t.status !== 'completed');

  // Trigger countdown effect
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, focusStage]);

  // Update progressive AI predictions based on countdown progress
  useEffect(() => {
    if (!selectedTask) {
      setAiEncouragement('Select a commitment above to align the AI progress estimator.');
      return;
    }

    const elapsed = initialSeconds - timerSeconds;
    const progressFrac = elapsed / initialSeconds;
    const progressPercent = Math.min(Math.round(progressFrac * 100), 100);
    
    // Dynamic countdown predictions
    const minsRemaining = Math.ceil(timerSeconds / 60);
    
    if (progressPercent < 15) {
      setAiEncouragement(`🚀 Initiating focus block. You are ${progressPercent}% complete. Focus strictly on "${selectedTask.title}". Avoid multitasking!`);
    } else if (progressPercent < 50) {
      setAiEncouragement(`✨ In Flow: ${progressPercent}% completed. Estimated finish time: ${minsRemaining} minutes. Your mental workload coefficient is stabilizing.`);
    } else if (progressPercent < 85) {
      setAiEncouragement(`💪 Over the hump: ${progressPercent}% secured. Only ${minsRemaining} minutes remaining. The Risk Agent forecasts zero slip danger if this flow continues!`);
    } else {
      setAiEncouragement(`🏆 Home stretch! ${progressPercent}% complete. Final ${minsRemaining} minutes remaining. Prepare for buffer lock-in and a well-deserved stretch break!`);
    }
  }, [timerSeconds, selectedTask, initialSeconds]);

  const handleStartPause = () => {
    if (!selectedTask && focusStage === 'work') {
      addSystemLog("Select an active commitment to bind the focus block.", "warning");
      return;
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimerSeconds(focusStage === 'work' ? 25 * 60 : 5 * 60);
    setInitialSeconds(focusStage === 'work' ? 25 * 60 : 5 * 60);
  };

  const handleSetTimer = (minutes: number) => {
    setIsRunning(false);
    setTimerSeconds(minutes * 60);
    setInitialSeconds(minutes * 60);
  };

  const handleSessionComplete = () => {
    setIsRunning(false);
    
    if (focusStage === 'work') {
      const minsSpent = Math.round(initialSeconds / 60);
      onAddFocusMinutes(minsSpent);
      
      // Earn substantial XP for completing a deep work focus session
      const earnedXp = minsSpent * 10;
      onRewardXp(earnedXp);

      addSystemLog(`Finished focus session! Logged +${minsSpent}m. Earned +${earnedXp} XP!`, "success");
      
      // Move to break stage
      setFocusStage('break');
      setTimerSeconds(5 * 60);
      setInitialSeconds(5 * 60);
      setPomodoroCycle(prev => prev + 1);
    } else {
      // Break complete, move to work
      addSystemLog("Break session completed. Ready for the next focus block?", "info");
      setFocusStage('work');
      setTimerSeconds(25 * 60);
      setInitialSeconds(25 * 60);
    }
  };

  const handleSkipToComplete = () => {
    if (window.confirm("Complete focus block early? You will receive proportional XP points.")) {
      handleSessionComplete();
    }
  };

  // Format MM:SS
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Progress Fraction
  const progressPercent = Math.min(((initialSeconds - timerSeconds) / initialSeconds) * 100, 100);

  return (
    <div id="ai-focus-mode" className="space-y-6">
      {/* Immersive Dark Tactical Container */}
      <div className="relative overflow-hidden bg-[#111113] border border-border-tactical rounded-[24px] p-6 md:p-8 shadow-sm">
        {/* Hatch pattern background */}
        <div className="absolute inset-0 hatch-pattern opacity-5 pointer-events-none" />

        <div className="flex flex-col lg:flex-row gap-8 items-center justify-between relative z-10">
          
          {/* Left Column: Interactive Timer & Ring Controls */}
          <div className="flex flex-col items-center space-y-6 shrink-0 w-full lg:w-96">
            
            {/* Visual Ring and Timer */}
            <div className="relative h-64 w-64 flex items-center justify-center group">
              <svg className="w-full h-full transform -rotate-90">
                {/* Background Track circle */}
                <circle cx="128" cy="128" r="114" stroke="#09090b" strokeWidth="8" fill="transparent" />
                {/* Active Progress circle */}
                <circle cx="128" cy="128" r="114" 
                  stroke={focusStage === 'work' ? '#00ffaa' : '#10b981'} 
                  strokeWidth="8" fill="transparent" 
                  strokeDasharray={716} 
                  strokeDashoffset={716 - (716 * progressPercent) / 100} 
                  strokeLinecap="round" 
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute text-center flex flex-col space-y-1">
                <span className="text-4xl md:text-5xl font-mono font-bold text-ink-tactical tracking-tight">
                  {formatTime(timerSeconds)}
                </span>
                <span className="text-[10px] font-mono text-ink-muted-tactical uppercase tracking-widest font-bold">
                  {focusStage === 'work' ? `WORK CYCLE #${pomodoroCycle}` : "BREAK REST SESSION"}
                </span>
              </div>
            </div>

            {/* Timer Actions Bar */}
            <div className="flex items-center gap-4">
              <button
                onClick={handleReset}
                className="p-3 bg-[#09090b] hover:bg-[#111113] text-ink-muted-tactical hover:text-accent-tactical border border-border-tactical rounded transition-all cursor-pointer"
                title="Reset session"
              >
                <RotateCcw size={16} />
              </button>

              <button
                onClick={handleStartPause}
                className={`p-4 rounded-full text-black font-bold flex items-center justify-center transition-all cursor-pointer ${
                  focusStage === 'work' 
                    ? 'bg-accent-tactical hover:bg-[#00e196]'
                    : 'bg-emerald-400 hover:bg-emerald-300'
                }`}
              >
                {isRunning ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
              </button>

              {isRunning && (
                <button
                  onClick={handleSkipToComplete}
                  className="p-3 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-900/30 rounded transition-all cursor-pointer"
                  title="Finish session early"
                >
                  <CheckCircle size={16} />
                </button>
              )}
            </div>

            {/* Interval Presets */}
            <div className="flex gap-2 text-[10px] font-mono">
              {[15, 25, 45, 60].map(mins => (
                <button
                  key={mins}
                  onClick={() => handleSetTimer(mins)}
                  className="bg-[#09090b] hover:bg-[#111113] text-ink-muted-tactical hover:text-accent-tactical border border-border-tactical px-2.5 py-1.5 rounded transition-all cursor-pointer font-bold"
                >
                  {mins}M
                </button>
              ))}
            </div>
          </div>

          {/* Right Column: AI Assistant Forecasting & Active Tasks Panel */}
          <div className="flex-1 space-y-6 w-full text-ink-tactical">
            {/* 1. Binding Task Choice Box */}
            <div className="bg-[#09090b] border border-border-tactical p-5 rounded-xl space-y-4">
              <div className="flex items-center gap-2 border-b border-border-tactical pb-2.5">
                <ListTodo size={16} className="text-accent-tactical" />
                <h3 className="font-semibold text-ink-tactical text-xs uppercase tracking-wide">Bind focus commitment</h3>
              </div>

              {activeTasks.length === 0 ? (
                <div className="text-center p-3 text-xs text-ink-muted-tactical">
                  No commitments uncompleted. Create a task in "Commitments" first!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-36 overflow-y-auto pr-0.5">
                  {activeTasks.map(t => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedTask(t);
                        addSystemLog(`Focus block bound to: "${t.title}"`, "info");
                      }}
                      className={`text-left p-3 rounded border text-xs transition-all flex items-start justify-between gap-3 cursor-pointer ${
                        selectedTask?.id === t.id
                          ? 'bg-accent-tactical/10 border-accent-tactical text-accent-tactical'
                          : 'bg-transparent border-border-tactical text-ink-muted-tactical hover:border-accent-tactical hover:text-ink-tactical'
                      }`}
                    >
                      <span className="font-bold line-clamp-1 flex-1 pr-1">{t.title}</span>
                      <span className={`text-[9px] font-mono font-bold uppercase shrink-0 px-1.5 py-0.5 rounded ${
                        t.priority === 'critical' ? 'bg-rose-950/40 text-rose-400 border border-rose-900/30' : 'bg-[#111113] text-ink-muted-tactical'
                      }`}>
                        {t.priority}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2. progressive AI predictor card */}
            <div className="bg-[#09090b] border border-border-tactical p-5 rounded-xl space-y-3 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap size={15} className="text-accent-tactical animate-pulse" />
                  <h3 className="font-semibold text-ink-tactical text-xs uppercase tracking-wide">AI progressive progress predictor</h3>
                </div>
                {selectedTask && (
                  <span className="text-[10px] font-mono text-accent-tactical font-bold bg-accent-tactical/10 border border-accent-tactical/30 px-2 py-0.5 rounded">
                    EST. PROGRESS: {Math.min(100, Math.round(progressPercent))}%
                  </span>
                )}
              </div>

              <div className="bg-[#111113] p-4 rounded border border-border-tactical">
                <p className="text-xs md:text-sm text-ink-tactical leading-relaxed font-mono italic">
                  "{aiEncouragement}"
                </p>
              </div>

              {selectedTask && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px] font-mono text-ink-muted-tactical">
                  <div className="bg-[#111113] p-2.5 rounded border border-border-tactical">
                    <span className="text-[9px] text-ink-muted-tactical block font-bold">ESTIMATED COMPLETION</span>
                    <span className="text-accent-tactical font-bold">In {Math.ceil(timerSeconds / 60)} Minutes</span>
                  </div>
                  <div className="bg-[#111113] p-2.5 rounded border border-border-tactical">
                    <span className="text-[9px] text-ink-muted-tactical block font-bold">FOCUS ACCELERATOR REWARD</span>
                    <span className="text-emerald-400 font-bold">+{Math.round(initialSeconds / 6) || 10} XP points</span>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
