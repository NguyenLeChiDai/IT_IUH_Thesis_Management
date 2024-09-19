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
} from "@mui/material";

const ManageStudentGroups = () => {
  const [groups, setGroups] = useState([]);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [newGroup, setNewGroup] = useState({
    groupId: "",
    groupName: "",
    groupStatus: "",
  });

  // Fetch danh sách nhóm sinh viên từ server
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
        alert("Không có nhóm nào.");
        setGroups([]); // Đặt mảng rỗng nếu không có nhóm
      }
    } catch (error) {
      console.error("Lỗi khi tải nhóm:", error);
      alert("Lỗi khi tải nhóm.");
    }
  };

  const handleCreateGroup = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/studentgroups/create-group",
        {
          groupId: newGroup.groupId,
          groupName: newGroup.groupName,
          groupStatus: newGroup.groupStatus,
        }
      );

      if (response.data.success) {
        alert("Tạo nhóm thành công!");
        setOpenCreateDialog(false);
        setNewGroup({ groupId: "", groupName: "", groupStatus: "" });
        fetchGroups(); // Load lại danh sách nhóm
      } else {
        alert("Tạo nhóm thất bại: " + response.data.message);
      }
    } catch (error) {
      console.error("Lỗi khi tạo nhóm:", error);
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
        style={{ marginBottom: "20px" }}
      >
        Tạo nhóm
      </Button>

      {/* Bảng danh sách nhóm */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID Nhóm</TableCell>
              <TableCell>Tên Nhóm</TableCell>
              <TableCell>Trạng thái</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.map((group) => (
              <TableRow key={group._id}>
                <TableCell>{group.groupId}</TableCell>
                <TableCell>{group.groupName}</TableCell>
                <TableCell>{group.groupStatus}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Form tạo nhóm */}
      <Dialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
      >
        <DialogTitle>Tạo nhóm mới</DialogTitle>
        <DialogContent>
          <DialogContentText>Nhập thông tin nhóm mới.</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="ID Nhóm"
            type="text"
            fullWidth
            value={newGroup.groupId}
            onChange={(e) =>
              setNewGroup({ ...newGroup, groupId: e.target.value })
            }
          />
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
          <TextField
            margin="dense"
            label="Trạng thái"
            type="text"
            fullWidth
            value={newGroup.groupStatus}
            onChange={(e) =>
              setNewGroup({ ...newGroup, groupStatus: e.target.value })
            }
          />
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
    </div>
  );
};

export default ManageStudentGroups;
