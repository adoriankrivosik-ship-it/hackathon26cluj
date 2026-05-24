import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/api-auth";
import type { ProjectStatusDb } from "@/lib/admin-types";
import { statusLabel } from "@/lib/admin-mappings";
import {
  getProjectById,
  notifyProjectSubscribers,
  updateProjectStatus,
} from "@/lib/db";
import { writeLedgerEntry } from "@/lib/ledger";

const STATUSES: ProjectStatusDb[] = [
  "planned",
  "procurement",
  "starting",
  "continuing",
  "finalizing",
  "delayed",
  "completed",
];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAdminAuth(async (session) => {
    const { id } = await params;
    const project = await getProjectById(id);
    if (!project) {
      return NextResponse.json({ error: "Proiect negăsit" }, { status: 404 });
    }

    const body = (await request.json()) as {
      status?: string;
      note?: string;
    };

    const newStatus = body.status as ProjectStatusDb;
    if (!STATUSES.includes(newStatus)) {
      return NextResponse.json({ error: "Status invalid" }, { status: 400 });
    }

    const oldStatus = project.status;
    if (oldStatus === newStatus) {
      return NextResponse.json({ error: "Statusul este deja setat." }, { status: 400 });
    }

    await updateProjectStatus(id, newStatus);

    await writeLedgerEntry({
      projectId: id,
      actionType: "status_updated",
      oldValue: oldStatus,
      newValue: newStatus,
      changedBy: session.name,
      changedByRole: session.role === "admin" ? "admin" : "civil_servant",
      note: body.note?.trim() || null,
    });

    const msg = `Proiectul „${project.name}” a fost actualizat: ${statusLabel(oldStatus)} → ${statusLabel(newStatus)}.`;
    await notifyProjectSubscribers(id, msg);

    return NextResponse.json({ ok: true });
  });
}
