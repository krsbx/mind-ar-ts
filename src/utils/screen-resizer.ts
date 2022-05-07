const screenResizer = (video: HTMLVideoElement, container: HTMLDivElement) => {
  let vw, vh; // display css width, height
  const videoRatio = video.videoWidth / video.videoHeight;
  const containerRatio = container.clientWidth / container.clientHeight;

  if (videoRatio > containerRatio) {
    vh = container.clientHeight;
    vw = vh * videoRatio;
  } else {
    vw = container.clientWidth;
    vh = vw / videoRatio;
  }

  video.style.top = -(vh - container.clientHeight) / 2 + 'px';
  video.style.left = -(vw - container.clientWidth) / 2 + 'px';
  video.style.width = vw + 'px';
  video.style.height = vh + 'px';

  return {
    vw,
    vh,
  };
};

export default screenResizer;
