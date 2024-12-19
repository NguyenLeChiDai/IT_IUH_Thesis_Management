import React, { useState, useEffect } from "react";
import axios from "axios";
import { apiUrl } from "../../contexts/constants";
import "../../css/Assignment.css";
import { toast } from "react-toastify";
import { Button } from "react-bootstrap";
import { Typography, TablePagination } from "@mui/material";
import Swal from "sweetalert2";

function AssignmentPoster() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [committees, setCommittees] = useState([]);
  const [selectedLecturers, setSelectedLecturers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [assignedGroups, setAssignedGroups] = useState([]);
  const [selectedCommittee, setSelectedCommittee] = useState(null);

  // Phân trang
  const [teacherPage, setTeacherPage] = useState(0);
  const [committeePage, setCommitteePage] = useState(0);
  const [groupPage, setGroupPage] = useState(0);
  const teachersPerPage = 9;
  const committeesPerPage = 6;
  const groupsPerPage = 6; // Số lượng nhóm trên mỗi trang

  useEffect(() => {
    fetchTeachers();
    fetchCommittees();
  }, []);

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${apiUrl}/posterAssignment/get-all-teachers-poster`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.data.success) {
        setTeachers(response.data.teachers || []);
        setError(null);
      } else {
        setError(response.data.message);
        setTeachers([]);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Có lỗi xảy ra khi tải danh sách giáo viên"
      );
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommittees = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${apiUrl}/posterAssignment/get-all-poster-assignments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.data.success) {
        setCommittees(response.data.posterAssignments || []);
      } else {
        setError(response.data.message);
        setCommittees([]);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Có lỗi xảy ra khi tải danh sách hội đồng"
      );
      setCommittees([]);
    }
  };

  const handleTeacherSelect = (teacher) => {
    setSelectedLecturers((prev) => {
      const isAlreadySelected = prev.some((t) => t._id === teacher._id);
      if (isAlreadySelected) {
        return prev.filter((t) => t._id !== teacher._id);
      }
      if (prev.length < 2) {
        return [...prev, teacher];
      }
      toast.warning("Chỉ được chọn tối đa 2 giảng viên");
      return prev;
    });
  };

  const handleCreatePoster = async () => {
    // Xác nhận trước khi tạo
    const result = await Swal.fire({
      title: "Xác Nhận Tạo Hội Đồng Poster",
      text: "Bạn có chắc chắn muốn tạo hội đồng poster với 2 giảng viên này?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy",
    });

    if (!result.isConfirmed) return;

    if (selectedLecturers.length !== 2) {
      toast.error("Vui lòng chọn đúng 2 giảng viên");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${apiUrl}/posterAssignment/create-poster-assignment`,
        {
          // Đổi từ teacherIds sang PosterTeacher
          PosterTeacher: selectedLecturers.map((t) => t._id),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        toast.success("Tạo hội đồng thành công");
        fetchCommittees();
        fetchTeachers();
        setShowModal(false);
        setSelectedLecturers([]);
      } else {
        toast.error(response.data.message);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Có lỗi xảy ra khi tạo hội đồng"
      );
    }
  };

  const handleDeleteCommittee = async (committeeId) => {
    // Xác nhận trước khi xóa
    const result = await Swal.fire({
      title: "Xác Nhận Xóa Hội Đồng Poster",
      text: "Bạn có chắc chắn muốn xóa hội đồng này? Thao tác này không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.delete(
        `${apiUrl}/posterAssignment/delete-poster-assignment/${committeeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        toast.success("Xóa hội đồng thành công");
        fetchCommittees();
        fetchTeachers();
      } else {
        toast.error(response.data.message);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Có lỗi xảy ra khi xóa hội đồng"
      );
    }
  };

  // lấy danh sách nhóm sv
  /* const handleListGroupPoster = async (committee) => {
    // Kiểm tra hội đồng hợp lệ
    if (
      !committee ||
      !committee.PosterTeacher ||
      committee.PosterTeacher.length !== 2
    ) {
      setError("Hội đồng phải có đúng 2 giảng viên");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");

      // Lấy ID của 2 giảng viên
      const teacherIds = committee.PosterTeacher.map((teacher) => teacher._id);

      const response = await axios.get(
        `${apiUrl}/posterAssignment/get-eligible-poster-students/${teacherIds[0]}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          params: {
            secondTeacherId: teacherIds[1],
          },
        }
      );

      if (response.data.success) {
        const eligibleGroups = response.data.eligibleGroups || [];

        // Thêm trạng thái isAssigned cho từng nhóm
        const groupsWithAssignmentStatus = eligibleGroups.map((group) => ({
          ...group,
          isAssigned:
            committee.studentGroup &&
            committee.studentGroup.some(
              (assignedGroup) => assignedGroup._id === group._id
            ),
        }));

        setAssignedGroups(groupsWithAssignmentStatus);
        setSelectedCommittee(committee);
        setShowGroupModal(true);
      } else {
        setError(response.data.message || "Không thể tải danh sách nhóm");
        setAssignedGroups([]);
      }
    } catch (err) {
      setError("Đã xảy ra lỗi khi tải danh sách nhóm");
      setAssignedGroups([]);
    } finally {
      setLoading(false);
    }
  };
 */
  const handleListGroupPoster = async (committee) => {
    // Kiểm tra hội đồng hợp lệ
    if (
      !committee ||
      !committee.PosterTeacher ||
      committee.PosterTeacher.length !== 2
    ) {
      setError("Hội đồng phải có đúng 2 giảng viên");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const teacherIds = committee.PosterTeacher.map((teacher) => teacher._id);

      const response = await axios.get(
        `${apiUrl}/posterAssignment/get-eligible-poster-students/${teacherIds[0]}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          params: {
            secondTeacherId: teacherIds[1],
            reviewPanelId: committee._id,
          },
        }
      );

      if (response.data.success) {
        const eligibleGroups = response.data.eligibleGroups || [];

        // Lọc các nhóm:
        // 1. Chưa được phân công cho bất kỳ hội đồng nào
        // 2. Hoặc đã được phân công cho hội đồng hiện tại
        const filteredGroups = eligibleGroups.filter((group) => {
          // Kiểm tra nếu nhóm đã được phân công cho hội đồng hiện tại
          const isAssignedToCurrentCommittee = committee.studentGroup?.some(
            (assignedGroup) => assignedGroup._id === group._id
          );

          // Kiểm tra nếu nhóm đã được phân công cho bất kỳ hội đồng nào khác
          const isAssignedToAnyCommittee = committees.some((comm) =>
            comm.studentGroup?.some(
              (assignedGroup) => assignedGroup._id === group._id
            )
          );

          // Hiển thị nhóm nếu:
          // - Đã được phân công cho hội đồng hiện tại
          // - Hoặc chưa được phân công cho bất kỳ hội đồng nào
          return isAssignedToCurrentCommittee || !isAssignedToAnyCommittee;
        });

        // Thêm trạng thái isAssigned cho mỗi nhóm
        const groupsWithAssignmentStatus = filteredGroups.map((group) => ({
          ...group,
          isAssigned: committee.studentGroup?.some(
            (assignedGroup) => assignedGroup._id === group._id
          ),
        }));

        console.log("Processed groups:", groupsWithAssignmentStatus);

        setAssignedGroups(groupsWithAssignmentStatus);
        setSelectedCommittee(committee);
        setShowGroupModal(true);
      } else {
        setError(response.data.message || "Không thể tải danh sách nhóm");
        setAssignedGroups([]);
      }
    } catch (err) {
      console.error("Error in handleListGroupPoster:", err);
      setError("Đã xảy ra lỗi khi tải danh sách nhóm");
      setAssignedGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentPoster = async (group) => {
    const result = await Swal.fire({
      title: "Xác Nhận Phân Công",
      text: "Bạn có chắc chắn muốn phân công nhóm này cho hội đồng poster?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Phân Công",
      cancelButtonText: "Hủy",
    });

    if (!result.isConfirmed) return;

    try {
      if (!selectedCommittee || !group) {
        toast.warning("Vui lòng chọn hội đồng và nhóm sinh viên");
        return;
      }

      const teacherIds = selectedCommittee.PosterTeacher
        ? selectedCommittee.PosterTeacher.map((teacher) => teacher._id)
        : selectedCommittee.posterTeacher.map((teacher) => teacher._id);

      const payload = {
        reviewPanelId: selectedCommittee._id,
        teacherIds: teacherIds,
        groupId: group._id,
      };

      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${apiUrl}/posterAssignment/assign-poster`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        toast.success("Phân công giảng viên hội đồng poster thành công!");

        // Cập nhật trạng thái trực tiếp trong assignedGroups
        setAssignedGroups((prev) =>
          prev.map((g) => {
            if (g._id === group._id) {
              return { ...g, isAssigned: true };
            }
            return g;
          })
        );

        // Vẫn gọi fetchCommittees để cập nhật danh sách hội đồng
        fetchCommittees();
      } else {
        toast.info(
          response.data.message || "Không thể phân công giảng viên poster"
        );
      }
    } catch (error) {
      console.error("Lỗi khi phân công giảng viên:", error);
      if (error.response) {
        toast.error(
          error.response.data.message || "Lỗi từ máy chủ khi phân công"
        );
      } else if (error.request) {
        toast.error("Không nhận được phản hồi từ máy chủ");
      } else {
        toast.error("Lỗi khi gửi yêu cầu phân công");
      }
    }
  };

  const handleCancelAssignmentPoster = async (assignmentId, group) => {
    const result = await Swal.fire({
      title: "Xác Nhận Hủy Phân Công",
      text: "Bạn có chắc chắn muốn hủy phân công này? Thao tác này không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Hủy Phân Công",
      cancelButtonText: "Đóng",
    });

    if (!result.isConfirmed) return;

    try {
      const token = localStorage.getItem("token");
      const studentGroupId = group._id;
      const topicId = group.topic._id;

      const response = await axios.put(
        `${apiUrl}/posterAssignment/cancel-poster-assignment/${assignmentId}/${studentGroupId}/${topicId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        toast.success("Hủy phân công thành công!");

        // Cập nhật trạng thái trực tiếp trong assignedGroups
        setAssignedGroups((prev) =>
          prev.map((g) => {
            if (g._id === studentGroupId) {
              return { ...g, isAssigned: false };
            }
            return g;
          })
        );

        // Vẫn gọi fetchCommittees để cập nhật danh sách hội đồng
        fetchCommittees();
      } else {
        toast.info(response.data.message || "Không thể hủy phân công");
      }
    } catch (error) {
      console.error("Lỗi khi hủy phân công:", error);
      if (error.response) {
        toast.error(
          error.response.data.message || "Lỗi từ máy chủ khi hủy phân công"
        );
      } else if (error.request) {
        toast.error("Không nhận được phản hồi từ máy chủ");
      } else {
        toast.error("Lỗi khi gửi yêu cầu hủy phân công");
      }
    }
  };

  const filteredTeachers = teachers.filter((teacher) => {
    // Kiểm tra nếu teacher hoặc các thuộc tính là undefined/null
    if (!teacher || !searchTerm) return true; // Nếu không có từ khóa tìm kiếm, hiển thị tất cả

    const searchTermLower = searchTerm.toLowerCase();
    const teacherName = teacher.name || ""; // Nếu name là undefined/null thì gán chuỗi rỗng
    const teacherDepartment = teacher.department || ""; // Nếu department là undefined/null thì gán chuỗi rỗng

    return (
      teacherName.toLowerCase().includes(searchTermLower) ||
      teacherDepartment.toLowerCase().includes(searchTermLower)
    );
  });

  if (loading) {
    return (
      <div className="container text-center mt-5">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Đang tải...</span>
        </div>
        <p>Đang tải danh sách giảng viên...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container text-center mt-5 text-danger">
        <h3>Lỗi: {error}</h3>
        <button
          className="btn btn-primary"
          onClick={() => {
            fetchTeachers();
            fetchCommittees();
          }}
        >
          Thử Lại
        </button>
      </div>
    );
  }

  // Phân trang giảng viên trong modal
  const teacherPageCount = Math.ceil(filteredTeachers.length / teachersPerPage);
  const displayedTeachers = filteredTeachers.slice(
    teacherPage * teachersPerPage,
    (teacherPage + 1) * teachersPerPage
  );

  // Phân trang hội đồng
  const committeePageCount = Math.ceil(committees.length / committeesPerPage);
  const displayedCommittees = committees.slice(
    committeePage * committeesPerPage,
    (committeePage + 1) * committeesPerPage
  );

  // Phân trang nhóm trong modal danh sách nhóm
  const groupPageCount = Math.ceil(
    (assignedGroups || []).length / groupsPerPage
  );
  const displayedGroups = (assignedGroups || []).slice(
    groupPage * groupsPerPage,
    (groupPage + 1) * groupsPerPage
  );

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <h2 className="mb-4 text-center">Quản Lý Hội Đồng Chấm Poster</h2>
          <div className="text-center mb-4">
            <button
              className="btn btn-success btn-lg"
              onClick={() => setShowModal(true)}
              disabled={teachers.length === 0}
            >
              Tạo Hội Đồng Mới
            </button>
          </div>

          <div className="row">
            {(displayedCommittees || []).map((committee, index) => (
              <div key={committee._id} className="col-md-4 mb-3">
                <div className="card shadow-sm">
                  <div
                    className="card-header"
                    style={{
                      backgroundColor: "#0C4370",
                      fontWeight: "bold",
                      color: "white",
                    }}
                  >
                    Hội Đồng #{index + 1}
                  </div>
                  <div className="card-body d-flex justify-content-start gap-3">
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteCommittee(committee._id)}
                    >
                      Xóa Hội Đồng
                    </button>
                    <button
                      className="btn btn-info"
                      onClick={() => {
                        setSelectedCommittee(committee);
                        setShowGroupModal(true);
                        handleListGroupPoster(committee);
                      }}
                    >
                      Danh sách nhóm
                    </button>
                  </div>
                  <div className="card-body">
                    {(committee.PosterTeacher || []).map((lecturer) => (
                      <div
                        key={lecturer._id}
                        className="badge badge-light text-dark d-flex flex-column align-items-start p-3 mb-2"
                        style={{
                          border: "1px solid #ccc",
                          borderRadius: "8px",
                          boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
                          width: "300px",
                        }}
                      >
                        <span style={{ fontWeight: "bold", fontSize: "16px" }}>
                          {lecturer.name}
                        </span>
                        <p
                          className="card-text text-muted"
                          style={{
                            fontSize: "14px",
                            margin: "5px 0 0 0",
                            wordBreak: "break-word",
                          }}
                        >
                          {lecturer.email}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Phân trang hội đồng */}
          <div className="d-flex justify-content-center mt-3">
            <TablePagination
              component="div"
              count={committees.length}
              page={committeePage}
              onPageChange={(event, newPage) => {
                const maxPage = Math.max(0, committeePageCount - 1);
                setCommitteePage(Math.min(newPage, maxPage));
              }}
              rowsPerPage={committeesPerPage}
              rowsPerPageOptions={[committeesPerPage]}
            />
          </div>
        </div>
      </div>

      {/* Modal chọn giảng viên */}
      {showModal && (
        <div className="modal-select-teacher">
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Chọn Giảng Viên Phản Biện</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedLecturers([]);
                    setSearchTerm("");
                  }}
                >
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Tìm kiếm giảng viên theo tên hoặc khoa"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        //setTeacherPage(0); // Reset trang khi tìm kiếm
                      }}
                    />
                  </div>
                  <div className="col-md-6 text-right">
                    <div
                      className="selected-teachers"
                      style={{ marginTop: "7px" }}
                    >
                      <strong>Đã chọn: </strong>
                      {selectedLecturers.map((lecturer) => (
                        <span
                          key={lecturer._id}
                          className="badge badge-primary mr-2"
                          style={{ color: "black" }}
                        >
                          {lecturer.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="row">
                  {displayedTeachers.map((teacher) => (
                    <div key={teacher._id} className="col-md-4 mb-3">
                      <div
                        className={`card teacher-card ${
                          selectedLecturers.some((t) => t._id === teacher._id)
                            ? "selected"
                            : ""
                        }`}
                        onClick={() => handleTeacherSelect(teacher)}
                        style={{
                          cursor: "pointer",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <div className="card-body">
                          <h5
                            className="card-title"
                            style={{ fontSize: "16px" }}
                          >
                            {teacher.name}
                          </h5>
                          <p
                            className="card-text text-muted"
                            style={{ fontSize: "12px" }}
                          >
                            {teacher.email}
                          </p>
                          <p className="card-text">
                            <small
                              className="text-muted"
                              style={{ fontSize: "14px" }}
                            >
                              {teacher.department}
                            </small>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Phân trang giảng viên */}
                <div className="d-flex justify-content-center mt-3">
                  <TablePagination
                    component="div"
                    count={filteredTeachers.length}
                    page={teacherPage}
                    onPageChange={(event, newPage) => setTeacherPage(newPage)}
                    rowsPerPage={teachersPerPage}
                    rowsPerPageOptions={[teachersPerPage]}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Hủy
                </button>
                <button
                  className={`btn ${
                    selectedLecturers.length !== 2
                      ? "btn-secondary"
                      : "btn-success"
                  }`}
                  onClick={handleCreatePoster}
                  disabled={selectedLecturers.length !== 2}
                >
                  Tạo Hội Đồng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal hiển thị danh sách nhóm */}
      {showGroupModal && (
        <div className="modal-select-group" onShow={() => setGroupPage(0)}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Danh Sách Nhóm</h5>
                <button
                  type="button"
                  className="close"
                  onClick={() => {
                    setShowGroupModal(false);
                  }}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                {(displayedGroups || []).length > 0 ? (
                  displayedGroups.map((group, index) => (
                    <div key={group._id} className="card mb-3">
                      <div
                        className="card-header"
                        style={{
                          backgroundColor: "#0C4370",
                          fontWeight: "bold",
                          color: "white",
                        }}
                      >
                        {group.groupInfo.groupName}
                      </div>
                      <div className="card-body">
                        <p>
                          <strong>Chủ đề:</strong>{" "}
                          {group.topic?.nameTopic || "Chưa có thông tin"}
                        </p>
                        <p>
                          <strong>Giảng viên hướng dẫn:</strong>{" "}
                          {group.advisor?.name || "Chưa có thông tin"}
                        </p>
                        <div>
                          <strong>Sinh viên:</strong>
                          <ul>
                            {group.students.map((student, idx) => (
                              <li key={idx}>
                                {student.name} - Điểm GVHD:{" "}
                                {student.scores.instructorScore}, Điểm phản
                                biện: {student.scores.reviewerScore}
                              </li>
                            ))}
                          </ul>
                        </div>
                        {/* Nút phân công */}
                        {/* <button
                          className={`btn ${
                            group.isAssigned ? "btn-danger" : "btn-warning"
                          }`}
                          onClick={() =>
                            group.isAssigned
                              ? handleCancelAssignmentPoster(
                                  selectedCommittee._id
                                )
                              : handleAssignmentPoster(group)
                          }
                        >
                          {group.isAssigned ? "Hủy phân công" : "Phân công"}
                        </button> */}

                        <button
                          className={`btn ${
                            group.isAssigned ? "btn-danger" : "btn-warning"
                          }`}
                          onClick={() =>
                            group.isAssigned
                              ? handleCancelAssignmentPoster(
                                  selectedCommittee._id,
                                  group
                                )
                              : handleAssignmentPoster(group)
                          }
                        >
                          {group.isAssigned ? "Hủy phân công" : "Phân công"}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>Không có nhóm nào được gán.</p>
                )}
              </div>
              <div className="d-flex justify-content-center mt-3">
                <TablePagination
                  component="div"
                  count={(assignedGroups || []).length}
                  page={groupPage}
                  onPageChange={(event, newPage) => {
                    const maxPage = Math.max(0, groupPageCount - 1);
                    setGroupPage(Math.min(newPage, maxPage));
                  }}
                  rowsPerPage={groupsPerPage}
                  rowsPerPageOptions={[groupsPerPage]}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AssignmentPoster;
