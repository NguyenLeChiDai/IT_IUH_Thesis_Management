import React, { useEffect, useState } from "react";
import axios from "axios";
import "../../css/ListStudentGroups.css";
import { Toast } from "react-bootstrap";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export const ListStudentGroups = () => {
  const [groups, setGroups] = useState([]);
  const [myGroup, setMyGroup] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  useEffect(() => {
    fetchMyGroup();
    fetchGroups();
  }, []);

  // Lấy nhóm đã đăng ký của sinh viên
  const fetchMyGroup = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/studentGroups/my-group",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log(response.data); // Kiểm tra phản hồi từ API

      if (response.data.groupName) {
        setMyGroup(response.data);
      } else {
        setMyGroup(null);
      }
    } catch (error) {
      console.error("Lỗi khi lấy nhóm:", error);
      toast.success("Lỗi khi lấy nhóm!", {
        position: "top-right",
        autoClose: 2500,
      });
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/studentgroups/list-groups"
      );
      if (response.data.success) {
        setGroups(response.data.groups);
      } else {
        // Khi có lỗi
        toast.error("Hiện tại hệ thống không có nhóm!", {
          position: "top-right",
          autoClose: 2500,
        });
      }
    } catch (error) {
      console.error("Lỗi khi tải nhóm:", error);
      // Khi có lỗi
      toast.error("Lỗi khi tải nhóm!", {
        position: "top-right",
        autoClose: 2500,
      });
    }
  };

  const fetchStudentGroup = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        "http://localhost:5000/api/profileStudent/my-group", // API để lấy thông tin nhóm của sinh viên
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setMyGroup(response.data.group); // Lưu thông tin nhóm vào state
      }
    } catch (error) {
      console.error("Lỗi khi tải nhóm của sinh viên:", error);
    }
  };

  // Xử lý tham gia nhóm
  const handleJoinGroup = async (groupId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/studentGroups/join-group/${groupId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.confirmationRequired) {
        setConfirmation({
          groupId: groupId,
          message: response.data.message,
        });
      } else if (response.data.success) {
        toast.success("Đã tham gia nhóm thành công!", {
          position: "top-right",
          autoClose: 2500,
        });
        fetchGroups();
        fetchStudentGroup(); // Cập nhật thông tin nhóm của sinh viên
      } else {
        Toast(response.data.message);
      }
    } catch (error) {
      console.error("Lỗi khi tham gia nhóm!", error);
    }
  };

  // Xác nhận tham gia nhóm
  const confirmJoinGroup = async (groupId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/studentGroups/join-group/${groupId}`,
        { confirmation: true },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Đã tham gia nhóm thành công!", {
          position: "top-right",
          autoClose: 2500,
        });
        setConfirmation(null);
        fetchGroups();
        fetchMyGroup(); // Gọi fetchMyGroup để cập nhật thông tin nhóm ngay lập tức
      }
    } catch (error) {
      console.error("Có lỗi khi tham gia nhóm:", error);
    }
  };
  // Hủy nhóm
  const handleLeaveGroup = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "http://localhost:5000/api/studentGroups/leave-group",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.success) {
        toast.success(response.data.message, {
          position: "top-right",
          autoClose: 2500,
        });
        setMyGroup(null);
        fetchGroups();
      }
    } catch (error) {
      console.error("Lỗi khi hủy nhóm:", error);
      toast.success("Bạn đã rời khỏi nhóm thành công!", {
        position: "top-right",
        autoClose: 2500,
      });
    }
  };

  return (
    <div>
      <h2>Thông tin nhóm sinh viên</h2>
      {console.log(myGroup)} {/* Kiểm tra giá trị myGroup */}
      {confirmation && (
        <div className="confirmation-popup">
          <p>{confirmation.message}</p>
          <button onClick={() => confirmJoinGroup(confirmation.groupId)}>
            Xác nhận
          </button>
          <button onClick={() => setConfirmation(null)}>Hủy</button>
        </div>
      )}
      {myGroup ? (
        <div className="group-info">
          <h3>Bạn đã đăng ký nhóm: {myGroup.groupName}</h3>
          <p>
            <strong>Trạng thái:</strong> {myGroup.groupStatus}
          </p>
          <p>
            <strong>Trạng thái nhóm:</strong>{" "}
            {myGroup.members.length === 2
              ? "Nhóm đã đủ thành viên"
              : "Nhóm chưa đủ thành viên"}
          </p>
          <p>
            <strong>Thành viên:</strong>
          </p>
          <ul>
            {myGroup.members.map((member) => (
              <li key={member._id}>
                {member.name} - {member.studentId}{" "}
                {/* Hiển thị thêm mã sinh viên */}
              </li>
            ))}
          </ul>
          <button className="btn btn-danger" onClick={handleLeaveGroup}>
            Hủy nhóm
          </button>
        </div>
      ) : (
        <div className="groups-grid">
          {groups.map((group) => (
            <div key={group._id} className="group-card">
              <p>
                <strong>Nhóm:</strong> {group.groupName}
              </p>
              <p>
                <strong>Trạng thái:</strong> {group.groupStatus}
              </p>
              <button onClick={() => handleJoinGroup(group._id)}>
                Tham gia nhóm
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
