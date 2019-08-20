import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';
import './TopNavigation.less';

const LINKS = {
  TRENDING: '/trending',
  REWARDS: '/rewards',
  DISCOVER: '/discover-objects',
  ACTIVITY: '/activity',
  ABOUT: '/object/ylr-waivio',
};

const TopNavigation = ({ authenticated, location: { pathname } }) => {
  const isRouteMathed =
    pathname === '/' || Object.values(LINKS).some(url => pathname.includes(url));
  return isRouteMathed ? (
    <ul className="TopNavigation">
      {authenticated && (
        <li>
          <Link
            to="/"
            className={classNames('TopNavigation__item', {
              'TopNavigation__item--active': pathname === '/',
            })}
          >
            <FormattedMessage id="feed" defaultMessage="Feed" />
          </Link>
        </li>
      )}
      <li>
        <Link
          to={LINKS.TRENDING}
          className={classNames('TopNavigation__item', {
            'TopNavigation__item--active': pathname.includes(LINKS.TRENDING),
          })}
        >
          <FormattedMessage id="news" defaultMessage="News" />
        </Link>
      </li>
      <li>
        <Link
          to={authenticated ? `${LINKS.REWARDS}/active` : `${LINKS.REWARDS}/all`}
          className={classNames('TopNavigation__item', {
            'TopNavigation__item--active': pathname.includes(LINKS.REWARDS),
          })}
        >
          <FormattedMessage id="rewards" defaultMessage="Rewards" />
        </Link>
      </li>
      <li>
        <Link
          to={`${LINKS.DISCOVER}/hashtag`}
          className={classNames('TopNavigation__item', {
            'TopNavigation__item--active': pathname.includes(LINKS.DISCOVER),
          })}
        >
          <FormattedMessage id="discover" defaultMessage="Discover" />
        </Link>
      </li>
      {authenticated && (
        <li>
          <Link
            to={LINKS.ACTIVITY}
            className={classNames('TopNavigation__item', {
              'TopNavigation__item--active': pathname === LINKS.ACTIVITY,
            })}
          >
            <FormattedMessage id="activity" defaultMessage="Activity" />
          </Link>
        </li>
      )}
      <li>
        <Link
          to={LINKS.ABOUT}
          className={classNames('TopNavigation__item', {
            'TopNavigation__item--active': pathname.includes(LINKS.ABOUT),
          })}
        >
          <FormattedMessage id="about" defaultMessage="About" />
        </Link>
      </li>
    </ul>
  ) : null;
};

TopNavigation.propTypes = {
  authenticated: PropTypes.bool.isRequired,
  location: PropTypes.shape(),
};

TopNavigation.defaultProps = {
  location: {
    pathname: '',
  },
};

export default TopNavigation;
