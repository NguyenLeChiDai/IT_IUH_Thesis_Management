import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Container,
  Typography,
  Paper,
  Box,
  Stack,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import "../../css/ScoreStudent.css";
import { apiUrl } from "../../contexts/constants";

function ScoreStudent() {
  const [studentData, setStudentData] = useState(null);
  const [scores, setScores] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");

  useEffect(() => {
    fetchCurrentStudent();
  }, []);

  const fetchCurrentStudent = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }

      const studentResponse = await axios.get(
        `${apiUrl}/student/profile-student`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (studentResponse.data.success) {
        setStudentData(studentResponse.data.profile);
        await fetchStudentScores(studentResponse.data.profile.studentId);
      } else {
        throw new Error("Không thể lấy thông tin sinh viên");
      }
    } catch (error) {
      console.error("Lỗi khi lấy thông tin sinh viên:", error);
      setError(error.message || "Đã xảy ra lỗi khi lấy thông tin sinh viên");
      setSnackbarMessage(
        error.message || "Đã xảy ra lỗi khi lấy thông tin sinh viên"
      );
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentScores = async (studentId) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Không tìm thấy token. Vui lòng đăng nhập lại.");
      }

      const response = await axios.get(
        `${apiUrl}/scores/get-student-score/${studentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const scoreData = response.data.data.scores;
        setScores({
          instructorScore: scoreData.instructorScore,
          reviewerScore: scoreData.reviewerScore,
          councilScore: scoreData.councilScore,
          posterScore: scoreData.posterScore,
          totalScore: scoreData.totalScore,
        });
      } else {
        throw new Error(
          response.data.message || "Không thể tải thông tin điểm"
        );
      }
    } catch (error) {
      console.error("Lỗi khi tải thông tin điểm:", error);

      // Kiểm tra nếu là lỗi điểm chưa công bố
      if (
        error.response?.status === 403 &&
        error.response?.data?.code === "SCORES_NOT_PUBLISHED"
      ) {
        setError("Điểm chưa được công bố");
        setSnackbarMessage("Điểm chưa được công bố");
        setSnackbarSeverity("info"); // Đổi severity thành info thay vì error
      } else {
        setError(error.message || "Đã xảy ra lỗi khi tải thông tin điểm");
        setSnackbarMessage(
          error.message || "Đã xảy ra lỗi khi tải thông tin điểm"
        );
        setSnackbarSeverity("error");
      }
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
        <Typography variant="h6" style={{ marginLeft: "20px" }}>
          Đang tải thông tin điểm...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ padding: "20px", marginTop: "20px" }}>
          <Typography variant="h6" color="error" align="center">
            {error}
          </Typography>
        </Paper>
      </Container>
    );
  }

  if (!studentData) {
    return (
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ padding: "20px", marginTop: "20px" }}>
          <Typography variant="h6" align="center">
            Không tìm thấy thông tin sinh viên. Vui lòng thử lại sau.
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ padding: "20px", marginTop: "20px" }}>
        <Typography variant="h4" gutterBottom align="center">
          Thông tin sinh viên và bảng điểm
        </Typography>
        <Stack
          spacing={2}
          sx={{
            backgroundColor: "#f3f4f6",
            padding: "1rem",
            borderRadius: "0.5rem",
            marginBottom: "20px",
          }}
        >
          <Typography>
            <strong>Mã sinh viên:</strong> {studentData.studentId}
          </Typography>
          <Typography>
            <strong>Tên sinh viên:</strong> {studentData.name}
          </Typography>
          <Typography>
            <strong>Lớp:</strong> {studentData.class}
          </Typography>
          <Typography>
            <strong>Chuyên ngành:</strong> {studentData.major}
          </Typography>
          <Typography>
            <strong>Nhóm:</strong> {studentData.groupName}
          </Typography>
        </Stack>

        <Box className="current-scores">
          <Typography variant="h5" gutterBottom align="center">
            Bảng điểm
          </Typography>
          <div className="score-container">
            <div className="score-item">
              <Paper elevation={2}>
                <Typography variant="subtitle1">Điểm Hướng Dẫn</Typography>
                <Typography variant="h6">
                  {scores?.instructorScore ?? "Chưa có"}
                </Typography>
              </Paper>
            </div>
            <div className="score-item">
              <Paper elevation={2}>
                <Typography variant="subtitle1">Điểm Phản Biện</Typography>
                <Typography variant="h6">
                  {scores?.reviewerScore ?? "Chưa có"}
                </Typography>
              </Paper>
            </div>
            <div className="score-item">
              <Paper elevation={2}>
                <Typography variant="subtitle1">
                  {scores?.councilScore != null
                    ? "Điểm Hội Đồng"
                    : "Điểm Poster"}
                </Typography>
                <Typography variant="h6">
                  {scores?.councilScore ?? scores?.posterScore ?? "Chưa có"}
                </Typography>
              </Paper>
            </div>
            <div className="score-item">
              <Paper elevation={2} sx={{ backgroundColor: "#e3f2fd" }}>
                <Typography variant="subtitle1">Điểm Tổng Kết</Typography>
                <Typography variant="h6" color="primary">
                  {scores?.totalScore ?? "Chưa có"}
                </Typography>
              </Paper>
            </div>
          </div>
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

export default ScoreStudent;
