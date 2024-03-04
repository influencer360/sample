import React from 'react';
import PropTypes from 'prop-types';
import translation from 'hs-nest/lib/utils/translation';
import { PaymentsIFrame } from 'fe-pg-comp-payments-iframe';
import { Banner, TYPE_ERROR } from 'fe-comp-banner';

class AppDirectoryPciContainer extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            showStateZip: false,
            errorMessage: '',
            display: true,
            isFormSubmitted: false,
        };
        this.onValidCreditCard = this.onValidCreditCard.bind(this);
        this.onInvalidCreditCard = this.onInvalidCreditCard.bind(this);
        this.handleSubmitClick = this.handleSubmitClick.bind(this);
        this.onFormPostSuccess = this.onFormPostSuccess.bind(this);
        this.reduce = this.reduce.bind(this);

        this.genericErrorMessage = translation._('Error updating payment method: please check card details.');
        this.countriesRequiringStateZip = ['CA', 'US', 'AU'];
    }

    handleSubmitClick() {
        if (!this.state.hasValidCreditCard) {
            this.setState({
                errorMessage: this.genericErrorMessage
            }, () => { window.scrollTo(0, 0); });
            billing.removeThrobbers();
            return;
        }

        // hide the payframe when processing payment information
        this.setState({
            display: false,
            errorMessage: ''
        });

        // submitPayment calls the callback after saving billing address, payment isn't actually submitted here
        // TODO keep track of address validation so we can fail without ajax call
        // TODO right now we have no indication to user of invalid postal code format etc
        billing.submitPayment((isSuccess) => {
            if (isSuccess) {
                this.setState({
                    configMessage: this.props.configMessage,
                }, () => {
                    // this triggers PaymentsIFrame's submit (must be done last)
                    this.setState({
                        isFormSubmitted: true,
                    });
                });
            } else {
                this.setState({
                    display: true,
                    errorMessage: translation._('Error submitting form: invalid billing address.')
                });
            }
        });
    }

    onValidCreditCard() {
        this.setState({
            hasValidCreditCard: true
        });
    }

    onInvalidCreditCard() {
        this.setState({
            hasValidCreditCard: false
        });
    }

    onFormPostSuccess(data) {
        // data from billing-complete after submitting cc info
        if (!data.success) {
            this.setState({
                errorMessage: this.genericErrorMessage,
                hasValidCreditCard: false,
                isFormSubmitted: false,
                display: true,
            });
        }
    }

    reduce(field) {
        return (event) => {
            const value = event.target.value;
            this.setState({
                [field]: value
            });
            if (field === 'country') {
                if (this.countriesRequiringStateZip.includes(value)) {
                    this.setState({ showStateZip: true });
                } else {
                    this.setState({ showStateZip: false });
                }
            }
        };
    }

    renderBillingCountries() {
        var countries = this.props.billingCountries.map((country, i) => {
            return (
                <option key={i} value={country[0]}>{country[1]}</option>
            );
        });

        return (
            <div className='-formElement -billingCountry'>
                <label htmlFor='billingCountry' className='title'>{translation._('Billing Address')}</label>
                <select name='billing_country' id='billingCountry' className='_billingCountry'
                        value={this.state.country} onChange={this.reduce('country')}>
                    <option>{translation._('Select Country')}</option>
                    {countries}
                </select>
            </div>
        );
    }

    renderStateZipContainer() {
        return (
            <div>
                <div id='billingStateContainer' className='-formElement -billingState'>
                    <label htmlFor='billingState' className='title'>{translation._('State/Province')}</label>
                    <input id='billingState' className='_billingState' type='text' name='billing_state'
                           value={this.state.state} onChange={this.reduce('state')}/>
                </div>

                <div id='billingZipContainer' className='-formElement -billingZip'>
                    <label htmlFor='billingZip' className='title'>{translation._('Zip/Postal Code:')}</label>
                    <input type='text' name='billing_zip' id='billingZip' className='_billingZip' style={{width:'80px'}}
                           value={this.state.zip} onChange={this.reduce('zip')} />
                    <p className='formError _postalCodeError' style={{color: 'red'}} />
                </div>
            </div>
        )
    }

    renderAddressFields() {
        return (
            <div>
                {this.renderBillingCountries()}
                {this.state.showStateZip ? this.renderStateZipContainer() : null}
            </div>
        );
    }

    renderError() {
        return (
            <div className='-billingError'>
                <Banner messageText={this.state.errorMessage} type={TYPE_ERROR} />
            </div>
        );
    }

    renderSubmitButton() {
        return (
            <div className='-billingSubmit'>
                <button id='submitPaymentBtn' className='btn-cta btn-type1 -submitPaymentBtn _submitPaymentBtn' onClick={this.handleSubmitClick}>
                    {translation._('Submit')}
                </button>
            </div>
        );
    }

    renderPayframe() {
        return (
            <PaymentsIFrame
                configMessage={this.state.configMessage}
                language={this.props.language}
                onValidCreditCard={this.onValidCreditCard}
                onInvalidCreditCard={this.onInvalidCreditCard}
                onFormPostSuccess={this.onFormPostSuccess}
                isFormSubmitted={this.state.isFormSubmitted}
            />
        );
    }

    render() { // TODO fix dropdown -> iframe height visuals
        return (
            <div className='ui-form -billingAddress'>
                {!!this.state.errorMessage ? this.renderError() : null}
                {!this.state.display ? (<p>{translation._('Processing, please wait') + '...'}</p>) : null}
                <div style={{display: (this.state.display ? 'initial' : 'none')}}>
                    {this.renderPayframe()}
                    <p id='addressError' className='formError' style={{color: 'red'}} />
                    {this.renderAddressFields()}
                    <br />
                </div>
                {this.renderSubmitButton()}
            </div>
        );
    }
}

const { number, string, array } = PropTypes;

AppDirectoryPciContainer.defaultProps = {
    billingCountries: [],
};

AppDirectoryPciContainer.propTypes = {
    billingCountries: array,
    language: string,
    configMessage: PropTypes.shape({
        clientNumber: string.isRequired,
        collectionAmount: string.isRequired,
        collectionGroupId: PropTypes.oneOfType([string, number]),
        mode: string.isRequired,
        sessionId: string.isRequired
    })
};

export default AppDirectoryPciContainer;
