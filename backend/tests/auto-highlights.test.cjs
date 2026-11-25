const test = require('node:test');
const assert = require('node:assert/strict');
// Run after npm run build. Stub quota + YouTube; no credentials or network required.
const { prisma } = require('../dist/src/lib/prisma');
const { isSuitableVideo, findHighlightForEvent } = require('../dist/src/lib/auto-highlights');
const channel='UCabcdefghijklmnopqrstuv';
const event={id:'test-event',title:'Benfica vs Porto',team_a:'Benfica',team_b:'Porto',scheduled_at:new Date('2026-11-24T18:00:00Z')};
const good=()=>({id:'ABcd1234_xY',snippet:{title:'Benfica vs Porto | Highlights',channelId:channel,channelTitle:'Canal de teste',publishedAt:'2026-11-24T21:00:00Z',liveBroadcastContent:'none'},status:{privacyStatus:'public',embeddable:true},contentDetails:{duration:'PT5M'}});
test('exige equipas, tipo de vídeo, data, canal, duração e incorporação',()=>{
 const v=good();assert.equal(isSuitableVideo(v,event,[channel]),true);
 for(const changed of [
  {...v,snippet:{...v.snippet,title:'Benfica vs Sporting | Highlights'}},
  {...v,snippet:{...v.snippet,title:'Benfica vs Porto | Preview Highlights'}},
  {...v,snippet:{...v.snippet,publishedAt:'2025-11-24T21:00:00Z'}},
  {...v,snippet:{...v.snippet,channelId:'UCxxxxxxxxxxxxxxxxxxxxxx'}},
  {...v,status:{privacyStatus:'public',embeddable:false}},
  {...v,contentDetails:{duration:'PT20S'}},
  {...v,snippet:{...v.snippet,liveBroadcastContent:'live'}},
 ])assert.equal(isSuitableVideo(changed,event,[channel]),false);
});
test('associa apenas um resultado inequívoco e válido; não publica resultados ambíguos',async()=>{
 const oldFetch=global.fetch;const oldQuery=prisma.$queryRawUnsafe;
 try{
  prisma.$queryRawUnsafe=async()=>[{requests:1}];let videos=[good()];
  global.fetch=async(url)=>{const u=new URL(url);if(u.pathname.endsWith('/search'))return Response.json({items:videos.map(v=>({id:{videoId:v.id},snippet:v.snippet}))});if(u.pathname.endsWith('/videos'))return Response.json({items:videos});throw Error('unexpected');};
  assert.equal((await findHighlightForEvent(event,'test-key',[channel],20)).id,good().id);
  videos=[good(),{...good(),id:'ZXcv9876_yZ'}];assert.equal(await findHighlightForEvent(event,'test-key',[channel],20),null);
  videos=[{...good(),status:{privacyStatus:'public',embeddable:false}}];assert.equal(await findHighlightForEvent(event,'test-key',[channel],20),null);
 }finally{global.fetch=oldFetch;prisma.$queryRawUnsafe=oldQuery;await prisma.$disconnect();}
});
