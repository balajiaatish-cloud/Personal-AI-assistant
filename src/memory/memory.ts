export interface MemoryData {
  userProfile: Record<string, any>;
  preferences: Record<string, any>;
  facts: string[];
}

export class MemoryManager {
  private data: MemoryData = { userProfile: {}, preferences: {}, facts: [] };

  public getFacts(): string[] {
    return this.data.facts;
  }

  public addFact(fact: string): void {
    if (!this.data.facts.includes(fact)) {
      this.data.facts.push(fact);
    }
  }

  public getProfile(): Record<string, any> {
    return this.data.userProfile;
  }

  public getPreferences(): Record<string, any> {
    return this.data.preferences;
  }
}
