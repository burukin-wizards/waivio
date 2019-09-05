import React from 'react';
import PropTypes from 'prop-types';
import Helmet from 'react-helmet';
import { injectIntl } from 'react-intl';
import Affix from '../components/Utils/Affix';
import LeftSidebar from '../app/Sidebar/LeftSidebar';
import DiscoverFiltersSidebar from './DiscoverFiltersSidebar/DiscoverFiltersSidebar';
import DiscoverObjectsContent from './DiscoverObjectsContent';
import './DiscoverObjects.less';
import ObjectsContainer from '../objects/ObjectsContainer';

const DiscoverObjects = ({ intl, match }) => {
  const isTypeChosen = Boolean(match.params.typeName);
  return (
    <div className="shifted">
      <Helmet>
        <title>
          {intl.formatMessage({ id: 'objects_title', defaultMessage: 'Discover objects' })} - Waivio
        </title>
      </Helmet>
      <div className="feed-layout container">
        <Affix className="leftContainer" stickPosition={77}>
          <div className="left">
            <LeftSidebar />
          </div>
        </Affix>
        {isTypeChosen && (
          <Affix className="rightContainer" stickPosition={77}>
            <div className="right">
              <DiscoverFiltersSidebar />
            </div>
          </Affix>
        )}
        <div className={`discover-objects${isTypeChosen ? ' center' : ''}`}>
          {match.params.typeName ? (
            <DiscoverObjectsContent typeName={match.params.typeName} key={match.url} intl={intl} />
          ) : (
            <ObjectsContainer />
          )}
        </div>
      </div>
    </div>
  );
};

DiscoverObjects.propTypes = {
  intl: PropTypes.shape().isRequired,
  match: PropTypes.shape().isRequired,
};

export default injectIntl(DiscoverObjects);
