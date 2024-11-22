import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import "../../css/ListStudentGroups.css";

import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthContext } from "../../contexts/AuthContext";
import { Dialog, DialogContent, DialogTitle, Button } from "@mui/material";
import Swal from "sweetalert2";

export const ListStudentGroups = () => {
  const [groups, setGroups] = useState([]);
  const [myGroup, setMyGroup] = useState(null);
  const [confirmation, setConfirmation] = useState(null);
  const { updateProfile } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null); // chọn xem nhóm

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

      if (response.data.groupName) {
        setMyGroup(response.data);
      } else {
        setMyGroup(null);
        fetchGroups();
      }
    } catch (error) {
      console.error("Lỗi khi lấy nhóm:", error);
      toast.error("Lỗi khi lấy thông tin nhóm!");
    } finally {
      setIsLoading(false);
    }
  };

  // Lấy danh sách tất cả nhóm có thể đăng ký
  const fetchGroups = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/studentgroups/list-groups"
      );
      if (response.data.success) {
        setGroups(response.data.groups);
      } else {
        toast.error("Hiện tại hệ thống không có nhóm!");
      }
    } catch (error) {
      console.error("Lỗi khi tải nhóm:", error);
      toast.error("Lỗi khi tải danh sách nhóm!");
    }
  };

  // xem chi tiết nhóm
  const fetchGroupDetails = async (groupId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/studentGroups/group-details/${groupId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        setSelectedGroup(response.data);
      }
    } catch (error) {
      console.error("Lỗi khi lấy thông tin nhóm:", error);
      toast.error("Không thể lấy thông tin nhóm!");
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

      // Tìm tên nhóm dựa trên groupId
      const group = groups.find((g) => g._id === groupId);
      const groupName = group ? group.groupName : "Nhóm không xác định";

      if (response.data.confirmationRequired) {
        const result = await Swal.fire({
          title: "Xác nhận tham gia nhóm",
          text: `Bạn có chắc chắn muốn tham gia nhóm "${groupName}" không?`,
          icon: "question",
          showCancelButton: true,
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: "Xác nhận",
          cancelButtonText: "Hủy",
        });

        if (result.isConfirmed) {
          await confirmJoinGroup(groupId, groupName);
        }
      } else if (response.data.success) {
        Swal.fire(
          "Thành công",
          `Đã tham gia nhóm "${groupName}" thành công!`,
          "success"
        );
        fetchMyGroup();
      } else {
        Swal.fire("Lỗi", response.data.message, "error");
      }
    } catch (error) {
      console.error("Lỗi khi tham gia nhóm!", error);
      if (error.response && error.response.status === 400) {
        Swal.fire(
          "Lỗi",
          "Nhóm đã đủ số lượng. Vui lòng chọn nhóm khác!",
          "error"
        );
      } else {
        Swal.fire("Lỗi", "Lỗi khi tham gia nhóm!", "error");
      }
    }
  };

  // Xác nhận tham gia nhóm
  const confirmJoinGroup = async (groupId, groupName) => {
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
        Swal.fire(
          "Thành công",
          `Đã tham gia nhóm "${groupName}" thành công!`,
          "success"
        );
        fetchMyGroup();
        updateProfile();
      }
    } catch (error) {
      console.error("Có lỗi khi tham gia nhóm:", error);
      Swal.fire("Lỗi", "Lỗi khi xác nhận tham gia nhóm!", "error");
    }
  };
  // Rời nhóm
  const handleLeaveGroup = async () => {
    if (!myGroup) {
      toast.error("Bạn chưa tham gia nhóm nào!");
      return;
    }
    try {
      const result = await Swal.fire({
        title: "Xác nhận rời nhóm",
        text: `Bạn có chắc chắn muốn rời khỏi nhóm "${myGroup.groupName}" không?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Xác nhận",
        cancelButtonText: "Hủy",
      });
      if (result.isConfirmed) {
        const token = localStorage.getItem("token");
        try {
          const response = await axios.post(
            "http://localhost:5000/api/studentGroups/leave-group",
            {},
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (response.data.success) {
            toast.success(`Bạn đã rời khỏi nhóm "${myGroup.groupName}"!`);
            setMyGroup(null);
            fetchGroups();
            updateProfile();
          }
        } catch (err) {
          // Kiểm tra lỗi từ server và hiển thị thông báo chi tiết
          if (err.response && err.response.status === 403) {
            // Hiển thị thông báo khi chức năng bị khóa
            await Swal.fire({
              title: "Chức Năng Bị Khóa",
              text:
                err.response.data.message ||
                "Chức năng rời nhóm hiện đang bị khóa",
              icon: "warning",
              confirmButtonText: "Đóng",
            });
          } else {
            // Xử lý các lỗi khác
            Swal.fire(
              "Lỗi",
              err.response?.data?.message || "Có lỗi xảy ra khi rời nhóm",
              "error"
            );
          }
        }
      }
    } catch (error) {
      console.error("Lỗi khi rời nhóm:", error);
      Swal.fire("Lỗi", "Có lỗi xảy ra khi rời khỏi nhóm!", "error");
    }
  };
  // thay đổi nhóm trưởng
  const handleChangeLeader = async (groupId, newLeaderId) => {
    if (!groupId || !newLeaderId) {
      toast.error("Không thể thay đổi nhóm trưởng: Thiếu thông tin cần thiết");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `http://localhost:5000/api/studentGroups/change-leader/${groupId}/${newLeaderId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.success) {
        toast.success("Đã thay đổi nhóm trưởng thành công!");
        fetchMyGroup();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Lỗi khi thay đổi nhóm trưởng:", error);
      toast.error("Lỗi khi thay đổi nhóm trưởng!");
    }
  };

  if (isLoading) {
    return <div>Đang tải...</div>;
  }

  return (
    <div className="list-student-groups">
      <h2>Thông tin nhóm sinh viên</h2>
      {confirmation && (
        <Dialog open={!!confirmation} onClose={() => setConfirmation(null)}>
          <DialogTitle>Xác nhận tham gia nhóm</DialogTitle>
          <DialogContent>
            <p>{confirmation.message}</p>
            <Button
              onClick={() => confirmJoinGroup(confirmation.groupId)}
              color="primary"
            >
              Xác nhận
            </Button>
            <Button onClick={() => setConfirmation(null)} color="secondary">
              Hủy
            </Button>
          </DialogContent>
        </Dialog>
      )}
      {myGroup ? (
        <div className="my-group-info">
          <h3>Nhóm của tôi: {myGroup.groupName}</h3>
          <p>
            <strong>Trạng thái:</strong> {myGroup.groupStatus}
          </p>
          <p>
            {myGroup.members.length === 2
              ? "Nhóm đã đủ thành viên"
              : "Nhóm chưa đủ thành viên"}
          </p>
          <div className="members-container">
            {myGroup.members.map((member, index) => (
              <div
                key={index}
                className={`member-card ${
                  member.role === "Nhóm trưởng" ? "leader" : ""
                }`}
              >
                <h5>
                  <strong>Sinh viên: {member.name}</strong>
                </h5>
                <p>
                  <strong>Vai trò:</strong> {member.role}
                </p>
                <p>
                  <strong>Mã số:</strong> {member.studentId}
                </p>
                <p>
                  <strong>Email:</strong> {member.email}
                </p>
                <p>
                  <strong>Số điện thoại:</strong> 0{member.phone}
                </p>
                <p>
                  <strong>Giới tính:</strong> {member.gender}
                </p>
                {myGroup.members.length === 2 &&
                  member.role !== "Nhóm trưởng" && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() =>
                        handleChangeLeader(myGroup._id, member._id)
                      }
                    >
                      Đặt làm nhóm trưởng
                    </Button>
                  )}
              </div>
            ))}
          </div>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleLeaveGroup}
          >
            Rời nhóm
          </Button>
        </div>
      ) : (
        <div className="groups-grid">
          {groups.map((group) => (
            <div
              key={group._id}
              className="group-card"
              onClick={() => fetchGroupDetails(group._id)}
            >
              <h3>{group.groupName}</h3>
              <p>
                <strong>Trạng thái:</strong> {group.groupStatus}
              </p>
              <Button
                variant="contained"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  handleJoinGroup(group._id);
                }}
              >
                Tham gia nhóm
              </Button>
            </div>
          ))}
        </div>
      )}
      <Dialog
        open={!!selectedGroup}
        onClose={() => setSelectedGroup(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Chi tiết nhóm: {selectedGroup?.groupName}</DialogTitle>
        <DialogContent>
          {selectedGroup && (
            <>
              <p>
                <strong>Trạng thái:</strong> {selectedGroup.groupStatus}
              </p>
              <h4>Thành viên:</h4>
              <div className="members-container">
                {selectedGroup.members.map((member, index) => (
                  <div
                    key={index}
                    className={`member-card ${
                      member.role === "Nhóm trưởng" ? "leader" : ""
                    }`}
                  >
                    <h5>
                      <strong>Sinh viên: {member.name}</strong>
                    </h5>
                    <p>
                      <strong>Vai trò:</strong> {member.role}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
          <Button onClick={() => setSelectedGroup(null)} color="primary">
            Đóng
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};
