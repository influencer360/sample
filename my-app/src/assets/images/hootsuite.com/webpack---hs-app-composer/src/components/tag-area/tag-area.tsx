import React from 'react'
import { noop } from 'lodash'
import get from 'lodash/get'

import axios from 'fe-axios'
import { Banner, TYPE_WARNING } from 'fe-comp-banner'
import { CTA, PRIMARY } from 'fe-comp-button'
import { Combobox } from 'fe-comp-combobox'
import { NONE } from 'fe-comp-list-item'
import { on, off } from 'fe-lib-hootbus'
import { logError } from 'fe-lib-logging'
import { createTag, getTagsByOrganizationId } from 'fe-pnc-lib-api'
import translation from 'fe-pnc-lib-hs-translation'
import { keyboardEventHandler, ENTER } from 'fe-pnc-lib-keyboard-events'

import { TitleText } from '@/components/composer/composer-panels/message-edit-area/title-text'
import { KEYBOARD_SHORTCUTS_EVENTS } from '@/constants/events'
import LOGGING_CATEGORIES from '@/constants/logging-categories'
import { Flux } from '@/typings/Flux'
import { Tag } from '@/typings/Message'
import statusObject, { StatusObject } from '@/utils/status-bar'

import { isDefinedAndNotEmpty, isTagInTags, mapTagsToPills, normalizeNewTag } from './helpers'
import {
  AddTagLink,
  AppliedTags,
  ApplyButton,
  CancelButton,
  CreateIcon,
  EditTagButtonsWrapper,
  EditTagLink,
  EditTagWrapper,
  FooterItemWrapper,
  InstagramTagInfoBannerContainer,
  ManageTagLink,
  NoTagApplied,
  RecapTagWrapper,
  TagHeader,
} from './tag-area.style'

const EDIT = translation._('Edit')
const ADD = translation._('Add')
const CANCEL = translation._('Cancel')
const APPLY_TAGS = translation._('Add')
const ADD_TAG = translation._('Add tags')
const EDIT_TAG = translation._('Edit Tags')
const UNABLE_TO_RETRIEVE_TAGS = translation._('Unable to retrieve tags')
const TAG_EXISTS = translation._('Tag cannot be created - tag already exists')
const UNABLE_TO_CREATE_TAG = translation._('Unable to create tag')
const TAGS = translation._('Tags')
const NO_TAGS_APPLIED = translation._('No tags added.')
const ALL_TAGS = translation._('ALL TAGS')
const SUGGESTED_TAGS = translation._('SUGGESTED TAGS')
const MANAGE_TAGS = translation._('Manage tags')
const CREATE_TAG = translation._('Create tag "%s1"')
// prettier-ignore
const NO_TAG_ANALYTICS_IG_PUSH = translation._('Tags are not applied when you publish via mobile notification. You can add tags from the My Posts stream after you publish.')

interface TagAreaProps {
  shouldShowInstagramWarning?: boolean
  appliedTags: {
    name: string
    id: number
  }[]
  canManageTags?: boolean
  flux: Flux
  isSequentialPostingInProgress: boolean
  onChange?(tags: Tag[]): void
  onDone(tags: Tag[]): void
  onManageTags(): void
  organizationId: number
  scrollToParent(): void
  suggestedTags: Tag[]
  tagsToSelect: Tag[]
}

class TagArea extends React.PureComponent<TagAreaProps> {
  static displayName = 'TagArea'

  static defaultProps = {
    shouldShowInstagramWarning: false,
    canManageTags: false,
    suggestedTags: [],
    onChange: () => {},
    onDone: () => {},
  }

  unsubscribeObservers: Array<() => void>
  statusObject: StatusObject

  constructor(props) {
    super(props)

    this.tagActions = props.flux.getActions('tags')

    this.statusObject = statusObject

    this.state = {
      editingMode: false,
      searchResults: [],
      searchQuery: '',
      selectedTags: [],
      queryTagsToSelect: [],
    }

    this.unsubscribeObservers = [noop]
  }

