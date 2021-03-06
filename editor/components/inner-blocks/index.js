/**
 * External dependencies
 */
import { pick } from 'lodash';
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { withContext } from '@wordpress/components';
import { withViewportMatch } from '@wordpress/viewport';
import { Component, compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { synchronizeBlocksWithTemplate } from '@wordpress/blocks';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import './style.scss';
import BlockList from '../block-list';
import { withBlockEditContext } from '../block-edit/context';

class InnerBlocks extends Component {
	componentDidUpdate() {
		this.updateNestedSettings();
	}

	componentDidMount() {
		this.updateNestedSettings();
		this.insertTemplateBlocks( this.props.template );
	}

	insertTemplateBlocks( template ) {
		const { block, insertBlocks } = this.props;
		if ( template && ! block.innerBlocks.length ) {
			// synchronizeBlocksWithTemplate( [], template ) parses the template structure,
			// and returns/creates the necessary blocks to represent it.
			insertBlocks( synchronizeBlocksWithTemplate( [], template ) );
		}
	}

	updateNestedSettings() {
		const {
			blockListSettings,
			allowedBlocks,
			templateLock,
			parentLock,
			updateNestedSettings,
		} = this.props;

		const newSettings = {
			allowedBlocks,
			templateLock: templateLock === undefined ? parentLock : templateLock,
		};

		if ( ! isShallowEqual( blockListSettings, newSettings ) ) {
			updateNestedSettings( newSettings );
		}
	}

	render() {
		const {
			uid,
			layouts,
			allowedBlocks,
			templateLock,
			template,
			isSmallScreen,
			isSelectedBlockInRoot,
		} = this.props;

		const classes = classnames( 'editor-inner-blocks', {
			'has-overlay': isSmallScreen && ! isSelectedBlockInRoot,
		} );

		return (
			<div className={ classes }>
				<BlockList
					rootUID={ uid }
					{ ...{ layouts, allowedBlocks, templateLock, template } }
				/>
			</div>
		);
	}
}

InnerBlocks = compose( [
	withBlockEditContext( ( context ) => pick( context, [ 'uid' ] ) ),
	withViewportMatch( { isSmallScreen: '< medium' } ),
	withSelect( ( select, ownProps ) => {
		const {
			isBlockSelected,
			hasSelectedInnerBlock,
			getBlock,
			getBlockListSettings,
			getBlockRootUID,
			getTemplateLock,
		} = select( 'core/editor' );
		const { uid } = ownProps;
		const parentUID = getBlockRootUID( uid );
		return {
			isSelectedBlockInRoot: isBlockSelected( uid ) || hasSelectedInnerBlock( uid ),
			block: getBlock( uid ),
			blockListSettings: getBlockListSettings( uid ),
			parentLock: getTemplateLock( parentUID ),
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		const { insertBlocks, updateBlockListSettings } = dispatch( 'core/editor' );
		const { uid } = ownProps;

		return {
			insertBlocks( blocks ) {
				dispatch( insertBlocks( blocks, undefined, uid ) );
			},
			updateNestedSettings( settings ) {
				dispatch( updateBlockListSettings( uid, settings ) );
			},
		};
	} ),
] )( InnerBlocks );

InnerBlocks.Content = ( { BlockContent } ) => {
	return <BlockContent />;
};

InnerBlocks.Content = withContext( 'BlockContent' )()( InnerBlocks.Content );

export default InnerBlocks;
