import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Icon } from 'antd';
import { injectIntl } from 'react-intl';
import classNames from 'classnames';
import './UserInstrumentsTable.less';

const UserInstrumentsTableHeader = ({ setSortOptions, intl }) => {
  const [currentItem, setCurrentItem] = useState('');
  const [isActive, setIsActive] = useState(false);
  const onClickHandler = item => {
    setCurrentItem(item);
    setIsActive(!isActive);
    setSortOptions({ currentItem: item, isActive });
  };
  return (
    <div className="UserInstrumentsTableHeader">
      <div
        className={classNames('UserInstrumentsTableHeader__item', {
          active: currentItem === 'quote',
        })}
        onClick={() => onClickHandler('quote')}
      >
        <div className="UserInstrumentsTableHeader__item-icon">
          <Icon type={currentItem === 'quote' && isActive ? 'down' : 'up'} />
        </div>
        <div className="UserInstrumentsTableHeader__item-content">
          {intl.formatMessage({
            id: 'user_statistics_instrument',
            defaultMessage: 'Instruments',
          })}
        </div>
      </div>
      <div
        className={classNames('UserInstrumentsTableHeader__item', {
          active: currentItem === 'count',
        })}
        onClick={() => onClickHandler('count')}
      >
        <div className="UserInstrumentsTableHeader__item-icon">
          <Icon type={currentItem === 'count' && isActive ? 'down' : 'up'} />
        </div>
        <div className="UserInstrumentsTableHeader__item-content">
          {intl.formatMessage({
            id: 'user_statistics_deals',
            defaultMessage: 'Deals',
          })}
        </div>
      </div>
      <div
        className={classNames('UserInstrumentsTableHeader__item', {
          active: currentItem === 'pips',
        })}
        onClick={() => onClickHandler('pips')}
      >
        <div className="UserInstrumentsTableHeader__item-icon">
          <Icon type={currentItem === 'pips' && isActive ? 'down' : 'up'} />
        </div>
        <div className="UserInstrumentsTableHeader__item-content">
          {intl.formatMessage({
            id: 'user_statistics_profit',
            defaultMessage: 'Profit',
          })}
        </div>
      </div>
    </div>
  );
};

UserInstrumentsTableHeader.propTypes = {
  setSortOptions: PropTypes.func.isRequired,
  intl: PropTypes.shape().isRequired,
};

export default injectIntl(UserInstrumentsTableHeader);
