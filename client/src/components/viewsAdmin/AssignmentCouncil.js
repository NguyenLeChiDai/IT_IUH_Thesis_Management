import React, { useState, useEffect } from "react";
import axios from "axios";
import { apiUrl } from "../../contexts/constants";
import "../../css/Assignment.css";
import { Button } from "react-bootstrap";
import { toast } from "react-toastify";
import { Typography, TablePagination } from "@mui/material";
import Swal from "sweetalert2";

function AssignmentCouncil() {
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

  // Thêm các state phân trang mới
  const [teacherPage, setTeacherPage] = useState(0);
  const [groupPage, setGroupPage] = useState(0);
  const [committeePage, setCommitteePage] = useState(0);

  // Số lượng item trên mỗi trang
  const teachersPerPage = 9;
  const groupsPerPage = 6;
  const committeesPerPage = 6;

  useEffect(() => {
    fetchTeachers();
    fetchCommittees();
  }, []);

  const fetchTeachers = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `${apiUrl}/councilAssignment/get-all-teachers-for-council`,
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
        `${apiUrl}/councilAssignment/get-all-council-assignments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        // Map the response to match the expected structure
        const mappedCommittees = response.data.councilAssignments.map(
          (committee) => ({
            _id: committee._id,
            reviewerTeacher: committee.CouncilTeacher || [], // Use CouncilTeacher from backend
            studentGroup: committee.studentGroup || [],
            topic: committee.topic,
          })
        );
        setCommittees(mappedCommittees);
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

  const handleCreateCouncil = async () => {
    // Xác nhận trước khi tạo
    const result = await Swal.fire({
      title: "Xác Nhận Tạo Hội Đồng Báo Cáo",
      text: "Bạn có chắc chắn muốn tạo hội đồng báo cáo với 2 giảng viên này?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy",
    });

    if (!result.isConfirmed) return;
    if (selectedLecturers.length !== 5) {
      toast.error("Vui lòng chọn chính xác 5 giảng viên");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${apiUrl}/councilAssignment/create-council-assignment`,
        {
          councilTeacher: selectedLecturers.map((teacher) => teacher._id), // Đồng bộ tên trường
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
        fetchCommittees(); // Refresh the list
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

  const handleDeleteCouncil = async (councilId) => {
    // Xác nhận trước khi xóa
    const result = await Swal.fire({
      title: "Xác Nhận Xóa Hội Đồng Báo Cáo",
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
        `${apiUrl}/councilAssignment/delete-council-assignment/${councilId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        toast.success("Xóa hội đồng thành công");
        fetchCommittees(); // Refresh the list
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

  const handleSelectTeacher = (teacher) => {
    const isAlreadySelected = selectedLecturers.some(
      (t) => t._id === teacher._id
    );

    if (isAlreadySelected) {
      // Nếu giảng viên đã được chọn, bỏ chọn giảng viên đó
      setSelectedLecturers(
        selectedLecturers.filter((t) => t._id !== teacher._id)
      );
    } else {
      if (selectedLecturers.length < 5) {
        // Nếu số lượng giảng viên chưa đạt giới hạn, thêm giảng viên vào danh sách
        setSelectedLecturers([...selectedLecturers, teacher]);
      } else {
        // Nếu đã đạt giới hạn 5 giảng viên, hiển thị thông báo lỗi
        toast.error("Chỉ được chọn tối đa 5 giảng viên");
      }
    }
  };

  //get danh sách để phân công
  /* const handleListGroupCouncil = async (committee) => {
    if (
      !committee ||
      !committee.reviewerTeacher ||
      committee.reviewerTeacher.length < 5
    ) {
      setError("Hội đồng phải có ít nhất 5 giảng viên");
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
        `${apiUrl}/councilAssignment/get-eligible-council-students/${teacherIds[0]}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          params: { secondTeacherId: teacherIds[1] },
        }
      );

      if (response.data.success) {
        // Thêm logic kiểm tra xem nhóm đã được phân công hay chưa
        const groupsWithAssignmentStatus = response.data.eligibleGroups.map(
          (group) => ({
            ...group,
            isAssigned: committee.studentGroup.some(
              (assignedGroup) => assignedGroup._id === group._id
            ),
          })
        );

        setAssignedGroups(groupsWithAssignmentStatus);
        setSelectedCommittee(committee);
        setShowGroupModal(true);
      } else {
        setError(response.data.message || "Không thể tải danh sách nhóm");
      }
    } catch (err) {
      setError("Đã xảy ra lỗi khi tải danh sách nhóm");
    } finally {
      setLoading(false);
    }
  };
 */
  const handleListGroupCouncil = async (committee) => {
    if (
      !committee ||
      !committee.reviewerTeacher ||
      committee.reviewerTeacher.length < 5
    ) {
      setError("Hội đồng phải có ít nhất 5 giảng viên");
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
        `${apiUrl}/councilAssignment/get-eligible-council-students/${teacherIds[0]}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          params: { secondTeacherId: teacherIds[1] },
        }
      );

      if (response.data.success) {
        // Lọc các nhóm:
        // 1. Chưa được phân công cho bất kỳ hội đồng nào
        // 2. Hoặc đã được phân công cho hội đồng hiện tại
        const filteredGroups = response.data.eligibleGroups.filter((group) => {
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
      }
    } catch (err) {
      console.error("Error in handleListGroupCouncil:", err);
      setError("Đã xảy ra lỗi khi tải danh sách nhóm");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentCouncil = async (group) => {
    // Xác nhận trước khi phân công
    const result = await Swal.fire({
      title: "Xác Nhận Phân Công",
      text: "Bạn có chắc chắn muốn phân công nhóm này cho hội đồng báo cáo?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Phân Công",
      cancelButtonText: "Hủy",
    });

    if (!result.isConfirmed) return;
    try {
      // Sử dụng thông tin từ group được chọn
      if (!selectedCommittee || !group) {
        toast.warning("Vui lòng chọn hội đồng và nhóm sinh viên");
        return;
      }

      // Lấy ID của 2 giảng viên từ hội đồng hiện tại
      const teacherIds = selectedCommittee.reviewerTeacher.map(
        (teacher) => teacher._id
      );

      // Chuẩn bị payload
      const payload = {
        reviewPanelId: selectedCommittee._id,
        teacherIds: teacherIds,
        groupId: group._id, // Thay đổi ở đây từ group.groupId sang group._id
      };

      // Thực hiện gọi API
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${apiUrl}/councilAssignment/assign-council`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Xử lý kết quả
      if (response.data.success) {
        toast.success("Phân công giảng viên phản biện thành công!");

        // Đóng modal danh sách nhóm
        setShowGroupModal(false);

        // Tải lại danh sách hội đồng
        fetchCommittees();
      } else {
        toast.info(
          response.data.message || "Không thể phân công giảng viên phản biện"
        );
      }
    } catch (error) {
      console.error("Lỗi khi phân công giảng viên:", error);

      if (error.response) {
        // Hiển thị thông báo lỗi từ máy chủ
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

  const handleCancelAssignmentCouncil = async (assignmentId) => {
    // Xác nhận trước khi tạo
    const result = await Swal.fire({
      title: "Xác Nhận Tạo Hội Đồng Báo Cáo",
      text: "Bạn có chắc chắn muốn tạo hội đồng báo cáo với 2 giảng viên này?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Đồng ý",
      cancelButtonText: "Hủy",
    });

    if (!result.isConfirmed) return;
    try {
      // Lấy token từ localStorage
      const token = localStorage.getItem("token");

      // Lấy thông tin studentGroupId và topicId từ selectedCommittee
      const studentGroupId = selectedCommittee.studentGroup[0]._id; // Lấy ID của nhóm đầu tiên
      const topicId = selectedCommittee.topic[0]._id; // Lấy ID của đề tài đầu tiên

      // Gọi API hủy phân công với đầy đủ thông tin
      const response = await axios.put(
        `${apiUrl}/councilAssignment/cancel-council-assignment/${assignmentId}/${studentGroupId}/${topicId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Kiểm tra kết quả từ server
      if (response.data.success) {
        // Hiển thị thông báo thành công
        toast.success("Hủy phân công thành công!");

        // Cập nhật danh sách hội đồng
        fetchCommittees();

        // Đóng modal nếu đang mở
        setShowGroupModal(false);
      } else {
        // Hiển thị thông báo từ server nếu có
        toast.info(response.data.message || "Không thể hủy phân công");
      }
    } catch (error) {
      console.error("Lỗi khi hủy phân công:", error);

      // Xử lý các loại lỗi khác nhau
      if (error.response) {
        // Lỗi từ phía server
        toast.error(
          error.response.data.message || "Lỗi từ máy chủ khi hủy phân công"
        );
      } else if (error.request) {
        // Không nhận được phản hồi từ server
        toast.error("Không nhận được phản hồi từ máy chủ");
      } else {
        // Lỗi trong quá trình gửi request
        toast.error("Lỗi khi gửi yêu cầu hủy phân công");
      }
    }
  };

  const filteredTeachers = teachers.filter(
    (teacher) =>
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
  //PHÂN TRANG
  // Lọc và phân trang giảng viên
  const teacherPageCount = Math.ceil(filteredTeachers.length / teachersPerPage);
  const displayedTeachers = filteredTeachers.slice(
    teacherPage * teachersPerPage,
    (teacherPage + 1) * teachersPerPage
  );

  const displayedGroups = assignedGroups.slice(
    groupPage * groupsPerPage,
    (groupPage + 1) * groupsPerPage
  );

  const groupPageCount = Math.ceil(assignedGroups.length / groupsPerPage);

  const displayedCommittees = committees.slice(
    committeePage * committeesPerPage,
    (committeePage + 1) * committeesPerPage
  );

  const committeePageCount = Math.ceil(committees.length / committeesPerPage);

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <h2 className="mb-4 text-center">Quản Lý Hội Đồng Báo Cáo</h2>
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
                      onClick={() => handleDeleteCouncil(committee._id)}
                    >
                      Xóa Hội Đồng
                    </button>
                    <button
                      className="btn btn-info"
                      onClick={() => {
                        setSelectedCommittee(committee);
                        setShowGroupModal(true);
                        handleListGroupCouncil(committee);
                      }}
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
          {/* phân trang hội đồng */}
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

      {showModal && (
        <div className="modal-select-teacher">
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  Chọn Giảng Viên Hội Đồng Báo Cáo
                </h5>
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
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="col-md-6 text-right">
                    <div
                      className="selected-teachers"
                      style={{ marginTop: "7px" }}
                    >
                      <strong style={{ marginTop: "7px" }}>Đã chọn: </strong>
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
                        onClick={() => handleSelectTeacher(teacher)}
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
                <div className="d-flex justify-content-center mt-3">
                  <TablePagination
                    component="div"
                    count={filteredTeachers.length}
                    page={teacherPage}
                    onPageChange={(event, newPage) => {
                      const maxPage = Math.max(0, teacherPageCount - 1);
                      setTeacherPage(Math.min(newPage, maxPage));
                    }}
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
                    selectedLecturers.length !== 5
                      ? "btn-secondary"
                      : "btn-success"
                  }`}
                  onClick={handleCreateCouncil}
                  disabled={selectedLecturers.length !== 5}
                >
                  Tạo Hội Đồng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
              <div className="modal-body-review">
                {loading ? (
                  <p>Đang tải...</p>
                ) : error ? (
                  <p className="text-danger">{error}</p>
                ) : assignedGroups.length > 0 ? (
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
                          <strong>Đề tài:</strong> {group.topic.nameTopic}
                        </p>
                        {/* <p><strong>Điểm trung bình:</strong> {group.groupInfo.averageScore}</p> */}
                        <p>
                          <strong>Giảng viên hướng dẫn:</strong>{" "}
                          {group.advisor.name}
                        </p>

                        <h6>Danh sách sinh viên:</h6>
                        <table className="table">
                          <thead>
                            <tr>
                              <th>Tên sinh viên</th>
                              <th>Mã sinh viên</th>
                              <th>Điểm GVHD</th>
                              <th>Điểm phản biện</th>
                              {/* <th>Tổng điểm</th> */}
                            </tr>
                          </thead>
                          <tbody>
                            {group.students.map((student, idx) => (
                              <tr key={idx}>
                                <td>{student.name}</td>
                                <td>{student.studentId}</td>
                                <td>{student.scores.instructorScore}</td>
                                <td>{student.scores.reviewerScore}</td>
                                {/* <td>{student.scores.total}</td> */}
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        {/* Điều kiện hiển thị nút phân công hoặc hủy phân công */}
                        <button
                          className="btn btn-warning"
                          onClick={() =>
                            group.isAssigned
                              ? handleCancelAssignmentCouncil(
                                  selectedCommittee._id
                                )
                              : handleAssignmentCouncil(group)
                          }
                        >
                          {group.isAssigned ? "Hủy phân công" : "Phân công"}
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p>Không có nhóm nào được gán cho hội đồng này.</p>
                )}
              </div>
              {/* phân trang sinh viên để chọn */}
              <div className="d-flex justify-content-center mt-3">
                <TablePagination
                  component="div"
                  count={assignedGroups.length}
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

export default AssignmentCouncil;
