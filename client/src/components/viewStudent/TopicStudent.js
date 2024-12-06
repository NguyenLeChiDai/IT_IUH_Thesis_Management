import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../../contexts/AuthContext";
import "../../css/TopicStudent.css"; // Import file CSS để style
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import "font-awesome/css/font-awesome.min.css";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CloseIcon from "@mui/icons-material/Close"; // Import thêm icon "X"
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../../contexts/constants";
const TopicStudent = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { authState } = useContext(AuthContext);
  const [groupId, setGroupId] = useState(null);
  const [expandedTopicId, setExpandedTopicId] = useState(null);
  const navigate = useNavigate();

  const handleToggle = (topicId) => {
    setExpandedTopicId(expandedTopicId === topicId ? null : topicId);
  };

  // Kiểm tra sinh viên đã có trong group chưa
  useEffect(() => {
    const fetchGroupId = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}/studentGroups/get-group-id`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (response.data.success) {
          setGroupId(response.data.groupId);
        } else {
          setError(response.data.message);
        }
      } catch (error) {
        console.error("Error fetching group ID:", error);
        if (error.response && error.response.status === 404) {
          setError(
            "Bạn chưa có nhóm. Vui lòng tạo nhóm trước khi đăng ký đề tài."
          );
        } else {
          setError("Lỗi khi lấy thông tin nhóm. Vui lòng thử lại sau.");
        }
      } finally {
        setLoading(false); // Đặt loading về false
      }
    };

    fetchGroupId();
  }, []);

  useEffect(() => {
    const fetchTopics = async () => {
      if (!groupId) return; // Kiểm tra nếu groupId không có

      try {
        const response = await axios.get(`${apiUrl}/topics/${groupId}/topics`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });

        if (response.data.success) {
          setTopics(response.data.topics);
        } else {
          setError("Không thể lấy thông tin đề tài");
        }
      } catch (err) {
        console.error("Error fetching topics:", err);
        setError("Hiện nhóm chưa đăng ký đề tài");
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [groupId]); // Chỉ gọi lại khi groupId thay đổi

  //leaveTopic
  const handleLeaveTopic = async (topicId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Không có token hợp lệ.");
        return;
      }

      const result = await Swal.fire({
        title: "Xác Nhận Rời Khỏi Đề Tài",
        text: "Bạn có chắc chắn muốn rời đề tài này không?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Có",
        cancelButtonText: "Không",
      });

      if (result.isConfirmed) {
        try {
          const response = await axios.delete(`${apiUrl}/topics/leave-topic`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            data: { groupId, topicId },
          });

          if (response.data.success) {
            setTopics((prevTopics) =>
              prevTopics.filter((topic) => topic.topicId !== topicId)
            );
            toast.success("Bạn đã rời đề tài thành công!", {
              position: "top-right",
              autoClose: 2500,
            });
          }
        } catch (err) {
          // Kiểm tra lỗi từ server và hiển thị thông báo chi tiết
          if (err.response && err.response.status === 403) {
            // Hiển thị thông báo khi chức năng bị khóa
            await Swal.fire({
              title: "Chức Năng Bị Khóa",
              text:
                err.response.data.message ||
                "Chức năng rời đề tài hiện đang bị khóa",
              icon: "warning",
              confirmButtonText: "Đóng",
            });
          } else {
            // Xử lý các lỗi khác
            setError(
              err.response?.data?.message || "Đã xảy ra lỗi khi rời đề tài."
            );
          }
        }
      }
    } catch (err) {
      console.error("Lỗi:", err);
      setError("Đã xảy ra lỗi không xác định.");
    }
  };

  if (loading) return <div>Đang tải...</div>;
  if (error)
    return (
      <div className="error-container">
        <ErrorOutlineIcon className="error-icon" /> {/* Icon thông báo lỗi */}
        <p className="error-message">{error}</p>
        <CloseIcon
          className="close-icon"
          onClick={() => window.history.back()}
        />{" "}
        {/* Nút "X" để quay lại */}
      </div>
    );

  return (
    <div className="topic-student">
      <h2 style={{ fontWeight: "bold" }}>Đề Tài Nhóm Đã Đăng Ký</h2>
      <div className="topic-list">
        {topics.length === 0 ? (
          <p style={{ fontWeight: "bold" }}>
            Thông báo: Chưa có đề tài nào được đăng ký.
          </p>
        ) : (
          <ul>
            {topics.map((topicItem) => (
              <li key={topicItem.topicId} className="topic-item">
                <div
                  className="topic-header"
                  onClick={() => handleToggle(topicItem.topicId)}
                >
                  <h3 style={{ wordBreak: "break-word", overflow: "hidden" }}>
                    {topicItem.nameTopic}
                  </h3>
                  <span className="toggle-icon">
                    {expandedTopicId === topicItem.topicId
                      ? "Thu gọn ▲"
                      : "Xem chi tiết ▼"}
                  </span>
                </div>
                <div className="topic-info">
                  {topicItem.registrationDate && (
                    <p>
                      <strong style={{ fontWeight: "bold" }}>
                        Ngày đăng ký:
                      </strong>{" "}
                      {new Date(
                        topicItem.registrationDate
                      ).toLocaleDateString()}
                    </p>
                  )}
                  <p>
                    {" "}
                    <strong style={{ fontWeight: "bold" }}>Trạng thái: </strong>
                    {topicItem.status || "Đã đăng ký"}
                  </p>
                  <p>
                    <strong style={{ fontWeight: "bold" }}>Giảng Viên: </strong>
                    {topicItem.teacher.fullName}
                  </p>
                </div>
                <button
                  className="leave-topic-button"
                  onClick={() => handleLeaveTopic(topicItem.topicId)}
                >
                  Rời Đề Tài
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();

                    // Kiểm tra đầy đủ dữ liệu
                    if (!groupId) {
                      console.error("groupId is missing:", groupId);
                      toast.error("Thiếu thông tin nhóm");
                      return;
                    }

                    if (
                      !topicItem?.teacher?.id ||
                      !topicItem?.teacher?.fullName
                    ) {
                      console.error(
                        "teacher info is missing:",
                        topicItem?.teacher
                      );
                      toast.error("Thiếu thông tin giảng viên");
                      return;
                    }

                    // Log để debug
                    console.log("Original groupId:", groupId);
                    console.log("TopicItem:", topicItem);

                    // Đảm bảo groupId là string
                    const groupIdString = groupId.toString();
                    console.log("GroupId as string:", groupIdString);

                    const stateData = {
                      teacherInfo: {
                        id: topicItem.teacher.id,
                        name: topicItem.teacher.fullName,
                        role: "teacher",
                      },
                      groupInfo: {
                        _id: groupIdString,
                      },
                    };

                    // Log state data trước khi navigate
                    console.log("Navigating with state:", stateData);

                    navigate("/dashboardStudent/messageStudent", {
                      state: stateData,
                    });
                  }}
                  style={{
                    padding: "10px",
                    backgroundColor: "#2196F3",
                    color: "white",
                    borderRadius: "5px",
                    cursor: "pointer",
                    border: "none",
                    marginLeft: "10px",
                  }}
                >
                  Nhắn tin với giảng viên
                </button>
                {expandedTopicId === topicItem.topicId && (
                  <div className="topic-description">
                    <h4 class="project-title">Mô tả chi tiết đề tài:</h4>
                    <p style={{ wordBreak: "break-word", overflow: "hidden" }}>
                      {topicItem.descriptionTopic ||
                        "Không có mô tả cho đề tài này."}
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TopicStudent;
