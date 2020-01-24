import React from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Icon, message } from 'antd';

import { Link } from 'react-router-dom';
import { answerForQuickForecast } from '../../../redux/actions/forecastActions';
import BallotTimer from '../BallotTimer';
import USDDisplay from '../../../../client/components/Utils/USDDisplay';
import ChartIcon from '../ChartIcon';
import DynamicPriceWrapper from '../DynamicPriceWrapper';

import Loading from '../../../../client/components/Icon/Loading';
import './QuickForecastCard.less';

const QuickForecastCard = ({
  forecast,
  predictionObjectName,
  timerData,
  avatar,
  timerCallback,
  counter,
  intl,
  handleAuthorization,
  disabled,
  link,
}) => {
  // flags
  const dispatch = useDispatch();
  const pendingStatus = forecast.status === 'pending';
  const winner = forecast.status === 'guessed';
  const lose = forecast.status === 'finished';
  const side =
    forecast.side === 'up' ? (
      <FormattedMessage id="forecast_answer_rise" defaultMessage="Yes" />
    ) : (
      <FormattedMessage id="forecast_answer_fall" defaultMessage="No" />
    );

  // messages
  const forecastFinishMessage = winner ? (
    <FormattedMessage id="forecast_winner_message" defaultMessage="You Win!!!" />
  ) : (
    <FormattedMessage id="forecast_lose_message" defaultMessage="Try again!!!" />
  );

  // classLists
  const forecastCardClassList = classNames('ForecastCard', {
    'ForecastCard--toLose': lose,
    'ForecastCard--win': winner,
  });
  const sideClassList = classNames({
    green: forecast.side === 'up',
    red: forecast.side === 'down',
  });
  const forecastsMessage = classNames({
    green: winner,
    red: lose,
  });
  const handleClick = answer => {
    dispatch(
      answerForQuickForecast(
        forecast.author,
        forecast.permlink,
        forecast.expiredAt,
        answer,
        forecast.security,
        timerData,
      ),
    )
      .then(() => {
        message.success(
          `${intl.formatMessage({
            id: 'forecast_info_message',
            defaultMessage: 'Forecasts remaining in current round:',
          })} ${5 - counter}`,
        );
      })
  };
  const handleAnswerClick = answer => handleAuthorization(() => handleClick(answer));
  const time = (timerData * 0.001) / 60;

  return (
    <div className={forecastCardClassList}>
      <div className="ForecastCard__info">
        {!forecast.active ? (
          <div className="ForecastCard__to-vote-card-container">
            <div className="ForecastCard__val">
              <div>
                <FormattedMessage id="was" defaultMessage="Was" />
              </div>
              <span title={forecast.postPrice}>
                <USDDisplay value={+forecast.postPrice} />
              </span>
            </div>
            <div className="ForecastCard__flex-container-vertical">
              <Link to={`/object/${link}`} className="ForecastCard__title">
                <p className="ForecastCard__title-row">
                  <img
                    className="ForecastCard__img ForecastCard__img--little"
                    src={avatar}
                    alt={predictionObjectName}
                  />
                  &nbsp;
                  {predictionObjectName}
                </p>
                {pendingStatus ? (
                  <p className="green">
                    <FormattedMessage id="rise" defaultMessage="Rise: " />
                    <span className={sideClassList}>{side}</span>
                  </p>
                ) : (
                  <span className={forecastsMessage}>{forecastFinishMessage}</span>
                )}
              </Link>
              <div className="ForecastCard__forecast-timer">
                <Icon type="clock-circle" />
                &nbsp;
                <BallotTimer
                  endTimerTime={forecast.quickForecastExpiredAt}
                  willCallAfterTimerEnd={timerCallback}
                />
              </div>
            </div>
            <DynamicPriceWrapper
              postPrice={forecast.postPrice}
              secur={forecast.security}
              closedPrice={forecast.endPrice}
            />
          </div>
        ) : (
          <React.Fragment>
            <div className="ForecastCard__top-block">
              <p className="ForecastCard__title ForecastCard__title-row">
                <Link className="ForecastCard__link" to={`/object/${link}`}>
                  <img
                    className="ForecastCard__img ForecastCard__img--little"
                    src={avatar}
                    alt={predictionObjectName}
                  />
                  &nbsp;
                  {predictionObjectName}
                </Link>
                &nbsp;
                {intl.formatMessage(
                  {
                    id: 'forecast_question',
                    defaultMessage: 'will rise in {time} min?',
                  },
                  { time },
                )}
              </p>
            </div>
            {!forecast.isLoaded && <Loading />}
            <div className="ballotButton__container">
              <div className="ballotButton__button-container">
                <button
                  disabled={disabled}
                  onClick={() => handleAnswerClick('up')}
                  className="ballotButton ballotButton__positive"
                >
                  <FormattedMessage id="forecast_answer_rise" defaultMessage="Yes" />
                </button>
                <button
                  disabled={disabled}
                  onClick={() => handleAnswerClick('down')}
                  className="ballotButton ballotButton__negative"
                >
                  <FormattedMessage id="forecast_answer_fall" defaultMessage="No" />
                </button>
              </div>
            </div>
          </React.Fragment>
        )}
      </div>
      <ChartIcon id={forecast.security} />
    </div>
  );
};

QuickForecastCard.propTypes = {
  forecast: PropTypes.shape({
    status: PropTypes.string,
    author: PropTypes.string,
    recommend: PropTypes.string,
    security: PropTypes.string,
    permlink: PropTypes.string,
    endPrice: PropTypes.number,
    quickForecastExpiredAt: PropTypes.number,
    active: PropTypes.bool,
    postPrice: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    side: PropTypes.string,
    expiredAt: PropTypes.string,
    isLoaded: PropTypes.bool,
    id: PropTypes.string,
  }).isRequired,
  answerForecast: PropTypes.func.isRequired,
  intl: PropTypes.shape({
    formatMessage: PropTypes.func.isRequired,
  }).isRequired,
  timerCallback: PropTypes.func.isRequired,
  handleAuthorization: PropTypes.func.isRequired,
  predictionObjectName: PropTypes.string,
  avatar: PropTypes.string,
  link: PropTypes.string,
  timerData: PropTypes.number.isRequired,
  counter: PropTypes.number.isRequired,
  disabled: PropTypes.bool,
};

QuickForecastCard.defaultProps = {
  disabled: false,
  avatar: '',
  predictionObjectName: '',
  link: '',
};

export default injectIntl(QuickForecastCard);
