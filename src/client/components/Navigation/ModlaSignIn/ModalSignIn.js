import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Modal, Form, Icon, Input, Button, Checkbox } from 'antd';
import { isEmpty } from 'lodash';
import { batch, useDispatch } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import { GoogleLogin } from 'react-google-login';
import FacebookLogin from 'react-facebook-login';
import getSlug from 'speakingurl';
import SteemConnect from '../../../steemConnectAPI';
import { login, busyLogin } from '../../../auth/authActions';
import { getUserAccount, isUserRegistered } from '../../../../waivioApi/ApiClient';
import { getFollowing, getFollowingObjects, getNotifications } from '../../../user/userActions';
import { notify } from '../../../app/Notification/notificationActions';
import { GUEST_PREFIX } from '../../../../common/constants/waivio';
import { getRate, getRebloggedList, getRewardFund } from '../../../reducers';
import '../ModalSignUp/ModalSignUp.less';

const ModalSignIn = ({ form, next }) => {
  const dispatch = useDispatch();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userData, setUserData] = useState({});

  const {
    getFieldDecorator,
    getFieldsError,
    getFieldError,
    isFieldTouched,
    validateFields,
    setFieldsValue,
  } = form;

  const responseGoogle = async response => {
    if (response) {
      const res = await isUserRegistered(response.googleId, 'google');
      if (res) {
        dispatch(login(response.accessToken, 'google')).then(() => {
          batch(() => {
            dispatch(getFollowing());
            dispatch(getFollowingObjects());
            dispatch(getNotifications());
            dispatch(busyLogin());
            dispatch(getRewardFund());
            dispatch(getRebloggedList());
            dispatch(getRate());
          });
        });
      } else {
        setFieldsValue({
          username: getSlug(`${response.profileObj.givenName} ${response.profileObj.familyName}`),
        });
        setUserData({ ...response, socialNetwork: 'google' });
      }
    }
  };

  const responseFacebook = async response => {
    if (response) {
      const res = await isUserRegistered(response.id, 'facebook');
      if (res) {
        dispatch(login(response.accessToken, 'facebook')).then(() => {
          batch(() => {
            dispatch(getFollowing());
            dispatch(getFollowingObjects());
            dispatch(getNotifications());
            dispatch(busyLogin());
          });
        });
      } else {
        setFieldsValue({
          username: getSlug(response.name),
        });
        setUserData({ ...response, socialNetwork: 'facebook' });
      }
    }
  };

  const hasErrors = fieldsError => Object.keys(fieldsError).some(field => fieldsError[field]);

  const handleSubmit = e => {
    e.preventDefault();
    validateFields((err, values) => {
      if (!err) {
        dispatch(
          login(userData.accessToken, userData.socialNetwork, {
            userName: `${GUEST_PREFIX}${values.username}`,
            pickSocialFields: values.agreement,
          }),
        );
      } else {
        dispatch(notify(`${err.username.errors[0].message}`, 'error'));
      }
    });
  };

  const usernameError = isFieldTouched('username') && getFieldError('username');

  const validateUserName = async (rule, value, callback) => {
    const user = await getUserAccount(`${GUEST_PREFIX}${value}`);
    if (user.id) {
      callback('User with such username already exists');
    }
    callback();
  };

  const nameForm = (
    <Form layout="vertical" onSubmit={handleSubmit}>
      <Form.Item validateStatus={usernameError ? 'error' : ''} help={usernameError || ''}>
        {getFieldDecorator('username', {
          rules: [
            {
              required: true,
              message: 'Please input your username!',
            },
            {
              pattern: /^[A-Za-z0-9.-]{3,16}$/,
              message: 'Only letters, digits, periods, dashes are allowed',
            },
            {
              validator: validateUserName,
            },
          ],
        })(<Input placeholder="Username" addonBefore={GUEST_PREFIX} maxLength={16} />)}
      </Form.Item>
      <Form.Item>
        {getFieldDecorator('agreement', {
          initialValue: true,
          valuePropName: 'checked',
        })(<Checkbox>I agree to post my public data into blockchain</Checkbox>)}
      </Form.Item>
      <Form.Item>
        <Button type="primary" htmlType="submit" disabled={hasErrors(getFieldsError())}>
          <FormattedMessage id="signin" defaultMessage="Log in" />
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <React.Fragment>
      <a role="presentation" onClick={() => setIsModalOpen(true)}>
        <FormattedMessage id="signin" defaultMessage="Log in" />
      </a>
      <Modal
        width={416}
        title=""
        visible={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <div className="ModalSignUp">
          <h2 className="ModalSignUp__title">
            <FormattedMessage id="login" defaultMessage="Log in" />
          </h2>
          <a role="button" href={SteemConnect.getLoginURL(next)} className="ModalSignUp__signin">
            <img
              src="/images/icons/steemit.svg"
              alt="steemit"
              className="ModalSignUp__icon-steemit"
            />
            <FormattedMessage id="signin_with_steemIt" defaultMessage="SteemConnect" />
          </a>
          <div className="ModalSignUp__social">
            <GoogleLogin
              buttonText="Google"
              clientId="623736583769-qlg46kt2o7gc4kjd2l90nscitf38vl5t.apps.googleusercontent.com"
              onSuccess={responseGoogle}
              cookiePolicy={'single_host_origin'}
              className="ModalSignUp__social-btn"
            />
            <FacebookLogin
              appId="754038848413420"
              autoLoad={false}
              fields="name,email,picture"
              callback={responseFacebook}
              onFailure={() => {}}
              textButton="Facebook"
              cssClass="ModalSignUp__social-btn ModalSignUp__social-btn--fb"
              icon={<Icon type="facebook" className="ModalSignUp__icon-fb" />}
            />
          </div>
          {!isEmpty(userData) && nameForm}
        </div>
      </Modal>
    </React.Fragment>
  );
};

ModalSignIn.propTypes = {
  next: PropTypes.string.isRequired,
  form: PropTypes.shape().isRequired,
};

export default Form.create({ name: 'user_name' })(ModalSignIn);
