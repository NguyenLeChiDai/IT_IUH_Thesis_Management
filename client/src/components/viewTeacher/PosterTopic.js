import React, { useState, useEffect } from "react";
import axios from "axios";
import { TablePagination } from "@mui/material";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import { apiUrl } from "../../contexts/constants";

function PosterTopic() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [expandedAssignmentId, setExpandedAssignmentId] = useState(null);
  const [scores, setScores] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [savedScores, setSavedScores] = useState({});

  useEffect(() => {
    fetchPosterAssignments();
  }, []);

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
          newSavedScores[studentId] = response.data.scores[0].posterScore;
        }
      });

      setSavedScores(newSavedScores);
    } catch (error) {
      console.error("Error fetching existing scores:", error);
      toast.error("Lỗi khi tải điểm từ database");
    }
  };

  // const fetchPosterAssignments = async () => {
  //   try {
  //     const token = localStorage.getItem("token");
  //     const response = await axios.get(
  //       `${apiUrl}/posterAssignment/get-poster-assignments`,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );

  //     if (response.data.success) {
  //       const transformedAssignments = response.data.assignments.map(assignment => ({
  //         assignmentId: assignment._id,
  //         assignedDate: assignment.assignedDate,
  //         assignmentStatus: assignment.status || "Chờ chấm điểm",
  //         groupInfo: {
  //           groupName: assignment.studentGroup[0].groupName,
  //           students: assignment.studentGroup[0].profileStudents.map(profile => ({
  //             name: profile.student.name,
  //             studentId: profile.student.studentId,
  //             email: profile.student.email,
  //             phone: profile.student.phone,
  //             role: profile.role
  //           }))
  //         },
  //         topicInfo: {
  //           name: assignment.topic[0].nameTopic,
  //           description: assignment.topic[0].descriptionTopic,
  //           advisor: {
  //             name: assignment.topic[0].teacher.name
  //           }
  //         }
  //       }));

  //       const assignmentsData = await Promise.all(
  //         transformedAssignments.map(async (assignment) => {
  //           const hasScores = await checkGroupScores(assignment.groupInfo.students);
  //           return {
  //             ...assignment,
  //             assignmentStatus: hasScores ? "Đã chấm điểm" : "Chờ chấm điểm",
  //           };
  //         })
  //       );

  //       setAssignments(assignmentsData);
  //       setError(null);
  //     } else {
  //       setError(response.data.message);
  //     }
  //   } catch (err) {
  //     console.error("Full error:", err);
  //     setError(
  //       err.response?.data?.message ||
  //       "Có lỗi xảy ra khi tải danh sách nhóm được phân công"
  //     );
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const fetchPosterAssignments = async () => {
    try {
      // Thiết lập trạng thái ban đầu
      setLoading(true);
      setError(null);

      // Lấy token từ localStorage
      const token = localStorage.getItem("token");

      // Gọi API để lấy danh sách phân công poster
      const response = await axios.get(
        `${apiUrl}/posterAssignment/get-poster-assignments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Kiểm tra phản hồi thành công
      if (response.data.success) {
        // Biến đổi dữ liệu assignments
        const transformedAssignments = response.data.assignments.flatMap(
          (assignment) =>
            assignment.studentGroup.map((group) => ({
              assignmentId: assignment._id,
              assignedDate: assignment.assignedDate,
              assignmentStatus: assignment.status || "Chờ chấm điểm",
              groupInfo: {
                groupId: group._id,
                groupName: group.groupName,
                groupStatus: group.groupStatus,
                students: group.profileStudents.map((profile) => ({
                  name: profile.student.name,
                  studentId: profile.student.studentId,
                  email: profile.student.email,
                  phone: profile.student.phone,
                  role: profile.role,
                })),
              },
              topicInfo: {
                name: assignment.topic[0].nameTopic,
                description: assignment.topic[0].descriptionTopic,
                advisor: {
                  name: assignment.topic[0].teacher.name,
                  teacherId: assignment.topic[0].teacher.teacherId,
                },
              },
            }))
        );

        // Kiểm tra điểm số cho từng nhóm
        const assignmentsData = await Promise.all(
          transformedAssignments.map(async (assignment) => {
            try {
              const hasScores = await checkGroupScores(
                assignment.groupInfo.students
              );
              return {
                ...assignment,
                assignmentStatus: hasScores ? "Đã chấm điểm" : "Chờ chấm điểm",
              };
            } catch (scoreError) {
              console.error("Error checking scores:", scoreError);
              return assignment; // Trả về trạng thái ban đầu nếu có lỗi
            }
          })
        );

        // Cập nhật state
        setAssignments(assignmentsData);
      } else {
        // Xử lý khi không có dữ liệu
        setError(response.data.message || "Không có dữ liệu phân công");
        setAssignments([]);
      }
    } catch (err) {
      // Xử lý lỗi
      console.error("Full error in fetchPosterAssignments:", err);
      setError(
        err.response?.data?.message ||
          "Có lỗi xảy ra khi tải danh sách nhóm được phân công"
      );
      setAssignments([]);
    } finally {
      // Kết thúc quá trình tải
      setLoading(false);
    }
  };

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
      return responses.every(
        (response) =>
          response.data.success &&
          response.data.scores &&
          response.data.scores.length > 0 &&
          response.data.scores[0].posterScore !== undefined
      );
    } catch (error) {
      console.error("Error checking group scores:", error);
      return false;
    }
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

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

  const handleScoreChange = (studentId, value) => {
    setScores((prev) => ({
      ...prev,
      [studentId]: value,
    }));
  };

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
            `${apiUrl}/scores/input-scores-poster`,
            {
              studentId: student.studentId,
              posterScore: parseFloat(score),
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

      const newSavedScores = { ...savedScores };
      Object.keys(scores).forEach((studentId) => {
        if (scores[studentId] !== undefined) {
          newSavedScores[studentId] = parseFloat(scores[studentId]);
        }
      });
      setSavedScores(newSavedScores);

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
      setScores({});
      /*  await fetchPosterAssignments(); */
    } catch (error) {
      // toast.error(err.response?.data?.message || "Có lỗi xảy ra khi lưu điểm");
      // Xử lý trường hợp chức năng bị khóa
      if (error.response && error.response.status === 403) {
        await Swal.fire({
          title: "Chức Năng Bị Khóa",
          text:
            error.response.data.message ||
            "Chức năng nhập điểm hội đồng hiện đang bị khóa",
          icon: "warning",
          confirmButtonText: "Đóng",
        });
      } else {
        toast.error(
          error.response?.data?.message || "Có lỗi xảy ra khi lưu điểm"
        );
      }
    } finally {
      setSubmitting(false);
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

  if (loading) return <div className="loading">Đang tải dữ liệu...</div>;
  if (error) return <div className="error">{error}</div>;
  return (
    <div className="topic-review-container">
      <div className="header-review">
        <h2>Danh sách nhóm được phân công chấm poster</h2>
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
              {/* <p className="council-info">
                                <strong>Số thành viên hội đồng:</strong> {assignment.groupInfo.councilInfo.currentMembers}/{assignment.groupInfo.councilInfo.maxMembers}
                            </p> */}
            </div>

            {expandedAssignmentId === assignment.assignmentId && (
              <>
                <div className="description-info">
                  <h4 style={{ fontWeight: "bold" }}>Mô tả dự án: </h4>
                  <p>{assignment.topicInfo.description}</p>
                </div>

                <div className="group-info">
                  <div className="students-list">
                    <div className="students-grid">
                      {assignment.groupInfo.students.map((student, index) => (
                        <div key={index} className="student-info">
                          <p>
                            <strong>{student.role}:</strong> {student.name}
                          </p>
                          <p>MSSV: {student.studentId}</p>
                          <p>Email: {student.email}</p>
                          <p>SĐT: {student.phone}</p>
                          <div className="grade-inputs">
                            <div className="grade-input-group">
                              <label>Điểm Poster:</label>
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
              </>
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

export default PosterTopic;
