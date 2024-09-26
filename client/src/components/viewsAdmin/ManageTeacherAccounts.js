import React, { useEffect, useState, useRef } from "react";
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
  Select,
  MenuItem,
  TablePagination,
  Input,
  CircularProgress,
} from "@mui/material";
import { InputAdornment } from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import "../../css/ManageAccounts.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import * as XLSX from "xlsx"; // import file excel

const ManageTeacherAccounts = () => {
  const [users, setUsers] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [errors, setErrors] = useState({}); // For form validation errors
  const [newUser, setNewUser] = useState({
    username: "",
    password: "12345678",
    role: "Giảng viên",
  });

  const fileInputRef = useRef(null); // trạng thái lại ban đầu sau khi gửi file đi

  const [isLoading, setIsLoading] = useState(false); // trạng thái tải khi upload file

  const [searchTerm, setSearchTerm] = useState(""); // Từ khóa tìm kiếm

  // Thêm state cho phân trang
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Hàm xử lý thay đổi trang
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  // Hàm xử lý thay đổi số hàng trên mỗi trang
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

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
    const user = users.find((user) => user._id === userId); // Tìm user theo ID

    // Gọi hàm xác nhận xóa
    const isConfirmed = await confirmDelete(user);
    if (!isConfirmed) return; // Nếu không xác nhận, thoát khỏi hàm

    try {
      await axios.delete(
        `http://localhost:5000/api/users/delete-teacher/${userId}`
      );

      toast.success(`Tài khoản giảng viên "${user.username}" đã bị xóa!`, {
        position: "top-right",
        autoClose: 2500,
      });

      fetchUsers(); // Tải lại danh sách user
    } catch (error) {
      toast.error("Lỗi khi xóa tài khoản giảng viên.", {
        position: "top-right",
        autoClose: 2500,
      });
      console.error("Lỗi khi xóa tài khoản giảng viên:", error);
    }
  };

  // Hàm xác nhận xóa
  const confirmDelete = async (user) => {
    const result = await Swal.fire({
      title: "Xác Nhận Xóa!",
      text: `Bạn có chắc chắn muốn xóa tài khoản "${user.username}" này không?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Có, xóa nó!",
      cancelButtonText: "Không",
    });

    return result.isConfirmed; // Trả về kết quả xác nhận
  };

  //Hàm chọn user để chỉnh sửa
  const handleEdit = (user) => {
    setEditUser(user); // Chọn user để chỉnh sửa
  };

  //HÀM CẬP NHẬT USER
  const handleUpdate = async () => {
    // Gọi hàm xác nhận cập nhật
    const isConfirmed = await confirmUpdate(editUser);
    if (!isConfirmed) return; // Nếu không xác nhận, thoát khỏi hàm

    try {
      await axios.put(`http://localhost:5000/api/users/${editUser._id}`, {
        username: editUser.username,
        password: editUser.password,
      }); // Gọi API cập nhật user

      toast.success(`Tài khoản "${editUser.username}" đã được cập nhật!`, {
        position: "top-right",
        autoClose: 2500,
      });
      setEditUser(null); // Hủy chỉnh sửa
      fetchUsers(); // Tải lại danh sách user
    } catch (error) {
      console.error("Lỗi không cập nhật được sinh viên:", error);
    }
  };

  // Hàm xác nhận cập nhật
  const confirmUpdate = async (user) => {
    const result = await Swal.fire({
      title: "Xác Nhận Cập Nhật!",
      text: `Bạn có chắc chắn muốn cập nhật tài khoản "${user.username}" này không?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Có, cập nhật!",
      cancelButtonText: "Không",
    });

    return result.isConfirmed; // Trả về kết quả xác nhận
  };

  // XÁC NHẬN HỦY CHỈNH SỬA
  const handleCancelEdit = async () => {
    const result = await Swal.fire({
      title: "Xác Nhận Hủy",
      text: `Bạn có chắc chắn muốn hủy cập nhật tài khoản?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Có, Hủy Cập Nhật!",
      cancelButtonText: "Không",
    });

    if (result.isConfirmed) {
      setEditUser(null); // Hủy chỉnh sửa và thiết lập lại trạng thái editUser
    }
  };

  //HÀM TẠO TÀI KHOẢN
  const handleCreateUser = async (user) => {
    const isConfirmed = await Swal.fire({
      title: "Xác Nhận Tạo Tài Khoản",
      text: `Bạn có chắc chắn muốn tạo tài khoản "${user.username}"  không?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Có, tạo tài khoản!",
      cancelButtonText: "Không",
    });

    if (!isConfirmed.isConfirmed) return;

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
        Swal.fire({
          title: "Thành Công!",
          text: `Đã tạo tài khoản "${newUser.username}" thành công!`,
          icon: "success",
          confirmButtonColor: "#3085d6",
        });
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
        Swal.fire({
          title: "Lỗi!",
          text: `Lỗi: ${response.data.message}`,
          icon: "error",
          confirmButtonColor: "#d33",
        });
      }
    } catch (error) {
      // Kiểm tra phản hồi lỗi và hiển thị chi tiết lỗi
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        Swal.fire({
          title: "Lỗi!",
          text: `Lỗi: ${error.response.data.message}`,
          icon: "error",
          confirmButtonColor: "#d33",
        });
      } else {
        Swal.fire({
          title: "Lỗi!",
          text: "Có lỗi xảy ra trong quá trình tạo tài khoản.",
          icon: "error",
          confirmButtonColor: "#d33",
        });
      }
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

  // XÁC NHẬN HỦY TẠO TÀI KHOẢN
  const handleCloseCreateDialog = async (user) => {
    setOpenCreateDialog(false);
    const isConfirmed = await Swal.fire({
      title: "Xác Nhận Hủy!",
      text: `Bạn có chắc chắn muốn hủy tạo tài khoản "${user.username}"  không?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Có, hủy!",
      cancelButtonText: "Không",
    });

    if (isConfirmed.isConfirmed) setOpenCreateDialog(false); // Đóng dialog tạo tài khoản
  };

  //Xử lý giử file excel
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    setIsLoading(true);

    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const processedData = jsonData.map((row) => ({
        username: String(row.username || ""),
        password: String(row.password || "12345678"),
        studentId: String(row.studentId || ""),
        name: String(row.name || ""),
        phone: String(row.phone || ""),
        email: String(row.email || ""),
        class: String(row.class || ""),
        major: String(row.major || ""),
        gender: String(row.gender || ""),
      }));

      try {
        const response = await axios.post(
          "http://localhost:5000/api/users/bulk-create-teachers",
          { users: processedData },
          {
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        setIsLoading(false);

        let message = `Đã tạo ${response.data.createdCount} tài khoản thành công.`;
        let icon = "success";

        if (
          response.data.duplicateUsernames &&
          response.data.duplicateUsernames.length > 0
        ) {
          message += ` ${
            response.data.duplicateUsernames.length
          } tài khoản bị trùng username: ${response.data.duplicateUsernames.join(
            ", "
          )}`;
          icon = "warning";
        }

        if (response.data.errors && response.data.errors.length > 0) {
          message += ` ${response.data.errors.length} tài khoản gặp lỗi khi tạo.`;
          icon = "warning";
        }

        Swal.fire({
          title: "Kết quả tạo tài khoản",
          text: message,
          icon: icon,
          confirmButtonColor: "#3085d6",
        });

        fetchUsers(); // Tải lại danh sách user
      } catch (error) {
        setIsLoading(false);
        Swal.fire({
          title: "Lỗi!",
          text: "Có lỗi xảy ra trong quá trình tạo tài khoản.",
          icon: "error",
          confirmButtonColor: "#d33",
        });
        console.error("Error details:", error.response?.data);
      }

      // Reset giá trị của input file
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Quản lý tài khoản giảng viên
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

      {/* button cập nhật Excel */}
      <Input
        type="file"
        id="excel-upload"
        style={{ display: "none" }}
        onChange={handleFileUpload}
        accept=".xlsx, .xls"
        ref={fileInputRef}
      />
      <label htmlFor="excel-upload">
        <Button
          variant="contained"
          color="secondary"
          component="span"
          style={{ marginBottom: "20px", marginLeft: "10px" }}
          disabled={isLoading}
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "Tải lên Excel"
          )}
        </Button>
      </label>
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
            label="Mã giảng viên"
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
            label="Ngành dạy"
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
            {filteredUsers
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage) //xử lý chuyển map
              .map((user) => (
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

                  <TableCell className="table-cell">
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
                        <Button
                          onClick={() => handleEdit(user)}
                          color="primary"
                        >
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
      <TablePagination //chuyển trang
        rowsPerPageOptions={[5, 10, 25]} // lựa chọn số dòng trên trang
        component="div"
        count={filteredUsers.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </div>
  );
};

export default ManageTeacherAccounts;
