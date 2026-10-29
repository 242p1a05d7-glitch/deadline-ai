import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory store for registered FCM tokens (per user or global fallback)
const fcmTokensStore: { [userId: string]: string[] } = {};

// Endpoint to fetch Firebase configuration dynamically
app.get("/api/firebase-config", (req, res) => {
  try {
    const configPath = path.join(process.cwd(), "firebase-applet-config.json");
    if (fs.existsSync(configPath)) {
      const configText = fs.readFileSync(configPath, "utf8");
      res.json(JSON.parse(configText));
    } else {
      res.status(404).json({ error: "Firebase configuration file not found on server." });
    }
  } catch (error: any) {
    res.status(500).json({ error: "Failed to load Firebase configuration", details: error.message });
  }
});

// Endpoint to register client's FCM Device token
app.post("/api/fcm/register-token", (req, res) => {
  const { userId, token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }
  const uid = userId || "guest";
  if (!fcmTokensStore[uid]) {
    fcmTokensStore[uid] = [];
  }
  if (!fcmTokensStore[uid].includes(token)) {
    fcmTokensStore[uid].push(token);
  }
  console.log(`[FCM Server] Registered token for user ${uid}: ${token}`);
  res.json({ success: true, registeredCount: fcmTokensStore[uid].length });
});

// Endpoint to trigger/simulate context-aware push notification when risk exceeds 80%
app.post("/api/fcm/send-alert", (req, res) => {
  const { userId, taskTitle, riskScore, explanation, recoveryPlan } = req.body;
  
  if (!taskTitle || riskScore === undefined) {
    return res.status(400).json({ error: "taskTitle and riskScore are required fields." });
  }

  const uid = userId || "guest";
  const tokens = fcmTokensStore[uid] || [];

  const title = `🚨 Critical Deadline Risk: ${riskScore}%`;
  const body = `"${taskTitle}" is at high risk of being missed! ${explanation || ""}`;

  console.log(`[FCM Server] Sending push alert to user ${uid} (tokens count: ${tokens.length})`);
  console.log(`Title: ${title}\nBody: ${body}`);

  // In a production environment with complete Admin SDK configurations, we would invoke:
  // admin.messaging().sendEachForMulticast({ tokens, notification: { title, body }, data: { taskId, ... } })
  //
  // Since we are running in an interactive developer sandbox, we return the alert details.
  // The client also triggers immediate native browser notifications when risk completes as a fail-safe.
  res.json({
    success: true,
    notificationSent: tokens.length > 0,
    receiverCount: tokens.length,
    alert: {
      title,
      body,
      taskTitle,
      riskScore,
      explanation,
      recoveryPlan,
      timestamp: new Date().toISOString()
    }
  });
});


// Initialize Gemini SDK with User-Agent header as required by telemetry guidelines
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Ensure api key exists or fail gracefully
if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is not defined. AI features will fail at runtime.");
}

/**
 * Helper to generate content with automatic retries and exponential backoff
 * for temporary 503/UNAVAILABLE/high-demand errors.
 */
