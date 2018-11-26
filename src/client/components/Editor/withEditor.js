import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { message } from 'antd';
import { injectIntl } from 'react-intl';
import { getAuthenticatedUser } from '../../reducers';
import { MAXIMUM_UPLOAD_SIZE_HUMAN } from '../../helpers/image';
import { WAIVIO_OBJECT_TYPE } from '../../../common/constants/waivio';
import { getLocale } from '../../settings/settingsReducer';
import config from '../../../waivioApi/config.json';

function getDisplayName(WrappedComponent) {
  return WrappedComponent.displayName || WrappedComponent.name || 'Component';
}

export default function withEditor(WrappedComponent) {
  @connect(state => ({
    user: getAuthenticatedUser(state),
    locale: getLocale(state),
  }))
  @injectIntl
  class EditorBase extends React.Component {
    static displayName = `withEditor(${getDisplayName(WrappedComponent)})`;

    static propTypes = {
      intl: PropTypes.shape().isRequired,
      user: PropTypes.shape().isRequired,
      locale: PropTypes.string,
    };

    static defaultProps = {
      locale: 'auto',
    };

    handleImageUpload = (blob, callback, errorCallback) => {
      const { intl: { formatMessage } } = this.props;
      message.info(
        formatMessage({ id: 'notify_uploading_image', defaultMessage: 'Uploading image' }),
      );
      const formData = new FormData();
      formData.append('file', blob);

      fetch(`https://ipfs.busy.org/upload`, {
        method: 'POST',
        body: formData,
      })
        .then(res => res.json())
        .then(res => callback(res.url, blob.name))
        .catch(err => {
          console.log('err', err);
          errorCallback();
          message.error(
            formatMessage({
              id: 'notify_uploading_iamge_error',
              defaultMessage: "Couldn't upload image",
            }),
          );
        });
    };

    handleImageInvalid = () => {
      const { formatMessage } = this.props.intl;
      message.error(
        formatMessage(
          {
            id: 'notify_uploading_image_invalid',
            defaultMessage:
              'This file is invalid. Only image files with maximum size of {size} are supported',
          },
          { size: MAXIMUM_UPLOAD_SIZE_HUMAN },
        ),
      );
    };

    handleCreateObject = (obj, callback, errorCallback) => {
      const requestBody = {
        author: this.props.user.name,
        title: `Waivio object. ${obj.tag}`,
        body: `Waivio object "${obj.tag}" has been created`,
        permlink: `${this.props.user.name}-${obj.permlink}`,
        locale: this.props.locale === 'auto' ? 'en-US' : this.props.locale,
        type: WAIVIO_OBJECT_TYPE.ITEM,
      };

      fetch(`${config.objectsBot.url}${config.objectsBot.createObject}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })
        .then(res => res.json())
        .then(res => callback(res))
        .catch(err => {
          console.log('err', err);
          errorCallback();
        });
    };

    render() {
      return (
        <WrappedComponent
          onImageUpload={this.handleImageUpload}
          onImageInvalid={this.handleImageInvalid}
          onCreateObject={this.handleCreateObject}
          {...this.props}
        />
      );
    }
  }

  return EditorBase;
}
