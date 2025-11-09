import { create } from 'zustand';
import { Persona, CodeFile, Issue, ConnectionStatus } from '../types';

interface CodeCourtState {
  activePersona: Persona;
  isScreenSharing: boolean;
  codeFiles: CodeFile[];
  issues: Issue[];
  approvedIssueIds: string[];
  connectionStatus: ConnectionStatus;
  setActivePersona: (persona: Persona) => void;
  setIsScreenSharing: (isSharing: boolean) => void;
  addCodeFile: (file: CodeFile) => void;
  clearCodeFiles: () => void;
  setIssues: (issues: Issue[]) => void;
  appendIssueContent: (id: string, chunk: string) => void;
  addNewIssue: (issue: Issue) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  clearIssues: () => void;
  toggleApproveFix: (issueId: string) => void;
  approveAllFixes: (issueIds: string[]) => void;
}

export const useCodeCourtStore = create<CodeCourtState>((set, get) => ({
  activePersona: Persona.SECURITY,
  isScreenSharing: false,
  codeFiles: [],
  issues: [],
  approvedIssueIds: [],
  connectionStatus: 'idle',

  setActivePersona: (persona) => set({ activePersona: persona, issues: [], approvedIssueIds: [] }),
  setIsScreenSharing: (isSharing) => set({ isScreenSharing: isSharing }),
  addCodeFile: (file) => set((state) => ({ codeFiles: [...state.codeFiles, file] })),
  clearCodeFiles: () => set({ codeFiles: [] }),
  setIssues: (issues) => set({ issues }),
  appendIssueContent: (id, chunk) => {
    set((state) => ({
      issues: state.issues.map((issue) =>
        issue.id === id ? { ...issue, content: issue.content + chunk } : issue
      ),
    }));
  },
  addNewIssue: (issue) => {
     set((state) => ({ issues: [...state.issues, issue] }))
  },
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  clearIssues: () => set({ issues: [], approvedIssueIds: [] }),
  toggleApproveFix: (issueId) => set((state) => ({
    approvedIssueIds: state.approvedIssueIds.includes(issueId)
      ? state.approvedIssueIds.filter((id) => id !== issueId)
      : [...state.approvedIssueIds, issueId],
  })),
  approveAllFixes: (issueIds) => set({ approvedIssueIds: [...new Set([...get().approvedIssueIds, ...issueIds])] }),
}));