import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ZegoUIKitPrebuilt } from '@zegocloud/zego-uikit-prebuilt';

const VideoPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user')) || { _id: 'guest', name: 'Guest' };
  const randomSuffix = Math.floor(Math.random() * 10000).toString();
  const userID = (user._id || 'guest') + '_' + randomSuffix;
  const userName = user.name || 'Guest';

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
      scenario: {
        mode: ZegoUIKitPrebuilt.OneONoneCall,
      },
      showScreenSharingButton: false,
      onLeaveRoom: () => {
        navigate('/home/chat');
        window.location.reload();
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