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
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import SchoolIcon from "@mui/icons-material/School";
import AccountBoxIcon from "@mui/icons-material/AccountBox";
import UserMenu from "../components/user/UserMenu";
import { Outlet, useNavigate } from "react-router-dom";

const drawerWidth = 240;

const DashboardAdmin = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)"); // Xác định nếu là màn hình nhỏ

  const toggleDrawer = () => {
    setOpen(!open);
  };

  const menuItems = [
    { text: "Quản lý giảng viên", icon: <SchoolIcon />, onClick: () => {} },
    {
      text: "Quản lý sinh viên",
      icon: <AccountCircleIcon />,
      subMenu: [
        {
          text: "Quản lý tài khoản",
          icon: <AccountBoxIcon />,
          onClick: () => navigate("/dashboardAdmin/account-management"),
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
          width: open && !isMobile ? `calc(100% - ${drawerWidth}px)` : "100%", // Điều chỉnh AppBar khi Drawer mở
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
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              marginTop: "1px",
            }}
          >
            <UserMenu />
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer
        variant={isMobile ? "temporary" : "persistent"} // Drawer sẽ là temporary trên mobile
        anchor="left"
        open={open}
        onClose={toggleDrawer} // Đóng Drawer khi bấm ra ngoài (trên mobile)
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
              <ListItem button onClick={item.onClick}>
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItem>
              {item.subMenu &&
                item.subMenu.map((subItem, subIndex) => (
                  <ListItem
                    button
                    key={subIndex}
                    sx={{ pl: 4 }}
                    onClick={subItem.onClick}
                  >
                    <ListItemIcon>{subItem.icon}</ListItemIcon>
                    <ListItemText primary={subItem.text} />
                  </ListItem>
                ))}
            </React.Fragment>
          ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: open && !isMobile ? `calc(100% - ${drawerWidth}px)` : "100%", // Điều chỉnh chiều rộng main khi mở drawer
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
