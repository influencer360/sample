import React from 'react';
import styled from 'styled-components';
import { Card } from 'fe-comp-card';
import breakpoints from 'utils/breakpoints';
import { Button, OUTLINED } from '../../components/Button';
import { limitText } from '../../utils/limitText';

const Container = styled(Card)`
  font-family: 'Source Sans Pro';
  box-sizing: border-box;
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  padding: 16px;
  gap: 16px;
  width: 600px;
  background: #fdfdfd; // TODO: Replace with Theme
  border: 1px solid #e6eaeb; // TODO: Replace with Theme
  border-radius: 8px;
  height: 232px;
  cursor: default;
  &:hover {
    outline: none;
    transform: none;
    box-shadow: none;
  }

  @media only screen and (max-width: ${breakpoints.breakpointMd}) {
    width: 400px;
    height: 491px;
    flex-direction: column;
  }
`;

const ContentContainer = styled.div`
  width: auto;
  flex-grow: 1;
  flex-shrink: 2;
  display: flex;
  flex-direction: column;
`;

const ImageContainer = styled.div`
  display: flex;
  justify-content: center;
  min-width: 267px;
  height: 200px;
  align-self: center;
`;
const AnnouncementImage = styled.img`
  height: 100%;
  object-fit: cover;
`;
const Title = styled.div`
  font-family: 'Source Sans Pro';
  font-style: normal;
  font-weight: 600;
  font-size: 24px;
  line-height: 36px;
  color: #1c1c1c; // TODO: Replace with Theme
  margin-bottom: 8px;
`;

const Description = styled.div`
  font-style: normal;
  font-weight: 400;
  font-size: 14px;
  line-height: 24px;
  color: #1c1c1c; // TODO: Replace with Theme
  margin-bottom: 8px;
`;

const CTAText = styled.span`
  font-style: normal;
  font-weight: 700;
  font-size: 16px;
  line-height: 20px;
  display: flex;
  align-items: center;
  text-align: center;
  color: #1c1c1c; // TODO: Replace with Theme
`;

export type AnnouncementCardProps = {
  title: string;
  description: string;
  cta: string;
  image: string;
  imageAlt: string;
  handleClick: () => void;
};

const AnnouncementCard = ({ title, description, cta, image, imageAlt, handleClick }: AnnouncementCardProps) => {
  return (
    <Container>
      <ImageContainer>
        <AnnouncementImage alt={imageAlt} src={image} />
      </ImageContainer>
      <ContentContainer>
        <Title>{limitText(title, 80)}</Title>
        <Description>{limitText(description, 130)}</Description>
        <Button type={OUTLINED} onClick={handleClick} width="fit-content">
          <CTAText>{cta}</CTAText>
        </Button>
      </ContentContainer>
    </Container>
  );
};

export default AnnouncementCard;
