import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/api-auth";
import type { IssueStatusDb } from "@/lib/admin-types";
import { getIssueReportById, updateIssueReportStatus } from "@/lib/db";
import { writeLedgerEntry } from "@/lib/ledger";

const STATUSES: IssueStatusDb[] = ["open", "in_progress", "resolved"];

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return withAdminAuth(async (session) => {
    const { id } = await params;
    const report = await getIssueReportById(id);
    if (!report) {
      return NextResponse.json({ error: "Sesizare negăsită" }, { status: 404 });
    }

    const body = (await request.json()) as {
      status?: string;
      resolution_note?: string;
    };

    const newStatus = body.status as IssueStatusDb;
    if (!STATUSES.includes(newStatus)) {
      return NextResponse.json({ error: "Status invalid" }, { status: 400 });
    }

    const oldStatus = report.status ?? "open";
    await updateIssueReportStatus(id, newStatus, body.resolution_note);

    const actionType =
      newStatus === "resolved" ? "issue_resolved" : "issue_submitted";

    await writeLedgerEntry({
      projectId: null,
      actionType,
      oldValue: oldStatus,
      newValue: newStatus,
      changedBy: session.name,
      changedByRole: session.role === "admin" ? "admin" : "civil_servant",
      note: body.resolution_note?.trim() || report.title,
    });

    return NextResponse.json({ ok: true });
  });
}
