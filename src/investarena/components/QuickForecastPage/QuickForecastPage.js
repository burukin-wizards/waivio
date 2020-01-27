import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { FormattedMessage, injectIntl } from 'react-intl';
import { Icon } from 'antd';
import { Link } from 'react-router-dom';

import RightSidebarLoading from '../../../client/app/Sidebar/RightSidebarLoading';
import StoryLoading from '../../../client/components/Story/StoryLoading';
import QuickForecastCard from './QuickForecastCard/QuickForecastCard';
import BallotTimer from './BallotTimer';
import TopPredictors from './TopPredictions/TopPredictors';
import USDDisplay from '../../../client/components/Utils/USDDisplay';
import withAuthActions from '../../../client/auth/withAuthActions';
import SortSelector from '../../../client/components/SortSelector/SortSelector';
import Affix from '../../../client/components/Utils/Affix';
import { marketNames } from '../../constants/objectsInvestarena';
import {
  forecastWinnersShowMore,
  getDataForQuickForecast,
  getForecastRoundRewards,
  getForecastStatistic,
  getForecastWinners,
} from '../../redux/actions/forecastActions';

import './QuickForecastPage.less';

const QuickForecastPage = props => {
  const [sortBy, setSort] = useState('All');
  const [isLoading, setLoading] = useState(false);
  const [currentTime, setTime] = useState(0);
  const winnersLimit = 5;
  const answeredForecastList = props.quickForecastDataList.filter(forecast => !forecast.active);

  useEffect(() => {
    props.getDataForQuickForecast();
    props.getForecastStatistic();
    props.getForecastWinners(winnersLimit, 0);
    props.getForecastRoundRewards();
    setTime(Date.now());

    setTimeout(() => setLoading(true), 3000);
  }, [props.auth]);

  useEffect(() => {
    if (answeredForecastList.length === 5) {
      setSort('All');
    }
  }, [props.quickForecastDataList]);

  const filtersType = [
    {
      name: 'All',
      key: '',
      intl: {
        id: 'reset_filter',
        defaultMessage: 'All',
      },
    },
    ...marketNames,
  ];

  function handleSort(sort) {
    setSort(sort);
  }

  function handleFinishTimer() {
    setLoading(false);

    props.getDataForQuickForecast();
    props.getForecastRoundRewards();
    props.getForecastWinners(winnersLimit, 0);
    props.getForecastStatistic();
    setLoading(true);
  }

  const filterForecastList = props.quickForecastDataList.filter(obj => {
    if (sortBy === 'Currencies' || sortBy === 'Currencies') {
      return obj.market === 'Currency' && obj.active;
    }

    return obj.market === sortBy && obj.active;
  });
  const forecastList =
    sortBy && sortBy !== 'All'
      ? [...answeredForecastList, ...filterForecastList]
      : props.quickForecastDataList;
  const currentForecastList =
    answeredForecastList.length === 5 ? answeredForecastList : forecastList;
  const secondsInMilliseconds = sec => sec / 0.001;
  const finishRoundTime = props.roundTime && currentTime + secondsInMilliseconds(props.roundTime);

  return (
    <div className="container">
      <h1 className="head-title">
        <FormattedMessage id="forecast_title" defaultMessage="Guess and get money " />
        <FormattedMessage id="absolutely" defaultMessage="absolutely " />
        <span className="free">
          <FormattedMessage id="free" defaultMessage="free" />
        </span>
      </h1>
      <div className="shifted">
        <div className="feed-layout">
          <Affix className="leftContainer" stickPosition={122}>
            <div className="leftContainer">
              <div
                className="rules"
                title={props.intl.formatMessage({
                  id: 'how_it_work',
                  defaultMessage: 'How it works?',
                })}
              >
                <Link to="#" className="rules__link">
                  <FormattedMessage id="how_it_work" defaultMessage="How it works?" />
                  &nbsp;
                </Link>
                <Icon type="question-circle" />
              </div>
              {isLoading ? (
                <TopPredictors
                  userList={props.usersList}
                  title={props.intl.formatMessage({
                    id: 'top_five_title',
                    defaultMessage: 'Top 5 Users',
                  })}
                  top
                  activeUser={props.user}
                />
              ) : (
                <RightSidebarLoading />
              )}
            </div>
          </Affix>
          <div className="center">
            {isLoading ? (
              <React.Fragment>
                <div className="timer-container">
                  <Icon type="clock-circle" />
                  &nbsp;
                  <BallotTimer
                    endTimerTime={finishRoundTime}
                    willCallAfterTimerEnd={() => handleFinishTimer()}
                  />
                </div>
                <SortSelector
                  caption={props.intl.formatMessage({
                    id: 'filter_caption',
                    defaultMessage: 'Filter',
                  })}
                  sort={sortBy}
                  onChange={sort => handleSort(sort)}
                  disabled={Boolean(answeredForecastList.length === 5)}
                >
                  {filtersType.map(type => (
                    <SortSelector.Item key={type.name}>
                      <FormattedMessage
                        id={type.intl.id}
                        defaultMessage={type.intl.defaultMessage}
                      />
                    </SortSelector.Item>
                  ))}
                </SortSelector>
                {currentForecastList.map(obj => (
                  <QuickForecastCard
                    forecast={obj}
                    key={obj.id}
                    predictionObjectName={
                      props.quotesSett[obj.security] && props.quotesSett[obj.security].name
                    }
                    avatar={
                      props.quotesSett[obj.security] &&
                      props.quotesSett[obj.security].wobjData.avatarlink
                    }
                    link={
                      props.quotesSett[obj.security] &&
                      props.quotesSett[obj.security].wobjData.author_permlink
                    }
                    getForecast={props.getDataForQuickForecast}
                    timerData={secondsInMilliseconds(props.timeForTimer)}
                    timerCallback={() => handleFinishTimer()}
                    counter={answeredForecastList.length}
                    handleAuthorization={props.onActionInitiated}
                    disabled={props.isDisabled}
                  />
                ))}
              </React.Fragment>
            ) : (
              <StoryLoading />
            )}
            {isLoading && !forecastList.length && (
              <div className="no-posts">
                <FormattedMessage
                  id="no_quick_forecasts"
                  defaultMessage="There are currently no forecasts in this category"
                />
              </div>
            )}
          </div>
          <Affix className="rightContainer" stickPosition={122}>
            <div className="right">
              <div className="reward">
                <span className="reward__row">
                  <FormattedMessage id="forecasts_rewards" defaultMessage="Rewards:" />
                  <USDDisplay value={props.roundInformation.rewards} />
                </span>
                <span className="reward__row">
                  <FormattedMessage id="forecast_round" defaultMessage="Current round:" />
                  <USDDisplay value={props.roundInformation.votingPowers} />
                </span>
              </div>
              {isLoading ? (
                !!props.winners.length && (
                  <TopPredictors
                    userList={props.winners}
                    title={props.intl.formatMessage({
                      id: 'current_winners_title',
                      defaultMessage: 'Current round winners',
                    })}
                    activeUser={props.user}
                    showMore={props.hasMore}
                    handleShowMore={() => props.forecastWinnersShowMore(5, props.winners.length)}
                  />
                )
              ) : (
                <RightSidebarLoading />
              )}
            </div>
          </Affix>
        </div>
      </div>
    </div>
  );
};

