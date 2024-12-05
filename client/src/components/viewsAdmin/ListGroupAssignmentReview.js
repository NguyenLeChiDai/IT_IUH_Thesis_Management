import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import "../../css/ListGroupAssignmentReview.css";
import { TablePagination } from "@mui/material";
import { apiUrl } from "../../contexts/constants";

function ListGroupAssignmentReview() {
  const { teacherId } = useParams();
  const navigate = useNavigate();
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const fetchGroupsForReview = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${apiUrl}/reviewAssignment/get-groups-for-review/${teacherId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setSelectedGroups(response.data.groups);
        setError(null);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Có lỗi xảy ra khi tải danh sách nhóm"
      );
      toast.error("Có lỗi xảy ra khi tải danh sách nhóm");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!teacherId) {
      navigate("/dashboardAdmin/review-topics");
      return;
    }
    fetchGroupsForReview();
  }, [teacherId, navigate]);

  const handleAssignReviewer = async (groupId) => {
    try {
      const result = await Swal.fire({
        title: "Xác nhận phân công",
        text: "Bạn có chắc chắn muốn phân công giảng viên này chấm phản phản biện?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Xác nhận",
        cancelButtonText: "Hủy",
        reverseButtons: true,
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem("token");
        const response = await axios.post(
          `${apiUrl}/reviewAssignment/assign-reviewer`,
          {
            teacherId,
            groupId,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.success) {
          // Fetch lại dữ liệu mới từ server sau khi phân công thành công
          await fetchGroupsForReview();
          toast.success("Phân công giảng viên phản biện thành công");
        } else {
          toast.error(response.data.message || "Phân công không thành công");
        }
      }
    } catch (err) {
      console.error("Error assigning reviewer:", err);
      toast.error(
        err.response?.data?.message ||
          "Có lỗi xảy ra khi phân công giảng viên phản biện"
      );
    }
  };

  const handleCancelAssignment = async (groupId) => {
    try {
      const group = selectedGroups.find((g) => g.groupId === groupId);

      if (!group?.assignmentId) {
        toast.error("Không tìm thấy thông tin phân công");
        return;
      }

      if (group.assignmentStatus === "Đã chấm điểm") {
        toast.error("Không thể hủy phân công đã chấm điểm");
        return;
      }

      const result = await Swal.fire({
        title: "Xác nhận hủy phân công",
        text: "Bạn có chắc chắn muốn hủy phân công giảng viên chấm phản biện này?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xác nhận",
        cancelButtonText: "Hủy",
        reverseButtons: true,
      });

      if (result.isConfirmed) {
        const token = localStorage.getItem("token");
        const response = await axios.delete(
          `${apiUrl}/reviewAssignment/cancel-assignment/${group.assignmentId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.success) {
          // Fetch lại dữ liệu mới từ server sau khi hủy phân công thành công
          await fetchGroupsForReview();
          toast.success("Hủy phân công thành công");
        } else {
          throw new Error(
            response.data.message || "Hủy phân công không thành công"
          );
        }
      }
    } catch (err) {
      console.error("Error canceling assignment:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Có lỗi xảy ra khi hủy phân công";
      toast.error(errorMessage);
    }
  };

  const filteredGroups = selectedGroups.filter(
    (group) =>
      group.topicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.supervisorTeacher.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedGroups = filteredGroups.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) return <div className="loading">Đang tải danh sách nhóm...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="list-group-assignment-review-container">
      <div className="header-assignment">
        <h2 style={{ fontFamily: "revert-layer" }}>
          Quản lý Phân công Chấm Phản Biện
        </h2>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên đề tài hoặc giảng viên..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
      </div>

      {paginatedGroups.length > 0 ? (
        paginatedGroups.map((group) => (
          <div key={group.groupId} className="group-card">
            <div
              className="group-content"
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div className="group-details">
                <h4 className="group-topic">{group.topicName}</h4>
                <p className="teacher-name">
                  <strong>Giáo viên hướng dẫn:</strong>{" "}
                  {group.supervisorTeacher.name}
                </p>
                <div className="sub-group">
                  <h5>{group.groupName}</h5>
                  <ul>
                    {group.students.map((student) => (
                      <li
                        key={student.studentId}
                        className="student-info"
                        style={{
                          marginBottom: "15px",
                          padding: "10px",
                          backgroundColor: "#f8f9fa",
                          borderRadius: "8px",
                          boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                        }}
                      >
                        {student.studentId} - {student.name} - {student.class} (
                        {student.role})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              <div
                className="button-container"
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginTop: "50px",
                  width: "300px",
                }}
              >
                <button
                  className={`assign-reviewer-btn ${
                    group.hasReviewer ? "cancel" : ""
                  }`}
                  onClick={() =>
                    group.hasReviewer
                      ? handleCancelAssignment(group.groupId)
                      : handleAssignReviewer(group.groupId)
                  }
                >
                  {group.hasReviewer
                    ? "Hủy Phân Công"
                    : "Phân Công Chấm Phản Biện"}
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <p className="no-group-message">Không có nhóm nào khả dụng.</p>
      )}

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredGroups.length}
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

export default ListGroupAssignmentReview;
