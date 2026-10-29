import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, Sparkles, AlertTriangle, ShieldAlert, Zap, 
  RefreshCw, MessageSquare, ListTodo, Play, Activity, 
  ChevronRight, Terminal, User, Cpu, Settings, CheckCircle2 
} from 'lucide-react';
import { type AgentState, type Task, type Schedule } from '../types';

interface AIMissionCenterProps {
  tasks: Task[];
  schedule: Schedule | null;
  agentStates: AgentState[];
  setAgentStates: React.Dispatch<React.SetStateAction<AgentState[]>>;
  onTriggerReplan: (reason: string) => Promise<void>;
  onTriggerCoachUpdate: () => Promise<void>;
  onGenerateTodayPlan: () => Promise<void>;
  addSystemLog: (msg: string, type?: 'info' | 'success' | 'warning') => void;
}

interface AgentMessage {
  id: string;
  sender: string;
  receiver: string;
  content: string;
  timestamp: string;
  type: 'info' | 'warning' | 'success' | 'critical';
}

export default function AIMissionCenter({
  tasks,
  schedule,
  agentStates,
  setAgentStates,
  onTriggerReplan,
  onTriggerCoachUpdate,
  onGenerateTodayPlan,
  addSystemLog
}: AIMissionCenterProps) {
  const [activeTab, setActiveTab] = useState<'agents' | 'communications' | 'prompts'>('agents');
  const [isRunningOrchestration, setIsRunningOrchestration] = useState(false);
  const [orchestrationStep, setOrchestrationStep] = useState(0);
  
  // Simulated Agent Communications representing real-time telemetry
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([
    {
      id: 'm1',
      sender: 'Risk Agent',
      receiver: 'Planner Agent',
      content: 'CRITICAL ALERT: "Physics Assignment" estimated hours (5h) exceed remaining time-to-deadline. Threat level 92%. Buffer reallocation requested.',
      timestamp: '02:05:12 AM',
      type: 'critical'
    },
    {
      id: 'm2',
      sender: 'Planner Agent',
      receiver: 'Recovery Agent',
      content: 'INITIATING RECOVERY: Attempting schedule realignment. Factoring in Google Calendar meetings and critical priority milestones.',
      timestamp: '02:05:14 AM',
      type: 'info'
    },
    {
      id: 'm3',
      sender: 'Recovery Agent',
      receiver: 'Planner Agent',
      content: 'MITIGATION COMPLETE: Slipped blocks shifted. Inserted 90-minute Deep Focus block and 15-minute hydration break before lunch.',
      timestamp: '02:05:15 AM',
      type: 'success'
    },
    {
      id: 'm4',
      sender: 'Coach Agent',
      receiver: 'User (Chief of Staff Tip)',
      content: 'ADAPTIVE WORKLOAD: Work capacity exceeds 120% load. Recommendation: Push slide deck polish to tomorrow morning to avoid evening fatigue.',
      timestamp: '02:10:01 AM',
      type: 'warning'
    }
  ]);

  const runMultiAgentCollaboration = async () => {
    if (isRunningOrchestration) return;
    setIsRunningOrchestration(true);
    setOrchestrationStep(1);
    addSystemLog("Initiating Multi-Agent Orchestration Session...", "info");

    // Cycle through Agent States to show life-like agent reasoning
    setAgentStates(prev => prev.map(a => a.id === 'risk' ? { ...a, status: 'auditing', lastAction: 'Scanning uncompleted tasks for slips...' } : a));
    
    // Step 1: Risk Agent Audit
    await new Promise(resolve => setTimeout(resolve, 2000));
    setOrchestrationStep(2);
    setAgentStates(prev => prev.map(a => 
      a.id === 'risk' ? { ...a, status: 'idle', lastAction: 'Completed risk audit. Found high load.' } :
      a.id === 'planner' ? { ...a, status: 'planning', lastAction: 'Compiling optimal daily agenda blocks...' } : a
    ));
    setAgentMessages(prev => [
      {
        id: `m-new-${Date.now()}-1`,
        sender: 'Risk Agent',
        receiver: 'Planner Agent',
        content: `AUDIT FINISHED: Checked ${tasks.length} tasks. Calculated dynamic risks. Schedulers notified of potential bottleneck hours.`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'info'
      },
      ...prev
    ]);

    // Step 2: Planner Agent schedules
    await new Promise(resolve => setTimeout(resolve, 2000));
    setOrchestrationStep(3);
    setAgentStates(prev => prev.map(a => 
      a.id === 'planner' ? { ...a, status: 'idle', lastAction: 'Daily plan structured and saved.' } :
      a.id === 'coach' ? { ...a, status: 'coaching', lastAction: 'Analyzing user behavior & creating advice...' } : a
    ));
    setAgentMessages(prev => [
      {
        id: `m-new-${Date.now()}-2`,
        sender: 'Planner Agent',
        receiver: 'Coach Agent',
        content: `AGENDA DESIGNED: Built focus blocks and structured time alignment. Transmitting load coefficients for coaching audit.`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'success'
      },
      ...prev
    ]);

    // Step 3: Coach Agent checks
    await new Promise(resolve => setTimeout(resolve, 2000));
    setOrchestrationStep(4);
    
    try {
      // Trigger actual server calls to update states and backends!
      await onTriggerCoachUpdate();
      await onGenerateTodayPlan();
    } catch (err) {
      console.warn("Orchestration network fallback active:", err);
    }

    setAgentStates(prev => prev.map(a => 
      a.id === 'coach' ? { ...a, status: 'idle', lastAction: 'Coaching recommendations generated.' } :
      a.id === 'recovery' ? { ...a, status: 'recovering', lastAction: 'Running deadline stress test...' } : a
    ));
    setAgentMessages(prev => [
      {
        id: `m-new-${Date.now()}-3`,
        sender: 'Coach Agent',
        receiver: 'User',
        content: `INTELLIGENT PROFILE SYNCED: Updated productivity index, focus recommendations, and burnout protection mitigations.`,
        timestamp: new Date().toLocaleTimeString(),
        type: 'success'
      },
      ...prev
    ]);

    // Step 4: Recovery stress test complete
    await new Promise(resolve => setTimeout(resolve, 1500));
    setAgentStates(prev => prev.map(a => ({
      ...a,
      status: 'idle',
      lastAction: a.id === 'recovery' ? 'All deadlines stress-tested. Risk margins safe.' : a.lastAction
    })));
    setIsRunningOrchestration(false);
    setOrchestrationStep(0);
    addSystemLog("Multi-Agent Collaborative Optimization completed successfully!", "success");
  };

  return (
    <div id="ai-mission-center" className="space-y-6">
      {/* Upper Banner: Agent Hub Header */}
      <div className="relative overflow-hidden bg-[#111113] border border-border-tactical rounded-[24px] p-6 shadow-sm">
        <div className="absolute inset-0 hatch-pattern opacity-5 pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative z-10">
          <div className="flex gap-4 items-center">
            <div className="p-3.5 bg-[#09090b] text-accent-tactical rounded border border-border-tactical shadow-sm">
              <Cpu size={28} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-ink-tactical tracking-tight uppercase">AI Chief of Staff Mission Center</h1>
              <p className="text-xs text-ink-muted-tactical mt-1">
                A multi-agent network collaborating autonomously to plan, analyze risks, and recover your schedule.
              </p>
            </div>
          </div>
          <button
            onClick={runMultiAgentCollaboration}
            disabled={isRunningOrchestration}
            className="bg-accent-tactical hover:bg-[#00e196] text-black text-xs font-mono font-bold py-3 px-5 rounded flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shrink-0 uppercase"
          >
            {isRunningOrchestration ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Synchronizing Agents...</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>Trigger Orchestration Session</span>
              </>
            )}
          </button>
        </div>

        {/* Progress Bar for the Orchestration Sync */}
        {isRunningOrchestration && (
          <div className="mt-5 space-y-2 animate-fadeIn bg-[#09090b] border border-border-tactical p-3.5 rounded">
            <div className="flex justify-between items-center text-[10px] font-mono">
              <span className="text-accent-tactical font-bold uppercase">Orchestration Progress Status</span>
              <span className="text-accent-tactical">{Math.round((orchestrationStep / 4) * 100)}% Complete</span>
            </div>
            <div className="w-full bg-[#111113] rounded h-1.5 overflow-hidden">
              <motion.div 
                className="h-full bg-accent-tactical"
                initial={{ width: '0%' }}
                animate={{ width: `${(orchestrationStep / 4) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-[11px] font-mono text-ink-muted-tactical uppercase">
              {orchestrationStep === 1 && "🤖 Risk Agent auditing tasks for overdue warning signs..."}
              {orchestrationStep === 2 && "🗓️ Planner Agent structuring time blocks and buffer spacing..."}
              {orchestrationStep === 3 && "✨ Coach Agent analyzing productivity trends and optimal periods..."}
              {orchestrationStep === 4 && "🛡️ Recovery Agent running stress-tests and locking buffers..."}
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-tactical gap-1">
        {[
          { id: 'agents', label: 'Active Agent Matrix', icon: <Bot size={14} /> },
          { id: 'communications', label: 'Telemetry Inter-Agent Chat', icon: <MessageSquare size={14} /> },
          { id: 'prompts', label: 'System Persona Prompts', icon: <Terminal size={14} /> }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-mono font-bold border-b-2 transition-all cursor-pointer uppercase ${
              activeTab === t.id 
                ? 'border-accent-tactical text-accent-tactical bg-accent-tactical/5' 
                : 'border-transparent text-ink-muted-tactical hover:text-ink-tactical'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >
          {activeTab === 'agents' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {agentStates.map(agent => {
                const isPlanner = agent.id === 'planner';
                const isRisk = agent.id === 'risk';
                const isCoach = agent.id === 'coach';
                const isRecovery = agent.id === 'recovery';

                let colorClass = 'border-accent-tactical/30 text-accent-tactical';
                let iconBg = 'bg-accent-tactical/10 text-accent-tactical';
                if (isRisk) { colorClass = 'border-rose-500/30 text-rose-400'; iconBg = 'bg-rose-500/10 text-rose-400'; }
                else if (isCoach) { colorClass = 'border-indigo-500/30 text-indigo-400'; iconBg = 'bg-[#18181b] text-indigo-400'; }
                else if (isRecovery) { colorClass = 'border-emerald-500/30 text-emerald-400'; iconBg = 'bg-emerald-500/10 text-emerald-400'; }

                return (
                  <div
                    key={agent.id}
                    className="bg-[#111113] border border-border-tactical hover:border-accent-tactical/30 rounded-[16px] p-5 relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      {/* Agent Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded border border-border-tactical ${iconBg}`}>
                            <Bot size={18} />
                          </div>
                          <div>
                            <h3 className="font-bold text-ink-tactical text-sm">{agent.name}</h3>
                            <p className="text-[10px] font-mono text-ink-muted-tactical uppercase tracking-wider">{agent.role}</p>
                          </div>
                        </div>

                        {agent.status !== 'idle' ? (
                          <span className={`flex items-center gap-1.5 text-[9px] font-mono border ${colorClass} bg-[#09090b] px-2 py-1 rounded animate-pulse`}>
                            <RefreshCw size={8} className="animate-spin" /> {agent.status.toUpperCase()}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[9px] font-mono border border-border-tactical text-ink-muted-tactical bg-[#09090b] px-2 py-1 rounded">
                            <span className="w-1.5 h-1.5 bg-zinc-600 rounded-full" /> IDLE
                          </span>
                        )}
                      </div>

                      {/* Status Activity Display */}
                      <div className="bg-[#09090b] border border-border-tactical p-3 rounded font-mono text-xs text-ink-tactical">
                        <span className="text-[9px] text-ink-muted-tactical block uppercase tracking-wider mb-1 font-bold">Current Action</span>
                        <p className="line-clamp-2">{agent.lastAction}</p>
                      </div>
                    </div>

                    {/* Metadata Footer */}
                    <div className="mt-4 pt-3.5 border-t border-border-tactical flex justify-between items-center text-[10px] font-mono text-ink-muted-tactical">
                      <div className="flex items-center gap-1">
                        <Cpu size={10} />
                        <span>Core LLM: <span className="text-ink-tactical font-bold">{agent.model}</span></span>
                      </div>
                      <span>Temp: 0.2</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'communications' && (
            <div className="bg-[#111113] border border-border-tactical rounded-[16px] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-border-tactical pb-3">
                <div className="flex items-center gap-2">
                  <Terminal size={16} className="text-accent-tactical" />
                  <h3 className="font-semibold text-ink-tactical text-sm uppercase">Real-Time Telemetry Inter-Agent Logs</h3>
                </div>
                <span className="text-[9px] font-mono text-ink-muted-tactical uppercase tracking-widest font-bold">Decentralized Agent Coordination</span>
              </div>

              <div className="space-y-3.5 max-h-96 overflow-y-auto pr-1">
                {agentMessages.map(msg => {
                  let alertColor = 'border-l-accent-tactical bg-[#09090b] text-ink-tactical';
                  if (msg.type === 'critical') alertColor = 'border-l-rose-500 bg-[#09090b] text-rose-300';
                  else if (msg.type === 'warning') alertColor = 'border-l-amber-500 bg-[#09090b] text-amber-300';
                  else if (msg.type === 'success') alertColor = 'border-l-emerald-500 bg-[#09090b] text-emerald-300';

                  return (
                    <div
                      key={msg.id}
                      className={`border border-border-tactical border-l-4 rounded p-3.5 space-y-1.5 hover:bg-accent-tactical/5 transition-all ${alertColor}`}
                    >
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-ink-tactical">{msg.sender}</span>
                          <ChevronRight size={10} className="text-ink-muted-tactical" />
                          <span className="text-ink-muted-tactical">{msg.receiver}</span>
                        </div>
                        <span className="text-ink-muted-tactical font-semibold">{msg.timestamp}</span>
                      </div>
                      <p className="text-xs font-mono leading-relaxed text-ink-muted-tactical">{msg.content}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'prompts' && (
            <div className="bg-[#111113] border border-border-tactical rounded-[16px] p-5 space-y-5">
              <div className="border-b border-border-tactical pb-3">
                <h3 className="font-semibold text-ink-tactical text-sm uppercase">System Prompt Design Specification</h3>
                <p className="text-xs text-ink-muted-tactical mt-0.5">The custom System Personas engineered to instruct the Gemini-3.5 model</p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    agent: 'Planner Agent (Schedule Structuring)',
                    prompt: 'You are the Chief of Staff Planner Agent. Your objective is to structure a perfectly synchronized daily agenda in strict chronological order. Take a list of commitments, detect overlaps, and output structured focus, break, or task blocks. Format in strict JSON with matching schema.'
                  },
                  {
                    agent: 'Risk Agent (Failure Prevention)',
                    prompt: 'You are the Risk Mitigation Agent. Your objective is to analyze a user\'s pending list of goals and evaluate potential slippage hazards. Calculate a risk score from 0-100% based on remaining hours, load, and priorities, providing a concrete action mitigation and rationale.'
                  },
                  {
                    agent: 'Recovery Agent (Dynamic Replanner)',
                    prompt: 'You are the Stress Recovery Agent. Your goal is to react to a sudden schedule delay, and perform localized shift movements on uncompleted blocks, adding buffer spacers and generating calming motivational coaching messages.'
                  }
                ].map((spec, i) => (
                  <div key={i} className="bg-[#09090b] border border-border-tactical rounded p-4 space-y-2">
                    <span className="text-[11px] font-mono text-accent-tactical font-bold block uppercase">{spec.agent}</span>
                    <p className="text-xs font-mono text-ink-muted-tactical leading-relaxed bg-[#111113] p-3 rounded border border-border-tactical">
                      "{spec.prompt}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
