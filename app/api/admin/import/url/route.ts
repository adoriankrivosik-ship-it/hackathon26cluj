import { NextResponse } from "next/server";
import { extractProjectsFromUrl } from "@/lib/ai";
import { withAdminAuth } from "@/lib/api-auth";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  return withAdminAuth(async () => {
    const body = (await request.json()) as { url?: string };
    const url = body.url?.trim();

    if (!url || !/^https?:\/\//i.test(url)) {
      return NextResponse.json(
        { error: "Introduceți un URL valid (http/https)." },
        { status: 400 },
      );
    }

    try {
      const projects = await extractProjectsFromUrl(url);
      return NextResponse.json({
        projects,
        hint:
          projects.length === 0
            ? "Pagina a fost analizată, dar AI nu a identificat proiecte de investiții. Folosiți un link direct către HCL, buget sau fișă de proiect, sau încărcați PDF."
            : undefined,
      });
    } catch (e) {
      console.error("import/url:", e);
      return NextResponse.json(
        {
          error:
            e instanceof Error
              ? e.message
              : "Extragerea datelor a eșuat.",
        },
        { status: 500 },
      );
    }
  });
}
