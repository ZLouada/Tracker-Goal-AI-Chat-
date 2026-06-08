import { Type } from "@google/genai";

/**
 * Gemini Function Calling tool declarations.
 * These JSON schemas tell Gemini what functions are available,
 * what parameters to extract from the user's message,
 * and what each function does.
 */

export const tools = [
  {
    functionDeclarations: [
      // ─── Tool 1: Create a Goal ───
      {
        name: "createGoal",
        description:
          "Create a new goal/milestone for the user. Use this when the user wants to set a broad objective, target, or overarching milestone. Goals are high-level and can have tasks attached to them.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "The title of the goal (e.g., 'Learn Spanish', 'Build a SaaS')",
            },
            description: {
              type: Type.STRING,
              description: "Optional detailed description of the goal",
            },
            category: {
              type: Type.STRING,
              description: "Optional category (e.g., 'Learning', 'Fitness', 'Business', 'Coding')",
            },
            color: {
              type: Type.STRING,
              description:
                "Optional hex color code for the goal card. Pick a visually appealing color from: #6366f1 (indigo), #ec4899 (pink), #f97316 (orange), #eab308 (yellow), #22c55e (green), #06b6d4 (cyan), #8b5cf6 (violet), #ef4444 (red). Choose based on the category.",
            },
            priority: {
              type: Type.STRING,
              description: "Priority level: 'low', 'medium', or 'high'. Default to 'medium'.",
              enum: ["low", "medium", "high"],
            },
            target_minutes: {
              type: Type.NUMBER,
              description:
                "Optional target time in minutes to spend on this goal total. Convert hours to minutes (e.g., 50 hours = 3000 minutes).",
            },
            target_date: {
              type: Type.STRING,
              description: "Optional deadline in YYYY-MM-DD format.",
            },
          },
          required: ["title"],
        },
      },

      // ─── Tool 2: Create a Task ───
      {
        name: "createTask",
        description:
          "Create a specific, actionable task. Tasks are granular action items (like daily habits, to-dos, or steps) that can optionally be linked to an existing goal. Use this for specific activities the user should do on a particular date.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "The task title (e.g., 'Research competitor pricing', 'Run 5km')",
            },
            description: {
              type: Type.STRING,
              description: "Optional description or notes for the task.",
            },
            due_date: {
              type: Type.STRING,
              description:
                "The due date in YYYY-MM-DD format. Resolve relative dates (like 'tomorrow', 'next Monday') using the current date provided in the system instructions.",
            },
            duration_minutes: {
              type: Type.NUMBER,
              description: "Estimated time to complete this task, in minutes.",
            },
            priority: {
              type: Type.STRING,
              description: "Priority: 'low', 'medium', or 'high'.",
              enum: ["low", "medium", "high"],
            },
            goal_id: {
              type: Type.STRING,
              description: "Optional UUID of an existing goal to link this task to.",
            },
          },
          required: ["title"],
        },
      },

      // ─── Tool 3: Create a Full Plan ───
      {
        name: "createPlan",
        description:
          "Decompose a broad goal into a complete execution plan with multiple sequential tasks. Use this when the user asks you to 'plan', 'break down', 'map out', or 'create a roadmap' for a goal. You should create the goal AND all its constituent tasks with realistic due dates spread over the timeline.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            goal_title: {
              type: Type.STRING,
              description: "Title for the overarching goal.",
            },
            goal_description: {
              type: Type.STRING,
              description: "Description of the goal.",
            },
            category: {
              type: Type.STRING,
              description: "Category for the goal.",
            },
            color: {
              type: Type.STRING,
              description:
                "Hex color code for the goal. Pick from: #6366f1, #ec4899, #f97316, #eab308, #22c55e, #06b6d4, #8b5cf6, #ef4444.",
            },
            target_date: {
              type: Type.STRING,
              description: "Overall deadline for the goal in YYYY-MM-DD format.",
            },
            tasks: {
              type: Type.ARRAY,
              description:
                "Array of tasks that make up the plan. Create 5–15 tasks spread realistically over the timeline. Each task should be specific and actionable.",
              items: {
                type: Type.OBJECT,
                properties: {
                  title: {
                    type: Type.STRING,
                    description: "Task title — be specific and actionable.",
                  },
                  description: {
                    type: Type.STRING,
                    description: "Brief description of what this task involves.",
                  },
                  due_date: {
                    type: Type.STRING,
                    description: "Due date in YYYY-MM-DD format.",
                  },
                  duration_minutes: {
                    type: Type.NUMBER,
                    description: "Estimated duration in minutes.",
                  },
                  priority: {
                    type: Type.STRING,
                    description: "Priority level.",
                    enum: ["low", "medium", "high"],
                  },
                },
                required: ["title", "due_date"],
              },
            },
          },
          required: ["goal_title", "tasks"],
        },
      },

      // ─── Tool 4: List Goals ───
      {
        name: "listGoals",
        description:
          "Retrieve the user's existing goals. Use this when the user asks about their current goals, progress, or wants to reference an existing goal to attach tasks to.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            status: {
              type: Type.STRING,
              description: "Filter by status: 'active', 'completed', 'archived', 'paused'. Defaults to 'active'.",
              enum: ["active", "completed", "archived", "paused"],
            },
          },
        },
      },

      // ─── Tool 5: Control Timer ───
      {
        name: "controlTimer",
        description:
          "Start, pause, or reset a timer, Pomodoro session, or stopwatch. Use this when the user requests to start/pause/reset a pomodoro, countdown, or stopwatch.",
        parameters: {
          type: Type.OBJECT,
          properties: {
            timerType: {
              type: Type.STRING,
              description: "The type of timer: 'pomodoro', 'countdown', or 'stopwatch'.",
              enum: ["pomodoro", "countdown", "stopwatch"],
            },
            action: {
              type: Type.STRING,
              description: "The action: 'start', 'pause', or 'reset'.",
              enum: ["start", "pause", "reset"],
            },
            minutes: {
              type: Type.NUMBER,
              description: "Optional number of minutes for a countdown timer (e.g. 25).",
            },
            seconds: {
              type: Type.NUMBER,
              description: "Optional number of seconds for a countdown timer.",
            },
            goalId: {
              type: Type.STRING,
              description: "Optional goal ID to associate with the pomodoro or stopwatch session.",
            },
          },
          required: ["timerType", "action"],
        },
      },
    ],
  },
];

