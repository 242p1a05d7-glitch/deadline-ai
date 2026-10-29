import React from 'react';
import { Activity } from 'lucide-react';
import VoiceAssistant from './VoiceAssistant';

interface RightAIPanelProps {
  onAddTask: (entities: { title: string; dueDate?: string; priority?: string; duration?: number }) => void;
  onTriggerReplan: (reason: string) => void;
  onGenerateTodayPlan: () => void;
  onViewDeadlines: () => void;
  addSystemLog: (message: string, type: 'info' | 'success' | 'warning') => void;
  systemLogs: Array<{ id: string; message: string; type: 'success' | 'info' | 'warning' }>;
  setSystemLogs: React.Dispatch<React.SetStateAction<Array<{ id: string; message: string; type: 'success' | 'info' | 'warning' }>>>;
}

const RightAIPanel: React.FC<RightAIPanelProps> = ({
  onAddTask,
  onTriggerReplan,
  onGenerateTodayPlan,
  onViewDeadlines,
  addSystemLog,
  systemLogs,
  setSystemLogs
}) => {
  return (
    <div className="flex flex-col gap-6 h-full p-1 overflow-hidden">
      {/* Voice Assistant */}
      <VoiceAssistant
        onAddTask={onAddTask}
        onTriggerReplan={onTriggerReplan}
        onGenerateTodayPlan={onGenerateTodayPlan}
        onViewDeadlines={onViewDeadlines}
        addSystemLog={addSystemLog}
      />

      {/* Autonomous Activity Console */}
      <div className="flex-1 min-h-0 flex flex-col bg-[#111113] border border-border-tactical rounded-[24px] p-5 relative overflow-hidden text-ink-tactical">
        <div className="absolute inset-0 hatch-pattern opacity-[0.02] pointer-events-none" />
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-border-tactical relative z-10">
          <span className="text-xs font-mono text-accent-tactical font-bold uppercase tracking-wider flex items-center gap-1.5">
            <Activity size={13} className="animate-pulse" />
            Autonomous Activity Console
          </span>
          {systemLogs.length > 0 && (
            <button
              onClick={() => setSystemLogs([])}
              className="text-[10px] font-mono text-ink-muted-tactical hover:text-ink-tactical transition-all cursor-pointer uppercase border border-border-tactical/60 px-2 py-0.5 rounded-md hover:bg-white/5"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 font-mono text-xs relative z-10 scrollbar-thin scrollbar-thumb-slate-800">
          {systemLogs.length === 0 ? (
            <p className="text-[11px] text-ink-muted-tactical italic font-mono uppercase">Console idle. Awaiting agent activity...</p>
          ) : (
            systemLogs.map(l => (
              <div key={l.id} className="text-[11px] font-mono flex items-start gap-2 border-b border-white/5 pb-2 last:border-0 last:pb-0">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
                  l.type === 'success' ? 'bg-emerald-500 animate-pulse' : l.type === 'warning' ? 'bg-amber-500' : 'bg-accent-tactical'
                }`} />
                <div className="flex-1">
                  <p className="text-ink-muted-tactical leading-normal font-medium">{l.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(RightAIPanel);