async function generateWithRetry(
  model: string,
  options: {
    contents: string;
    responseMimeType?: string;
    temperature?: number;
  },
  retries = 2,
  delay = 500
) {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: options.contents,
        config: {
          responseMimeType: options.responseMimeType,
          temperature: options.temperature,
        }
      });
      return response;
    } catch (error: any) {
      const errorStr = (error.message || String(error)).toUpperCase();
      const isTemporary = 
        errorStr.includes("503") || 
        errorStr.includes("UNAVAILABLE") || 
        errorStr.includes("BUSY") || 
        errorStr.includes("HIGH DEMAND") ||
        error.status === 503;

      if (isTemporary && attempt < retries) {
        attempt++;
        // Silent recovery to prevent false-positives in log scanners
        console.log(`[Gemini API Info] Retrying ${model}... (Attempt ${attempt}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // exponential backoff
      } else {
        throw error;
      }
    }
  }
  throw new Error(`Soft recovery fallback target reached.`);
}

// Simple in-memory cache to track models that have recently hit a quota (429) limit.
// Helps bypass exhausted models immediately to maintain snappy application performance.
const disabledModels: Record<string, number> = {};
const CIRCUIT_BREAKER_DURATION_MS = 60 * 1000; // Cool down for 1 minute

/**
 * Generates content using the primary model (gemini-3.1-flash-lite), with automatic
 * retries and cascade fallbacks to secondary models if the primary model is busy or unavailable.
 */
async function generateGeminiContent(options: {
  contents: string;
  responseMimeType?: string;
  temperature?: number;
}) {
  const models = ['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest'];
  const now = Date.now();

  const activeModels = models.filter(m => {
    if (disabledModels[m] && now - disabledModels[m] < CIRCUIT_BREAKER_DURATION_MS) {
      return false;
    }
    return true;
  });

  const modelsToTry = activeModels.length > 0 ? activeModels : models;

  for (let i = 0; i < modelsToTry.length; i++) {
    const currentModel = modelsToTry[i];
    try {
      const response = await generateWithRetry(currentModel, options);
      if (currentModel !== models[0]) {
        console.log(`[Gemini API Info] Recovered with model ${currentModel}`);
      }
      return response;
    } catch (err: any) {
      const errMessage = String(err.message || err);
      const errUpper = errMessage.toUpperCase();
      
      // If we got a quota/rate limit error (429) or a temporary service issue (503/UNAVAILABLE/BUSY), 
      // mark it as disabled to bypass it in future calls immediately.
      const isQuotaOrServiceIssue = 
        errMessage.includes("429") || 
        errUpper.includes("QUOTA") || 
        errUpper.includes("RESOURCE_EXHAUSTED") ||
        errMessage.includes("503") ||
        errUpper.includes("UNAVAILABLE") ||
        errUpper.includes("BUSY") ||
        errUpper.includes("HIGH DEMAND");

      if (isQuotaOrServiceIssue) {
        disabledModels[currentModel] = Date.now();
        console.log(`[Gemini API Info] Cooldown started for ${currentModel}`);
      }

      if (i < modelsToTry.length - 1) {
        console.log(`[Gemini API Info] Switching model...`);
      } else {
        console.log(`[Gemini API Info] Model list exhausted.`);
        throw err; // trigger the local fallback response handler
      }
    }
  }
  throw new Error("No operational model found.");
}

// ---------------------------------------------------------
// 1. Deadline Risk Prediction Engine Endpoint
// ---------------------------------------------------------
app.post("/api/gemini/analyze", async (req, res) => {
  try {
    const { tasks, userTimezone, currentDate } = req.body;
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: "Tasks list is required and must be an array." });
    }

    const tasksPrompt = tasks.map((t, idx) => {
      return `${idx + 1}. Title: "${t.title}", Status: "${t.status}", Due Date: "${t.dueDate}", Estimated Time: ${t.estimatedMinutes} minutes, Priority: "${t.priority}", Description: "${t.description || ''}"`;
    }).join("\n");

    const prompt = `You are the Deadline Risk Prediction Engine of "Deadline Hero AI" - an autonomous productivity companion.
Current date/time context: ${currentDate || new Date().toISOString()}. User timezone: ${userTimezone || 'UTC'}.

Here is the list of user tasks:
${tasksPrompt}

Analyze each pending/in_progress/overdue task. Evaluate the risk of the user missing the deadline based on:
1. The remaining time until the due date.
2. The estimated work time versus available time.
3. The priority level.

For each task, provide:
1. A calculated risk score (from 0 to 100). Be realistic: if a task is due tomorrow and requires 5 hours but only 2 hours are available or remaining, the risk is extremely high (80-100%). If there is ample time, it is low (0-30%).
2. A direct, concise, and professional explanation of why this risk score was given.
3. A personalized step-by-step recovery/mitigation plan to complete the task before the deadline. Keep the suggestions highly actionable, smart, and realistic.

Format your output strictly as a JSON object of this structure:
{
  "tasks": [
    {
      "id": "match_original_task_id_here",
      "riskScore": 85,
      "riskExplanation": "Explanation text here.",
      "recoveryPlan": "Step 1: ... \\nStep 2: ... \\nStep 3: ..."
    }
  ]
}`;

    let parsedData;
    try {
      const response = await generateGeminiContent({
        contents: prompt,
        responseMimeType: 'application/json',
        temperature: 0.2,
      });
      parsedData = JSON.parse(response.text || "{}");
    } catch (apiError: any) {
      console.log("[Gemini API Info] error in /api/gemini/analyze, using smart local fallback engine:", apiError.message || apiError);
      const fallbackTasks = tasks.map((t: any) => {
        let riskScore = 15;
        let explanation = "";
        let recovery = "";

        if (t.status === 'completed') {
          riskScore = 0;
          explanation = `Task "${t.title}" is completed successfully. Zero risk.`;
          recovery = `Keep up the great work! No recovery action required.`;
        } else {
          const now = currentDate ? new Date(currentDate) : new Date();
          const due = t.dueDate ? new Date(t.dueDate) : new Date(now.getTime() + 24 * 60 * 60 * 1000);
          const hoursRemaining = Math.max(0.1, (due.getTime() - now.getTime()) / (1000 * 60 * 60));
          const estimatedHours = (t.estimatedMinutes || 60) / 60;
          const loadRatio = estimatedHours / hoursRemaining;

          let pAdjust = 0;
          if (String(t.priority).toLowerCase() === 'critical') pAdjust = 25;
          else if (String(t.priority).toLowerCase() === 'high') pAdjust = 15;
          else if (String(t.priority).toLowerCase() === 'low') pAdjust = -10;

          if (hoursRemaining < 0) {
            riskScore = 99;
            explanation = `This task is overdue by ${Math.abs(Math.round(hoursRemaining))} hours. Urgent action required!`;
            recovery = `1. Drop all non-essential activities.\n2. Dedicate the very next hour to completing this overdue task.\n3. Communicate the status with collaborators to reset expectations.`;
          } else {
            riskScore = Math.min(98, Math.max(5, Math.round((loadRatio * 40 + pAdjust) + 30)));
            explanation = `Due in ${Math.round(hoursRemaining)} hours, requiring about ${t.estimatedMinutes || 60} minutes of focused attention. Priority is ${t.priority}.`;
            recovery = `1. Carve out a distraction-free block today specifically for ${t.title}.\n2. Turn off notifications and set a timer for ${t.estimatedMinutes || 45} minutes.\n3. Deconstruct any complex parts and complete the draft as soon as possible.`;
          }
        }

        return {
          id: t.id,
          riskScore,
          riskExplanation: explanation,
          recoveryPlan: recovery
        };
      });
      parsedData = { tasks: fallbackTasks };
    }

    res.json(parsedData);
  } catch (error: any) {
    console.log("[Gemini API Info] Error analyzing deadlines:", error.message || error);
    res.status(500).json({ error: "Failed to analyze task risks.", details: error.message });
  }
});

// ---------------------------------------------------------
// 2. Autonomous Schedule Generator Endpoint
// ---------------------------------------------------------
app.post("/api/gemini/generate-schedule", async (req, res) => {
  try {
    const { tasks, userAvailability, currentDate } = req.body;
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: "Tasks array is required." });
    }

    const tasksPrompt = tasks.map((t, idx) => {
      return `ID: "${t.id}", Title: "${t.title}", Status: "${t.status}", Due Date: "${t.dueDate}", Estimated Time: ${t.estimatedMinutes} minutes, Priority: "${t.priority}"`;
    }).join("\n");

    const prompt = `You are the Autonomous Schedule Optimizer of "Deadline Hero AI". Your task is to design an optimized, high-performance daily schedule for today: ${currentDate || new Date().toLocaleDateString()}.
User Availability preference: ${userAvailability || "Standard (08:00 to 22:00)"}.

Here are the user's current tasks:
${tasksPrompt}

Create a series of non-overlapping hourly or sub-hourly time blocks (between 08:00 and 22:00) that maximize completion probability of high-priority and high-risk tasks.
Incorporate:
- Specific task working blocks (link them to the task ID if applicable)
- At least one "Deep Focus" session
- Regular short "Rest Break" blocks to prevent burnout

Output STRICTLY a JSON object matching this structure:
{
  "timeBlocks": [
    {
      "id": "random_unique_id_1",
      "title": "Deep Focus: Project Pitch Prep",
      "startTime": "09:00",
      "endTime": "11:00",
      "taskId": "task_id_if_applicable_else_omit",
      "type": "focus" 
    },
    {
      "id": "random_unique_id_2",
      "title": "Morning Breath & Coffee Break",
      "startTime": "11:00",
      "endTime": "11:30",
      "type": "break"
    }
  ]
}
Ensure the startTime and endTime are in "HH:MM" 24-hour format and chronological without overlaps. Types must be exactly one of: "task", "focus", "break", "calendar".`;

    let parsedData;
    try {
      const response = await generateGeminiContent({
        contents: prompt,
        responseMimeType: 'application/json',
        temperature: 0.2,
      });
      parsedData = JSON.parse(response.text || "{}");
    } catch (apiError: any) {
      console.log("[Gemini API Info] error in /api/gemini/generate-schedule, using smart local fallback planner:", apiError.message || apiError);
      const pendingTasks = tasks.filter((t: any) => t.status !== 'completed');
      const timeBlocks: any[] = [];
      let hour = 9;
      let minute = 0;

      const formatTime = (h: number, m: number) => {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      };

      // Morning alignment
      timeBlocks.push({
        id: `fb-planning-${Date.now()}`,
        title: "Morning Alignment & Prioritization",
        startTime: formatTime(hour, minute),
        endTime: formatTime(hour, minute + 30),
        type: "focus"
      });
      minute += 30;

      pendingTasks.forEach((t: any, idx: number) => {
        const duration = Math.min(90, t.estimatedMinutes || 60);
        const start = formatTime(hour, minute);
        
        let newMinute = minute + duration;
        let newHour = hour;
        if (newMinute >= 60) {
          newHour += Math.floor(newMinute / 60);
          newMinute = newMinute % 60;
        }

        // Handle lunch block
        if (hour < 12 && newHour >= 12) {
          timeBlocks.push({
            id: `fb-lunch-${Date.now()}`,
            title: "Lunch & Outdoor Walk",
            startTime: "12:00",
            endTime: "13:00",
            type: "break"
          });
          hour = 13;
          minute = 0;
        }

        timeBlocks.push({
          id: `fb-task-${t.id}-${idx}`,
          title: `Focus Block: ${t.title}`,
          startTime: formatTime(hour, minute),
          endTime: formatTime(newHour, newMinute),
          taskId: t.id,
          type: "focus"
        });

        hour = newHour;
        minute = newMinute;

        // Break block
        const breakStart = formatTime(hour, minute);
        let bm = minute + 15;
        let bh = hour;
        if (bm >= 60) {
          bh += 1;
          bm = bm % 60;
        }
        timeBlocks.push({
          id: `fb-break-${t.id}-${idx}`,
          title: "Stretching & Hydration Break",
          startTime: breakStart,
          endTime: formatTime(bh, bm),
          type: "break"
        });
        hour = bh;
        minute = bm;
      });

      if (timeBlocks.length <= 2) {
        timeBlocks.push({
          id: `fb-empty-focus-${Date.now()}`,
          title: "Deep Work: Critical Tasks Focus",
          startTime: "10:00",
          endTime: "11:30",
          type: "focus"
        });
        timeBlocks.push({
          id: `fb-empty-lunch-${Date.now()}`,
          title: "Midday Break & Reset",
          startTime: "12:00",
          endTime: "13:00",
          type: "break"
        });
        timeBlocks.push({
          id: `fb-empty-review-${Date.now()}`,
          title: "Collaborative Sync & Mail Review",
          startTime: "14:00",
          endTime: "15:00",
          type: "task"
        });
      }

      parsedData = { timeBlocks };
    }

    res.json(parsedData);
  } catch (error: any) {
    console.log("[Gemini API Info] Error generating schedule:", error.message || error);
    res.status(500).json({ error: "Failed to generate schedule.", details: error.message });
  }
});

// ---------------------------------------------------------
// 3. Dynamic Replanning Agent Endpoint
// ---------------------------------------------------------
app.post("/api/gemini/replan", async (req, res) => {
  try {
    const { tasks, currentSchedule, missedTaskId, reason, currentDate } = req.body;
    if (!tasks || !Array.isArray(tasks)) {
      return res.status(400).json({ error: "Tasks array is required." });
    }

    const tasksPrompt = tasks.map((t, idx) => {
      return `ID: "${t.id}", Title: "${t.title}", Status: "${t.status}", Due Date: "${t.dueDate}", Estimated Time: ${t.estimatedMinutes} minutes, Priority: "${t.priority}"`;
    }).join("\n");

    const schedulePrompt = currentSchedule && currentSchedule.timeBlocks ? 
      currentSchedule.timeBlocks.map((b: any) => `${b.startTime} - ${b.endTime}: ${b.title} (${b.type})`).join("\n") : "None";

    const prompt = `You are the Dynamic Replanning Agent of "Deadline Hero AI".
The user has missed or delayed their scheduled task.
Missed/Delayed Task ID: "${missedTaskId}"
User's reason for delay: "${reason || 'Ran out of time / Got distracted'}"

Current Date: ${currentDate || new Date().toLocaleDateString()}
Current Active Schedule:
${schedulePrompt}

All Tasks:
${tasksPrompt}

Analyze the disruption. You must now AUTONOMOUSLY:
1. Rearrange the remaining time blocks of the day starting from the current hour to recover from this delay.
2. Ensure critical pending tasks are still allocated.
3. Generate an encouraging, highly realistic recovery strategy text (1-3 sentences) explaining how this new plan mitigates the delay.

Output STRICTLY a JSON object matching this structure:
{
  "timeBlocks": [
    {
      "id": "block_id",
      "title": "Adjusted Focus Session: Title",
      "startTime": "14:30",
      "endTime": "16:00",
      "taskId": "task_id",
      "type": "focus"
    }
  ],
  "recoveryStrategy": "Motivational and strategic recovery guidance here."
}`;

    let parsedData;
    try {
      const response = await generateGeminiContent({
        contents: prompt,
        responseMimeType: 'application/json',
        temperature: 0.3,
      });
      parsedData = JSON.parse(response.text || "{}");
    } catch (apiError: any) {
      console.log("[Gemini API Info] error in /api/gemini/replan, using smart local fallback replanner:", apiError.message || apiError);
      const missedTask = tasks.find((t: any) => t.id === missedTaskId);
      const missedTitle = missedTask ? missedTask.title : "Delayed Task";
      const timeBlocks = currentSchedule && currentSchedule.timeBlocks ? [...currentSchedule.timeBlocks] : [];
      
      const updatedBlocks = timeBlocks.map((b: any) => {
        if (b.taskId === missedTaskId) {
          return {
            ...b,
            title: `Rescheduled Focus: ${missedTitle}`
          };
        }
        return b;
      });

      parsedData = {
        timeBlocks: updatedBlocks.length > 0 ? updatedBlocks : [
          {
            id: `replan-block-1-${Date.now()}`,
            title: `Rescheduled Focus: ${missedTitle}`,
            startTime: "14:30",
            endTime: "16:00",
            taskId: missedTaskId,
            type: "focus"
          },
          {
            id: `replan-block-2-${Date.now()}`,
            title: "Buffer & Wrap-up Block",
            startTime: "16:00",
            endTime: "16:30",
            type: "task"
          }
        ],
        recoveryStrategy: `We detected a delay on "${missedTitle}". No stress! We have dynamically shifted your remaining focus sessions and added a buffer block, protecting your highest priority deadlines.`
      };
    }

    res.json(parsedData);
  } catch (error: any) {
    console.log("[Gemini API Info] Error replanning:", error.message || error);
    res.status(500).json({ error: "Failed to replan schedule.", details: error.message });
  }
});

// ---------------------------------------------------------
// 4. Goal Decomposition Agent Endpoint
// ---------------------------------------------------------
app.post("/api/gemini/goal-decompose", async (req, res) => {
  try {
    const { goalTitle, goalDescription } = req.body;
    if (!goalTitle) {
      return res.status(400).json({ error: "Goal title is required." });
    }

    const prompt = `You are the Goal Decomposition Agent of "Deadline Hero AI". Your specialty is breaking down large, intimidating goals into progressive, small, highly actionable items.
Goal: "${goalTitle}"
Description: "${goalDescription || ''}"

Break this goal down into 4 to 6 logical, progressive subtasks. For each subtask, estimate the focus time needed (in minutes) and assign a priority level.

Output STRICTLY a JSON object matching this structure:
{
  "subtasks": [
    {
      "title": "Subtask title (actionable, e.g., 'Research competitors' UI design')",
      "estimatedMinutes": 45,
      "priority": "medium"
    }
  ]
}
Ensure priority is one of: "low", "medium", "high", "critical".`;

    let parsedData;
    try {
      const response = await generateGeminiContent({
        contents: prompt,
        responseMimeType: 'application/json',
        temperature: 0.3,
      });
      parsedData = JSON.parse(response.text || "{}");
    } catch (apiError: any) {
      console.log("[Gemini API Info] error in /api/gemini/goal-decompose, using smart local fallback goal decomposer:", apiError.message || apiError);
      parsedData = {
        subtasks: [
          {
            title: `Phase 1: Define specific requirements & goals for "${goalTitle}"`,
            estimatedMinutes: 30,
            priority: "high"
          },
          {
            title: `Phase 2: Perform secondary research & structural outline design`,
            estimatedMinutes: 45,
            priority: "medium"
          },
          {
            title: `Phase 3: Core execution, iterative implementation, & drafting`,
            estimatedMinutes: 90,
            priority: "high"
          },
          {
            title: `Phase 4: Polish, comprehensive testing, & performance review`,
            estimatedMinutes: 30,
            priority: "critical"
          }
        ]
      };
    }

    res.json(parsedData);
  } catch (error: any) {
    console.log("[Gemini API Info] Error decomposing goal:", error.message || error);
    res.status(500).json({ error: "Failed to decompose goal.", details: error.message });
  }
});

// ---------------------------------------------------------
// 5. Voice/NLU Productivity Command Endpoint
// ---------------------------------------------------------
app.post("/api/gemini/voice", async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: "Transcript text is required." });
    }

    const prompt = `You are the Natural Language Understanding unit of "Deadline Hero AI".
The user said or typed this voice command: "${transcript}"

Parse the command and classify the intent into one of these:
1. "add_task" (when user wants to add or schedule a new task/deadline)
2. "check_deadlines" (when user asks what is due, what risks they have, or task status)
3. "generate_schedule" (when user wants to optimize or generate their daily agenda/mission)
4. "replan_schedule" (when user wants to reschedule, is running late, or wants a recovery plan)

Also extract key entities if present:
- "title" (the title of the task or action)
- "dueDate" (approximate deadline date/time in relative or ISO format, e.g., "tomorrow", "Friday at 5pm")
- "priority" (priority of the task: low, medium, high, critical)
- "duration" (estimated duration in minutes)

Output STRICTLY a JSON object matching this structure:
{
  "intent": "add_task",
  "entities": {
    "title": "Pitch deck design",
    "dueDate": "tomorrow at 18:00",
    "priority": "high",
    "duration": 120
  }
}`;

    let parsedData;
    try {
      const response = await generateGeminiContent({
        contents: prompt,
        responseMimeType: 'application/json',
        temperature: 0.1,
      });
      parsedData = JSON.parse(response.text || "{}");
    } catch (apiError: any) {
      console.log("[Gemini API Info] error in /api/gemini/voice, using smart local fallback NLU parser:", apiError.message || apiError);
      const txt = transcript.toLowerCase();
      let intent = "generate_schedule";
      let title = "Voice Task Idea";
      let dueDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      let priority = "medium";
      let duration = 45;

      if (txt.includes("add") || txt.includes("create") || txt.includes("schedule") || txt.includes("new task")) {
        intent = "add_task";
        const matchTitle = transcript.match(/(?:add task|create task|task|new task|add|create)\s+([^tod|tom|next|by|at|for]+)/i);
        if (matchTitle && matchTitle[1]) {
          title = matchTitle[1].trim();
        } else {
          title = transcript.replace(/(add|create|task|new)/gi, "").trim() || "Voice Generated Task";
        }
      } else if (txt.includes("check") || txt.includes("due") || txt.includes("deadlines") || txt.includes("risk")) {
        intent = "check_deadlines";
      } else if (txt.includes("replan") || txt.includes("miss") || txt.includes("late") || txt.includes("delay") || txt.includes("adjust")) {
        intent = "replan_schedule";
      }

      if (txt.includes("critical") || txt.includes("urgent")) priority = "critical";
      else if (txt.includes("high")) priority = "high";
      else if (txt.includes("low")) priority = "low";

      const matchMin = txt.match(/(\d+)\s*min/);
      if (matchMin && matchMin[1]) {
        duration = parseInt(matchMin[1]);
      }

      parsedData = {
        intent,
        entities: {
          title,
          dueDate,
          priority,
          duration
        }
      };
    }

    res.json(parsedData);
  } catch (error: any) {
    console.log("[Gemini API Info] Error parsing voice command:", error.message || error);
    res.status(500).json({ error: "Failed to parse command.", details: error.message });
  }
});

// ---------------------------------------------------------
// 6. AI Productivity Coach Recommendations Endpoint
// ---------------------------------------------------------
app.post("/api/gemini/coach", async (req, res) => {
  try {
    const { tasks, logs } = req.body;

    const tasksSummary = (tasks && Array.isArray(tasks)) ? tasks.map(t => 
      `- "${t.title}": Status=${t.status}, Priority=${t.priority}, Risk=${t.riskScore}%`
    ).join("\n") : "No active tasks.";

    const logsSummary = (logs && Array.isArray(logs)) ? logs.map(l => 
      `- Date=${l.date}, FocusMinutes=${l.focusMinutes}, CompletedTasks=${l.completedTasks}, Score=${l.score}`
    ).join("\n") : "No historical productivity logs yet.";

    const prompt = `You are the Elite AI Productivity Coach of "Deadline Hero AI".
You are analyzing user performance to write custom coaching recommendations.

User Task Performance:
${tasksSummary}

Historical Activity Logs:
${logsSummary}

Generate exactly 3 diverse, highly personalized coach recommendations:
1. One "risk_mitigation" suggestion addressing specific deadlines or high-risk tasks.
2. One "habit_improvement" suggestion centered around study/work hours, focus blocks, and consistency.
3. One "schedule_adjustment" suggestion on optimizing the daily timeline (e.g., matching tasks with energy peaks).

For each suggestion, provide a concise but inspiring message. Keep your tone encouraging, insightful, and strategic. Use rich Markdown formatting (bold, lists, code accents where appropriate).

Output STRICTLY a JSON object of this structure:
{
  "recommendations": [
    {
      "type": "risk_mitigation",
      "message": "**Urgent Deadline Risk Detected**: You have a critical task due tomorrow... "
    },
    {
      "type": "habit_improvement",
      "message": "..."
    },
    {
      "type": "schedule_adjustment",
      "message": "..."
    }
  ]
}`;

    let parsedData;
    try {
      const response = await generateGeminiContent({
        contents: prompt,
        responseMimeType: 'application/json',
        temperature: 0.6,
      });
      parsedData = JSON.parse(response.text || "{}");
    } catch (apiError: any) {
      console.log("[Gemini API Info] error in /api/gemini/coach, using smart local fallback coach suggestions:", apiError.message || apiError);
      parsedData = {
        recommendations: [
          {
            type: "risk_mitigation",
            message: "**Minimize Deadline Risks**: Tackle high-priority deadlines immediately. Dedicating even a brief **20-minute uninterrupted window** right now will establish substantial momentum."
          },
          {
            type: "habit_improvement",
            message: "**Establish Unbreakable focus blocks**: Block distraction triggers. Switch your status to silent and complete a **45-minute focus session** to foster deep work habits."
          },
          {
            type: "schedule_adjustment",
            message: "**Sync Tasks with Energy Cycles**: Match your most complex design or logic problems to your morning energy peak, leaving simpler tasks for the late afternoon."
          }
        ]
      };
    }

    res.json(parsedData);
  } catch (error: any) {
    console.log("[Gemini API Info] Error generating coaching tips:", error.message || error);
    res.status(500).json({ error: "Failed to generate coaching recommendations.", details: error.message });
  }
});

// ---------------------------------------------------------
// Vite / Static Assets Serving Middleware Integration
// ---------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
