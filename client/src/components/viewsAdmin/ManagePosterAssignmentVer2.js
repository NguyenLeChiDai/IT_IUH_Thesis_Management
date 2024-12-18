import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Box,
} from "@mui/material";
import { apiUrl } from "../../contexts/constants";

const ManagePosterAssignmentVer2 = () => {
  const [posterAssignments, setPosterAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPosterAssignments = async () => {
      try {
        const response = await axios.get(
          `${apiUrl}/posterAssignment/get-all-poster-assignments`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        setPosterAssignments(response.data.posterAssignments || []);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Lỗi không xác định");
        setLoading(false);
      }
    };

    fetchPosterAssignments();
  }, []);

  const renderTeachers = (teachers) => {
    // Kiểm tra nếu teachers là null hoặc undefined
    if (!teachers || !Array.isArray(teachers)) return null;
    return teachers.map((teacher) => (
      <Typography key={teacher._id} variant="body2">
        {teacher.name} - {teacher.email}
      </Typography>
    ));
  };

  const renderGroups = (groups) => {
    // Kiểm tra nếu groups là null hoặc undefined
    if (!groups || !Array.isArray(groups)) return null;
    return groups.map((group) => (
      <Typography key={group._id} variant="body2">
        {group.groupName || group.groupCode}
      </Typography>
    ));
  };

  if (loading) return <Typography>Đang tải...</Typography>;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Card>
      <CardHeader
        title="Quản Lý Phân Công Hội Đồng Poster"
        // Sử dụng optional chaining để tránh lỗi nếu posterAssignments là null
        subheader={`Tổng số: ${posterAssignments?.length || 0} phân công`}
      />
      <CardContent>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Hội Đồng</TableCell>
                <TableCell>Giảng Viên</TableCell>
                <TableCell>Nhóm Sinh Viên</TableCell>
                <TableCell>Số Lượng Nhóm</TableCell>
                <TableCell>Ngày Phân Công</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {posterAssignments.map((assignment, index) => (
                <TableRow key={assignment._id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    <Box>{renderTeachers(assignment.PosterTeacher)}</Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      {assignment.studentGroup &&
                      assignment.studentGroup.length > 0 ? (
                        renderGroups(assignment.studentGroup)
                      ) : (
                        <Typography variant="body2">
                          Chưa phân công nhóm
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{assignment.studentGroup?.length || 0}</TableCell>
                  <TableCell>
                    {new Date(assignment.assignedDate).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default ManagePosterAssignmentVer2;
