import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bot, 
  Sparkles, 
  Calendar, 
  Clock, 
  Flame, 
  User, 
  LogOut, 
  ListTodo, 
  BarChart3, 
  Brain, 
  AlertTriangle,
  Activity,
  X,
  Plus,
  Cpu,
  ShieldAlert,
  Zap,
  Trophy,
  Settings,
  Menu
} from 'lucide-react';
import { auth, db, googleSignIn, logout, initAuth, getAccessToken, clearAccessToken, requestFCMToken, messaging, handleFirestoreError, OperationType } from './firebase';
import { onMessage } from 'firebase/messaging';
import { 
  collection, 
  doc, 
  query, 
  where, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { fetchGoogleCalendarEvents, createGoogleCalendarEvent } from './services/calendarService';
import { fetchGitHubProfile, fetchGitHubRepos } from './services/githubService';
import { type Task, type Subtask, type Schedule, type ProductivityLog, type AgentRecommendation, type PriorityLevel, type AgentState, type UserGamification, type TimeBlock, type GitHubProfile, type GitHubRepo } from './types';


// Import our beautiful sub-components
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import Analytics from './components/Analytics';
import AICoach from './components/AICoach';
import RightAIPanel from './components/RightAIPanel';
import AIMissionCenter from './components/AIMissionCenter';
import CalendarView from './components/CalendarView';
import RiskCenter from './components/RiskCenter';
import FocusMode from './components/FocusMode';
import Achievements from './components/Achievements';
import SettingsView from './components/SettingsView';

// Default Sample Data (Gold standard fallback to provide a pristine immediate preview experience)
const initialSampleTasks: Task[] = [
  {
    id: 'sample-task-1',
    userId: 'guest',
    title: 'Complete Final Physics Term Assignment',
    description: 'Requires full research, writing, and calculations. Submit in PDF.',
    dueDate: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(), // due in 20 hours
    estimatedMinutes: 300, // 5 hours
    actualMinutesSpent: 0,
    priority: 'critical',
    status: 'pending',
    riskScore: 92,
    riskExplanation: 'Estimated work required is 5 hours, but you only have 2 hours of available free time scheduled before tomorrow’s deadline. High threat of missed deadline.',
    recoveryPlan: 'Step 1: Initiate 90-minute Deep Focus block immediately.\nStep 2: Delegate/postpone other lower priority reading.\nStep 3: Submit draft by 22:00 to guarantee submission.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sample-task-2',
    userId: 'guest',
    title: 'Polish Pitch Deck for Hackathon Project',
    description: 'Structure slides, design visuals, and script the pitch notes.',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // due in 2 days
    estimatedMinutes: 120,
    actualMinutesSpent: 45,
    priority: 'high',
    status: 'in_progress',
    riskScore: 35,
    riskExplanation: 'Ample time remains, but focus distribution is scattered. Risk remains low if daily schedule blocks are respected.',
    recoveryPlan: 'Step 1: Dedicate 60 minutes tonight to slide structure.\nStep 2: Complete graphics during tomorrow morning’s peak energy hours (09:00 - 10:30).',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'sample-task-3',
    userId: 'guest',
    title: 'Conduct Competitor UI/UX Audit',
    description: 'Review three similar productivity apps and summarize core differentiating visual elements.',
    dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedMinutes: 90,
    actualMinutesSpent: 90,
    priority: 'medium',
    status: 'completed',
    riskScore: 0,
    riskExplanation: 'Completed on-time. No deadline risk present.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const initialSampleSubtasks: Subtask[] = [
  {
    id: 'sample-sub-1',
    taskId: 'sample-task-1',
    userId: 'guest',
    title: 'Research physics references & formulate outlines',
    isCompleted: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample-sub-2',
    taskId: 'sample-task-1',
    userId: 'guest',
    title: 'Solve three core mathematical exercises',
    isCompleted: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample-sub-3',
    taskId: 'sample-task-2',
    userId: 'guest',
    title: 'Outline the slide deck flow',
    isCompleted: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample-sub-4',
    taskId: 'sample-task-2',
    userId: 'guest',
    title: 'Write copy and taglines for all slides',
    isCompleted: false,
    createdAt: new Date().toISOString()
  }
];

const initialSampleSchedule: Schedule = {
  id: 'sample-schedule-today',
  userId: 'guest',
  date: new Date().toISOString().split('T')[0],
  timeBlocks: [
    {
      id: 'block-1',
      title: '🚨 CRITICAL INTERVENTION: Physics Deep Work',
      startTime: '08:30',
      endTime: '11:00',
      taskId: 'sample-task-1',
      type: 'focus'
    },
    {
      id: 'block-2',
      title: 'Cognitive Recovery / Coffee Rest Break',
      startTime: '11:00',
      endTime: '11:30',
      type: 'break'
    },
    {
      id: 'block-3',
      title: 'Daily Hackathon Sync Up',
      startTime: '12:00',
      endTime: '12:30',
      type: 'calendar'
    },
    {
      id: 'block-4',
      title: 'Tactical Execution: Pitch Deck Polish',
      startTime: '14:00',
      endTime: '16:00',
      taskId: 'sample-task-2',
      type: 'task'
    }
  ],
  createdAt: new Date().toISOString()
};

const initialSampleLogs: ProductivityLog[] = [
  {
    id: 'sample-log-1',
    userId: 'guest',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    focusMinutes: 120,
    completedTasks: 1,
    missedDeadlines: 0,
    score: 80,
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample-log-2',
    userId: 'guest',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    focusMinutes: 180,
    completedTasks: 2,
    missedDeadlines: 0,
    score: 95,
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample-log-3',
    userId: 'guest',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    focusMinutes: 90,
    completedTasks: 1,
    missedDeadlines: 1,
    score: 65,
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample-log-4',
    userId: 'guest',
    date: new Date().toISOString().split('T')[0],
    focusMinutes: 145,
    completedTasks: 1,
    missedDeadlines: 0,
    score: 85,
    createdAt: new Date().toISOString()
  }
];

const initialSampleRecommendations: AgentRecommendation[] = [
  {
    id: 'sample-rec-1',
    userId: 'guest',
    type: 'risk_mitigation',
    message: '**Urgent Deadline Risk Detected**: "Physics Assignment" due in 20 hours has a failure risk of **92%** because your estimated work is 5 hours, while you only have 2 hours of free time. Start the recommended **Deep Focus block** by 08:30 to mitigate failure risk.',
    isRead: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample-rec-2',
    userId: 'habit_improvement',
    type: 'habit_improvement',
    message: '**Peak Cognitive Energy Window**: Your history shows a **15% higher completion rate** and deeper focus retention when working between **09:00 and 11:30**. I suggest scheduling critical mathematics or research tasks in this energy block.',
    isRead: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'sample-rec-3',
    userId: 'schedule_adjustment',
    type: 'schedule_adjustment',
    message: '**Rest Balance Adjusted**: I have automatically injected a **30-minute Rest Break** at 11:00. Your logs show focusing for more than 150 minutes straight reduces subsequent block efficiency by **28%**.',
    isRead: false,
    createdAt: new Date().toISOString()
  }
];

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'tasks' | 'mission' | 'calendar' | 'risk' | 'analytics' | 'coach' | 'focus' | 'achievements' | 'settings'
  >('dashboard');
  
  // Real-time Database state
  const [tasks, setTasks] = useState<Task[]>(initialSampleTasks);
  const [subtasks, setSubtasks] = useState<Subtask[]>(initialSampleSubtasks);
  const [schedule, setSchedule] = useState<Schedule | null>(initialSampleSchedule);
  const [logs, setLogs] = useState<ProductivityLog[]>(initialSampleLogs);
  const [recommendations, setRecommendations] = useState<AgentRecommendation[]>(initialSampleRecommendations);

  // Multi-Agent states
  const [agentStates, setAgentStates] = useState<AgentState[]>([
    { id: 'planner', name: 'Planner Agent', role: 'Daily Scheduling Core', status: 'idle', lastAction: 'Compiled optimal daily focus blocks.', model: 'gemini-3.5-flash' },
    { id: 'risk', name: 'Risk Agent', role: 'Failure Interception Core', status: 'idle', lastAction: 'Completed risk audit. Calculated dynamic risks.', model: 'gemini-3.5-flash' },
    { id: 'coach', name: 'Coach Agent', role: 'Adaptive Profiling Core', status: 'idle', lastAction: 'Coaching recommendations generated.', model: 'gemini-3.5-flash' },
    { id: 'recovery', name: 'Recovery Agent', role: 'Milestone Recovery Core', status: 'idle', lastAction: 'All deadlines stress-tested. Risk margins safe.', model: 'gemini-3.5-flash' }
  ]);

  // Gamification & Streaks
  const [gamification, setGamification] = useState<UserGamification>({
    xp: 450,
    level: 4,
    nextLevelXp: 1000,
    currentStreak: 4,
    bestStreak: 12,
    badges: [
      { id: 'b1', name: 'Deadline Crusher', description: 'Complete a critical-priority task on-time.', xpValue: 150, icon: '🚀', unlocked: true, unlockedAt: '2026-06-22' },
      { id: 'b2', name: 'Focus Master', description: 'Log more than 3 focus blocks in 1 day.', xpValue: 200, icon: '🔥', unlocked: true, unlockedAt: '2026-06-23' },
      { id: 'b3', name: 'Consistency Champion', description: 'Maintain a 5-day streak of target hours.', xpValue: 250, icon: '🏆', unlocked: false },
      { id: 'b4', name: 'Productivity Hero', description: 'Decompose 3 complex goals into subtasks.', xpValue: 300, icon: '🛡️', unlocked: false }
    ]
  });

  // Daily focus minute targets
  const [dailyGoalMins, setDailyGoalMins] = useState(120);

  // GitHub Integration State
  const [gitHubProfile, setGitHubProfile] = useState<GitHubProfile | null>(null);
  const [gitHubRepos, setGitHubRepos] = useState<GitHubRepo[]>([]);

  // Google Calendar events state
  const [calEvents, setCalEvents] = useState<any[]>([]);
  const [isCalConnected, setIsCalConnected] = useState(false);

  // App system notification log
  const [systemLogs, setSystemLogs] = useState<Array<{ id: string; message: string; type: 'success' | 'info' | 'warning' }>>([]);
  const [selectedTaskForDetails, setSelectedTaskForDetails] = useState<Task | null>(null);

  // FCM & Push Notifications state
  const [triggeredAlerts, setTriggeredAlerts] = useState<Array<{
    id: string;
    taskTitle: string;
    riskScore: number;
    explanation: string;
    recoveryPlan: string;
    timestamp: string;
    isRead: boolean;
  }>>([]);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isPushSimulated, setIsPushSimulated] = useState(false);
  const [activeSimulationAlert, setActiveSimulationAlert] = useState<{
    id: string;
    title: string;
    body: string;
    riskScore: number;
    explanation: string;
    recoveryPlan: string;
  } | null>(null);

  // Auth Initialization
  useEffect(() => {
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        if (token) {
          setGoogleToken(token);
          setIsCalConnected(true);
          addSystemLog('Connected to Google Calendar API successfully!', 'success');
        }
      },
      () => {
        setUser(null);
        setGoogleToken(null);
        setIsCalConnected(false);
      }
    );

    // Load google calendar token from storage if exists
    const storedToken = getAccessToken();
    if (storedToken) {
      setGoogleToken(storedToken);
      setIsCalConnected(true);
    }

    return () => unsubscribe();
  }, []);

  // Register FCM Service Worker and check active permissions
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/firebase-messaging-sw.js')
        .then((registration) => {
          console.log('[FCM App] Service Worker registered with scope:', registration.scope);
          // If permission is already granted, fetch token silently
          if ('Notification' in window && Notification.permission === 'granted') {
            requestFCMToken(user ? user.uid : 'guest')
              .then(token => {
                if (token) {
                  setFcmToken(token);
                  addSystemLog('FCM Push Notification subscription loaded.', 'success');
                }
              })
              .catch(err => console.error('[FCM App] Token restore error:', err));
          }
        })
        .catch((err) => {
          console.error('[FCM App] Service Worker registration failed:', err);
        });
    }
  }, [user]);

  // Listen for FCM foreground messages
  useEffect(() => {
    if (messaging) {
      try {
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log('[FCM App] Foreground message received:', payload);
          addSystemLog(`🔔 FCM: ${payload.notification?.title || 'Risk Alert'} - ${payload.notification?.body}`, 'info');
          
          // Also parse custom data payload and add to in-app alerts list
          setTriggeredAlerts(prev => [
            {
              id: Math.random().toString(),
              taskTitle: payload.data?.taskTitle || payload.notification?.title || 'Task Risk Alert',
              riskScore: parseInt(payload.data?.riskScore || '85'),
              explanation: payload.data?.explanation || payload.notification?.body || '',
              recoveryPlan: payload.data?.recoveryPlan || '',
              timestamp: new Date().toISOString(),
              isRead: false
            },
            ...prev
          ]);
        });
        return () => unsubscribe();
      } catch (err) {
        console.error('[FCM App] Error setting up foreground message listener:', err);
      }
    }
  }, [messaging]);

  // Sync real-time Firestore listeners when user signs in
  useEffect(() => {
    if (!user) {
      // Revert to sample fallbacks if guest/signed out
      setTasks(initialSampleTasks);
      setSubtasks(initialSampleSubtasks);
      setSchedule(initialSampleSchedule);
      setLogs(initialSampleLogs);
      setRecommendations(initialSampleRecommendations);
      return;
    }

    addSystemLog(`Logged in securely as ${user.displayName || user.email}`, 'success');

    // Subscribe to collections
    const qTasks = query(collection(db, 'tasks'), where('userId', '==', user.uid));
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      const taskList: Task[] = [];
      snapshot.forEach(doc => {
        taskList.push({ id: doc.id, ...doc.data() } as Task);
      });
      // If user has zero tasks, seed them with samples or empty list
      if (taskList.length > 0) {
        setTasks(taskList);
      } else {
        // Seed database with samples for beautiful initial user start
        seedInitialUserFirestoreData(user.uid);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'tasks');
    });

    const qSubs = query(collection(db, 'subtasks'), where('userId', '==', user.uid));
    const unsubSubs = onSnapshot(qSubs, (snapshot) => {
      const subList: Subtask[] = [];
      snapshot.forEach(doc => {
        subList.push({ id: doc.id, ...doc.data() } as Subtask);
      });
      setSubtasks(subList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'subtasks');
    });

    const currentDateStr = new Date().toISOString().split('T')[0];
    const qSchedule = query(collection(db, 'schedules'), where('userId', '==', user.uid), where('date', '==', currentDateStr));
    const unsubSchedule = onSnapshot(qSchedule, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        setSchedule({ id: docSnap.id, ...docSnap.data() } as Schedule);
      } else {
        setSchedule(null);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'schedules');
    });

    const qLogs = query(collection(db, 'productivity_logs'), where('userId', '==', user.uid));
    const unsubLogs = onSnapshot(qLogs, (snapshot) => {
      const logList: ProductivityLog[] = [];
      snapshot.forEach(doc => {
        logList.push({ id: doc.id, ...doc.data() } as ProductivityLog);
      });
      if (logList.length > 0) {
        setLogs(logList.sort((a, b) => a.date.localeCompare(b.date)));
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'productivity_logs');
    });

    const qRecs = query(collection(db, 'agent_recommendations'), where('userId', '==', user.uid));
    const unsubRecs = onSnapshot(qRecs, (snapshot) => {
      const recList: AgentRecommendation[] = [];
      snapshot.forEach(doc => {
        recList.push({ id: doc.id, ...doc.data() } as AgentRecommendation);
      });
      setRecommendations(recList);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'agent_recommendations');
    });

    return () => {
      unsubTasks();
      unsubSubs();
      unsubSchedule();
      unsubLogs();
      unsubRecs();
    };
  }, [user]);

  // Load Google Calendar Events
  useEffect(() => {
    if (googleToken) {
      const dateStr = new Date().toISOString().split('T')[0];
      fetchGoogleCalendarEvents(googleToken, dateStr)
        .then(events => {
          setCalEvents(events);
        })
        .catch(err => {
          console.warn('[Calendar] Fetch error caught in UI:', err);
          const errMsg = err?.message || '';
          if (errMsg.includes('401') || errMsg.toLowerCase().includes('unauthorized') || errMsg.toLowerCase().includes('failed: 401')) {
            clearAccessToken();
            setGoogleToken(null);
            setIsCalConnected(false);
            addSystemLog('Google Calendar session has expired. Please reconnect in System Settings.', 'warning');
          }
        });
    }
  }, [googleToken]);

  // Trigger Gemini Analysis to predict deadline risk scores on task changes
  useEffect(() => {
    const uncompletedTasks = tasks.filter(t => t.status !== 'completed');
    if (uncompletedTasks.length > 0) {
      // Auto-trigger a quiet background audit of risk scores
      const timeout = setTimeout(() => {
        triggerAutonomousRiskAudit(tasks);
      }, 3000); // Debounce trigger
      return () => clearTimeout(timeout);
    }
  }, [tasks.length]);

  // Helper: Seed sample data into signed-in user's firestore
  const seedInitialUserFirestoreData = async (uid: string) => {
    try {
      addSystemLog('Seeding beautiful initial productivity data onto your Cloud Firestore...', 'info');
      
      // Save Tasks
      for (const t of initialSampleTasks) {
        const taskRef = doc(collection(db, 'tasks'), t.id);
        await setDoc(taskRef, { ...t, userId: uid });
      }

      // Save Subtasks
      for (const s of initialSampleSubtasks) {
        const subRef = doc(collection(db, 'subtasks'), s.id);
        await setDoc(subRef, { ...s, userId: uid });
      }

      // Save Schedule
      const schedRef = doc(collection(db, 'schedules'), initialSampleSchedule.id);
      await setDoc(schedRef, { ...initialSampleSchedule, userId: uid });

      // Save Logs
      for (const l of initialSampleLogs) {
        const logRef = doc(collection(db, 'productivity_logs'), l.id);
        await setDoc(logRef, { ...l, userId: uid });
      }

      // Save Recs
      for (const r of initialSampleRecommendations) {
        const recRef = doc(collection(db, 'agent_recommendations'), r.id);
        await setDoc(recRef, { ...r, userId: uid });
      }

      // Create initial User Profile in Firestore
      await setDoc(doc(db, 'users', uid), {
        uid: uid,
        email: user?.email || '',
        displayName: user?.displayName || 'Productive Hero',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        createdAt: new Date().toISOString(),
        dailyGoalMinutes: 180,
        focusScore: 78,
        completionRate: 82
      });

      addSystemLog('Cloud Firestore initialized with standard templates!', 'success');
    } catch (err) {
      console.error('Error seeding data:', err);
    }
  };

  // Helper: System activities logbook
  const addSystemLog = useCallback((message: string, type: 'success' | 'info' | 'warning') => {
    const newLog = { id: Math.random().toString(), message, type };
    setSystemLogs(prev => [newLog, ...prev].slice(0, 5));
  }, []);

  // Auto-dismiss active simulation alerts after exactly 5 seconds
  useEffect(() => {
    if (activeSimulationAlert) {
      const timer = setTimeout(() => {
        setActiveSimulationAlert(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [activeSimulationAlert]);

  // Auto-dismiss the oldest system log after exactly 5 seconds of visibility
  useEffect(() => {
    if (systemLogs.length > 0) {
      const timer = setTimeout(() => {
        setSystemLogs(prev => prev.slice(0, -1));
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [systemLogs]);

  // Google OAuth Log In Trigger
  const handleGoogleLogin = async () => {
    try {
      const res = await googleSignIn();
      if (res && res.accessToken) {
        setGoogleToken(res.accessToken);
        setIsCalConnected(true);
        addSystemLog('Secure OAuth connected successfully.', 'success');
      }
    } catch (error) {
      console.error(error);
      addSystemLog('OAuth sign-in cancelled or failed.', 'warning');
    }
  };

  // Sign out Trigger
  const handleGoogleLogout = async () => {
    await logout();
    setUser(null);
    setGoogleToken(null);
    setIsCalConnected(false);
    addSystemLog('Logged out from active session.', 'info');
  };

  // Task Actions
  const handleAddTask = useCallback(async (taskData: {
    title: string;
    description: string;
    dueDate: string;
    estimatedMinutes: number;
    priority: PriorityLevel;
  }) => {
    const newTask: Omit<Task, 'id'> = {
      userId: user ? user.uid : 'guest',
      title: taskData.title,
      description: taskData.description,
      dueDate: taskData.dueDate,
      estimatedMinutes: taskData.estimatedMinutes,
      actualMinutesSpent: 0,
      priority: taskData.priority,
      status: 'pending',
      riskScore: 10, // Initial safe score
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (user) {
      try {
        const docRef = await addDoc(collection(db, 'tasks'), newTask);
        addSystemLog(`Added commitment "${taskData.title}" on-cloud!`, 'success');
      } catch (err) {
        console.error(err);
      }
    } else {
      // Local fallback
      const localNew: Task = {
        id: 'local-' + Math.random().toString(),
        ...newTask
      };
      setTasks(prev => [...prev, localNew]);
      addSystemLog(`Added local commitment "${taskData.title}"!`, 'success');
    }
  }, [user, addSystemLog]);

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    if (user) {
      try {
        await updateDoc(doc(db, 'tasks', taskId), updates);
        addSystemLog('Updated task status successfully.', 'success');
      } catch (err) {
        console.error(err);
      }
    } else {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t));
      addSystemLog('Updated task status.', 'success');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'tasks', taskId));
        addSystemLog('Goal deleted from database.', 'warning');
      } catch (err) {
        console.error(err);
      }
    } else {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      addSystemLog('Goal deleted.', 'warning');
    }
  };

  // Subtask Actions
  const handleAddSubtask = async (taskId: string, title: string) => {
    const newSub: Omit<Subtask, 'id'> = {
      taskId,
      userId: user ? user.uid : 'guest',
      title,
      isCompleted: false,
      createdAt: new Date().toISOString()
    };

    if (user) {
      try {
        await addDoc(collection(db, 'subtasks'), newSub);
      } catch (err) {
        console.error(err);
      }
    } else {
      const localSub: Subtask = {
        id: 'local-sub-' + Math.random().toString(),
        ...newSub
      };
      setSubtasks(prev => [...prev, localSub]);
    }
  };

  const handleToggleSubtask = async (subtaskId: string, currentVal: boolean) => {
    if (user) {
      try {
        await updateDoc(doc(db, 'subtasks', subtaskId), { isCompleted: !currentVal });
      } catch (err) {
        console.error(err);
      }
    } else {
      setSubtasks(prev => prev.map(s => s.id === subtaskId ? { ...s, isCompleted: !currentVal } : s));
    }
  };

  // Log Focus Work Timer focus duration
  const handleLogFocusMinutes = async (minutes: number) => {
    const currentDateStr = new Date().toISOString().split('T')[0];
    
    // Check if daily log exists
    const existingLog = logs.find(l => l.date === currentDateStr);

    // Reward XP dynamically!
    handleRewardXp(minutes * 10);

    if (user) {
      try {
        if (existingLog) {
          const logRef = doc(db, 'productivity_logs', existingLog.id);
          await updateDoc(logRef, {
            focusMinutes: existingLog.focusMinutes + minutes,
            score: Math.min(existingLog.score + 10, 100)
          });
        } else {
          const newLog: Omit<ProductivityLog, 'id'> = {
            userId: user.uid,
            date: currentDateStr,
            focusMinutes: minutes,
            completedTasks: 0,
            missedDeadlines: 0,
            score: 70, // Start baseline
            createdAt: new Date().toISOString()
          };
          await addDoc(collection(db, 'productivity_logs'), newLog);
        }
      } catch (err) {
        console.error(err);
      }
    } else {
      // Local
      if (existingLog) {
        setLogs(prev => prev.map(l => l.date === currentDateStr ? {
          ...l,
          focusMinutes: l.focusMinutes + minutes,
          score: Math.min(l.score + 10, 100)
        } : l));
      } else {
        const localLog: ProductivityLog = {
          id: 'local-log-' + Math.random().toString(),
          userId: 'guest',
          date: currentDateStr,
          focusMinutes: minutes,
          completedTasks: 0,
          missedDeadlines: 0,
          score: 70,
          createdAt: new Date().toISOString()
        };
        setLogs(prev => [...prev, localLog]);
      }
    }
  };

  const handleRewardXp = (xp: number) => {
    setGamification(prev => {
      let newXp = prev.xp + xp;
      let newLevel = prev.level;
      let nextLevelXp = prev.nextLevelXp;
      
      if (newXp >= nextLevelXp) {
        newXp -= nextLevelXp;
        newLevel += 1;
        nextLevelXp = Math.round(nextLevelXp * 1.5);
        
        // Play level-up audio chime!
        try {
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const playTone = (freq: number, delay: number, duration: number) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
            gain.gain.setValueAtTime(0.08, audioCtx.currentTime + delay);
            gain.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + delay + duration);
            osc.start(audioCtx.currentTime + delay);
            osc.stop(audioCtx.currentTime + delay + duration);
          };
          playTone(523.25, 0, 0.15); // C5
          playTone(659.25, 0.1, 0.15); // E5
          playTone(783.99, 0.2, 0.15); // G5
          playTone(1046.50, 0.3, 0.35); // C6
        } catch (err) {
          console.warn('Could not play level up audio:', err);
        }

        setTimeout(() => {
          addSystemLog(`🎉 LEVEL UP! You reached Level ${newLevel}! Next rank target: ${nextLevelXp} XP.`, 'success');
        }, 500);
      }
      
      const updatedBadges = prev.badges.map(b => {
        if (b.id === 'b3' && newLevel >= 5) {
          return { ...b, unlocked: true, unlockedAt: new Date().toISOString().split('T')[0] };
        }
        return b;
      });

      return {
        ...prev,
        xp: newXp,
        level: newLevel,
        nextLevelXp,
        badges: updatedBadges
      };
    });
  };

  const handleResolveConflicts = (updatedBlocks: TimeBlock[]) => {
    setSchedule(prev => prev ? { ...prev, timeBlocks: updatedBlocks } : null);
  };

  const handleConnectGitHub = async (username: string) => {
    try {
      const profile = await fetchGitHubProfile(username);
      const repos = await fetchGitHubRepos(username);
      setGitHubProfile(profile);
      setGitHubRepos(repos);
      localStorage.setItem('github_username', username);
      addSystemLog(`Successfully connected GitHub account: @${profile.username}!`, 'success');
    } catch (err: any) {
      addSystemLog(`Failed to connect GitHub: ${err.message}`, 'warning');
      throw err;
    }
  };

  const handleDisconnectGitHub = () => {
    setGitHubProfile(null);
    setGitHubRepos([]);
    localStorage.removeItem('github_username');
    addSystemLog('Disconnected GitHub account.', 'info');
  };

  useEffect(() => {
    const savedUsername = localStorage.getItem('github_username') || 'chandra372';
    if (savedUsername) {
      fetchGitHubProfile(savedUsername)
        .then(profile => {
          setGitHubProfile(profile);
          return fetchGitHubRepos(savedUsername);
        })
        .then(repos => {
          setGitHubRepos(repos);
        })
        .catch(err => {
          console.warn('Initial GitHub auto-connection failed:', err);
        });
    }
  }, []);

  // Voice command add task integration
  const handleVoiceAddTask = useCallback((entities: { title: string; dueDate?: string; priority?: string; duration?: number }) => {
    // Parse due date
    let dueISO = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Default tomorrow
    if (entities.dueDate) {
      if (entities.dueDate.toLowerCase().includes('today')) {
        dueISO = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
      } else if (entities.dueDate.toLowerCase().includes('friday')) {
        dueISO = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
      }
    }

    handleAddTask({
      title: entities.title,
      description: 'Added autonomously via voice instruction.',
      dueDate: dueISO,
      estimatedMinutes: entities.duration || 60,
      priority: (entities.priority as PriorityLevel) || 'medium'
    });
  }, [handleAddTask]);

  // Voice command view commitments integration
  const handleViewDeadlines = useCallback(() => {
    setActiveTab('tasks');
    addSystemLog('Switched view to Commitments via Voice command.', 'info');
  }, [addSystemLog]);

  // Trigger specific, context-aware alerts based on the 'Deadline Risk Prediction Engine' when a task's risk score exceeds 80%
  const triggerFCMNotification = async (taskTitle: string, riskScore: number, explanation: string, recoveryPlan: string) => {
    // 1. Post to backend so backend logs and simulates sending to registered FCM devices
    try {
      await fetch('/api/fcm/send-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user ? user.uid : 'guest',
          taskTitle,
          riskScore,
          explanation,
          recoveryPlan
        })
      });
    } catch (e) {
      console.error('[FCM Client] Backend push trigger failed:', e);
    }

    // 2. Foreground browser push alert using HTML5 Notification API if permission is granted
    let showedOSNotification = false;
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        const registration = await navigator.serviceWorker.getRegistration('/');
        const title = `🚨 Critical Deadline Risk: ${riskScore}%`;
        const options = {
          body: `"${taskTitle}" is at high risk! ${explanation || ''}`,
          icon: '/assets/logo.png',
          tag: `task-risk-${taskTitle}`,
          requireInteraction: true,
          data: { taskTitle, riskScore, explanation, recoveryPlan }
        };
        
        if (registration) {
          registration.showNotification(title, options);
          showedOSNotification = true;
        } else {
          new Notification(title, options);
          showedOSNotification = true;
        }
      } catch (err) {
        console.error('[FCM Client] Failed to show browser notification:', err);
      }
    }

    // 3. Fallback to beautiful sandboxed-safe notification simulator if OS notification wasn't displayed
    if (!showedOSNotification) {
      setActiveSimulationAlert({
        id: Math.random().toString(),
        title: `🚨 Critical Deadline Risk: ${riskScore}%`,
        body: `"${taskTitle}" is at high risk! ${explanation || ''}`,
        riskScore,
        explanation,
        recoveryPlan
      });

      // Play a lovely high-tech sound using Web Audio API!
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const playTone = (freq: number, delay: number, duration: number) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
          gain.gain.setValueAtTime(0.08, audioCtx.currentTime + delay);
          gain.gain.exponentialRampToValueAtTime(0.005, audioCtx.currentTime + delay + duration);
          osc.start(audioCtx.currentTime + delay);
          osc.stop(audioCtx.currentTime + delay + duration);
        };
        playTone(587.33, 0, 0.12); // D5
        playTone(880.00, 0.08, 0.25); // A5
      } catch (err) {
        console.warn('Could not play notification chime:', err);
      }
    }

    // 4. Update in-app Alerts console
    addSystemLog(`🚨 CRITICAL RISK ALERT (${riskScore}%): "${taskTitle}"`, 'warning');
    setTriggeredAlerts(prev => {
      // Avoid duplicate alert cards for the same task with identical riskScore
      if (prev.some(a => a.taskTitle === taskTitle && a.riskScore === riskScore)) return prev;
      return [
        {
          id: Math.random().toString(),
          taskTitle,
          riskScore,
          explanation,
          recoveryPlan,
          timestamp: new Date().toISOString(),
          isRead: false
        },
        ...prev
      ];
    });
  };

  // Enable Push Notification flow
  const handleEnablePush = async () => {
    try {
      addSystemLog('Requesting browser push notification permission...', 'info');
      const token = await requestFCMToken(user ? user.uid : 'guest');
      if (token) {
        setFcmToken(token);
        setIsPushSimulated(false);
        addSystemLog('Successfully registered FCM Device Push Token!', 'success');
      } else {
        // Notification permission denied or FCM not supported (likely inside sandboxed preview)
        setIsPushSimulated(true);
        setFcmToken("simulated_push_token_active");
        addSystemLog('Browser-level OS push alerts are blocked in sandboxed preview. Sandbox-safe Push Notification Simulator activated!', 'success');
      }
    } catch (e) {
      console.error(e);
      setIsPushSimulated(true);
      setFcmToken("simulated_push_token_fallback");
      addSystemLog('Activating sandbox-safe push notification simulator...', 'warning');
    }
  };

  // Trigger simulated 80%+ task risk push notification
  const handleTestPush = async () => {
    try {
      addSystemLog('Triggering simulated 80%+ task risk FCM Push alert...', 'info');
      
      const randomRisk = Math.floor(Math.random() * 16) + 81; // 81 to 96
      const mockTaskTitle = "Launch Product Pitch Presentation";
      const mockExplanation = "We detected 2 scheduling conflicts and 0 hours allocated for slides design. The deadline is tomorrow at 09:00.";
      const mockPlan = "Step 1: Cancel non-essential calendar tasks.\nStep 2: Start slide outline using the Autonomous Optimizer schedule.\nStep 3: Complete rehearsal before 21:00 tonight.";

      await triggerFCMNotification(mockTaskTitle, randomRisk, mockExplanation, mockPlan);
    } catch (e) {
      console.error(e);
      addSystemLog('Failed to send test push alert.', 'warning');
    }
  };

  const handleClearAlerts = () => {
    setTriggeredAlerts([]);
    addSystemLog('Cleared risk alerts history log.', 'info');
  };

  // ---------------------------------------------------------
  // CORE AGENTIC AI CAPABILITIES (SERVER PROXIED CALLS)
  // ---------------------------------------------------------

  // 1. Autonomous Task Risk Auditor (Predict probability of missing deadlines)
  const triggerAutonomousRiskAudit = async (currentTasks: Task[]) => {
    const uncompleted = currentTasks.filter(t => t.status !== 'completed');
    if (uncompleted.length === 0) return;

    try {
      addSystemLog('AI Deadline Auditor initiating task analysis...', 'info');
      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: uncompleted,
          currentDate: new Date().toISOString(),
          userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      });

      if (!res.ok) throw new Error('Analysis request failed');

      const data = await res.json();
      const updatedTasksMap = data.tasks; // [{id, riskScore, riskExplanation, recoveryPlan}]

      if (updatedTasksMap && Array.isArray(updatedTasksMap)) {
        addSystemLog('Task audit complete. Calculated risk indices written!', 'success');
        
        // Sync back
        for (const item of updatedTasksMap) {
          const matchedTask = currentTasks.find(t => t.id === item.id);
          if (matchedTask) {
            const updates = {
              riskScore: item.riskScore,
              riskExplanation: item.riskExplanation,
              recoveryPlan: item.recoveryPlan
            };
            if (user) {
              await updateDoc(doc(db, 'tasks', item.id), updates);
            } else {
              setTasks(prev => prev.map(t => t.id === item.id ? { ...t, ...updates } : t));
            }

            // Trigger FCM push alert if risk score is >= 80%
            if (item.riskScore >= 80) {
              triggerFCMNotification(matchedTask.title, item.riskScore, item.riskExplanation, item.recoveryPlan);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error in autonomous risk audit:', err);
    }
  };

  // 2. Autonomous Daily Mission Scheduler Generator
  const handleGenerateTodayPlan = useCallback(async () => {
    try {
      addSystemLog('Daily Mission Generator compiling chronological timeline...', 'info');
      const res = await fetch('/api/gemini/generate-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: tasks.filter(t => t.status !== 'completed'),
          currentDate: new Date().toISOString(),
          userAvailability: 'Standard Workhours (08:30 to 22:00)'
        })
      });

      if (!res.ok) throw new Error('Failed to generate daily schedule');

      const data = await res.json();
      const timeBlocks = data.timeBlocks;

      if (timeBlocks && Array.isArray(timeBlocks)) {
        const dateStr = new Date().toISOString().split('T')[0];
        const newSchedule: Omit<Schedule, 'id'> = {
          userId: user ? user.uid : 'guest',
          date: dateStr,
          timeBlocks: timeBlocks,
          createdAt: new Date().toISOString()
        };

        if (user) {
          // If schedule exists for today, overwrite it, else add
          const schedQuery = query(collection(db, 'schedules'), where('userId', '==', user.uid), where('date', '==', dateStr));
          const snap = await getDocs(schedQuery);
          if (!snap.empty) {
            await setDoc(doc(db, 'schedules', snap.docs[0].id), newSchedule);
          } else {
            await addDoc(collection(db, 'schedules'), newSchedule);
          }
        } else {
          setSchedule({
            id: 'local-schedule',
            ...newSchedule
          });
        }
        addSystemLog('Chronological daily timeline re-optimized successfully!', 'success');
      }
    } catch (err) {
      console.error(err);
      addSystemLog('Failure generating autonomous plan. Using safe fallback.', 'warning');
    }
  }, [tasks, user, addSystemLog]);

  // 3. Dynamic Replanning Agent (Schedule rearrangement due to missed event/delay)
  const handleDynamicReplan = useCallback(async (reason: string) => {
    try {
      addSystemLog(`Dynamic Replanning Agent responding to delay event: "${reason}"`, 'info');
      const uncompletedTasks = tasks.filter(t => t.status !== 'completed');

      const res = await fetch('/api/gemini/replan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: uncompletedTasks,
          currentSchedule: schedule,
          missedTaskId: uncompletedTasks[0]?.id || 'none',
          reason: reason,
          currentDate: new Date().toISOString()
        })
      });

      if (!res.ok) throw new Error('Replanning request failed');

      const data = await res.json();
      const newTimeBlocks = data.timeBlocks;
      const strategy = data.recoveryStrategy;

      if (newTimeBlocks && Array.isArray(newTimeBlocks)) {
        const dateStr = new Date().toISOString().split('T')[0];
        const updatedSchedule: Omit<Schedule, 'id'> = {
          userId: user ? user.uid : 'guest',
          date: dateStr,
          timeBlocks: newTimeBlocks,
          createdAt: new Date().toISOString()
        };

        if (user) {
          const schedQuery = query(collection(db, 'schedules'), where('userId', '==', user.uid), where('date', '==', dateStr));
          const snap = await getDocs(schedQuery);
          if (!snap.empty) {
            await setDoc(doc(db, 'schedules', snap.docs[0].id), updatedSchedule);
          } else {
            await addDoc(collection(db, 'schedules'), updatedSchedule);
          }
        } else {
          setSchedule({
            id: 'local-schedule-replanned',
            ...updatedSchedule
          });
        }

        // Add a beautiful in-app toast notification explaining the recovery strategy
        addSystemLog(`🔄 REPLAN ACTIVE: "${strategy}"`, 'success');
      }
    } catch (err) {
      console.error(err);
      addSystemLog('Replanning agent encountered an error. Safety buffers remained.', 'warning');
    }
  }, [tasks, schedule, user, addSystemLog]);

  // 4. Goal Decomposition Agent (Autonomously convert major goals into subtasks)
  const handleDecomposeGoal = async (taskId: string, title: string, description: string) => {
    try {
      addSystemLog(`Goal Decomposition Agent breaking down "${title}"...`, 'info');
      const res = await fetch('/api/gemini/goal-decompose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalTitle: title, goalDescription: description })
      });

      if (!res.ok) throw new Error('Goal decomposition failed');

      const data = await res.json();
      const aiSubtasks = data.subtasks; // [{title, estimatedMinutes, priority}]

      if (aiSubtasks && Array.isArray(aiSubtasks)) {
        addSystemLog(`Autonomously generated ${aiSubtasks.length} actionable subtasks for "${title}".`, 'success');
        
        // Write generated items
        for (const sub of aiSubtasks) {
          const subObj: Omit<Subtask, 'id'> = {
            taskId: taskId,
            userId: user ? user.uid : 'guest',
            title: sub.title,
            isCompleted: false,
            createdAt: new Date().toISOString()
          };

          if (user) {
            await addDoc(collection(db, 'subtasks'), subObj);
          } else {
            const localSub: Subtask = {
              id: 'local-decomposed-' + Math.random().toString(),
              ...subObj
            };
            setSubtasks(prev => [...prev, localSub]);
          }
        }
      }
    } catch (err) {
      console.error(err);
      addSystemLog('Goal Decomposition agent failed to break down.', 'warning');
    }
  };

  // 5. AI Productivity Coach Advice Generator
  const handleTriggerCoachUpdate = async () => {
    try {
      const res = await fetch('/api/gemini/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tasks: tasks,
          logs: logs
        })
      });

      if (!res.ok) throw new Error('Coaching synthesis failed');

      const data = await res.json();
      const aiRecs = data.recommendations; // [{type, message}]

      if (aiRecs && Array.isArray(aiRecs)) {
        if (user) {
          // Clear current recommendations
          const q = query(collection(db, 'agent_recommendations'), where('userId', '==', user.uid));
          const snap = await getDocs(q);
          for (const d of snap.docs) {
            await deleteDoc(doc(db, 'agent_recommendations', d.id));
          }

          // Add new ones
          for (const rec of aiRecs) {
            await addDoc(collection(db, 'agent_recommendations'), {
              userId: user.uid,
              type: rec.type,
              message: rec.message,
              isRead: false,
              createdAt: new Date().toISOString()
            });
          }
        } else {
          // Local fallback
          const localRecs: AgentRecommendation[] = aiRecs.map((r, idx) => ({
            id: 'local-rec-' + idx,
            userId: 'guest',
            type: r.type,
            message: r.message,
            isRead: false,
            createdAt: new Date().toISOString()
          }));
          setRecommendations(localRecs);
        }
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [timeStr, setTimeStr] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

  // Live clock synchronization
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeStr(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen md:h-screen md:max-h-screen bg-bg-tactical text-ink-tactical font-sans flex flex-col md:flex-row antialiased relative overflow-hidden p-3 md:p-6 gap-6 w-full">
      
      {/* 1. DESKTOP SIDEBAR NAVIGATION */}
      <aside 
        className={`hidden md:flex flex-col shrink-0 border border-border-tactical bg-[#121214] shadow-tactical-glow rounded-[24px] relative z-40 transition-all duration-300 md:h-full md:overflow-y-auto ${
          sidebarOpen ? 'w-64' : 'w-22'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-border-tactical flex items-center justify-between bg-[#121214] rounded-t-[24px]">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="p-2 bg-accent-tactical border border-accent-tactical/20 rounded-xl text-black font-bold flex items-center justify-center shrink-0 shadow-sm">
              <Bot size={18} className="animate-spin-slow text-bg-tactical" />
            </div>
            {sidebarOpen && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-col"
              >
                <span className="font-display font-bold text-ink-tactical text-sm tracking-tight flex items-center gap-1.5 leading-none">
                  DEADLINE HERO
                </span>
                <span className="text-[8px] text-accent-tactical font-mono tracking-wider mt-0.5 uppercase font-bold">AUTONOMOUS V1.5</span>
              </motion.div>
            )}
          </div>

          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-ink-muted-tactical hover:text-accent-tactical transition-all cursor-pointer p-1.5 rounded-lg hover:bg-white/5"
            title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            <Activity size={14} className={sidebarOpen ? "rotate-180" : ""} />
          </button>
        </div>

        {/* Sidebar Nav Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-thin scrollbar-thumb-slate-800">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: <Activity size={16} /> },
            { id: 'tasks', label: 'Commitments', icon: <ListTodo size={16} /> },
            { id: 'mission', label: 'Mission Control', icon: <Cpu size={16} /> },
            { id: 'calendar', label: 'Conflict Resolver', icon: <Calendar size={16} /> },
            { id: 'risk', label: 'What-If Risk Center', icon: <ShieldAlert size={16} /> },
            { id: 'analytics', label: 'Focus Space', icon: <Clock size={16} /> },
            { id: 'coach', label: 'AI Coach', icon: <Brain size={16} /> },
            { id: 'focus', label: 'AI Focus Mode', icon: <Zap size={16} /> },
            { id: 'achievements', label: 'Achievements', icon: <Trophy size={16} /> },
            { id: 'settings', label: 'System Settings', icon: <Settings size={16} /> }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                }}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all relative cursor-pointer ${
                  isActive 
                    ? 'text-accent-tactical border border-accent-tactical/30 bg-accent-tactical/5 shadow-tactical-glow' 
                    : 'text-ink-muted-tactical hover:text-accent-tactical hover:bg-white/5 border border-transparent'
                }`}
              >
                <span className="relative z-10 shrink-0">
                  {tab.icon}
                </span>
                
                {sidebarOpen && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="relative z-10 truncate font-display text-sm font-bold"
                  >
                    {tab.label}
                  </motion.span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar User Profile Desk */}
        <div className="p-4 border-t border-border-tactical">
          {user ? (
            <div className={`flex items-center bg-[#09090b] border border-border-tactical rounded-2xl p-2.5 gap-3 justify-between ${sidebarOpen ? '' : 'justify-center'}`}>
              <div className="flex items-center gap-2.5 min-w-0">
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="Profile" 
                    className="w-7 h-7 rounded-full border border-border-tactical shrink-0" 
                    referrerPolicy="no-referrer" 
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-ink-tactical border border-border-tactical text-xs font-bold shrink-0">
                    {user.email.charAt(0).toUpperCase()}
                  </div>
                )}
                {sidebarOpen && (
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-ink-tactical block truncate leading-tight">
                      {user.displayName || user.email.split('@')[0]}
                    </span>
                    <span className="text-[8px] text-accent-tactical font-mono uppercase tracking-wider block font-bold mt-0.5">Connected</span>
                  </div>
                )}
              </div>
              {sidebarOpen && (
                <button
                  onClick={handleGoogleLogout}
                  className="p-1 text-ink-muted-tactical hover:text-rose-500 rounded-lg transition-all cursor-pointer hover:bg-white/5 shrink-0"
                  title="Sign Out"
                >
                  <LogOut size={13} />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={handleGoogleLogin}
              className={`w-full text-xs font-bold bg-[#0d0d0f] text-accent-tactical border border-accent-tactical/30 rounded-xl hover:bg-accent-tactical/5 flex items-center gap-2 transition-all cursor-pointer ${
                sidebarOpen ? 'px-3 py-2 justify-start' : 'p-2 justify-center'
              }`}
              title="Connect Google Services"
            >
              <div className="w-4 h-4 shrink-0">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
              </div>
              {sidebarOpen && <span className="truncate font-display font-bold">Connect Google</span>}
            </button>
          )}
        </div>
      </aside>

      {/* MOBILE DRAWER OVERLAY */}
      <AnimatePresence>
        {sidebarMobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Sliding Drawer */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-72 max-w-[80vw] h-full bg-[#121214] border-r border-border-tactical p-5 flex flex-col justify-between z-50"
            >
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-border-tactical">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-accent-tactical border border-accent-tactical/20 rounded-xl text-black font-bold flex items-center justify-center shrink-0">
                      <Bot size={18} className="animate-spin-slow text-bg-tactical" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-display font-bold text-ink-tactical text-sm tracking-tight">
                        DEADLINE HERO
                      </span>
                      <span className="text-[8px] text-accent-tactical font-mono tracking-wider uppercase font-bold">AUTONOMOUS V1.5</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setSidebarMobileOpen(false)}
                    className="p-1.5 text-ink-muted-tactical hover:text-accent-tactical hover:bg-white/5 rounded-lg transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Nav Items */}
                <nav className="space-y-1.5 overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-none">
                  {[
                    { id: 'dashboard', label: 'Dashboard', icon: <Activity size={16} /> },
                    { id: 'tasks', label: 'Commitments', icon: <ListTodo size={16} /> },
                    { id: 'mission', label: 'Mission Control', icon: <Cpu size={16} /> },
                    { id: 'calendar', label: 'Conflict Resolver', icon: <Calendar size={16} /> },
                    { id: 'risk', label: 'What-If Risk Center', icon: <ShieldAlert size={16} /> },
                    { id: 'analytics', label: 'Focus Space', icon: <Clock size={16} /> },
                    { id: 'coach', label: 'AI Coach', icon: <Brain size={16} /> },
                    { id: 'focus', label: 'AI Focus Mode', icon: <Zap size={16} /> },
                    { id: 'achievements', label: 'Achievements', icon: <Trophy size={16} /> },
                    { id: 'settings', label: 'System Settings', icon: <Settings size={16} /> }
                  ].map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id as any);
                          setSidebarMobileOpen(false);
                        }}
                        className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer ${
                          isActive 
                            ? 'text-accent-tactical border border-accent-tactical/30 bg-accent-tactical/5 shadow-tactical-glow' 
                            : 'text-ink-muted-tactical hover:text-accent-tactical hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        {tab.icon}
                        <span className="font-display text-sm font-bold truncate">{tab.label}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Footer / User Profile */}
              <div className="pt-4 border-t border-border-tactical">
                {user ? (
                  <div className="flex items-center bg-[#09090b] border border-border-tactical rounded-2xl p-2.5 gap-3 justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {user.photoURL ? (
                        <img 
                          src={user.photoURL} 
                          alt="Profile" 
                          className="w-7 h-7 rounded-full border border-border-tactical shrink-0" 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-ink-tactical border border-border-tactical text-xs font-bold shrink-0">
                          {user.email.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-ink-tactical block truncate leading-tight">
                          {user.displayName || user.email.split('@')[0]}
                        </span>
                        <span className="text-[8px] text-accent-tactical font-mono uppercase tracking-wider block font-bold mt-0.5">Connected</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        handleGoogleLogout();
                        setSidebarMobileOpen(false);
                      }}
                      className="p-1 text-ink-muted-tactical hover:text-rose-500 rounded-lg transition-all cursor-pointer hover:bg-white/5"
                      title="Sign Out"
                    >
                      <LogOut size={13} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      handleGoogleLogin();
                      setSidebarMobileOpen(false);
                    }}
                    className="w-full text-xs font-bold bg-[#0d0d0f] text-accent-tactical border border-accent-tactical/30 rounded-xl hover:bg-accent-tactical/5 flex items-center gap-2 px-3 py-2 justify-center transition-all cursor-pointer"
                  >
                    <span>Connect Google</span>
                  </button>
                )}
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* 2. MOBILE HEADER BAR */}
      <header className="md:hidden sticky top-0 z-40 bg-[#121214] border border-border-tactical rounded-[24px] p-4 flex items-center justify-between shadow-sm mb-2 w-full">
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setSidebarMobileOpen(true)}
            className="p-1.5 bg-white/5 hover:bg-white/10 text-ink-muted-tactical hover:text-accent-tactical border border-border-tactical rounded-lg transition-all cursor-pointer"
            title="Open Menu"
          >
            <Menu size={16} />
          </button>
          <div className="p-1.5 bg-accent-tactical border border-accent-tactical/20 rounded-lg text-black font-bold flex items-center justify-center">
            <Bot size={16} className="animate-spin-slow text-bg-tactical" />
          </div>
          <div>
            <span className="font-display font-bold text-ink-tactical text-xs sm:text-sm tracking-tight flex items-center gap-1 leading-none uppercase">
              DEADLINE HERO
            </span>
          </div>
        </div>

        {/* User profile / Login fallback on mobile */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-2 bg-[#09090b] border border-border-tactical rounded-full px-2.5 py-1">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-5 h-5 rounded-full border border-border-tactical" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center text-[10px] font-bold border border-border-tactical text-ink-tactical">
                  {user.email.charAt(0).toUpperCase()}
                </div>
              )}
              <button onClick={handleGoogleLogout} className="text-ink-muted-tactical hover:text-rose-500 cursor-pointer">
                <LogOut size={11} />
              </button>
            </div>
          ) : (
            <button 
              onClick={handleGoogleLogin}
              className="text-[10px] bg-accent-tactical/5 border border-accent-tactical/30 text-accent-tactical px-2.5 py-1.5 rounded-lg font-bold hover:bg-accent-tactical/10 transition-all cursor-pointer"
            >
              Sign In
            </button>
          )}
        </div>
      </header>

      {/* 3. MAIN WORKSPACE CONTENT */}
      <div className="flex-1 flex flex-col min-w-0 md:h-full md:overflow-y-auto pr-1">
        


        {/* Workspace body */}
        <main className="flex-1 max-w-7xl w-full mx-auto space-y-6">

          {/* Router switch with animate transitions */}
          <div className="min-h-[500px] relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -15, scale: 0.98 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                {activeTab === 'dashboard' && (
                  <Dashboard
                    tasks={tasks}
                    schedule={schedule}
                    productivityLogs={logs}
                    userProfile={user ? { displayName: user.displayName, focusScore: 82, completionRate: 85 } : null}
                    googleCalendarEvents={calEvents}
                    onTriggerReplan={handleDynamicReplan}
                    onGenerateTodayPlan={handleGenerateTodayPlan}
                    onSelectTask={(task) => {
                      setSelectedTaskForDetails(task);
                      setActiveTab('tasks');
                      addSystemLog(`Loading detailed metrics for commitment: "${task.title}"`, 'info');
                    }}
                    onAddTaskClick={() => {
                      setActiveTab('tasks');
                    }}
                    onMarkTaskCompleted={(tid) => handleUpdateTask(tid, { status: 'completed' })}
                    isCalConnected={isCalConnected}
                    onCalConnect={handleGoogleLogin}
                    triggeredAlerts={triggeredAlerts}
                    fcmToken={fcmToken}
                    onEnablePush={handleEnablePush}
                    onTestPush={handleTestPush}
                    onClearAlerts={handleClearAlerts}
                  />
                )}

                {activeTab === 'tasks' && (
                  <TaskList
                    tasks={tasks}
                    subtasks={subtasks}
                    onAddTask={handleAddTask}
                    onUpdateTask={handleUpdateTask}
                    onDeleteTask={handleDeleteTask}
                    onAddSubtask={handleAddSubtask}
                    onToggleSubtask={handleToggleSubtask}
                    onDecomposeGoal={handleDecomposeGoal}
                    selectedTaskFromDashboard={selectedTaskForDetails}
                    clearSelectedTaskFromDashboard={() => setSelectedTaskForDetails(null)}
                  />
                )}

                {activeTab === 'analytics' && (
                  <Analytics
                    logs={logs}
                    onLogFocusMinutes={handleLogFocusMinutes}
                    addSystemLog={addSystemLog}
                  />
                )}

                {activeTab === 'coach' && (
                  <AICoach
                    recommendations={recommendations}
                    onTriggerCoachUpdate={handleTriggerCoachUpdate}
                    addSystemLog={addSystemLog}
                  />
                )}

                {activeTab === 'mission' && (
                  <AIMissionCenter
                    agentStates={agentStates}
                    setAgentStates={setAgentStates}
                    tasks={tasks}
                    schedule={schedule}
                    onTriggerReplan={handleDynamicReplan}
                    onTriggerCoachUpdate={handleTriggerCoachUpdate}
                    onGenerateTodayPlan={handleGenerateTodayPlan}
                    addSystemLog={addSystemLog}
                  />
                )}

                {activeTab === 'calendar' && (
                  <CalendarView
                    schedule={schedule}
                    tasks={tasks}
                    googleCalendarEvents={calEvents}
                    isCalConnected={isCalConnected}
                    onCalConnect={handleGoogleLogin}
                    onResolveConflicts={handleResolveConflicts}
                    addSystemLog={addSystemLog}
                  />
                )}

                {activeTab === 'risk' && (
                  <RiskCenter
                    tasks={tasks}
                    addSystemLog={addSystemLog}
                  />
                )}

                {activeTab === 'focus' && (
                  <FocusMode
                    tasks={tasks.filter(t => t.status !== 'completed')}
                    onAddFocusMinutes={handleLogFocusMinutes}
                    onRewardXp={handleRewardXp}
                    addSystemLog={addSystemLog}
                  />
                )}

                {activeTab === 'achievements' && (
                  <Achievements
                    gamification={gamification}
                    addSystemLog={addSystemLog}
                  />
                )}

                {activeTab === 'settings' && (
                  <SettingsView
                    dailyGoalMins={dailyGoalMins}
                    onSetDailyGoalMins={setDailyGoalMins}
                    isCalConnected={isCalConnected}
                    onCalConnect={handleGoogleLogin}
                    fcmToken={fcmToken}
                    onEnablePush={handleEnablePush}
                    addSystemLog={addSystemLog}
                    gitHubProfile={gitHubProfile}
                    gitHubRepos={gitHubRepos}
                    onConnectGitHub={handleConnectGitHub}
                    onDisconnectGitHub={handleDisconnectGitHub}
                    onAddTask={handleAddTask}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* 4. PERSISTENT FIXED RIGHT AI PANEL */}
      <div 
        className="w-full md:w-96 shrink-0 flex flex-col md:h-full md:overflow-hidden gap-6 relative z-30"
      >
        <RightAIPanel
          onAddTask={handleVoiceAddTask}
          onTriggerReplan={handleDynamicReplan}
          onGenerateTodayPlan={handleGenerateTodayPlan}
          onViewDeadlines={handleViewDeadlines}
          addSystemLog={addSystemLog}
          systemLogs={systemLogs}
          setSystemLogs={setSystemLogs}
        />
      </div>

      {/* 6. SANDBOX-SAFE IN-APP SIMULATED PUSH NOTIFICATION BANNER */}
      <AnimatePresence>
        {activeSimulationAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md bg-[#111113] border border-accent-tactical/30 rounded-[24px] p-4 z-50 shadow-tactical-glow text-ink-tactical"
          >
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-500 shrink-0 animate-pulse">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-sm font-display font-bold text-ink-tactical truncate pr-4">
                    {activeSimulationAlert.title}
                  </h4>
                  <button
                    onClick={() => setActiveSimulationAlert(null)}
                    className="text-ink-muted-tactical hover:text-ink-tactical transition-all cursor-pointer p-0.5 hover:bg-white/5 rounded-md border border-transparent hover:border-border-tactical"
                  >
                    <X size={14} />
                  </button>
                </div>
                <p className="text-xs text-ink-muted-tactical leading-relaxed font-sans mb-3 font-medium">
                  {activeSimulationAlert.body}
                </p>
                
                {/* Micro Recovery Preview */}
                <div className="bg-[#09090b] border border-border-tactical rounded-xl p-2.5 space-y-1.5 mb-3.5">
                  <span className="text-[9px] font-mono font-bold text-accent-tactical uppercase tracking-widest block">
                    AI Auto-Generated Recovery Steps:
                  </span>
                  <p className="text-[10px] font-mono text-ink-tactical whitespace-pre-line leading-relaxed font-bold">
                    {activeSimulationAlert.recoveryPlan}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveTab('tasks');
                      setActiveSimulationAlert(null);
                    }}
                    className="flex-1 bg-accent-tactical hover:bg-[#00e196] text-black text-xs font-mono font-bold py-2 px-3 rounded-lg transition-all cursor-pointer text-center uppercase"
                  >
                    View Commitment details
                  </button>
                  <button
                    onClick={() => setActiveSimulationAlert(null)}
                    className="bg-transparent hover:bg-white/5 text-ink-tactical border border-border-tactical text-xs font-mono font-bold py-2 px-3.5 rounded-lg transition-all cursor-pointer uppercase"
                  >
                    Acknowledge
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
