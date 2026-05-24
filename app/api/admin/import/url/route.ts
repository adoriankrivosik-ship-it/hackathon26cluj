import { NextResponse } from "next/server";
import { extractProjectsFromUrl } from "@/lib/ai";
import { withAdminAuth } from "@/lib/api-auth";

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
      return NextResponse.json({ projects });
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
