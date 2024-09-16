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
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";

const ManageStudentAccounts = () => {
  const [users, setUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [errors, setErrors] = useState({}); // For form validation errors
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "Giảng viên",
  });

  const [searchTerm, setSearchTerm] = useState(""); // Từ khóa tìm kiếm

  //HÀM LỌC USER tìm kiếm
  const filteredUsers = users.filter((user) => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      user.username.toLowerCase().includes(searchTermLower) ||
      user.profile?.teacherId?.toLowerCase().includes(searchTermLower)
    );
  });

  const [newProfile, setNewProfile] = useState({
    teacherId: "",
    name: "",
    phone: "",
    email: "",
    major: "",
    gender: "",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/users/list-teachers"
      ); // Gọi API lấy danh sách user
      setUsers(response.data.users); // Lưu danh sách user vào state
    } catch (error) {
      console.error("Lỗi không tải được danh sách giảng viên:", error);
    }
  };

  //HÀM XÓA USER
  const handleDelete = async (userId) => {
    const isConfirmed = window.confirm(
      "Bạn có chắc chắn muốn xóa tài khoản này không?"
    );
    if (!isConfirmed) return;

    try {
      await axios.delete(
        `http://localhost:5000/api/users/delete-teacher/${userId}`
      ); // Gọi API xóa user
      fetchUsers(); // Tải lại danh sách user
    } catch (error) {
      console.error("Lỗi không xóa được giảng viên:", error);
    }
  };

  const handleEdit = (user) => {
    setEditUser(user); // Chọn user để chỉnh sửa
  };

  //HÀM CẬP NHẬT USER
  const handleUpdate = async () => {
    const isConfirmed = window.confirm(
      "Bạn có chắc chắn muốn cập nhật tài khoản này không?"
    );
    if (!isConfirmed) return;

    try {
      await axios.put(`http://localhost:5000/api/users/${editUser._id}`, {
        username: editUser.username,
        password: editUser.password,
      }); // Gọi API cập nhật user
      setEditUser(null); // Hủy chỉnh sửa
      fetchUsers(); // Tải lại danh sách user
    } catch (error) {
      console.error("Lỗi không cập nhật được giảng viên:", error);
    }
  };
  // Điều kiện các thường phải nhập
  const validateForm = () => {
    const newErrors = {};
    if (!newUser.username) newErrors.username = "Tên đăng nhập là bắt buộc.";
    if (!newUser.password) newErrors.password = "Mật khẩu là bắt buộc.";
    if (!newUser.role) newErrors.role = "Vai trò là bắt buộc.";
    if (!newProfile.teacherId)
      newErrors.teacherId = "Mã giảng viên là bắt buộc.";
    if (!newProfile.name) newErrors.name = "Họ và tên là bắt buộc.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  //HÀM TẠO TÀI KHOẢN
  const handleCreateUser = async () => {
    if (!validateForm()) return; // Không tiếp tục tiến trình nếu valid thất bại
    const isConfirmed = window.confirm(
      "Bạn có chắc chắn muốn tạo tài khoản này không?"
    );
    if (!isConfirmed) return;

    try {
      const response = await axios.post(
        "http://localhost:5000/api/auth/register",
        {
          username: newUser.username,
          password: newUser.password,
          role: newUser.role,
          profile: {
            teacherId: newProfile.teacherId,
            name: newProfile.name,
            phone: newProfile.phone,
            email: newProfile.email,
            class: newProfile.class,
            major: newProfile.major,
            gender: newProfile.gender,
          },
        }
      );

      if (response.data.success) {
        alert("Tạo tài khoản thành công!");
        setOpenCreateDialog(false);
        setNewUser({ username: "", password: "", role: "" });
        setNewProfile({
          teacherId: "",
          name: "",
          phone: "",
          email: "",
          major: "",
          gender: "",
        });
        fetchUsers(); // Tải lại danh sách user
      } else {
        alert(`Lỗi: ${response.data.message}`); // Hiển thị thông báo lỗi từ server
      }
    } catch (error) {
      // Kiểm tra phản hồi lỗi và hiển thị chi tiết lỗi
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        alert(`Lỗi: ${error.response.data.message}`);
      } else {
        alert("Có lỗi xảy ra trong quá trình tạo tài khoản.");
      }
    }
  };

  //XÁC NHẬN HỦY CHỈNH SỬA
  const handleCancelEdit = () => {
    const isConfirmed = window.confirm(
      "Bạn có chắc chắn muốn hủy chỉnh sửa không?"
    );
    if (isConfirmed) setEditUser(null); // Hủy chỉnh sửa
  };

  //XÁC NHẬN HỦY TẠO TÀI KHOẢN
  const handleCloseCreateDialog = () => {
    const isConfirmed = window.confirm(
      "Bạn có chắc chắn muốn hủy tạo tài khoản không?"
    );
    if (isConfirmed) setOpenCreateDialog(false); // Đóng dialog tạo tài khoản
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Quản lý tài khoản sinh viên
      </Typography>

      {/* Nút Tạo tài khoản */}
      <Button
        variant="contained"
        color="primary"
        onClick={() => setOpenCreateDialog(true)}
        style={{ marginBottom: "20px" }}
      >
        Tạo tài khoản
      </Button>
      {/* Tìm kiếm tài khoản */}
      <TextField
        label="Tìm kiếm theo Tên đăng nhập hoặc Mã sinh viên"
        variant="outlined"
        fullWidth
        margin="normal"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)} // Cập nhật từ khóa tìm kiếm
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {/* Form tạo tài khoản mới */}
      <Dialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
      >
        <DialogTitle>Tạo tài khoản mới</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Vui lòng nhập thông tin người dùng mới.
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            label="Tên đăng nhập"
            type="text"
            fullWidth
            value={newUser.username}
            onChange={(e) =>
              setNewUser({ ...newUser, username: e.target.value })
            }
            error={!!errors.username} //dùng để kiểm tra đã nhập trường này chưa
            helperText={errors.username} //thông báo lỗi
          />
          <TextField
            margin="dense"
            label="Mật khẩu"
            type="password"
            fullWidth
            value={newUser.password}
            onChange={(e) =>
              setNewUser({ ...newUser, password: e.target.value })
            }
            error={!!errors.password}
            helperText={errors.password}
          />
          {/* Role Field - Dropdown  tạo lựa chọn vai trò*/}
          <TextField
            margin="dense"
            label="Vai trò"
            type="text"
            fullWidth
            value={newUser.role}
            onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
            error={!!errors.role}
            helperText={errors.role}
          />
          {/* Thêm các trường của profile */}
          <TextField
            margin="dense"
            label="Mã sinh viên"
            type="text"
            fullWidth
            value={newProfile.teacherId}
            onChange={(e) =>
              setNewProfile({ ...newProfile, teacherId: e.target.value })
            }
            error={!!errors.teacherId}
            helperText={errors.teacherId}
          />
          <TextField
            margin="dense"
            label="Họ và tên"
            type="text"
            fullWidth
            value={newProfile.name}
            onChange={(e) =>
              setNewProfile({ ...newProfile, name: e.target.value })
            }
            error={!!errors.name}
            helperText={errors.name}
          />
          <TextField
            margin="dense"
            label="Số điện thoại"
            type="text"
            fullWidth
            value={newProfile.phone}
            onChange={(e) =>
              setNewProfile({ ...newProfile, phone: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            value={newProfile.email}
            onChange={(e) =>
              setNewProfile({ ...newProfile, email: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Lớp"
            type="text"
            fullWidth
            value={newProfile.class}
            onChange={(e) =>
              setNewProfile({ ...newProfile, class: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Ngành học"
            type="text"
            fullWidth
            value={newProfile.major}
            onChange={(e) =>
              setNewProfile({ ...newProfile, major: e.target.value })
            }
          />
          <TextField
            margin="dense"
            label="Giới tính"
            type="text"
            fullWidth
            value={newProfile.gender}
            onChange={(e) =>
              setNewProfile({ ...newProfile, gender: e.target.value })
            }
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog} color="secondary">
            Hủy
          </Button>
          <Button onClick={handleCreateUser} color="primary">
            Tạo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bảng quản lý tài khoản */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Tên đăng nhập</TableCell>
              <TableCell>Mật khẩu</TableCell>
              <TableCell>Vai trò</TableCell>
              <TableCell>Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user._id}>
                <TableCell>
                  {editUser && editUser._id === user._id ? (
                    <TextField
                      value={editUser.username}
                      onChange={(e) =>
                        setEditUser({ ...editUser, username: e.target.value })
                      }
                    />
                  ) : (
                    user.username
                  )}
                </TableCell>

                <TableCell>
                  {editUser && editUser._id === user._id ? (
                    <TextField
                      value={editUser.password}
                      onChange={(e) =>
                        setEditUser({ ...editUser, password: e.target.value })
                      }
                    />
                  ) : (
                    user.password
                  )}
                </TableCell>

                <TableCell>{user.role}</TableCell>
                <TableCell>
                  {editUser && editUser._id === user._id ? (
                    <>
                      <Button onClick={handleUpdate} color="primary">
                        Cập nhật
                      </Button>
                      <Button onClick={handleCancelEdit} color="secondary">
                        Hủy
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button onClick={() => handleEdit(user)} color="primary">
                        Sửa
                      </Button>
                      <Button
                        onClick={() => handleDelete(user._id)}
                        color="secondary"
                      >
                        Xóa
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};

export default ManageStudentAccounts;
