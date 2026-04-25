import React, { useState } from "react";
import {
  Form,
  Input,
  Button,
  Select,
  Card,
  Row,
  Col,
  message,
  Checkbox,
} from "antd";
import "../LightMode.css";
import { fetchWithAuth } from "@/parts/FetchApiWithAuth";
import { useNavigate } from "react-router-dom";
import { useWatch } from "antd/es/form/Form";

const { Option } = Select;

const CreateUser = () => {
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const isRandom = useWatch("randomPassword", form);

  const handleSubmit = async (values) => {
    setIsLoading(true);
    try {
      const combinedData = {
        ...values,
        password: values.randomPassword === true ? null : values.password,
        image: null,
      };
      delete combinedData.randomPassword;

      //call api create user
      const res = await fetchWithAuth(
        `${import.meta.env.VITE_API_URL}/admin/users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(combinedData),
        }
      );
      const response = await res.json();

      if (response.status === "success") {
        messageApi.success({
          content:
            "Tạo tài khoản thành công! Bạn sẽ được chuyển hướng đến danh sách người dùng!",
          duration: 3,
        });
        messageApi.success({
          content: "Đã gửi email đến " + response.data.emailAddress + "!",
          duration: 3,
        });
        setTimeout(() => {
          navigate("/admin/users");
        }, 3000);
      } else {
        messageApi.error({
          content: response.message,
          duration: 3,
        });
      }
    } catch (error) {
      console.error("ERORR: ", error);
    }
    setIsLoading(false);
  };

  return (
    <div className="light-mode">
      {contextHolder}
      <Card
        title="Tạo tài khoản hệ thống"
        style={{
          maxWidth: 900,
          margin: "2rem auto",
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ goal: 0, assist: 0 }}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="username"
                label="Tên đăng nhập"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập tên đăng nhập của tài khoản",
                  },
                ]}
              >
                <Input />
              </Form.Item>
              <div className="flex justify-between gap-2">
                <Form.Item
                  name="firstName"
                  label="Họ tên đệm"
                  rules={[
                    { required: true, message: "Vui lòng nhập họ tên đệm" },
                  ]}
                >
                  <Input />
                </Form.Item>

                <Form.Item
                  name="lastName"
                  label="Tên"
                  rules={[{ required: true, message: "Vui lòng nhập tên" }]}
                >
                  <Input />
                </Form.Item>
              </div>
              <Form.Item
                name="emailAddress"
                label="Email"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập email",
                  },
                  {
                    type: "email",
                    message: "Email không đúng định dạng!",
                  },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                name="roleId"
                label="Vai trò của tài khoản"
                rules={[
                  {
                    required: true,
                    message: "Vui lòng nhập vai trò tài khoản",
                  },
                ]}
              >
                <Select
                  placeholder="Chọn vai trò"
                  popupClassName="light-mode-dropdown"
                  className="light-mode"
                >
                  <Option key={2} value={2}>
                    Manager
                  </Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={
                  !isRandom
                    ? [
                        {
                          required: true,
                          message:
                            "Vui lòng nhập mật khẩu nếu không tạo ngẫu nhiên",
                        },
                      ]
                    : []
                }
              >
                <Input.Password disabled={isRandom} />
              </Form.Item>
              <Form.Item
                name="randomPassword"
                valuePropName="checked"
                style={{ marginBottom: 0 }}
              >
                <Checkbox>Tạo mật khẩu ngẫu nhiên</Checkbox>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item style={{ textAlign: "right" }}>
            <Button
              type="primary"
              htmlType="submit"
              className={`px-4 py-2 bg-blue-500/80 hover:bg-blue-500 rounded-lg text-white flex items-center ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                  Đang xử lý...
                </div>
              ) : (
                "Tạo tài khoản"
              )}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateUser;

