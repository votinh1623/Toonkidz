// src/layout/LayoutDefault/LayoutDefault.jsx
import { Outlet } from "react-router-dom";
import Header from "../../components/Header/Header";
import { Layout, Grid, Drawer } from "antd";
import SiderContent from "../../components/SiderContent/SiderContent.jsx";
import { useState } from "react";

const { Sider, Content } = Layout;
const { useBreakpoint } = Grid;

const LayoutDefault = () => {
  const screens = useBreakpoint();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const toggleDrawer = () => setDrawerVisible(!drawerVisible);

  return (
    <Layout className="layout-default">
      <Header onToggleSider={toggleDrawer} />
      <Layout className="layout-child">
        {screens.md && (
          <Sider
            theme="light"
            width={256}
            className="layout-default-sider"
          >
            <SiderContent />
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
            <SiderContent onClose={() => setDrawerVisible(false)} />
          </Drawer>
        )}

        <Content className="layout__content">
          <div className="content__container">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default LayoutDefault;