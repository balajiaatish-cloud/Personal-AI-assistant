import { Tool } from "../base/tool";
import { ToolResult } from "../base/toolResult";
import { ToolContext } from "../base/toolContext";
import { NotesService, Note } from "../../services/notesService";

export interface NotesInput {
  action: "create" | "read" | "list" | "delete" | "search";
  id?: string;
  title?: string;
  content?: string;
  query?: string;
}

export class NotesTool implements Tool<NotesInput, unknown> {
  public readonly name = "notes";
  public readonly description = "Manages personal notes. Supports creating, reading, listing, deleting, and searching text notes independently of current conversation histories.";
  public readonly category = "notes";
  public readonly permissionLevel = "safe" as const;
  public readonly inputSchema = {
    type: "object",
    properties: {
      action: {
        type: "string",
        enum: ["create", "read", "list", "delete", "search"],
        description: "The note action to perform."
      },
      id: { type: "string", description: "The ID of the note (required for read and delete)." },
      title: { type: "string", description: "The title of the note (required for create)." },
      content: { type: "string", description: "The body content of the note (required for create)." },
      query: { type: "string", description: "The search query keyword (required for search)." }
    },
    required: ["action"]
  };

  public async execute(args: NotesInput, context: ToolContext): Promise<ToolResult<unknown>> {
    const notesService = new NotesService(context.settings.memory.directory);
    const { action, id, title, content, query } = args;

    try {
      switch (action) {
        case "create": {
          if (!title || !content) {
            return {
              success: false,
              error: {
                code: "MissingParameters",
                message: "Missing 'title' or 'content' for action 'create'."
              }
            };
          }
          const note = await notesService.createNote(title, content);
          return {
            success: true,
            data: note,
            message: `Successfully created note: "${title}"`
          };
        }
        case "read": {
          if (!id) {
            return {
              success: false,
              error: {
                code: "MissingParameters",
                message: "Missing required parameter 'id' for action 'read'."
              }
            };
          }
          const note = await notesService.readNote(id);
          if (!note) {
            return {
              success: false,
              error: {
                code: "NoteNotFound",
                message: `Note with ID "${id}" was not found.`
              }
            };
          }
          return {
            success: true,
            data: note,
            message: `Retrieved note: "${note.title}"`
          };
        }
        case "list": {
          const notes = await notesService.listNotes();
          return {
            success: true,
            data: notes,
            message: `Retrieved ${notes.length} notes.`
          };
        }
        case "delete": {
          if (!id) {
            return {
              success: false,
              error: {
                code: "MissingParameters",
                message: "Missing required parameter 'id' for action 'delete'."
              }
            };
          }
          const deleted = await notesService.deleteNote(id);
          if (!deleted) {
            return {
              success: false,
              error: {
                code: "NoteNotFound",
                message: `Note with ID "${id}" could not be deleted because it does not exist.`
              }
            };
          }
          return {
            success: true,
            message: `Successfully deleted note with ID "${id}".`
          };
        }
        case "search": {
          if (!query) {
            return {
              success: false,
              error: {
                code: "MissingParameters",
                message: "Missing required parameter 'query' for action 'search'."
              }
            };
          }
          const matches = await notesService.searchNotes(query);
          return {
            success: true,
            data: matches,
            message: `Found ${matches.length} notes matching query: "${query}"`
          };
        }
        default:
          return {
            success: false,
            error: {
              code: "InvalidAction",
              message: `Unsupported action: "${action}"`
            }
          };
      }
    } catch (err: any) {
      return {
        success: false,
        error: {
          code: "NotesError",
          message: `Notes operation failed: ${err.message}`
        }
      };
    }
  }
}
