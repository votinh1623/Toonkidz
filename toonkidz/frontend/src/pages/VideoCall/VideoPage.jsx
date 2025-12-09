import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';
import axios from 'axios';

const VideoPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || { _id: 'guest', name: 'Guest' };

  const randomSuffix = Math.floor(Math.random() * 10000).toString();
  const userID = (user._id || 'guest') + '_' + randomSuffix;
  const userName = user.name || 'Guest';

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  };

  const createCallEndedMessage = async () => {
    console.log("[1] Bắt đầu xử lý kết thúc cuộc gọi...");
    try {
      const callInfoStr = localStorage.getItem('currentCallInfo');

      if (!callInfoStr) return;

      const callInfo = JSON.parse(callInfoStr);
      if (callInfo.isCaller === false) {
        console.log("Tôi là người nhận cuộc gọi. Không thực hiện lưu log (để người gọi lưu).");
        return;
      }

      console.log("[2] Dữ liệu cuộc gọi (Người gọi):", callInfo);

      if (callInfo && callInfo.conversationId && callInfo.partnerId) {
        const token = getCookie('accessToken');
        if (!token) return;

        await axios.post('http://localhost:3000/api/messages', {
          conversationId: callInfo.conversationId,
          receiverId: callInfo.partnerId,
          content: "CALL_ENDED",
          messageType: "call"
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log("[4] Lưu thành công lịch sử cuộc gọi!");
      }
    } catch (error) {
      console.error("[Lỗi API]:", error);
    } finally {
      localStorage.removeItem('currentCallInfo');
    }
  };

  const myMeeting = async (element) => {
    const appID = 243006584;
    const serverSecret = "9079dd97fb9fffcac547a755685c8b11";

    const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
      appID,
      serverSecret,
      roomId,
      userID,
      userName
    );

    const zp = ZegoUIKitPrebuilt.create(kitToken);

    zp.joinRoom({
      container: element,
      scenario: { mode: ZegoUIKitPrebuilt.OneONoneCall },
      showScreenSharingButton: false,
      onLeaveRoom: async () => {
        console.log("Rời phòng...");
        const callInfoStr = localStorage.getItem('currentCallInfo');
        let callInfo = null;
        if (callInfoStr) {
          callInfo = JSON.parse(callInfoStr);
        }
        await createCallEndedMessage();
        if (callInfo) {
          sessionStorage.setItem('lastActiveConvoId', callInfo.conversationId);

          const targetConversation = {
            _id: callInfo.conversationId,
            partner: callInfo.partner || { _id: callInfo.partnerId }
          };

          console.log("Điều hướng về Chat với ID:", callInfo.conversationId);

          navigate('/home/chat', {
            state: {
              targetConversation: targetConversation,
              refresh: true
            }
          });
        } else {
          console.warn("Mất thông tin cuộc gọi, về trang chủ chat.");
          navigate('/home/chat');
        }

        setTimeout(() => {
          window.location.reload();
        }, 100);
      },
    });
  };

  return (
    <div
      ref={myMeeting}
      style={{ width: '100vw', height: '100vh' }}
    />
  );
};

export default VideoPage;