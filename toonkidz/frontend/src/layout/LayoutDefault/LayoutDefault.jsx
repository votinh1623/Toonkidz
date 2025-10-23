// src/layout/LayoutDefault/LayoutDefault.jsx
import { Outlet, useLocation } from "react-router-dom";
import Header from "../../components/Header/Header";
import { Layout, Grid, Drawer, Spin } from "antd";
import SiderContent from "../../components/SiderContent/SiderContent.jsx";
import { useState } from "react";
import { useEffect } from "react";
import { getProfile } from "../../service/userService.jsx";

const { Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const fullBleedPaths = [
  '/home/chat'
];

const LayoutDefault = () => {
  const screens = useBreakpoint();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const location = useLocation();

  const isFullBleed = fullBleedPaths.includes(location.pathname);

  const toggleDrawer = () => setDrawerVisible(!drawerVisible);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfile();
        setCurrentUser(res);
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  return (
    <Layout className="layout-default">
      <Header
        onToggleSider={toggleDrawer}
        user={currentUser}
        loading={loadingProfile}
      />
      <Layout className="layout-child">
        {screens.md && (
          <Sider
            theme="light"
            width={256}
            className="layout-default-sider"
          >
            {loadingProfile ? <Spin /> : <SiderContent user={currentUser} />}
          </Sider>
        )}

        {!screens.md && (
          <Drawer
            placement="left"
            onClose={() => setDrawerVisible(false)}
            open={drawerVisible}
            width={256}
            bodyStyle={{ padding: 0 }}
          >
            {loadingProfile ? <Spin /> : (
              <SiderContent
                onClose={() => setDrawerVisible(false)}
                user={currentUser}
              />
            )}
          </Drawer>
        )}

        <Content className={`layout__content ${isFullBleed ? 'layout__content--full-bleed' : ''}`}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default LayoutDefault;