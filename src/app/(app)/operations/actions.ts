"use server";

import { revalidatePath } from "next/cache";

import { requireActiveFund } from "@/lib/fund/active";
import { createClient } from "@/lib/supabase/server";

const DOCUMENT_BUCKET = "fund-documents";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-").slice(0, 100) || "document";
}

export async function createDocument(formData: FormData) {
  const { fundId, user } = await requireActiveFund();
  const supabase = await createClient();
  const title = String(formData.get("title") ?? "").trim();
  const visibility = String(formData.get("visibility") ?? "internal");
  const file = formData.get("file");

  let storage_path: string;
  let mime_type: string;

  if (file instanceof File && file.size > 0) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "bin";
    const baseName = sanitizeFileName(file.name.slice(0, -(ext.length + 1)));
    storage_path = `fund/${fundId}/${Date.now()}-${baseName}.${ext}`;
    mime_type = file.type || "application/octet-stream";

    const { error: uploadError } = await supabase.storage
      .from(DOCUMENT_BUCKET)
      .upload(storage_path, file, { contentType: mime_type, upsert: false });

    if (uploadError) {
      console.error("Document upload failed:", uploadError);
      throw new Error("Upload failed: " + uploadError.message);
    }
  } else {
    storage_path = `fund/${fundId}/${Date.now()}-${title.toLowerCase().replace(/\s+/g, "-")}.pdf`;
    mime_type = String(formData.get("mime_type") ?? "application/pdf");
  }

  await supabase.from("documents").insert({
    fund_id: fundId,
    title,
    storage_path,
    mime_type,
    visibility,
    created_by: user.id,
  });

  revalidatePath("/operations");
  revalidatePath("/portal");
}

export async function getDocumentDownloadUrl(documentId: string): Promise<{ url: string } | { error: string }> {
  const { fundId } = await requireActiveFund();
  const supabase = await createClient();

  const { data: doc, error: fetchError } = await supabase
    .from("documents")
    .select("id, fund_id, storage_path")
    .eq("id", documentId)
    .single();

  if (fetchError || !doc || doc.fund_id !== fundId) {
    return { error: "Document not found or access denied." };
  }

  const { data: signed, error: signError } = await supabase.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrl(doc.storage_path, 60);

  if (signError || !signed?.signedUrl) {
    return { error: "Could not generate download link." };
  }
  return { url: signed.signedUrl };
}

export async function createReport(formData: FormData) {
  const { fundId, user } = await requireActiveFund();
  const supabase = await createClient();

  await supabase.from("reports").insert({
    fund_id: fundId,
    report_type: String(formData.get("report_type") ?? "quarterly_summary"),
    period_start: String(formData.get("period_start") ?? ""),
    period_end: String(formData.get("period_end") ?? ""),
    status: "queued",
    created_by: user.id,
  });

  revalidatePath("/operations");
  revalidatePath("/portal");
}

export async function createComplianceRecord(formData: FormData) {
  const { fundId, user } = await requireActiveFund();
  const supabase = await createClient();

  await supabase.from("compliance_records").insert({
    fund_id: fundId,
    title: String(formData.get("title") ?? "").trim(),
    requirement_type: String(formData.get("requirement_type") ?? "").trim(),
    due_date: String(formData.get("due_date") ?? ""),
    status: String(formData.get("status") ?? "open"),
    owner_user_id: user.id,
    notes: String(formData.get("notes") ?? "").trim() || null,
  });

  revalidatePath("/operations");
  revalidatePath("/dashboard");
}

export async function createWorkflowRun(formData: FormData) {
  const { fundId, user } = await requireActiveFund();
  const supabase = await createClient();

  await supabase.from("workflow_runs").insert({
    fund_id: fundId,
    name: String(formData.get("name") ?? "").trim(),
    status: "queued",
    input: {
      source: String(formData.get("source") ?? "manual"),
    },
    triggered_by: user.id,
  });

  revalidatePath("/operations");
}

export async function createCommunication(formData: FormData) {
  const { fundId, user } = await requireActiveFund();
  const supabase = await createClient();

  await supabase.from("communications").insert({
    fund_id: fundId,
    channel: String(formData.get("channel") ?? "note"),
    title: String(formData.get("title") ?? "").trim(),
    body: String(formData.get("body") ?? "").trim(),
    audience_type: String(formData.get("audience_type") ?? "internal"),
    sent_at: new Date().toISOString(),
    created_by: user.id,
  });

  revalidatePath("/operations");
  revalidatePath("/portal");
}

export async function createTaxReport(formData: FormData) {
  const { fundId } = await requireActiveFund();
  const supabase = await createClient();

  await supabase.from("tax_reports").insert({
    fund_id: fundId,
    fund_investor_id: String(formData.get("fund_investor_id") ?? ""),
    tax_year: Number(formData.get("tax_year") ?? new Date().getFullYear()),
    status: "draft",
  });

  revalidatePath("/operations");
}
