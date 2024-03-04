/**
 * @format
 * @preventMunge
 */

import './opt-in-modal.less'

import PropTypes from 'prop-types'
import React from 'react'
import ajaxPromise from 'hs-nest/lib/utils/ajax-promise'
import { Button, CTA, SECONDARY } from 'fe-comp-button'
import SimpleModal from 'hs-nest/lib/components/modal/simple-modal'
import translation from 'hs-nest/lib/utils/translation'
import Icon from '@fp-icons/icon-base'
import IconCheck from '@fp-icons/symbol-check'
import IconImage from '@fp-icons/emblem-image'
import IconLink from '@fp-icons/emblem-link'

export default class OptInModal extends React.Component {
  constructor(props) {
    super(props)

    this.setNewVersion = this.setNewVersion.bind(this)
    this.renderFooter = this.renderFooter.bind(this)

    this.state = {
      isLoading: false,
    }
  }

  setNewVersion() {
    if (!this.props.url) {
      this.props.onSetVersionSuccess()
      this.props.onClose()
      return null
    }
    this.setState({
      isLoading: true,
    })
    return ajaxPromise(
      {
        type: 'POST',
        url: this.props.url,
        data: { newVersion: this.props.newVersion },
      },
      'q1',
    ).then(
      () => {
        this.setState({
          isLoading: false,
        })
        this.props.onSetVersionSuccess()
        this.props.onClose()
      },
      () => {
        this.setState({
          isLoading: false,
        })
        this.props.onSetVersionFailure()
        this.props.onClose()
      },
    )
  }

  renderFooter() {
    return (
      <div className="-optInFooter">
        <Button type={SECONDARY} className="-cancelButton" onClick={() => this.props.onClose()}>
          {this.props.cancelButtonText}
        </Button>
        <Button
          type={CTA}
          className="-confirmButton"
          isLoading={this.state.isLoading}
          onClick={() => this.setNewVersion()}
        >
          {this.props.confirmButtonText}
        </Button>
      </div>
    )
  }

  render() {
    return (
      <div className="rc-OptInModal">
        <SimpleModal
          className="opt-in-modal"
          enableScrollableContent={false}
          footerContent={this.renderFooter()}
          hasBackdrop={'static'}
          onRequestHide={this.props.onClose}
          titleText={
            !this.props.isBeta
              ? this.props.title
              : [
                  this.props.title,
                  <span className="-betaTag" key="betaTag">
                    BETA
                  </span>,
                ]
          }
          width={`${this.props.width}px`}
        >
          <div>
            <p className="-optInDescription">
              {translation._(
                'Bulk Message Uploader is evolving to become Bulk Composer: an improved tool to make your composer experience even better.',
              )}
            </p>
            <p className="-optInDescription">
              {translation._('Stay organized. Save time and schedule multiple messages.')}
            </p>
            <div className="-optInIconsWithText">
              <div className="-reviewMessages">
                <Icon glyph={IconCheck} size={40} />
                <p className="-text">{translation._('Review messages and fix errors')}</p>
              </div>
              <div className="-images">
                <Icon glyph={IconImage} size={40} />
                <p className="-text">{translation._('Add images')}</p>
              </div>
              <div className="-linkPreview">
                <Icon glyph={IconLink} size={40} />
                <p className="-text">{translation._('Customize link previews')}</p>
              </div>
            </div>
          </div>
        </SimpleModal>
      </div>
    )
  }
}

OptInModal.propTypes = {
  cancelButtonText: PropTypes.string,
  children: PropTypes.any,
  confirmButtonText: PropTypes.string,
  isBeta: PropTypes.bool,
  newVersion: PropTypes.number.isRequired,
  onClose: PropTypes.func.isRequired,
  onSetVersionFailure: PropTypes.func.isRequired,
  onSetVersionSuccess: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  url: PropTypes.string,
  width: PropTypes.string,
}

OptInModal.defaultProps = {
  cancelButtonText: translation._('Cancel'),
  confirmButtonText: translation._('OK'),
  isBeta: false,
  width: '500',
}

OptInModal.displayName = 'Opt-in Modal'
