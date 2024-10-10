import React, { useState, useEffect } from "react";
import { Table, Form, Button } from "react-bootstrap";
import { Search } from "lucide-react";
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

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/topics/approved-topics-student",
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

  useEffect(() => {
    const fetchGroupInfo = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/studentGroups/get-group-id",
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (response.data.success) {
          setGroupId(response.data.groupId);
          const topicResponse = await axios.get(
            `http://localhost:5000/api/topics/${response.data.groupId}/topics`,
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

  const handleRegister = async (topicId, topicName) => {
    if (!groupId) {
      Swal.fire(
        "Không thể đăng ký",
        "Bạn cần tham gia nhóm trước khi đăng ký đề tài.",
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
          "http://localhost:5000/api/topics/register-topic",
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

          const updatedTopics = await axios.get(
            "http://localhost:5000/api/topics/approved-topics-student",
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
        <thead>
          <tr>
            <th>STT</th>
            <th>Tên đề tài</th>
            <th>Giảng viên HD</th>
            <th>SL nhóm đã DK</th>
            <th>Hành động</th>
          </tr>
        </thead>
        <tbody>
          {filteredTopics
            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
            .map((topic, index) => (
              <tr key={topic._id} onClick={() => handleRowClick(topic)}>
                <td>{index + 1 + page * rowsPerPage}</td>
                <td className="topic-name">{topic.nameTopic}</td>
                <td>{topic.teacher ? topic.teacher.name : "N/A"}</td>
                <td>{topic.registeredGroupsCount || 0}</td>
                <td>
                  <Button
                    variant={
                      registeredTopicId === topic._id ? "danger" : "primary"
                    }
                    size="sm"
                    className="custom-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRegister(topic._id, topic.nameTopic);
                    }}
                    disabled={registeredTopicId !== null}
                  >
                    {registeredTopicId === topic._id ? "Đã đăng ký" : "Đăng ký"}
                  </Button>
                </td>
              </tr>
            ))}
        </tbody>
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
                <Typography variant="body1">
                  <strong>Số lượng nhóm đã đăng ký:</strong>{" "}
                  {selectedTopic.registeredGroupsCount || 0}
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
