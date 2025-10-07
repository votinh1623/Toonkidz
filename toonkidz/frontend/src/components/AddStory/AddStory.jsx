import React, { useState } from "react";
import { Form, Input, Button, Select, Upload, Modal, message, List, Space } from "antd";
import { PlusOutlined, UploadOutlined, AudioOutlined, FileImageOutlined } from "@ant-design/icons";
import "./AddStory.scss";

const AddStory = () => {
  const [form] = Form.useForm();
  const [pages, setPages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pageForm] = Form.useForm();

  const handleAddPage = () => {
    setIsModalOpen(true);
  };

  const handleSavePage = () => {
    pageForm
      .validateFields()
      .then((values) => {
        setPages([...pages, { ...values, key: Date.now() }]);
        pageForm.resetFields();
        setIsModalOpen(false);
        message.success("Đã thêm trang mới!");
      })
      .catch(() => { });
  };

  const handleRemovePage = (key) => {
    setPages(pages.filter((p) => p.key !== key));
  };

  const handleSubmit = (values) => {
    console.log("📘 Dữ liệu truyện:", { ...values, pages });
    message.success("Lưu truyện thành công!");
  };

  return (
    <div className="add-story">
      <h2>Thêm truyện mới</h2>

      <Form
        layout="vertical"
        form={form}
        onFinish={handleSubmit}
        className="add-story__form"
      >
        <Form.Item label="Tiêu đề" name="title" rules={[{ required: true, message: "Vui lòng nhập tiêu đề!" }]}>
          <Input placeholder="Nhập tiêu đề truyện..." />
        </Form.Item>

        <Form.Item label="Giới thiệu" name="intro" rules={[{ required: true, message: "Vui lòng nhập giới thiệu!" }]}>
          <Input.TextArea rows={4} placeholder="Giới thiệu ngắn về truyện..." />
        </Form.Item>

        <Form.Item label="Thể loại" name="theme" rules={[{ required: true }]}>
          <Select placeholder="Chọn thể loại">
            <Select.Option value="fairytale">Cổ tích</Select.Option>
            <Select.Option value="adventure">Phiêu lưu</Select.Option>
            <Select.Option value="animal">Động vật</Select.Option>
            <Select.Option value="science">Khoa học</Select.Option>
            <Select.Option value="music">Âm nhạc</Select.Option>
            <Select.Option value="nature">Thiên nhiên</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item label="Ảnh chính" name="image">
          <Upload beforeUpload={() => false} listType="picture">
            <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
          </Upload>
        </Form.Item>

        <div className="add-story__pages">
          <div className="add-story__pages-header">
            <h3>Danh sách trang ({pages.length})</h3>
            <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddPage}>
              Thêm Page
            </Button>
          </div>

          <List
            dataSource={pages}
            bordered
            renderItem={(item, index) => (
              <List.Item
                actions={[
                  <Button type="link" danger onClick={() => handleRemovePage(item.key)}>
                    Xoá
                  </Button>,
                ]}
              >
                <Space>
                  <FileImageOutlined />
                  <strong>Trang {index + 1}:</strong> {item.content?.slice(0, 30)}...
                </Space>
              </List.Item>
            )}
          />
        </div>

        <Button type="primary" htmlType="submit" className="add-story__submit">
          Lưu truyện
        </Button>
      </Form>

      {/* 🧩 Modal thêm page */}
      <Modal
        title="Thêm trang mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSavePage}
        okText="Lưu"
      >
        <Form form={pageForm} layout="vertical">
          <Form.Item label="Nội dung" name="content" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="Nhập nội dung trang..." />
          </Form.Item>

          <Form.Item label="Ảnh" name="img">
            <Upload beforeUpload={() => false} listType="picture">
              <Button icon={<FileImageOutlined />}>Chọn ảnh</Button>
            </Upload>
          </Form.Item>

          <Form.Item label="Audio" name="audio">
            <Upload beforeUpload={() => false} listType="text">
              <Button icon={<AudioOutlined />}>Tải âm thanh</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AddStory;