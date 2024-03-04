import * as React from 'react';
import styled, { css } from 'styled-components';
import { BouncingBars } from 'fe-comp-loader';
import { getThemeValue, withHsTheme } from 'fe-lib-theme';
import { isInFirst30DayUXExperiment } from 'App';

export const PRIMARY = 'primary';
export const SECONDARY = 'secondary';
export const OUTLINED = 'outlined';
export const TEXT = 'text';
export const SIZE_24 = '24';
export const SIZE_28 = '28';
export const SIZE_32 = '32';
export const SIZE_36 = '36';
export const SIZE_44 = '44';
export const SIZE_60 = '60';
export const HTML_TYPE_BUTTON = 'button';
export const HTML_TYPE_SUBMIT = 'submit';
export const HTML_TYPE_RESET = 'reset';

type Type = typeof PRIMARY | typeof SECONDARY | typeof OUTLINED | typeof TEXT;
type Height = typeof SIZE_24 | typeof SIZE_28 | typeof SIZE_32 | typeof SIZE_36 | typeof SIZE_44 | typeof SIZE_60;
type HtmlType = typeof HTML_TYPE_BUTTON | typeof HTML_TYPE_SUBMIT | typeof HTML_TYPE_RESET;

const BtnStyle = styled.button<{
  width: string;
  height: string;
  isLoading: boolean;
  styleType: Type;
  showFirst30DaysExperiment: boolean;
}>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  font-family: 'Source Sans Pro';
  min-width: 80px;
  max-width: 500px;
  width: ${p => (p.width.toString().match(/\D/) === null ? `${p.width}px` : p.width)};
  height: ${p => (p.height.toString().match(/\D/) === null ? `${p.height}px` : p.height)};
  padding: 0 24px;
  vertical-align: middle;

  font-size: 16px; // TODO: Replace with Theme
  font-weight: 700; // TODO: Replace with Theme
  line-height: 24px; // TODO: Replace with Theme

  text-align: center;
  text-decoration: none;
  text-shadow: none;

  white-space: nowrap;
  user-select: none;

  transition: background-color 0.15s ease-out, border-color 0.1s ease-out;
  position: relative;
  overflow: hidden;
  text-overflow: ellipsis;

  color: #fdfdfd; // TODO: Replace with Theme
  background-color: #012b3a; // TODO: Replace with Theme
  border-radius: ${p => (p.showFirst30DaysExperiment ? '8px' : '2px')};

  &:hover:not([disabled]):not(:active) {
    background-color: #55717b; // TODO: Replace with Theme
    cursor: pointer;
  }

  &:focus {
    outline: 2px solid #0065ff; // TODO: Replace with Theme
  }

  /* Needs to be separate from the focus rule even though they are identical, otherwise
     browsers that don't understand focus-visible would drop the focus rule as well */
  &:focus-visible {
    outline: 2px solid #0065ff; // TODO: Replace with Theme
    box-shadow: none;
  }

  /* Remove the focus indicator on mouse-focus for browsers
     that do support :focus-visible */
  &:focus:not(:focus-visible) {
    box-shadow: none;
  }

  &:active {
    background: #55717b; // TODO: Replace with Theme
  }
  &[disabled] {
    cursor: default;
    pointer-events: none;
    background: #f4f5f6; // TODO: Replace with Theme
    color: #5c5c5c; // TODO: Replace with Theme
  }

  ${p => typeToStyle[p.styleType]}
`;

const secondaryBtnStyle = css`
  background: #e6eaeb;
  color: #012b3a;
  &:hover:not([disabled]):not(:active) {
    background: #d1d5d6; // TODO: Replace with Theme
  }
  &:active {
    background: #8a8e8f; // TODO: Replace with Theme
  }
  &[disabled] {
    background: #f4f5f6; // TODO: Replace with Theme
  }
`;

const outlineButtonStyle = css`
  background: #fdfdfd;
  border: 1px solid #1c1c1c;
  color: #1c1c1c;
  &:hover:not([disabled]):not(:active) {
    background: #f7f8f9; // TODO: Replace with Theme
  }
  &:active {
    background: #eef1f2; // TODO: Replace with Theme
  }
  &[disabled] {
    border: 1px solid #f7f8f9;
    background: #fdfdfd; // TODO: Replace with Theme
  }
`;

const textBtnStyle = css`
  background: #fdfdfd;
  color: #1c1c1c;
  &:hover:not([disabled]):not(:active) {
    background: #f7f8f9; // TODO: Replace with Theme
  }
  &:active {
    background: #eef1f2; // TODO: Replace with Theme
  }
  &[disabled] {
    background: #fdfdfd; // TODO: Replace with Theme
  }
`;

const typeToStyle = {
  [SECONDARY]: secondaryBtnStyle,
  [TEXT]: textBtnStyle,
  [PRIMARY]: '',
  [OUTLINED]: outlineButtonStyle,
};

const Btn = withHsTheme(BtnStyle);

export type ButtonOwnProps = {
  width?: string;
  height?: Height;
  isLoading?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
  type?: Type;
  href?: string;
  htmlType?: HtmlType;
};

type ButtonProps = ButtonOwnProps &
  Omit<React.AnchorHTMLAttributes<HTMLElement> & React.ButtonHTMLAttributes<HTMLElement>, keyof ButtonOwnProps>;

export const Button: React.FunctionComponent<ButtonProps> = ({
  width = 'auto',
  height = SIZE_44,
  isLoading = false,
  type = PRIMARY,
  htmlType = HTML_TYPE_BUTTON,
  ...props
}) => {
  const updatedProps = { ...props };
  const showFirst30DaysExperiment = isInFirst30DayUXExperiment;

  return (
    <Btn
      showFirst30DaysExperiment={showFirst30DaysExperiment}
      {...updatedProps}
      width={width}
      height={height}
      isLoading={isLoading}
      styleType={type}
      type={htmlType}
    >
      {isLoading ? (
        <BouncingBars size={Math.floor(parseInt(height) / 2) + 4} fill={getThemeValue(t => t.colors.button.text)} />
      ) : (
        props.children
      )}
    </Btn>
  );
};
