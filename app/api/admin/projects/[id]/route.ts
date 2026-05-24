import { NextResponse } from "next/server";
import { auditProjectFieldChanges } from "@/lib/audit-project";
import { withAdminAuth } from "@/lib/api-auth";
import type { ProjectInput, ProjectStatusDb } from "@/lib/admin-types";
import { getDatabase, getProjectById, updateProject } from "@/lib/db";
import { validateProjectInput } from "@/lib/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAdminAuth(async () => {
    const { id } = await params;
    const project = await getProjectById(id);
    if (!project) {
      return NextResponse.json({ error: "Proiect negăsit" }, { status: 404 });
    }
    return NextResponse.json(project);
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAdminAuth(async (session) => {
    const { id } = await params;
    const existing = await getProjectById(id);
    if (!existing) {
      return NextResponse.json({ error: "Proiect negăsit" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const { data, errors } = validateProjectInput(body);

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({ errors }, { status: 400 });
    }

    const db = await getDatabase();
    await auditProjectFieldChanges(
      db,
      session,
      id,
      existing,
      data as Partial<ProjectInput>,
    );
    await updateProject(id, data as Partial<ProjectInput> & { status: ProjectStatusDb });
    return NextResponse.json({ ok: true });
  });
}
