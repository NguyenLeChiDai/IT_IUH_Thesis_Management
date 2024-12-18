import React, { useState, useEffect } from "react";
import { Table, Form, Button } from "react-bootstrap";
import { Search, ArrowUp, ArrowDown } from "lucide-react";
import {
  InputAdornment,
  TextField,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Divider,
} from "@mui/material";
import axios from "axios";
import Swal from "sweetalert2";
import "../../css/ListStudentTopics.css";
import {
  apiUrl,
  LOCAL_STORAGE_TOKEN_NAME,
  socketUrl,
} from "../../contexts/constants";
import { io } from "socket.io-client";

export const ListStudentTopics = () => {
  const [topics, setTopics] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [groupId, setGroupId] = useState(null);
  const [registeredTopicId, setRegisteredTopicId] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const MAX_GROUPS_PER_TOPIC = 2; // Thêm hằng số cho số nhóm tối đa
  const [isGroupLeader, setIsGroupLeader] = useState(false);
  const [socket, setSocket] = useState(null);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [groupCountSortDirection, setGroupCountSortDirection] = useState("asc");

  // Kết nối socket
  useEffect(() => {
    // Kết nối socket
    const token = localStorage.getItem("token");
    const newSocket = io(`${socketUrl}`, {
      auth: { token: token },
    });

    // Listener cho cập nhật số lượng nhóm đăng ký
    newSocket.on(
      "topicGroupCountUpdate",
      ({ topicId, registeredGroupsCount }) => {
        setTopics((prevTopics) =>
          prevTopics.map((topic) =>
            topic._id === topicId ? { ...topic, registeredGroupsCount } : topic
          )
        );
      }
    );

    // Join room danh sách đề tài đã phê duyệt
    newSocket.emit("joinApprovedTopicsList");

    setSocket(newSocket);

    // Cleanup socket khi component unmount
    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}/topics/approved-topics-student`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setTopics(response.data.topics);
        setLoading(false);
      } catch (err) {
        setError("Failed to fetch topics. Please try again later.");
        setLoading(false);
      }
    };

    fetchTopics();
  }, []);

  //kiểm tra nhóm trưởng
  useEffect(() => {
    const fetchGroupInfo = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}/studentGroups/get-group-id`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (response.data.success) {
          setGroupId(response.data.groupId);

          // Kiểm tra role của người dùng trong nhóm
          const checkGroupLeaderResponse = await axios.get(
            `${apiUrl}/topics/check-group-leader`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          if (checkGroupLeaderResponse.data.success) {
            setIsGroupLeader(checkGroupLeaderResponse.data.isGroupLeader);
          }
          //ẩn các trường sau khi đk đề tài
          const topicResponse = await axios.get(
            `${apiUrl}/topics/${response.data.groupId}/topics`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          if (
            topicResponse.data.success &&
            topicResponse.data.topics.length > 0
          ) {
            setRegisteredTopicId(topicResponse.data.topics[0].topicId);
          }
        }
      } catch (error) {
        console.error("Error fetching group info:", error);
      }
    };

    fetchGroupInfo();
  }, []);

  const filteredTopics = topics.filter(
    (topic) =>
      topic.nameTopic.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (topic.teacher &&
        topic.teacher.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Thêm hàm kiểm tra xem đề tài có thể đăng ký không
  const canRegisterTopic = (topic) => {
    return (
      !registeredTopicId && // Chưa đăng ký đề tài nào
      groupId && // Đã có nhóm
      (topic.registeredGroupsCount || 0) < MAX_GROUPS_PER_TOPIC // Số nhóm đăng ký chưa đạt tối đa
    );
  };

  const handleRegister = async (topicId, topicName) => {
    if (!groupId) {
      Swal.fire(
        "Không thể đăng ký",
        "Bạn cần tham gia nhóm trước khi đăng ký đề tài.",
        "warning"
      );
      return;
    }
    if (!isGroupLeader) {
      Swal.fire(
        "Không thể đăng ký",
        "Chỉ nhóm trưởng mới có quyền đăng ký đề tài.",
        "warning"
      );
      return;
    }

    if (registeredTopicId) {
      Swal.fire(
        "Không thể đăng ký",
        "Nhóm của bạn đã đăng ký một đề tài. Không thể đăng ký thêm.",
        "warning"
      );
      return;
    }

    // Kiểm tra số lượng nhóm đăng ký
    const topic = topics.find((t) => t._id === topicId);
    if (topic && topic.registeredGroupsCount >= MAX_GROUPS_PER_TOPIC) {
      Swal.fire(
        "Không thể đăng ký",
        "Đề tài này đã đạt số lượng nhóm đăng ký tối đa.",
        "warning"
      );
      return;
    }

    try {
      const result = await Swal.fire({
        title: "Xác nhận đăng ký",
        text: `Bạn có chắc chắn muốn đăng ký đề tài "${topicName}"?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Đồng ý",
        cancelButtonText: "Hủy",
      });

      if (result.isConfirmed) {
        const response = await axios.post(
          `${apiUrl}/topics/register-topic`,
          {
            groupId: groupId,
            topicId: topicId,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (response.data.success) {
          Swal.fire(
            "Đăng ký thành công!",
            "Bạn đã đăng ký đề tài thành công.",
            "success"
          );

          setRegisteredTopicId(topicId);

          // Loại bỏ việc fetch lại danh sách topics
          // Socket sẽ tự động cập nhật
          const updatedTopics = await axios.get(
            `${apiUrl}/topics/approved-topics-student`,
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );
          setTopics(updatedTopics.data.topics);
        }
      }
    } catch (error) {
      Swal.fire(
        "Đăng ký thất bại",
        `Lỗi: ${error.response?.data?.message || "Đã có lỗi xảy ra"}`,
        "error"
      );
    }
  };

  const handleRowClick = (topic) => {
    setSelectedTopic(topic);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Thêm hàm để hiển thị trạng thái nút đăng ký
  const getRegisterButtonProps = (topic) => {
    if (registeredTopicId === topic._id) {
      return {
        variant: "danger",
        disabled: true,
        text: "Đã đăng ký",
      };
    } else if (topic.registeredGroupsCount >= MAX_GROUPS_PER_TOPIC) {
      return {
        variant: "secondary",
        disabled: true,
        text: "Đã đủ nhóm",
      };
    } else if (registeredTopicId) {
      return {
        variant: "secondary",
        disabled: true,
        text: "Đăng ký",
      };
    } else {
      return {
        variant: "primary",
        disabled: false,
        text: "Đăng ký",
      };
    }
  };

  // Hàm xử lý sắp xếp
  const handleSort = (column) => {
    const isAsc = sortColumn === column && sortDirection === "asc";
    setSortColumn(column);
    setSortDirection(isAsc ? "desc" : "asc");

    const sortedTopics = [...filteredTopics].sort((a, b) => {
      if (column === "nameTopic") {
        return isAsc
          ? a.nameTopic.localeCompare(b.nameTopic)
          : b.nameTopic.localeCompare(a.nameTopic);
      }
      if (column === "teacher") {
        const teacherA = a.teacher?.name || "";
        const teacherB = b.teacher?.name || "";
        return isAsc
          ? teacherA.localeCompare(teacherB)
          : teacherB.localeCompare(teacherA);
      }
      return 0;
    });

    setTopics(sortedTopics);
  };

  // New sorting function for group count
  const handleGroupCountSort = () => {
    const sortedTopics = [...filteredTopics].sort((a, b) => {
      const countA = a.registeredGroupsCount || 0;
      const countB = b.registeredGroupsCount || 0;
      return groupCountSortDirection === "asc"
        ? countA - countB
        : countB - countA;
    });

    setTopics(sortedTopics);
    setGroupCountSortDirection(
      groupCountSortDirection === "asc" ? "desc" : "asc"
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="student-topics-list">
      <h2 className="mb-4 text-center">Danh sách đề tài khóa luận</h2>

      <Form className="mb-4">
        <div className="search-container">
          <TextField
            label="Tìm kiếm theo đề tài hoặc tên giảng viên"
            variant="outlined"
            fullWidth
            margin="normal"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            className="search-input"
          />
        </div>
      </Form>

      <Table striped bordered hover className="custom-table">
        <thead style={{ backgroundColor: "#e6f3e6" }}>
          <tr>
            <th>STT</th>
            <th
              onClick={() => handleSort("nameTopic")}
              style={{ cursor: "pointer" }}
            >
              Tên đề tài
              <span style={{ marginLeft: "5px", opacity: 0.5 }}>
                {sortColumn === "nameTopic" ? (
                  sortDirection === "asc" ? (
                    <ArrowUp size={16} />
                  ) : (
                    <ArrowDown size={16} />
                  )
                ) : (
                  <ArrowUp size={16} style={{ opacity: 0.3 }} />
                )}
              </span>
            </th>
            <th
              onClick={() => handleSort("teacher")}
              style={{ cursor: "pointer" }}
            >
              Giảng viên HD
              <span style={{ marginLeft: "5px", opacity: 0.5 }}>
                {sortColumn === "teacher" ? (
                  sortDirection === "asc" ? (
                    <ArrowUp size={16} />
                  ) : (
                    <ArrowDown size={16} />
                  )
                ) : (
                  <ArrowUp size={16} style={{ opacity: 0.3 }} />
                )}
              </span>
            </th>
            <th
              onClick={handleGroupCountSort}
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              SL nhóm đã DK
              <span style={{ marginLeft: "5px", opacity: 0.5 }}>
                {groupCountSortDirection === "asc" ? (
                  <ArrowUp size={16} />
                ) : (
                  <ArrowDown size={16} />
                )}
              </span>
            </th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredTopics
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((topic, index) => {
              const buttonProps = getRegisterButtonProps(topic);
              return (
                <tr key={topic._id} onClick={() => handleRowClick(topic)}>
                  <td>{index + 1 + page * rowsPerPage}</td>
                  <td className="topic-name">{topic.nameTopic}</td>
                  <td>{topic.teacher ? topic.teacher.name : "N/A"}</td>
                  <td>{topic.registeredGroupsCount || 0}/2</td>
                  <td>
                    <Button
                      variant={buttonProps.variant}
                      size="sm"
                      className="custom-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRegister(topic._id, topic.nameTopic);
                      }}
                      disabled={buttonProps.disabled}
                    >
                      {buttonProps.text}
                    </Button>
                  </td>
                </tr>
              );
            })}
        </tbody>
      </Table>

      {/* nếu ko có đề tài nào thì thông báo ra cho ng dùng biết */}
      {filteredTopics.length > 0 ? (
        <>
          <Table striped bordered hover className="custom-table">
            {/* Existing table code */}
          </Table>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredTopics.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </>
      ) : (
        <div className="no-topics-message text-center mt-4">
          <Typography variant="h6" color="textSecondary">
            Hiện tại không có đề tài nào được công bố.
          </Typography>
        </div>
      )}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h4" component="div" gutterBottom>
            Chi tiết đề tài
          </Typography>
        </DialogTitle>
        <DialogContent>
          {selectedTopic && (
            <Box>
              <Typography
                variant="h5"
                gutterBottom
                className="topic-detail-title"
              >
                {selectedTopic.nameTopic}
              </Typography>
              <Divider className="topic-detail-divider" />
              <Box className="topic-detail-content">
                <Typography variant="body1" paragraph>
                  <strong>Giảng viên hướng dẫn:</strong>{" "}
                  {selectedTopic.teacher ? selectedTopic.teacher.name : "N/A"}
                </Typography>
                <Typography variant="body1" paragraph>
                  <strong>Mô tả:</strong>{" "}
                  {selectedTopic.descriptionTopic || "Không có mô tả"}
                </Typography>
                <Typography variant="body1" paragraph>
                  <strong>Số lượng nhóm đã đăng ký:</strong>{" "}
                  {selectedTopic.registeredGroupsCount || 0}
                  {selectedTopic.registeredGroupsCount >=
                    MAX_GROUPS_PER_TOPIC && (
                    <span className="text-danger">
                      {" "}
                      (Đã đạt số lượng tối đa)
                    </span>
                  )}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCloseDialog}
            variant="contained"
            color="primary"
          >
            Đóng
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
