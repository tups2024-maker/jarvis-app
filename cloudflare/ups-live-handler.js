export const UPS_LIVE_PATH='/api/realtime/call';

const INSTRUCTIONS=`あなたはUP's専用AI秘書「アップズ君」です。日本語で自然な会話をしてください。機械的な定型文や毎回同じ自己紹介はしません。普通の人との会話のように相手の発話に直接答えてください。返答はまず短く自然に。必要なら続けて詳しく説明します。相手が途中で話し始めたら止まり、相手の発話を優先します。軽貨物配送事業では、配送・シフト・欠車・売上利益・営業・採用・経営分析を支援します。事実と未確認事項を分け、数字を推測しません。外部送信、公開、金銭確定、契約、シフト最終確定など重要操作は承認待ちにします。`;

function cors(origin){
  const allowed=origin&&(/^https:\/\/tups2024-maker\.github\.io$/i.test(origin)||/^https?:\/\/localhost(?::\d+)?$/i.test(origin));
  return {
    'Access-Control-Allow-Origin':allowed?origin:'https://tups2024-maker.github.io',
    'Access-Control-Allow-Methods':'POST,OPTIONS',
    'Access-Control-Allow-Headers':'Content-Type',
    'Access-Control-Max-Age':'86400',
    'Vary':'Origin'
  };
}

export async function handleUpsLiveCall(request,env){
  const origin=request.headers.get('Origin')||'';
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors(origin)});
  if(request.method!=='POST')return new Response('Method not allowed',{status:405,headers:cors(origin)});
  if(!env?.OPENAI_API_KEY)return new Response('OPENAI_API_KEY is not configured',{status:503,headers:cors(origin)});

  let body;
  try{body=await request.json()}catch{return new Response('Invalid JSON',{status:400,headers:cors(origin)})}
  const sdp=String(body?.sdp||'').trim();
  if(!sdp.startsWith('v='))return new Response('Invalid SDP',{status:400,headers:cors(origin)});

  const session={
    type:'realtime',
    model:env.OPENAI_REALTIME_MODEL||'gpt-realtime-1.5',
    instructions:INSTRUCTIONS,
    output_modalities:['audio'],
    audio:{
      input:{turn_detection:{type:'server_vad',create_response:true,interrupt_response:true}},
      output:{voice:env.OPENAI_REALTIME_VOICE||'marin'}
    },
    max_output_tokens:1200
  };

  const form=new FormData();
  form.append('sdp',new Blob([sdp],{type:'application/sdp'}),'offer.sdp');
  form.append('session',new Blob([JSON.stringify(session)],{type:'application/json'}),'session.json');

  const r=await fetch('https://api.openai.com/v1/realtime/calls',{
    method:'POST',
    headers:{'Authorization':`Bearer ${env.OPENAI_API_KEY}`},
    body:form
  });

  const text=await r.text();
  if(!r.ok){
    console.error('Realtime call error',r.status,text.slice(0,1000));
    return new Response(JSON.stringify({success:false,status:r.status,error:text.slice(0,1000)}),{
      status:502,
      headers:{...cors(origin),'Content-Type':'application/json; charset=UTF-8','Cache-Control':'no-store'}
    });
  }

  return new Response(text,{
    status:201,
    headers:{'Content-Type':'application/sdp','Cache-Control':'no-store',...cors(origin)}
  });
}

/*
Worker routing example:
import {handleUpsLiveCall,UPS_LIVE_PATH} from './ups-live-handler.js';
const url=new URL(request.url);
if(url.pathname===UPS_LIVE_PATH)return handleUpsLiveCall(request,env);
*/