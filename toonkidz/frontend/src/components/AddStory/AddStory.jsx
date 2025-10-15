import React, { useState } from "react";
import { Form, Input, Button, Select, Upload, Modal, message, List, Space } from "antd";
import { PlusOutlined, UploadOutlined, AudioOutlined, FileImageOutlined } from "@ant-design/icons";
import "./AddStory.scss";
import { createStory } from "../../service/storyService";
import Swal from 'sweetalert2/dist/sweetalert2.js'
import 'sweetalert2/src/sweetalert2.scss'

const AddStory = () => {
  const [form] = Form.useForm();
  const [pages, setPages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pageForm] = Form.useForm();

  const [mainImage, setMainImage] = useState([]);
  const [pageImage, setPageImage] = useState([]);
  const [pageAudio, setPageAudio] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleAddPage = () => {
    setIsModalOpen(true);
  };

  const handleSavePage = () => {
    pageForm
      .validateFields()
      .then((values) => {
        const newPage = {
          key: Date.now(),
          content: values.content,
          img: pageImage[0]?.name || null,
          audio: pageAudio[0]?.name || null,
          imgFile: pageImage[0]?.originFileObj || null,
          audioFile: pageAudio[0]?.originFileObj || null,
        };
        setPages([...pages, newPage]);
        setPageImage([]);
        setPageAudio([]);
        pageForm.resetFields();
        setIsModalOpen(false);
        message.success("Đã thêm trang mới!");
      })
      .catch(() => { });
  };

  const handleRemovePage = (key) => {
    setPages(pages.filter((p) => p.key !== key));
  };

  const handleSubmit = async (values) => {
    setIsLoading(true);
    try {
      const formData = new FormData();

      formData.append("title", values.title);
      formData.append("head", values.head);
      formData.append("theme", values.theme);

      // coverImage
      if (mainImage[0]) {
        formData.append("coverImage", mainImage[0].originFileObj);
      }

      // pages
      const pagesData = pages.map((p) => ({
        content: p.content,
      }));
      formData.append("pages", JSON.stringify(pagesData));

      // page images + audios
      pages.forEach((page, index) => {
        if (page.imgFile) {
          formData.append(`pageImage_${index}`, page.imgFile);
        }
        if (page.audioFile) {
          formData.append(`pageAudio_${index}`, page.audioFile);
        }
      });

      const res = await createStory(formData);

      if (res.success) {
        Swal.fire({
          title: "Đã tạo truyện thành công!",
          icon: "success",
          draggable: true
        });
        console.log("Story:", res.story);
        form.resetFields();
        setPages([]);
        setMainImage([]);
      } else {
        message.error("Tạo truyện thất bại!");
      }
    } catch (error) {
      console.error("Submit error:", error);
      message.error("Đã xảy ra lỗi khi tạo truyện!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="add-story">
      <h2>Thêm truyện mới</h2>

      <Form layout="vertical" form={form} onFinish={handleSubmit} className="add-story__form">
        <Form.Item
          label="Tiêu đề"
          name="title"
          rules={[{ required: true, message: "Vui lòng nhập tiêu đề!" }]}
        >
          <Input placeholder="Nhập tiêu đề truyện..." />
        </Form.Item>

        <Form.Item
          label="Giới thiệu"
          name="head"
          rules={[{ required: true, message: "Vui lòng nhập giới thiệu!" }]}
        >
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

        <Form.Item label="Ảnh chính" name="coverImage">
          <Upload
            beforeUpload={() => false}
            listType="picture"
            fileList={mainImage}
            onChange={({ fileList }) => setMainImage(fileList)}
          >
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

        <Button type="primary" loading={isLoading} disabled={isLoading} htmlType="submit" className="add-story__submit">
          Lưu truyện
        </Button>
      </Form>

      <Modal
        title="Thêm trang mới"
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSavePage}
        okText="Lưu"
        styles={{ body: { paddingTop: 12 } }}
      >
        <Form form={pageForm} layout="vertical">
          <Form.Item label="Nội dung" name="content" rules={[{ required: true }]}>
            <Input.TextArea rows={3} placeholder="Nhập nội dung trang..." />
          </Form.Item>

          <Form.Item label="Ảnh" name="img">
            <Upload
              beforeUpload={() => false}
              listType="picture"
              fileList={pageImage}
              onChange={({ fileList }) => setPageImage(fileList)}
            >
              <Button icon={<FileImageOutlined />}>Chọn ảnh</Button>
            </Upload>
          </Form.Item>

          <Form.Item label="Audio" name="audio">
            <Upload
              beforeUpload={() => false}
              fileList={pageAudio}
              onChange={({ fileList }) => setPageAudio(fileList)}
            >
              <Button icon={<AudioOutlined />}>Tải âm thanh</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default AddStory;