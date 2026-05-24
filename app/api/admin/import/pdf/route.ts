import { NextResponse } from "next/server";
import { extractProjectsFromPdfBase64 } from "@/lib/ai";
import { withAdminAuth } from "@/lib/api-auth";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  return withAdminAuth(async () => {
    const body = (await request.json()) as {
      base64?: string;
      fileName?: string;
    };

    if (!body.base64) {
      return NextResponse.json(
        { error: "Fișierul PDF lipsește." },
        { status: 400 },
      );
    }

    try {
      const projects = await extractProjectsFromPdfBase64(
        body.base64,
        body.fileName ?? "document.pdf",
      );
      return NextResponse.json({ projects });
    } catch (e) {
      console.error("import/pdf:", e);
      return NextResponse.json(
        {
          error:
            e instanceof Error
              ? e.message
              : "Extragerea din PDF a eșuat.",
        },
        { status: 500 },
      );
    }
  });
}
