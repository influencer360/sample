import React from 'react';
import styled from 'styled-components';

type SocialPostImagesProps = {
  images: string[];
};

const Overlay = styled.div<{ show: boolean }>`
  display: ${p => (p.show ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  color: #fdfdfd;
  background: rgba(0, 0, 0, 0.4);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

const SocialPostImagesContainer = styled.div<{ imageCount?: number }>`
  max-width: 200px;
  height: 132px;
  display: grid;
  grid-template-columns: repeat(min(${p => p.imageCount}, 4), 1fr);
  gap: 2px;
  overflow: hidden;
`;
const OverlayContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const ImageWrapper = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const renderImage = (imageUrl: string, index: number) => <ImageWrapper key={index} src={imageUrl} alt="" />;

const renderOverlay = (index: number, arr: string[]) => (
  <OverlayContainer>
    {renderImage(arr[index], index)}
    <Overlay show={true}>+{arr.length - index - 1}</Overlay>
  </OverlayContainer>
);

const SocialPostImages = ({ images }: SocialPostImagesProps) => {
  const imageCount = images.length;
  const showOverlay = images.length > 4;

  if (imageCount > 0) {
    return (
      <>
        {showOverlay ? (
          <SocialPostImagesContainer imageCount={imageCount}>
            {images.map((imageUrl, index, arr) => {
              if (index > 3) {
                return;
              } else if (index === 3) {
                return renderOverlay(index, arr);
              } else {
                return renderImage(imageUrl, index);
              }
            })}
          </SocialPostImagesContainer>
        ) : (
          <SocialPostImagesContainer imageCount={imageCount}>
            {images.map((imageUrl, index) => renderImage(imageUrl, index))}
          </SocialPostImagesContainer>
        )}
      </>
    );
  }
  return null;
};

export default SocialPostImages;
