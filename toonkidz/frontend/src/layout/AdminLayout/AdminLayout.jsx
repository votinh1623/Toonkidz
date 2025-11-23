import { useState, useEffect } from "react";
import { Layout, Grid, Drawer, Spin } from "antd";
import Header from "../../components/Header/Header";
import AdminSiderContent from "../../components/AdminSiderContent/AdminSiderContent";
import { Outlet } from "react-router-dom";
import { getProfile } from "../../service/userService";
import "./AdminLayout.scss";

const { Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const AdminLayout = () => {
  const screens = useBreakpoint();
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getProfile();
        setCurrentUser(user);
      } catch (error) {
        console.error("Failed to fetch admin profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  const toggleDrawer = () => setDrawerVisible(!drawerVisible);

  return (
    <Layout className="admin-layout-wrapper">
      <Header onToggleSider={toggleDrawer} user={currentUser} />

      <Layout className="layout-child">
        {screens.md && (
          <Sider theme="light" width={250} style={{ minWidth: 210 }} className="admin-layout-sider">
            <AdminSiderContent />
          </Sider>
        )}

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

        <Content className="admin__content">
          <div className="admin__content-container">
            <Outlet context={{ currentUser }} />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;