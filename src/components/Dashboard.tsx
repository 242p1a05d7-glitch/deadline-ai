import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
import { 
  Bot, Sparkles, Flame, Plus, TrendingUp, CheckCircle, Award, 
  Activity, BellRing, Bell, Send, Check, Trash2, ArrowRight, 
  Clock, Calendar, Zap, RefreshCw, AlertTriangle, ChevronRight, X, ExternalLink
} from 'lucide-react';
import { type Task, type Schedule, type TimeBlock, type ProductivityLog } from '../types';

interface DashboardProps {
  tasks: Task[];
  schedule: Schedule | null;
  productivityLogs: ProductivityLog[];
  userProfile: any | null;
  googleCalendarEvents: any[];
  onTriggerReplan: (reason: string) => void;
  onGenerateTodayPlan: () => void;
  onSelectTask: (task: Task) => void;
  onAddTaskClick: () => void;
  onMarkTaskCompleted: (taskId: string) => void;
  isCalConnected: boolean;
  onCalConnect: () => void;
  
  // FCM parameters
  triggeredAlerts: Array<{
    id: string;
    taskTitle: string;
    riskScore: number;
    explanation: string;
    recoveryPlan: string;
    timestamp: string;
    isRead: boolean;
  }>;
  fcmToken: string | null;
  onEnablePush: () => void;
  onTestPush: () => void;
  onClearAlerts: () => void;
}

