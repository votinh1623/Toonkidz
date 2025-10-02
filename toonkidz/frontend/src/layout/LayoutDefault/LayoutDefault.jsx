import { Outlet } from "react-router-dom";
import Header from "../../components/Header/Header";
import { Layout, Grid, Drawer } from "antd";
import SiderContent from "../../components/SiderContent/SiderContent.jsx";
import SiderMobileMenu from "../../components/SiderMobileMenu/SiderMobileMenu.jsx";
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
        {/* Desktop Sider */}
        {screens.md && (
          <Sider
            theme="light"
            width={250}
            style={{ minWidth: 210 }}
          >
            <SiderContent />
          </Sider>
        )}

        {/* Mobile Drawer */}
        {!screens.md && (
          <Drawer
            placement="left"
            onClose={() => setDrawerVisible(false)}
            open={drawerVisible}
            bodyStyle={{ padding: 0 }}
            width={250}
          >
            <SiderMobileMenu onClose={() => setDrawerVisible(false)} />
            <SiderContent />
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