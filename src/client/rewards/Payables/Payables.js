import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { Link } from 'react-router-dom';
import _ from 'lodash';
import { getLenders } from '../../../waivioApi/ApiClient';
import UserPayableCard from './UserPayableCard/UserPayableCard';
import './Payables.less';

const Payables = ({ intl, userName, currentSteemDollarPrice, filterData }) => {
  const payableFilters = {};
  _.map(filterData, f => {
    payableFilters.days = f.filterName === 'days' ? f.value : '';
    payableFilters.payable = f.filterName === 'payable' ? f.value : '';
  });
  const [lenders, setLenders] = useState({});
  useEffect(() => {
    getLenders({
      sponsor: userName,
      filters: payableFilters,
    })
      .then(data => setLenders(data))
      .catch(e => console.log(e));
  }, [filterData]);

  return (
    <div className="Payables">
      <div className="Payables__main-title">
        {intl.formatMessage({
          id: 'payables_page_payables',
          defaultMessage: 'Payables',
        })}
      </div>
      <div className="Payables__information-row">
        <div className="Payables__information-row-total-title">
          {intl.formatMessage({
            id: 'payables_page_total',
            defaultMessage: 'Total',
          })}
          : {lenders && lenders.payable && lenders.payable.toFixed(2)}
          {' SBD '}
          {currentSteemDollarPrice
            ? `(US$ ${(currentSteemDollarPrice * lenders.payable).toFixed(2)})`
            : ''}
        </div>
        <div className="Payables__information-row-pay">
          <Link to={'/rewards/pay-all'}>
            {intl.formatMessage({
              id: 'payables_page_pay_all',
              defaultMessage: 'Pay all',
            })}
            (mock)
          </Link>
        </div>
      </div>
      {_.map(lenders.histories, user => (
        <UserPayableCard key={user.userName} user={user} />
      ))}
    </div>
  );
};

Payables.propTypes = {
  intl: PropTypes.shape().isRequired,
  userName: PropTypes.string.isRequired,
  currentSteemDollarPrice: PropTypes.number.isRequired,
  filterData: PropTypes.arrayOf(PropTypes.shape()).isRequired,
};

export default injectIntl(Payables);