  componentDidUpdate(prevProps: TagAreaProps) {
    if (this.props.organizationId !== prevProps.organizationId) {
      this.onCancel()
    }

    if (!this.props.isSequentialPostingInProgress && prevProps.isSequentialPostingInProgress) {
      this.onCancel()
    }

    if (this.state.editingMode === false) {
      on(KEYBOARD_SHORTCUTS_EVENTS.TOGGLE_TAGS_SEARCH, this.onEditClick)
      off(KEYBOARD_SHORTCUTS_EVENTS.TOGGLE_TAGS_SEARCH, this.onCancel)
    } else if (this.state.editingMode === true) {
      on(KEYBOARD_SHORTCUTS_EVENTS.TOGGLE_TAGS_SEARCH, this.onCancel)
      off(KEYBOARD_SHORTCUTS_EVENTS.TOGGLE_TAGS_SEARCH, this.onEditClick)
    }
  }

  componentDidMount() {
    on(KEYBOARD_SHORTCUTS_EVENTS.TOGGLE_TAGS_SEARCH, this.onEditClick)

    return () => {
      off(KEYBOARD_SHORTCUTS_EVENTS.TOGGLE_TAGS_SEARCH, this.onEditClick)
    }
  }

  componentWillUnmount() {
    return () => {
      off(KEYBOARD_SHORTCUTS_EVENTS.TOGGLE_TAGS_SEARCH, this.onEditClick)
      off(KEYBOARD_SHORTCUTS_EVENTS.TOGGLE_TAGS_SEARCH, this.onCancel)
    }
  }

  onEditClick = () => {
    const { appliedTags, scrollToParent } = this.props
    this.setState({ editingMode: true, selectedTags: appliedTags }, scrollToParent())
  }

  onDone = () => {
    const tagsToUpdate = this.state.selectedTags

    this.setState({
      editingMode: false,
      searchQuery: '',
      selectedTags: [],
    })

    this.props.onDone(tagsToUpdate)
  }

  onCancel = () => {
    this.setState({
      editingMode: false,
      searchQuery: '',
      selectedTags: [],
    })
  }

  onTagClick = (e, clickedTag) => {
    const { selectedTags } = this.state

    const newSelectedTags = isTagInTags(clickedTag, selectedTags)
      ? selectedTags.filter(({ id }) => id !== clickedTag.id)
      : [...selectedTags, { name: clickedTag.title, id: clickedTag.id }]

    this.setState({ selectedTags: newSelectedTags })

    if (this.props.onChange) {
      this.props.onChange(newSelectedTags)
    }
  }