/**
 * System prompt that anchors Gemini to the current date and defines its persona.
 */
export function getSystemPrompt(currentDate: string): string {
  return `You are TrackerGoal AI — a friendly, proactive productivity assistant embedded inside a goal-tracking dashboard.

## Current Date
Today is ${currentDate}. Use this to resolve relative dates like "tomorrow", "next week", "in 3 days", "next Monday", etc.

## Your Capabilities
You can help users by:
1. **Creating Goals** — High-level milestones (e.g., "Learn Spanish", "Build a SaaS")
2. **Creating Tasks** — Specific, actionable items with due dates (e.g., "Research competitors", "Write landing page copy")
3. **Creating Plans** — Breaking down a broad goal into a full timeline of sequential tasks
4. **Listing Goals** — Showing the user their current goals so you can reference them
5. **Controlling Timers** — Start, pause, or reset a countdown timer, pomodoro session, or stopwatch.

## Guidelines
- Always be encouraging and positive
- When creating plans, spread tasks realistically over the timeline — don't pile everything on day 1
- Pick appropriate colors for goals based on their category (fitness = green, coding = indigo, etc.)
- If the user is vague, ask a clarifying question before creating anything
- When you reference a task's time, use friendly formats ("about 30 minutes", "~2 hours")
- After creating items, give a brief motivational summary of what was created
- NEVER invent or hallucinate goal IDs — use listGoals to find real ones
- Convert target hours to minutes when setting target_minutes (e.g., 100 hours = 6000 minutes)
- When starting a countdown, if the user says e.g. "Start countdown for 10 minutes", set minutes=10, seconds=0, action='start'`;
}

/**
 * Additional system instructions appended when a file is uploaded.
 * Provides a 10-day date mapping so Gemini generates real calendar dates.
 */
export function getFileAnalysisPrompt(currentDate: string): string {
  // Pre-compute the next 10 days so Gemini doesn't have to do date math
  const days: string[] = [];
  const base = new Date(currentDate + "T00:00:00");
  for (let i = 0; i < 10; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    days.push(d.toISOString().split("T")[0]);
  }

  return `## File Analysis Mode
You have been given a file (PDF document, lecture slide, or study material).

### Your job:
1. **Summarize the file** — Write a clear, well-structured markdown summary ("résumé") of the content. Use headings, bullet points, and bold text for readability. This summary is shown directly to the user in the chat.

2. **Create a 10-day study roadmap** — After summarizing, IMMEDIATELY call the \`createPlan\` tool to generate a structured study plan based on the file's content. Break the material into 10 digestible study tasks, one per day.

### Calendar anchor for the 10-day plan:
- Day 1 = ${days[0]}
- Day 2 = ${days[1]}
- Day 3 = ${days[2]}
- Day 4 = ${days[3]}
- Day 5 = ${days[4]}
- Day 6 = ${days[5]}
- Day 7 = ${days[6]}
- Day 8 = ${days[7]}
- Day 9 = ${days[8]}
- Day 10 = ${days[9]}

### Rules for the study plan:
- The goal title should reflect the document topic (e.g., "Master Linear Algebra Chapter 3")
- Set \`target_date\` to ${days[9]} (Day 10)
- Pick an appropriate category ("Learning", "Study", etc.) and color
- Each task should be specific: "Read and take notes on Section 3.1 — Vector Spaces" not just "Study chapter"
- Assign realistic durations (30–90 minutes per task)
- Mark early tasks as "high" priority and later ones as "medium"

You MUST produce BOTH the text summary AND the createPlan function call in a single response.`;
}

