import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Button,
  TextField,
  TablePagination,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import "../../css/ScoreStudentForAdmin.css";
import { apiUrl } from "../../contexts/constants";
function ScoreStudentForAdmin() {
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
      const response = await axios.get(`${apiUrl}/scores/get-all-scores`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setScores(response.data.data);
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

  const handlePublishScores = async () => {
    try {
      setPublishLoading(true);
      setMessage("");
      setError("");

      const token = localStorage.getItem("token");

      // Chuyển đổi dữ liệu scores thành danh sách studentId
      const studentIds = scores
        .filter((score) => !score.isPublished) // Chỉ lấy những score chưa được publish
        .map((score) => score.student.id); // Lấy ID của student

      if (studentIds.length === 0) {
        setMessage("Tất cả điểm đã được công bố trước đó.");
        setPublishLoading(false);
        return;
      }

      const response = await axios.post(
        `${apiUrl}/scores/publish-all-scores`,
        { studentId: studentIds },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setMessage(response.data.message);
        // Refresh danh sách điểm sau khi công bố thành công
        await fetchScores();
      } else {
        throw new Error(response.data.message || "Lỗi khi công bố điểm");
      }
    } catch (err) {
      console.error("Lỗi khi công bố điểm:", err);
      setError(
        err.response?.data?.message || err.message || "Lỗi khi công bố điểm"
      );
    } finally {
      setPublishLoading(false);
    }
  };

  const handleUnpublishScores = async () => {
    try {
      setPublishLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `${apiUrl}/scores/unpublish-all-scores`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setMessage(response.data.message);
        // Refresh danh sách điểm sau khi hủy công bố
        fetchScores();
      }
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi hủy công bố điểm");
    } finally {
      setPublishLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      // Lấy token từ localStorage hoặc nơi bạn lưu trữ
      const token = localStorage.getItem("token"); // hoặc cookie nếu bạn sử dụng cookie

      const response = await axios.get(`${apiUrl}/scores/export-scores`, {
        responseType: "blob", // Để xử lý file blob
        headers: {
          Authorization: `Bearer ${token}`, // Thêm token vào header nếu cần
        },
      });

      // Tạo URL từ blob và tải về
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "Bang_diem_sinh_vien.xlsx"); // Tên file tải về
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link); // Xóa link sau khi tải xong
    } catch (error) {
      console.error("Lỗi khi xuất file Excel:", error);
      alert("Có lỗi xảy ra khi xuất file Excel."); // Thông báo cho người dùng
    }
  };

  // Hàm lọc điểm dựa trên từ khóa tìm kiếm
  const filteredScores = scores.filter(
    (score) =>
      score.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      score.student.studentId
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      score.student.class.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (score.topic?.nameTopic || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (score.studentGroup?.groupName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  // Tính toán số trang và dữ liệu hiển thị
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
    setPage(0); // Reset về trang đầu tiên khi tìm kiếm
  };

  // ... các hàm xử lý khác giữ nguyên ...

  if (loading) return <div>Đang tải dữ liệu...</div>;
  if (error) return <div>Lỗi: {error}</div>;

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1>Danh sách điểm sinh viên</h1>
        <div>
          <button
            onClick={handlePublishScores}
            disabled={publishLoading}
            style={{
              padding: "10px 20px",
              marginRight: "10px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: publishLoading ? "not-allowed" : "pointer",
            }}
          >
            {publishLoading ? "Đang xử lý..." : "Công bố tất cả điểm"}
          </button>
          <button
            onClick={handleUnpublishScores}
            disabled={publishLoading}
            style={{
              padding: "10px 20px",
              backgroundColor: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: publishLoading ? "not-allowed" : "pointer",
            }}
          >
            {publishLoading ? "Đang xử lý..." : "Hủy công bố tất cả điểm"}
          </button>
        </div>
      </div>

      {message && (
        <div
          style={{
            padding: "10px",
            marginBottom: "20px",
            backgroundColor: "#dff0d8",
            borderColor: "#d6e9c6",
            color: "#3c763d",
            borderRadius: "4px",
          }}
        >
          {message}
        </div>
      )}

      {/* Thanh tìm kiếm */}
      <div style={{ marginBottom: "20px" }}>
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

      <table
        border="1"
        cellPadding="8"
        style={{
          width: "100%",
          borderCollapse: "collapse",
          textAlign: "left",
          marginTop: "20px",
        }}
      >
        <thead>
          <tr style={{ backgroundColor: "#f2f2f2" }}>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>
              Tên sinh viên
            </th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>
              Mã sinh viên
            </th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>Lớp</th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>
              Tên đề tài
            </th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>
              Tên nhóm
            </th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>
              Điểm Hướng Dẫn
            </th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>
              Điểm Phản Biện
            </th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>
              Điểm Hội Đồng
            </th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>
              Điểm Poster
            </th>
            <th style={{ padding: "10px", border: "1px solid #ddd" }}>
              Điểm Tổng Kết
            </th>
          </tr>
        </thead>
        <tbody>
          {paginatedScores.length > 0 ? (
            paginatedScores.map((score) => (
              <tr key={score.student.id}>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  {score.student.name}
                </td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  {score.student.studentId}
                </td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  {score.student.class}
                </td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  {score.topic?.nameTopic}
                </td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  {score.studentGroup?.groupName}
                </td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  {score.scores.instructor}
                </td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  {score.scores.reviewer}
                </td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  {score.scores.council !== null
                    ? score.scores.council
                    : "Không có"}
                </td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  {score.scores.poster !== null
                    ? score.scores.poster
                    : "Không có"}
                </td>
                <td style={{ padding: "10px", border: "1px solid #ddd" }}>
                  {score.scores.final}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan="10"
                style={{
                  textAlign: "center",
                  padding: "10px",
                  border: "1px solid #ddd",
                  backgroundColor: "#f9f9f9",
                  color: "#666",
                }}
              >
                Không có dữ liệu để hiển thị
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Nút xuất Excel và phân trang */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "20px",
        }}
      >
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

export default ScoreStudentForAdmin;