  onQuery = searchQuery =>
    getTagsByOrganizationId(this.props.organizationId, searchQuery)
      .then(data => {
        this.setState({ queryTagsToSelect: data, searchQuery })
      })
      .catch(e => {
        if (!axios.isCancel(e)) {
          this.statusObject.update(UNABLE_TO_RETRIEVE_TAGS, 'error', true)
          logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'Failed during tag search', {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
          })
        }
      })

  createTag = tagText => {
    const { onChange, organizationId } = this.props
    return createTag(organizationId, tagText)
      .then(tagCreated => {
        this.tagActions.addTag(tagCreated)

        const { selectedTags } = this.state
        const newSelectedTags = [...selectedTags, normalizeNewTag(tagCreated)]
        this.setState({
          selectedTags: newSelectedTags,
        })

        if (onChange) {
          onChange(newSelectedTags)
        }
      })
      .catch(e => {
        if (!axios.isCancel(e)) {
          if (get(e, 'details[0].message') === 'This tag already exists') {
            this.statusObject.update(TAG_EXISTS, 'error', true)
          } else {
            this.statusObject.update(UNABLE_TO_CREATE_TAG, 'error', true)
          }
          logError(LOGGING_CATEGORIES.NEW_COMPOSER, 'Failed during create tag', {
            errorMessage: JSON.stringify(e.message),
            stack: JSON.stringify(e.stack),
          })
        }
      })
  }

  getTagsToSelect() {
    const { searchQuery, queryTagsToSelect } = this.state
    const { tagsToSelect } = this.props

    return isDefinedAndNotEmpty(searchQuery) ? queryTagsToSelect : tagsToSelect
  }

  renderHeader() {
    const { editingMode } = this.state
    const { appliedTags } = this.props
    return (
      <TagHeader>
        <TitleText>{TAGS}</TitleText>
        {!editingMode && (
          <EditTagLink
            onClick={this.onEditClick}
            onKeyDown={keyboardEventHandler({
              [ENTER]: this.onEditClick,
            })}
            role="button"
            tabIndex="0"
            aria-label={appliedTags.length > 0 ? EDIT_TAG : ADD_TAG}
          >
            {appliedTags.length > 0 ? EDIT : ADD}
          </EditTagLink>
        )}
      </TagHeader>
    )
  }

  renderTagsList() {
    const { appliedTags } = this.props
    const hasAppliedTags = appliedTags.length > 0

    const recapTags = hasAppliedTags ? (
      <AppliedTags className="-tagDisplayArea">{appliedTags.map(t => t.name).join(', ')}</AppliedTags>
    ) : (
      <NoTagApplied className="-tagDisplayArea">{NO_TAGS_APPLIED}</NoTagApplied>
    )
    return <RecapTagWrapper>{recapTags}</RecapTagWrapper>
  }

  renderComboboxFooter() {
    const { searchQuery } = this.state
    const { tagsToSelect } = this.props
    const canCreateTag = isDefinedAndNotEmpty(searchQuery) && !isTagInTags(searchQuery, tagsToSelect)

    return (
      <div>
        {canCreateTag && (
          <FooterItemWrapper>
            <AddTagLink onClick={() => this.createTag(searchQuery)}>
              <CreateIcon />
              {CREATE_TAG.replace('%s1', searchQuery)}
            </AddTagLink>
          </FooterItemWrapper>
        )}

        {this.props.canManageTags && (
          <FooterItemWrapper>
            <ManageTagLink onClick={this.props.onManageTags}>{MANAGE_TAGS}</ManageTagLink>
          </FooterItemWrapper>
        )}
      </div>
    )
  }

  renderEditTags() {
    const { suggestedTags, shouldShowInstagramWarning } = this.props
    const { selectedTags } = this.state

    const suggestedItems =
      suggestedTags.length > 0
        ? [
            { heading: true, text: SUGGESTED_TAGS, active: false, id: SUGGESTED_TAGS },
            ...mapTagsToPills(suggestedTags, selectedTags),
          ]
        : []
    const tagsToSelectWithoutSuggested = this.getTagsToSelect().filter(
      tagToSelectItem => !isTagInTags(tagToSelectItem, suggestedTags),
    )

    const allItems = [
      { heading: true, text: ALL_TAGS, active: false, id: ALL_TAGS },
      ...mapTagsToPills(tagsToSelectWithoutSuggested, selectedTags),
    ]
    const items = [...suggestedItems, ...allItems]

    const activePills = mapTagsToPills(selectedTags, selectedTags)

    return (
      <EditTagWrapper className="-tagEditArea">
        <Combobox
          placeholder={ADD_TAG}
          activePills={activePills}
          items={items}
          onClick={this.onTagClick}
          onQuery={this.onQuery}
          dropdownOpenOnClick={true}
          footer={this.renderComboboxFooter()}
          selectType={NONE}
          width={'100%'}
          className="-tagInputArea"
          id="tag-area-combobox"
        />
        <EditTagButtonsWrapper>
          <CancelButton onClick={this.onCancel} type={PRIMARY}>
            {CANCEL}
          </CancelButton>
          <ApplyButton btnStyle="action" onClick={this.onDone} type={CTA}>
            {APPLY_TAGS}
          </ApplyButton>
        </EditTagButtonsWrapper>
        {shouldShowInstagramWarning && (
          <InstagramTagInfoBannerContainer>
            <Banner type={TYPE_WARNING} messageText={NO_TAG_ANALYTICS_IG_PUSH} />
          </InstagramTagInfoBannerContainer>
        )}
      </EditTagWrapper>
    )
  }

  render() {
    const { editingMode } = this.state

    return (
      <div className="rc-TagArea">
        {this.renderHeader()}
        {editingMode ? this.renderEditTags() : this.renderTagsList()}
      </div>
    )
  }
}

export default TagArea
