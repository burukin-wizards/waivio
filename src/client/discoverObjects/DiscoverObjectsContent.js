import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { isEmpty, map } from 'lodash';
import { connect } from 'react-redux';
import { Button, Modal, Tag } from 'antd';
import { isNeedFilters, updateActiveFilters } from './helper';
import {
  getActiveFilters,
  getObjectTypesList,
  getObjectTypeState,
  getObjectTypeLoading,
  getFilteredObjects,
  getHasMoreRelatedObjects,
  getAvailableFilters,
} from '../reducers';
import {
  getObjectTypeInitial,
  getObjectType,
  setFiltersAndLoad,
} from '../objectTypes/objectTypeActions';
import { getObjectTypes } from '../objectTypes/objectTypesActions';
import Loading from '../components/Icon/Loading';
import ObjectCardView from '../objectCard/ObjectCardView';
import ReduxInfiniteScroll from '../vendor/ReduxInfiniteScroll';
import DiscoverObjectsFilters from './DiscoverFiltersSidebar/FiltersContainer';
import SidenavDiscoverObjects from './SidenavDiscoverObjects';

const modalName = {
  FILTERS: 'filters',
  OBJECTS: 'objects',
};

@connect(
  state => ({
    availableFilters: getAvailableFilters(state),
    activeFilters: getActiveFilters(state),
    typesList: getObjectTypesList(state),
    theType: getObjectTypeState(state),
    filteredObjects: getFilteredObjects(state),
    isFetching: getObjectTypeLoading(state),
    hasMoreObjects: getHasMoreRelatedObjects(state),
  }),
  {
    dispatchGetObjectType: getObjectTypeInitial,
    dispatchGetObjectTypeMore: getObjectType,
    dispatchGetObjectTypes: getObjectTypes,
    dispatchSetActiveFilters: setFiltersAndLoad,
  },
)
class DiscoverObjectsContent extends Component {
  static propTypes = {
    /* from connect */
    availableFilters: PropTypes.shape().isRequired,
    activeFilters: PropTypes.shape().isRequired,
    typesList: PropTypes.shape().isRequired,
    theType: PropTypes.shape().isRequired,
    filteredObjects: PropTypes.arrayOf(PropTypes.shape()).isRequired,
    isFetching: PropTypes.bool.isRequired,
    hasMoreObjects: PropTypes.bool.isRequired,
    dispatchGetObjectType: PropTypes.func.isRequired,
    dispatchGetObjectTypeMore: PropTypes.func.isRequired,
    dispatchGetObjectTypes: PropTypes.func.isRequired,
    dispatchSetActiveFilters: PropTypes.func.isRequired,
    /* passed props */
    intl: PropTypes.shape().isRequired,
    typeName: PropTypes.string,
  };

  static defaultProps = {
    typeName: '',
  };

  constructor(props) {
    super(props);

    this.state = {
      hasFilters: isNeedFilters(props.typeName),
      isModalOpen: false,
      modalTitle: '',
    };
  }

  componentDidMount() {
    const { dispatchGetObjectType, dispatchGetObjectTypes, typeName, typesList } = this.props;
    dispatchGetObjectType(typeName);
    if (isEmpty(typesList)) dispatchGetObjectTypes();
  }

  loadMoreRelatedObjects = () => {
    const { dispatchGetObjectTypeMore, theType, filteredObjects } = this.props;
    dispatchGetObjectTypeMore(theType.name, {
      skip: filteredObjects.length || 0,
    });
  };

  showFiltersModal = () =>
    this.setState({
      isModalOpen: true,
      modalTitle: modalName.FILTERS,
    });

  showTypesModal = () =>
    this.setState({
      isModalOpen: true,
      modalTitle: modalName.OBJECTS,
    });

  closeModal = () => this.setState({ isModalOpen: false });

  handleRemoveTag = (filter, filterValue) => e => {
    const { activeFilters, dispatchSetActiveFilters } = this.props;
    e.preventDefault();
    const updatedFilters = updateActiveFilters(activeFilters, filter, filterValue, false);
    dispatchSetActiveFilters(updatedFilters);
  };

  render() {
    const { hasFilters, isModalOpen, modalTitle } = this.state;
    const {
      intl,
      isFetching,
      typeName,
      availableFilters,
      activeFilters,
      filteredObjects,
      hasMoreObjects,
    } = this.props;
    return (
      <React.Fragment>
        <div className="discover-objects-header">
          <div className="discover-objects-header__title">
            <span className="discover-objects-header__topic ttc">
              {intl.formatMessage({ id: 'objects', defaultMessage: 'Objects' })}:&nbsp;
            </span>
            <span className="ttc">{typeName}</span>&nbsp;
            <span className="discover-objects-header__selector">
              (
              <span className="underline" role="presentation" onClick={this.showTypesModal}>
                {intl.formatMessage({ id: 'change', defaultMessage: 'change' })}
              </span>
              )
            </span>
          </div>
          {hasFilters ? (
            <React.Fragment>
              <div className="discover-objects-header__tags-block">
                <span className="discover-objects-header__topic ttc">
                  {intl.formatMessage({ id: 'filters', defaultMessage: 'Filters' })}:&nbsp;
                </span>
                {map(activeFilters, (filterValues, filterName) =>
                  filterValues.map(filterValue => (
                    <Tag
                      className="ttc"
                      key={`${filterName}:${filterValue}`}
                      closable
                      onClose={this.handleRemoveTag(filterName, filterValue)}
                    >
                      {filterValue}
                    </Tag>
                  )),
                )}
                <span
                  className="discover-objects-header__selector underline ttl"
                  role="presentation"
                  onClick={this.showFiltersModal}
                >
                  {intl.formatMessage({ id: 'add_new_proposition', defaultMessage: 'Add' })}
                </span>
              </div>
              <div className="discover-objects-header__toggle-map tc">
                <Button icon="compass" size="large">
                  {intl.formatMessage({ id: 'view_map', defaultMessage: 'View map' })}
                </Button>
              </div>
            </React.Fragment>
          ) : null}
        </div>
        {filteredObjects.length ? (
          <ReduxInfiniteScroll
            className="Feed"
            loadMore={this.loadMoreRelatedObjects}
            loader={<Loading />}
            loadingMore={isFetching}
            hasMore={hasMoreObjects}
            elementIsScrollable={false}
            threshold={1500}
          >
            {filteredObjects.map(wObj => (
              <ObjectCardView key={wObj.id} wObject={wObj} showSmallVersion intl={intl} />
            ))}
          </ReduxInfiniteScroll>
        ) : (
          <Loading />
        )}
        {modalTitle ? (
          <Modal
            className="discover-filters-modal"
            footer={null}
            title={intl.formatMessage({
              id: modalTitle,
              defaultMessage: modalTitle,
            })}
            closable
            visible={isModalOpen}
            onCancel={this.closeModal}
          >
            {modalTitle === modalName.FILTERS && (
              <DiscoverObjectsFilters intl={intl} filters={availableFilters} />
            )}
            {modalTitle === modalName.OBJECTS && <SidenavDiscoverObjects withTitle={false} />}
          </Modal>
        ) : null}
      </React.Fragment>
    );
  }
}

export default DiscoverObjectsContent;