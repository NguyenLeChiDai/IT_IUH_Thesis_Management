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
        setGroups([]);
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
          groupName: newGroup.groupName,
          groupStatus: newGroup.groupStatus,
        }
      );

      if (response.data.success) {
        alert("Tạo nhóm thành công!");
        setOpenCreateDialog(false);
        setNewGroup({ groupName: "", groupStatus: "0/2" });
        fetchGroups();
      } else {
        alert("Tạo nhóm thất bại: " + response.data.message);
      }
    } catch (error) {
      console.error("Lỗi khi tạo nhóm:", error);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa nhóm này?")) return;

    try {
      const response = await axios.delete(
        `http://localhost:5000/api/studentgroups/delete-group/${groupId}`
      );

      if (response.data.success) {
        alert("Xóa nhóm thành công!");
        fetchGroups();
      } else {
        alert("Xóa nhóm thất bại: " + response.data.message);
      }
    } catch (error) {
      console.error("Lỗi khi xóa nhóm:", error);
    }
  };

  const handleUpdateGroup = async () => {
    try {
      const response = await axios.put(
        `http://localhost:5000/api/studentgroups/update-group/${editGroup._id}`,
        {
          groupName: editGroup.groupName,
          groupStatus: editGroup.groupStatus,
        }
      );

      if (response.data.success) {
        alert("Cập nhật nhóm thành công!");
        setOpenEditDialog(false);
        fetchGroups();
      } else {
        alert("Cập nhật nhóm thất bại: " + response.data.message);
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật nhóm:", error);
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
              <TableRow key={group._id}>
                <TableCell>{group.groupId}</TableCell>
                <TableCell>{group.groupName}</TableCell>
                <TableCell>{group.groupStatus}</TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => {
                      setEditGroup(group);
                      setOpenEditDialog(true);
                    }}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDeleteGroup(group._id)}
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

      <Dialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
      >
        <DialogTitle>Tạo nhóm mới</DialogTitle>
        <DialogContent>
          <DialogContentText>Nhập thông tin nhóm mới.</DialogContentText>
          {/* Xóa input cho ID Nhóm */}
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