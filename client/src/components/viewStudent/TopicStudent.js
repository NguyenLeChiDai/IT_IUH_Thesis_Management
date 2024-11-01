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
          "http://localhost:5000/api/studentGroups/get-group-id",
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
        const response = await axios.get(
          `http://localhost:5000/api/topics/${groupId}/topics`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

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
      console.log("Using token:", token);

      if (!token) {
        console.error("Token is not available");
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
        console.log("Leaving topic with ID:", topicId);
        console.log("Using group ID:", groupId); // Giữ lại log để kiểm tra groupId

        const response = await axios.delete(
          `http://localhost:5000/api/topics/leave-topic`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            data: { groupId, topicId },
          }
        );

        console.log("Server response:", response.data);

        if (response.data.success) {
          // Cập nhật danh sách đề tài
          setTopics((prevTopics) =>
            prevTopics.filter((topic) => topic.topicId !== topicId)
          );
          toast.success("Bạn đã rời đề tài thành công!", {
            position: "top-right",
            autoClose: 2500,
          });
        } else {
          setError(response.data.message);
        }
      }
    } catch (err) {
      if (err.response) {
        console.error("Error response data:", err.response.data);
        setError(err.response.data.message || "Đã xảy ra lỗi khi rời đề tài.");
      } else {
        console.error("Error occurred:", err);
        setError("Đã xảy ra lỗi khi rời đề tài.");
      }
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
                      Ngày đăng ký:{" "}
                      {new Date(
                        topicItem.registrationDate
                      ).toLocaleDateString()}
                    </p>
                  )}
                  <p>Trạng thái: {topicItem.status || "Đã đăng ký"}</p>
                  <p>Giảng Viên: {topicItem.teacher.fullName}</p>
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
                  }}
                >
                  Chat với giảng viên
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
