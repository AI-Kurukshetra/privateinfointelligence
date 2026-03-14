import { PageHeader, SectionCard } from "@/components/ui/blocks";
import { requireActiveFund } from "@/lib/fund/active";
import { createClient } from "@/lib/supabase/server";

export default async function InvestorPortalPage() {
  const { fundId } = await requireActiveFund();
  const supabase = await createClient();

  const [{ data: docs }, { data: reports }, { data: calls }, { data: distributions }, { data: communications }] =
    await Promise.all([
      supabase
        .from("documents")
        .select("id, title, visibility, created_at")
        .eq("fund_id", fundId)
        .in("visibility", ["internal", "investor_shared"])
        .order("created_at", { ascending: false }),
      supabase
        .from("reports")
        .select("id, report_type, status, period_start, period_end, created_at")
        .eq("fund_id", fundId)
        .order("created_at", { ascending: false }),
      supabase
        .from("capital_calls")
        .select("id, title, due_date, total_amount, status")
        .eq("fund_id", fundId)
        .order("created_at", { ascending: false }),
      supabase
        .from("distributions")
        .select("id, title, payment_date, total_amount, status")
        .eq("fund_id", fundId)
        .order("created_at", { ascending: false }),
      supabase
        .from("communications")
        .select("id, channel, title, sent_at, audience_type")
        .eq("fund_id", fundId)
        .in("audience_type", ["investor", "all"])
        .order("created_at", { ascending: false }),
    ]);

  return (
    <section className="ui-page">
      <PageHeader
        title="Investor Portal"
        subtitle="LP access to reports, shared documents, capital notices, distributions, and communications."
      />

      <div className="grid gap-4 xl:grid-cols-2">
        <SectionCard title="Shared Documents" subtitle="Investor-accessible files">
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Document</th>
                  <th>Visibility</th>
                  <th>Created</th>
                  <th>Download</th>
                </tr>
              </thead>
              <tbody>
                {(docs ?? []).map((doc) => (
                  <tr key={doc.id}>
                    <td>{doc.title}</td>
                    <td>{doc.visibility}</td>
                    <td>{doc.created_at}</td>
                    <td>
                      <a
                        href={`/api/documents/${doc.id}/download`}
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

        <SectionCard title="Reports" subtitle="Statements and generated reports">
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Report</th>
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

        <SectionCard title="Capital Calls" subtitle="Active and historical notices">
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Due Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(calls ?? []).map((call) => (
                  <tr key={call.id}>
                    <td>{call.title}</td>
                    <td>{call.due_date}</td>
                    <td>{Number(call.total_amount).toLocaleString()}</td>
                    <td>{call.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        <SectionCard title="Distributions" subtitle="Payment history">
          <div className="ui-table-wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Payment Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {(distributions ?? []).map((distribution) => (
                  <tr key={distribution.id}>
                    <td>{distribution.title}</td>
                    <td>{distribution.payment_date}</td>
                    <td>{Number(distribution.total_amount).toLocaleString()}</td>
                    <td>{distribution.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Communications" subtitle="Investor-targeted updates">
        <div className="ui-table-wrap">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Channel</th>
                <th>Message</th>
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
    </section>
  );
}
