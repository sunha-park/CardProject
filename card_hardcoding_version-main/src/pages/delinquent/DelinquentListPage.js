/* --------------------------------------------------------------------------
 *  DelinquentListPage – 완전 하드코딩 버전 (모든 기능 포함)
 *  ▸ “분기‧반기‧연간 연체율 과다” 버그 → 평균 계산으로 수정
 * -------------------------------------------------------------------------- */
import React, { useState, useMemo, useEffect } from 'react';
import { AgGridReact }   from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { useNavigate }   from 'react-router-dom';
import DelinquentDetailModal from './components/DelinquentDetailModal';

/* mock 데이터 */
import {
  mockLineData, mockBarData, mockPieData, mockRadarData,
  mockTableData, mockRecoveryPieData,
  months16, termGroups,TOTAL_CUSTOMERS,
} from '../../mock/delinquentMockData';

/* recharts */
import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
  PieChart, Pie, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ReferenceLine,
} from 'recharts';

/* ────────────── 상수 & 유틸 ────────────── */
const COLORS   = ['#66C2A5','#FC8D62','#FFD92F','#8DA0CB','#E78AC3','#A6D854'];
const BAR_COL  = ['#7BC8A4','#FFD76A','#FFA5A5','#BFA5FF','#8EC6FF'];
const barColor = i => BAR_COL[i % BAR_COL.length];
const CATS     = ['카드론','일시불','할부','리볼빙','대출'];
const money    = v => v != null ? `${Number(v).toLocaleString()}원` : '0원';


  const makeLabel = (ym, type) => {
   if (!ym) return '';                    // ← 가드 추가
   const [y, m] = ym.split('-').map(Number);
  if (type === '월간') return ym;
  if (type === '분기') return `${y} Q${Math.ceil(m / 3)}`;
  if (type === '반기') return `${y}-H${m <= 6 ? 1 : 2}`;
  return String(y);          // 연간
};
/* ────────────────────────────────────────── */

