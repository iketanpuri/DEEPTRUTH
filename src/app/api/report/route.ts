import { createEvidencePdf } from '@/lib/evidence-pdf';
export const runtime = 'nodejs';
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const body = await request.text();
    if (Buffer.byteLength(body, 'utf8') > 8 * 1024 * 1024) return Response.json({ error: 'This report is too large to export.' }, { status: 413 });
    let data;
    try { data = JSON.parse(body); } catch { return Response.json({ error: 'Invalid report data.' }, { status: 400 }); }
    if (!data || typeof data !== 'object' || Array.isArray(data) || typeof data.id !== 'string' || !('score' in data || 'evidenceScore' in data)) return Response.json({ error: 'A valid analysis result is required.' }, { status: 400 });
    const pdf = await createEvidencePdf(data);
    const filename = `deeptruth-evidence-${data.id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0,80) || 'report'}.pdf`;
    return new Response(new Uint8Array(pdf), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${filename}"`, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
  } catch (error) {
    console.error('Evidence PDF export failed:', error instanceof Error ? error.message : 'Unknown error');
    return Response.json({ error: 'The PDF could not be generated. Please retry.' }, { status: 500 });
  }
}
