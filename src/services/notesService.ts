import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { Logger } from "../logger/logger";

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export class NotesService {
  private filepath: string;
  private dirpath: string;
  private notes: Note[] = [];
  private initialized = false;

  constructor(memoryDir: string = "./memory") {
    this.dirpath = path.resolve(memoryDir);
    this.filepath = path.join(this.dirpath, "notes.json");
  }

  private async ensureInitialized(): Promise<void> {
    if (this.initialized) return;
    try {
      await fs.mkdir(this.dirpath, { recursive: true });
      try {
        const data = await fs.readFile(this.filepath, "utf-8");
        if (data.trim()) {
          this.notes = JSON.parse(data);
          this.initialized = true;
          return;
        }
      } catch {
        // File doesn't exist, we will save an empty array on first write
      }
      this.notes = [];
      await this.saveNotes();
      this.initialized = true;
    } catch (err: any) {
      Logger.error(`Failed to initialize NotesService: ${err.message}`);
    }
  }

  private async saveNotes(): Promise<void> {
    const tempFile = `${this.filepath}.tmp`;
    try {
      const jsonString = JSON.stringify(this.notes, null, 2);
      await fs.writeFile(tempFile, jsonString, "utf-8");
      await fs.rename(tempFile, this.filepath);
    } catch (err: any) {
      Logger.error(`Failed to save notes: ${err.message}`);
      try {
        await fs.unlink(tempFile);
      } catch {}
    }
  }

  public async createNote(title: string, content: string): Promise<Note> {
    await this.ensureInitialized();
    const now = new Date().toISOString();
    const note: Note = {
      id: crypto.randomUUID(),
      title,
      content,
      createdAt: now,
      updatedAt: now,
    };
    this.notes.push(note);
    await this.saveNotes();
    Logger.info(`NotesService: Created new note with ID "${note.id}"`);
    return note;
  }

  public async readNote(id: string): Promise<Note | null> {
    await this.ensureInitialized();
    const note = this.notes.find((n) => n.id === id);
    return note || null;
  }

  public async listNotes(): Promise<Note[]> {
    await this.ensureInitialized();
    return this.notes;
  }

  public async deleteNote(id: string): Promise<boolean> {
    await this.ensureInitialized();
    const index = this.notes.findIndex((n) => n.id === id);
    if (index !== -1) {
      this.notes.splice(index, 1);
      await this.saveNotes();
      Logger.info(`NotesService: Deleted note with ID "${id}"`);
      return true;
    }
    return false;
  }

  public async searchNotes(query: string): Promise<Note[]> {
    await this.ensureInitialized();
    const lowerQuery = query.toLowerCase();
    return this.notes.filter(
      (n) => n.title.toLowerCase().includes(lowerQuery) || n.content.toLowerCase().includes(lowerQuery)
    );
  }
}
