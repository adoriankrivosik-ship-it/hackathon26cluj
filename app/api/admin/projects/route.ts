import { NextResponse } from "next/server";
import { generatePlainSummary } from "@/lib/ai";
import { withAdminAuth } from "@/lib/api-auth";
import type { ProjectInput, ProjectStatusDb } from "@/lib/admin-types";
import {
  createProject,
  setProjectPlainSummary,
} from "@/lib/db";
import { writeLedgerEntry } from "@/lib/ledger";
import { validateProjectInput } from "@/lib/validation";

export async function POST(request: Request) {
  return withAdminAuth(async (session) => {
    const body = (await request.json()) as Record<string, unknown>;
    const { data, errors } = validateProjectInput(body);

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const input: ProjectInput = {
      name: data.name as string,
      description_original: data.description_original as string | null,
      description_plain: null,
      status: data.status as ProjectStatusDb,
      category: data.category as ProjectInput["category"],
      budget_ron: data.budget_ron as number | null,
      budget_source: data.budget_source as ProjectInput["budget_source"],
      responsible_institution: data.responsible_institution as string | null,
      location_lat: data.location_lat as number | null,
      location_lng: data.location_lng as number | null,
      address: data.address as string | null,
      district: data.district as string | null,
      start_date: data.start_date as string | null,
      end_date: data.end_date as string | null,
      source_url: data.source_url as string | null,
      source_type: (data.source_type as string) ?? "manual",
      created_by: session.id,
    };

    const id = await createProject(input);

    const desc = input.description_original ?? "";
    if (desc) {
      try {
        const plain = await generatePlainSummary(desc);
        await setProjectPlainSummary(id, plain);
      } catch (e) {
        console.error("generatePlainSummary failed:", e);
      }
    }

    await writeLedgerEntry({
      projectId: id,
      actionType: "project_created",
      newValue: input.name,
      changedBy: session.name,
      changedByRole: session.role === "admin" ? "admin" : "civil_servant",
      note: "Proiect creat din panoul de administrare",
    });

    return NextResponse.json({ id });
  });
}
