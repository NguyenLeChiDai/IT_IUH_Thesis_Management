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
  Collapse,
  useMediaQuery,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import GroupIcon from "@mui/icons-material/Group";
import AssignmentIcon from "@mui/icons-material/Assignment";
import GradeIcon from "@mui/icons-material/Grade";
import ScoreIcon from "@mui/icons-material/Score";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import TeacherInfo from "../components/teacher/TeacherInfo";
import UserMenu from "../components/user/UserMenu";
import { Outlet, useNavigate, useLocation } from "react-router-dom";

import "../css/DashboardTeacher.css";

const drawerWidth = 240;

const DashboardTeacher = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openQuảnLýĐềTài, setOpenQuảnLýĐềTài] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // Hook để lấy đường dẫn hiện tại
  const isMobile = useMediaQuery("(max-width:600px)"); // Xác định nếu là màn hình nhỏ

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleQuảnLýĐềTài = () => {
    setOpenQuảnLýĐềTài(!openQuảnLýĐềTài);
  };

  const menuItems = [
    {
      text: "Trang chủ",
      icon: <HomeIcon />,
      onClick: () => navigate("/dashboardTeacher"),
    },
    { text: "Báo cáo", icon: <GroupIcon /> },
    {
      text: "Đề Tài",
      icon: <AssignmentIcon />,
      onClick: toggleQuảnLýĐềTài,
      submenu: [
        {
          text: "Quản Lý Đề Tài",
          icon: <CloudUploadIcon />,
          onClick: () => navigate("/dashboardTeacher/upload-topic"),
        },
      ],
    },
    { text: "Quản Lý Sinh Viên", icon: <GradeIcon /> },
    { text: "Chấm Điểm", icon: <ScoreIcon /> },
  ];

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width:
            sidebarOpen && !isMobile ? `calc(100% - ${drawerWidth}px)` : "100%",
          ml: sidebarOpen && !isMobile ? `${drawerWidth}px` : 0,
          height: "70px", // Giảm chiều cao của AppBar
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
          <Typography
            variant="h5"
            noWrap
            component="div"
            className="dashboard-title"
          >
            Dashboard Giảng viên
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Box
            sx={{ display: "flex", alignItems: "center", marginBottom: "10px" }}
          >
            <UserMenu />
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="persistent"
        anchor="left"
        open={sidebarOpen}
        sx={{
          width: "150px",
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        <List>
          {menuItems.map((item, index) => (
            <div key={index}>
              <ListItem button onClick={item.onClick || null}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
                {item.submenu ? (
                  openQuảnLýĐềTài ? (
                    <ExpandLess />
                  ) : (
                    <ExpandMore />
                  )
                ) : null}
              </ListItem>
              {item.submenu && (
                <Collapse in={openQuảnLýĐềTài} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.submenu.map((subItem, subIndex) => (
                      <ListItem
                        button
                        key={subIndex}
                        onClick={subItem.onClick}
                        sx={{ pl: 4 }}
                      >
                        <ListItemIcon>{subItem.icon}</ListItemIcon>
                        <ListItemText primary={subItem.text} />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}
            </div>
          ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width:
            sidebarOpen && !isMobile ? `calc(100% - ${drawerWidth}px)` : "100%",
          ml: sidebarOpen && !isMobile ? `${drawerWidth}px` : 0,
          transition: "width 0.3s",
        }}
      >
        <Toolbar />
        <Box className="main-content">
          {location.pathname === "/dashboardTeacher" && (
            <>
              <Typography variant="h5" className="teacher-info-title">
                Thông tin giảng viên
              </Typography>
              <TeacherInfo />
            </>
          )}
          <Outlet /> {/* Nội dung của route con sẽ hiển thị ở đây */}
        </Box>
      </Box>
    </Box>
  );
};

export default DashboardTeacher;
