import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Sử dụng hook useNavigate để chuyển trang
import "../../css/AssignmentReview.css";
import { TablePagination } from "@mui/material";
function AssignmentReview() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate(); // Hook để chuyển hướng
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(6);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Đặt lại về trang đầu tiên khi tìm kiếm
  };

  // Lấy danh sách giáo viên
  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/reviewAssignment/get-all-teachers",
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setTeachers(response.data.teachers);
        setError(null);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Có lỗi xảy ra khi tải danh sách giáo viên"
      );
    } finally {
      setLoading(false);
    }
  };

  // Gọi API khi component mount
  useEffect(() => {
    fetchTeachers();
  }, []);

  // Hàm chuyển hướng đến trang danh sách nhóm và truyền teacherId
  const viewGroupsForTeacher = (teacherId) => {
    navigate(`assignment-reviews/${teacherId}`);
  };

  // Lọc giáo viên theo từ khóa tìm kiếm
  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.teacherId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;
  if (error) return <div className="error">{error}</div>;

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Tính toán dữ liệu cho trang hiện tại
  const paginatedTeachers = filteredTeachers.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );
  return (
    <div className="assignment-review-container">
      <div className="header-assignment">
        <h2>Quản lý Phân công Chấm Phản Biện</h2>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Tìm kiếm giảng viên..."
            value={searchTerm}
            onChange={handleSearch}
            style={{ width: "375px" }}
          />
        </div>
      </div>

      <div className="teachers-grid">
        {paginatedTeachers.map((teacher) => (
          <div key={teacher._id} className="teacher-card">
            <div className="teacher-info">
              <h3>{teacher.name}</h3>
              <p>
                <strong>Mã GV:</strong> {teacher.teacherId}
              </p>
              <p>
                <strong>Email:</strong> {teacher.email || "Chưa cập nhật"}
              </p>
              <p>
                <strong>SĐT:</strong> {teacher.phone || "Chưa cập nhật"}
              </p>
              <p>
                <strong>Chuyên ngành:</strong>{" "}
                {teacher.major || "Chưa cập nhật"}
              </p>
            </div>
            <div className="teacher-actions">
              <button
                className="view-assignments-btn"
                onClick={() => viewGroupsForTeacher(teacher.teacherId)}
              >
                Xem danh sách nhóm
              </button>
            </div>
          </div>
        ))}
      </div>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredTeachers.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="Số hàng mỗi trang"
        labelDisplayedRows={({ from, to, count }) =>
          `${from}-${to} của ${count}`
        }
      />
    </div>
  );
}
export default AssignmentReview;
