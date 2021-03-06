/* eslint-disable */
import React, { useContext, useEffect, useState } from 'react';
import { injectIntl } from 'react-intl';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { Button, message, Modal, Icon } from 'antd';
import classNames from 'classnames';
import { getClientWObj } from '../../adapters';
import ObjectCardView from '../../objectCard/ObjectCardView';
import CampaignFooter from '../CampaignFooter/CampainFooterContainer';
import { getSingleComment } from '../../comments/commentsActions';
import { getCommentContent } from '../../reducers';
import { connect } from 'react-redux';
import { getFieldWithMaxWeight } from '../../object/wObjectHelper';
import { rejectReservationCampaign, reserveActivatedCampaign } from '../../../waivioApi/ApiClient';
import { generatePermlink } from '../../helpers/wObjectHelper';
import { AppSharedContext } from '../../Wrapper';
import Details from '../Details/Details';
import CampaignCardHeader from '../CampaignCardHeader/CampaignCardHeader';
import './Proposition.less';

const Proposition = ({
  intl,
  proposition,
  assignProposition,
  assignCommentPermlink,
  discardProposition,
  loading,
  wobj,
  assigned,
  post,
  getSingleComment,
  authorizedUserName,
}) => {
  const { usedLocale } = useContext(AppSharedContext);
  const proposedWobj = getClientWObj(wobj, usedLocale);
  const [isModalDetailsOpen, setModalDetailsOpen] = useState(false);
  const requiredObjectName = getFieldWithMaxWeight(
    proposition.required_object,
    'name',
    proposition.required_object.author_permlink,
  );
  useEffect(() => {
    getSingleComment(authorizedUserName, assignCommentPermlink);
  }, []);

  const toggleModalDetails = () => {
    setModalDetailsOpen(!isModalDetailsOpen);
  };

  const discardPr = obj => {
    const unreservationPermlink = `reject-${proposition._id}${generatePermlink()}`;
    const rejectData = {
      campaign_permlink: proposition.activation_permlink,
      user_name: authorizedUserName,
      reservation_permlink: proposition.objects[0].permlink,
      unreservation_permlink: unreservationPermlink,
    };
    rejectReservationCampaign(rejectData)
      .then(() => {
        discardProposition({
          companyAuthor: proposition.guide.name,
          companyPermlink: proposition.activation_permlink,
          objPermlink: obj.author_permlink,
          reservationPermlink: rejectData.reservation_permlink,
          unreservationPermlink,
        });
      })
      .catch(() => {
        message.error(
          intl.formatMessage({
            id: 'cannot_reject_campaign',
            defaultMessage: 'You cannot reject the campaign at the moment',
          }),
        );
      });
  };

  const [isModalOpen, openModal] = useState(false);
  const [isReserved, setReservation] = useState(false);

  const reserveOnClickHandler = () => {
    openModal(!isModalOpen);
  };

  const modalOnOklHandler = () => {
    const reserveData = {
      campaign_permlink: proposition.activation_permlink,
      approved_object: wobj.author_permlink,
      user_name: authorizedUserName,
      reservation_permlink: `reserve-${generatePermlink()}`,
    };
    reserveActivatedCampaign(reserveData)
      .then(() => {
        assignProposition({
          companyAuthor: proposition.guide.name,
          companyPermlink: proposition.activation_permlink,
          resPermlink: reserveData.reservation_permlink,
          objPermlink: wobj.author_permlink,
          companyId: proposition._id,
        });
        openModal(false);
        setReservation(true);
      })
      .catch(() => {
        message.error(
          intl.formatMessage({
            id: 'cannot_reserve_company',
            defaultMessage: 'You cannot reserve the campaign at the moment',
          }),
        );
      });
  };

  const modalOnCancelHandler = () => {
    openModal(false);
  };

  return (
    <div className="Proposition">
      <div className="Proposition__header">
        <CampaignCardHeader campaignData={proposition} />
      </div>
      <div className="Proposition__card">
        <ObjectCardView wObject={proposedWobj} key={proposedWobj.id} />
      </div>
      <div
        className={classNames('Proposition__footer', {
          'justify-end': assigned === null || isReserved,
        })}
      >
        {proposition.activation_permlink && assigned === true && !_.isEmpty(post) ? (
          <CampaignFooter
            post={post}
            proposedWobj={proposedWobj}
            requiredObjectPermlink={proposition.required_object.author_permlink}
            requiredObjectName={requiredObjectName}
            discardPr={discardPr}
            proposition={proposition}
          />
        ) : (
          <React.Fragment>
            {assigned !== null && !assigned && !isReserved && (
              <div className="Proposition__footer-button">
                <Button
                  type="primary"
                  loading={loading}
                  disabled={loading || proposition.isReservedSiblingObj}
                  onClick={toggleModalDetails}
                >
                  {intl.formatMessage({
                    id: 'reserve',
                    defaultMessage: `Reserve`,
                  })}
                </Button>
                {proposition.count_reservation_days &&
                  `${intl.formatMessage({
                    id: 'for_days',
                    defaultMessage: `for`,
                  })} ${proposition.count_reservation_days} ${intl.formatMessage({
                    id: 'days',
                    defaultMessage: `days`,
                  })}`}
              </div>
            )}
            <div className="Proposition__footer-details" onClick={toggleModalDetails}>
              <span role="presentation">
                {intl.formatMessage({
                  id: 'details',
                  defaultMessage: `Details`,
                })}
              </span>
              <Icon type="right" />
            </div>
          </React.Fragment>
        )}
      </div>
      <Details
        isModalDetailsOpen={isModalDetailsOpen}
        objectDetails={proposition}
        toggleModal={toggleModalDetails}
        reserveOnClickHandler={reserveOnClickHandler}
        loading={loading}
        assigned={assigned}
        isReserved={isReserved}
        proposedWobj={proposedWobj}
      />
      <Modal
        closable
        maskClosable={false}
        title={intl.formatMessage({
          id: 'reserve_campaign',
          defaultMessage: `Reserve rewards campaign`,
        })}
        visible={isModalOpen}
        onOk={modalOnOklHandler}
        onCancel={modalOnCancelHandler}
      >
        {intl.formatMessage({
          id: 'reserve_campaign_accept',
          defaultMessage: `Do you want to reserve rewards campaign?`,
        })}
      </Modal>
    </div>
  );
};

Proposition.propTypes = {
  proposition: PropTypes.shape().isRequired,
  wobj: PropTypes.shape().isRequired,
  assignProposition: PropTypes.func.isRequired,
  discardProposition: PropTypes.func.isRequired,
  loading: PropTypes.bool.isRequired,
  assigned: PropTypes.bool,
  assignCommentPermlink: PropTypes.string,
  intl: PropTypes.shape().isRequired,
  post: PropTypes.shape(),
};

Proposition.defaultProps = {
  authorizedUserName: '',
  post: {},
  assigned: null,
};

export default connect(
  (state, ownProps) => ({
    post:
      ownProps.authorizedUserName &&
      ownProps.assignCommentPermlink &&
      !_.isEmpty(state.comments.comments)
        ? getCommentContent(state, ownProps.authorizedUserName, ownProps.assignCommentPermlink)
        : {},
  }),
  {
    getSingleComment,
  },
)(injectIntl(Proposition));
