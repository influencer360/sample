import React from 'react';

interface IProps {
  index: number;
  value: number;
  children: React.ReactNode;
}

const TabContent = ({ children, value, index, ...extraProps }: IProps) => {
  return (
    <div
      hidden={value !== index}
      id={`tabPanel-${index}`}
      {...extraProps}
    >
      {value === index && <>{children}</>}
    </div>
  );
};

export default TabContent;