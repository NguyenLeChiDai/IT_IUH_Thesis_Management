import React, { useState, useEffect } from "react";
import axios from "axios";
import { TablePagination } from "@mui/material";
import "../../css/ManageTopic.css"; // Import file CSS để style
import TopicDetailForm from "./TopicDetailForm";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import SearchIcon from "@mui/icons-material/Search";
import LibraryBooksIcon from "@mui/icons-material/LibraryBooks";

const ManageTopic = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [isOpen, setIsOpen] = useState(false);

  // Mở form thông tin chi tiết đề tài
  const [selectedTopic, setSelectedTopic] = useState(null);

  useEffect(() => {
    fetchTopics();
  }, []);

  const handleTopicClick = (topic) => {
    setSelectedTopic(topic);
  };

  const handleClose = () => {
    setSelectedTopic(null);
  };

  const fetchTopics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        "http://localhost:5000/api/topics/get-all-topics",
        {
          params: { nameTopic: searchTerm },
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );
      if (response.data.topics) {
        setTopics(response.data.topics);
      } else {
        setTopics([]);
      }
    } catch (error) {
      console.error(
        "Lỗi khi lấy danh sách đề tài:",
        error.response ? error.response.data : error.message
      );
      setError("Có lỗi xảy ra khi tải danh sách đề tài. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
    setPage(0); // Đặt lại về trang đầu tiên khi tìm kiếm
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchTopics();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const filteredTopics = topics.filter(
    (topic) =>
      topic.nameTopic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (topic.teacher &&
        topic.teacher.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Phê duyệt đề tài
  const handleApprove = async (id, currentStatus) => {
    let newStatus;
    let confirmText;
    let confirmTitle;

    if (currentStatus === "Đã phê duyệt") {
      newStatus = "Chưa phê duyệt";
      confirmText = "Bạn có chắc chắn muốn hủy phê duyệt đề tài này không?";
      confirmTitle = "Xác Nhận Hủy Phê Duyệt Đề Tài";
    } else {
      newStatus = "Đã phê duyệt";
      confirmText = "Bạn có chắc chắn muốn phê duyệt đề tài này không?";
      confirmTitle = "Xác Nhận Phê Duyệt Đề Tài";
    }

    const result = await Swal.fire({
      title: confirmTitle, // Tiêu đề thay đổi dựa trên hành động
      text: confirmText, // Văn bản thay đổi dựa trên hành động
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Có",
      cancelButtonText: "Không",
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.put(
          `http://localhost:5000/api/topics/approve/${id}`,
          { status: newStatus },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          // Cập nhật state của topics
          setTopics((prevTopics) =>
            prevTopics.map((topic) =>
              topic._id === id ? { ...topic, status: newStatus } : topic
            )
          );
          if (newStatus === "Đã phê duyệt") {
            toast.success("Đề tài đã được phê duyệt thành công!", {
              position: "top-right",
              autoClose: 2500,
            });
          } else {
            toast.success("Hủy phê duyệt đề tài thành công!", {
              position: "top-right",
              autoClose: 2500,
            });
          }
        } else {
          toast.error("Có lỗi xảy ra khi cập nhật trạng thái đề tài.", {
            position: "top-right",
            autoClose: 2500,
          });
        }
      } catch (error) {
        console.error("Lỗi khi cập nhật trạng thái đề tài:", error);
        toast.error(
          "Có lỗi xảy ra khi cập nhật trạng thái đề tài. Vui lòng thử lại sau.",
          {
            position: "top-right",
            autoClose: 2500,
          }
        );
      }
    }
  };

  const handleReject = async (id) => {
    // Hiển thị hộp thoại xác nhận từ người dùng
    const result = await Swal.fire({
      title: "Xác Nhận Từ Chối Đề Tài",
      text: "Bạn có chắc chắn muốn từ chối đề tài này không?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Có",
      cancelButtonText: "Không",
    });

    // Kiểm tra nếu người dùng đã xác nhận từ chối
    if (result.isConfirmed) {
      try {
        const response = await axios.put(
          `http://localhost:5000/api/topics/approve/${id}`,
          { status: "Từ chối" },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          // Cập nhật state của topics
          setTopics((prevTopics) =>
            prevTopics.map((topic) =>
              topic._id === id ? { ...topic, status: "Từ chối" } : topic
            )
          );
          toast.success("Đề tài đã được từ chối thành công!", {
            position: "top-right",
            autoClose: 2500,
          });
        } else {
          toast.error("Có lỗi xảy ra khi từ chối đề tài!", {
            position: "top-right",
            autoClose: 2500,
          });
        }
      } catch (error) {
        console.error("Lỗi khi từ chối đề tài:", error);
        toast.error("Có lỗi xảy ra khi từ chối đề tài. Vui lòng thử lại sau!", {
          position: "top-right",
          autoClose: 2500,
        });
      }
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Phân trang các chủ đề được lọc
  const paginatedTopics = filteredTopics.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <div style={{ padding: "1rem" }}>
      <h1
        style={{
          fontSize: "1.5rem",
          fontWeight: "bold",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center", // Đưa nội dung vào giữa
        }}
      >
        <LibraryBooksIcon
          style={{ fontSize: "1.5rem", marginRight: "0.5rem" }}
        />
        Quản Lý Đề Tài
      </h1>

      <div style={{ marginBottom: "1rem", position: "relative" }}>
        <SearchIcon
          style={{
            position: "absolute",
            left: "10px", // Position icon inside the input on the left
            top: "50%",
            transform: "translateY(-50%)", // Vertically center the icon
            color: "#ccc",
          }}
        />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên giảng viên hoặc tên đề tài"
          value={searchTerm}
          onChange={handleSearch}
          style={{
            width: "100%",
            padding: "0.5rem 0.5rem 0.5rem 2.5rem", // Add left padding for the icon
            border: "1px solid #ccc",
            borderRadius: "0.25rem",
          }}
        />
      </div>

      {loading && <p>Đang tải danh sách đề tài...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && filteredTopics.length === 0 && (
        <p>Không tìm thấy đề tài nào.</p>
      )}
      {paginatedTopics.map((topic) => (
        <div
          key={topic._id}
          style={{
            marginBottom: "1rem",
            padding: "1rem",
            border: "1px solid #ccc",
            borderRadius: "0.25rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start", // Sửa đổi: Đảm bảo các phần tử bắt đầu ở đầu hàng dọc
            }}
          >
            <div
              onClick={() => handleTopicClick(topic)}
              style={{
                cursor: "pointer",
                flexGrow: 1, // Sửa đổi: Để nội dung này có thể mở rộng khi tiêu đề dài
              }}
            >
              <h2
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  hyphens: "auto",
                  marginBottom: "12px",
                  lineHeight: "1.4",
                  textAlign: "left",
                  width: "100%",
                  whiteSpace: "normal",
                  display: "block",
                  maxWidth: "90%",
                }}
              >
                {topic.nameTopic || "Không có tiêu đề"}
              </h2>
              {topic.teacher && (
                <p>
                  <strong style={{ fontWeight: "bold" }}>Giảng Viên:</strong>{" "}
                  {topic.teacher.name || "Chưa có thông tin"}
                </p>
              )}
              <strong>Trạng Thái:</strong>{" "}
              <span
                style={{
                  color: topic.status === "Đã phê duyệt" ? "green" : "red",
                }}
              >
                {topic.status}
              </span>
            </div>

            <div
              style={{
                display: "flex", // Giữ cho các nút nằm ngang
                flexShrink: 0, // Đảm bảo các nút không bị thu nhỏ khi tiêu đề dài
                gap: "0.5rem", // Khoảng cách giữa các nút
              }}
            >
              <button
                onClick={() => handleApprove(topic._id, topic.status)}
                style={{
                  marginRight: "0.5rem",
                  padding: "0.5rem 1rem",
                  backgroundColor:
                    topic.status === "Đã phê duyệt" ? "#FFA500" : "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "0.25rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <CheckCircleIcon />
                {topic.status === "Đã phê duyệt"
                  ? "Hủy phê duyệt"
                  : "Phê duyệt"}
              </button>
              <button
                onClick={() => handleReject(topic._id)}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#f44336",
                  color: "white",
                  border: "none",
                  borderRadius: "0.25rem",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <CancelIcon />
                Từ chối
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Hiển thị form chi tiết nếu có topic được chọn */}
      {selectedTopic && (
        <TopicDetailForm topic={selectedTopic} onClose={handleClose} />
      )}

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={filteredTopics.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>
  );
};

export default ManageTopic;
