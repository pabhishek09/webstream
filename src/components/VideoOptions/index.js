import ScreenshareIcon from '../../assets/icons/source_icons_chromecast-active.svg';
import EndcallIcon from '../../assets/icons/source_icons_end-call.svg';
import ShowMessageIcon from '../../assets/icons/source_icons_message_show.svg';
import HideMessageIcon from '../../assets/icons/source_icons_message_hide.svg';
import MuteIcon from '../../assets/icons/source_icons_mute.svg';
import UnmuteIcon from '../../assets/icons/source_icons_unmute.svg'
import StartVideoIcon from '../../assets/icons/source_icons_video_start.svg';
import StopVideoIcon from '../../assets/icons/source_icons_video_stop.svg'
import './style.css';


const VideoOptions = (props) => {
  return (
    <div className="flex pb-8">
      {props.audio
        ? <Icon src={MuteIcon} alt='mute-icon' handleClick={props.onToggleAudio}/>
        : <Icon src={UnmuteIcon} alt='unmute-icon' handleClick={props.onToggleAudio}/>
      }
      {
        props.video
        ? <Icon src={StartVideoIcon} alt='start-video-icon' handleClick={props.onToggleVideo}/>
        : <Icon src={StopVideoIcon} alt='stop-video-icon' handleClick={props.onToggleVideo}/>
      }
      <Icon src={EndcallIcon} alt='end-call-icon' handleClick={props.onEndCall}/>
      <Icon src={ScreenshareIcon} alt='start-share-icon'/>
      {
        props.showMsgTab
        ? <Icon src={ShowMessageIcon} alt='show-message-icon' handleClick={props.onToggleMsgTab}/>
        : <Icon src={HideMessageIcon} alt='hide-message-icon' handleClick={props.onToggleMsgTab}/>
      }
    </div>
    
  )
};

export default VideoOptions;

const Icon = ({src, alt, handleClick}) => {
  return (
    <img className="px-2 video-icon" src={src} alt={alt} onClick={handleClick}/>
  )
};
