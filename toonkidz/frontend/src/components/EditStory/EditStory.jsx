// src/pages/Admin/EditStory/EditStory.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Form, Input, Button, Select, Upload, Modal, message, List, Space, Spin } from "antd";
import { PlusOutlined, UploadOutlined, AudioOutlined, FileImageOutlined, EditOutlined, ArrowLeftOutlined } from "@ant-design/icons";
import "./EditStory.scss";
import { getStoryById, updateStory } from "../../service/storyService";
import Swal from 'sweetalert2/dist/sweetalert2.js'
import 'sweetalert2/src/sweetalert2.scss'

const EditStory = () => {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [pageForm] = Form.useForm();

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  const [pages, setPages] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState(null);

  const [mainImage, setMainImage] = useState([]);
  const [pageImage, setPageImage] = useState([]);
  const [pageAudio, setPageAudio] = useState([]);

  const location = useLocation();

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const res = await getStoryById(storyId);
        if (res.success) {
          const story = res.story;
          form.setFieldsValue({
            title: story.title,
            head: story.head,
            theme: story.theme,
            status: story.status,
          });

          if (story.coverImage) {
            setMainImage([{ uid: '-1', name: 'cover.png', status: 'done', url: story.coverImage }]);
          }

          const formattedPages = story.pages.map(p => ({
            ...p,
            key: p._id,
            img: p.image,
            audio: p.audio,
          }));
          setPages(formattedPages);
        } else {
          message.error("Không tìm thấy truyện!");
          navigate("/admin/stories-management");
        }
      } catch (error) {
        message.error("Lỗi khi tải dữ liệu truyện!");
      } finally {
        setIsFetching(false);
      }
    };
    fetchStory();
  }, [storyId, form, navigate]);

  const handleAddPage = () => {
    setEditingPage(null);
    pageForm.resetFields();
    setPageImage([]);
    setPageAudio([]);
    setIsModalOpen(true);
  };

  const handleEditPage = (page) => {
    setEditingPage(page);
    pageForm.setFieldsValue({ content: page.content });
    setPageImage(page.img ? [{ uid: '-1', name: 'image.png', status: 'done', url: page.img }] : []);
    setPageAudio(page.audio ? [{ uid: '-1', name: 'audio.mp3', status: 'done', url: page.audio }] : []);
    setIsModalOpen(true);
  };

  const handlePageFileChange = (fileList, type) => {
    if (type === 'image') {
      setPageImage(fileList);
    } else if (type === 'audio') {
      setPageAudio(fileList);
    }

    if (editingPage && fileList.length > 0) {
      setPages(pages.map(p => {
        if (p.key === editingPage.key) {
          return {
            ...p,
            [type === 'image' ? 'img' : 'audio']: fileList[0].originFileObj ? URL.createObjectURL(fileList[0].originFileObj) : fileList[0].url,
            [type === 'image' ? 'imgFile' : 'audioFile']: fileList[0].originFileObj || null,
          };
        }
        return p;
      }));
    } else if (editingPage && fileList.length === 0) {
      // Handle file removal
      setPages(pages.map(p => {
        if (p.key === editingPage.key) {
          return {
            ...p,
            [type === 'image' ? 'img' : 'audio']: null,
            [type === 'image' ? 'imgFile' : 'audioFile']: null,
          };
        }
        return p;
      }));
    }
  };

  const handleSavePage = () => {
    pageForm.validateFields().then((values) => {
      const pageData = {
        content: values.content,
        img: pageImage[0]?.url || (pageImage[0]?.originFileObj ? URL.createObjectURL(pageImage[0].originFileObj) : null),
        audio: pageAudio[0]?.url || (pageAudio[0]?.originFileObj ? URL.createObjectURL(pageAudio[0].originFileObj) : null),
        imgFile: pageImage[0]?.originFileObj || null,
        audioFile: pageAudio[0]?.originFileObj || null,
      };

      if (editingPage) {
        // The state is already updated, we just close the modal
        message.success("Đã cập nhật trang!");
      } else {
        const newPage = { ...pageData, key: Date.now() };
        setPages([...pages, newPage]);
        message.success("Đã thêm trang mới!");
      }

      setIsModalOpen(false);
      pageForm.resetFields();
    }).catch(() => { });
  };

  const handleRemovePage = (key) => {
    setPages(pages.filter((p) => p.key !== key));
  };

  const handleGoBack = () => {
    const returnPath = location.state?.from || '/admin/stories-management';
    navigate(returnPath);
  };

  const handleSubmit = async (values) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", values.title);
      formData.append("head", values.head);
      formData.append("theme", values.theme);
      formData.append("status", values.status);

      if (mainImage.length > 0 && mainImage[0].originFileObj) {
        formData.append("coverImage", mainImage[0].originFileObj);
      }

      const pagesData = pages.map(p => ({
        _id: p._id,
        content: p.content,
        image: p.img && !p.img.startsWith('blob:') ? p.img : null, // Send old URL, not blob
        audio: p.audio && !p.audio.startsWith('blob:') ? p.audio : null,
      }));
      formData.append("pages", JSON.stringify(pagesData));

      pages.forEach((page, index) => {
        if (page.imgFile) {
          formData.append(`pageImage_${index}`, page.imgFile);
        }
        if (page.audioFile) {
          formData.append(`pageAudio_${index}`, page.audioFile);
        }
      });

      const res = await updateStory(storyId, formData);

      if (res.success) {
        Swal.fire({
          title: "Cập nhật thành công!",
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        }).then(() => {
          const returnPath = location.state?.from || '/admin/stories-management';
          navigate(returnPath);
        });
      } else {
        message.error("Cập nhật truyện thất bại!");
      }
    } catch (error) {
      console.error("Submit error:", error);
      message.error("Đã xảy ra lỗi khi cập nhật truyện!");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return <div className="loading-container"><Spin size="large" /></div>;
  }

  return (
    <div className="add-story">
      <div className="edit-story-header">
        <h2>Chỉnh sửa truyện</h2>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleGoBack}
          className="back-button"
        >
          Quay lại
        </Button>
      </div>
      <Form layout="vertical" form={form} onFinish={handleSubmit} className="add-story__form">
        {/* Form Items */}
        <Form.Item label="Tiêu đề" name="title" rules={[{ required: true }]}>
          <Input placeholder="Nhập tiêu đề truyện..." />
        </Form.Item>
        <Form.Item label="Giới thiệu" name="head" rules={[{ required: true }]}>
          <Input.TextArea rows={4} placeholder="Giới thiệu ngắn về truyện..." />
        </Form.Item>
        <Space wrap>
          <Form.Item label="Thể loại" name="theme" rules={[{ required: true }]} style={{ minWidth: 200 }}>
            <Select placeholder="Chọn thể loại">
              <Select.Option value="fairytale">Cổ tích</Select.Option>
              <Select.Option value="adventure">Phiêu lưu</Select.Option>
              <Select.Option value="animal">Động vật</Select.Option>
              <Select.Option value="science">Khoa học</Select.Option>
              <Select.Option value="music">Âm nhạc</Select.Option>
              <Select.Option value="nature">Thiên nhiên</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Trạng thái" name="status" rules={[{ required: true }]} style={{ minWidth: 200 }}>
            <Select placeholder="Chọn trạng thái">
              <Select.Option value="draft">Bản nháp</Select.Option>
              <Select.Option value="published">Đã xuất bản</Select.Option>
              <Select.Option value="generated">AI đã tạo</Select.Option>
            </Select>
          </Form.Item>
        </Space>
        <Form.Item label="Ảnh bìa" name="coverImage">
          <Upload
            beforeUpload={() => false}
            listType="picture"
            maxCount={1}
            fileList={mainImage}
            onChange={({ fileList }) => setMainImage(fileList)}
          >
            <Button icon={<UploadOutlined />}>Chọn hoặc thay đổi ảnh</Button>
          </Upload>
        </Form.Item>

        <div className="add-story__pages">
          <div className="add-story__pages-header">
            <h3>Danh sách trang ({pages.length})</h3>
            <Button type="dashed" icon={<PlusOutlined />} onClick={handleAddPage}>Thêm Page</Button>
          </div>
          <List
            dataSource={pages}
            bordered
            renderItem={(item, index) => (
              <List.Item
                actions={[
                  <Button type="link" icon={<EditOutlined />} onClick={() => handleEditPage(item)}>Sửa</Button>,
                  <Button type="link" danger onClick={() => handleRemovePage(item.key)}>Xoá</Button>,
                ]}
              >
                <Space>
                  {item.img ? <FileImageOutlined style={{ color: '#1890ff' }} /> : <FileImageOutlined />}
                  {item.audio ? <AudioOutlined style={{ color: '#1890ff' }} /> : <AudioOutlined />}
                  <strong>Trang {index + 1}:</strong> {item.content?.slice(0, 50)}...
                </Space>
              </List.Item>
            )}
          />
        </div>

        <Button type="primary" loading={isLoading} htmlType="submit" className="add-story__submit">
          Lưu thay đổi
        </Button>
      </Form>

      <Modal
        title={editingPage ? "Chỉnh sửa trang" : "Thêm trang mới"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOk={handleSavePage}
        okText="Lưu"
        destroyOnClose
      >
        <Form form={pageForm} layout="vertical" initialValues={editingPage || {}}>
          <Form.Item label="Nội dung" name="content" rules={[{ required: true }]}>
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item label="Ảnh" name="img">
            {/* ✅ FIX: Call the new handler function on change */}
            <Upload beforeUpload={() => false} listType="picture" maxCount={1} fileList={pageImage} onChange={({ fileList }) => handlePageFileChange(fileList, 'image')}>
              <Button icon={<FileImageOutlined />}>Chọn hoặc thay đổi ảnh</Button>
            </Upload>
          </Form.Item>
          <Form.Item label="Audio" name="audio">
            {/* ✅ FIX: Call the new handler function on change */}
            <Upload beforeUpload={() => false} maxCount={1} fileList={pageAudio} onChange={({ fileList }) => handlePageFileChange(fileList, 'audio')}>
              <Button icon={<AudioOutlined />}>Tải hoặc thay đổi âm thanh</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EditStory;