QuickForecastPage.propTypes = {
  quickForecastDataList: PropTypes.arrayOf(PropTypes.object).isRequired,
  getDataForQuickForecast: PropTypes.func.isRequired,
  getForecastRoundRewards: PropTypes.func.isRequired,
  getForecastWinners: PropTypes.func.isRequired,
  getForecastStatistic: PropTypes.func.isRequired,
  onActionInitiated: PropTypes.func.isRequired,
  forecastWinnersShowMore: PropTypes.func.isRequired,
  intl: PropTypes.shape({
    formatMessage: PropTypes.func,
  }).isRequired,
  quotesSett: PropTypes.shape({}).isRequired,
  user: PropTypes.shape({
    name: PropTypes.string,
    successful_suppose: PropTypes.number,
  }),
  usersList: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      successful_suppose: PropTypes.number,
    }),
  ).isRequired,
  winners: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
  hasMore: PropTypes.bool,
  auth: PropTypes.bool.isRequired,
  roundTime: PropTypes.number,
  timeForTimer: PropTypes.number.isRequired,
  isDisabled: PropTypes.bool,
  roundInformation: PropTypes.shape({
    rewards: PropTypes.number,
    votingPowers: PropTypes.number,
  }).isRequired,
};

QuickForecastPage.defaultProps = {
  user: {
    name: '',
    successful_suppose: 0,
  },
  hasMore: false,
  roundTime: 0,
  isDisabled: false,
};

const mapStateToProps = state => ({
  quickForecastDataList: state.forecasts.quickForecastData,
  quotesSett: state.quotesSettings,
  usersList: state.forecasts.userStatistics,
  user: state.forecasts.current,
  winners: state.forecasts.winners,
  hasMore: state.forecasts.hasMoreStatistic,
  timeForTimer: state.forecasts.timer,
  roundInformation: state.forecasts.roundInfo,
  roundTime: state.forecasts.roundTime,
  auth: state.auth.isAuthenticated,
  isDisabled: state.forecasts.disabled,
});

const mapDispatchToProps = {
  getDataForQuickForecast,
  getForecastWinners,
  getForecastStatistic,
  getForecastRoundRewards,
  forecastWinnersShowMore,
};

export default injectIntl(
  withAuthActions(connect(mapStateToProps, mapDispatchToProps)(QuickForecastPage)),
);
