import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, Sparkles, Plus, AlertTriangle, Clock, CheckCircle2, Circle, 
  ChevronRight, ChevronLeft, ListTodo, Trash2, SlidersHorizontal, 
  FolderMinus, Check, Wand2, RefreshCw, Calendar, Columns, ArrowRight,
  Eye, CheckCircle, Flame, AlertCircle, Sparkle
} from 'lucide-react';
import { type Task, type Subtask, type PriorityLevel, type TaskStatus } from '../types';

interface TaskListProps {
  tasks: Task[];
  subtasks: Subtask[];
  onAddTask: (taskData: {
    title: string;
    description: string;
    dueDate: string;
    estimatedMinutes: number;
    priority: PriorityLevel;
  }) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onAddSubtask: (taskId: string, title: string) => void;
  onToggleSubtask: (subtaskId: string, currentVal: boolean) => void;
  onDecomposeGoal: (taskId: string, title: string, description: string) => Promise<void>;
  selectedTaskFromDashboard: Task | null;
  clearSelectedTaskFromDashboard: () => void;
}

type ViewMode = 'list' | 'kanban' | 'calendar';

export default function TaskList({
  tasks,
  subtasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAddSubtask,
  onToggleSubtask,
  onDecomposeGoal,
  selectedTaskFromDashboard,
  clearSelectedTaskFromDashboard
}: TaskListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [activeTab, setActiveTab] = useState<TaskStatus | 'all'>('all');
  const [activePriority, setActivePriority] = useState<PriorityLevel | 'all'>('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  // Add task form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newEst, setNewEst] = useState(60);
  const [newPriority, setNewPriority] = useState<PriorityLevel>('medium');

  // Subtask inputs
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isDecomposing, setIsDecomposing] = useState(false);

  // Calendar states
  const [currentDate, setCurrentDate] = useState(new Date(2026, 5, 23)); // Match metadata June 2026

  // Sync selection from Dashboard
  useEffect(() => {
    if (selectedTaskFromDashboard) {
      setSelectedTask(selectedTaskFromDashboard);
      clearSelectedTaskFromDashboard();
    }
  }, [selectedTaskFromDashboard]);

  // Filter tasks for List view
  const filteredTasks = tasks.filter(t => {
    const tabMatch = activeTab === 'all' || t.status === activeTab;
    const priorityMatch = activePriority === 'all' || t.priority === activePriority;
    return tabMatch && priorityMatch;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDueDate) return;
    onAddTask({
      title: newTitle,
      description: newDesc,
      dueDate: new Date(newDueDate).toISOString(),
      estimatedMinutes: Number(newEst),
      priority: newPriority
    });

    // Reset Form
    setNewTitle('');
    setNewDesc('');
    setNewDueDate('');
    setNewEst(60);
    setNewPriority('medium');
    setShowAddForm(false);
  };

  const handleDecompose = async () => {
    if (!selectedTask) return;
    setIsDecomposing(true);
    try {
      await onDecomposeGoal(selectedTask.id, selectedTask.title, selectedTask.description);
    } catch (err) {
      console.error(err);
    } finally {
      setIsDecomposing(false);
    }
  };

  const handleAddSub = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newSubtaskTitle) return;
    onAddSubtask(selectedTask.id, newSubtaskTitle);
    setNewSubtaskTitle('');
  };

  // Get active subtasks for the selected task
  const currentSubtasks = selectedTask 
    ? subtasks.filter(sub => sub.taskId === selectedTask.id)
    : [];

  // Drag and drop handlers for Kanban View
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) {
      onUpdateTask(taskId, { status: targetStatus });
    }
  };

  // Move task status via click arrows (for mobile & touch)
  const shiftTaskStatus = (task: Task, direction: 'forward' | 'backward') => {
    const statuses: TaskStatus[] = ['pending', 'in_progress', 'completed', 'overdue'];
    const currentIndex = statuses.indexOf(task.status);
    let targetIndex = currentIndex;
    
    if (direction === 'forward' && currentIndex < statuses.length - 1) {
      targetIndex += 1;
    } else if (direction === 'backward' && currentIndex > 0) {
      targetIndex -= 1;
    }
    
    if (targetIndex !== currentIndex) {
      onUpdateTask(task.id, { status: statuses[targetIndex] });
    }
  };

  // Calendar Day Generator
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const numDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    // Padding preceding days
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Days in current month
    for (let i = 1; i <= numDays; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const changeMonth = (direction: 'next' | 'prev') => {
    const newMonth = currentDate.getMonth() + (direction === 'next' ? 1 : -1);
    setCurrentDate(new Date(currentDate.getFullYear(), newMonth, 1));
  };

  const calendarDays = getDaysInMonth(currentDate);

  const getPriorityColor = (p: PriorityLevel) => {
    switch (p) {
      case 'critical': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'high': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'medium': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-slate-800 text-slate-400 border-slate-700/50';
    }
  };

  return (
    <div id="tasklist-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start text-ink-tactical">
      
      {/* COLUMN LEFT: Task Board List (7 columns) */}
      <div className="lg:col-span-7 space-y-4">
        
        {/* Task header and filter panel */}
        <div className="bg-[#111113] border border-border-tactical rounded-[24px] p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border-tactical">
            <div className="flex items-center gap-2.5">
              <ListTodo size={18} className="text-accent-tactical animate-pulse" />
              <h2 className="font-semibold text-ink-tactical text-sm uppercase">Commitments Directory</h2>
            </div>
            
            <div className="flex items-center gap-2">
              {/* View mode buttons */}
              <div className="flex items-center gap-1 bg-[#09090b] border border-border-tactical p-1 rounded-lg">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`p-1.5 rounded transition-all cursor-pointer ${viewMode === 'kanban' ? 'bg-accent-tactical/25 text-accent-tactical' : 'text-ink-muted-tactical hover:text-ink-tactical'}`}
                  title="Kanban Board View"
                >
                  <Columns size={13} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded transition-all cursor-pointer ${viewMode === 'list' ? 'bg-accent-tactical/25 text-accent-tactical' : 'text-ink-muted-tactical hover:text-ink-tactical'}`}
                  title="List View"
                >
                  <ListTodo size={13} />
                </button>
                <button
                  onClick={() => setViewMode('calendar')}
                  className={`p-1.5 rounded transition-all cursor-pointer ${viewMode === 'calendar' ? 'bg-accent-tactical/25 text-accent-tactical' : 'text-ink-muted-tactical hover:text-ink-tactical'}`}
                  title="Calendar View"
                >
                  <Calendar size={13} />
                </button>
              </div>

              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="bg-accent-tactical hover:bg-[#00e196] text-black text-xs font-mono font-bold px-3 py-2 rounded uppercase transition-all cursor-pointer"
              >
                <Plus size={13} className="inline mr-1" />
                <span>Add Goal</span>
              </button>
            </div>
          </div>

          {/* Conditional filter bars for non-kanban / list views */}
          {viewMode === 'list' && (
            <div className="space-y-2.5 pt-1">
              {/* Tab Filter buttons */}
              <div className="flex flex-wrap gap-1.5">
                {(['all', 'pending', 'in_progress', 'completed', 'overdue'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-[10px] font-mono capitalize px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      activeTab === tab 
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-950/60 text-slate-400 border border-slate-850 hover:bg-slate-800'
                    }`}
                  >
                    {tab === 'in_progress' ? 'In Progress' : tab}
                  </button>
                ))}
              </div>

              {/* Priority filter buttons */}
              <div className="flex flex-wrap gap-1.5 items-center text-xs">
                <span className="text-[10px] font-mono text-slate-500">Priority:</span>
                {(['all', 'low', 'medium', 'high', 'critical'] as const).map(pri => (
                  <button
                    key={pri}
                    onClick={() => setActivePriority(pri)}
                    className={`text-[9px] font-mono capitalize px-2 py-0.5 rounded transition-all cursor-pointer ${
                      activePriority === pri
                        ? 'bg-indigo-500 text-white font-bold'
                        : 'bg-slate-950/20 text-slate-400 hover:bg-slate-850'
                    }`}
                  >
                    {pri}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Add Goal Dialog / Inline Panel */}
        <AnimatePresence>
          {showAddForm && (
            <motion.form 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleCreateTask} 
              className="bg-[#111113] border border-border-tactical rounded-[24px] p-5 space-y-4"
            >
              <h3 className="font-bold text-xs text-ink-tactical uppercase tracking-wider font-mono">Register New Commitment</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-ink-muted-tactical">TITLE</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Hackathon Pitch Deck"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-[#09090b] border border-border-tactical rounded-lg p-2.5 text-xs text-ink-tactical focus:outline-none focus:border-accent-tactical"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-ink-muted-tactical">DUE DATE & TIME</label>
                  <input
                    type="datetime-local"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full bg-[#09090b] border border-border-tactical rounded-lg p-2.5 text-xs text-ink-tactical focus:outline-none focus:border-accent-tactical"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-ink-muted-tactical">ESTIMATED DURATION (MINUTES)</label>
                  <input
                    type="number"
                    required
                    min="5"
                    value={newEst}
                    onChange={(e) => setNewEst(Number(e.target.value))}
                    className="w-full bg-[#09090b] border border-border-tactical rounded-lg p-2.5 text-xs text-ink-tactical focus:outline-none focus:border-accent-tactical"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-ink-muted-tactical">PRIORITY LEVEL</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as PriorityLevel)}
                    className="w-full bg-[#09090b] border border-border-tactical rounded-lg p-2.5 text-xs text-ink-tactical focus:outline-none focus:border-accent-tactical"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-ink-muted-tactical">DETAILED DESCRIPTION / GOAL NOTES</label>
                <textarea
                  placeholder="Break down what needs to be delivered, any constraints..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-[#09090b] border border-border-tactical rounded-lg p-2.5 text-xs text-ink-tactical focus:outline-none focus:border-accent-tactical"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-transparent border border-border-tactical hover:bg-white/5 text-ink-muted-tactical text-xs font-bold px-4 py-2 rounded cursor-pointer uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-accent-tactical hover:bg-[#00e196] text-black text-xs font-mono font-bold px-4 py-2 rounded transition-all cursor-pointer uppercase"
                >
                  Register Goal
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* VIEW ROUTER FOR TASKS */}
        
        {/* VIEW 1: KANBAN BOARD */}
        {viewMode === 'kanban' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {(['pending', 'in_progress', 'completed', 'overdue'] as TaskStatus[]).map(status => {
              const columnTasks = tasks.filter(t => t.status === status);
              
              let colHeaderClass = 'border-t-blue-500 bg-blue-950/10 text-blue-400';
              if (status === 'in_progress') colHeaderClass = 'border-t-accent-tactical bg-accent-tactical/5 text-accent-tactical';
              if (status === 'completed') colHeaderClass = 'border-t-emerald-500 bg-emerald-950/10 text-emerald-400';
              if (status === 'overdue') colHeaderClass = 'border-t-red-500 bg-red-950/10 text-red-400';

              return (
                <div
                  key={status}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, status)}
                  className="space-y-3 min-h-[400px]"
                >
                  {/* Column Header */}
                  <div className={`border border-border-tactical border-t-2 rounded-xl p-2.5 text-center flex flex-col items-center justify-center font-mono ${colHeaderClass}`}>
                    <span className="text-[10px] font-bold tracking-wider uppercase">
                      {status === 'in_progress' ? 'In Progress' : status}
                    </span>
                    <span className="text-[9px] text-ink-muted-tactical font-bold mt-0.5">{columnTasks.length} Commitments</span>
                  </div>

                  {/* Tasks list within column */}
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-0.5 custom-scrollbar">
                    {columnTasks.length === 0 ? (
                      <div className="border border-dashed border-border-tactical rounded-xl p-6 text-center text-[10px] text-ink-muted-tactical font-mono uppercase">
                        EMPTY FIELD
                      </div>
                    ) : (
                      columnTasks.map(task => {
                        const subCount = subtasks.filter(s => s.taskId === task.id).length;
                        const complSubCount = subtasks.filter(s => s.taskId === task.id && s.isCompleted).length;
                        const progress = subCount > 0 ? (complSubCount / subCount) * 100 : 0;

                        return (
                          <motion.div
                            layoutId={`task-${task.id}`}
                            key={task.id}
                            draggable
                            onDragStart={(e: any) => handleDragStart(e, task.id)}
                            onClick={() => setSelectedTask(task)}
                            className={`bg-[#111113] hover:bg-accent-tactical/5 border border-border-tactical hover:border-accent-tactical rounded-xl p-3 cursor-pointer transition-all space-y-2.5 relative group ${
                              selectedTask?.id === task.id ? 'ring-1 ring-accent-tactical bg-[#18181b]' : ''
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <h4 className="text-[11px] font-bold text-ink-tactical leading-tight group-hover:text-accent-tactical transition-colors line-clamp-2">
                                {task.title}
                              </h4>
                              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded border ${getPriorityColor(task.priority)} shrink-0 uppercase`}>
                                {task.priority}
                              </span>
                            </div>

                            {/* Risk score line */}
                            <div className="flex justify-between items-center text-[9px] font-mono bg-[#09090b] border border-border-tactical p-1.5 rounded-lg">
                              <span className="text-ink-muted-tactical uppercase">AI FAILURE RISK</span>
                              <span className={`font-bold ${task.riskScore >= 75 ? 'text-red-400' : task.riskScore >= 45 ? 'text-amber-400' : 'text-accent-tactical'}`}>
                                {task.riskScore}%
                              </span>
                            </div>

                            {/* Subtask micro indicator */}
                            {subCount > 0 && (
                              <div className="space-y-1">
                                <div className="flex justify-between text-[8px] text-ink-muted-tactical font-mono">
                                  <span>ACTIONS</span>
                                  <span>{complSubCount}/{subCount}</span>
                                </div>
                                <div className="w-full bg-[#09090b] h-1 rounded overflow-hidden">
                                  <div className="bg-accent-tactical h-full" style={{ width: `${progress}%` }} />
                                </div>
                              </div>
                            )}

                            {/* Mobile arrow triggers */}
                            <div className="flex items-center justify-between border-t border-border-tactical pt-2 text-[9px] text-ink-muted-tactical font-mono">
                              <button
                                onClick={(e) => { e.stopPropagation(); shiftTaskStatus(task, 'backward'); }}
                                className="p-0.5 hover:text-accent-tactical transition-all cursor-pointer"
                                title="Move Left"
                              >
                                <ChevronLeft size={10} />
                              </button>
                              <span>Est: {task.estimatedMinutes}m</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); shiftTaskStatus(task, 'forward'); }}
                                className="p-0.5 hover:text-accent-tactical transition-all cursor-pointer"
                                title="Move Right"
                              >
                                <ChevronRight size={10} />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* VIEW 2: STANDARD LIST VIEW */}
        {viewMode === 'list' && (
          <div className="space-y-2.5">
            {filteredTasks.length === 0 ? (
              <div className="bg-[#111113]/30 border border-border-tactical/40 rounded-[16px] p-12 text-center flex flex-col items-center justify-center space-y-2">
                <FolderMinus size={36} className="text-ink-muted-tactical" />
                <p className="text-ink-muted-tactical text-xs">No active commitments matching the filters.</p>
              </div>
            ) : (
              filteredTasks.map(task => {
                const subCount = subtasks.filter(s => s.taskId === task.id).length;
                const complSubCount = subtasks.filter(s => s.taskId === task.id && s.isCompleted).length;
                const progressFraction = subCount > 0 ? complSubCount / subCount : 0;

                const taskRiskColor = task.riskScore >= 75 
                  ? 'border-l-rose-500 text-rose-400' 
                  : task.riskScore >= 40 
                    ? 'border-l-amber-500 text-amber-300' 
                    : 'border-l-accent-tactical text-accent-tactical';

                return (
                  <motion.div
                    key={task.id}
                    layoutId={`task-${task.id}`}
                    onClick={() => setSelectedTask(task)}
                    className={`bg-[#111113] hover:bg-accent-tactical/5 border border-border-tactical rounded-xl p-4 cursor-pointer border-l-4 ${taskRiskColor} transition-all flex justify-between items-start gap-4 ${
                      selectedTask?.id === task.id ? 'ring-1 ring-accent-tactical bg-[#18181b]' : ''
                    }`}
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-bold text-ink-tactical truncate">{task.title}</h3>
                        <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded border ${getPriorityColor(task.priority)} shrink-0`}>
                          {task.priority}
                        </span>
                        <span className="text-[8px] font-mono uppercase bg-[#09090b] border border-border-tactical px-1.5 py-0.5 rounded text-ink-muted-tactical">
                          {task.status === 'in_progress' ? 'In Progress' : task.status}
                        </span>
                      </div>
                      {task.description && (
                        <p className="text-[10px] text-ink-muted-tactical truncate">{task.description}</p>
                      )}
                      
                      {/* Progress Bar of Subtasks */}
                      <div className="flex items-center gap-2 pt-1">
                        <div className="flex-1 bg-[#09090b] h-1.5 rounded overflow-hidden">
                          <div 
                            className="bg-accent-tactical h-full" 
                            style={{ width: `${progressFraction * 100}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-mono text-ink-muted-tactical">
                          {Math.round(progressFraction * 100)}% Subtasks
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-[9px] text-ink-muted-tactical font-mono pt-1">
                        <span className="flex items-center gap-1">
                          <Clock size={10} /> Est: {task.estimatedMinutes}m
                        </span>
                        <span>
                          Due: {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Risk Badge and completion toggles */}
                    <div className="flex flex-col items-end gap-2.5 shrink-0 text-right">
                      <div className="bg-[#09090b] px-2 py-0.5 rounded border border-border-tactical">
                        <span className="text-[10px] font-mono font-bold block text-ink-tactical">{task.riskScore}%</span>
                        <span className="text-[8px] text-ink-muted-tactical font-mono uppercase">AI Risk</span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const confirmDelete = window.confirm(`Confirm deleting this goal: "${task.title}"?`);
                            if (confirmDelete) onDeleteTask(task.id);
                          }}
                          className="p-1 text-ink-muted-tactical hover:text-rose-400 transition-all rounded cursor-pointer"
                        >
                          <Trash2 size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateTask(task.id, { 
                              status: task.status === 'completed' ? 'pending' : 'completed' 
                            });
                          }}
                          className={`text-[9px] px-2.5 py-0.5 rounded border font-mono font-bold transition-all cursor-pointer uppercase ${
                            task.status === 'completed'
                              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40'
                              : 'bg-transparent text-ink-muted-tactical border-border-tactical hover:bg-white/5'
                          }`}
                        >
                          {task.status === 'completed' ? 'Completed' : 'Resolve'}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}

        {/* VIEW 3: CALENDAR VIEW */}
        {viewMode === 'calendar' && (
          <div className="bg-[#111113] border border-border-tactical rounded-[24px] p-5 space-y-4">
            {/* Calendar Month Selector */}
            <div className="flex items-center justify-between border-b border-border-tactical pb-2">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-accent-tactical" />
                <span className="text-sm font-bold text-ink-tactical font-mono uppercase">
                  {currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' })}
                </span>
              </div>
              <div className="flex gap-1 bg-[#09090b] border border-border-tactical p-1 rounded-lg">
                <button
                  onClick={() => changeMonth('prev')}
                  className="p-1 hover:bg-white/5 text-ink-muted-tactical hover:text-ink-tactical rounded transition-all cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  onClick={() => changeMonth('next')}
                  className="p-1 hover:bg-white/5 text-ink-muted-tactical hover:text-ink-tactical rounded transition-all cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>

            {/* Weekly Headers */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono text-ink-muted-tactical uppercase pb-1 border-b border-border-tactical">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1.5">
              {calendarDays.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="bg-[#09090b]/40 rounded-lg border border-transparent min-h-[50px] md:min-h-[70px]" />;

                const dayString = day.toDateString();
                const dayTasks = tasks.filter(t => {
                  const taskDate = new Date(t.dueDate);
                  return taskDate.toDateString() === dayString;
                });

                return (
                  <div
                    key={dayString}
                    onClick={() => {
                      if (dayTasks.length > 0) {
                        setSelectedTask(dayTasks[0]);
                      }
                    }}
                    className={`bg-[#09090b] border border-border-tactical rounded-xl p-1.5 min-h-[50px] md:min-h-[70px] flex flex-col justify-between hover:bg-accent-tactical/5 transition-all cursor-pointer group ${
                      dayTasks.length > 0 ? 'border-accent-tactical/30' : ''
                    }`}
                  >
                    <span className="text-[10px] font-mono text-ink-muted-tactical font-semibold group-hover:text-accent-tactical transition-colors">
                      {day.getDate()}
                    </span>

                    {dayTasks.length > 0 && (
                      <div className="space-y-0.5">
                        {dayTasks.slice(0, 2).map(dt => (
                          <div 
                            key={dt.id} 
                            className={`text-[8px] truncate px-1 rounded-sm border uppercase font-mono font-bold ${
                              dt.priority === 'critical' ? 'bg-red-950/40 text-red-400 border-red-800/40' : 'bg-accent-tactical/10 text-accent-tactical border-accent-tactical/20'
                            }`}
                          >
                            {dt.title}
                          </div>
                        ))}
                        {dayTasks.length > 2 && (
                          <div className="text-[7px] text-ink-muted-tactical font-mono font-bold text-center">
                            +{dayTasks.length - 2} MORE
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* COLUMN RIGHT: Selected Task AI Diagnosis and Goal Decomposer (5 columns) */}
      <div className="lg:col-span-5">
        {selectedTask ? (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#111113] border border-border-tactical rounded-[24px] p-5 space-y-5 sticky top-4"
          >
            
            {/* Header / Diagnosis details */}
            <div className="border-b border-border-tactical pb-3 flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2">
                <Bot size={18} className="text-accent-tactical animate-pulse" />
                <h3 className="font-bold text-ink-tactical text-sm uppercase">AI Agent Diagnosis</h3>
              </div>
              <span className={`text-[9px] font-mono font-semibold px-2.5 py-0.5 rounded border uppercase ${
                selectedTask.status === 'completed' 
                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40' 
                  : 'bg-amber-950/40 text-amber-400 border-amber-850/40'
              }`}>
                {selectedTask.status === 'in_progress' ? 'In Progress' : selectedTask.status}
              </span>
            </div>

            {/* Title & Stats */}
            <div className="space-y-1.5">
              <h4 className="text-sm font-bold text-ink-tactical">{selectedTask.title}</h4>
              <p className="text-xs text-ink-muted-tactical italic font-sans">
                "{selectedTask.description || 'No notes added for this goal.'}"
              </p>
            </div>

            {/* Risk Indicator Panel */}
            <div className="bg-[#09090b] rounded-xl p-4 border border-border-tactical space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-ink-muted-tactical uppercase">Predicted Failure Rate</span>
                <span className={`text-xs font-mono font-bold ${
                  selectedTask.riskScore >= 75 ? 'text-rose-400' : selectedTask.riskScore >= 40 ? 'text-amber-400' : 'text-accent-tactical'
                }`}>
                  {selectedTask.riskScore}% Probability
                </span>
              </div>
              <div className="bg-[#111113] h-1.5 rounded overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    selectedTask.riskScore >= 75 ? 'bg-rose-500' : selectedTask.riskScore >= 40 ? 'bg-amber-500' : 'bg-accent-tactical'
                  }`} 
                  style={{ width: `${selectedTask.riskScore}%` }}
                />
              </div>

              {selectedTask.riskExplanation ? (
                <div className="space-y-1.5 pt-1.5 border-t border-border-tactical">
                  <span className="text-[9px] font-mono text-ink-muted-tactical block uppercase font-semibold">Diagnostic Explanation</span>
                  <p className="text-xs text-ink-muted-tactical leading-relaxed font-sans">{selectedTask.riskExplanation}</p>
                </div>
              ) : (
                <p className="text-xs text-ink-muted-tactical italic">No risk explanation logged. Re-analyze tasks to trigger engine diagnostics.</p>
              )}

              {selectedTask.recoveryPlan && (
                <div className="space-y-1.5 pt-2 border-t border-border-tactical">
                  <span className="text-[9px] font-mono text-ink-muted-tactical block uppercase font-semibold">Personalized Recovery Strategy</span>
                  <div className="bg-accent-tactical/5 border border-accent-tactical/20 p-2.5 rounded-lg">
                    <p className="text-xs text-accent-tactical leading-relaxed font-mono whitespace-pre-wrap">{selectedTask.recoveryPlan}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actionable Subtasks & Decomposer Agent */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-ink-muted-tactical uppercase">Actionable Subtasks</span>
                <button
                  onClick={handleDecompose}
                  disabled={isDecomposing}
                  className="bg-transparent hover:bg-accent-tactical/10 border border-accent-tactical/30 text-accent-tactical disabled:opacity-50 text-[10px] px-2.5 py-1 rounded flex items-center gap-1 transition-all cursor-pointer uppercase"
                >
                  {isDecomposing ? (
                    <>
                      <RefreshCw size={10} className="animate-spin" />
                      <span>Decomposing...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 size={10} className="text-accent-tactical animate-pulse" />
                      <span>Decompose with AI</span>
                    </>
                  )}
                </button>
              </div>

              {currentSubtasks.length === 0 ? (
                <div className="bg-[#09090b] border border-border-tactical rounded-xl p-4 text-center">
                  <p className="text-[11px] text-ink-muted-tactical leading-normal">
                    No actions logged. Click "Decompose with AI" or add manual steps below.
                  </p>
                </div>
              ) : (
                <div className="bg-[#09090b] border border-border-tactical rounded-xl p-3 space-y-2.5 max-h-56 overflow-y-auto custom-scrollbar">
                  {currentSubtasks.map(sub => (
                    <div
                      key={sub.id}
                      onClick={() => onToggleSubtask(sub.id, sub.isCompleted)}
                      className="flex items-start gap-2.5 cursor-pointer hover:text-accent-tactical group text-xs select-none"
                    >
                      {sub.isCompleted ? (
                        <CheckCircle2 size={14} className="text-accent-tactical shrink-0 mt-0.5" />
                      ) : (
                        <Circle size={14} className="text-ink-muted-tactical group-hover:text-accent-tactical shrink-0 mt-0.5" />
                      )}
                      <span className={`leading-tight flex-1 ${sub.isCompleted ? 'text-ink-muted-tactical line-through' : 'text-ink-tactical'}`}>
                        {sub.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Manual Subtask Addition */}
              <form onSubmit={handleAddSub} className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="ADD MANUAL ACTION..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  className="flex-1 bg-transparent border-b border-border-tactical py-1 text-xs text-accent-tactical placeholder-ink-muted-tactical focus:outline-none focus:border-accent-tactical font-mono uppercase"
                />
                <button
                  type="submit"
                  className="bg-accent-tactical hover:bg-[#00e196] text-black text-xs font-mono px-3 rounded cursor-pointer uppercase font-bold"
                >
                  Add
                </button>
              </form>
            </div>

          </motion.div>
        ) : (
          <div className="bg-[#111113] border border-border-tactical rounded-[24px] p-12 text-center h-full flex flex-col items-center justify-center space-y-3">
            <div className="p-3 bg-[#09090b] border border-border-tactical text-ink-muted-tactical rounded-xl">
              <Bot size={28} />
            </div>
            <h3 className="font-semibold text-ink-tactical text-xs font-mono uppercase tracking-wider">Diagnostic Center</h3>
            <p className="text-[10px] text-ink-muted-tactical max-w-xs leading-relaxed">
              Select any commitment from the directory to review failure predictive scores, custom recovery plans, and trigger autonomous goal decomposition.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
