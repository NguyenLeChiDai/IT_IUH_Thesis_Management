import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../css/TopicReview.css";
import { TablePagination } from "@mui/material";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import { apiUrl } from "../../contexts/constants";
function TopicReview() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [expandedAssignmentId, setExpandedAssignmentId] = useState(null);
  const [scores, setScores] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [savedScores, setSavedScores] = useState({}); // State mới để lưu điểm đã nhập

  useEffect(() => {
    fetchAssignedGroups();
  }, []);

  // Fetch điểm cho tất cả sinh viên khi assignments thay đổi
  useEffect(() => {
    if (assignments.length > 0) {
      const allStudents = assignments.flatMap(
        (assignment) => assignment.groupInfo.students
      );
      fetchExistingScores(allStudents);
    }
  }, [assignments]);

  const fetchExistingScores = async (students) => {
    try {
      const token = localStorage.getItem("token");
      const promises = students.map((student) =>
        axios.get(`${apiUrl}/scores/get-scores/${student.studentId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
      );

      const responses = await Promise.all(promises);
      const newSavedScores = {};

      responses.forEach((response, index) => {
        if (
          response.data.success &&
          response.data.scores &&
          response.data.scores.length > 0
        ) {
          const studentId = students[index].studentId;
          // Lấy điểm từ mảng scores (vì API trả về mảng scores)
          newSavedScores[studentId] = response.data.scores[0].reviewerScore;
        }
      });

      setSavedScores(newSavedScores);
    } catch (error) {
      console.error("Error fetching existing scores:", error);
      toast.error("Lỗi khi tải điểm từ database");
    }
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Sửa hàm toggleExpand để fetch điểm khi mở rộng card
  const toggleExpand = async (assignmentId) => {
    const isExpanding = expandedAssignmentId !== assignmentId;
    setExpandedAssignmentId(isExpanding ? assignmentId : null);

    if (isExpanding) {
      const assignment = assignments.find(
        (a) => a.assignmentId === assignmentId
      );
      if (assignment) {
        await fetchExistingScores(assignment.groupInfo.students);
      }
    }
  };

  const fetchAssignedGroups = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${apiUrl}/reviewAssignment/get-assigned-groups`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        const assignmentsData = response.data.assignments;

        // Fetch điểm cho tất cả sinh viên để kiểm tra trạng thái
        const updatedAssignments = await Promise.all(
          assignmentsData.map(async (assignment) => {
            // Kiểm tra điểm của tất cả sinh viên trong nhóm
            const hasScores = await checkGroupScores(
              assignment.groupInfo.students
            );
            return {
              ...assignment,
              assignmentStatus: hasScores ? "Đã chấm điểm" : "Chờ chấm điểm",
            };
          })
        );

        setAssignments(updatedAssignments);
        setError(null);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Có lỗi xảy ra khi tải danh sách nhóm được phân công"
      );
    } finally {
      setLoading(false);
    }
  };

  // Hàm kiểm tra xem nhóm đã có điểm chưa
  const checkGroupScores = async (students) => {
    try {
      const token = localStorage.getItem("token");
      const promises = students.map((student) =>
        axios.get(`${apiUrl}/scores/get-scores/${student.studentId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
      );

      const responses = await Promise.all(promises);

      // Trả về true nếu ít nhất một sinh viên trong nhóm đã có điểm
      return responses.some(
        (response) =>
          response.data.success &&
          response.data.scores &&
          response.data.scores.length > 0
      );
    } catch (error) {
      console.error("Error checking group scores:", error);
      return false;
    }
  };

  const filteredAssignments = assignments.filter(
    (assignment) =>
      assignment.groupInfo.groupName
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      assignment.topicInfo.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      assignment.groupInfo.students.some(
        (student) =>
          student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedAssignments = filteredAssignments.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleScoreChange = (studentId, value) => {
    setScores((prev) => ({
      ...prev,
      [studentId]: value,
    }));
  };

  // Cập nhật hàm handleSubmitScores
  const handleSubmitScores = async (assignment) => {
    setSubmitting(true);

    const hasInvalidScores = assignment.groupInfo.students.some((student) => {
      const score = scores[student.studentId];
      return score !== undefined && (score < 0 || score > 10);
    });

    if (hasInvalidScores) {
      toast.error("Điểm phải nằm trong khoảng từ 0 đến 10");
      setSubmitting(false);
      return;
    }

    const hasAnyScores = assignment.groupInfo.students.some(
      (student) => scores[student.studentId] !== undefined
    );

    if (!hasAnyScores) {
      toast.warning("Vui lòng nhập điểm cho ít nhất một sinh viên");
      setSubmitting(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const promises = assignment.groupInfo.students.map((student) => {
        const score = scores[student.studentId];
        if (score !== undefined) {
          return axios.post(
            `${apiUrl}/scores/input-scores-review`,
            {
              studentId: student.studentId,
              reviewerScore: parseFloat(score),
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
        }
        return Promise.resolve();
      });

      await Promise.all(promises);

      // Cập nhật savedScores
      const newSavedScores = { ...savedScores };
      Object.keys(scores).forEach((studentId) => {
        if (scores[studentId] !== undefined) {
          newSavedScores[studentId] = parseFloat(scores[studentId]);
        }
      });
      setSavedScores(newSavedScores);

      // Cập nhật trạng thái assignment
      const updatedAssignments = assignments.map((a) => {
        if (a.assignmentId === assignment.assignmentId) {
          return {
            ...a,
            assignmentStatus: "Đã chấm điểm",
          };
        }
        return a;
      });
      setAssignments(updatedAssignments);

      toast.success("Nhập điểm thành công! 🎉");
      setScores({}); // Clear input scores

      // Fetch lại điểm và trạng thái
      await fetchAssignedGroups();
    } catch (err) {
      toast.error(err.response?.data?.message || "Có lỗi xảy ra khi lưu điểm");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="topic-review-container">
      <div className="header-review">
        <h2>Danh sách nhóm được phân công phản biện</h2>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên nhóm, tên đề tài, tên sinh viên..."
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      <div className="assignments-grid">
        {paginatedAssignments.map((assignment) => (
          <div key={assignment.assignmentId} className="assignment-card">
            <div className="assignment-header" style={{ marginTop: "-10px" }}>
              <div className="header-top">
                <span
                  className={`status-badge ${
                    assignment.assignmentStatus === "Đã chấm điểm"
                      ? "completed"
                      : "pending"
                  }`}
                >
                  {assignment.assignmentStatus}
                </span>

                <span className="assigned-date" style={{ marginLeft: "15px" }}>
                  Ngày phân công:{" "}
                  {new Date(assignment.assignedDate).toLocaleDateString(
                    "vi-VN"
                  )}
                </span>
              </div>
            </div>

            <div className="assignment-card">
              <div className="assignment-content">
                <div className="assignment-header">
                  <h3
                    style={{
                      display: "inline-block",
                      padding: "4px 8px",
                      borderRadius: "5px",
                    }}
                  >
                    {assignment.topicInfo.name}
                  </h3>

                  <div className="details-container">
                    <button
                      onClick={() => toggleExpand(assignment.assignmentId)}
                      className="details-button"
                    >
                      {expandedAssignmentId === assignment.assignmentId
                        ? "Thu gọn"
                        : "Xem chi tiết"}
                    </button>
                    <span className="expand-icon">
                      {expandedAssignmentId === assignment.assignmentId
                        ? "▲"
                        : "▼"}
                    </span>
                  </div>
                </div>
                <h4>{assignment.groupInfo.groupName}</h4>
                <p className="advisor-info">
                  <strong>GVHD:</strong> {assignment.topicInfo.advisor.name}
                </p>
              </div>
            </div>

            {/* Phần hiển thị Description */}

            {expandedAssignmentId === assignment.assignmentId && (
              <div className="description-info">
                <h4 style={{ fontWeight: "bold" }}>Mô tả dự án: </h4>
                <p>{assignment.topicInfo.description}</p>
              </div>
            )}

            {expandedAssignmentId === assignment.assignmentId && (
              <div className="group-info">
                <div className="group-header">
                  {/* <h4>{assignment.groupInfo.groupName} - {assignment.groupInfo.groupId}</h4> */}
                </div>

                <div className="students-list">
                  <div className="students-grid">
                    {assignment.groupInfo.students.map((student, index) => (
                      <div key={index} className="student-info">
                        <p>
                          <strong>{student.role}:</strong> {student.name}{" "}
                        </p>
                        <p>MSSV: {student.studentId} </p>
                        <p>Email: {student.email}</p>
                        <p>SĐT: {student.phone}</p>
                        <div className="grade-inputs">
                          <div className="grade-input-group">
                            <label>Điểm Phản Biện:</label>
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              value={scores[student.studentId] || ""}
                              onChange={(e) =>
                                handleScoreChange(
                                  student.studentId,
                                  e.target.value
                                )
                              }
                              placeholder="Nhập điểm"
                              style={{ width: "180px" }}
                            />

                            {savedScores[student.studentId] !== undefined && (
                              <div className="saved-score">
                                <span>Điểm đã nhập: </span>
                                <strong>
                                  {savedScores[student.studentId]}
                                </strong>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="assignment-actions">
              <button
                className="grade-btn"
                onClick={() => handleSubmitScores(assignment)}
                disabled={submitting}
              >
                {assignment.assignmentStatus === "Đã chấm điểm"
                  ? "Cập nhật điểm"
                  : "Lưu điểm"}
              </button>
            </div>
          </div>
        ))}
      </div>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredAssignments.length}
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

export default TopicReview;
