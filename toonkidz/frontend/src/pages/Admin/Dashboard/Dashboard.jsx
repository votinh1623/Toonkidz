// src/pages/Admin/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, DatePicker, Select, Table, Typography, Avatar, Tag, Spin, Space } from 'antd';
import { Users, Book, MessageSquare, Heart } from 'lucide-react';
import { Line, Pie } from '@ant-design/charts';
// import { getDashboardStats } from '../../../service/dashboardService'; // (Sẽ dùng khi có API)
import './Dashboard.scss';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Title } = Typography;

const mockStats = {
  totalUsers: 1250,
  totalStories: 280,
  totalPosts: 5400,
  totalLikes: "25.7k",
};

const mockLineData = [
  { date: '2025-10-01', value: 10, type: 'Người dùng' },
  { date: '2025-10-02', value: 12, type: 'Người dùng' },
  { date: '2025-10-03', value: 11, type: 'Người dùng' },
  { date: '2025-10-04', value: 15, type: 'Người dùng' },
  { date: '2025-10-05', value: 18, type: 'Người dùng' },
  { date: '2025-10-06', value: 22, type: 'Người dùng' },
  { date: '2025-10-07', value: 20, type: 'Người dùng' },
  { date: '2025-10-01', value: 5, type: 'Bài đăng' },
  { date: '2025-10-02', value: 7, type: 'Bài đăng' },
  { date: '2025-10-03', value: 6, type: 'Bài đăng' },
  { date: '2025-10-04', value: 10, type: 'Bài đăng' },
  { date: '2025-10-05', value: 12, type: 'Bài đăng' },
  { date: '2025-10-06', value: 15, type: 'Bài đăng' },
  { date: '2025-10-07', value: 11, type: 'Bài đăng' },
];

const mockPieData = [
  { type: 'Đã xuất bản', value: 180 },
  { type: 'Bản nháp', value: 70 },
  { type: 'AI đã tạo', value: 30 },
];

const mockRecentUsers = [
  { _id: '1', name: 'Lê Trung Nguyên', email: 'nguyen@gmail.com', createdAt: '2025-11-05T10:00:00Z', pfp: null },
  { _id: '2', name: 'Cô Ngọc', email: 'ngoc@gmail.com', createdAt: '2025-11-05T09:30:00Z', pfp: 'https://cdn-icons-png.flaticon.com/512/147/147144.png' },
  { _id: '3', name: 'Bo Hoa', email: 'bohoa@gmail.com', createdAt: '2025-11-04T15:00:00Z', pfp: null },
];

const Dashboard = () => {
  const [stats, setStats] = useState(mockStats);
  const [lineData, setLineData] = useState(mockLineData);
  const [pieData, setPieData] = useState(mockPieData);
  const [recentUsers, setRecentUsers] = useState(mockRecentUsers);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState([dayjs().subtract(7, 'day'), dayjs()]);

  const onDateChange = (dates) => {
    if (dates) {
      setDateRange(dates);
    } else {
      setDateRange([dayjs().subtract(7, 'day'), dayjs()]);
    }
  };

  const lineConfig = {
    data: lineData,
    xField: 'date',
    yField: 'value',
    seriesField: 'type',
    color: ({ type }) => {
      if (type === 'Người dùng') {
        return '#6c63ff';
      }
      return '#5AD8A6';
    },

    yAxis: { title: { text: 'Số lượng' } },
    xAxis: { title: { text: 'Ngày' } },
    smooth: true,
    legend: { position: 'top' },
    tooltip: { showCrosshairs: true, shared: true },
  };

  const pieConfig = {
    data: pieData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    label: {
      type: 'spider',
      content: (item) => {
        return `${item.type}\n${(item.percent * 100).toFixed(0)}%`;
      },
    },
    interactions: [{ type: 'element-active' }],
  };

  const userColumns = [
    {
      title: 'Người dùng',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar src={record.pfp || 'https://www.svgrepo.com/show/452030/avatar-default.svg'} />
          <Title level={5} style={{ margin: 0 }}>{text}</Title>
        </Space>
      )
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Ngày tham gia',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    }
  ];

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <Title level={2}>Tổng quan</Title>
        <Space>
          <Select defaultValue="last7days" style={{ width: 120 }}>
            <Select.Option value="last7days">7 ngày qua</Select.Option>
            <Select.Option value="last30days">30 ngày qua</Select.Option>
          </Select>
          <RangePicker value={dateRange} onChange={onDateChange} />
        </Space>
      </div>

      <Spin spinning={loading}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={12} lg={6}>
            <Card className="kpi-card">
              <Statistic
                title="Tổng người dùng"
                value={stats.totalUsers}
                prefix={<div className="kpi-icon users"><Users size={20} /></div>}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={12} lg={6}>
            <Card className="kpi-card">
              <Statistic
                title="Tổng số truyện"
                value={stats.totalStories}
                prefix={<div className="kpi-icon stories"><Book size={20} /></div>}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={12} lg={6}>
            <Card className="kpi-card">
              <Statistic
                title="Tổng bài đăng"
                value={stats.totalPosts}
                prefix={<div className="kpi-icon posts"><MessageSquare size={20} /></div>}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={12} lg={6}>
            <Card className="kpi-card">
              <Statistic
                title="Tổng lượt thích"
                value={stats.totalLikes}
                prefix={<div className="kpi-icon likes"><Heart size={20} /></div>}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
          <Col xs={24} lg={16}>
            <Card title="Phân tích tăng trưởng (Người dùng vs Bài đăng)">
              <Line {...lineConfig} />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="Tỉ lệ trạng thái truyện">
              {/* Thẻ Pie sẽ render chính xác sau khi sửa config */}
              <Pie {...pieConfig} />
            </Card>
          </Col>
        </Row>

        <Row style={{ marginTop: '24px' }}>
          <Col span={24}>
            <Card title="Người dùng đăng ký gần đây">
              <Table
                dataSource={recentUsers}
                columns={userColumns}
                rowKey="_id"
                pagination={false}
              />
            </Card>
          </Col>
        </Row>
      </Spin>
    </div>
  );
};

export default Dashboard;