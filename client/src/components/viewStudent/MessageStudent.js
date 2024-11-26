import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import { Toast, ToastContainer } from "react-bootstrap";
import { FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../css/MessageStudent.css";
import { firebaseMessageService } from "../../services/firebaseMessageService";

const MessageStudent = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const messageListRef = useRef(null);
  const popoverRef = useRef(null);

  // State Management
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Get data from location state
  const groupInfo = location.state?.groupInfo;
  const teacherInfo = location.state?.teacherInfo;

  const getToken = () => localStorage.getItem("token");

  // Sửa lại hàm formatMessages để bao gồm senderId
  const formatMessages = useCallback((msgs) => {
    return msgs.map((msg) => {
      const sender = msg.sender || {};
      const role = sender.role || "Unknown";

      return {
        id: msg._id || msg.id,
        senderId: sender._id, // Thêm senderId vào đây
        senderModel:
          role === "Giảng viên" ? "profileTeacher" : "profileStudent",
        text: msg.content || "",
        senderName: sender.name || "Unknown User",
        time: new Date(msg.timestamp).toLocaleString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
      };
    });
  }, []);

  // useEffect cho việc subscribe messages
  useEffect(() => {
    console.log("UseEffect triggered with groupInfo:", {
      groupInfo,
      id: groupInfo?.id,
      _id: groupInfo?._id,
    });

    // Sử dụng groupId đã được chuẩn hóa
    const groupId = groupInfo?.id || groupInfo?._id;
    if (!groupId) {
      console.log("Missing groupId, returning early");
      return;
    }

    firebaseMessageService.clearDeletedMessagesCache();

    const fetchInitialMessages = async () => {
      try {
        console.log("Fetching messages for group:", groupId);
        const initialMessages = await firebaseMessageService.getGroupMessages(
          groupId
        );
        console.log("Initial messages:", initialMessages);
        setMessages(formatMessages(initialMessages));
      } catch (error) {
        console.error("Error fetching initial messages:", error);
        toast.error("Không thể tải tin nhắn cũ");
      }
    };

    fetchInitialMessages();

    firebaseMessageService.subscribeToGroupMessages(groupId, (newMessages) => {
      console.log("New messages received:", newMessages);
      setMessages(formatMessages(newMessages));
    });

    return () => {
      console.log("Cleaning up subscription for group:", groupId);
      firebaseMessageService.unsubscribeFromGroupMessages(groupId);
      firebaseMessageService.clearDeletedMessagesCache();
    };
  }, [groupInfo, formatMessages]);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = getToken();
        if (!token) {
          setCurrentUser(null);
          localStorage.removeItem("currentUserId");
          localStorage.removeItem("userInfo");
          return;
        }

        const response = await axios.get(
          "http://localhost:5000/api/student/profile-student",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Kiểm tra response và data - Sửa lại từ student thành profile
        if (response?.data?.success && response?.data?.profile) {
          const profileData = response.data.profile;

          // Kiểm tra xem profileData có _id không
          if (!profileData._id) {
            console.error("Profile data missing _id:", profileData);
            toast.error("Lỗi dữ liệu người dùng");
            return;
          }

          setCurrentUser(profileData);
          localStorage.setItem("currentUserId", profileData._id);
          localStorage.setItem("userInfo", JSON.stringify(profileData));
        } else {
          console.error("Invalid response format:", response?.data);
          toast.error("Không thể lấy thông tin người dùng");
          setCurrentUser(null);
          localStorage.removeItem("currentUserId");
          localStorage.removeItem("userInfo");
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
        setCurrentUser(null);
        localStorage.removeItem("currentUserId");
        localStorage.removeItem("userInfo");
        toast.error("Lỗi khi lấy thông tin người dùng");
      }
    };

    fetchCurrentUser();
  }, []);

  // Xử lý click bên ngoài popover
  useEffect(() => {
    function handleClickOutside(event) {
      const clickedPopover = event.target.closest(".message-popover");
      const clickedMessage = event.target.closest(".message-wrapper");

      if (!clickedPopover && !clickedMessage) {
        setSelectedMessage(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Component Popover cho tin nhắn
  // Fetch user info and validate on component mount and after any auth changes
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = getToken();
        if (!token) {
          setCurrentUser(null);
          localStorage.removeItem("currentUserId");
          localStorage.removeItem("userInfo");
          return;
        }

        const response = await axios.get(
          "http://localhost:5000/api/student/profile-student",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // Kiểm tra response và data - Sửa lại từ student thành profile
        if (response?.data?.success && response?.data?.profile) {
          const profileData = response.data.profile;

          // Kiểm tra xem profileData có _id không
          if (!profileData._id) {
            console.error("Profile data missing _id:", profileData);
            toast.error("Lỗi dữ liệu người dùng");
            return;
          }

          setCurrentUser(profileData);
          localStorage.setItem("currentUserId", profileData._id);
          localStorage.setItem("userInfo", JSON.stringify(profileData));
        } else {
          console.error("Invalid response format:", response?.data);
          toast.error("Không thể lấy thông tin người dùng");
          setCurrentUser(null);
          localStorage.removeItem("currentUserId");
          localStorage.removeItem("userInfo");
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
        setCurrentUser(null);
        localStorage.removeItem("currentUserId");
        localStorage.removeItem("userInfo");
        toast.error("Lỗi khi lấy thông tin người dùng");
      }
    };

    fetchCurrentUser();
  }, []);

  // Sửa lại MessagePopover component
  const MessagePopover = ({ message }) => {
    const currentUserId = localStorage.getItem("currentUserId");

    console.log("Current User ID:", currentUserId); // Debug
    console.log("Message Sender ID:", message.senderId); // Debug
    console.log(
      "Is Student Message:",
      message.senderModel === "profileStudent"
    ); // Debug

    const isOwnMessage =
      message.senderModel === "profileStudent" &&
      currentUserId === message.senderId;

    console.log("Is Own Message:", isOwnMessage); // Debug

    if (!isOwnMessage) return null;

    return (
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
          right: "0",
          padding: "8px",
          borderRadius: "4px",
          marginTop: "5px",
          minWidth: "150px",
        }}
      >
        <button
          className="delete-message-btn d-flex align-items-center gap-2"
          onClick={(e) => {
            e.stopPropagation();
            handleDeleteMessage(message.id);
          }}
          style={{
            border: "none",
            background: "none",
            padding: "8px 12px",
            width: "100%",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "background-color 0.2s",
            borderRadius: "4px",
          }}
        >
          <FaTrash size={14} style={{ color: "#666" }} />
          <span>Thu hồi tin nhắn</span>
        </button>
      </div>
    );
  };

  // Fetch tin nhắn
  useEffect(() => {
    const fetchMessages = async () => {
      if (!groupInfo?._id) {
        console.error("GroupInfo không có _id:", groupInfo);
        // toast.error("Không thể tải tin nhắn: Thiếu thông tin nhóm");
        return;
      }

      try {
        setLoading(true);
        const token = getToken();
        const response = await axios.get(
          `http://localhost:5000/api/messages/group/${groupInfo._id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.success) {
          const formattedMessages = response.data.messages.map((msg) => ({
            id: msg._id,
            senderId: msg.sender?._id,
            senderModel: msg.senderModel,
            text: msg.content,
            senderName: msg.sender?.name || "Unknown",
            time: new Date(msg.timestamp).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }),
          }));

          setMessages(formattedMessages);
          setTimeout(scrollToBottom, 100);
        }
      } catch (err) {
        console.error("Error fetching messages:", err);
        toast.error("Lỗi khi tải tin nhắn");
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [groupInfo]);

  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !groupInfo?._id) return;

    setLoading(true);
    try {
      const token = getToken();
      if (!token) throw new Error("Token không hợp lệ");

      // 1. Gửi tin nhắn lên server
      const response = await axios.post(
        "http://localhost:5000/api/messages/send-new",
        {
          receiverIds: [teacherInfo.id],
          content: message.trim(),
          receiverModel: "profileTeacher",
          groupId: groupInfo._id,
          senderName: currentUser?.name,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // 2. Nếu gửi thành công, đồng bộ lên Firebase
      if (response.data.success) {
        try {
          await firebaseMessageService.syncMessageToFirebase({
            _id: response.data.message._id,
            content: response.data.message.content,
            sender: {
              _id: currentUser._id,
              name: currentUser.name,
              role: "Sinh viên",
            },
            groupId: groupInfo._id,
            timestamp: new Date().toISOString(),
            senderModel: "profileStudent",
          });
        } catch (firebaseError) {
          console.error("Firebase sync error:", firebaseError);
          // Không throw error vì tin nhắn đã được lưu trong MongoDB
        }
      }

      setMessage("");
      scrollToBottom();
    } catch (err) {
      console.error("Error sending message:", err);
      toast.error(err.response?.data?.message || "Không thể gửi tin nhắn");
    } finally {
      setLoading(false);
    }
  };
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      // Log để debug
      console.log("Debug values:", {
        messageId,
        groupInfo,
        groupId: groupInfo?.id || groupInfo?._id,
      });

      if (!messageId) {
        throw new Error("MessageId không tồn tại");
      }
      if (!groupInfo) {
        throw new Error("GroupInfo không tồn tại");
      }

      // Sử dụng groupInfo.id hoặc groupInfo._id
      const groupId = groupInfo.id || groupInfo._id;
      if (!groupId) {
        throw new Error("GroupId không tồn tại");
      }

      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token không hợp lệ");

      // Gọi API xóa từ MongoDB trước
      const response = await axios.delete(
        `http://localhost:5000/api/messages/delete/${messageId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        // Sử dụng groupId đã xác định ở trên
        await firebaseMessageService.deleteMessageFromFirebase(
          groupId,
          messageId
        );

        setSelectedMessage(null);
        toast.success("Xóa tin nhắn thành công");
      }
    } catch (err) {
      console.error("Error deleting message:", err);
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Có lỗi xảy ra khi xóa tin nhắn";
      setError(errorMessage);
      toast.error(errorMessage);
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
            {teacherInfo?.name?.charAt(0) || "T"}
          </div>
          <div className="ms-3">
            <h5 className="mb-0">
              {teacherInfo?.name || "Nhóm chat với giảng viên"}
            </h5>
            <small className="text-muted">Giảng viên</small>
          </div>
        </div>
      </div>

      <div className="messages-area" ref={messageListRef}>
        {loading && <div className="text-center py-3">Đang tải...</div>}

        {messages.map((msg) => {
          const currentUserId = localStorage.getItem("currentUserId");
          // Chỉ tin nhắn của người đang đăng nhập mới hiển thị bên phải và màu xanh
          const isOwnMessage = msg.senderId === currentUserId;

          return (
            <div
              key={msg.id}
              className={`message-wrapper ${
                isOwnMessage ? "message-right" : "message-left"
              }`}
              onClick={() => {
                if (isOwnMessage) {
                  setSelectedMessage(
                    selectedMessage?.id === msg.id ? null : msg
                  );
                }
              }}
              style={{
                position: "relative",
                cursor: isOwnMessage ? "pointer" : "default",
                marginBottom: "16px",
                display: "flex",
                flexDirection: "column",
                alignItems: isOwnMessage ? "flex-end" : "flex-start",
              }}
            >
              <div
                className={`message-bubble ${
                  isOwnMessage ? "message-sent" : "message-received"
                }`}
                style={{
                  backgroundColor: isOwnMessage ? "#0084ff" : "#ffffff",
                  color: isOwnMessage ? "#ffffff" : "#000000",
                  padding: "10px 15px",
                  borderRadius: "15px",
                  maxWidth: "70%",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
                  position: "relative",
                }}
              >
                <strong>{msg.senderName}</strong>
                <p className="mb-1">{msg.text}</p>
                <small
                  className={isOwnMessage ? "text-white-50" : "text-muted"}
                >
                  {msg.time}
                </small>
              </div>
              {selectedMessage?.id === msg.id && isOwnMessage && (
                <MessagePopover message={msg} />
              )}
            </div>
          );
        })}
      </div>

      <div className="message-input-container">
        <input
          type="text"
          className="form-control"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập tin nhắn..."
          disabled={loading}
        />
        <button
          className="btn btn-primary"
          onClick={handleSendMessage}
          disabled={loading || !message.trim()}
        >
          {loading ? "Đang gửi..." : "Gửi"}
          <i className="bi bi-send ms-2"></i>
        </button>
      </div>
    </div>
  );
};

export default MessageStudent;