export default function DelinquentListPage () {
  const navigate = useNavigate();

  /* ① 화면 상태 ---------------------------------------------------- */
  const [activeBox,   setActiveBox]   = useState('period');
  const [rangeTab,    setRangeTab]    = useState('월간');
  const [termTab,     setTermTab]     = useState(termGroups[0]);
  const [chartTab,    setChartTab]    = useState('area');
  const [pieRadarTab, setPieRadarTab] = useState('pie');
  const [searchTerm,  setSearchTerm]  = useState('');

  /* ② 드롭다운/모달 전용 ------------------------------------------ */
  const [pieKey,        setPieKey]        = useState(months16[0]);
  const [recoveryMonth, setRecoveryMonth] = useState('2025-04');
  const [ageGroup,      setAgeGroup]      = useState('20대');
  const [radarPeriod,   setRadarPeriod]   = useState('2025-04');
  const [modal, setModal] = useState({open:false,period:'',detail:{}});

  /* ③ 테이블 필터 -------------------------------------------------- */
  const [statusFilter, setStatusFilter] = useState({
    noRecovery:false, partialRecovery:false, fullRecovery:false,
  });
  const [sortBy, setSortBy] = useState('none');

  /* ────────── 1. 기간별 집계 (월/분기/반기/연간) ──────────
     ※ “합계 → 평균” 로직으로 수정 (lnCnt · brCnt 추가)                */
  const periodAgg = useMemo(() => {
    const ln={}, lnCnt={}, br={}, brCnt={}, pi={};

    /* line (연체율) ------------------------------------------------- */
    mockLineData.forEach(d=>{
      if(!('연체율' in d)) return;                 // 회수율 샘플 제외
      const k = makeLabel(d.기간, rangeTab);
      ln[k]    = (ln[k]    ?? 0) + d.연체율;
      lnCnt[k] = (lnCnt[k] ?? 0) + 1;
    });

    /* bar (평균 연체금액) ------------------------------------------ */
    mockBarData.forEach(d=>{
      if(!('avgAmount' in d)) return;             // 회수 바 제외
      const k = makeLabel(d.기간, rangeTab);
      const o = br[k] ?? (br[k] = {기간:k});
      o[d.category]  = (o[d.category] ?? 0) + d.avgAmount;
      brCnt[k]       = (brCnt[k] ?? 0) + 1;
    });

    /* pie (연체 인원) ---------------------------------------------- */
    mockPieData.forEach(p=>{
      const k = makeLabel(p.name, rangeTab);
      pi[k] = (pi[k] ?? 0) + p.value;
    });

    /* ▶︎ 평균값 반영 --------------------------------------------- */
    Object.keys(br).forEach(key=>{
      CATS.forEach(cat=>{
        br[key][cat] = +(br[key][cat] / brCnt[key]).toFixed(0);
      });
    });

    return {
      line : Object.entries(ln).map(([기간,sum])=>{
        const avg = sum / lnCnt[기간];
        return { 기간, 연체율:+avg.toFixed(2) };
      }),
      bar  : Object.values(br),
      pie  : Object.entries(pi).map(([name,value])=>({name,value})),
      keys : Object.keys(pi),
    };
  },[rangeTab]);


/* ────────── 2-b. 회수율 LineChart용 (10일 단위 버킷) ────────── */
const recDaysLine = useMemo(() => {
  const buckets = {};                // { 0:{sum,cnt}, 10:{…}, … 90:{…} }

  mockLineData.forEach(d => {
    if (!('연체일수' in d)) return;   // 기간 모드 샘플 건너뜀
    const key = Math.min(90, Math.floor(d.연체일수 / 10) * 10); // 0,10,…90
    const label = `${key}~${key + 9}일`;

    if (!buckets[key]) buckets[key] = { label, sum: 0, cnt: 0 };
    buckets[key].sum += d.회수율;
    buckets[key].cnt += 1;
  });

  return Object.values(buckets)
    .map(b => ({
      연체일구간: b.label,
      회수율: +(b.sum / b.cnt).toFixed(2),
    }))
    .sort((a, b) => parseInt(a.연체일구간) - parseInt(b.연체일구간));
}, []);

 /* ────────── 2-c. 회수율 BarChart용 배열 ────────── */
 const recBar = useMemo(
   () => mockBarData.filter(b => b.연체일구간 === termTab),
   [termTab]
 );


  /* ────────── 3. Radar 필터 ────────── */
  const radarPeriods = useMemo(()=>{
    const s=new Set();
    mockRadarData.forEach(r=>r.age_group===ageGroup&&s.add(r.period));
    return [...s];
  },[ageGroup]);
  useEffect(()=>{ if(radarPeriods.length) setRadarPeriod(radarPeriods[0]); },[radarPeriods]);

  const radarData = useMemo(()=>{
    const g={};
    mockRadarData
      .filter(r=>r.period===radarPeriod&&r.age_group===ageGroup)
      .forEach(r=>{
        const o=g[r.category]??(g[r.category]={category:r.category,남:0,여:0});
        o[r.gender]=r.value;
      });
    return Object.values(g);
  },[radarPeriod,ageGroup]);
  const radarMax = useMemo(
    ()=>Math.max(...radarData.flatMap(r=>[r.남,r.여]),10),[radarData]);

    /* 2-d. 기간 모드 집계표용 summaryRows ----------------------------- */
    const summaryRows = useMemo(() => {
        // ▸ 월·분기·반기·연간별 연체자 수 맵
  const delinMap = Object.fromEntries(
    periodAgg.pie.map(p => [p.name, p.value])   // { '2024-01': 123, … }
  );
      // periodAgg.bar 는 [{기간:'2024-01', 카드론:…, 일시불:…}, …] 구조
      return periodAgg.bar.map(row => {
        const overdueSum = CATS.reduce((s,cat) => s + row[cat], 0);
        const delinCnt  = delinMap[row.기간] ?? 0;   // 해당 집계단위 연체자 수
        return {
          name: row.기간,                   // '기간 집계 단위'
          term : `${delinCnt.toLocaleString()} / ${TOTAL_CUSTOMERS.toLocaleString()}`,
          ...CATS.reduce((obj,cat) => ({
            ...obj,
            [`${cat.toLowerCase()}_avg`]: row[cat],
            [`${cat.toLowerCase()}_sum`]: row[cat] * 12  // 예시 합계
          }), {}),
          overdue_amt_avg: overdueSum / CATS.length | 0,
          overdue_amt_sum: overdueSum,
          amount: periodAgg.line.find(l => l.기간 === row.기간)?.연체율 ?? 0
        };
      });
    }, [periodAgg]);
  /* ────────── 5. 회수율 테이블 필터 ────────── */
  const tableRows = useMemo(() => {
  let arr = activeBox === 'period'
              ? summaryRows           // ← 집계표 행
              : mockTableData.filter(t => t.연체기간 === termTab);

    /* 검색 */
    const kw=searchTerm.trim().toLowerCase();
    if(kw) arr=arr.filter(r=>Object.values(r)
      .some(v=>(v??'').toString().toLowerCase().includes(kw)));

    /* 상태 */
    const chk=Object.entries(statusFilter).filter(([,c])=>c).map(([k])=>k);
    if(chk.length){
      arr=arr.filter(r=>{
        const rt=Math.round(r.회수율);
        if(rt===0   && chk.includes('noRecovery'))      return true;
        if(rt>0&&rt<100 && chk.includes('partialRecovery')) return true;
        if(rt===100 && chk.includes('fullRecovery'))    return true;
        return false;
      });
    }
    /* 정렬 */
    if      (sortBy==='overdue')   arr.sort((a,b)=>b.연체금액 - a.연체금액);
    else if (sortBy==='recovered') arr.sort((a,b)=>b.회수금액 - a.회수금액);
    else if (sortBy==='rate')      arr.sort((a,b)=>b.회수율   - a.회수율);
    return arr;
  }, [activeBox, termTab, searchTerm, statusFilter, sortBy]);


  /* ────────── 6. AG-Grid 컬럼 ────────── */
  const colDefs = useMemo(()=>{
    if(activeBox==='recovery'){
      return [
        {headerName:'기준 월',field:'기준월'},
        {headerName:'고객명',field:'고객명'},
        {headerName:'성별',field:'성별'},
        {headerName:'연령',field:'연령'},
        {headerName:'연락처',field:'연락처'},
        {headerName:'주소',field:'주소'},
        {headerName:'연체기간',field:'연체기간'},
        {headerName:'연체금액',field:'연체금액',valueFormatter:p=>money(p.value)},
        {headerName:'회수금액',field:'회수금액',valueFormatter:p=>money(p.value)},
        {headerName:'회수율',field:'회수율',valueFormatter:p=>`${p.value}%`},
      ];
    }
    return [
      {headerName:'기간 집계 단위',field:'name'},
      {headerName:'연체 고객 / 총 고객',field:'term'},
      ...CATS.map(cat=>({
        headerName:`${cat}(평균/총액)`,
        valueGetter:p=>{
          const avg=money(p.data[`${cat.toLowerCase()}_avg`]);
          const sum=money(p.data[`${cat.toLowerCase()}_sum`]);
          return `${avg} / ${sum}`;
        },
      })),
      {headerName:'연체금액(평균/총액)',valueGetter:p=>{
        const avg=money(p.data.overdue_amt_avg);
        const sum=money(p.data.overdue_amt_sum);
        return `${avg} / ${sum}`;
      }},
      {headerName:'연체 율(%)',field:'amount',
       valueFormatter:p=>p.value!=null?`${p.value}%`:'0%'},
    ];
  },[activeBox]);

  /* ────────── 7. Bar 툴팁 ────────── */
  const BarTip = ({active,payload,label})=>{
    if(!(active&&payload&&payload.length)) return null;
    return (
      <div style={{background:'#fff',border:'1px solid #ccc',padding:8,fontSize:12}}>
        <strong>{label}</strong>
        {payload.map((pl,i)=>{
          const txt = pl.name.includes('회수율')
            ? `${Math.round(pl.value)}%`
            : `₩ ${Math.round(pl.value).toLocaleString()}`;
          return <div key={i} style={{color:pl.color}}>{pl.name} : {txt}</div>;
        })}
      </div>
    );
  };

  /* ───────────────────────────── 렌더링 ───────────────────────────── */
  return (
    <div className="delinquent-page">

      {/* ▸ 1. 상단 탭 */}
      <div style={{display:'flex',gap:40,marginBottom:20}}>
        <RangeTab
          active={activeBox==='period'} title="📅 기간 별 조회"
          items={['월간','분기','반기','연간']}
          value={rangeTab}
          onClick={()=>setActiveBox('period')}
          setValue={v=>{setRangeTab(v);setPieKey('');}} />
        <RangeTab
          active={activeBox==='recovery'} title="💳 추심 회수율"
          items={termGroups}
          value={termTab}
          onClick={()=>setActiveBox('recovery')}
          setValue={setTermTab}/>
      </div>

      {/* ▸ 2. 차트 영역 */}
      <div style={{display:'flex',gap:20}}>
        {/* 좌측 Line/Bar */}
        <div style={{flex:2}}>
          <ChartTabs
            tab={chartTab} setTab={setChartTab}
            labels={activeBox==='period'
              ? ['📈 연체율 추이','📊 자금유형별 평균 연체금액']
              : ['📈 연체 회수율','📊 회수 비율 비교']}
            keys={['area','bar']} />

          {/* 회수율 모드 기준 월 선택 */}
          {activeBox==='recovery' && (
            <div style={{textAlign:'right',fontSize:12,marginBottom:4}}>
              기준 월&nbsp;
              <select value={recoveryMonth}
                      onChange={e=>setRecoveryMonth(e.target.value)}>
                {months16.map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
          )}

          <div style={{height:260}}>
            <ResponsiveContainer>
              {chartTab==='area'?(
                /* LineChart */
                <LineChart
                  data={activeBox==='period'?periodAgg.line:recDaysLine}
                  margin={{top:25,right:30,bottom:30,left:10}}>
                  <CartesianGrid strokeDasharray="3 3"/>
                  <XAxis dataKey={activeBox==='period' ? '기간' : '연체일구간'} />
                  <YAxis domain={activeBox==='period'?[0,7]:[0,100]}
                         tickFormatter={v=>`${v}%`}/>
                  <Tooltip/><Legend/>
                  <Line type="monotone"
                        dataKey={activeBox==='period'?'연체율':'회수율'}
                        stroke="#ffa8a8" strokeWidth={2} dot={{r:3}}/>
                  {activeBox==='period'
                    ? [[1,'#339af0','≤1%'],[3,'#f59f00','3%'],[5,'#fa5252','≥5%']]
                        .map(([y,c,l])=>(
                          <ReferenceLine key={y} y={y} stroke={c} strokeDasharray="4 4"
                            label={{position:'insideTopRight',value:l,fill:c,fontSize:11}}/>))
                    : [[70,'#51cf66','≥70%'],[40,'#ff922b','≤40%']]
                        .map(([y,c,l])=>(
                          <ReferenceLine key={y} y={y} stroke={c} strokeDasharray="3 3"
                            label={{position:'insideTopRight',value:l,fill:c,fontSize:11}}/>))}
                </LineChart>
              ):(
                /* BarChart */
                <BarChart
                  data={activeBox==='period'
                          ? periodAgg.bar
                          : recBar.filter(b=>b.기준월===recoveryMonth)}
                  margin={{top:15,right:5,bottom:25,left:25}}
                  onClick={({activeLabel})=>{
                    if(!activeLabel) return;
                    if(activeBox==='period'){
                      const list=mockBarData.filter(
                        x=>makeLabel(x.기간,rangeTab)===activeLabel);
                      const det={}; list.forEach(v=>det[v.category]=v.avgAmount);
                      setModal({open:true,period:activeLabel,detail:det});
                    }else{
                      const row=recBar.find(
                        r=>r.기준월===recoveryMonth && r.category===activeLabel);
                      if(!row) return;
                      setModal({
                        open:true,period:activeLabel,
                        detail:{연체금액:row.연체금액,회수금액:row.회수금액,회수율:row.회수율},
                      });
                    }
                  }}>
                  <CartesianGrid strokeDasharray="3 3"/>
                  <XAxis dataKey={activeBox==='period'?'기간':'category'}/>
                  <YAxis yAxisId="left" tickFormatter={v=>v.toLocaleString()}/>
                  <YAxis yAxisId="right" orientation="right" domain={[0,100]}/>
                  <Tooltip content={<BarTip/>}/><Legend/>
                  {activeBox==='period'
                    ? CATS.map((c,i)=>(
                        <Bar key={c} dataKey={c} fill={barColor(i)}
                             yAxisId="left" barSize={26}/>))
                    : <>
                        <Bar dataKey="연체금액" fill="#ffa8a8" yAxisId="left"/>
                        <Bar dataKey="회수금액" fill="#74c0fc" yAxisId="left"/>
                        <Bar dataKey="회수율"   fill="#63e6be" yAxisId="right"/>
                      </>}
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* 우측 Pie/Radar */}
        <div style={{flex:1}}>
          <ChartTabs
            tab={pieRadarTab} setTab={setPieRadarTab}
            labels={activeBox==='period'
              ? ['🥧 연체 인원','🕸 연령별 소비 분포']
              : ['🥧 회수 인원','🕸 독촉 회수 분포']}
            keys={['pie','radar']} />

          {/* Pie 드롭다운(기간) */}
          
          {/* Pie 드롭다운(회수율) */}
          {pieRadarTab==='pie' && activeBox==='recovery' && (
            <div style={{textAlign:'right',fontSize:12,marginBottom:4}}>
              <select value={recoveryMonth}
                      onChange={e=>setRecoveryMonth(e.target.value)}>
                {months16.map(m=><option key={m}>{m}</option>)}
              </select>
            </div>
          )}
          {/* Radar 드롭다운 */}
          {pieRadarTab==='radar' && (
            <div style={{textAlign:'right',fontSize:12,marginBottom:4}}>
              <select value={ageGroup} onChange={e=>setAgeGroup(e.target.value)}>
                {['20대','30대','40대','50대','60대','70대'].map(a=>
                  <option key={a}>{a}</option>)}
              </select>&nbsp;
              <select value={radarPeriod} onChange={e=>setRadarPeriod(e.target.value)}>
                {radarPeriods.map(p=><option key={p}>{p}</option>)}
              </select>
            </div>
          )}

          <div style={{height:260}}>
            <ResponsiveContainer>
              {pieRadarTab==='pie'?(
                activeBox==='period'?(
                  <PieChart>
                    <Pie data={periodAgg.pie} dataKey="value"
                         cx="40%" cy="50%" outerRadius={70}>
                      {periodAgg.pie.map((_,i)=>
                        <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                    </Pie>
                    <Tooltip formatter={(v,n)=>[`${v}명`,n]}/>
                    {/* ▶ 2열 범례 */}
                    <Legend
                      layout="vertical" align="right" verticalAlign="middle"
                      content={({payload})=>(
                        <ul style={{
                          listStyle:'none',margin:0,padding:0,
                          display:'grid',gridTemplateColumns:'repeat(2,auto)',
                          rowGap:4,columnGap:12,fontSize:12,
                        }}>
                          {payload.map((p,i)=>(
                            <li key={i} style={{display:'flex',alignItems:'center'}}>
                              <span style={{
                                width:10,height:10,background:p.color,
                                display:'inline-block',marginRight:4,borderRadius:2}}/>
                              {p.value}
                            </li>
                          ))}
                        </ul>
                      )}/>
                  </PieChart>
                ):(
                  <PieChart>
                    <Pie data={mockRecoveryPieData[recoveryMonth]}
                         dataKey="value" cx="50%" cy="50%" outerRadius={70}>
                      {mockRecoveryPieData[recoveryMonth].map((_,i)=>
                        <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                    </Pie>
                    <Tooltip formatter={(v,n)=>[`${v}명`,n]}/>
                    <Legend
                      layout="vertical" align="right" verticalAlign="middle"
                      content={({payload})=>(
                        <ul style={{
                          listStyle:'none',margin:0,padding:0,
                          display:'grid',gridTemplateColumns:'repeat(2,auto)',
                          rowGap:4,columnGap:12,fontSize:12,
                        }}>
                          {payload.map((p,i)=>(
                            <li key={i} style={{display:'flex',alignItems:'center'}}>
                              <span style={{
                                width:10,height:10,background:p.color,
                                display:'inline-block',marginRight:4,borderRadius:2}}/>
                              {p.value}
                            </li>
                          ))}
                        </ul>
                      )}/>
                  </PieChart>
                )
              ):(
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={80}>
                  <PolarGrid/>
                  <PolarAngleAxis dataKey="category"/>
                  <PolarRadiusAxis angle={30} domain={[0,radarMax]}/>
                  <Radar dataKey="남" stroke="#007bff" fill="#007bff" fillOpacity={0.5}/>
                  <Radar dataKey="여" stroke="#f78fb3" fill="#f78fb3" fillOpacity={0.5}/>
                  <Tooltip formatter={v=>`${v}명`}/><Legend/>
                </RadarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ▸ 3. 회수율 전용 필터/검색 */}
      {activeBox==='recovery' && (
        <FilterBar
          statusFilter={statusFilter} setStatusFilter={setStatusFilter}
          sortBy={sortBy}             setSortBy={setSortBy}
          searchTerm={searchTerm}     setSearchTerm={setSearchTerm}/>
      )}

      {/* ▸ 4. AG-Grid 테이블 */}
<div className="ag-theme-alpine" style={{height:300,marginTop:10}}>
  <AgGridReact
    rowData={tableRows}
    columnDefs={colDefs}
    pagination
    /* ✔️ 클릭 시, 회수율 모드일 때만 상세 페이지 이동 */
    onRowClicked={({ data }) => {
      if (activeBox === 'recovery') {        // ← 조건 추가
        navigate(
          '/delinquent/detail',
          { state: { rowData: data, member_id: data.member_id } }
        );
      }
      /* 기간 모드에서는 아무 일도 하지 않음 */
    }}
  />
</div>


      {/* ▸ 5. 상세 모달 */}
      <DelinquentDetailModal
        visible={modal.open}
        onClose={()=>setModal({...modal,open:false})}
        period={modal.period} details={modal.detail}/>
    </div>
  );
}

/* ─────────────────── Helper Components ─────────────────── */
const RangeTab = ({active,onClick,title,items,value,setValue})=>(
  <div style={{flex:1}}>
    <div onClick={onClick}
         style={{
           cursor:'pointer',fontWeight:600,fontSize:15,marginBottom:6,
           borderBottom:active?'2px solid #007bff':'2px solid transparent',
           color:active?'#007bff':'#666',
         }}>{title}</div>
    <div style={{display: 'flex', gap: 10}}>
  {items.map(it => (
    <button
      key={it}
      onClick={() => {
        if (!active) onClick();   // 상위 탭(기간/회수율) 먼저 활성화
        setValue(it);             // 이어서 하위 탭 값 변경
      }}
      style={{
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        borderBottom:
          value === it && active ? '2px solid #007bff' : '2px solid transparent',
        color: value === it && active ? '#007bff' : '#888',
        fontWeight: value === it && active ? 700 : 500,
        fontSize: 13,
        padding: '4px 6px',
      }}
    >
      {it}
    </button>
  ))}
</div>
  </div>
);

const ChartTabs = ({tab,setTab,labels,keys})=>(
  <div style={{display:'flex',gap:6,marginBottom:6}}>
    {keys.map((key,i)=>(
      <button key={key} onClick={()=>setTab(key)}
        style={{
          border:'none',background:'transparent',cursor:'pointer',
          borderBottom:tab===key?'2px solid #007bff':'2px solid transparent',
          color:tab===key?'#007bff':'#888',
          fontWeight:tab===key?700:500,fontSize:13,padding:'4px 6px',
        }}>{labels[i]}</button>
    ))}
  </div>
);

const FilterBar = ({
  statusFilter,setStatusFilter,sortBy,setSortBy,
  searchTerm,setSearchTerm})=>(
  <div style={{
    display:'flex',justifyContent:'space-between',
    alignItems:'flex-end',marginTop:20,width:'100%'}}>
    <div style={{display:'flex',gap:20}}>
      {/* 상태 체크 */}
      <div style={{display:'flex',gap:10}}>
        {[
          {key:'noRecovery',label:'미회수'},
          {key:'partialRecovery',label:'부분 회수'},
          {key:'fullRecovery',label:'전액 회수'},
        ].map(({key,label})=>(
          <label key={key}
            style={{
              cursor:'pointer',display:'flex',alignItems:'center',
              background:statusFilter[key]?'#007bff20':'#f8f9fa',
              border:'1px solid #ccc',borderRadius:6,padding:'6px 10px',
              fontSize:13,fontWeight:statusFilter[key]?700:500,
            }}>
            <input type="checkbox" checked={statusFilter[key]}
                   onChange={e=>setStatusFilter({...statusFilter,[key]:e.target.checked})}
                   style={{marginRight:6,accentColor:'#007bff'}}/>
            {label}
          </label>
        ))}
      </div>
      {/* 정렬 */}
      <div style={{display:'flex',alignItems:'center'}}>
        <span style={{fontSize:14,marginRight:8}}>정렬:</span>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)}
                style={{
                  fontSize:14,padding:'6px 10px',border:'1px solid #ccc',
                  borderRadius:6,cursor:'pointer',
                }}>
          <option value="none">선택 안함</option>
          <option value="overdue">연체금액순</option>
          <option value="recovered">회수금액순</option>
          <option value="rate">회수율순</option>
        </select>
      </div>
    </div>
    {/* 검색 */}
    <input
      value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
      placeholder="검색어를 입력하세요"
      style={{
        width:'40%',padding:'8px 12px',fontSize:14,
        border:'1px solid #ccc',borderRadius:6,
        boxShadow:'inset 0 1px 2px rgba(0,0,0,.1)',
      }}/>
  </div>
);
