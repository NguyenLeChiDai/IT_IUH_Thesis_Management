import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import "../../css/ListGroupAssignmentCouncil.css";
import { TablePagination } from "@mui/material";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";

function ListGroupAssignmentCouncil() {
  const { teacherId } = useParams();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const fetchEligibleGroups = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/councilAssignment/get-eligible-council-students/${teacherId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setGroups(response.data.eligibleGroups);
        setError(null);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Có lỗi xảy ra khi tải danh sách nhóm"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEligibleGroups();
  }, [teacherId]);

  const filteredGroups = groups.filter(
    (group) =>
      group.groupInfo.groupName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      group.nameTopic.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssignCouncil = async (group) => {
    try {
      const result = await Swal.fire({
        title: "Xác nhận phân công",
        html: `
                    <div class="confirmation-dialog">
                        <p>Bạn có chắc chắn muốn phân công giảng viên này chấm hội đồng cho:</p>
                        <div class="group-details">
                            <p><strong>Nhóm:</strong> ${group.groupInfo.groupName}</p>
                            <p><strong>Đề tài:</strong> ${group.nameTopic}</p>
                            <p><strong>GVHD:</strong> ${group.advisor.name}</p>
                        </div>
                    </div>
                `,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Xác nhận",
        cancelButtonText: "Hủy",
        reverseButtons: true,
      });

      if (!result.isConfirmed) {
        return;
      }

      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/councilAssignment/assign-council-teacher",
        { teacherId, groupId: group._id },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        // Cập nhật state local với thông tin mới
        setGroups((prevGroups) =>
          prevGroups.map((g) =>
            g._id === group._id
              ? {
                  ...g,
                  isAssigned: true,
                  councilInfo: response.data.assignment,
                }
              : g
          )
        );

        toast.success(response.data.message);
        // Refresh data để đảm bảo đồng bộ
        await fetchEligibleGroups();
      }
    } catch (error) {
      console.error("Lỗi khi phân công hội đồng:", error);
      toast.error(
        error.response?.data?.message ||
          "Có lỗi xảy ra khi phân công giảng viên"
      );
    }
  };

  const handleCancelAssignment = async (group) => {
    try {
      const result = await Swal.fire({
        title: "Xác nhận hủy phân công",
        html: `
                    <div class="confirmation-dialog">
                        <p>Bạn có chắc chắn muốn hủy phân công giảng viên này khỏi hội đồng cho:</p>
                        <div class="group-details">
                            <p><strong>Nhóm:</strong> ${group.groupInfo.groupName}</p>
                            <p><strong>Đề tài:</strong> ${group.nameTopic}</p>
                            <p><strong>GVHD:</strong> ${group.advisor.name}</p>
                        </div>
                    </div>
                `,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xác nhận",
        cancelButtonText: "Hủy",
        confirmButtonColor: "#d33",
        reverseButtons: true,
      });

      if (!result.isConfirmed) {
        return;
      }

      // Kiểm tra xem group có councilInfo và _id không
      if (!group.councilInfo?._id) {
        throw new Error("Không tìm thấy thông tin phân công hội đồng");
      }

      const token = localStorage.getItem("token");
      const response = await axios.delete(
        // Sử dụng councilInfo._id thay vì group._id vì ta cần id của assignment
        `http://localhost:5000/api/councilAssignment/cancel-council-assignment/${group.councilInfo._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        setGroups((prevGroups) =>
          prevGroups.map((g) =>
            g._id === group._id
              ? {
                  ...g,
                  isAssigned: false,
                  councilInfo: null,
                }
              : g
          )
        );

        toast.success("Hủy phân công thành công");
        // Refresh data để đảm bảo đồng bộ
        await fetchEligibleGroups();
      }
    } catch (error) {
      console.error("Lỗi khi hủy phân công:", error);
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi hủy phân công"
      );
    }
  };

  // Render phần button với styles
  const renderAssignmentButton = (group) => (
    <button
      onClick={() =>
        group.isAssigned
          ? handleCancelAssignment(group)
          : handleAssignCouncil(group)
      }
      className={`assignment-button ${group.isAssigned ? "cancel" : "assign"}`}
      style={{
        backgroundColor: group.isAssigned ? "#dc3545" : "#28a745",
        color: "white",
        border: "none",
        padding: "8px 16px",
        borderRadius: "4px",
        cursor: "pointer",
        marginTop: "10px",
        transition: "background-color 0.3s",
      }}
    >
      {group.isAssigned ? "Hủy phân công" : "Phân công chấm hội đồng"}
    </button>
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

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="group-list-container">
      <h2 style={{ fontFamily: "revert-layer" }}>
        Danh sách phân công chấm hội đồng
      </h2>

      <input
        type="text"
        placeholder="Tìm kiếm nhóm theo tên hoặc chủ đề"
        value={searchTerm}
        onChange={handleSearch}
        style={{
          marginBottom: "20px",
          width: "50%",
          padding: "10px 10px",
          fontSize: "14px",
          border: "2px solid #e1e1e1",
          borderRadius: "8px",
          outline: "none",
          transition: "all 0.3s ease",
          backgroundColor: "#ffffff",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          "&:focus": {
            borderColor: "#3b82f6",
            boxShadow: "0 2px 8px rgba(59, 130, 246, 0.2)",
          },
          "&::placeholder": {
            color: "#9ca3af",
          },
        }}
      />

      {groups.length === 0 ? (
        <p>Không có nhóm nào đủ điều kiện</p>
      ) : (
        <div className="group-list">
          {paginatedGroups.map((group) => (
            <div key={group._id} className="group-card-main">
              <h3>{group.groupInfo.groupName}</h3>
              <div className="students-main">
                <p>
                  <strong>Chủ đề: </strong>
                  {group.nameTopic}
                </p>
                {group.students.map((student, index) => (
                  <div key={index} className="student-info-main">
                    <p>
                      <strong>{student.name}</strong> - {student.studentId}
                    </p>
                    <p>
                      <strong>Vai trò:</strong> {student.role}
                    </p>
                    <p>
                      <strong>Điểm:</strong> GVHD -{" "}
                      {student.scores.instructorScore}, Giảng viên phản biện -{" "}
                      {student.scores.reviewerScore}, {/* Tổng -{" "} */}
                      {/* {student.scores.total} */}
                    </p>
                  </div>
                ))}
              </div>
              <p style={{ marginTop: "20px" }}>
                <strong>Giảng viên hướng dẫn:</strong> {group.advisor.name}
              </p>
              {renderAssignmentButton(group)}
              {/* <button
                                onClick={() => group.isAssigned ? handleCancelAssignment(group) : handleAssignCouncil(group)}
                                className={`assignment-button ${group.isAssigned ? 'cancel' : 'assign'}`}
                                style={{
                                    backgroundColor: group.isAssigned ? '#dc3545' : '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px 16px',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    marginTop: '10px'
                                }}
                            >
                                {group.isAssigned ? 'Hủy phân công' : 'Phân công chấm hội đồng'}
                            </button> */}
            </div>
          ))}
        </div>
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

export default ListGroupAssignmentCouncil;
