import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Lightbox from 'react-image-lightbox';
import { Link } from 'react-router-dom';
import { Icon } from 'antd';
import ObjectAvatar, { getObjectUrl } from './ObjectAvatar';
import AppendModal from '../object/AppendModal';

export default class ObjectLightbox extends Component {
  static propTypes = {
    wobject: PropTypes.shape(),
    size: PropTypes.number,
    accessExtend: PropTypes.bool,
  };

  static defaultProps = {
    wobject: undefined,
    accessExtend: false,
    size: 100,
  };

  state = {
    open: false,
  };

  handleAvatarClick = () => this.setState({ open: true });

  handleCloseRequest = () => this.setState({ open: false });

  render() {
    const { wobject, size, accessExtend } = this.props;
    let imageUrl = getObjectUrl(wobject);
    let isFieldAvatarImage = true;
    if (!imageUrl) {
      imageUrl = 'https://steemitimages.com/u/waivio/avatar';
      isFieldAvatarImage = false;
    }

    return (
      <React.Fragment>
        {!isFieldAvatarImage && accessExtend ? (
          <React.Fragment>
            <Link
              to={{
                pathname: `/object/${wobject.author_permlink}/${
                  wobject.default_name
                }/history/avatarImage`,
              }}
              onClick={this.handleAvatarClick}
            >
              <Icon type="plus-circle" className="ObjectHeader__avatar-image" />
            </Link>
            <AppendModal
              showModal={this.state.open}
              hideModal={this.handleCloseRequest}
              locale={'en-US'}
              field={'avatarImage'}
            />
          </React.Fragment>
        ) : (
          <React.Fragment>
            <a role="presentation" onClick={this.handleAvatarClick}>
              <ObjectAvatar item={wobject} size={size} />
            </a>
            {this.state.open && (
              <Lightbox mainSrc={imageUrl} onCloseRequest={this.handleCloseRequest} />
            )}
          </React.Fragment>
        )}
      </React.Fragment>
    );
  }
}
