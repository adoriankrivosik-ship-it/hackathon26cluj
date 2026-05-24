/** DB enum values for projects.status */
export type ProjectStatusDb =
  | "planned"
  | "procurement"
  | "starting"
  | "continuing"
  | "finalizing"
  | "delayed"
  | "completed";

export type ProjectCategoryDb =
  | "mobility"
  | "education"
  | "green"
  | "social"
  | "cultural"
  | "energy"
  | "housing"
  | "waste";

export type BudgetSourceDb = "local" | "european" | "national" | "mixed";

export type IssueStatusDb = "open" | "in_progress" | "resolved";

export type LedgerActionType =
  | "project_created"
  | "status_updated"
  | "field_updated"
  | "issue_submitted"
  | "issue_resolved";

export type UserRole = "citizen" | "civil_servant" | "admin";

export interface DbProject {
  id: string;
  name: string;
  description_original: string | null;
  description_plain: string | null;
  status: ProjectStatusDb;
  category: ProjectCategoryDb | null;
  budget_ron: number | null;
  budget_source: BudgetSourceDb | null;
  responsible_institution: string | null;
  location_lat: number | null;
  location_lng: number | null;
  address: string | null;
  district: string | null;
  start_date: string | null;
  end_date: string | null;
  source_url: string | null;
  source_type: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface DbIssueReport {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  location_lat: number | null;
  location_lng: number | null;
  address: string | null;
  status: IssueStatusDb | null;
  submitted_by: string | null;
  submitted_at: string | null;
  photo_url: string | null;
  resolved_at: string | null;
  resolution_note: string | null;
}

export interface DbLedgerEntry {
  id: string;
  timestamp: string;
  project_id: string | null;
  action_type: LedgerActionType;
  old_value: string | null;
  new_value: string | null;
  changed_by: string;
  changed_by_role: string | null;
  note: string | null;
  previous_hash: string | null;
  entry_hash: string;
}

export interface ProjectInput {
  name: string;
  description_original?: string | null;
  description_plain?: string | null;
  status: ProjectStatusDb;
  category?: ProjectCategoryDb | null;
  budget_ron?: number | null;
  budget_source?: BudgetSourceDb | null;
  responsible_institution?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  address?: string | null;
  district?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  source_url?: string | null;
  source_type?: string | null;
  created_by?: string | null;
}

export interface ExtractedProject {
  name: string;
  description_original?: string;
  status?: string;
  category?: string;
  budget_ron?: number;
  responsible_institution?: string;
  address?: string;
  start_date?: string;
  end_date?: string;
  source_url?: string;
}
