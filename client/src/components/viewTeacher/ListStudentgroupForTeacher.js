import React, { useState, useEffect } from "react";
import axios from "axios";
import "../../css/ListStudentGroupForTeacher.css"; // Import file CSS để style
import SearchIcon from "@mui/icons-material/Search";
import { MessageCircle } from "lucide-react";
import { TablePagination } from "@mui/material";
import { useNavigate } from "react-router-dom";

const ListStudentGroupForTeacher = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedGroupId, setExpandedGroupId] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const navigate = useNavigate();

  // Hàm xử lý khi nhấn vào "Nhắn tin với nhóm"
  const handleChatClick = () => {
    setIsChatOpen(!isChatOpen); // Đổi trạng thái hiển thị chat
  };

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          "http://localhost:5000/api/topics/teacher/groups"
        );
        if (response.data && Array.isArray(response.data.groups)) {
          setGroups(response.data.groups);
        } else {
          throw new Error("Dữ liệu không hợp lệ");
        }
      } catch (err) {
        setError(err.message || "Có lỗi xảy ra khi lấy dữ liệu.");
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const filteredGroups = groups.filter((group) => {
    const searchRegex = new RegExp(
      searchTerm.replace(/\s+/g, "\\s*").replace(/^0+/, ""),
      "i"
    );
    return (
      searchRegex.test(group.groupName.replace(/^0+/, "")) ||
      (group.teacher && searchRegex.test(group.teacher.name))
    );
  });

  const toggleGroupExpansion = (groupId) => {
    setExpandedGroupId(expandedGroupId === groupId ? null : groupId);
  };

  if (loading) {
    return <p className="text-center py-4">Đang tải dữ liệu...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 py-4">Lỗi: {error}</p>;
  }

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Đặt lại về trang đầu tiên khi tìm kiếm
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Phân trang các chủ đề được lọc
  const paginatedGroups = filteredGroups.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <div className="container-main" style={{ paddingRight: "50px" }}>
      <h1
        style={{ marginRight: "50px", fontWeight: "Roboto", fontSize: "35px" }}
      >
        Danh sách nhóm sinh viên đã đăng ký đề tài
      </h1>

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
          placeholder="Tìm kiếm theo tên nhóm"
          value={searchTerm}
          onChange={handleSearch}
          style={{
            width: "100%", // Input sẽ chiếm toàn bộ chiều rộng của parent container
            padding: "0.5rem 0.5rem 0.5rem 2.5rem",
            border: "1px solid #ccc",
            borderRadius: "0.25rem",
            boxSizing: "border-box", // Đảm bảo padding không làm tăng kích thước tổng thể
          }}
        />
      </div>

      {filteredGroups.length === 0 ? (
        <p>Không tìm thấy nhóm nào phù hợp với tìm kiếm của bạn</p>
      ) : (
        <div className="form-info-parent" style={{ width: "100%" }}>
          {paginatedGroups.map((group) => (
            <div
              key={group.groupId}
              className="form-info-child"
              style={{ width: "100%" }}
            >
              <div
                className="cursor-pointer"
                onClick={() => toggleGroupExpansion(group.groupId)}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <div style={{ flex: 1 }}>
                  <h2
                    className="text-xl font-semibold"
                    style={{ marginLeft: "100px", fontWeight: "Roboto" }}
                  >
                    {group.groupName}
                  </h2>
                  <p>
                    <strong>Trạng thái nhóm:</strong> {group.groupStatus}
                  </p>
                  <p>
                    <strong>Đề tài:</strong>{" "}
                    {group.topic?.nameTopic || "Chưa có thông tin"}
                  </p>
                  <p>
                    <strong>Ngày đăng ký:</strong>{" "}
                    {new Date(group.topic?.registrationDate).toLocaleDateString(
                      "vi-VN"
                    )}
                  </p>

                  {/* Button để mở hoặc đóng chat */}
                  <p style={{ display: "flex", alignItems: "center" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/dashboardTeacher/messageTeacher", {
                          state: {
                            groupInfo: {
                              id: group.groupId,
                              name: group.groupName,
                              members: group.profileStudents,
                              // Truyền thêm thông tin cần thiết khác
                            },
                          },
                        });
                      }}
                      style={{
                        marginLeft: "-1px",
                        padding: "10px",
                        backgroundColor: "#4CAF50",
                        color: "white",
                        borderRadius: "5px",
                        cursor: "pointer",
                      }}
                    >
                      Nhắn tin với nhóm
                    </button>
                  </p>
                </div>
                <span style={{ marginLeft: "1rem" }}>
                  {expandedGroupId === group.groupId
                    ? "Thu gọn ▲"
                    : "Xem chi tiết ▼"}
                </span>
              </div>

              {expandedGroupId === group.groupId && (
                <>
                  <h3 className="member-title">Thành viên</h3>

                  {group.profileStudents && group.profileStudents.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "1rem",
                        justifyContent: "space-between",
                      }}
                    >
                      {group.profileStudents.map((profile, index) => (
                        <div
                          key={index}
                          style={{
                            flex: "1 1 calc(50% - 0.5rem)",
                            minWidth: "250px",
                            backgroundColor: "#b0b0b0",
                            padding: "1rem",
                            borderRadius: "0.5rem",
                          }}
                        >
                          <p
                            className="font-medium"
                            style={{ fontWeight: "bold" }}
                          >
                            {profile.student.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            MSSV: {profile.student.studentId}
                          </p>
                          <p className="text-sm text-gray-600">
                            Email: {profile.student.email}
                          </p>
                          <p className="text-sm text-gray-600">
                            Vai trò: {profile.role}
                          </p>
                          <p className="text-sm text-gray-600">
                            Lớp: {profile.student.class}
                          </p>
                          <p className="text-sm text-gray-600">
                            Chuyên ngành: {profile.student.major}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p>Không có thông tin về thành viên</p>
                  )}
                </>
              )}
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
      />
    </div>
  );
};
export default ListStudentGroupForTeacher;
