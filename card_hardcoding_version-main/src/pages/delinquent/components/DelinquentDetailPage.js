/* --------------------------------------------------------------------------
 *  📄 DelinquentDetailPage – 하드코딩 버전 / Hook-규칙 완전 준수
 *     · 모든 React Hook 은 컴포넌트 최상위에서 조건 없이 호출
 *     · rowData 가 없으면 “더미 고객”을 만들어 화면을 표시
 * -------------------------------------------------------------------------- */
import React, {
  useState, useMemo,
} from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { useLocation, useNavigate } from 'react-router-dom';

import CollectionLogList     from './CollectionLogList';
import RiskGroupDisplay      from './RiskGroupDisplay';
import CollectionActionForm  from './CollectionActionForm';

/* ────────────── 공통 상수 & 유틸 ────────────── */
const COLORS = ['#4e79a7','#f28e2b','#e15759','#76b7b2','#59a14f'];
const rand   = (min,max)=>Math.floor(Math.random()*(max-min+1))+min;
const formatCurrency = v => isNaN(v)?'-':`${Number(v).toLocaleString()}원`;
const formatPercent  = v => isNaN(v)?'-':`${parseFloat(v).toFixed(1)}%`;

/* Gauge 차트(SVG) */
const GaugeChart = ({ percent=0 })=>{
  const r=90, sw=15, C=Math.PI*r, prog=C*percent/100;
  return(
    <svg width="230" height="150" viewBox="0 0 200 120">
      <circle cx="100" cy="100" r={r} fill="none" stroke="#eee"
              strokeWidth={sw} strokeDasharray={`${C} ${C}`}
              transform="rotate(-180 100 100)"/>
      <circle cx="100" cy="100" r={r} fill="none" stroke="#007bff"
              strokeWidth={sw} strokeDasharray={`${prog} ${C-prog}`}
              transform="rotate(-180 100 100)" strokeLinecap="round"/>
      <text x="100" y="105" textAnchor="middle" fontSize="16">{percent}%</text>
      <text x="100" y="118" textAnchor="middle" fontSize="11" fill="#888">회수율</text>
    </svg>
  );
};
const InfoItem = ({label,value})=>(
  <div style={{
    display:'flex',justifyContent:'space-between',padding:'6px 12px',
    borderBottom:'1px solid #eee',fontSize:14}}>
    <span style={{color:'#666',fontWeight:500}}>{label}</span>
    <span style={{color:'#222'}}>{value}</span>
  </div>
);
const ChecklistItem = ({항목,완료,onToggle})=>(
  <div onClick={onToggle} style={{
    display:'flex',alignItems:'center',padding:'6px 10px',cursor:'pointer',
    background:완료?'#e6f4ff':'transparent',borderRadius:6,marginBottom:6}}>
    <input type="checkbox" readOnly checked={완료} style={{marginRight:10}}/>
    <span>{항목}</span>
  </div>
);

