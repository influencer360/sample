import React from 'react';
import styled from 'styled-components';
import breakpoints from 'utils/breakpoints';

type SectionHeaderProps = {
  children: React.ReactNode;
};

const StyledH2 = styled.h3`
  border-bottom: 1px solid #e6eaeb;
  font-weight: 600;
  margin-top: 35px;
  margin-bottom: -16px;
  padding-bottom: 28px;
  width: 100%;

  @media only screen and (max-width: ${breakpoints.breakpointMd}) {
    margin-bottom: 0px;
  }
`;

const SectionHeader = (props: SectionHeaderProps) => <StyledH2>{props.children}</StyledH2>;

export default SectionHeader;
