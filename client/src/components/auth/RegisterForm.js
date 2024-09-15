import React from "react";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import { Link } from "react-router-dom";

function RegisterForm() {
  return (
    <>
      <Form>
        <Form.Group>
          <h6 style={{ color: "black", textAlign: "left" }}>Tên đăng nhập</h6>
          <Form.Control
            type="text"
            placeholder="Tên đăng nhập"
            name="username"
            required
          />
        </Form.Group>
        <Form.Group>
          <h6 style={{ color: "black", textAlign: "left" }}>Mật khẩu</h6>
          <Form.Control
            type="password"
            placeholder="Mật khẩu"
            name="password"
            required
          />
        </Form.Group>
        <Form.Group>
          <h6 style={{ color: "black", textAlign: "left" }}>
            Nhập lại mật khẩu
          </h6>
          <Form.Control
            type="password"
            placeholder="Nhập lại mật khẩu"
            name="confirmPassword"
            required
          />
        </Form.Group>
        <Button variant="success" type="submit">
          Đăng ký
        </Button>
      </Form>
      <p>
        Bạn chưa có tài khoản?
        <Link to="/login">
          <Button variant="info" size="sm" className="ml-2">
            Đăng nhập
          </Button>
        </Link>
      </p>
    </>
  );
}

export default RegisterForm;
