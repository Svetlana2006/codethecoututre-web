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
  status: string;
  timestamp: string;
}

export class JsonDb {
  private file: string;
  private data: { entries: Entry[] } = { entries: [] };

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
