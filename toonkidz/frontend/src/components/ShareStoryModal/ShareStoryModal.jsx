// src/components/ShareStoryModal/ShareStoryModal.jsx
import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Spin, message, Space } from 'antd';
import { GlobalOutlined, TeamOutlined, LockOutlined } from '@ant-design/icons';
import './ShareStoryModal.scss';
import { getMyStories } from '../../service/storyService';
import { createPost } from '../../service/postService';

const { Option } = Select;

const ShareStoryModal = ({ open, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [myStories, setMyStories] = useState([]);
  const [loadingStories, setLoadingStories] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({ visibility: 'public' });

      const fetchUserStories = async () => {
        setLoadingStories(true);
        try {
          const res = await getMyStories();
          if (res.success) {
            setMyStories(res.stories);
          } else {
            message.error("Không thể tải danh sách truyện của bạn.");
          }
        } catch (error) {
          message.error("Lỗi khi tải danh sách truyện.");
        } finally {
          setLoadingStories(false);
        }
      };
      fetchUserStories();
    }
  }, [open, form]);

  const handleFinish = async (values) => {
    setIsSubmitting(true);
    try {
      const res = await createPost(values);
      if (res.success) {
        onSuccess(res.post);
      } else {
        message.error(res.error || "Chia sẻ truyện thất bại!");
      }
    } catch (error) {
      message.error("Đã xảy ra lỗi khi chia sẻ truyện.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title="Chia sẻ câu chuyện của bạn"
      open={open}
      onCancel={onClose}
      footer={null}
      className="share-story-modal"
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="storyId"
          label="Chọn một câu chuyện để chia sẻ"
          rules={[{ required: true, message: 'Vui lòng chọn một truyện!' }]}
        >
          <Select
            placeholder="Nhấn để chọn truyện"
            loading={loadingStories}
            showSearch
            optionFilterProp="children"
          >
            {myStories.map(story => (
              <Option key={story._id} value={story._id}>
                <div className="story-option">
                  <img src={story.coverImage || '/placeholder.png'} alt={story.title} />
                  <span>{story.title}</span>
                </div>
              </Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="caption"
          label="Thêm lời nhắn (tùy chọn)"
        >
          <Input.TextArea
            rows={4}
            placeholder="Bạn muốn nói gì về câu chuyện này..."
            maxLength={500}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="visibility"
          label="Ai có thể xem bài đăng này?"
          rules={[{ required: true, message: 'Vui lòng chọn quyền xem!' }]}
        >
          <Select placeholder="Chọn quyền xem">
            <Option value="public">
              <Space><GlobalOutlined /> Công khai (Mọi người)</Space>
            </Option>
            <Option value="friend">
              <Space><TeamOutlined /> Bạn bè (Chỉ bạn bè)</Space>
            </Option>
            <Option value="private">
              <Space><LockOutlined /> Chỉ mình tôi (Private)</Space>
            </Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={isSubmitting} block>
            Đăng bài
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ShareStoryModal;