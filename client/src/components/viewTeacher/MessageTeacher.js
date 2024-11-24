import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  scrollToBottom,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../css/MessageTeacher.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import { Toast, ToastContainer } from "react-bootstrap";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ref, push, set, onValue, remove } from "firebase/database";
import { database } from "../../firebase/ConfigFirebase";
import { firebaseMessageService } from "../../services/firebaseMessageService";
function MessageTeacher() {
  const location = useLocation();
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const groupInfo = location.state?.groupInfo;
  const [selectedMessage, setSelectedMessage] = useState(null);
  const popoverRef = useRef(null);
  const messagesEndRef = useRef(null);

  const getToken = () => localStorage.getItem("token");

  // Firebase realtime listener
  // Lắng nghe tin nhắn realtime
  useEffect(() => {
    if (!groupInfo?.id) return;

    // Đầu tiên, lấy tin nhắn cũ
    const fetchInitialMessages = async () => {
      try {
        const initialMessages = await firebaseMessageService.getGroupMessages(
          groupInfo.id
        );
        setMessages(formatMessages(initialMessages));
      } catch (error) {
        console.error("Error fetching initial messages:", error);
        setError("Không thể tải tin nhắn cũ");
      }
    };

    fetchInitialMessages();

    // Sau đó lắng nghe tin nhắn mới
    firebaseMessageService.subscribeToGroupMessages(
      groupInfo.id,
      (newMessages) => {
        setMessages(formatMessages(newMessages));
      }
    );

    return () => {
      firebaseMessageService.unsubscribeFromGroupMessages(groupInfo.id);
    };
  }, [groupInfo?.id]);

  // Format tin nhắn để hiển thị
  const formatMessages = useCallback((msgs) => {
    return msgs.map((msg) => ({
      id: msg._id || msg.id,
      senderModel:
        msg.sender.role === "Giảng viên" ? "profileTeacher" : "profileStudent",
      text: msg.content,
      senderName: msg.sender.name,
      time: new Date(msg.timestamp).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    }));
  }, []);

  // Load initial messages
  useEffect(() => {
    const loadInitialMessages = async () => {
      if (!groupInfo?.id) return;

      try {
        const initialMessages = await firebaseMessageService.getGroupMessages(
          groupInfo.id
        );
        const formattedMessages = initialMessages.map((msg) => ({
          id: msg._id,
          senderModel:
            msg.sender.role === "Giảng viên"
              ? "profileTeacher"
              : "profileStudent",
          text: msg.content,
          senderName: msg.sender.name,
          time: new Date(msg.timestamp).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }),
        }));

        setMessages(formattedMessages);
      } catch (err) {
        console.error("Error loading initial messages:", err);
        setError("Không thể tải tin nhắn. Vui lòng thử lại sau.");
      }
    };

    loadInitialMessages();
  }, [groupInfo?.id]);

  // Thêm hàm xử lý click bên ngoài popover
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setSelectedMessage(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Thêm hàm xử lý xóa tin nhắn
  const handleDeleteMessage = async (messageId) => {
    try {
      const token = getToken();
      const response = await axios.delete(
        `http://localhost:5000/api/messages/delete/${messageId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        // Xóa tin nhắn khỏi state
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id !== messageId)
        );
        setSelectedMessage(null); // Đóng popover
      }
    } catch (err) {
      console.error("Error deleting message:", err);
      setError(err.response?.data?.message || "Có lỗi xảy ra khi xóa tin nhắn");
    }
  };
  // useEffect(() => {
  //   if (groupInfo?.id) {  // Thay groupId bằng groupInfo?.id
  //     // Clear cache khi component mount
  //     firebaseMessageService.clearDeletedMessagesCache();

  //     // Subscribe to messages
  //     firebaseMessageService.subscribeToGroupMessages(groupInfo.id, (messages) => {
  //       setMessages(messages);
  //     });

  //     return () => {
  //       // Cleanup khi unmount
  //       firebaseMessageService.unsubscribeFromGroupMessages(groupInfo.id);
  //     };
  //   }
  // }, [groupInfo?.id]);  // Dependency cũng cần được thay đổi

  const MessagePopover = ({ message }) => (
    <div
      ref={popoverRef}
      className="message-popover"
      style={{
        position: "absolute",
        backgroundColor: "white",
        border: "1px solid #ddd",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        zIndex: 1000,
        top: "100%",
        right: message.senderModel === "profileTeacher" ? "0" : "auto",
        left: message.senderModel === "profileTeacher" ? "auto" : "0",
      }}
    >
      {message.senderModel === "profileTeacher" && (
        <button
          className="delete-message-btn d-flex align-items-center gap-2"
          onClick={() => handleDeleteMessage(message.id)}
        >
          <i className="bi bi-trash"></i>
          <span>Thu hồi tin nhắn</span>
        </button>
      )}
    </div>
  );

  // Fetch teacher profile
  const fetchTeacherProfile = useCallback(async () => {
    try {
      const token = getToken();
      const response = await axios.get(
        "http://localhost:5000/api/teachers/profile-teacher",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data) {
        setTeacherProfile(response.data);
        localStorage.setItem("teacherProfile", JSON.stringify(response.data));
        return response.data;
      }
    } catch (err) {
      console.error("Error fetching teacher profile:", err);
      const storedProfile = localStorage.getItem("teacherProfile");
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        setTeacherProfile(parsed);
        return parsed;
      }
    }
    return null;
  }, []);

  // Initialize component data
  const initializeData = useCallback(async () => {
    if (!groupInfo) {
      navigate("/dashboardTeacher/listStudentGroupForTeacher");
      return;
    }

    try {
      // First get teacher profile
      const profile = await fetchTeacherProfile();

      // Then fetch messages
      const token = getToken();
      const response = await axios.get(
        `http://localhost:5000/api/messages/group/${groupInfo.id.trim()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.messages) {
        const formattedMessages = response.data.messages.map((msg) => ({
          id: msg._id,
          senderModel: msg.senderModel,
          text: msg.content,
          senderName:
            msg.senderModel === "profileTeacher"
              ? profile?.name || msg.sender?.name || "Giảng viên"
              : msg.sender?.name || "Sinh viên",
          time: new Date(msg.timestamp).toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "numeric",
            hour12: true,
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }),
        }));
        setMessages(formattedMessages);
      }
      setIsInitialized(true);
    } catch (err) {
      setError("Không thể tải dữ liệu");
      console.error("Error initializing data:", err);
    }
  }, [groupInfo, navigate, fetchTeacherProfile]);

  // Initialize when component mounts
  useEffect(() => {
    initializeData();
  }, [initializeData]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!message.trim() || !groupInfo?.id) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token không hợp lệ");

      // Gửi tin nhắn lên server
      const response = await axios.post(
        "http://localhost:5000/api/messages/send-new",
        {
          content: message.trim(),
          groupId: groupInfo.id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Đồng bộ tin nhắn lên Firebase
      if (response.data.success) {
        await firebaseMessageService.syncMessageToFirebase(
          response.data.message
        );
      }

      setMessage("");
    } catch (err) {
      console.error("Error sending message:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Có lỗi xảy ra khi gửi tin nhắn"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isInitialized) {
    return (
      <div className="chat-container d-flex justify-content-center align-items-center">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Ngăn không cho xuống dòng mới
      handleSendMessage(e);
    }
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="d-flex align-items-center">
          <div
            className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center"
            style={{ width: "40px", height: "40px" }}
          >
            {groupInfo?.name.charAt(0)}
          </div>
          <div className="ms-3">
            <h5 className="mb-0">{groupInfo?.name}</h5>
            <small className="text-muted">
              {groupInfo?.members?.length || 0} thành viên
            </small>
          </div>
        </div>
      </div>

      <div className="messages-area">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message-wrapper ${
              msg.senderModel === "profileTeacher"
                ? "message-right"
                : "message-left"
            }`}
            onClick={() =>
              setSelectedMessage(selectedMessage?.id === msg.id ? null : msg)
            }
            style={{ position: "relative", cursor: "pointer" }}
          >
            <div
              className={`message-bubble ${
                msg.senderModel === "profileTeacher"
                  ? "message-sent"
                  : "message-received"
              }`}
            >
              <strong>{msg.senderName}</strong>
              <p className="mb-1">{msg.text}</p>
              <small
                className={
                  msg.senderModel === "profileTeacher"
                    ? "text-white-50"
                    : "text-muted"
                }
              >
                {msg.time}
              </small>
            </div>
            {selectedMessage?.id === msg.id && <MessagePopover message={msg} />}
          </div>
        ))}

        {error && <div className="alert alert-danger m-3">{error}</div>}
      </div>

      <div className="message-input-container">
        <input
          type="text"
          className="form-control"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập tin nhắn..."
          disabled={loading || !isInitialized}
        />
        <button
          className="send-button"
          onClick={handleSendMessage}
          disabled={loading || !message.trim() || !isInitialized}
        >
          {loading ? "Đang gửi..." : "Gửi"}
          <i className="bi bi-send ms-2"></i>
        </button>
      </div>
    </div>
  );
}

export default MessageTeacher;
