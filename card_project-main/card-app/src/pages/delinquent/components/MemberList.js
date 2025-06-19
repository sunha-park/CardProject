import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

function MemberList({ onSelect }) {
  const [rowData, setRowData] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  const columnDefs = [
    { headerName: "회원번호", field: "member_id", width: 130 },
    { headerName: "이름", field: "name", width: 120 },
    { headerName: "기준월", field: "base_month", width: 120 },
    { headerName: "나이", field: "age", width: 80 },
    { headerName: "성별", field: "gender", width: 80 },
    { headerName: "전화번호", field: "phone_number", width: 150 },
    { headerName: "주소", field: "address", width: 200 },
    // 필요하면 컬럼 더 추가
  ];

  useEffect(() => {
    axios.get('http://34.47.73.162:7101/api/delinquent-list')
      .then(res => setRowData(res.data));
  }, []);

  const onRowClicked = (event) => {
    setSelectedId(event.data.member_id);
    onSelect(event.data);
  };

  return (
    <div>
      <h3 style={{ margin: "12px 0 8px" }}>회원 목록</h3>
      <div className="ag-theme-alpine" style={{ width: "100%" }}>
        <AgGridReact
          rowData={rowData}
          columnDefs={columnDefs}
          rowSelection="single"
          domLayout="autoHeight"
          pagination={true}
          paginationPageSize={10}     // 한 페이지 20명 (조절 가능)
          onRowClicked={onRowClicked}
          getRowStyle={params =>
            params.data.member_id === selectedId
              ? { background: "#f3e7fa" }
              : {}
          }
        />
      </div>
    </div>
  );
}

export default MemberList;
