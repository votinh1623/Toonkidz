import { BellOutlined, MailOutlined } from '@ant-design/icons';
import { Badge, Button, Dropdown } from 'antd';
import "./Notify.scss";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faUser, faBars } from "@fortawesome/free-solid-svg-icons";
import { Bell } from 'lucide-react';

function Notify() {
  const items = [
    {
      label: (
        <div className="notify__item">
          <div className="notify__item-icon">
            <MailOutlined className="icon" />
          </div>
          <div className="notify__item-content">
            <div className="notify__item-title">
              You received a new message
            </div>
            <div className="notify__item-time">
              8 min ago
            </div>
          </div>
        </div>
      ),
      key: '0'
    },
    {
      label: (
        <div className="notify__item">
          <div className="notify__item-icon">
            <MailOutlined className="icon" />
          </div>
          <div className="notify__item-content">
            <div className="notify__item-title">
              You received a new message
            </div>
            <div className="notify__item-time">
              8 min ago
            </div>
          </div>
        </div>
      ),
      key: '1'
    },
    {
      label: (
        <div className="notify__item">
          <div className="notify__item-icon">
            <MailOutlined className="icon" />
          </div>
          <div className="notify__item-content">
            <div className="notify__item-title">
              You received a new message
            </div>
            <div className="notify__item-time">
              8 min ago
            </div>
          </div>
        </div>
      ),
      key: '2'
    },
    {
      label: (
        <div className="notify__item">
          <div className="notify__item-icon">
            <MailOutlined className="icon" />
          </div>
          <div className="notify__item-content">
            <div className="notify__item-title">
              You received a new message
            </div>
            <div className="notify__item-time">
              8 min ago
            </div>
          </div>
        </div>
      ),
      key: '3'
    },
    {
      label: (
        <div className="notify__item">
          <div className="notify__item-icon">
            <MailOutlined className="icon" />
          </div>
          <div className="notify__item-content">
            <div className="notify__item-title">
              You received a new message
            </div>
            <div className="notify__item-time">
              8 min ago
            </div>
          </div>
        </div>
      ),
      key: '4'
    },
    {
      label: (
        <div className="notify__item">
          <div className="notify__item-icon">
            <MailOutlined className="icon" />
          </div>
          <div className="notify__item-content">
            <div className="notify__item-title">
              You received a new message
            </div>
            <div className="notify__item-time">
              8 min ago
            </div>
          </div>
        </div>
      ),
      key: '5'
    },
  ];
  return (
    <>
      <Dropdown menu={{ items }} trigger={['click']}
        popupRender={(menu) => (
          <>
            <div className="notify__dropdown">
              <div className="notify__header">
                <div className="notify__header-title">
                  <BellOutlined /> Notification
                </div>
                <Button type="link">View all</Button>
              </div>
              <div className="notify__body">
                {menu}
              </div>
            </div>
          </>
        )}
      >
        <Badge dot={true}>
          <Button type="text"><Bell className='notify__icon' /></Button>
        </Badge>
      </Dropdown>
    </>
  )
}

export default Notify;