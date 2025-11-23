import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Select, Table, Typography, Avatar, Tag, Spin, Space, message } from 'antd';
import { Users, Book, MessageSquare, Heart } from 'lucide-react';
import { Line, Pie } from '@ant-design/charts';
import { getDashboardStats } from '../../../service/dashboardService';
import './Dashboard.scss';
import dayjs from 'dayjs';

const { Title } = Typography;

const Dashboard = () => {
  const [stats, setStats] = useState({ totalUsers: 0, totalStories: 0, totalPosts: 0, totalLikes: 0 });
  const [lineData, setLineData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(7);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await getDashboardStats(range);
        if (res.success) {
          setStats(res.stats);

          const sortedLineData = res.lineData.sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
          });
          setLineData(sortedLineData);

          setPieData(res.pieData);
          setRecentUsers(res.recentUsers);
        } else {
          message.error("Lỗi tải dữ liệu dashboard");
        }
      } catch (error) {
        message.error("Lỗi kết nối server");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [range]);

  const handleRangeChange = (value) => {
    setRange(value);
  };

  const lineConfig = {
    data: lineData,
    xField: 'date',
    yField: 'value',

    seriesField: 'type',
    colorField: 'type',

    color: ['#2f54eb', '#fa8c16'],

    yAxis: {
      title: { text: 'Số lượng' },
      min: 0,
      tickInterval: 1,
    },
    xAxis: {
      title: { text: 'Ngày' },
      label: {
        formatter: (v) => dayjs(v).format('DD/MM'),
      },
    },

    smooth: true,

    point: {
      size: 5,
      shape: 'circle',
      style: {
        fill: 'white',
        lineWidth: 2,
        strokeOpacity: 1,
      },
    },

    legend: { position: 'top' },
    tooltip: { showCrosshairs: true, shared: true },

    animation: false,
  };

  const pieConfig = {
    data: pieData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    innerRadius: 0.6,
    label: {
      type: 'inner',
      offset: '-30%',
      content: ({ percent }) => `${(percent * 100).toFixed(0)}%`,
      style: {
        fontSize: 14,
        textAlign: 'center',
      },
    },

    interactions: [
      { type: 'element-selected' },
      { type: 'element-active' }
    ],

    statistic: {
      title: false,
      content: {
        style: {
          whiteSpace: 'pre-wrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
        content: 'Trạng thái',
      },
    },

    legend: { position: 'bottom' },

    height: 300,
    autoFit: true,
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
          <Select defaultValue={7} style={{ width: 150 }} onChange={handleRangeChange}>
            <Select.Option value={7}>7 ngày qua</Select.Option>
            <Select.Option value={30}>30 ngày qua</Select.Option>
            <Select.Option value={90}>3 tháng qua</Select.Option>
          </Select>
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
            <Card title="Phân tích tăng trưởng">
              {lineData.length > 0 ? (
                <div style={{ height: 300 }}>
                  <Line {...lineConfig} />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>Chưa có dữ liệu tăng trưởng</div>
              )}
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="Tỉ lệ trạng thái truyện">
              {pieData.length > 0 ? (
                <div style={{ height: 300 }}>
                  <Pie {...pieConfig} />
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: 20, color: '#999' }}>Chưa có dữ liệu truyện</div>
              )}
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