import { useState } from "react";
import { Layout, Grid, Drawer } from "antd";
import Header from "../../components/Header/Header";
import AdminSiderContent from "../../components/AdminSiderContent/AdminSiderContent";
import { Outlet } from "react-router-dom";
import "./AdminLayout.scss";

const { Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const AdminLayout = () => {
  const screens = useBreakpoint();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const toggleDrawer = () => setDrawerVisible(!drawerVisible);

  return (
    <Layout className="layout-default">
      {/* Header chung (dùng luôn Header cũ nếu có icon menu) */}
      <Header onToggleSider={toggleDrawer} />

      <Layout className="layout-child">
        {/* SIDEBAR cho desktop */}
        {screens.md && (
          <Sider
            theme="light"
            width={250}
            style={{ minWidth: 210 }}
          >
            <AdminSiderContent />
          </Sider>
        )}

        {/* DRAWER cho mobile */}
        {!screens.md && (
          <Drawer
            placement="left"
            onClose={() => setDrawerVisible(false)}
            open={drawerVisible}
            bodyStyle={{ padding: 0 }}
            width={250}
          >
            <AdminSiderContent />
          </Drawer>
        )}

        {/* Nội dung chính */}
        <Content className="layout__content">
          <div className="content__container">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;