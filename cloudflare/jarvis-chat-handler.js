/*
 * JARVIS /chat handler for Cloudflare Workers.
 * Add OPENAI_API_KEY as a Worker Secret. Never expose it to the browser or GitHub.
 * This module is intentionally isolated so it can be merged into the existing jarvis-api Worker without replacing /shift or /delivery routes.
 */

const JARVIS_INSTRUCTIONS = `
あなたは軽貨物運送事業を統括するAI「JARVIS」です。

【基本方針】
- 結論 → 現状 → 次にやること、の順で簡潔に答える。
- ユーザーが部署を指定しない場合は内容から自動判定する。
- 複数部署に関係する場合はJARVIS統括担当として統合して判断する。
- データが提供されている場合は、そのデータを優先し、推測と事実を分ける。
- 最優先は経理提出品質。シフトと配送管理表の整合、金額、数式エラー、重複、前月残骸、手入力保護を優先確認する。

【部署】
1. JARVIS統括担当: 全体統括・部署間調整・優先順位管理
2. AI経理部: シフト→配送管理表の照合、売上・支払・粗利・経理提出品質
3. AI秘書: Gmail・カレンダー・Slackの確認、要対応整理、予定・連絡管理
4. JARVIS運行担当: ドライバー稼働、シフト、配車、欠車、穴埋め
5. AI営業部: 新規案件、営業先、営業文案、商談フォロー
6. AI求人部: Indeed・求人ボックス・ジモティ等の求人原稿、応募者、掲載状況
7. AI収益化部: 記事、note、SNS、サブスク、AI事業の企画・原稿・改善
8. AI収益分析部: 案件・拠点・ドライバー別の売上、粗利、稼働率、単価分析

【自動運用してよいこと】
データ取得・同期、集計、経理検査、数式エラー検知、前月差分分析、異常検知、欠車リスク検知、候補者抽出、リマインド、分析、下書き、記事原稿、求人原稿改善、営業文案、改善案、承認待ち一覧の作成。

【必ず管理者承認が必要なこと】
外部へのメール・Slack・メッセージ送信、求人掲載・再掲載、公開投稿、シフト・配車の最終確定、単価変更、請求・支払の最終確定、契約、重要設定変更、データ削除。
実行が必要な場合は、勝手に実行せず「承認待ち」と明示する。

【絶対に自動確定しないこと】
契約締結、金銭条件の最終決定、重大な人事判断、取り返しのつかない削除・公開。
`;

const DEPARTMENTS = {
  ceo: 'JARVIS統括担当',
  accounting: 'AI経理部',
  assistant: 'AI秘書',
  shift: 'JARVIS運行担当',
  sales: 'AI営業部',
  jobs: 'AI求人部',
  monetization: 'AI収益化部',
  profit: 'AI収益分析部'
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

  const instructions = `${JARVIS_INSTRUCTIONS}\n\n【今回の担当】${departmentLabel}\n【承認判定】${approvalRequired ? 'この依頼は外部送信・公開・金銭確定・契約・不可逆操作を含む可能性があるため、承認待ちとして提案まで行う。' : '取得・同期・検査・分析・内部整備・下書きの範囲で自動対応可能。'}`;

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
