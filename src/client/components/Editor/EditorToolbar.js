import React from 'react';
import PropTypes from 'prop-types';
import { Scrollbars } from 'react-custom-scrollbars';
import { injectIntl, FormattedMessage } from 'react-intl';
import { Button, Menu, Dropdown, Icon, Popover } from 'antd';
import BTooltip from '../BTooltip';
import SearchObjectsAutocomplete from '../EditorObject/SearchObjectsAutocomplete';
import './EditorToolbar.less';
import FormattedLink from '../EditorObject/FormattedLink';

const tooltip = (description, shortcut) => (
  <span>
    {description}
    <br />
    <b>{shortcut}</b>
  </span>
);

const EditorToolbar = ({ intl, onSelect, onSelectLinkedObject }) => {
  const menu = (
    <Menu onClick={e => onSelect(e.key)}>
      <Menu.Item key="h1">
        <h1>
          <FormattedMessage id="heading_1" defaultMessage="Heading 1" />
        </h1>
      </Menu.Item>
      <Menu.Item key="h2">
        <h2>
          <FormattedMessage id="heading_2" defaultMessage="Heading 2" />
        </h2>
      </Menu.Item>
      <Menu.Item key="h3">
        <h3>
          <FormattedMessage id="heading_3" defaultMessage="Heading 3" />
        </h3>
      </Menu.Item>
      <Menu.Item key="h4">
        <h4>
          <FormattedMessage id="heading_4" defaultMessage="Heading 4" />
        </h4>
      </Menu.Item>
      <Menu.Item key="h5">
        <h5>
          <FormattedMessage id="heading_5" defaultMessage="Heading 5" />
        </h5>
      </Menu.Item>
      <Menu.Item key="h6">
        <h6>
          <FormattedMessage id="heading_6" defaultMessage="Heading 6" />
        </h6>
      </Menu.Item>
    </Menu>
  );

  return (
    <Scrollbars
      style={{ width: '100%', height: 40 }}
      universal
      autoHide
      renderView={({ style, ...props }) => (
        <div style={{ ...style }} {...props} className="EditorToolbar__container" />
      )}
    >
      <div className="EditorToolbar">
        <Dropdown overlay={menu}>
          <Button className="EditorToolbar__button">
            <i className="iconfont icon-fontsize" /> <Icon type="down" />
          </Button>
        </Dropdown>
        <BTooltip
          title={tooltip(intl.formatMessage({ id: 'bold', defaultMessage: 'Add bold' }), '')}
        >
          <Button className="EditorToolbar__button" onClick={() => onSelect('b')}>
            <i className="iconfont icon-bold" />
          </Button>
        </BTooltip>
        <BTooltip
          title={tooltip(intl.formatMessage({ id: 'italic', defaultMessage: 'Add italic' }), '')}
        >
          <Button className="EditorToolbar__button" onClick={() => onSelect('i')}>
            <i className="iconfont icon-italic" />
          </Button>
        </BTooltip>
        <BTooltip
          title={tooltip(intl.formatMessage({ id: 'quote', defaultMessage: 'Add quote' }), '')}
        >
          <Button className="EditorToolbar__button" onClick={() => onSelect('q')}>
            <i className="iconfont icon-q1" />
          </Button>
        </BTooltip>
        <Popover
          content={
            <FormattedLink
              handleSelect={onSelectLinkedObject}
              canCreateNewObject={false}
              addLink={onSelect}
            />
          }
          title={intl.formatMessage({ id: 'link', defaultMessage: 'Add link' })}
          overlayClassName="EditorToolbar__popover"
          trigger="hover"
          placement="bottom"
        >
          <Button className="EditorToolbar__button">
            <i className="iconfont icon-link" />
          </Button>
        </Popover>
        <BTooltip
          title={tooltip(intl.formatMessage({ id: 'image', defaultMessage: 'Add image' }), '')}
        >
          <Button className="EditorToolbar__button" onClick={() => onSelect('image')}>
            <i className="iconfont icon-picture" />
          </Button>
        </BTooltip>

        <Popover
          content={
            <SearchObjectsAutocomplete
              handleSelect={onSelectLinkedObject}
              canCreateNewObject={false}
            />
          }
          title={intl.formatMessage({ id: 'add_object', defaultMessage: 'Add object' })}
          overlayClassName="EditorToolbar__popover"
          trigger="hover"
          placement="bottom"
        >
          <Button className="EditorToolbar__button">
            <Icon type="codepen" className="iconfont" />
          </Button>
        </Popover>
      </div>
    </Scrollbars>
  );
};

EditorToolbar.propTypes = {
  intl: PropTypes.shape().isRequired,
  onSelect: PropTypes.func,
  onSelectLinkedObject: PropTypes.func.isRequired,
};

EditorToolbar.defaultProps = {
  onSelect: () => {},
};

export default injectIntl(EditorToolbar);
