import {
  createCommunication,
  createComplianceRecord,
  createDocument,
  createReport,
  createTaxReport,
  createWorkflowRun,
} from "@/app/(app)/operations/actions";
import { PageHeader, SectionCard } from "@/components/ui/blocks";
import { SubmitButton } from "@/components/ui/submit-button";
import { requireActiveFund } from "@/lib/fund/active";
import { createClient } from "@/lib/supabase/server";

export default async function OperationsPage() {
  const { fundId } = await requireActiveFund();
  const supabase = await createClient();

  const [
    { data: documents },
    { data: reports },
    { data: compliance },
    { data: workflows },
    { data: communications },
    { data: taxReports },
    { data: fundInvestors },
    { data: investorProfiles },
  ] = await Promise.all([
    supabase.from("documents").select("id, title, visibility, created_at").eq("fund_id", fundId),
    supabase
      .from("reports")
      .select("id, report_type, period_start, period_end, status, created_at")
      .eq("fund_id", fundId)
      .order("created_at", { ascending: false }),
    supabase
      .from("compliance_records")
      .select("id, title, requirement_type, due_date, status")
      .eq("fund_id", fundId)
      .order("due_date", { ascending: true }),
    supabase
      .from("workflow_runs")
      .select("id, name, status, created_at")
      .eq("fund_id", fundId)
      .order("created_at", { ascending: false }),
    supabase
      .from("communications")
      .select("id, channel, title, audience_type, sent_at")
      .eq("fund_id", fundId)
      .order("created_at", { ascending: false }),
    supabase
      .from("tax_reports")
      .select("id, fund_investor_id, tax_year, status")
      .eq("fund_id", fundId)
      .order("tax_year", { ascending: false }),
    supabase.from("fund_investors").select("id, investor_id").eq("fund_id", fundId),
    supabase.from("investors").select("id, name"),
  ]);

  const investorNameById = new Map((investorProfiles ?? []).map((investor) => [investor.id, investor.name]));

  return (
    <div className="ui-page">
      <PageHeader
        title="Operations and Compliance"
        subtitle="Manage document controls, reporting, compliance, workflow automation, communications, and tax prep."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Document Management" subtitle="Upload files or add metadata; secure storage with visibility control">
          <form action={createDocument} className="flex flex-1 flex-col gap-4" encType="multipart/form-data">
            <div className="ui-form-grid two">
              <input className="ui-input xl:col-span-2" name="title" placeholder="Document title" required />
              <label className="xl:col-span-2 flex flex-col gap-1">
                <span className="text-sm text-[color:var(--text-secondary)]">File (optional — upload PDF, images, etc.)</span>
                <input className="ui-input max-w-md" type="file" name="file" accept=".pdf,.doc,.docx,.txt,.csv,image/*" />
              </label>
              <input className="ui-input" name="mime_type" defaultValue="application/pdf" placeholder="MIME type if no file" />
              <select className="ui-select" name="visibility" defaultValue="internal">
                <option value="internal">internal</option>
                <option value="investor_shared">investor_shared</option>
                <option value="restricted">restricted</option>
              </select>
            </div>
            <div className="mt-auto pt-2">
              <SubmitButton loadingText="Uploading…" className="w-full">Upload / Save Document</SubmitButton>
            </div>
          </form>
        </SectionCard>

        <SectionCard title="Financial Reporting" subtitle="Generate LP report runs">
          <form action={createReport} className="flex flex-1 flex-col gap-4">
            <div className="ui-form-grid two">
              <select className="ui-select xl:col-span-2" name="report_type" defaultValue="quarterly_summary">
                <option value="quarterly_summary">quarterly_summary</option>
                <option value="capital_activity">capital_activity</option>
                <option value="commitment_vs_contribution">commitment_vs_contribution</option>
              </select>
              <input className="ui-input" type="date" name="period_start" required />
              <input className="ui-input" type="date" name="period_end" required />
            </div>
            <div className="mt-auto pt-2">
              <SubmitButton loadingText="Queueing…" className="w-full">Queue Report</SubmitButton>
            </div>
          </form>
        </SectionCard>

        <SectionCard title="Compliance Monitoring" subtitle="Regulatory and operational obligations">
          <form action={createComplianceRecord} className="flex flex-1 flex-col gap-4">
            <div className="ui-form-grid two">
              <input className="ui-input xl:col-span-2" name="title" placeholder="Requirement title" required />
              <input className="ui-input" name="requirement_type" placeholder="Requirement type" required />
              <input className="ui-input" type="date" name="due_date" required />
              <select className="ui-select" name="status" defaultValue="open">
                <option value="open">open</option>
                <option value="in_review">in_review</option>
                <option value="resolved">resolved</option>
                <option value="overdue">overdue</option>
              </select>
              <textarea className="ui-textarea xl:col-span-2" name="notes" placeholder="Notes" />
            </div>
            <div className="mt-auto pt-2">
              <SubmitButton loadingText="Saving…" className="w-full">Save Compliance Record</SubmitButton>
            </div>
          </form>
        </SectionCard>

        <SectionCard title="Workflow Automation" subtitle="Track recurring process runs">
          <form action={createWorkflowRun} className="flex flex-1 flex-col gap-4">
            <div className="ui-form-grid">
              <input className="ui-input" name="name" placeholder="Workflow name" required />
              <input className="ui-input" name="source" placeholder="Trigger source" />
            </div>
            <div className="mt-auto pt-2">
              <SubmitButton loadingText="Queueing…" className="w-full">Queue Workflow</SubmitButton>
            </div>
          </form>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Communications" subtitle="Internal and investor-facing messages">
          <form action={createCommunication} className="flex flex-1 flex-col gap-4">
            <div className="ui-form-grid two">
              <select className="ui-select" name="channel" defaultValue="note">
                <option value="note">note</option>
                <option value="in_app">in_app</option>
                <option value="email">email</option>
              </select>
              <select className="ui-select" name="audience_type" defaultValue="internal">
                <option value="internal">internal</option>
                <option value="investor">investor</option>
                <option value="all">all</option>
              </select>
              <input className="ui-input xl:col-span-2" name="title" placeholder="Message title" required />
              <textarea className="ui-textarea xl:col-span-2" name="body" placeholder="Message body" required />
            </div>
            <div className="mt-auto pt-2">
              <SubmitButton loadingText="Sending…" className="w-full">Send Communication</SubmitButton>
            </div>
          </form>
        </SectionCard>

        <SectionCard title="Tax Reporting" subtitle="K-1 prep records per investor">
          <form action={createTaxReport} className="flex flex-1 flex-col gap-4">
            <div className="ui-form-grid two">
              <select className="ui-select xl:col-span-2" name="fund_investor_id" required>
                <option value="">Select investor</option>
                {(fundInvestors ?? []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {investorNameById.get(item.investor_id) ?? item.id}
                  </option>
                ))}
              </select>
              <input
                className="ui-input"
                type="number"
                name="tax_year"
                defaultValue={new Date().getFullYear()}
                required
              />
            </div>
            <div className="mt-auto pt-2">
              <SubmitButton loadingText="Creating…" className="w-full">Create Tax Report</SubmitButton>
            </div>
          </form>
        </SectionCard>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <SectionCard title="Documents" subtitle="Latest updates — download via secure link">
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Visibility</th>
                  <th>Download</th>
                </tr>
              </thead>
              <tbody>
                {(documents ?? []).map((document) => (
                  <tr key={document.id}>
                    <td>{document.title}</td>
                    <td>{document.visibility}</td>
                    <td>
                      <a
                        href={`/api/documents/${document.id}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ui-btn ui-btn-secondary inline-flex text-[13px] px-2 py-1"
                      >
                        Download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Reports" subtitle="Queue and delivery status">
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Period</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(reports ?? []).map((report) => (
                  <tr key={report.id}>
                    <td>{report.report_type}</td>
                    <td>
                      {report.period_start} to {report.period_end}
                    </td>
                    <td>{report.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Compliance" subtitle="Upcoming obligations">
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(compliance ?? []).map((record) => (
                  <tr key={record.id}>
                    <td>{record.title}</td>
                    <td>{record.due_date}</td>
                    <td>{record.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Workflow Runs" subtitle="Automation activity">
        <div className="ui-table-wrap">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Status</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {(workflows ?? []).map((workflow) => (
                <tr key={workflow.id}>
                  <td>{workflow.name}</td>
                  <td>{workflow.status}</td>
                  <td>{workflow.created_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Communications Log" subtitle="Messages sent to stakeholders">
        <div className="ui-table-wrap">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Channel</th>
                <th>Title</th>
                <th>Audience</th>
                <th>Sent At</th>
              </tr>
            </thead>
            <tbody>
              {(communications ?? []).map((communication) => (
                <tr key={communication.id}>
                  <td>{communication.channel}</td>
                  <td>{communication.title}</td>
                  <td>{communication.audience_type}</td>
                  <td>{communication.sent_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard title="Tax Report Queue" subtitle="Draft and delivered states">
        <div className="ui-table-wrap">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Investor Ref</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(taxReports ?? []).map((report) => (
                <tr key={report.id}>
                  <td>{report.tax_year}</td>
                  <td>{report.fund_investor_id.slice(0, 8)}</td>
                  <td>{report.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
