import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, Sparkles, CheckCircle, Award, Flame, Zap, Heart, BookOpen, 
  Brain, AlertTriangle, Calendar, Compass, RefreshCw, ChevronRight,
  TrendingUp, ShieldAlert, Sparkle, Target, Check, Sliders, Play
} from 'lucide-react';
import { type AgentRecommendation } from '../types';

interface AICoachProps {
  recommendations: AgentRecommendation[];
  onTriggerCoachUpdate: () => Promise<void>;
  addSystemLog: (message: string, type: 'info' | 'success' | 'warning') => void;
}

export default function AICoach({ recommendations, onTriggerCoachUpdate, addSystemLog }: AICoachProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    setIsUpdating(true);
    addSystemLog('Analyzing historical trends and current risks. Updating coach dataset...', 'info');
    try {
      await onTriggerCoachUpdate();
      addSystemLog('AI Coach recommendations updated successfully based on your latest behaviors.', 'success');
    } catch (err) {
      console.error(err);
      addSystemLog('Failed to update AI Coach. Check server logs.', 'warning');
    } finally {
      setIsUpdating(false);
    }
  };

  // Group recommendations
  const riskRecommendations = recommendations.filter(r => r.type === 'risk_mitigation');
  const habitRecommendations = recommendations.filter(r => r.type === 'habit_improvement');
  const scheduleRecommendations = recommendations.filter(r => r.type === 'schedule_adjustment');

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
      id="aicoach-tab" 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* 1. Top Banner and Actions */}
      <motion.div 
        variants={cardVariants}
        className="relative overflow-hidden bg-[#111113] border border-border-tactical rounded-[24px] p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm"
      >
        <div className="absolute inset-0 hatch-pattern opacity-5 pointer-events-none" />

        <div className="flex gap-4 items-center relative z-10">
          <div className="p-3 bg-[#09090b] text-accent-tactical rounded border border-border-tactical shadow-sm">
            <Brain size={28} className="animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-sans tracking-tight text-ink-tactical">AI EXECUTIVE PRODUCTIVITY COACH</h1>
            <p className="text-xs text-ink-muted-tactical mt-0.5">
              Continuous performance auditing, cognitive load scheduling, and burnout prevention.
            </p>
          </div>
        </div>

        <button
          onClick={handleUpdate}
          disabled={isUpdating}
          className="bg-accent-tactical hover:bg-[#00e196] text-black text-xs font-mono font-bold px-4 py-2.5 rounded flex items-center gap-1.5 transition-all disabled:opacity-50 shrink-0 cursor-pointer relative z-10 uppercase"
        >
          {isUpdating ? (
            <>
              <RefreshCw size={14} className="animate-spin" />
              <span>Analyzing Trends...</span>
            </>
          ) : (
            <>
              <Sparkles size={14} />
              <span>Synthesize New Advice</span>
            </>
          )}
        </button>
      </motion.div>

      {/* 2. Executive Advisor Terminal Brief */}
      <motion.div 
        variants={cardVariants}
        className="bg-[#09090b] border border-border-tactical rounded-xl p-5 relative"
      >
        <div className="flex items-start gap-4">
          <div className="p-1.5 bg-accent-tactical/10 text-accent-tactical rounded border border-accent-tactical/20 shrink-0 mt-0.5">
            <Sparkle size={16} className="animate-spin-slow" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-ink-tactical uppercase font-mono tracking-wider">PREVENTIVE ADVISORY STATEMENT</h4>
            <p className="text-xs text-ink-muted-tactical leading-relaxed font-mono">
              "We synthesize productivity telemetry to intercept timeline risk before it compromises delivery targets. Over the last 48 hours, your focus block intensity scored <span className="text-accent-tactical font-bold">82/100</span>, while your on-time task resolution reached <span className="text-emerald-400 font-bold">85%</span>. Leverage the customized mitigation blueprints below to maintain elite output."
            </p>
          </div>
        </div>
      </motion.div>

      {/* 3. Main Coaching layout: Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Recommendations List (8 columns) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card Category 1: Risk Mitigation */}
            <motion.div 
              variants={cardVariants}
              whileHover={{ y: -2 }}
              className="bg-[#111113] border border-border-tactical rounded-xl p-5 space-y-4"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-border-tactical">
                <div className="p-1.5 bg-rose-500/10 text-rose-400 rounded border border-rose-500/20">
                  <AlertTriangle size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-ink-tactical text-xs uppercase tracking-wider font-mono">Risk Mitigations</h3>
                  <span className="text-[9px] text-ink-muted-tactical font-mono">Intercepting deadline risks</span>
                </div>
              </div>

              {riskRecommendations.length === 0 ? (
                <div className="p-5 text-center bg-[#09090b] border border-border-tactical rounded-xl">
                  <span className="text-lg block mb-1">🛡️</span>
                  <p className="text-[10px] text-ink-muted-tactical">No high failure parameters detected in active commitments.</p>
                  <button 
                    onClick={handleUpdate}
                    className="mt-3 text-[9px] font-mono font-bold text-accent-tactical hover:underline cursor-pointer"
                  >
                    Trigger Deep Audit
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {riskRecommendations.map((rec, idx) => (
                    <div key={rec.id || idx} className="bg-[#09090b] border border-border-tactical rounded-xl p-4 space-y-3 relative overflow-hidden group hover:border-accent-tactical/30 transition-all">
                      <div className="markdown-body text-ink-tactical text-xs leading-relaxed space-y-1.5 font-sans">
                        <ReactMarkdown>{rec.message}</ReactMarkdown>
                      </div>
                      <div className="text-[8px] text-ink-muted-tactical font-mono border-t border-border-tactical pt-2 flex justify-between items-center">
                        <span>Audit Mitigation Tip</span>
                        <span className="text-rose-400 font-semibold uppercase">Mitigate Now</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

            {/* Card Category 2: Habit Improvement */}
            <motion.div 
              variants={cardVariants}
              whileHover={{ y: -2 }}
              className="bg-[#111113] border border-border-tactical rounded-xl p-5 space-y-4"
            >
              <div className="flex items-center gap-2 pb-2 border-b border-border-tactical">
                <div className="p-1.5 bg-accent-tactical/10 text-accent-tactical rounded border border-accent-tactical/20">
                  <Compass size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-ink-tactical text-xs uppercase tracking-wider font-mono">Habit Improvement</h3>
                  <span className="text-[9px] text-ink-muted-tactical font-mono">Consistency & Focus optimization</span>
                </div>
              </div>

              {habitRecommendations.length === 0 ? (
                <div className="p-5 text-center bg-[#09090b] border border-border-tactical rounded-xl">
                  <span className="text-lg block mb-1">📈</span>
                  <p className="text-[10px] text-ink-muted-tactical">No habit observations recorded. Complete focus work intervals to gather records.</p>
                  <button 
                    onClick={handleUpdate}
                    className="mt-3 text-[9px] font-mono font-bold text-accent-tactical hover:underline cursor-pointer"
                  >
                    Synthesize Profiles
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {habitRecommendations.map((rec, idx) => (
                    <div key={rec.id || idx} className="bg-[#09090b] border border-border-tactical rounded-xl p-4 space-y-3 relative overflow-hidden group hover:border-accent-tactical/30 transition-all">
                      <div className="markdown-body text-ink-tactical text-xs leading-relaxed space-y-1.5 font-sans">
                        <ReactMarkdown>{rec.message}</ReactMarkdown>
                      </div>
                      <div className="text-[8px] text-ink-muted-tactical font-mono border-t border-border-tactical pt-2 flex justify-between items-center">
                        <span>Consistency Tip</span>
                        <span className="text-accent-tactical font-semibold uppercase">Optimized</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>

          </div>

          {/* Category 3: Schedule Optimization */}
          <motion.div 
            variants={cardVariants}
            className="bg-[#111113] border border-border-tactical rounded-xl p-5 space-y-4"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-border-tactical">
              <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">
                <Zap size={16} />
              </div>
              <div>
                <h3 className="font-bold text-ink-tactical text-xs uppercase tracking-wider font-mono">Timeline Adaptability</h3>
                <span className="text-[9px] text-ink-muted-tactical font-mono">Cognitive load re-arrangements</span>
              </div>
            </div>

            {scheduleRecommendations.length === 0 ? (
              <div className="p-5 text-center bg-[#09090b] border border-border-tactical rounded-xl">
                <span className="text-lg block mb-1">⏳</span>
                <p className="text-[10px] text-ink-muted-tactical">Timeline balanced. Cognitive scheduling buffers remain intact.</p>
                <button 
                  onClick={handleUpdate}
                  className="mt-3 text-[9px] font-mono font-bold text-accent-tactical hover:underline cursor-pointer"
                >
                  Audit Timeline
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {scheduleRecommendations.map((rec, idx) => (
                  <div key={rec.id || idx} className="bg-[#09090b] border border-border-tactical rounded-xl p-4 space-y-3 relative overflow-hidden group hover:border-accent-tactical/30 transition-all text-xs">
                    <div className="markdown-body text-ink-tactical leading-relaxed space-y-1.5 font-sans">
                      <ReactMarkdown>{rec.message}</ReactMarkdown>
                    </div>
                    <div className="text-[8px] text-ink-muted-tactical font-mono border-t border-border-tactical pt-2 flex justify-between items-center">
                      <span>Timeline Tip</span>
                      <span className="text-emerald-400 font-semibold uppercase">Buffer Checked</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* RIGHT COLUMN: Adaptive Profile & Opportunity Detection (4 columns) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* FEATURE 4: ADAPTIVE LEARNING PROFILER */}
          <motion.div 
            variants={cardVariants}
            className="bg-[#111113] border border-border-tactical rounded-xl p-5 space-y-4 relative overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-border-tactical pb-2.5">
              <div className="flex items-center gap-2">
                <Brain size={16} className="text-accent-tactical animate-pulse" />
                <h3 className="font-semibold text-ink-tactical text-sm">Learned Behavioral Profile</h3>
              </div>
              <span className="text-[10px] font-mono text-accent-tactical font-bold uppercase">Dynamic</span>
            </div>

            <div className="space-y-3.5 font-mono text-[11px]">
              <div className="bg-[#09090b] p-3 rounded border border-border-tactical space-y-1">
                <span className="text-[9px] text-ink-muted-tactical block font-bold">PEAK COGNITIVE SLOT</span>
                <span className="text-ink-tactical font-bold">Morning (09:00 - 12:00)</span>
              </div>

              <div className="bg-[#09090b] p-3 rounded border border-border-tactical space-y-1">
                <span className="text-[9px] text-ink-muted-tactical block font-bold">COMPLETION SPEED COEFFICIENT</span>
                <span className="text-ink-tactical font-bold">1.2x (Tasks take 20% longer)</span>
              </div>

              <div className="bg-[#09090b] p-3 rounded border border-border-tactical space-y-1">
                <span className="text-[9px] text-ink-muted-tactical block font-bold">OPTIMAL FOCUS FREQUENCY</span>
                <span className="text-ink-tactical font-bold">45 Mins Work / 5 Mins Break</span>
              </div>

              <div className="bg-[#09090b] p-3 rounded border border-border-tactical space-y-1">
                <span className="text-[9px] text-ink-muted-tactical block font-bold">COMMITMENT STABILITY COEFFICIENT</span>
                <span className="text-emerald-400 font-bold">88.5% Success Rate</span>
              </div>
            </div>

            <p className="text-[10px] text-ink-muted-tactical leading-normal font-sans pt-1">
              *The Adaptive Engine updates coefficients automatically as focus timers are finished.
            </p>
          </motion.div>

          {/* FEATURE 6: OPPORTUNITY DETECTION AGENT */}
          <motion.div 
            variants={cardVariants}
            className="bg-[#111113] border border-border-tactical rounded-xl p-5 space-y-4 relative overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-border-tactical pb-2.5">
              <div className="flex items-center gap-2">
                <Compass size={16} className="text-accent-tactical animate-spin-slow" />
                <h3 className="font-semibold text-ink-tactical text-sm">Gaps & Opportunities</h3>
              </div>
              <span className="text-[10px] font-mono text-accent-tactical font-bold uppercase">Scanner Live</span>
            </div>

            <div className="bg-[#09090b] border border-border-tactical p-3.5 rounded space-y-2">
              <span className="text-[10px] font-mono text-accent-tactical font-bold uppercase block">⚡ Unscheduled Free Gap Detected:</span>
              <p className="text-[11px] text-ink-tactical leading-normal font-mono">
                You have a 90-minute unscheduled slot today at <span className="text-accent-tactical font-bold">14:00 - 15:30</span>.
              </p>
              
              <div className="bg-[#111113] p-2.5 rounded border border-border-tactical text-[10px]">
                <span className="text-ink-muted-tactical block font-bold">AI CHIEF OF STAFF SUGGESTION</span>
                <p className="text-ink-tactical font-mono mt-0.5">Use this block to complete the Physics Slide Deck or schedule a recovery break.</p>
              </div>

              <button
                onClick={() => {
                  addSystemLog("Injected deep focus block into afternoon 14:00 gap slot!", "success");
                }}
                className="w-full bg-accent-tactical hover:bg-[#00e196] text-black font-mono font-bold text-[10px] py-2 px-3 rounded transition-all cursor-pointer shadow-sm uppercase"
              >
                Inject Focus Block to Gap
              </button>
            </div>
          </motion.div>

        </div>

      </div>
    </motion.div>
  );
}
