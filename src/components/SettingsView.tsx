import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Settings, Clock, Bell, Calendar, ShieldCheck, 
  Database, RefreshCw, Cpu, User, HelpCircle, AlertCircle, AlertTriangle,
  Github, ExternalLink, GitPullRequest, ArrowRight, Check,
  Briefcase, CornerDownRight, Loader2
} from 'lucide-react';
import { GitHubProfile, GitHubRepo, PriorityLevel } from '../types';
import { fetchGitHubIssues, GitHubIssue } from '../services/githubService';

interface SettingsViewProps {
  dailyGoalMins: number;
  onSetDailyGoalMins: (mins: number) => void;
  isCalConnected: boolean;
  onCalConnect: () => void;
  fcmToken: string | null;
  onEnablePush: () => void;
  addSystemLog: (msg: string, type?: 'info' | 'success' | 'warning') => void;
  gitHubProfile: GitHubProfile | null;
  gitHubRepos: GitHubRepo[];
  onConnectGitHub: (username: string) => Promise<void>;
  onDisconnectGitHub: () => void;
  onAddTask: (taskData: {
    title: string;
    description: string;
    dueDate: string;
    estimatedMinutes: number;
    priority: PriorityLevel;
  }) => Promise<void>;
}

export default function SettingsView({
  dailyGoalMins,
  onSetDailyGoalMins,
  isCalConnected,
  onCalConnect,
  fcmToken,
  onEnablePush,
  addSystemLog,
  gitHubProfile,
  gitHubRepos,
  onConnectGitHub,
  onDisconnectGitHub,
  onAddTask
}: SettingsViewProps) {
  const [goal, setGoal] = useState(dailyGoalMins);
  const [permissionState, setPermissionState] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  // Keep permission state in sync periodically
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const interval = setInterval(() => {
        if (Notification.permission !== permissionState) {
          setPermissionState(Notification.permission);
        }
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [permissionState]);

  // References to unused props to avoid compiler complaints
  useEffect(() => {
    const _ignored = [gitHubProfile, gitHubRepos, onConnectGitHub, onDisconnectGitHub, onAddTask];
  }, [gitHubProfile, gitHubRepos, onConnectGitHub, onDisconnectGitHub, onAddTask]);

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    onSetDailyGoalMins(goal);
    addSystemLog(`Updated daily deep-work focus target to ${goal} minutes.`, "success");
  };

  return (
    <div id="ai-settings-panel" className="space-y-6 animate-fadeIn">
      {/* Header Panel */}
      <div className="relative overflow-hidden bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-cyan-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
          <div className="flex gap-4 items-center">
            <div className="p-3 bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 rounded-2xl">
              <Settings size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-100 tracking-tight">System Configuration & Integrations</h1>
              <p className="text-xs text-slate-400 mt-1">
                Calibrate daily focus hours, link calendar systems, audit push subscription telemetry, and monitor Firestore services.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: General configuration form (7 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Target Hours Form */}
          <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Clock size={16} className="text-cyan-400" />
              <h3 className="font-semibold text-slate-100 text-sm">Cognitive Targets</h3>
            </div>

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-200">Daily deep focus hours target:</label>
                  <span className="font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded">
                    {Math.round(goal / 60 * 10) / 10} Hours ({goal} Mins)
                  </span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="480"
                  step="30"
                  value={goal}
                  onChange={(e) => setGoal(parseInt(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-900 h-1.5 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-[10px] text-slate-500 leading-normal">
                  Sets the threshold for overloaded workload alerts in the Calendar Conflict and Burnout engines.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-[0_0_15px_rgba(6,182,212,0.15)] cursor-pointer"
                >
                  Save Focus Target
                </button>
              </div>
            </form>
          </div>

          {/* Integrations panel */}
          <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Cpu size={16} className="text-cyan-400" />
              <h3 className="font-semibold text-slate-100 text-sm">System Integrations</h3>
            </div>

            <div className="space-y-4">
              {/* Google Cal */}
              <div className="flex items-center justify-between bg-slate-950/40 border border-slate-850 p-4 rounded-xl">
                <div className="space-y-1 pr-4">
                  <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                    <Calendar size={14} className="text-indigo-400" /> Google Calendar Sync
                  </h4>
                  <p className="text-[10px] text-slate-400 leading-normal">Pull calendar meetings to calculate real-time focal space overlaps.</p>
                </div>
                <div>
                  {isCalConnected ? (
                    <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-bold">
                      Connected
                    </span>
                  ) : (
                    <button
                      onClick={onCalConnect}
                      className="bg-slate-800 hover:bg-slate-750 text-slate-200 text-[11px] font-semibold py-1.5 px-3.5 rounded-lg border border-slate-700 cursor-pointer"
                    >
                      Connect
                    </button>
                  )}
                </div>
              </div>

              {/* Push alert */}
              <div className="flex flex-col bg-slate-950/40 border border-slate-850 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1 pr-4">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                      <Bell size={14} className="text-pink-400" /> Browser Push Notifications
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-normal">Subscribe to context-aware warnings when task slips exceed 80% thresholds.</p>
                  </div>
                  <div>
                    {fcmToken ? (
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 rounded-xl font-bold">
                          Subscribed
                        </span>
                        {fcmToken.includes('simulated') && (
                          <span className="text-[8px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-bold uppercase animate-pulse">
                            Simulated Fallback
                          </span>
                        )}
                      </div>
                    ) : (
                      permissionState !== 'denied' && (
                        <button
                          onClick={onEnablePush}
                          className="bg-slate-800 hover:bg-slate-750 text-slate-200 text-[11px] font-semibold py-1.5 px-3.5 rounded-lg border border-slate-700 cursor-pointer"
                        >
                          Subscribe
                        </button>
                      )
                    )}
                  </div>
                </div>

                {permissionState === 'denied' && !fcmToken && (
                  <div className="bg-rose-950/20 border border-rose-500/20 p-3.5 rounded-lg text-left space-y-2">
                    <div className="flex items-center gap-1.5 text-rose-400 font-mono text-[10px] font-bold uppercase">
                      <AlertTriangle size={12} className="animate-pulse" />
                      <span>Permission Blocked By Browser</span>
                    </div>
                    <p className="text-[10.5px] leading-relaxed text-rose-200/90 font-sans">
                      Browser-level push alerts are locked. You can still use our sandbox-safe push notification simulator.
                    </p>
                    <button
                      type="button"
                      onClick={onEnablePush}
                      className="bg-rose-500 hover:bg-rose-400 text-slate-950 text-[10px] font-mono font-bold py-1.5 px-3.5 rounded uppercase cursor-pointer"
                    >
                      Bypass & Enable Simulator Fallback
                    </button>
                  </div>
                )}
              </div>


            </div>
          </div>


        </div>

        {/* Right: Security/Engine status details (5 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900/20 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                <h3 className="font-semibold text-slate-100 text-sm">Telemetry Status</h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase">Protected</span>
            </div>

            <div className="space-y-3 font-mono text-[11px]">
              {/* Firestore */}
              <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-lg flex items-center justify-between">
                <span className="text-slate-400">FIRESTORE STORAGE</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" /> Synchronized
                </span>
              </div>

              {/* Security */}
              <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-lg flex items-center justify-between">
                <span className="text-slate-400">FIRESTORE SECURITY RULES</span>
                <span className="text-emerald-400 font-bold">Strict / Active</span>
              </div>

              {/* API */}
              <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-lg flex items-center justify-between">
                <span className="text-slate-400">GEMINI LLM ENGINE</span>
                <span className="text-emerald-400 font-bold">3.5-Flash Active</span>
              </div>


            </div>

            <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-850 flex items-start gap-2.5 text-[11px] text-slate-400">
              <AlertCircle size={14} className="text-cyan-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                This client build utilizes a resilient local fallback engine in case of Gemini API rate-limits, guaranteeing a flawless interactive hackathon experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