/* ────────────────────────── MAIN ────────────────────────── */
export default function DelinquentDetailPage(){

  /* 0) 라우팅 & 기본값 ------------------------------------------------ */
  const { state } = useLocation();
  const navigate  = useNavigate();
  const rowData   = state?.rowData ?? {
    /* ← rowData 가 없을 때 화면 확인용 더미 */
    기준월   : '2025-04',
    고객명   : '고객0',
    성별     : '남',
    연령     : '30대',
    연락처   : '010-0000-0000',
    주소     : '서울시 샘플구',
    연체기간  : '60~90일',
    연체금액  : 0,
    회수금액  : 0,
    회수율    : 0,
    member_id : 'DUMMY',
  };

  /* 의사-난수 seed (고객 ID 기반 → 고객마다 고정 패턴) */
  const seed = parseInt((rowData.member_id||'0').replace(/\D/g,''),10) || 1;
  const prng = (()=>{ let s=seed; return()=>{s=(s*9301+49297)%233280; return s/233280; };})();
  const rnd  = (min,max)=>Math.floor(prng()*(max-min+1))+min;

  /* 1) 12개월 라벨 --------------------------------------------------- */
  const monthLabels = useMemo(()=>{
    const [y,m] = rowData.기준월.split('-').map(Number);
    return Array.from({length:12},(_,i)=>{
      const d=new Date(y,m-1-i); return `${String(d.getFullYear()).slice(2)}-${String(d.getMonth()+1).padStart(2,'0')}`;
    }).reverse();
  },[rowData]);

  /* 2) 상단 복합 차트 데이터 ----------------------------------------- */
  const chartData = useMemo(()=>monthLabels.map(mon=>{
    const bars={
      카드론:rand(50,150)*10000, 일시불:rand(30,90)*10000,
      할부:rand(20,70)*10000,   리볼빙:rand(10,40)*10000,
      현금서비스:rand(15,60)*10000,
    };
    const 연체금액 = Object.values(bars).reduce((s,v)=>s+v,0);
    const 회수금액 = Math.round(연체금액*rand(20,80)/100);
    return {
      월:mon, ...bars,
      연체금액,
      회수금액,
      회수율:+(회수금액/연체금액*100).toFixed(1),
      연체율:+(rand(1,6)+Math.random()).toFixed(1),
    };
  }),[monthLabels]);

  /* 3) Radar 차트용 합계 --------------------------------------------- */
  const radarData = useMemo(()=>{
    const sum={카드론:0,일시불:0,할부:0,리볼빙:0,현금서비스:0};
    chartData.forEach(d=>Object.keys(sum).forEach(k=>sum[k]+=d[k]));
    return Object.keys(sum).map(k=>({
      name:k,
      연체금액:sum[k],
      회수금액:Math.round(sum[k]*rand(30,70)/100),
      회수횟수:rand(0,10),
    }));
  },[chartData]);

  /* 4) 상세 이력(최근 6개월) ----------------------------------------- */
  const historyRows = useMemo(()=>monthLabels.slice(-6).map(mon=>{
    const overdue=rand(100,600)*10000;
    const recov  = rand(0,overdue);
    return{
      month:mon,
      연체일수:rand(10,90),
      '연체 금액':overdue.toLocaleString(),
      '회수 금액':recov.toLocaleString(),
      '회수 상태':recov===0?'미회수':recov<overdue?'부분 회수':'회수 완료',
      '회수율':Math.round(recov/overdue*100),
      '한도 회복 여부':recov===overdue?(rand(0,1)?'회복':'한도 축소'):'변동 없음',
    };
  }),[monthLabels]);
  const overdueDays = historyRows[historyRows.length-1].연체일수;

  /* 5) 체크리스트 ----------------------------------------------------- */
  const [checkItems,setCheckItems] = useState([
    {항목:'연락처 확인',완료:false},
    {항목:'유선 독촉',완료:overdueDays>20},
    {항목:'문자 발송',완료:overdueDays>30},
    {항목:'내용증명',완료:false},
    {항목:'법적 절차 검토',완료:false},
  ]);
  const checklistProgress = Math.round(
    checkItems.filter(c=>c.완료).length / checkItems.length *100);
  const toggle = idx=>{
    setCheckItems(prev=>prev.map((c,i)=>i===idx?{...c,완료:!c.완료}:c));
  };

  /* 6) 나머지 UI 상태 ------------------------------------------------- */
  const [chartTab,setChartTab]=useState('gauge');  // gauge|pie|radar
  const [pageTab ,setPageTab ]=useState('history');
  const [expand  ,setExpand  ]=useState(false);
  const [riskGrp ,setRiskGrp ]=useState(null);

  /* 파생 데이터 ------------------------------------------------------- */
  const recoveryRate=parseFloat(rowData.회수율||0);
  const pieData=useMemo(()=>[
    {name:'카드론',value:chartData.reduce((s,d)=>s+d.카드론,0)},
    {name:'일시불',value:chartData.reduce((s,d)=>s+d.일시불,0)},
    {name:'할부',value:chartData.reduce((s,d)=>s+d.할부,0)},
    {name:'리볼빙',value:chartData.reduce((s,d)=>s+d.리볼빙,0)},
    {name:'현금서비스',value:chartData.reduce((s,d)=>s+d.현금서비스,0)},
  ],[chartData]);

  /* ───────────────────  Render  ─────────────────── */
  return(
    <div style={{padding:30,background:'#f8f9fa'}}>
      <div onClick={()=>navigate(-1)}
           style={{cursor:'pointer',marginBottom:20,fontSize:16,color:'#007bff'}}>
        ← 뒤로가기
      </div>

      {/* ───── 상단 복합 차트 ───── */}
      <div style={{background:'#fff',padding:20,borderRadius:10,marginBottom:30,height:260}}>
        <ResponsiveContainer>
          <ComposedChart data={chartData}>
            <CartesianGrid stroke="#eee"/>
            <XAxis dataKey="월"/>
            <YAxis yAxisId="left" tickFormatter={v=>v.toLocaleString()}/>
            <YAxis yAxisId="right" orientation="right" tickFormatter={v=>`${v}%`}/>
            <Tooltip formatter={(v,n)=>n.includes('율')?formatPercent(v):formatCurrency(v)}/>
            <Legend/>
            {['카드론','일시불','할부','리볼빙','현금서비스']
              .map((k,i)=><Bar key={k} yAxisId="left" dataKey={k} fill={COLORS[i]}/>)}
            <Line yAxisId="left"  dataKey="연체금액" stroke="#339af0" strokeWidth={2}/>
            <Line yAxisId="left"  dataKey="회수금액" stroke="#82c91e" strokeWidth={2}/>
            <Line yAxisId="right" dataKey="회수율"   stroke="#5c6f85" strokeWidth={2} strokeDasharray="4 2"/>
            <Line yAxisId="right" dataKey="연체율"   stroke="#ff6b6b" strokeWidth={2} strokeDasharray="4 2"/>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* ───── 1행 카드(3) ───── */}
      <div style={{display:'flex',gap:20,marginBottom:30}}>
        {/* 고객 정보 */}
        <div style={{flex:1,background:'#fff',borderRadius:10,padding:16}}>
          <h4>👤 고객 정보</h4>
          <InfoItem label="고객명" value={rowData.고객명}/>
          <InfoItem label="성별"   value={rowData.성별}/>
          <InfoItem label="연령"   value={rowData.연령}/>
          <InfoItem label="연락처" value={rowData.연락처}/>
          <InfoItem label="주소"   value={rowData.주소}/>
          <InfoItem label="기준월" value={rowData.기준월}/>
        </div>

        {/* 요약 */}
        <div style={{flex:1,background:'#fff',borderRadius:10,padding:16}}>
          <h4>📌 연체 및 회수 요약</h4>
          <InfoItem label="연체기간" value={rowData.연체기간}/>
          <InfoItem label="연체금액" value={formatCurrency(rowData.연체금액)}/>
          <InfoItem label="회수금액" value={formatCurrency(rowData.회수금액)}/>
          <InfoItem label="회수율"   value={formatPercent(recoveryRate)}/>
        </div>

        {/* 게이지 / Pie / Radar */}
        <div style={{flex:1}}>
          <div style={{display:'flex',justifyContent:'center',gap:10,
                       borderBottom:'1px solid #ccc',marginBottom:10}}>
            {['gauge','pie','radar'].map(k=>(
              <div key={k} onClick={()=>setChartTab(k)}
                   style={{
                     padding:8,cursor:'pointer',
                     borderBottom:chartTab===k?'3px solid #007bff':'none',
                     color:chartTab===k?'#007bff':'#888',fontWeight:'bold'}}>
                {k==='gauge'?'회수율':k==='pie'?'Pie':'Radar'}
              </div>
            ))}
          </div>
          <div style={{
            background:'#fff',padding:10,border:'1px solid #ccc',
            borderRadius:10,height:220,textAlign:'center'}}>
            {chartTab==='gauge' && <GaugeChart percent={recoveryRate}/>}

            {chartTab==='pie' && (
              <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:10,height:'100%'}}>
                <PieChart width={180} height={180}>
                  <Tooltip formatter={v=>formatCurrency(v)}/>
                  <Pie cx="50%" cy="50%" outerRadius={60} data={pieData} dataKey="value">
                    {pieData.map((e,i)=><Cell key={i} fill={COLORS[i]}/>)}
                  </Pie>
                </PieChart>
                <div style={{fontSize:12}}>
                  {pieData.map((e,i)=>(
                    <div key={i} style={{display:'flex',alignItems:'center',marginBottom:6}}>
                      <span style={{
                        width:10,height:10,background:COLORS[i],borderRadius:2,marginRight:6}}/>
                      {e.name}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {chartTab==='radar' && (
              <RadarChart cx="50%" cy="50%" outerRadius={80}
                          width={300} height={200} data={radarData}>
                <PolarGrid stroke="#dee2e6"/>
                <PolarAngleAxis dataKey="name" tick={{fontSize:11}}/>
                <PolarRadiusAxis angle={65} tick={{fontSize:12}}/>
                <Tooltip formatter={(v,n)=>{
                  if(n.includes('금액')) return [formatCurrency(v),n];
                  if(n==='회수횟수')     return [`${v}회`,n];
                  return [v,n];
                }}/>
                <Radar name="연체금액" dataKey="연체금액"
                       stroke="#339af0" fill="#339af0" fillOpacity={0.25}/>
                <Radar name="회수금액" dataKey="회수금액"
                       stroke="#82c91e" fill="#82c91e" fillOpacity={0.15} strokeWidth={3}/>
                <Radar name="회수횟수" dataKey="회수횟수"
                       stroke="#f06595" fill="#f06595" fillOpacity={0.2}/>
              </RadarChart>
            )}
          </div>
        </div>
      </div>

      {/* ───── 하단 언더라인 탭 ───── */}
      <div>
        <div style={{display:'flex',borderBottom:'2px solid #dee2e6',marginBottom:16}}>
          {[
            {k:'history',t:'📄 상세 연체/회수 내역'},
            {k:'log',    t:'📑 조치 이력'},
            {k:'risk',   t:'🚨 위험군 예측'},
            {k:'check',  t:'✅ 추심 체크리스트'},
            {k:'action', t:'📝 조치 입력'},
          ].map(tab=>(
            <button key={tab.k} onClick={()=>setPageTab(tab.k)}
                    style={{
                      padding:'10px 20px',border:'none',background:'transparent',cursor:'pointer',
                      fontWeight:'bold',
                      borderBottom:pageTab===tab.k?'3px solid #364fc7':'none',
                      color:pageTab===tab.k?'#364fc7':'#495057'}}>
              {tab.t}
            </button>
          ))}
        </div>

        {/* ── 상세 이력 ── */}
        {pageTab==='history' && (
          <div style={{
            background:'#fff',borderRadius:12,padding:16,fontSize:12,
            boxShadow:'0 4px 12px rgba(0,0,0,.08)',border:'1px solid #e0e0e0'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <h4 style={{margin:0,fontSize:15}}>📄 상세 연체/회수 내역</h4>
              <button onClick={()=>setExpand(!expand)}
                      style={{fontSize:12,background:'#edf2ff',border:'1px solid #91a7ff',
                              color:'#364fc7',borderRadius:5,padding:'4px 10px',cursor:'pointer'}}>
                {expand?'▲ 닫기':'▼ 전체 보기'}
              </button>
            </div>
            <table style={{width:'100%',borderCollapse:'collapse',marginTop:10}}>
              <thead>
                <tr style={{background:'#364fc7',color:'#fff',textAlign:'center'}}>
                  <th style={{padding:8}}>년/월</th><th>연체 기간</th><th>연체 금액</th>
                  <th>회수 금액</th><th>회수 상태</th><th>회수 율</th><th>한도 회복</th>
                </tr>
              </thead>
              <tbody>
                {(expand?historyRows:historyRows.slice(-1)).map((h,i)=>(
                  <tr key={i} style={{background:i%2?'#f8f9fa':'#fff',textAlign:'center'}}>
                    <td style={{padding:8}}>{h.month}</td>
                    <td>{h.연체일수}일</td>
                    <td>{h['연체 금액']}원</td>
                    <td>{h['회수 금액']}원</td>
                    <td>{h['회수 상태']}</td>
                    <td>{h['회수율']}%</td>
                    <td>{h['한도 회복 여부']}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── 체크리스트 ── */}
        {pageTab==='check' && (
          <div style={{background:'#fff',padding:20,borderRadius:10}}>
            <div style={{marginBottom:10,fontSize:14,fontWeight:600}}>
              ⏱ 연체 기간 : {overdueDays}일 &nbsp;&nbsp;
              진행률 : <span style={{color:'#3b82f6'}}>{checklistProgress}%</span>
            </div>
            <div style={{height:7,background:'#e2e8f0',borderRadius:5,marginBottom:16}}>
              <div style={{
                width:`${checklistProgress}%`,height:'100%',
                background:'linear-gradient(90deg,#3b82f6,#60a5fa)'}}/>
            </div>
            {checkItems.map((c,i)=>(
              <ChecklistItem key={i} {...c} onToggle={()=>toggle(i)}/>
            ))}
          </div>
        )}

        {/* ── 로그 / 위험군 / 조치 입력 : 원래 컴포넌트 재사용 ── */}
        {pageTab==='log'    && <CollectionLogList    memberId={rowData.member_id}/>}
        {pageTab==='risk'   && <RiskGroupDisplay     memberId={rowData.member_id} onPredicted={setRiskGrp}/>}
        {pageTab==='action' && <CollectionActionForm memberId={rowData.member_id} riskGroup={riskGrp}/>}
      </div>
    </div>
  );
}
