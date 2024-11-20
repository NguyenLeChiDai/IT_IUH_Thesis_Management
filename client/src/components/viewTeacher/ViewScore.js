import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Button,
  TextField,
  TablePagination,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import "../../css/ViewScore.css";
function ViewScore() {
  const [scores, setScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [publishLoading, setPublishLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchScores();
  }, []);

  const fetchScores = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/scores/get-teacher-students-scores",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const flattenedScores = response.data.data.reduce((acc, topic) => {
          topic.groups.forEach((group) => {
            group.students.forEach((student) => {
              acc.push({
                student: student.studentInfo,
                topic: {
                  nameTopic: topic.topicInfo.name,
                },
                studentGroup: {
                  groupName: group.groupInfo.groupName,
                },
                scores: student.scores,
                gradingInfo: student.gradingInfo,
              });
            });
          });
          return acc;
        }, []);

        setScores(flattenedScores);
      } else {
        throw new Error(
          response.data.message || "Không thể lấy danh sách điểm"
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/scores/export-excel-score-for-teacher",
        {
          responseType: "blob",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Bang_diem_sinh_vien.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Lỗi khi xuất file Excel:", error);
      alert("Có lỗi xảy ra khi xuất file Excel.");
    }
  };

  const filteredScores = scores.filter(
    (score) =>
      score.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      score.student.studentId
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      score.student.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
      score.topic.nameTopic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      score.studentGroup.groupName
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const paginatedScores = filteredScores.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const tableStyles = {
    container: {
      padding: "20px",
      backgroundColor: "#fff",
      borderRadius: "8px",
      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
    },
    table: {
      width: "100%",
      borderCollapse: "separate",
      borderSpacing: "0",
      border: "1px solid #e0e0e0",
      borderRadius: "8px",
      overflow: "hidden",
      marginTop: "20px",
    },
    tableHeader: {
      backgroundColor: "#f5f5f5",
      color: "#333",
      fontWeight: "600",
      padding: "12px 16px",
      borderBottom: "2px solid #e0e0e0",
      textAlign: "left",
    },
    tableCell: {
      padding: "12px 16px",
      borderBottom: "1px solid #e0e0e0",
      borderRight: "1px solid #e0e0e0",
      color: "#666",
    },
    searchContainer: {
      marginBottom: "20px",
    },
    actionsContainer: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: "20px",
    },
    message: {
      padding: "12px",
      marginBottom: "20px",
      backgroundColor: "#dff0d8",
      borderColor: "#d6e9c6",
      color: "#3c763d",
      borderRadius: "4px",
    },
  };

  if (loading) return <div>Đang tải dữ liệu...</div>;
  if (error) return <div>Lỗi: {error}</div>;

  return (
    <div style={tableStyles.container}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1>Danh sách điểm sinh viên</h1>
      </div>

      {message && <div style={tableStyles.message}>{message}</div>}

      <div style={tableStyles.searchContainer}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Tìm kiếm theo tên, mã sinh viên, lớp, đề tài hoặc nhóm..."
          value={searchTerm}
          onChange={handleSearch}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </div>

      <table style={tableStyles.table}>
        <thead>
          <tr>
            {[
              "Tên sinh viên",
              "Mã sinh viên",
              "Lớp",
              "Tên đề tài",
              "Tên nhóm",
              "Điểm Hướng Dẫn",
              "Điểm Phản Biện",
              "Điểm Hội Đồng",
              "Điểm Poster",
              "Điểm Tổng Kết",
            ].map((header, index) => (
              <th
                key={index}
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid #e0e0e0",
                  borderRight: "1px solid #e0e0e0",
                  color: "#666",
                }}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {paginatedScores.length > 0 ? (
            paginatedScores.map((score, index) => (
              <tr key={`${score.student.id}-${index}`}>
                <td style={tableStyles.tableCell}>{score.student.name}</td>
                <td style={tableStyles.tableCell}>{score.student.studentId}</td>
                <td style={tableStyles.tableCell}>{score.student.class}</td>
                <td style={tableStyles.tableCell}>{score.topic.nameTopic}</td>
                <td style={tableStyles.tableCell}>
                  {score.studentGroup.groupName}
                </td>
                <td style={tableStyles.tableCell}>{score.scores.instructor}</td>
                <td style={tableStyles.tableCell}>{score.scores.reviewer}</td>
                <td style={tableStyles.tableCell}>
                  {score.scores.council !== null
                    ? score.scores.council
                    : "Không có"}
                </td>
                <td style={tableStyles.tableCell}>
                  {score.scores.poster !== null
                    ? score.scores.poster
                    : "Không có"}
                </td>
                <td style={tableStyles.tableCell}>{score.scores.final}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan="10"
                style={{ ...tableStyles.tableCell, textAlign: "center" }}
              >
                Không có dữ liệu để hiển thị
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={tableStyles.actionsContainer}>
        <Button
          variant="contained"
          color="secondary"
          onClick={handleExportExcel}
        >
          Xuất file Excel
        </Button>

        <TablePagination
          component="div"
          count={filteredScores.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
          labelRowsPerPage="Số hàng mỗi trang"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}-${to} của ${count}`
          }
        />
      </div>
    </div>
  );
}

export default ViewScore;
