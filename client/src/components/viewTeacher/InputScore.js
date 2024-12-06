import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Box,
  Stack,
  Snackbar,
  Alert,
  Grid2,
} from "@mui/material";
import "../../css/InputScore.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";
import { apiUrl } from "../../contexts/constants";
function InputScore() {
  const location = useLocation();
  const navigate = useNavigate();
  const [studentData, setStudentData] = useState(null);
  const [currentScores, setCurrentScores] = useState({
    instructorScore: "",
    reviewerScore: "",
    presentationScore: "",
  });
  const [newScores, setNewScores] = useState({
    instructorScore: "",
    reviewerScore: "",
    presentationScore: "",
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  useEffect(() => {
    if (location.state && location.state.studentData) {
      const { studentData } = location.state;
      setStudentData(studentData);
      if (studentData.scores) {
        setCurrentScores({
          instructorScore: studentData.scores.instructorScore || "",
          // reviewerScore: studentData.scores.reviewerScore || "",
          // presentationScore: studentData.scores.presentationScore || "",
        });
      }
    } else {
      console.error("Student data is not found in location state.");
      navigate("/dashboardTeacher/list-student-teacher");
    }
  }, [location, navigate]);

  useEffect(() => {
    if (studentData && studentData.studentId) {
      fetchScores(studentData.studentId);
    }
  }, [studentData]);

  const fetchScores = async (studentId) => {
    try {
      const url = `${apiUrl}/scores/get-scores/${studentId}`;
      const token = localStorage.getItem("token");
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (
        response.data.success &&
        response.data.scores &&
        response.data.scores.length > 0
      ) {
        const fetchedScores = response.data.scores[0];
        setCurrentScores({
          instructorScore: fetchedScores.instructorScore || "",
          // reviewerScore: fetchedScores.reviewerScore || "",
          // presentationScore: fetchedScores.presentationScore || "",
        });
        setSnackbarMessage("Đã cập nhật điểm thành công.");
        setSnackbarSeverity("success");
      } else {
        setSnackbarMessage("Không tìm thấy điểm cho sinh viên này.");
        setSnackbarSeverity("info");
      }
    } catch (error) {
      setSnackbarMessage("Đã xảy ra lỗi khi lấy điểm.");
      setSnackbarSeverity("error");
    } finally {
      setSnackbarOpen(true);
    }
  };

  const handleNewScoreChange = (e) => {
    const { name, value } = e.target;
    setNewScores((prevScores) => ({
      ...prevScores,
      [name]: value,
    }));
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  const validateScores = (scores) => {
    for (const key in scores) {
      if (scores[key] !== "" && isNaN(parseFloat(scores[key]))) {
        setSnackbarMessage(`Vui lòng nhập điểm ${key} hợp lệ.`);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
        return false;
      }
    }
    return true;
  };

  const handleSaveScores = async () => {
    if (!validateScores(newScores)) return;

    const result = await Swal.fire({
      title: "Xác Nhận Nhập Điểm Cho Sinh Viên",
      text: "Bạn có chắc chắn nhập điểm cho sinh viên này không?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Có",
      cancelButtonText: "Không",
    });

    if (result.isConfirmed) {
      const scoreData = {
        studentId: studentData.studentId,
        instructorScore:
          newScores.instructorScore !== ""
            ? parseFloat(newScores.instructorScore)
            : null,
        // reviewerScore:
        //   newScores.reviewerScore !== ""
        //     ? parseFloat(newScores.reviewerScore)
        //     : null,
        // presentationScore:
        //   newScores.presentationScore !== ""
        //     ? parseFloat(newScores.presentationScore)
        //     : null,
      };

      try {
        const token = localStorage.getItem("token");
        const response = await axios.post(
          `${apiUrl}/scores/input-scores`,
          scoreData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data.success) {
          Swal.fire({
            title: "Thành công!",
            text: "Điểm đã được lưu thành công!",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
          });

          setCurrentScores((prevScores) => ({
            ...prevScores,
            ...scoreData,
          }));
          setNewScores({
            instructorScore: "",
            // reviewerScore: "",
            // presentationScore: "",
          });
        } else {
          throw new Error(response.data.message || "Lỗi khi lưu điểm.");
        }
      } catch (error) {
        console.error("Lỗi khi gửi yêu cầu nhập điểm:", error);
        Swal.fire({
          title: "Lỗi!",
          text: "Đã xảy ra lỗi khi lưu điểm.",
          icon: "error",
        });
      }
    }
  };

  if (!studentData) {
    return <Typography>Đang tải dữ liệu sinh viên...</Typography>;
  }

  return (
    <Container maxWidth="md">
      <Paper
        elevation={3}
        sx={{ padding: "5px", marginTop: "5px", maxWidth: "100%" }}
      >
        <Typography variant="h4" gutterBottom align="center">
          Thông tin sinh viên và bảng điểm
        </Typography>
        <Stack
          spacing={2}
          sx={{
            backgroundColor: "#f3f4f6",
            padding: "0.75rem",
            borderRadius: "0.5rem",
            marginBottom: "10px",
          }}
        >
          <Typography>
            <strong>Mã sinh viên:</strong> {studentData.studentId}
          </Typography>
          <Typography>
            <strong>Tên sinh viên:</strong> {studentData.name}
          </Typography>
          <Typography>
            <strong>Email:</strong> {studentData.email || "Chưa cập nhật"}
          </Typography>
          <Typography>
            <strong>Lớp:</strong> {studentData.class || "Chưa cập nhật"}
          </Typography>
          <Typography>
            <strong>Đề tài:</strong> {studentData.topic || "Chưa có đề tài"}
          </Typography>
        </Stack>

        <Box mt={4} className="current-scores">
          <Typography variant="h5" gutterBottom align="center">
            Điểm hiện tại
          </Typography>
          <Grid2
            container
            spacing={2}
            justifyContent="center"
            alignItems="stretch"
          >
            <Grid2 item xs={12} sm={4}>
              <Paper elevation={2} className="score-item">
                <Typography variant="subtitle1">Điểm hướng dẫn</Typography>
                <Typography variant="h6">
                  {currentScores.instructorScore || "Chưa có"}
                </Typography>
              </Paper>
            </Grid2>
            {/* <Grid2 item xs={12} sm={4}>
              <Paper elevation={2} className="score-item">
                <Typography variant="subtitle1">Điểm phản biện</Typography>
                <Typography variant="h6">
                  {currentScores.reviewerScore || "Chưa có"}
                </Typography>
              </Paper>
            </Grid2>
            <Grid2 item xs={12} sm={4}>
              <Paper elevation={2} className="score-item">
                <Typography variant="subtitle1">Điểm báo cáo</Typography>
                <Typography variant="h6">
                  {currentScores.presentationScore || "Chưa có"}
                </Typography>
              </Paper>
            </Grid2> */}
          </Grid2>
        </Box>
        <Box mt={4}>
          <Typography variant="h5" gutterBottom>
            Nhập điểm
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              fullWidth
              label="Điểm hướng dẫn"
              name="instructorScore"
              type="number"
              value={newScores.instructorScore}
              onChange={handleNewScoreChange}
              inputProps={{ min: 0, max: 10, step: 0.1 }}
            />
            {/* <TextField
              fullWidth
              label="Điểm phản biện"
              name="reviewerScore"
              type="number"
              value={newScores.reviewerScore}
              onChange={handleNewScoreChange}
              inputProps={{ min: 0, max: 10, step: 0.1 }}
            />
            <TextField
              fullWidth
              label="Điểm báo cáo"
              name="presentationScore"
              type="number"
              value={newScores.presentationScore}
              onChange={handleNewScoreChange}
              inputProps={{ min: 0, max: 10, step: 0.1 }}
            /> */}
          </Stack>
        </Box>
        <Box mt={2}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveScores}
          >
            Lưu/Cập nhật điểm
          </Button>
        </Box>
      </Paper>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
      >
        <Alert
          onClose={handleSnackbarClose}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default InputScore;