export default function Dashboard({
  tasks,
  schedule,
  productivityLogs,
  userProfile,
  googleCalendarEvents,
  onTriggerReplan,
  onGenerateTodayPlan,
  onSelectTask,
  onAddTaskClick,
  onMarkTaskCompleted,
  isCalConnected,
  onCalConnect,
  triggeredAlerts,
  fcmToken,
  onEnablePush,
  onTestPush,
  onClearAlerts
}: DashboardProps) {
  const [replanReason, setReplanReason] = useState('');
  const [showReplanModal, setShowReplanModal] = useState(false);
  const [isReplanning, setIsReplanning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [showHelpManual, setShowHelpManual] = useState(true);
  const [manualTab, setManualTab] = useState<'concepts' | 'quickstart' | 'integrations'>('concepts');

  const [permissionState, setPermissionState] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );

  // Keep permission state in sync periodically
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const interval = setInterval(() => {
        if (Notification.permission !== permissionState) {
          setPermissionState(Notification.permission);
        }
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [permissionState]);

  // Filter tasks at high or critical risk
  const riskTasks = tasks.filter(t => t.status !== 'completed' && t.riskScore >= 60)
    .sort((a, b) => b.riskScore - a.riskScore);

  // Upcoming deadlines (pending tasks closest to now)
  const upcomingTasks = tasks.filter(t => t.status !== 'completed')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 3);

  // Compute stats
  const currentFocusScore = userProfile?.focusScore || 78;
  const currentCompletionRate = userProfile?.completionRate || 82;
  const loggedMinutesToday = productivityLogs.length > 0 
    ? productivityLogs[productivityLogs.length - 1].focusMinutes 
    : 120;
  
  // Calculate daily target fraction
  const dailyTargetMinutes = 180;
  const focusProgress = Math.min((loggedMinutesToday / dailyTargetMinutes) * 100, 100);

  // Construct combined schedule timeline
  const combinedBlocks: any[] = [];
  if (schedule && schedule.timeBlocks) {
    schedule.timeBlocks.forEach(b => {
      combinedBlocks.push({
        ...b,
        source: 'ai'
      });
    });
  }

  const handleCopyToken = () => {
    if (!fcmToken) return;
    navigator.clipboard.writeText(fcmToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Inject calendar events if connected
  if (googleCalendarEvents && googleCalendarEvents.length > 0) {
    googleCalendarEvents.forEach(e => {
      const startDateTime = e.start?.dateTime || e.start?.date;
      if (startDateTime) {
        const timePart = new Date(startDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        const endDateTime = e.end?.dateTime || e.end?.date;
        const endTimePart = endDateTime 
          ? new Date(endDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
          : undefined;

        combinedBlocks.push({
          id: e.id,
          title: `🗓️ ${e.summary}`,
          startTime: timePart,
          endTime: endTimePart || '23:59',
          type: 'calendar',
          source: 'google'
        });
      }
    });
  }

  // Sort chronological
  combinedBlocks.sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handleExecuteReplan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replanReason) return;
    setIsReplanning(true);
    try {
      await onTriggerReplan(replanReason);
      setShowReplanModal(false);
      setReplanReason('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsReplanning(false);
    }
  };

  // 1. Chart Data Formatting for Area Chart
  const trendData = productivityLogs.length > 0
    ? productivityLogs.map(log => ({
        date: new Date(log.date).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        "Focus Score": log.score,
        "Focus Minutes": log.focusMinutes,
        "Goals Secured": log.completedTasks
      }))
    : [
        { date: 'Jun 17', "Focus Score": 65, "Focus Minutes": 90, "Goals Secured": 2 },
        { date: 'Jun 18', "Focus Score": 78, "Focus Minutes": 120, "Goals Secured": 3 },
        { date: 'Jun 19', "Focus Score": 70, "Focus Minutes": 110, "Goals Secured": 2 },
        { date: 'Jun 20', "Focus Score": 85, "Focus Minutes": 140, "Goals Secured": 4 },
        { date: 'Jun 21', "Focus Score": 92, "Focus Minutes": 160, "Goals Secured": 5 },
        { date: 'Jun 22', "Focus Score": 75, "Focus Minutes": 100, "Goals Secured": 3 },
        { date: 'Jun 23', "Focus Score": 82, "Focus Minutes": 130, "Goals Secured": 4 }
      ];

  // 2. Chart Data for Pie Chart (Goal status distribution)
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const pendingCount = tasks.filter(t => t.status !== 'completed').length;
  const pieData = [
    { name: 'Completed Goals', value: completedCount || 3, color: '#10b981' }, // emerald
    { name: 'Pending Goals', value: pendingCount || 2, color: '#3b82f6' }    // blue
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 15 } }
  };

  return (
    <motion.div 
      id="dashboard-tab"
      className="space-y-6 text-ink-tactical"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* 1. Header Banner & AI Insight */}
      <motion.div 
        variants={cardVariants}
        className="relative overflow-hidden bg-gradient-to-b from-[#121214] to-[#0d0d0f] border border-border-tactical rounded-[24px] p-6 shadow-tactical-glow text-ink-tactical"
      >
        {/* Hatch pattern layer */}
        <div className="absolute inset-0 hatch-pattern opacity-10 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex gap-4 items-center">
            <div className="p-3 bg-accent-tactical/10 border border-accent-tactical/30 rounded-xl text-accent-tactical shrink-0">
              <Bot size={28} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-display font-bold uppercase tracking-tight text-accent-tactical leading-none">
                WELCOME,<br />{userProfile?.displayName?.split(' ')[0] || 'HERO'}.
              </h1>
              <p className="text-[10px] text-ink-muted-tactical font-mono mt-2 tracking-wider uppercase flex items-center gap-1.5 font-bold">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-tactical opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-tactical"></span>
                </span>
                AUTONOMOUS SYSTEM V1.5 // ACTIVE MITIGATION
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3" style={{ paddingLeft: '0px', marginLeft: '-15px' }}>
            <div className="flex items-center gap-1.5 bg-accent-tactical/5 border border-accent-tactical/20 text-accent-tactical text-xs px-3 py-1.5 rounded-lg font-mono font-bold">
              <Flame size={14} className="animate-bounce text-accent-tactical" />
              <span>STREAK: 4 DAYS</span>
            </div>
            <button
              onClick={onAddTaskClick}
              className="bg-accent-tactical hover:bg-[#00e196] text-black text-xs font-bold font-mono uppercase px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0"
            >
              <Plus size={14} />
              <span>COMMITMENT</span>
            </button>
          </div>
        </div>

        {/* AI Insight Box */}
        <div className="mt-6 p-4 bg-[#09090b] border border-border-tactical rounded-xl relative z-10">
          <div className="flex items-center gap-2 text-accent-tactical mb-2">
            <Sparkles size={14} />
            <span className="text-xs font-bold uppercase tracking-wider font-mono">Voice AI Chief of Staff // MITIGATION ADVISORY</span>
          </div>
          <p className="text-xs md:text-sm text-ink-muted-tactical font-medium leading-relaxed font-sans">
            "I've completed an autonomous risk audit. You have {riskTasks.length} task(s) carrying high risk of slipping. However, based on our daily timeline optimization, starting <span className="text-accent-tactical font-semibold">"{riskTasks[0]?.title || 'your pending work'}"</span> within the next 45 minutes will mitigate overall deadline failure risk by <span className="bg-accent-tactical/15 text-accent-tactical px-1.5 py-0.5 rounded font-mono font-bold">78%</span>. Our daily schedule stands optimized."
          </p>
        </div>
      </motion.div>



      {/* 2. Top Metric Cards (HUD Bento Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Metric 1: Focus Score */}
        <motion.div 
          variants={cardVariants}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="bg-[#111113] border border-border-tactical rounded-[24px] p-5 flex items-center justify-between relative overflow-hidden group shadow-sm text-ink-tactical"
        >
          <div className="space-y-1 z-10">
            <span className="text-[10px] text-ink-muted-tactical font-bold uppercase tracking-wider font-mono">[ Focus Score ]</span>
            <div className="text-4xl font-display font-bold text-ink-tactical">{currentFocusScore}%</div>
            <span className="text-[10px] text-accent-tactical font-bold flex items-center gap-0.5 font-mono">
              <TrendingUp size={10} /> +4% TREND
            </span>
          </div>
          <div className="relative h-16 w-16 flex items-center justify-center z-10">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="26" stroke="#1d1d21" strokeWidth="4" fill="transparent" />
              <circle cx="32" cy="32" r="26" stroke="#00ffaa" strokeWidth="4" fill="transparent" 
                strokeDasharray={163} strokeDashoffset={163 - (163 * currentFocusScore) / 100} strokeLinecap="round" />
            </svg>
            <Activity className="absolute text-accent-tactical group-hover:scale-110 transition-transform" size={16} />
          </div>
        </motion.div>

        {/* Metric 2: On-Time Completion */}
        <motion.div 
          variants={cardVariants}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="bg-[#111113] border border-border-tactical rounded-[24px] p-5 flex items-center justify-between relative overflow-hidden group shadow-sm text-ink-tactical"
        >
          <div className="space-y-1 z-10">
            <span className="text-[10px] text-ink-muted-tactical font-bold uppercase tracking-wider font-mono">[ On-Time Index ]</span>
            <div className="text-4xl font-display font-bold text-ink-tactical">{currentCompletionRate}%</div>
            <span className="text-[10px] text-accent-tactical font-bold flex items-center gap-0.5 font-mono">
              <CheckCircle size={10} /> PEAK PERFORMANCE
            </span>
          </div>
          <div className="relative h-16 w-16 flex items-center justify-center z-10">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="26" stroke="#1d1d21" strokeWidth="4" fill="transparent" />
              <circle cx="32" cy="32" r="26" stroke="#00ffaa" strokeWidth="4" fill="transparent" 
                strokeDasharray={163} strokeDashoffset={163 - (163 * currentCompletionRate) / 100} strokeLinecap="round" />
            </svg>
            <Award className="absolute text-accent-tactical group-hover:scale-110 transition-transform" size={16} />
          </div>
        </motion.div>

        {/* Metric 3: Focus Minutes */}
        <motion.div 
          variants={cardVariants}
          whileHover={{ y: -3, transition: { duration: 0.2 } }}
          className="bg-[#111113] border border-border-tactical rounded-[24px] p-5 flex items-center justify-between relative overflow-hidden group shadow-sm sm:col-span-2 lg:col-span-1 text-ink-tactical"
        >
          <div className="space-y-1 z-10">
            <span className="text-[10px] text-ink-muted-tactical font-bold uppercase tracking-wider font-mono">[ Focus Logged ]</span>
            <div className="text-3xl font-display font-bold text-ink-tactical">{loggedMinutesToday}m / {dailyTargetMinutes}m</div>
            <span className="text-[10px] text-accent-tactical font-bold flex items-center gap-1 font-mono">
              <Zap size={10} className="text-accent-tactical animate-pulse" /> {Math.round(focusProgress)}% OF TARGET
            </span>
          </div>
          <div className="relative h-16 w-16 flex items-center justify-center z-10">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="26" stroke="#1d1d21" strokeWidth="4" fill="transparent" />
              <circle cx="32" cy="32" r="26" stroke="#00ffaa" strokeWidth="4" fill="transparent" 
                strokeDasharray={163} strokeDashoffset={163 - (163 * focusProgress) / 100} strokeLinecap="round" />
            </svg>
            <Clock className="absolute text-accent-tactical group-hover:rotate-12 transition-transform" size={16} />
          </div>
        </motion.div>
      </div>

      {/* 3. Interactive Analytical Charts Section (Bento grid style) */}
      <motion.div variants={cardVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Productivity Trends & Completed Goals Chart */}
        <div className="lg:col-span-8 bg-[#111113] border border-border-tactical rounded-[24px] p-5 shadow-sm space-y-4 text-ink-tactical">
          <div className="flex items-center justify-between pb-2 border-b border-border-tactical">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-accent-tactical" />
              <h3 className="font-display font-bold text-ink-tactical text-base uppercase">Productivity Trends</h3>
            </div>
            <span className="text-[9px] font-mono text-ink-muted-tactical uppercase font-bold">Weekly Performance Audit</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00ffaa" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#00ffaa" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="minutesColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  stroke="#3f3f46" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  style={{ fontWeight: 'bold', fontFamily: 'JetBrains Mono', fill: '#e4e4e7' }}
                />
                <YAxis 
                  stroke="#3f3f46" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  style={{ fontWeight: 'bold', fontFamily: 'JetBrains Mono', fill: '#e4e4e7' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#111113', 
                    borderColor: 'rgba(228, 228, 231, 0.1)',
                    borderWidth: '1px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#e4e4e7',
                    fontWeight: 'bold',
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="Focus Score" 
                  stroke="#00ffaa" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#scoreColor)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="Focus Minutes" 
                  stroke="#38bdf8" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#minutesColor)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="flex justify-center gap-6 text-[10px] text-ink-tactical font-mono font-bold">
            <span className="flex items-center gap-1.5 bg-[#09090b] border border-border-tactical px-2.5 py-1 rounded">
              <span className="w-2.5 h-2.5 bg-[#00ffaa] rounded-sm" /> Focus Score (%)
            </span>
            <span className="flex items-center gap-1.5 bg-[#09090b] border border-border-tactical px-2.5 py-1 rounded">
              <span className="w-2.5 h-2.5 bg-[#38bdf8] rounded-sm" /> Focus Minutes (mins)
            </span>
          </div>
        </div>

        {/* Goal Progress Pie Chart */}
        <div className="lg:col-span-4 bg-[#111113] border border-border-tactical rounded-[24px] p-5 shadow-sm flex flex-col justify-between text-ink-tactical">
          <div className="border-b border-border-tactical pb-2 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 min-w-0">
              <Award size={16} className="text-accent-tactical shrink-0" />
              <h3 className="font-display font-bold text-ink-tactical text-sm uppercase truncate">Goal Completion</h3>
            </div>
            <span className="text-[9px] font-mono text-ink-muted-tactical uppercase font-bold whitespace-nowrap shrink-0">Status Ratio</span>
          </div>

          <div className="h-44 w-full flex items-center justify-center my-2 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#00ffaa' : '#27272a'} stroke="#111113" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#111113', 
                    borderColor: 'rgba(228, 228, 231, 0.1)',
                    borderWidth: '1px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    color: '#e4e4e7',
                    fontWeight: 'bold',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute text-center flex flex-col items-center">
              <span className="text-xl font-display font-bold text-ink-tactical leading-none">{completedCount} / {tasks.length}</span>
              <span className="text-[8px] text-ink-muted-tactical font-mono uppercase tracking-wider font-bold mt-1">Secured</span>
            </div>
          </div>

          <div className="space-y-2">
            {pieData.map((d, index) => (
              <div key={index} className="flex justify-between items-center text-xs bg-[#09090b] border border-border-tactical rounded-xl px-3 py-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full border border-border-tactical" style={{ backgroundColor: index === 0 ? '#00ffaa' : '#27272a' }} />
                  <span className="text-ink-tactical font-bold text-[11px] font-mono uppercase">{d.name}</span>
                </div>
                <span className="font-mono text-ink-tactical font-bold">{tasks.length > 0 ? d.value : 0}</span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* 4. Column split: Timeline on left, Alerts Radar on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* COLUMN LEFT: Chronological Time Block Schedule (7 columns) */}
        <motion.div 
          variants={cardVariants}
          className="lg:col-span-7 bg-[#111113] border border-border-tactical rounded-[24px] p-5 shadow-sm space-y-4 text-ink-tactical"
        >
          <div className="flex items-center justify-between border-b border-border-tactical pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-accent-tactical/10 border border-accent-tactical/30 text-accent-tactical rounded-lg">
                <Calendar size={16} />
              </div>
              <div>
                <h3 className="font-display font-bold text-ink-tactical text-sm uppercase">Chronological Daily Timeline</h3>
                <p className="text-[10px] text-ink-muted-tactical font-mono uppercase font-bold">AI Scheduled Milestones</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowReplanModal(true)}
                className="bg-transparent hover:bg-accent-tactical/10 text-accent-tactical border border-accent-tactical/30 text-[10px] font-mono font-bold px-3 py-1.5 rounded uppercase cursor-pointer"
              >
                <RefreshCw size={11} className="inline mr-1" />
                <span>Re-plan</span>
              </button>
              <button
                onClick={onGenerateTodayPlan}
                className="bg-accent-tactical hover:bg-[#00e196] text-black border border-accent-tactical text-[10px] font-mono font-bold px-3 py-1.5 rounded uppercase cursor-pointer"
              >
                <Zap size={11} className="inline mr-1" />
                <span>Optimize</span>
              </button>
            </div>
          </div>

          {combinedBlocks.length === 0 ? (
            <div className="border border-dashed border-border-tactical bg-[#09090b] rounded-[16px] p-8 text-center flex flex-col items-center justify-center space-y-3">
              <Calendar size={24} className="text-ink-muted-tactical" />
              <div className="space-y-1">
                <p className="text-ink-tactical font-bold text-xs">Agenda timeline empty for today.</p>
                <p className="text-[10px] text-ink-muted-tactical max-w-xs leading-normal">
                  Click "Optimize" above to have the AI Auditor schedule tasks within your available daily blocks.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {combinedBlocks.map((block, idx) => {
                const isCalendar = block.type === 'calendar';
                const isFocus = block.type === 'focus';
                const isBreak = block.type === 'break';
                
                const blockColorClass = isCalendar 
                  ? 'border-l-indigo-500/80 bg-indigo-500/5'
                  : isBreak 
                    ? 'border-l-accent-tactical/80 bg-accent-tactical/5'
                    : 'border-l-cyan-500/80 bg-cyan-500/5';

                return (
                  <div
                    key={block.id || idx}
                    className={`border border-border-tactical border-l-[6px] rounded-lg p-3.5 flex justify-between items-center transition-all ${blockColorClass}`}
                  >
                    <div className="space-y-1 truncate flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase bg-[#09090b] px-1.5 py-0.5 rounded text-accent-tactical border border-border-tactical font-bold">
                          {block.startTime} {block.endTime ? ` - ${block.endTime}` : ''}
                        </span>
                        {block.source === 'google' && (
                          <span className="text-[8px] font-mono bg-indigo-950/40 border border-indigo-800/40 px-1 rounded text-indigo-400 font-bold uppercase">Google Cal</span>
                        )}
                      </div>
                      <h4 className="text-xs font-bold text-ink-tactical truncate">{block.title}</h4>
                    </div>
                    <div className="shrink-0 text-right">
                      <span className="text-[9px] font-mono text-ink-muted-tactical block uppercase font-bold">Activity Field</span>
                      <span className="text-xs font-mono font-bold uppercase text-ink-tactical">{block.type || 'Block'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* COLUMN RIGHT: Risk Alerts & FCM Push Notification Radar (5 columns) */}
        <motion.div 
          variants={cardVariants}
          className="lg:col-span-5 space-y-6"
        >
          {/* FCM Push Notification Radar & Alert Feed */}
          <div className="bg-[#111113] border border-border-tactical rounded-[24px] p-5 shadow-sm space-y-4 text-ink-tactical relative overflow-hidden">
            {/* Hatch pattern layer */}
            <div className="absolute inset-0 hatch-pattern opacity-10 pointer-events-none" />
            
            <div className="flex items-center justify-between border-b border-border-tactical pb-3 relative z-10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-accent-tactical/10 border border-accent-tactical/30 text-accent-tactical rounded-lg">
                  <BellRing size={16} className={fcmToken ? "animate-pulse" : ""} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-ink-tactical text-sm uppercase">FCM Risk Radar</h3>
                  <p className="text-[10px] text-ink-muted-tactical font-mono uppercase font-bold">Push Alert Service Active</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {fcmToken ? (
                  <span className="flex items-center gap-1 text-[9px] font-mono bg-emerald-950/40 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded-full font-bold">
                    <Check size={8} /> Active
                  </span>
                ) : (
                  <span className="text-[9px] font-mono bg-rose-950/40 text-rose-400 border border-rose-800/40 px-2 py-0.5 rounded-full font-bold">
                    Inactive
                  </span>
                )}
              </div>
            </div>

            {/* Subscription and Actions */}
            <div className="space-y-2.5 relative z-10">
              {!fcmToken ? (
                <div className="bg-[#09090b] border border-border-tactical rounded-xl p-3 text-center space-y-2">
                  <p className="text-xs text-ink-muted-tactical leading-normal font-medium">
                    Subscribe to receive real-time context-aware browser push alerts when task risks exceed 80%.
                  </p>
                  
                  {permissionState === 'denied' ? (
                    <div className="bg-rose-950/20 border border-rose-500/20 p-3 rounded-lg text-left space-y-2.5">
                      <div className="flex items-center gap-1.5 text-rose-400 font-mono text-[10px] font-bold uppercase">
                        <AlertTriangle size={12} className="animate-pulse" />
                        <span>Permission Blocked By Browser</span>
                      </div>
                      <p className="text-[11px] leading-relaxed text-rose-200/90 font-sans">
                        Browser-level push notifications are currently blocked. You can still enable our sandbox-safe push notification simulator.
                      </p>
                      <button
                        type="button"
                        onClick={onEnablePush}
                        className="w-full bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs font-mono font-bold py-2 px-3 rounded uppercase cursor-pointer"
                      >
                        Use Push Simulator Fallback
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={onEnablePush}
                      className="w-full bg-accent-tactical hover:bg-[#00e196] border border-accent-tactical text-black text-xs font-mono font-bold py-2 px-3 rounded uppercase transition-all cursor-pointer"
                    >
                      <Bell size={13} className="inline mr-1" />
                      <span>Enable Push Notifications</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Token Copy Section */}
                  <div className="bg-[#09090b] border border-border-tactical p-2.5 rounded-xl flex items-center justify-between gap-2">
                    <div className="truncate flex-1">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[9px] font-mono text-ink-muted-tactical block font-bold">FCM REGISTRATION TOKEN</span>
                        {fcmToken && fcmToken.includes('simulated') && (
                          <span className="text-[8px] font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.2 rounded font-bold uppercase animate-pulse">
                            SIMULATOR FALLBACK
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-mono text-accent-tactical truncate block">{fcmToken}</span>
                    </div>
                    <button
                      onClick={handleCopyToken}
                      className="text-[10px] font-mono bg-transparent hover:bg-accent-tactical/10 border border-accent-tactical text-accent-tactical px-2.5 py-1 rounded font-bold cursor-pointer uppercase"
                    >
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>

                  {fcmToken && fcmToken.includes('simulated') && (
                    <div className="bg-amber-950/10 border border-amber-500/10 p-2.5 rounded-xl text-[10.5px] leading-relaxed text-amber-300 font-sans">
                      <span className="font-mono font-bold uppercase text-[9px] block mb-0.5">💡 Simulator Fallback Enabled</span>
                      Browser-level push alerts are locked inside iframes. The in-app push simulator has been activated. Press the button below to test a live 80%+ risk notification!
                    </div>
                  )}

                  {/* Test Send Trigger */}
                  <div className="flex gap-2">
                    <button
                      onClick={onTestPush}
                      className="flex-1 bg-transparent hover:bg-accent-tactical/10 text-accent-tactical text-[11px] font-mono font-bold py-2 px-3 rounded border border-accent-tactical flex items-center justify-center gap-1.5 transition-all cursor-pointer uppercase"
                    >
                      <Send size={11} />
                      <span>Trigger 80%+ FCM Alert</span>
                    </button>
                    {triggeredAlerts.length > 0 && (
                      <button
                        onClick={onClearAlerts}
                        className="bg-transparent hover:bg-rose-950/20 border border-rose-500/30 text-rose-500 p-2 rounded transition-all cursor-pointer"
                        title="Clear Alert Feed"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Alerts Feed */}
            <div className="space-y-2 relative z-10">
              <div className="flex items-center justify-between text-[11px] font-bold text-ink-muted-tactical px-0.5">
                <span>Recent Risk Alerts ({triggeredAlerts.length})</span>
                {triggeredAlerts.length > 0 && (
                  <span className="text-[9px] text-accent-tactical font-mono animate-pulse font-bold uppercase">RADAR DETECTED</span>
                )}
              </div>

              {triggeredAlerts.length === 0 ? (
                <div className="border border-dashed border-border-tactical bg-[#09090b] rounded-xl p-4 text-center">
                  <p className="text-[11px] text-ink-muted-tactical font-semibold">No high-risk push notifications received yet.</p>
                  <p className="text-[9px] text-ink-muted-tactical mt-1 font-mono">Audit task risks to trigger alerts when they exceed 80%.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-0.5 custom-scrollbar">
                  {triggeredAlerts.map(alert => (
                    <div
                      key={alert.id}
                      onClick={() => setSelectedAlert(alert)}
                      className="bg-[#09090b] hover:bg-accent-tactical/5 border border-border-tactical hover:border-rose-500 rounded-xl p-3 cursor-pointer transition-all space-y-1.5 relative overflow-hidden group"
                    >
                      <div className="absolute top-0 right-0 w-12 h-12 bg-rose-500/5 rounded-full blur-md" />
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-ink-muted-tactical font-bold">
                          {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </span>
                        <span className="text-[9px] font-mono font-bold text-rose-400 bg-rose-950/40 border border-rose-800/40 px-1.5 py-0.5 rounded">
                          {alert.riskScore}% RISK
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-ink-tactical group-hover:text-accent-tactical transition-colors truncate">
                        {alert.taskTitle}
                      </h4>
                      <p className="text-[10px] text-ink-muted-tactical line-clamp-2 leading-relaxed font-sans font-medium">
                        {alert.explanation}
                      </p>
                      <div className="flex justify-end text-[9px] text-accent-tactical font-mono gap-0.5 pt-1 border-t border-border-tactical font-bold">
                        <span>View Context Action Plan</span>
                        <ArrowRight size={8} className="mt-0.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {/* Risk Alerts Panel (Uncompleted high-risk tasks list) */}
          <div className="bg-[#111113] border border-border-tactical rounded-[24px] p-5 shadow-sm relative overflow-hidden text-ink-tactical">
            {/* Hatch pattern layer */}
            <div className="absolute inset-0 hatch-pattern opacity-10 pointer-events-none" />
            
            <div className="flex items-center justify-between mb-4 border-b border-border-tactical pb-2 relative z-10">
              <div className="flex items-center gap-2">
                <AlertTriangle size={16} className="text-rose-500" />
                <h3 className="font-display font-bold text-ink-tactical text-sm uppercase">Critical Failure Warnings</h3>
              </div>
              <span className="text-[10px] text-rose-500 font-mono font-bold">RISK SCORE &gt; 60%</span>
            </div>

            {riskTasks.length === 0 ? (
              <div className="border border-border-tactical bg-[#09090b] rounded-[16px] p-6 text-center relative z-10">
                <span className="text-[28px] block mb-1">🛡️</span>
                <p className="text-xs text-ink-tactical font-bold uppercase">Timeline Protected</p>
                <p className="text-[10px] text-ink-muted-tactical mt-0.5 font-medium">No tasks have sidetracked critical risk limits.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto relative z-10">
                {riskTasks.map(t => (
                  <div
                    key={t.id}
                    onClick={() => onSelectTask(t)}
                    className="bg-[#09090b] hover:bg-accent-tactical/5 border border-border-tactical p-2.5 rounded-lg cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="truncate flex-1 pr-3">
                      <h4 className="text-xs font-bold text-ink-tactical truncate">{t.title}</h4>
                      <span className="text-[9px] font-mono text-ink-muted-tactical font-bold">
                        Due: {new Date(t.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-mono font-bold text-rose-400 bg-rose-950/40 border border-rose-800/40 px-2 py-0.5 rounded">
                        {t.riskScore}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* DYNAMIC REPLAN REASON MODAL */}
      <AnimatePresence>
        {showReplanModal && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111113] border border-border-tactical rounded-[24px] max-w-md w-full p-6 space-y-4 relative"
            >
              <button 
                onClick={() => setShowReplanModal(false)}
                className="absolute top-5 right-5 text-ink-muted-tactical hover:text-ink-tactical cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3 border-b border-border-tactical pb-3">
                <div className="p-2 bg-accent-tactical/10 border border-accent-tactical/20 text-accent-tactical rounded">
                  <RefreshCw size={18} className={isReplanning ? "animate-spin" : ""} />
                </div>
                <div>
                  <h3 className="font-bold text-ink-tactical text-sm uppercase font-mono">Timeline Rearrangement</h3>
                  <p className="text-[10px] text-ink-muted-tactical uppercase font-mono">AI Schedule Optimization Sequence</p>
                </div>
              </div>

              <form onSubmit={handleExecuteReplan} className="space-y-4">
                <div className="space-y-1.5 font-mono">
                  <label className="text-[10px] text-ink-muted-tactical uppercase font-bold">Reason for delay / offset parameters</label>
                  <textarea
                    required
                    placeholder="e.g. Slipped 30 mins due to urgent server incident meeting..."
                    value={replanReason}
                    onChange={(e) => setReplanReason(e.target.value)}
                    className="w-full bg-[#09090b] border border-border-tactical rounded p-3 text-xs text-ink-tactical placeholder-ink-muted-tactical focus:outline-none focus:border-accent-tactical"
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowReplanModal(false)}
                    className="bg-transparent border border-border-tactical hover:bg-white/5 text-ink-muted-tactical text-xs font-mono font-bold px-4 py-2 rounded cursor-pointer uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isReplanning}
                    className="bg-accent-tactical hover:bg-[#00e196] text-black text-xs font-mono font-bold px-5 py-2 rounded disabled:opacity-50 cursor-pointer uppercase"
                  >
                    {isReplanning ? "Recalculating..." : "Optimize Schedule"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ALERTS DETAIL MODAL */}
      <AnimatePresence>
        {selectedAlert && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111113] border border-rose-500/30 rounded-[24px] max-w-md w-full p-6 space-y-5 relative"
            >
              <button 
                onClick={() => setSelectedAlert(null)}
                className="absolute top-5 right-5 text-ink-muted-tactical hover:text-ink-tactical cursor-pointer"
              >
                <X size={16} />
              </button>
              
              <div className="flex items-center gap-3 border-b border-border-tactical pb-3">
                <div className="p-2.5 bg-rose-500/10 text-rose-400 rounded border border-rose-500/20">
                  <BellRing size={18} className="animate-bounce" />
                </div>
                <div className="flex-1 truncate">
                  <span className="text-[9px] font-mono text-rose-400 font-bold block bg-rose-500/10 w-max px-2 py-0.5 rounded border border-rose-500/20 mb-1 uppercase">
                    Context-Aware FCM Push Alert
                  </span>
                  <h3 className="font-bold text-ink-tactical text-sm uppercase truncate font-mono">{selectedAlert.taskTitle}</h3>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-[#09090b] border border-border-tactical rounded p-3.5 space-y-2">
                  <div className="flex justify-between items-center text-xs font-mono font-bold">
                    <span className="text-ink-muted-tactical uppercase">Calculated Risk Index:</span>
                    <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                      {selectedAlert.riskScore}% Critical
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted-tactical leading-relaxed font-sans mt-1">
                    {selectedAlert.explanation}
                  </p>
                </div>

                {selectedAlert.recoveryPlan && (
                  <div className="bg-[#09090b] border border-border-tactical rounded p-4 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-accent-tactical">
                      <Sparkles size={14} />
                      <span className="text-xs font-bold uppercase tracking-wider font-mono">Autonomous Mitigation Plan</span>
                    </div>
                    <div className="text-xs text-ink-muted-tactical leading-relaxed font-mono whitespace-pre-line pl-2 border-l-2 border-accent-tactical">
                      {selectedAlert.recoveryPlan}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-border-tactical">
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="bg-transparent border border-border-tactical hover:bg-white/5 text-ink-tactical text-xs font-mono font-bold px-5 py-2.5 rounded cursor-pointer uppercase"
                >
                  Dismiss Alert
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
