import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AlertTriangle, ShieldAlert, Zap, TrendingUp, HelpCircle, 
  Sparkles, RefreshCw, BarChart2, CheckCircle2, Sliders, Play
} from 'lucide-react';
import { type Task, type SimulationResult } from '../types';

interface RiskCenterProps {
  tasks: Task[];
  addSystemLog: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

export default function RiskCenter({ tasks, addSystemLog }: RiskCenterProps) {
  // Simulator form state
  const [skipSession, setSkipSession] = useState(false);
  const [delayDays, setDelayDays] = useState(0);
  const [extraHours, setExtraHours] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  const handleRunSimulation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSimulating) return;
    setIsSimulating(true);
    addSystemLog("Feeding parameters to AI What-If Simulator engine...", "info");

    await new Promise(resolve => setTimeout(resolve, 1800));

    // Dynamic Simulation Logic based on inputs
    let riskChange = 0;
    let headline = "Mild Adjustment Scheduled";
    let deadlineImpact = "All high-priority deadlines remain secured with comfortable buffers.";
    let workload = "Daily load unchanged.";
    let suggestion = "Maintain your current daily routine. Agenda blocks are balanced.";
    let viable = true;

    if (skipSession) {
      riskChange += 35;
      headline = "⚠️ Severe Deadline Overload Imminent!";
      deadlineImpact = "Physics Term Assignment deadline slips into critical deficit. High probability of late submission (-5 hours buffer).";
      workload = "Tomorrow's required cognitive hours spike by +2.5 hours.";
      suggestion = "Do not skip today. If absolutely forced, divide the Physics research into two 45-minute blocks tomorrow at 08:00 and 13:00.";
      viable = false;
    }

    if (delayDays > 0) {
      riskChange += delayDays * 15;
      headline = skipSession ? "🚨 Extreme Slippage Risk!" : "⚠️ Incremental Deadline Pressure";
      deadlineImpact = `Postponing by ${delayDays} day(s) shrinks focus windows to less than ${Math.max(1, 4 - delayDays)} hours. Pitch Deck polish risk increases.`;
      workload = `Future workload shifts downstream. Next Monday load increases by +${delayDays * 1.5} hours.`;
      suggestion = `Instead of delaying by ${delayDays} full day(s), consider submitting a draft tonight and scheduling a 30-minute touch-up tomorrow.`;
      if (delayDays > 2) viable = false;
    }

    if (extraHours > 0) {
      riskChange -= extraHours * 12;
      headline = "✨ Focus Acceleration Path Active";
      deadlineImpact = `Estimated Physics completion margins expand. You secure an extra ${extraHours * 60} minutes of safety buffer.`;
      workload = `Future workload decreases! Tomorrow's estimated stress coefficient declines by -${extraHours * 20}%.`;
      suggestion = `Excellent choice! Work 1.5 extra hours today to completely eliminate the risk of deadline failure on your Pitch Deck.`;
    }

    setSimulationResult({
      headline,
      deadlineImpact,
      riskScoreChange: riskChange,
      futureWorkloadChange: workload,
      alternativeSuggestion: suggestion,
      isViable: viable
    });

