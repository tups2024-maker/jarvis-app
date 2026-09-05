/*
 * JARVIS /chat handler for Cloudflare Workers.
 * Add OPENAI_API_KEY as a Worker Secret. Never expose it to the browser or GitHub.
 * This module is intentionally isolated so it can be merged into the existing jarvis-api Worker without replacing /shift or /delivery routes.
 */

const JARVIS_INSTRUCTIONS = `
あなたは軽貨物運送事業を支援するAI社長「JARVIS」です。

【基本方針】
- 結論 → 現状 → 次にやること、の順で簡潔に答える。
- ユーザーが部署を指定しない場合は内容から自動判定する。
- 複数部署に関係する場合はJarvis社長として統合して判断する。
- データが提供されている場合は、そのデータを優先し、推測と事実を分ける。
- 情報不足の場合は不足を明示し、可能な範囲で提案する。

【部署】
1. Jarvis社長: 全体統括・意思決定支援
2. シフト・配送管理部: ドライバー稼働、シフト、配車、欠車、穴埋め
3. 営業部: 新規案件、営業先、営業文案、商談フォロー
4. 求人部: Indeed・求人ボックス・ジモティ等の求人原稿、応募者、掲載状況
5. 収益部: 案件・拠点・ドライバー別の売上、粗利、稼働率、単価分析

【自動運用してよいこと】
データ取得・同期、集計、分析、異常検知、欠車リスク検知、候補者抽出、リマインド、下書き、改善案、承認待ち一覧の作成。

【必ず管理者承認が必要なこと】
シフト確定変更、配車確定、外部へのメール・メッセージ送信、求人掲載・再掲載、単価変更、請求・支払確定、契約、重要設定変更、データ削除。
実行が必要な場合は、勝手に実行せず「承認待ち」と明示する。

【絶対に自動確定しないこと】
契約締結、金銭条件の最終決定、重大な人事判断、取り返しのつかない削除・公開。
`;

const DEPARTMENTS = {
  ceo: 'Jarvis社長',
  shift: 'シフト・配送管理部',
  sales: '営業部',
  jobs: '求人部',
  profit: '収益部'
};

function cors(origin) {
  const allowed = origin && (/^https:\/\/tups2024-maker\.github\.io$/i.test(origin) || /^https?:\/\/localhost(?::\d+)?$/i.test(origin));
  return {
    'Access-Control-Allow-Origin': allowed ? origin : 'https://tups2024-maker.github.io',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}

function json(data, status = 200, origin = '') {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...cors(origin) }
  });
}

function extractOutputText(payload) {
  if (typeof payload?.output_text === 'string' && payload.output_text.trim()) return payload.output_text.trim();
  const parts = [];
  for (const item of payload?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === 'output_text' && content?.text) parts.push(content.text);
    }
  }
  return parts.join('\n').trim();
}

export async function handleJarvisChat(request, env) {
  const origin = request.headers.get('Origin') || '';
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  if (request.method !== 'POST') return json({ success: false, error: 'Method not allowed' }, 405, origin);
  if (!env?.OPENAI_API_KEY) return json({ success: false, error: 'OPENAI_API_KEY is not configured' }, 503, origin);

  let body;
  try { body = await request.json(); }
  catch { return json({ success: false, error: 'Invalid JSON' }, 400, origin); }

  const message = String(body?.message || '').trim();
  if (!message) return json({ success: false, error: 'message is required' }, 400, origin);
  if (message.length > 12000) return json({ success: false, error: 'message is too long' }, 413, origin);

  const department = DEPARTMENTS[body?.department] ? body.department : 'ceo';
  const departmentLabel = DEPARTMENTS[department];
  const approvalRequired = !!body?.approvalRequired;

  const instructions = `${JARVIS_INSTRUCTIONS}\n\n【今回の担当】${departmentLabel}\n【承認判定】${approvalRequired ? 'この依頼は重要操作を含む可能性があるため、実行せず承認待ちとして提案まで行う。' : '情報取得・分析・提案の範囲で自動対応可能。'}`;

  const payload = {
    model: env.OPENAI_MODEL || 'gpt-5.6-terra',
    instructions,
    input: message,
    max_output_tokens: 1800
  };

  const previousResponseId = String(body?.previousResponseId || '').trim();
  if (previousResponseId) payload.previous_response_id = previousResponseId;

  const ai = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await ai.json().catch(() => ({}));
  if (!ai.ok) {
    console.error('OpenAI API error', ai.status, data?.error?.type || '', data?.error?.code || '');
    return json({ success: false, error: data?.error?.message || `OpenAI API ${ai.status}` }, 502, origin);
  }

  const reply = extractOutputText(data);
  if (!reply) return json({ success: false, error: 'Empty AI response' }, 502, origin);

  return json({
    success: true,
    reply,
    responseId: data.id || null,
    department,
    departmentLabel,
    approvalRequired
  }, 200, origin);
}

/*
Existing Worker integration example:

import { handleJarvisChat } from './jarvis-chat-handler.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/chat') return handleJarvisChat(request, env);
    // existing /shift, /shift/save, /delivery, /delivery/save routes continue here
  }
}
*/
