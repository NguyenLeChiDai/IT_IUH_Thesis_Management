import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  IconButton,
  Select,
  MenuItem,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

const ManageStudentGroups = () => {
  const [groups, setGroups] = useState([]);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newGroup, setNewGroup] = useState({
    groupId: "",
    groupName: "",
    groupStatus: "0/2",
  });

  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editGroup, setEditGroup] = useState(null);

  // Thêm state mới cho dialog chi tiết nhóm
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [selectedGroupDetails, setSelectedGroupDetails] = useState(null);

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/studentgroups/list-groups"
      );

      if (response.data.success) {
        setGroups(response.data.groups);
      } else {
        setGroups([]);
        toast.error("Không thể tải danh sách nhóm");
      }
    } catch (error) {
      console.error("Lỗi khi tải nhóm:", error);
      setGroups([]);
      toast.error("Đã xảy ra lỗi khi tải danh sách nhóm");
    }
  };

  // Thêm hàm fetch chi tiết nhóm
  const fetchGroupDetails = async (groupId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/studentgroups/group-details/${groupId}`
      );

      if (response.data.success) {
        setSelectedGroupDetails(response.data);
        setOpenDetailsDialog(true);
      } else {
        toast.error("Không thể tải thông tin chi tiết nhóm");
      }
    } catch (error) {
      console.error("Lỗi khi tải chi tiết nhóm:", error);
      toast.error("Đã xảy ra lỗi khi tải thông tin chi tiết nhóm");
    }
  };

  const handleCreateGroup = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/studentgroups/create-group",
        {
          groupName: newGroup.groupName,
          groupStatus: newGroup.groupStatus,
        }
      );

      if (response.data.success) {
        toast.success("Tạo nhóm thành công!");
        setOpenCreateDialog(false);
        setNewGroup({ groupName: "", groupStatus: "0/2" });
        fetchGroups();
      } else {
        toast.error("Tạo nhóm thất bại: " + response.data.message);
      }
    } catch (error) {
      console.error("Lỗi khi tạo nhóm:", error);
      toast.error("Đã xảy ra lỗi khi tạo nhóm");
    }
  };

  const handleAutoCreateGroups = async () => {
    try {
      const result = await Swal.fire({
        title: "Xác nhận",
        text: "Bạn có chắc chắn muốn tự động tạo nhóm?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Đồng ý",
        cancelButtonText: "Hủy",
      });

      if (result.isConfirmed) {
        const response = await axios.post(
          "http://localhost:5000/api/studentgroups/auto-create-groups"
        );

        if (response.data.success) {
          toast.success(response.data.message);
          fetchGroups();
        } else {
          toast.error("Tạo nhóm tự động thất bại: " + response.data.message);
        }
      }
    } catch (error) {
      console.error("Lỗi khi tạo nhóm tự động:", error);
      toast.error("Đã xảy ra lỗi khi tạo nhóm tự động");
    }
  };

  const handleDeleteGroup = async (groupId) => {
    try {
      const result = await Swal.fire({
        title: "Xác nhận xóa",
        text: "Bạn có chắc chắn muốn xóa nhóm này?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Xóa",
        cancelButtonText: "Hủy",
        confirmButtonColor: "#d33",
      });

      if (result.isConfirmed) {
        const response = await axios.delete(
          `http://localhost:5000/api/studentgroups/delete-group/${groupId}`
        );

        if (response.data.success) {
          toast.success("Xóa nhóm thành công!");
          fetchGroups();
        } else {
          toast.error("Xóa nhóm thất bại: " + response.data.message);
        }
      }
    } catch (error) {
      console.error("Lỗi khi xóa nhóm:", error);
      toast.error("Đã xảy ra lỗi khi xóa nhóm");
    }
  };

  const handleUpdateGroup = async () => {
    try {
      const result = await Swal.fire({
        title: "Xác nhận cập nhật",
        text: "Bạn có chắc chắn muốn cập nhật thông tin nhóm?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Cập nhật",
        cancelButtonText: "Hủy",
      });

      if (result.isConfirmed) {
        const response = await axios.put(
          `http://localhost:5000/api/studentgroups/update-group/${editGroup._id}`,
          {
            groupName: editGroup.groupName,
            groupStatus: editGroup.groupStatus,
          }
        );

        if (response.data.success) {
          toast.success("Cập nhật nhóm thành công!");
          setOpenEditDialog(false);
          fetchGroups();
        } else {
          toast.error("Cập nhật nhóm thất bại: " + response.data.message);
        }
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật nhóm:", error);
      toast.error("Đã xảy ra lỗi khi cập nhật nhóm");
    }
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Quản lý nhóm sinh viên
      </Typography>

      <Button
        variant="contained"
        color="primary"
        onClick={() => setOpenCreateDialog(true)}
        style={{ marginRight: "10px", marginBottom: "20px" }}
      >
        Tạo nhóm
      </Button>

      <Button
        variant="contained"
        color="secondary"
        onClick={handleAutoCreateGroups}
        style={{ marginBottom: "20px" }}
      >
        Tự động tạo nhóm
      </Button>

      {groups.length === 0 ? (
        <Typography variant="body1" color="textSecondary">
          Không có nhóm nào được tạo.
        </Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID Nhóm</TableCell>
                <TableCell>Tên Nhóm</TableCell>
                <TableCell>Trạng thái</TableCell>
                <TableCell>Hành động</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {groups.map((group) => (
                <TableRow
                  key={group._id}
                  onClick={() => fetchGroupDetails(group._id)}
                  style={{ cursor: "pointer" }}
                  hover
                >
                  <TableCell>{group.groupId}</TableCell>
                  <TableCell>{group.groupName}</TableCell>
                  <TableCell>{group.groupStatus}</TableCell>
                  <TableCell>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation(); // Ngăn chặn sự kiện click lan truyền
                        setEditGroup(group);
                        setOpenEditDialog(true);
                      }}
                      color="primary"
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton
                      onClick={(e) => {
                        e.stopPropagation(); // Ngăn chặn sự kiện click lan truyền
                        handleDeleteGroup(group._id);
                      }}
                      color="secondary"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog hiển thị chi tiết nhóm */}
      <Dialog
        open={openDetailsDialog}
        onClose={() => setOpenDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Chi tiết nhóm: {selectedGroupDetails?.groupName}
        </DialogTitle>
        <DialogContent>
          <Typography variant="subtitle1" gutterBottom>
            Trạng thái: {selectedGroupDetails?.groupStatus}
          </Typography>
          <Typography variant="h6" gutterBottom style={{ marginTop: "20px" }}>
            Danh sách thành viên:
          </Typography>
          {selectedGroupDetails?.members &&
          selectedGroupDetails.members.length > 0 ? (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>MSSV</TableCell>
                    <TableCell>Họ và tên</TableCell>
                    <TableCell>Vai trò</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedGroupDetails.members.map((member, index) => (
                    <TableRow key={index}>
                      <TableCell>{member.studentId}</TableCell>
                      <TableCell>{member.name}</TableCell>
                      <TableCell>{member.role}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Typography color="textSecondary">
              Chưa có thành viên trong nhóm
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)} color="primary">
            Đóng
          </Button>
        </DialogActions>
      </Dialog>

      {/* DIALOG FRONT NHẬP TẠO NHÓM */}
      <Dialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
      >
        <DialogTitle>Tạo nhóm mới</DialogTitle>
        <DialogContent>
          <DialogContentText>Nhập thông tin nhóm mới.</DialogContentText>
          <TextField
            margin="dense"
            label="Tên Nhóm"
            type="text"
            fullWidth
            value={newGroup.groupName}
            onChange={(e) =>
              setNewGroup({ ...newGroup, groupName: e.target.value })
            }
          />
          <Select
            fullWidth
            value={newGroup.groupStatus}
            onChange={(e) =>
              setNewGroup({ ...newGroup, groupStatus: e.target.value })
            }
          >
            <MenuItem value="0/2">0/2</MenuItem>
            <MenuItem value="1/2">1/2</MenuItem>
            <MenuItem value="2/2">2/2</MenuItem>
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)} color="secondary">
            Hủy
          </Button>
          <Button onClick={handleCreateGroup} color="primary">
            Tạo
          </Button>
        </DialogActions>
      </Dialog>

      {editGroup && (
        <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
          <DialogTitle>Cập nhật nhóm</DialogTitle>
          <DialogContent>
            <DialogContentText>Cập nhật thông tin nhóm.</DialogContentText>
            <TextField
              autoFocus
              margin="dense"
              label="Tên Nhóm"
              type="text"
              fullWidth
              value={editGroup.groupName}
              onChange={(e) =>
                setEditGroup({ ...editGroup, groupName: e.target.value })
              }
            />
            <Select
              fullWidth
              value={editGroup.groupStatus}
              onChange={(e) =>
                setEditGroup({ ...editGroup, groupStatus: e.target.value })
              }
            >
              <MenuItem value="0/2">0/2</MenuItem>
              <MenuItem value="1/2">1/2</MenuItem>
              <MenuItem value="2/2">2/2</MenuItem>
            </Select>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditDialog(false)} color="secondary">
              Hủy
            </Button>
            <Button onClick={handleUpdateGroup} color="primary">
              Cập nhật
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </div>
  );
};

export default ManageStudentGroups;
