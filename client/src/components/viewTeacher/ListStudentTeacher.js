import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import SearchIcon from "@mui/icons-material/Search";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
} from "@mui/material";
import "../../css/ListStudentGroupForTeacher.css";

const ListStudentTeacher = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const [scores, setScores] = useState({
    instructorScore: "",
    reviewerScore: "",
    presentationScore: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/topics/teacher/students"
        );
        if (response.data && Array.isArray(response.data.students)) {
          setStudents(response.data.students);
        } else {
          throw new Error("Dữ liệu không hợp lệ");
        }
      } catch (err) {
        setError(err.message || "Có lỗi xảy ra khi lấy dữ liệu.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const filteredStudents = students.filter((studentData) => {
    const searchRegex = new RegExp(searchTerm.replace(/\s+/g, "\\s*"), "i");
    return (
      searchRegex.test(studentData.student.studentId) ||
      searchRegex.test(studentData.student.name)
    );
  });

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Hàm xử lý khi chọn sinh viên
  const handleStudentSelect = (studentData) => {
    const studentScores = studentData.scores || {}; // Lấy điểm từ studentData, nếu có
    setScores({
      instructorScore: studentScores?.instructorScore ?? "",
      reviewerScore: studentScores?.reviewerScore ?? "",
      presentationScore: studentScores?.presentationScore ?? "",
    }); // Cập nhật lại inputScores trước khi điều hướng
    navigate("/dashboardTeacher/input-score", {
      state: {
        studentData: {
          studentId: studentData.student.studentId,
          name: studentData.student.name,
          email: studentData.student.email,
          class: studentData.student.class,
          topic: studentData.topic ? studentData.topic.nameTopic : null,
          scores: {
            instructorScore: scores?.instructorScore ?? null,
            reviewerScore: scores?.reviewerScore ?? null,
            presentationScore: scores?.presentationScore ?? null,
          },
        },
      },
    });
  };

  const handleExportExcel = async () => {
    try {
      // Lấy token từ localStorage hoặc nơi bạn lưu trữ
      const token = localStorage.getItem("token"); // hoặc cookie nếu bạn sử dụng cookie

      const response = await axios.get(
        "http://localhost:5000/api/scores/export-scores",
        {
          responseType: "blob", // Để xử lý file blob
          headers: {
            Authorization: `Bearer ${token}`, // Thêm token vào header nếu cần
          },
        }
      );

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

  if (loading) return <p className="text-center py-4">Đang tải dữ liệu...</p>;
  if (error)
    return <p className="text-center text-red-500 py-4">Lỗi: {error}</p>;

  return (
    <div className="main-container" style={{ paddingRight: "50px" }}>
      <div style={{ marginBottom: "1rem", position: "relative" }}>
        <SearchIcon
          style={{
            position: "absolute",
            left: "10px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#ccc",
          }}
        />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên sinh viên hoặc mã sinh viên"
          value={searchTerm}
          onChange={handleSearch}
          style={{
            width: "100%",
            padding: "0.5rem 0.5rem 0.5rem 2.5rem",
            border: "1px solid #ccc",
            borderRadius: "0.25rem",
            boxSizing: "border-box",
          }}
        />
      </div>

      <TableContainer className="table-container" style={{ marginTop: "1rem" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Mã sinh viên</TableCell>
              <TableCell>Tên sinh viên</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Số điện thoại</TableCell>
              <TableCell>Lớp</TableCell>
              <TableCell>Chuyên ngành</TableCell>
              <TableCell>Giới tính</TableCell>
              <TableCell>Nhập điểm</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((studentData) => (
                <TableRow key={studentData.student.studentId}>
                  <TableCell>{studentData.student.studentId}</TableCell>
                  <TableCell>{studentData.student.name}</TableCell>
                  <TableCell>{studentData.student.email}</TableCell>
                  <TableCell>{studentData.student.phone}</TableCell>
                  <TableCell>{studentData.student.class}</TableCell>
                  <TableCell>{studentData.student.major}</TableCell>
                  <TableCell>{studentData.student.gender}</TableCell>
                  <TableCell>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => {
                        handleStudentSelect(studentData); // Gọi hàm chọn sinh viên
                      }}
                    >
                      Nhập điểm
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Nút xuất file Excel nằm bên dưới bảng */}
      <Button
        variant="contained"
        color="secondary"
        onClick={handleExportExcel}
        sx={{ ml: 2, mt: 2 }}
      >
        Xuất file Excel
      </Button>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredStudents.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>
  );
};

export default ListStudentTeacher;
