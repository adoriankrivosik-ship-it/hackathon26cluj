import type {
  BudgetSourceDb,
  ProjectCategoryDb,
  ProjectStatusDb,
} from "./admin-types";

const STATUSES: ProjectStatusDb[] = [
  "planned",
  "procurement",
  "starting",
  "continuing",
  "finalizing",
  "delayed",
  "completed",
];

const CATEGORIES: ProjectCategoryDb[] = [
  "mobility",
  "education",
  "green",
  "social",
  "cultural",
  "energy",
  "housing",
  "waste",
];

const BUDGET_SOURCES: BudgetSourceDb[] = [
  "local",
  "european",
  "national",
  "mixed",
];

export interface FieldErrors {
  [key: string]: string;
}

export function validateProjectInput(
  body: Record<string, unknown>,
): { data: Record<string, unknown>; errors: FieldErrors } {
  const errors: FieldErrors = {};

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) errors.name = "Numele proiectului este obligatoriu.";

  const status = body.status as string;
  if (!STATUSES.includes(status as ProjectStatusDb)) {
    errors.status = "Selectați un status valid.";
  }

  const category = body.category as string | undefined;
  if (category && !CATEGORIES.includes(category as ProjectCategoryDb)) {
    errors.category = "Categorie invalidă.";
  }

  const budgetSource = body.budget_source as string | undefined;
  if (
    budgetSource &&
    !BUDGET_SOURCES.includes(budgetSource as BudgetSourceDb)
  ) {
    errors.budget_source = "Sursă de finanțare invalidă.";
  }

  let budget_ron: number | null = null;
  if (body.budget_ron !== undefined && body.budget_ron !== "") {
    const n = Number(body.budget_ron);
    if (Number.isNaN(n) || n < 0) {
      errors.budget_ron = "Bugetul trebuie să fie un număr pozitiv.";
    } else {
      budget_ron = Math.round(n);
    }
  }

  let location_lat: number | null = null;
  let location_lng: number | null = null;
  if (body.location_lat !== undefined && body.location_lat !== "") {
    location_lat = Number(body.location_lat);
    if (Number.isNaN(location_lat)) {
      errors.location_lat = "Latitudine invalidă.";
    }
  }
  if (body.location_lng !== undefined && body.location_lng !== "") {
    location_lng = Number(body.location_lng);
    if (Number.isNaN(location_lng)) {
      errors.location_lng = "Longitudine invalidă.";
    }
  }

  const source_url =
    typeof body.source_url === "string" ? body.source_url.trim() : "";
  if (source_url && !/^https?:\/\//i.test(source_url)) {
    errors.source_url = "URL-ul trebuie să înceapă cu http:// sau https://";
  }

  return {
    errors,
    data: {
      name,
      description_original:
        typeof body.description_original === "string"
          ? body.description_original
          : null,
      status,
      category: category || null,
      budget_ron,
      budget_source: budgetSource || null,
      responsible_institution:
        typeof body.responsible_institution === "string"
          ? body.responsible_institution.trim() || null
          : null,
      location_lat,
      location_lng,
      address:
        typeof body.address === "string" ? body.address.trim() || null : null,
      district:
        typeof body.district === "string" ? body.district.trim() || null : null,
      start_date:
        typeof body.start_date === "string" ? body.start_date || null : null,
      end_date:
        typeof body.end_date === "string" ? body.end_date || null : null,
      source_url: source_url || null,
      source_type:
        typeof body.source_type === "string" ? body.source_type : "manual",
    },
  };
}
