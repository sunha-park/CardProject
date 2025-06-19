import React, { useEffect, useState, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import DelinquentDetailModal from './components/DelinquentDetailModal'; // 상단에 추가
import { useNavigate } from 'react-router-dom';


import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis,
  Tooltip, Legend,
  CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  PolarRadiusAxis, ReferenceLine
} from 'recharts';
import axios from 'axios';

//const COLORS = ['#007bff', '#ff4d4f', '#ffc107', '#28a745'];
const BASE_URL = 'http://34.47.73.162:7000';

const DelinquentListPage = () => {
  const navigate = useNavigate();
  const [activeBox, setActiveBox] = useState('period'); // 'period' | 'recovery'
  const [rangeTab, setRangeTab] = useState('월간');
  const [termTab, setTermTab] = useState('30일 미만');
  const [chartTab, setChartTab] = useState('area');
  const [pieRadarTab, setPieRadarTab] = useState('pie');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('');
  const [selectedDetail, setSelectedDetail] = useState({});
  //const [isFocused, setIsFocused] = useState(false);

  const [lineData, setLineData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [radarData, setRadarData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [recoveryPieData, setRecoveryPieData] = useState({});
  const [selectedPieMonth, setSelectedPieMonth] = useState('2025-04'); // 기본 월 설정

  //const [genderTab, setGenderTab] = useState('전체'); // 전체 | 남 | 여
  //const [radarViewTab, setRadarViewTab] = useState('월간');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('20대'); // ✅ 추가
  const [selectedRadarPeriod, setSelectedRadarPeriod] = useState('2025-04');
  const [selectedRecoveryMonth, setSelectedRecoveryMonth] = useState('2025-04');

  const [statusFilter, setStatusFilter] = useState({
    noRecovery: false,
    partialRecovery: false,
    fullRecovery: false,
  });
  const [sortBy, setSortBy] = useState('none'); // none | overdue | recovered | rate
  //const [riskFilter, setRiskFilter] = useState('all'); // 'all' | 'low' | 'medium' | 'high'

  const availableRadarPeriods = useMemo(() => {
    const set = new Set();
    radarData.forEach(d => {
      if (d.age_group === selectedAgeGroup) set.add(d.period);
    });
    return Array.from(set);
  }, [radarData, selectedAgeGroup]);

  //pie회수인원 변수
  const pieDataToRender = recoveryPieData[selectedRecoveryMonth] || [];

  useEffect(() => {
    if (availableRadarPeriods.length > 0) {
      setSelectedRadarPeriod(availableRadarPeriods[0]);
    }
  }, [availableRadarPeriods]);



  // ✅ 파스텔톤 색상 파이차트용
  const MODERN_COLORS = [
    '#66C2A5', // 민트
    '#FC8D62', // 코랄
    '#FFD92F', // 진한 옐로우
    '#8DA0CB', // 블루
    '#E78AC3', // 핑크
    '#A6D854', // 연두
  ];

  // ✅ 날짜 포맷: 2024-11 → 24/11 파이차트용
  const formatPieLabel = (raw) => {
    if (typeof raw !== 'string') return raw;

    // 월간: "2024-11" → "24/11"
    if (/^\d{4}-\d{2}$/.test(raw)) {
      const [y, m] = raw.split('-');
      return `${y.slice(2)}/${m}`;
    }

    // 분기: "2024 Q4" → "24/Q4"
    if (/^\d{4} Q[1-4]$/.test(raw)) {
      const [y, q] = raw.split(' ');
      return `${y.slice(2)}/${q}`;
    }

    // 반기: "2024-H2" → "24/H2"
    if (/^\d{4}-H[1-2]$/.test(raw)) {
      const [y, h] = raw.split('-');
      return `${y.slice(2)}/${h}`;
    }

    // 연간: "2024" → "24"
    if (/^\d{4}$/.test(raw)) {
      return raw.slice(2);
    }

    return raw;
  };


  //radar 필터링
  // 📌 남녀 성별별 평균값으로 집계된 radar chart 데이터 생성
  const radarChartData = useMemo(() => {
    const filtered = radarData.filter(d =>
      d.period === selectedRadarPeriod &&
      d.age_group === selectedAgeGroup
    );
    console.log('✅ radarData:', radarData);
    console.log('✅ selectedRadarPeriod:', selectedRadarPeriod);
    console.log('✅ selectedAgeGroup:', selectedAgeGroup);
    console.log('✅ 기준월:', selectedRecoveryMonth);
    console.log('✅ 바차트 데이터:', barData);

    const grouped = {};
    filtered.forEach(d => {
      if (!grouped[d.category]) {
        grouped[d.category] = { category: d.category, 남: 0, 여: 0 };
      }
      grouped[d.category][d.gender] = d.value;
    });

    return Object.values(grouped);
  }, [radarData, selectedRadarPeriod, selectedAgeGroup]);

  const maxRadarValue = useMemo(() => {
    const values = radarChartData.flatMap(item => [item.남, item.여]);
    return Math.max(...values, 10); // 최소 10 이상
  }, [radarChartData]);



  const groupedData = useMemo(() => {
    const grouped = {};
    barData.forEach((item) => {
      if (!grouped[item.기간]) grouped[item.기간] = { 기간: item.기간 };
      grouped[item.기간][item.category] = item.avgAmount;
    });
    return Object.values(grouped);
  }, [barData]);




  const categories = ['카드론', '일시불', '할부', '리볼빙', '대출'];
  const barColors = ['#7BC8A4', '#FFD76A', '#FFA5A5', '#BFA5FF', '#8EC6FF'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            backgroundColor: 'white',
            border: '1px solid #ccc',
            padding: '10px',
            fontSize: 13,
            lineHeight: 1.4,
          }}
        >
          <strong>{label}</strong>
          {payload.map((entry, index) => {
            const isRate = entry.name.includes('회수율');
            const displayValue = isRate
              ? `${Math.round(entry.value)}%`
              : `₩ ${Math.round(entry.value).toLocaleString('ko-KR')} 원`;

            return (
              <div key={index} style={{ color: entry.color }}>
                {entry.name} : {displayValue}
              </div>
            );
          })}
        </div>
      );
    }
    return null;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        let chartUrl = '';
        let tableUrl = '';
        let chartParams = {};
        let tableParams = {};

        if (activeBox === 'period') {
          chartUrl = `${BASE_URL}/api/delinquent/period/chart-data`;
          tableUrl = `${BASE_URL}/api/delinquent/period/table-data`;
          chartParams = { rangeType: rangeTab };
          tableParams = { rangeType: rangeTab };
        } else if (activeBox === 'recovery') {
          chartUrl = `${BASE_URL}/api/delinquent/recovery/chart-data`;
          tableUrl = `${BASE_URL}/api/delinquent/recovery/table-data`;
          chartParams = {
            termGroup: termTab,
            baseMonth: selectedRecoveryMonth.replace('-', '') // '2025-04' → '202504'
          };
          tableParams = {
            termGroup: termTab,
            baseMonth: selectedRecoveryMonth.replace('-', '')
          };
        }

        console.log('📡 요청 URL:', chartUrl);
        console.log('📡 요청 파라미터:', chartParams);

        const chartRes = await axios.get(chartUrl, { params: chartParams });
        console.log('✅ chart-data 응답:', chartRes.data);

        setLineData(chartRes.data.lineData ?? []);
        setBarData(chartRes.data.barData ?? []);

        if (activeBox === 'period') {
          // 📌 기간별 조회용 pieData는 기존 상태로 유지
          setPieData(
            (chartRes.data.pieData ?? []).map(d => ({
              name: d.name,
              value: Number(d.value),
            }))
          );
        } else if (activeBox === 'recovery') {
          // 📌 회수율용 pieData는 recoveryPieData[기준월]로 저장
          setRecoveryPieData(prev => ({
            ...prev,
            [selectedRecoveryMonth]: (chartRes.data.pieData ?? []).map(d => ({
              name: d.name,
              value: Number(d.value),
            }))
          }));
        }

        // ✅ tableData도 추가적으로 fetch
        const tableRes = await axios.get(tableUrl, { params: tableParams });
        setTableData(tableRes.data ?? []);
        console.log('✅ table-data 응답:', tableRes.data);

      } catch (err) {
        console.error('❌ chart-data fetch 실패:', err);
      }
    };

    fetchData();
  }, [activeBox, rangeTab, termTab, selectedRecoveryMonth]);


  // 📌 [2] radarData는 별도 요청 (조건부 분기)
  useEffect(() => {
    if (activeBox === 'period' && pieRadarTab === 'radar') {
      axios
        .get(`${BASE_URL}/api/delinquent/period/radar-data`, {
          params: { rangeType: rangeTab },
        })
        .then(res => setRadarData(res.data.radarData ?? []))
        .catch(err => console.error('❌ radarData fetch 실패:', err));
    }

    if (activeBox === 'recovery') {
      setRadarData([]); // 추심 회수율에서는 radar 없음
    }
  }, [pieRadarTab, rangeTab, activeBox]);



  //고객명
  const filteredData = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    let filtered = [...tableData];

    // ✅ 검색어 필터
    if (keyword) {
      filtered = filtered.filter(row =>
        Object.values(row).some(value =>
          (value ?? '').toString().toLowerCase().includes(keyword)
        )
      );
    }

    // ✅ 상태 필터링 (아무것도 체크 안됐으면 전체 표시)
    const checkedStates = Object.entries(statusFilter)
      .filter(([_, checked]) => checked)
      .map(([state]) => state);

    if (checkedStates.length > 0) {
      filtered = filtered.filter(row => {
        const rate = Math.round(Number(row['회수율']));  // ← 여기가 핵심
        if (rate === 0 && checkedStates.includes('noRecovery')) return true;
        if (rate > 0 && rate < 100 && checkedStates.includes('partialRecovery')) return true;
        if (rate === 100 && checkedStates.includes('fullRecovery')) return true;
        return false;
      });
    }

    // ✅ 정렬
    if (sortBy === 'overdue') {
      filtered = [...filtered].sort((a, b) => b['연체금액'] - a['연체금액']);
    } else if (sortBy === 'recovered') {
      filtered = [...filtered].sort((a, b) => b['회수금액'] - a['회수금액']);
    } else if (sortBy === 'rate') {
      filtered = [...filtered].sort((a, b) => b['회수율'] - a['회수율']);
    }

    return filtered;
  }, [tableData, searchTerm, statusFilter, sortBy]);

  const columnDefs = useMemo(() => {
    const formatMoney = (val) =>
      val != null ? Number(val).toLocaleString() + '원' : '0원';

    if (activeBox === 'recovery') {
      return [
        { headerName: '기준 월', field: '기준월' },
        { headerName: '고객명', field: '고객명' },
        { headerName: '성별', field: '성별' },
        { headerName: '연령', field: '연령' },
        { headerName: '연락처', field: '연락처' },
        { headerName: '주소', field: '주소' },
        { headerName: '연체기간', field: '연체기간' },
        {
          headerName: '연체금액',
          field: '연체금액',
          valueFormatter: (p) => formatMoney(p.value),
        },
        {
          headerName: '회수금액', field: '회수금액',
          valueFormatter: p => formatMoney(p.value)
        },
        {
          headerName: '회수율',
          field: '회수율',
          valueFormatter: (p) => `${p.value}%`,
        },
      ];
    }

    // 기존 기간 요약용 컬럼
    return [
      { headerName: '기간 집계 단위', field: 'name' },
      { headerName: '연체 고객 / 총 고객', field: 'term' },
      {
        headerName: '카드론(평균/총액)',
        valueGetter: (params) => {
          const avg = formatMoney(params.data.cardloan_avg);
          const sum = formatMoney(params.data.cardloan_sum);
          return `${avg} / ${sum}`;
        },
      },
      {
        headerName: '일시불(평균/총액)',
        valueGetter: (params) => {
          const avg = formatMoney(params.data.lumpsum_avg);
          const sum = formatMoney(params.data.lumpsum_sum);
          return `${avg} / ${sum}`;
        },
      },
      {
        headerName: '할부(평균/총액)',
        valueGetter: (params) => {
          const avg = formatMoney(params.data.installment_avg);
          const sum = formatMoney(params.data.installment_sum);
          return `${avg} / ${sum}`;
        },
      },
      {
        headerName: '리볼빙(평균/총액)',
        valueGetter: (params) => {
          const avg = formatMoney(params.data.revolving_avg);
          const sum = formatMoney(params.data.revolving_sum);
          return `${avg} / ${sum}`;
        },
      },
      {
        headerName: '현금서비스(평균/총액)',
        valueGetter: (params) => {
          const avg = formatMoney(params.data.cash_avg);
          const sum = formatMoney(params.data.cash_sum);
          return `${avg} / ${sum}`;
        },
      },
      {
        headerName: '연체금액(평균/총액)',
        valueGetter: (params) => {
          const avg = formatMoney(params.data.overdue_amt_avg);
          const sum = formatMoney(params.data.overdue_amt_sum);
          return `${avg} / ${sum}`;
        },
      },
      {
        headerName: '연체 율(%)',
        field: 'amount',
        valueFormatter: (p) => p.value != null ? `${p.value}%` : '0%',
      },
    ];
  }, [activeBox]);


  return (
    <div className="delinquent-page">


      <div className="top-bar" style={{ display: 'flex', gap: '40px', marginBottom: 20 }}>
        {/* 기간별 조회 */}
        <div style={{ flex: 1 }}>
          <div
            onClick={() => setActiveBox('period')}
            style={{
              fontWeight: 600,
              fontSize: '15px',
              marginBottom: 6,
              borderBottom: activeBox === 'period' ? '2px solid #007bff' : '2px solid transparent',
              paddingBottom: 6,
              color: activeBox === 'period' ? '#007bff' : '#666',
              cursor: 'pointer',
              transition: 'border 0.2s ease'
            }}
          >
            📅 기간 별 조회
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {['월간', '분기', '반기', '연간'].map((range) => (
              <button
                key={range}
                onClick={() => {
                  if (activeBox !== 'period') setActiveBox('period');
                  setRangeTab(range);
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  borderBottom: rangeTab === range && activeBox === 'period' ? '2px solid #007bff' : '2px solid transparent',
                  color: rangeTab === range && activeBox === 'period' ? '#007bff' : '#888',
                  fontWeight: rangeTab === range && activeBox === 'period' ? 'bold' : 500,
                  fontSize: '13px',
                  padding: '4px 6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        {/* 추심 회수율 */}
        <div style={{ flex: 1 }}>
          <div
            onClick={() => setActiveBox('recovery')}

            style={{
              fontWeight: 600,
              fontSize: '15px',
              marginBottom: 6,
              borderBottom: activeBox === 'recovery' ? '2px solid #007bff' : '2px solid transparent',
              paddingBottom: 6,
              color: activeBox === 'recovery' ? '#007bff' : '#666',
              cursor: 'pointer',
              transition: 'border 0.2s ease'
            }}
          >
            💳 추심 회수율
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            {['30일 미만', '30~60일', '60~90일'].map((term) => (
              <button
                key={term}
                onClick={() => {
                  if (activeBox !== 'recovery') setActiveBox('recovery');
                  setTermTab(term);
                }}
                style={{
                  border: 'none',
                  background: 'transparent',
                  borderBottom: termTab === term && activeBox === 'recovery' ? '2px solid #007bff' : '2px solid transparent',
                  color: termTab === term && activeBox === 'recovery' ? '#007bff' : '#888',
                  fontWeight: termTab === term && activeBox === 'recovery' ? 'bold' : 500,
                  fontSize: '13px',
                  padding: '4px 6px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </div>


      {/* 차트 영역 */}
      <div className="chart-section" style={{ display: 'flex', gap: '20px' }}>
        <div className="chart-group left" style={{ flex: 2 }}>
          <div className="chart-tabs">
            {['area', 'bar'].map((tab) => (
              <button
                key={tab}
                className={chartTab === tab ? 'tab active' : 'tab'}
                onClick={() => setChartTab(tab)}
              >
                {activeBox === 'period'
                  ? tab === 'area' ? '📈 연체율 추이' : '📊 자금유형별 평균 연체금액'
                  : tab === 'area' ? '📈 연체 회수율' : '📊 회수 비율 비교'
                }
              </button>
            ))}
          </div>

          <div className="chart-box" style={{ height: 250, position: 'relative' }}>
            {activeBox === 'recovery' && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 10,
                  right: 10,
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  padding: '4px 8px',
                  borderRadius: 6,
                  fontSize: 13,
                  zIndex: 2,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                }}
              >
                <label style={{ marginRight: 6 }}>기준 월:</label>
                <select
                  value={selectedRecoveryMonth}
                  onChange={(e) => setSelectedRecoveryMonth(e.target.value)}
                  style={{
                    padding: '3px 6px',
                    borderRadius: 4,
                    border: '1px solid #aaa',
                    fontSize: 12
                  }}
                >
                  {['2024-12', '2025-01', '2025-02', '2025-03', '2025-04'].map((month) => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
            )}

            <ResponsiveContainer width="100%" height="100%">
              {chartTab === 'area' ? (
                <LineChart data={lineData} margin={{ top: 30, right: 30, bottom: 30, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={activeBox === 'period' ? '기간' : '연체일구간'} />
                  <YAxis
                    domain={activeBox === 'period' ? [0, 7] : [0, 100]}
                    tickFormatter={(value) => `${value}%`}
                    label={{
                      value: activeBox === 'period' ? '연체율 (%)' : '회수율 (%)',
                      angle: -90,
                      position: 'insideLeft',
                      offset: 10,
                      style: { textAnchor: 'middle', fontSize: 12, fill: '#888' },
                    }}
                  />
                  <Tooltip />
                  <Legend />

                  {/* 🎨 연체율 or 회수율 라인 */}
                  <Line
                    type="monotone"
                    dataKey={activeBox === 'period' ? '연체율' : '회수율'}
                    stroke="#FFA8A8"
                    strokeWidth={2}
                    dot={{ r: 4, strokeWidth: 1, fill: '#FFA8A8' }}
                  // name 제거 → Legend 없애기 위함
                  />

                  {/* ✅ 기존 Legend 제거 */}
                  {/* <Legend /> → 제거 */}

                  {/* ✅ 우측 상단에 텍스트 직접 표시 */}
                  <text
                    x="95%" // 위치 오른쪽
                    y={25}   // 높이 조절
                    textAnchor="end"
                    fontSize={13}
                    fontWeight="bold"
                    fill="#888"
                    marginBottom="10"
                  >
                    {activeBox === 'period' ? '연체율 (%)' : '회수율 (%)'}
                  </text>
                  {/* ✅ 연체율 보기 기준선 */}
                  {activeBox === 'period' &&
                    [
                      { y: 1, color: '#339af0', label: '저위험 (1% ↓)' },
                      { y: 3, color: '#f59f00', label: '주의 (3%)' },
                      { y: 5, color: '#fa5252', label: '고위험 (5%↑)' },
                    ].map((level) => (
                      <ReferenceLine
                        key={level.y}
                        y={level.y}
                        stroke={level.color}
                        strokeDasharray="4 4"
                        label={{
                          position: 'insideTopRight',
                          value: level.label,
                          fill: level.color,
                          fontSize: 12,
                          fontWeight: 'bold',
                        }}
                      />
                    ))}

                  {/* ✅ 회수율 보기 기준선 */}
                  {activeBox !== 'period' &&
                    [
                      { y: 70, color: '#51cf66', label: '정상 회수율 (70%)' },
                      { y: 40, color: '#ff922b', label: '위험 회수율 (40%)' },
                    ].map((level) => (
                      <ReferenceLine
                        key={level.y}
                        y={level.y}
                        stroke={level.color}
                        strokeDasharray="3 3"
                        label={{
                          position: 'insideTopRight',
                          value: level.label,
                          fill: level.color,
                          fontSize: 12,
                          fontWeight: 'bold',
                        }}
                      />
                    ))}
                </LineChart>
              ) : (
                <BarChart
                  data={activeBox === 'period' ? groupedData : barData.filter(d => d.기준월 === selectedRecoveryMonth)}
                  margin={{ top: 20, right: 0, bottom: 30, left: 30 }}
                  onClick={(e) => {
                    const label = e?.activeLabel;
                    if (!label) return;

                    if (activeBox === 'period') {
                      const periodData = barData.filter(d => d.기간 === label);
                      const detail = {};
                      periodData.forEach(item => {
                        detail[item.category] = item.avgAmount;
                      });

                      setSelectedPeriod(label);
                      setSelectedDetail(detail);
                      setModalVisible(true);
                    }

                    if (activeBox === 'recovery') {
                      const categoryData = barData.find(
                        d => d.기준월 === selectedRecoveryMonth && d.category === label
                      );
                      if (!categoryData) return;

                      const detail = {
                        연체금액: categoryData.연체금액,
                        회수금액: categoryData.회수금액,
                        회수율: categoryData.회수율,
                      };

                      setSelectedPeriod(label); // 여기서 label은 category 이름
                      setSelectedDetail(detail);
                      setModalVisible(true);
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey={activeBox === 'period' ? '기간' : 'category'} />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    tickFormatter={(value) => value.toLocaleString()}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />

                  {activeBox === 'period' ? (
                    categories.map((cat, i) => (
                      <Bar
                        key={cat}
                        dataKey={cat}
                        yAxisId="left"
                        fill={barColors[i % barColors.length]}
                        barSize={30}
                        name={cat}
                      />
                    ))
                  ) : (
                    <>
                      <Bar yAxisId="left" dataKey="연체금액" fill="#ffa8a8" name="연체금액" />
                      <Bar yAxisId="left" dataKey="회수금액" fill="#74c0fc" name="회수금액" />
                      <Bar yAxisId="right" dataKey="회수율" fill="#63e6be" name="회수율 (%)" />
                    </>
                  )}
                </BarChart>

              )}
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-group right" style={{ flex: 1 }}>
          <div className="chart-tabs">
            {['pie', 'radar'].map((tab) => {
              const isPie = tab === 'pie';
              const label = activeBox === 'period'
                ? isPie ? '🥧 연체 인원' : '🕸 연령별 소비 분포'
                : isPie ? '🥧 회수 인원' : '🕸 독촉 회수 분포';

              return (
                <button
                  key={tab}
                  className={pieRadarTab === tab ? 'tab active' : 'tab'}
                  onClick={() => setPieRadarTab(tab)}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/*하단 파이차트와 레이다 차트*/}
          <div className="chart-box" style={{ height: 250, position: 'relative' }}>
            {/* ✅ 우측 상단 드롭다운 (Radar용) */}
            {pieRadarTab === 'radar' && (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  zIndex: 2,
                  margin: 8,
                  display: 'flex',
                  gap: 6,
                }}
              >
                <select
                  value={selectedAgeGroup}
                  onChange={(e) => setSelectedAgeGroup(e.target.value)}
                  style={{
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    maxWidth: '100px',
                    height: '26px',
                    lineHeight: '1.2',
                  }}
                >
                  {['20대', '30대', '40대', '50대', '60대', '70대'].map((age) => (
                    <option key={age} value={age}>{age}</option>
                  ))}
                </select>

                <select
                  value={selectedRadarPeriod}
                  onChange={(e) => setSelectedRadarPeriod(e.target.value)}
                  style={{
                    fontSize: '11px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: '1px solid #ccc',
                    maxWidth: '100px',
                    height: '26px',
                    lineHeight: '1.2',
                  }}
                >
                  {availableRadarPeriods.map(period => (
                    <option key={period} value={period}>
                      {formatPieLabel(period)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* ✅ 회수율 PieChart 드롭다운은 ResponsiveContainer 밖으로 뺌 */}
            {pieRadarTab === 'pie' && activeBox === 'recovery' && (
              <div style={{ position: 'absolute', top: 6, right: 6, zIndex: 2 }}>
                <select
                  value={selectedRecoveryMonth}
                  onChange={(e) => setSelectedRecoveryMonth(e.target.value)}
                  style={{
                    fontSize: '12px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid #ccc'
                  }}
                >
                  {['2024-12', '2025-01', '2025-02', '2025-03', '2025-04'].map(month => (
                    <option key={month} value={month}>{month}</option>
                  ))}
                </select>
              </div>
            )}

            <ResponsiveContainer width="100%" height="100%">
              {pieRadarTab === 'pie' ? (
                activeBox === 'recovery' ? (
                  <PieChart>
                    <Pie
                      data={pieDataToRender}
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      dataKey="value"
                      labelLine={false}
                      label={false}
                    >
                      {pieDataToRender.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={MODERN_COLORS[index % MODERN_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value}명`, name]} />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      formatter={(value) => <span style={{ fontSize: 12 }}>{value}</span>}
                    />
                  </PieChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="40%"
                      cy="50%"
                      outerRadius={70}
                      dataKey="value"
                      labelLine={false}
                      label={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={MODERN_COLORS[index % MODERN_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value}명`, formatPieLabel(name)]} />
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      formatter={(value) => <span style={{ fontSize: 12 }}>{formatPieLabel(value)}</span>}
                    />
                  </PieChart>
                )
              ) : (
                <RadarChart cx="50%" cy="50%" outerRadius={80} data={radarChartData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis angle={30} domain={[0, maxRadarValue]} />
                  <Radar name="남" dataKey="남" stroke="#007bff" fill="#007bff" fillOpacity={0.5} />
                  <Radar name="여" dataKey="여" stroke="#f78fb3" fill="#f78fb3" fillOpacity={0.5} />
                  <Tooltip formatter={(value) => `${value}명`} />
                  <Legend verticalAlign="bottom" height={24} />
                </RadarChart>
              )}
            </ResponsiveContainer>
          </div>

        </div>
      </div>

      {/* 여기서부터 검색창 및 */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginTop: 20,
        }}
      >
        {/* 좌측 필터 그룹 (회수율 전용) */}
        {activeBox === 'recovery' && (
          <div style={{ display: 'flex', gap: 20 }}>
            {/* ✅ 상태 체크박스 */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              {[
                { key: 'noRecovery', label: '미회수' },
                { key: 'partialRecovery', label: '부분 회수' },
                { key: 'fullRecovery', label: '전액 회수' },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: statusFilter[key] ? '#007bff20' : '#f8f9fa',
                    border: '1px solid #ccc',
                    borderRadius: 6,
                    padding: '6px 10px',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: statusFilter[key] ? 'bold' : 500,
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={statusFilter[key]}
                    onChange={(e) =>
                      setStatusFilter({ ...statusFilter, [key]: e.target.checked })
                    }
                    style={{
                      marginRight: 6,
                      accentColor: '#007bff',
                      width: 16,
                      height: 16,
                    }}
                  />
                  {label}
                </label>
              ))}
            </div>

            {/* ✅ 정렬 드롭다운 */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <label style={{ fontSize: 14, marginRight: 8 }}>정렬 기준:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  fontSize: 14,
                  padding: '6px 10px',
                  border: '1px solid #ccc',
                  borderRadius: 6,
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                }}
              >
                <option value="none">선택 안함</option>
                <option value="overdue">연체금액순</option>
                <option value="recovered">회수금액순</option>
                <option value="rate">회수율순</option>
              </select>
            </div>
          </div>
        )}

        {/* ✅ 검색창 (회수율 전용) */}
        {activeBox === 'recovery' && (
          <input
            type="text"
            className="search-input"
            placeholder="검색어를 입력하세요"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '40%',
              padding: '8px 12px',
              fontSize: 14,
              border: '1px solid #ccc',
              borderRadius: 6,
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
              transition: 'border 0.2s ease',
            }}
          />
        )}
      </div>


      {/* 테이블 영역 */}
      <div className="ag-theme-alpine ag-grid-box" style={{ height: 300, marginTop: 5 }}>
        <AgGridReact
          rowData={filteredData}
          columnDefs={columnDefs}
          pagination={true}
          onRowClicked={(event) => {
            console.log("🧾 클릭된 row 전체:", event.data);
            if (activeBox === 'recovery') {
              navigate('/delinquent/detail', { state: { rowData: event.data , member_id: event.data.member_id, } });
            }
          }}
        />
      </div>
      {/* ✅ 모달 컴포넌트 추가 */}
      <DelinquentDetailModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        period={selectedPeriod}
        details={selectedDetail}
      />
    </div>
  );
};

export default DelinquentListPage;
