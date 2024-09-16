import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  CssBaseline,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import GroupIcon from "@mui/icons-material/Group";
import AssignmentIcon from "@mui/icons-material/Assignment";
import GradeIcon from "@mui/icons-material/Grade";
import ScoreIcon from "@mui/icons-material/Score";
import UserMenu from "../components/user/UserMenu";
import "../css/DashboardUser.css";
import StudentInfo from "../components/user/StudentInfo";

const drawerWidth = 240;

const DashboardUser = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const menuItems = [
    { text: "Trang chủ", icon: <HomeIcon /> },
    { text: "Nhóm sinh viên", icon: <GroupIcon /> },
    { text: "Đề tài", icon: <AssignmentIcon /> },
    { text: "Tiêu chí Đánh giá của học kỳ", icon: <GradeIcon /> },
    { text: "Bảng điểm của tôi", icon: <ScoreIcon /> },
  ];

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      {/* AppBar cho header */}
      <AppBar
        position="fixed"
        sx={{
          width: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : "100%",
          ml: sidebarOpen ? `${drawerWidth}px` : 0,
          height: "72px", // Giảm chiều cao của AppBar
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleSidebar}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Dashboard Sinh viên
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Box
            sx={{
              marginTop: "25px",
              height: "10px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <UserMenu />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Ngăn kéo (Drawer) bên trái */}
      <Drawer
        variant="persistent"
        anchor="left"
        open={sidebarOpen}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        <List>
          {menuItems.map((item, index) => (
            <ListItem button key={index}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Drawer>

      {/* Nội dung chính của trang */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: sidebarOpen ? `calc(100% - ${drawerWidth}px)` : "100%",
          transition: "width 0.3s",
        }}
      >
        <Toolbar />
        <Box>
          <Typography variant="h4">Thông tin sinh viên:</Typography>
          <StudentInfo />
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardUser;
