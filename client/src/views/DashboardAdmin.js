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
  useMediaQuery,
  Collapse, // Thêm Collapse từ MUI
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import ExpandLess from "@mui/icons-material/ExpandLess"; // Icon mở rộng
import ExpandMore from "@mui/icons-material/ExpandMore"; // Icon thu gọn
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SchoolIcon from "@mui/icons-material/School";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import UserMenu from "../components/user/UserMenu";
import { Outlet, useNavigate } from "react-router-dom";

const drawerWidth = 240;

const DashboardAdmin = () => {
  const [open, setOpen] = useState(false);
  const [openSubMenu, setOpenSubMenu] = useState({}); // State cho menu con
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)"); // Xác định nếu là màn hình nhỏ

  const toggleDrawer = () => {
    setOpen(!open);
  };

  // Toggle menu con
  const handleToggleSubMenu = (index) => {
    setOpenSubMenu((prevState) => ({
      ...prevState,
      [index]: !prevState[index],
    }));
  };

  const menuItems = [
    {
      text: "Quản lý giảng viên",
      icon: <SchoolIcon />,
      subMenu: [
        {
          text: "Quản lý tài khoản giảng viên",
          icon: <AccountBoxIcon />,
          onClick: () => navigate("/dashboardAdmin/manage-teacher-accounts"),
        },
        {
          text: "Quản lý bằng cấp giảng viên",
          icon: <AccountBoxIcon />,
          onClick: () => navigate("/dashboardAdmin"),
        },
      ],
    },
    {
      text: "Quản lý sinh viên",
      icon: <AccountCircleIcon />,
      subMenu: [
        {
          text: "Quản lý tài khoản sinh viên",
          icon: <AccountBoxIcon />,
          onClick: () => navigate("/dashboardAdmin/manage-student-accounts"),
        },
      ],
    },
  ];

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: open && !isMobile ? `calc(100% - ${drawerWidth}px)` : "100%",
          ml: open && !isMobile ? `${drawerWidth}px` : 0,
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            Trang quản lý dành cho Admin
          </Typography>
          <Box sx={{ flexGrow: 1 }} />
          <Box sx={{ display: "flex", alignItems: "center", marginTop: "1px" }}>
            <UserMenu />
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        anchor="left"
        open={open}
        onClose={toggleDrawer}
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
            <React.Fragment key={index}>
              <ListItem
                button
                onClick={() => handleToggleSubMenu(index)}
                sx={{
                  "&:hover": {
                    backgroundColor: "#BFBFBF", // Màu nền khi hover
                    fontWeight: "bold", // Chữ đậm hơn khi hover
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
                {openSubMenu[index] ? <ExpandLess /> : <ExpandMore />}
              </ListItem>
              {/* Hiển thị các subMenu khi openSubMenu[index] = true */}
              <Collapse in={openSubMenu[index]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.subMenu &&
                    item.subMenu.map((subItem, subIndex) => (
                      <ListItem
                        button
                        key={subIndex}
                        sx={{
                          pl: 4,
                          "&:hover": {
                            backgroundColor: "#BFBFBF", // Màu nền khi hover
                            fontWeight: "bold", // Chữ đậm hơn khi hover
                          },
                        }}
                        onClick={subItem.onClick}
                      >
                        <ListItemIcon>{subItem.icon}</ListItemIcon>
                        <ListItemText primary={subItem.text} />
                      </ListItem>
                    ))}
                </List>
              </Collapse>
            </React.Fragment>
          ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: open && !isMobile ? `calc(100% - ${drawerWidth}px)` : "100%",
          transition: "width 0.3s",
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default DashboardAdmin;