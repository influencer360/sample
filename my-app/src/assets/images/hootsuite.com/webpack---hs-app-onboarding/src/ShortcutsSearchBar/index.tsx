import React, { ReactElement, useEffect, useState } from 'react';
import {
  KBarPortal,
  KBarPositioner,
  KBarAnimator,
  KBarSearch,
  KBarResults,
  useMatches,
  useRegisterActions,
  Action,
} from 'kbar';
import styled from 'styled-components';
import { getThemeValue, withHsTheme } from 'fe-lib-theme';
import { provisionIndex } from 'fe-lib-zindex';
import { KeyEventMap } from 'typings/keyEventMap';
import { getContextualShortcuts } from '../constants/keyEventMap';
import { useDashboardState } from '../hooks/useDashboardState';

const getOsSpecificShortcut = (shortcut: string) => {
  // TODO: revisit use of navigator.platform once browser adoption of navigator.userAgentData.platform is more common
  // https://developer.mozilla.org/en-US/docs/Web/API/NavigatorUAData/platform
  return window?.navigator?.platform?.toUpperCase().indexOf('MAC') < 0 ? shortcut.replace('⌘', 'Ctrl') : shortcut;
};

const RenderResults = () => {
  const { results } = useMatches();

  return (
    <ResultsContainer>
      <KBarResults
        items={results}
        onRender={({ item, active }) =>
          typeof item === 'string' ? (
            <SearchResultLabel>
              <span>{item}</span>
            </SearchResultLabel>
          ) : (
            <SearchResult active={active}>
              <span>{item.name}</span>
              {item.shortcut && <Shortcut>{getOsSpecificShortcut(item.shortcut[0])}</Shortcut>}
            </SearchResult>
          )
        }
      />
    </ResultsContainer>
  );
};

const SearchContainer = styled.div`
  padding: 8px;
`;

const StyledKBarSearch = withHsTheme(styled(KBarSearch)`
  padding: 8px;
  height: 40px;
  width: 340px;
  font-size: ${() => getThemeValue(t => t.typography.body.size)};
  color: ${() => getThemeValue(t => t.colors.input.text)};
  outline: 0;
  border: 0;
  box-shadow: none;
  background: transparent;
`);

const ResultsContainer = styled.div`
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
`;

const StyledKBarPositioner = styled(KBarPositioner)`
  z-index: ${() => provisionIndex()};
  background: rgba(36, 31, 33, 0.75);
`;

const SearchAndResults = withHsTheme(styled.div`
  display: flex;
  flex-direction: column;
  min-height: 200px;
  background: ${() => getThemeValue(t => t.colors.popover.background)};
  border-radius: 8px;
`);

const SearchResult = withHsTheme(styled.div<{ active: boolean }>`
  background: ${p => (p.active ? () => getThemeValue(t => t.colors.accent20) : 'transparent')};
  color: ${() => getThemeValue(t => t.colors.menuItem.text)};
  padding: 12px;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`);

const Shortcut = withHsTheme(styled.span`
  border: 1px solid ${() => getThemeValue(t => t.colors.darkGrey20)};
  text-align: center;
  border-radius: 4px;
  padding: 2px;
  min-width: 60px;
`);

const SearchResultLabel = withHsTheme(styled.div`
  padding: 4px;
  font-size: 12px;
  color: ${() => getThemeValue(t => t.colors.darkGrey40)};
`);

const KBarContextualActionsManager = ({ children }: { children: ReactElement }) => {
  const { dashboardState, composerState } = useDashboardState();
  const [contextualActions, setContextualActions] = useState<Action[]>([]);

  useRegisterActions(contextualActions, [contextualActions]);

  useEffect(() => {
    const contextualActionArray: Action[] = [];
    getContextualShortcuts(composerState, dashboardState, 'kbar').forEach(keyEventSet => {
      keyEventSet.keyEvents.forEach((keyEventMap: KeyEventMap) => {
        const contextualEvent: Action = keyEventMap;
        contextualEvent.section = {
          name: keyEventSet.name,
          priority: keyEventSet.priority || 9,
        };
        contextualActionArray.push(contextualEvent);
      });
    });
    setContextualActions(contextualActionArray);
  }, [composerState, dashboardState]);

  return children;
};

const ShortcutsSearchBar = () => {
  return (
    <KBarContextualActionsManager>
      <KBarPortal>
        <StyledKBarPositioner>
          <KBarAnimator>
            <SearchAndResults>
              <SearchContainer>
                <StyledKBarSearch />
              </SearchContainer>
              <RenderResults />
            </SearchAndResults>
          </KBarAnimator>
        </StyledKBarPositioner>
      </KBarPortal>
    </KBarContextualActionsManager>
  );
};

export default ShortcutsSearchBar;
