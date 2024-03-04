import React from 'react';
import PropTypes from 'prop-types'
import _ from 'underscore';
import MultiSelector from 'hs-nest/lib/components/multiselectors/multi-selector';
import hootbus from 'utils/hootbus';

class CloneStreamsMultiSelector extends React.Component {
    constructor (props) {
        super(props);

        this.state = {
            items: this.props.items
        };

        this._onToggleParent = this._onToggleParent.bind(this);
        this._onToggleChild = this._onToggleChild.bind(this);
        this._onExpandCloseMenu = this._onExpandCloseMenu.bind(this);

        this.multiSelectorProps = {
            onToggleParent: this._onToggleParent,
            onToggle: this._onToggleChild,
            onExpandCloseMenu: this._onExpandCloseMenu,
        };
    }

    /**
     * Toggle a parent multi-selector element
     * Note: This will also update the child elements to reflect the current selection state (all|none)
     * @param parentIndex
     * @param selected
     */
    _onToggleParent (parentIndex, selected) {
        var currentItems = this.state.items;
        var parentItem = currentItems[parentIndex];

        parentItem.selected = selected;

        _.each(parentItem.children, (child) => { child.selected = selected; });

        this.setState({ 'items': currentItems });
    }

    /**
     * Toggle child multi-selector element
     * Note: This will also update the parent element to reflect the current selection state (all|partial|none)
     * @param parentIndex
     * @param childIndex
     * @param selected
     */
    _onToggleChild (parentIndex, childIndex, selected) {
        var currentItems = this.state.items;
        var parentItem = currentItems[parentIndex];
        var childItems = currentItems[parentIndex].children;

        childItems[childIndex].selected = selected;

        // Update the Parent element, if state has changed from all / some children selected
        var childItemCount = _.keys(childItems).length;
        var childItemSelectedCount = 0;

        _.each(childItems, (child) => { if (child.selected) { childItemSelectedCount++; } });

        parentItem.selected = (childItemCount === childItemSelectedCount);

        this.setState({ 'items': currentItems });
    }

    /**
     * Expand / close the multi-selector child menu
     * @param parentIndex
     * @param isExpanded
     */
    _onExpandCloseMenu (parentIndex, isExpanded) {
        var currentItems = this.state.items;

        currentItems[parentIndex].isExpanded = isExpanded;

        // Notify the modal scroll group container that the inner content height has changed
        hootbus.emit(this.props.modalScrollGroupID + ':content:change');

        this.setState({ 'items': currentItems });
    }

    render () {
        return (
            <div className='cloneStreamsMultiSelector'>
                {this.state.items.map((elt, index) => (
                    <MultiSelector index={index} key={index} {...this.multiSelectorProps} {...this.state.items[index]} />
                ))}
            </div>
        );
    }

    componentDidUpdate () {
        this.props.onUpdate();
    }
}

CloneStreamsMultiSelector.displayName = 'CloneStreamsMultiSelector';

var { array, func, string } = PropTypes;

CloneStreamsMultiSelector.propTypes = {
    items: array.isRequired,
    modalScrollGroupID: string, // Parent modal scroll group wrapper id
    onUpdate: func,
};

CloneStreamsMultiSelector.defaultProps = {
    onUpdate: () => {}
};

export default CloneStreamsMultiSelector;
