import React, { useState, useEffect } from "react";
import axios from "axios";
import { apiUrl } from "../../contexts/constants";
import "../../css/Assignment.css";
import { Button } from "react-bootstrap";
import { toast } from "react-toastify";
import { Typography, TablePagination } from "@mui/material";
import Swal from "sweetalert2";
function AssignmentReview() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [committees, setCommittees] = useState([]);
  const [selectedLecturers, setSelectedLecturers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [assignedGroups, setAssignedGroups] = useState([]);
  const [selectedCommittee, setSelectedCommittee] = useState(null);
  const [showGroupModal, setShowGroupModal] = useState(false);

  // Phân trang
  const [teacherPage, setTeacherPage] = useState(0);
  const [committeePage, setCommitteePage] = useState(0);
  const [groupPage, setGroupPage] = useState(0);
  const teachersPerPage = 9;
  const committeesPerPage = 6;
  const groupsPerPage = 9; // Số lượng nhóm trên mỗi trang

  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchTeachers();
    fetchCommittees();
  }, []);

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${apiUrl}/reviewAssignment/get-all-teachers-ver2`,
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

  const fetchCommittees = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${apiUrl}/reviewAssignment/get-all-review-assignments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.data.success) {
        setCommittees(response.data.reviewAssignments);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Có lỗi xảy ra khi tải danh sách hội đồng"
      );
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
      toast.error("Chỉ được chọn tối đa 2 giảng viên");
      return prev;
    });
  };

  const createCommittee = async () => {
    // Xác nhận trước khi tạo
    const result = await Swal.fire({
      title: "Xác Nhận Tạo Hội Đồng",
      text: "Bạn có chắc chắn muốn tạo hội đồng với 2 giảng viên này?",
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
        `${apiUrl}/reviewAssignment/create-review-teacher`,
        {
          reviewerTeacher: selectedLecturers.map((lecturer) => lecturer._id),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.data.success) {
        toast.success("Tạo hội đồng thành công!");
        fetchCommittees();
        fetchTeachers();
        setShowModal(false);
        setSelectedLecturers([]);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Có lỗi xảy ra khi tạo hội đồng"
      );
    }
  };

  //Lấy danh sách sinh viên
  const handleListGroupStudent = async (committee) => {
    if (
      !committee ||
      !committee.reviewerTeacher ||
      committee.reviewerTeacher.length !== 2
    ) {
      setError("Hội đồng phải có đúng 2 giảng viên");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      const teacherIds = committee.reviewerTeacher.map(
        (teacher) => teacher._id
      );

      const response = await axios.get(
        `${apiUrl}/reviewAssignment/get-groups-for-review/${teacherIds[0]}`,
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
        // Lọc các nhóm:
        // 1. Chưa được phân công cho bất kỳ hội đồng nào
        // 2. Hoặc đã được phân công cho hội đồng hiện tại
        const filteredGroups = response.data.groups.filter((group) => {
          // Nếu nhóm đã được phân công cho hội đồng hiện tại
          const isAssignedToCurrentCommittee = committee.studentGroup?.some(
            (assignedGroup) => assignedGroup._id === group.groupId
          );

          // Nếu nhóm đã được phân công cho bất kỳ hội đồng nào
          const isAssignedToAnyCommittee = committees.some((comm) =>
            comm.studentGroup?.some(
              (assignedGroup) => assignedGroup._id === group.groupId
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
            (assignedGroup) => assignedGroup._id === group.groupId
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
      console.error("Error in handleListGroupStudent:", err);
      setError("Đã xảy ra lỗi khi tải danh sách nhóm");
      setAssignedGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handledeleteGroup = async (reviewPanelId) => {
    // Xác nhận trước khi xóa
    const result = await Swal.fire({
      title: "Xác Nhận Xóa Hội Đồng",
      text: "Bạn có chắc chắn muốn xóa hội đồng này? Thao tác này không thể hoàn tác.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Xóa",
      cancelButtonText: "Hủy",
    });

    if (!result.isConfirmed) return;

    //console.log("Review Panel ID to delete:", reviewPanelId);
    try {
      const response = await axios.delete(
        `${apiUrl}/reviewAssignment/delete-review-panel/${reviewPanelId}`,
        { withCredentials: true }
      );
      console.log("Response from API:", response.data);
      if (response.data.success) {
        toast.success("Xóa hội đồng phản biện thành công!");
        setCommittees(
          committees.filter((committee) => committee._id !== reviewPanelId)
        );
        fetchTeachers();
      } else {
        toast.info(
          response.data.message || "Không thể xóa hội đồng phản biện."
        );
      }
    } catch (error) {
      console.error("Lỗi khi xóa hội đồng:", error);
      toast.error("Xảy ra lỗi khi xóa hội đồng.");
    }
  };

  //Phân công nhóm sinh viên cho hội đồng
  // Tạo biến state cục bộ cho nhóm đang được xử lý
  const [processingGroupId, setProcessingGroupId] = useState(null);
  const handleAssignGroup = async (group) => {
    const result = await Swal.fire({
      title: "Xác Nhận Phân Công",
      text: "Bạn có chắc chắn muốn phân công nhóm này cho hội đồng?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Phân Công",
      cancelButtonText: "Hủy",
    });

    if (!result.isConfirmed) return;

    try {
      // Set loading state chỉ cho nhóm đang được xử lý
      setProcessingGroupId(group.groupId);

      if (!selectedCommittee || !group) {
        toast.warning("Vui lòng chọn hội đồng và nhóm sinh viên");
        return;
      }

      const teacherIds = selectedCommittee.reviewerTeacher.map(
        (teacher) => teacher._id
      );

      const payload = {
        reviewPanelId: selectedCommittee._id,
        teacherIds: teacherIds,
        groupId: group.groupId,
      };

      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${apiUrl}/reviewAssignment/assign-reviewer`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        toast.success("Phân công giảng viên phản biện thành công!");

        // Cập nhật trạng thái trực tiếp trong assignedGroups
        setAssignedGroups((prev) =>
          prev.map((g) => {
            if (g.groupId === group.groupId) {
              return { ...g, isAssigned: true };
            }
            return g;
          })
        );

        // Cập nhật danh sách hội đồng
        fetchCommittees();
      } else {
        toast.info(
          response.data.message || "Không thể phân công giảng viên phản biện"
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
    } finally {
      // Reset loading state cho nhóm đã xử lý xong
      setProcessingGroupId(null);
    }
  };

  const handleCancelAssignment = async (group) => {
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
      // Set loading state chỉ cho nhóm đang được xử lý
      setProcessingGroupId(group.groupId);

      const token = localStorage.getItem("token");
      const studentGroupId = group.groupId;
      const topicId = group.topicId;

      const response = await axios.put(
        `${apiUrl}/reviewAssignment/cancel-assignment/${selectedCommittee._id}/${studentGroupId}/${topicId}`,
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
            if (g.groupId === group.groupId) {
              return { ...g, isAssigned: false };
            }
            return g;
          })
        );

        // Cập nhật danh sách hội đồng
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
    } finally {
      // Reset loading state cho nhóm đã xử lý xong
      setProcessingGroupId(null);
    }
  };

  // const filteredTeachers = teachers.filter(
  //   (teacher) =>
  //     teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //     teacher.department.toLowerCase().includes(searchTerm.toLowerCase())
  // );

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

  // Phân trang nhóm
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
          <h2 className="mb-4 text-center">Quản Lý Hội Đồng Chấm Phản Biện</h2>
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
            {displayedCommittees.map((committee, index) => (
              <div key={committee._id} className="col-md-4 mb-3">
                <div className="card shadow-sm">
                  <div
                    className="card-header "
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
                      onClick={() => handledeleteGroup(committee._id)}
                    >
                      Xóa Hội Đồng
                    </button>
                    <button
                      className="btn btn-info"
                      onClick={() => handleListGroupStudent(committee)}
                    >
                      Danh sách nhóm
                    </button>
                  </div>
                  <div className="card-body">
                    {committee.reviewerTeacher.map((lecturer) => (
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
                // Kiểm tra nếu trang mới vượt quá số lượng trang thì đưa về trang cuối
                const maxPage = Math.max(0, committeePageCount - 1);
                setCommitteePage(Math.min(newPage, maxPage));
              }}
              rowsPerPage={committeesPerPage}
              rowsPerPageOptions={[committeesPerPage]}
            />
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-select-teacher">
          <div className="modal-dialog modal-xl">
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
                        setTeacherPage(0); // Reset trang khi tìm kiếm
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
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowModal(false);
                    setSelectedLecturers([]);
                    setSearchTerm("");
                  }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  className={`btn ${
                    selectedLecturers.length !== 2
                      ? "btn-secondary"
                      : "btn-success"
                  }`}
                  onClick={createCommittee}
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
                  onClick={() => setShowGroupModal(false)}
                >
                  <span>&times;</span>
                </button>
              </div>
              <div className="modal-body">
                <div className="row row-eq-height">
                  {assignedGroups && displayedGroups.length > 0 ? (
                    displayedGroups.map((group, index) => (
                      <div key={group.groupId} className="col-md-4 mb-3">
                        <div className="card h-100">
                          <div
                            className="card-header"
                            style={{
                              backgroundColor: "#0C4370",
                              fontWeight: "bold",
                              color: "white",
                            }}
                          >
                            {group.groupName}
                          </div>
                          <div className="card-body d-flex flex-column">
                            <div>
                              <p className="mb-2">
                                <strong>Chủ đề:</strong> {group.topicName}
                              </p>
                              <p className="mb-3">
                                <strong>Giảng viên hướng dẫn:</strong>{" "}
                                {group.supervisorTeacher.name}
                              </p>
                            </div>

                            <button
                              className={`btn ${
                                group.isAssigned ? "btn-danger" : "btn-warning"
                              }`}
                              onClick={() =>
                                group.isAssigned
                                  ? handleCancelAssignment(group)
                                  : handleAssignGroup(group)
                              }
                              disabled={isProcessing}
                            >
                              {isProcessing ? (
                                <span className="spinner-border spinner-border-sm mr-2" />
                              ) : null}
                              {group.isAssigned ? "Hủy phân công" : "Phân công"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-12 text-center">
                      <p>Không có nhóm nào được gán.</p>
                    </div>
                  )}
                </div>
                {/* Thêm phân trang */}
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
        </div>
      )}
    </div>
  );
}

export default AssignmentReview;