    setIsSimulating(false);
    addSystemLog("Simulation complete. Dynamic risk model refreshed.", "success");
  };

  return (
    <div id="risk-center-container" className="space-y-6">
      {/* Header Panel */}
      <div className="relative overflow-hidden bg-[#111113] border border-border-tactical rounded-[24px] p-6 shadow-sm">
        <div className="absolute inset-0 hatch-pattern opacity-5 pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
          <div className="flex gap-4 items-center">
            <div className="p-3.5 bg-[#09090b] text-rose-400 border border-border-tactical rounded shadow-sm">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-ink-tactical tracking-tight uppercase">AI Risk & What-If Simulator</h1>
              <p className="text-xs text-ink-muted-tactical mt-1">
                Forecast deadline impacts, model future workloads, and preview the side-effects of scheduling delays.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Simulation Controls (7 cols) */}
        <div className="lg:col-span-7 bg-[#111113] border border-border-tactical rounded-[24px] p-5 space-y-5">
          <div className="flex items-center gap-2 border-b border-border-tactical pb-3">
            <Sliders size={16} className="text-rose-400" />
            <h3 className="font-bold text-ink-tactical text-xs uppercase font-mono tracking-wider">Decision Modeler Console</h3>
          </div>

          <form onSubmit={handleRunSimulation} className="space-y-5">
            {/* skip block */}
            <div className="flex items-start justify-between bg-[#09090b] p-4 rounded border border-border-tactical">
              <div className="space-y-1 pr-4">
                <label className="text-xs font-bold text-ink-tactical font-mono uppercase">Skip today's scheduled deep focus blocks</label>
                <p className="text-[10px] text-ink-muted-tactical">Model the impact of postponing all focused tasks to tomorrow.</p>
              </div>
              <input
                type="checkbox"
                checked={skipSession}
                onChange={(e) => setSkipSession(e.target.checked)}
                className="w-4 h-4 rounded text-rose-500 bg-[#111113] border-border-tactical focus:ring-0 cursor-pointer mt-1"
              />
            </div>

            {/* Delay Slider */}
            <div className="space-y-2 bg-[#09090b] p-4 rounded border border-border-tactical">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="font-bold text-ink-tactical uppercase">Delay high-risk assignment by:</span>
                <span className="font-mono text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  {delayDays} Day(s)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="5"
                value={delayDays}
                onChange={(e) => setDelayDays(parseInt(e.target.value))}
                className="w-full accent-rose-500 bg-[#111113] h-1.5 rounded appearance-none cursor-pointer"
              />
              <p className="text-[10px] text-ink-muted-tactical leading-normal">
                Moves the final milestone dates forward, crowding subsequent project tasks.
              </p>
            </div>

            {/* Extra Hours Slider */}
            <div className="space-y-2 bg-[#09090b] p-4 rounded border border-border-tactical">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="font-bold text-ink-tactical uppercase">Work extra focus hours today:</span>
                <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  +{extraHours} Hour(s)
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="4"
                value={extraHours}
                onChange={(e) => setExtraHours(parseInt(e.target.value))}
                className="w-full accent-emerald-500 bg-[#111113] h-1.5 rounded appearance-none cursor-pointer"
              />
              <p className="text-[10px] text-ink-muted-tactical leading-normal">
                Models spending additional active time blocks today to buffer upcoming deadlines.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSimulating}
              className="w-full bg-accent-tactical hover:bg-[#00e196] text-black text-xs font-mono font-bold py-3 px-4 rounded flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer uppercase"
            >
              {isSimulating ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Calculating Future Impact...</span>
                </>
              ) : (
                <>
                  <Play size={14} />
                  <span>Execute AI What-If Simulation</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Simulation Results Panel (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#111113] border border-border-tactical rounded-[24px] p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-border-tactical pb-2.5">
              <BarChart2 size={16} className="text-cyan-400" />
              <h3 className="font-bold text-ink-tactical text-xs uppercase font-mono tracking-wider">Simulated Forecast Outcomes</h3>
            </div>

            <AnimatePresence mode="wait">
              {!simulationResult ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="border border-dashed border-border-tactical bg-[#09090b] rounded-[16px] p-8 text-center text-ink-muted-tactical space-y-2.5"
                >
                  <HelpCircle size={24} className="mx-auto text-ink-muted-tactical" />
                  <div>
                    <p className="text-xs font-bold text-ink-tactical uppercase">Simulation engine idle</p>
                    <p className="text-[10px] text-ink-muted-tactical mt-1 leading-normal font-mono uppercase">
                      Adjust decision sliders and skip blocks on the left, then click "Execute AI What-If Simulation" to preview outcomes.
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-4"
                >
                  {/* Headline Header card */}
                  <div className={`p-4 rounded border ${
                    simulationResult.isViable 
                      ? 'bg-emerald-500/10 border-emerald-500/20' 
                      : 'bg-rose-500/10 border-rose-500/20'
                  }`}>
                    <h4 className="text-xs font-bold text-ink-tactical flex items-center gap-1.5 uppercase font-mono">
                      <Sparkles size={13} className={simulationResult.isViable ? "text-emerald-400 animate-pulse" : "text-rose-400 animate-pulse"} />
                      {simulationResult.headline}
                    </h4>
                  </div>

                  {/* Risk Index Change Gauge */}
                  <div className="bg-[#09090b] border border-border-tactical p-4 rounded flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-ink-muted-tactical uppercase font-bold">Risk Index Deviation</span>
                      <div className="text-xl font-mono font-bold mt-1 text-ink-tactical">
                        {simulationResult.riskScoreChange >= 0 ? `+${simulationResult.riskScoreChange}%` : `${simulationResult.riskScoreChange}%`}
                      </div>
                    </div>
                    <span className={`text-[11px] font-mono font-bold px-2.5 py-1 rounded border uppercase ${
                      simulationResult.riskScoreChange > 0 
                        ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' 
                        : simulationResult.riskScoreChange < 0 
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                          : 'text-ink-muted-tactical bg-[#111113] border-border-tactical'
                    }`}>
                      {simulationResult.riskScoreChange > 0 ? "Increased Threat" : simulationResult.riskScoreChange < 0 ? "Protected Path" : "No Shift"}
                    </span>
                  </div>

                  {/* Deadline & Workload details */}
                  <div className="space-y-3">
                    <div className="bg-[#09090b] border border-border-tactical p-3.5 rounded">
                      <span className="text-[9px] font-mono text-ink-muted-tactical block uppercase tracking-wider mb-1 font-bold">Impact on commitments</span>
                      <p className="text-xs text-ink-muted-tactical leading-relaxed font-sans">{simulationResult.deadlineImpact}</p>
                    </div>

                    <div className="bg-[#09090b] border border-border-tactical p-3.5 rounded">
                      <span className="text-[9px] font-mono text-ink-muted-tactical block uppercase tracking-wider mb-1 font-bold">Downstream capacity impact</span>
                      <p className="text-xs text-ink-muted-tactical leading-relaxed font-sans">{simulationResult.futureWorkloadChange}</p>
                    </div>
                  </div>

                  {/* AI Advice */}
                  <div className="bg-[#09090b] border border-accent-tactical/20 p-4 rounded space-y-2">
                    <div className="flex items-center gap-1.5 text-accent-tactical">
                      <Sparkles size={14} />
                      <span className="text-xs font-bold uppercase tracking-wider font-mono">Mitigation Recommendation</span>
                    </div>
                    <p className="text-xs text-ink-muted-tactical leading-relaxed pl-2.5 border-l-2 border-accent-tactical font-mono">
                      {simulationResult.alternativeSuggestion}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
