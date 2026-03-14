import { NextResponse } from "next/server";

import { getDocumentDownloadUrl } from "@/app/(app)/operations/actions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing document id" }, { status: 400 });
  }
  const result = await getDocumentDownloadUrl(id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 403 });
  }
  return NextResponse.redirect(result.url, 302);
}
