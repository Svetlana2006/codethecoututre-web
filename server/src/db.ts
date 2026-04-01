import fs from "fs";
import path from "path";

export interface Entry {
  id: string;
  team: string;
  leader: string;
  phone: string;
  college: string;
  email: string;
  category?: string;
  puzzleAnswer?: string;
  theme?: string;
  timeTaken?: number;
  status: string;
  timestamp: string;
}

export class JsonDb {
  private file: string;
  private data: { entries: Entry[], isLaunched?: boolean, launchDate?: string } = { entries: [] };

  constructor(dir: string) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    this.file = path.join(dir, "db.json");
    this.load();
  }

  private load() {
    if (fs.existsSync(this.file)) {
      this.data = JSON.parse(fs.readFileSync(this.file, "utf8"));
    } else {
      this.save();
    }
  }

  private save() {
    fs.writeFileSync(this.file, JSON.stringify(this.data, null, 2));
  }

  getEntries(): Entry[] {
    return this.data.entries;
  }

  isLaunched(): boolean {
    return !!this.data.isLaunched;
  }

  setLaunched(val: boolean) {
    this.data.isLaunched = val;
    this.save();
  }

  getLaunchDate(): string {
    return this.data.launchDate || '2026-04-01T13:00:00+05:30';
  }

  setLaunchDate(val: string) {
    this.data.launchDate = val;
    this.save();
  }

  getEntry(id: string): Entry | undefined {
    return this.data.entries.find(e => e.id === id);
  }

  addEntry(entry: Entry) {
    this.data.entries.push(entry);
    this.save();
  }

  updateEntry(id: string, updates: Partial<Entry>) {
    const idx = this.data.entries.findIndex(e => e.id === id);
    if (idx !== -1) {
      this.data.entries[idx] = { ...this.data.entries[idx], ...updates };
      this.save();
    }
  }
}
