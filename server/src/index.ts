import "dotenv/config";
import express from "express";
import cors from "cors";
import { nanoid } from "nanoid";
import { z } from "zod";

import { loadEnv } from "./env.js";
import { JsonDb } from "./db.js";
import { CATEGORIES, MAX_SLOTS_PER_THEME } from "./data.js";

const env = loadEnv(process.env);
const db = new JsonDb(env.DATA_DIR);

const app = express();
app.use(express.json());
app.use(cors());

// 1. Register - Step 1 of the frontend flow
app.post("/api/register", (req, res) => {
  const Body = z.object({
    team: z.string().trim().min(1),
    leader: z.string().trim().min(1),
    phone: z.string().trim().min(1),
    college: z.string().trim().min(1),
    email: z.string().trim().email()
  });

  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid registration data" });
  const { team, leader, phone, college, email } = parsed.data;

  // Admin Check
  if (team.toLowerCase() === "admin" && phone === "9999999999") {
    // Return admin token (simple pseudo-token for this event)
    return res.json({ kind: "admin", token: "super-secret-admin-token" });
  }

  // Duplicate Checks
  const entries = db.getEntries();
  if (entries.some(e => e.phone === phone)) {
    return res.status(409).json({ error: "This WhatsApp number has already been registered." });
  }
  if (entries.some(e => e.team.toLowerCase() === team.toLowerCase())) {
    return res.status(409).json({ error: "This Team Name is already taken." });
  }

  // Assign random category & random puzzle
  const catIndex = Math.floor(Math.random() * CATEGORIES.length);
  const assignedCategoryName = CATEGORIES[catIndex].name;
  const assignedPuzzleIndex = Math.floor(Math.random() * CATEGORIES[catIndex].puzzles.length);

  const id = nanoid(10);
  db.addEntry({
    id,
    team,
    leader,
    phone,
    college,
    email,
    category: assignedCategoryName,
    puzzleIndex: assignedPuzzleIndex,
    status: "REGISTERED",
    timestamp: new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  });

  return res.json({ kind: "player", id, categoryName: assignedCategoryName, puzzleIndex: assignedPuzzleIndex });
});

// 2. Select Theme - Step 3 of the frontend flow
app.post("/api/theme", (req, res) => {
  const Body = z.object({
    id: z.string().min(1),
    themeName: z.string().min(1),
    puzzleAnswer: z.string()
  });

  const parsed = Body.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Invalid data" });
  const { id, themeName, puzzleAnswer } = parsed.data;

  const entry = db.getEntry(id);
  if (!entry) return res.status(404).json({ error: "Session not found. Please refresh and try again." });

  // verify slots
  const entries = db.getEntries();
  const themeCount = entries.filter(e => e.theme === themeName).length;
  
  if (themeCount >= MAX_SLOTS_PER_THEME) {
    return res.status(409).json({ error: `Try quicker with another theme. '${themeName}' is full!` });
  }

  db.updateEntry(id, {
    theme: themeName,
    puzzleAnswer,
    status: "SECURED"
  });

  return res.json({ success: true, theme: themeName });
});

// 3. Admin / Dashboard entries
app.get("/api/entries", (req, res) => {
  // the frontend sends the token from admin login
  const token = req.headers.authorization;
  // in a real app verify JWT. For this event:
  // we just return everything or we could do simple check
  
  const entries = db.getEntries();
  // frontend needs slot counts too, so we return them
  return res.json(entries);
});

// 4. Public details (for slot live tracking)
app.get("/api/slots", (req, res) => {
  const entries = db.getEntries();
  const slots: Record<string, number> = {};
  CATEGORIES.forEach(c => {
    c.themes.forEach(t => {
      slots[t] = entries.filter(e => e.theme === t).length;
    });
  });
  return res.json({ slots, max: MAX_SLOTS_PER_THEME });
});

const HOST = "0.0.0.0";
app.listen(env.PORT, HOST, () => {
  console.log(`Server listening on http://${HOST}:${env.PORT}`);
});
