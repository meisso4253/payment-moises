import html from '../../lib/planner-document';
export const dynamic = 'force-dynamic';
export async function GET() {
  return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; font-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"}});
}
