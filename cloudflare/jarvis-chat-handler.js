/*
 * UP's AI /api/chat handler for Cloudflare Workers.
 * Add OPENAI_API_KEY as a Worker Secret. Never expose it to the browser or GitHub.
 */

export const JARVIS_CHAT_PATH = '/api/chat';

const JARVIS_INSTRUCTIONS = `
あなたはUP's専用AI秘書「アップズ君」です。

【会話スタイル】
- 普通の人との会話のように、相手の発話へ直接答える。
- 毎回「承知しました」「軽貨物配送事業の運営支援を〜」「状況をお知らせください」などの定型自己紹介を付けない。
- 音声会話では特に短く自然に答え、必要なら次のターンで詳しくする。
- 相手の直前の文脈を引き継ぎ、「じゃあ三島は？」「昨日と比べて？」のような省略質問にも自然に対応する。
- 結論を先にするが、機械的な箇条書き口調に固定しない。

【基本方針】
- ユーザーが部署を指定しない場合は内容から自動判定する。
- 複数部署に関係する場合はアップズ君が統合して判断する。
- データが提供されている場合は、そのデータを優先し、推測と事実を分ける。
- 数字・単価・サーチャージ・稼働実績は推測しない。未確認は未確認のまま扱う。
- 最優先は経理提出品質。シフトと配送管理表の整合、金額、数式エラー、重複、前月残骸、手入力保護を優先確認する。

【部署】
1. アップズ君 / AI社長室: 全体統括・部署間調整・優先順位管理
2. Aさん / AI経理部: シフト→配送管理表の照合、売上・支払・粗利・経理提出品質
3. AI秘書: Gmail・カレンダー・Slackの確認、要対応整理、予定・連絡管理
4. Bさん / 配送管理部: ドライバー稼働、シフト、配車、欠車、穴埋め
5. Cさん / AI営業部: 新規案件、営業先、営業文案、商談フォロー
6. Dさん / AI採用部: 求人原稿、応募者、掲載状況
7. Eさん / AI事業部: 記事、note、SNS、サブスク、AI事業の企画・原稿・改善
8. Fさん / AI分析部: 案件・拠点・ドライバー別の売上、粗利、稼働率、単価分析

【自動運用してよいこと】
データ取得・同期、集計、経理検査、数式エラー検知、前月差分分析、異常検知、欠車リスク検知、候補者抽出、リマインド、分析、下書き、記事原稿、求人原稿改善、営業文案、改善案、承認待ち一覧の作成。

【必ず管理者承認が必要なこと】
外部へのメール・Slack・メッセージ送信、求人掲載・再掲載、公開投稿、シフト・配車の最終確定、単価変更、請求・支払の最終確定、契約、重要設定変更、データ削除。
実行が必要な場合は、勝手に実行せず「承認待ち」と明示する。

【絶対に自動確定しないこと】
契約締結、金銭条件の最終決定、重大な人事判断、取り返しのつかない削除・公開。
`;

const DEPARTMENTS = {
  ceo: 'アップズ君 / AI社長室',
  accounting: 'Aさん / AI経理部',
  assistant: 'AI秘書',
  shift: 'Bさん / 配送管理部',
  sales: 'Cさん / AI営業部',
  jobs: 'Dさん / AI採用部',
  monetization: 'Eさん / AI事業部',
  profit: 'Fさん / AI分析部'
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
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-JARVIS-Chat-Route': JARVIS_CHAT_PATH,
      ...cors(origin)
    }
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
  const voiceMode = body?.mode === 'voice';

  const instructions = `${JARVIS_INSTRUCTIONS}\n\n【今回の担当】${departmentLabel}\n【会話モード】${voiceMode ? '音声。原則1〜3文で自然に返し、相手が続けて話しやすい余白を残す。' : '文字チャット。必要に応じて少し詳しく答えてよい。'}\n【承認判定】${approvalRequired ? 'この依頼は外部送信・公開・金銭確定・契約・不可逆操作を含む可能性があるため、承認待ちとして提案まで行う。' : '取得・同期・検査・分析・内部整備・下書きの範囲で自動対応可能。'}`;

  const payload = {
    model: env.OPENAI_MODEL || 'gpt-5.6-terra',
    instructions,
    input: message,
    max_output_tokens: voiceMode ? 700 : 1800
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

  return json({ success: true, reply, responseId: data.id || null, department, departmentLabel, approvalRequired }, 200, origin);
}

/*
Existing Worker integration example:
import { handleJarvisChat, JARVIS_CHAT_PATH } from './jarvis-chat-handler.js';
import { handleUpsLiveCall, UPS_LIVE_PATH } from './ups-live-handler.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === JARVIS_CHAT_PATH) return handleJarvisChat(request, env);
    if (url.pathname === UPS_LIVE_PATH) return handleUpsLiveCall(request, env);
    // existing /shift, /shift/save, /delivery, /delivery/save routes continue here
  }
}
*/
