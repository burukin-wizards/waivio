import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import find from 'lodash/find';
import Slider from '../../components/Slider/Slider';
import Payout from '../../components/StoryFooter/Payout';
import CampaignButtons from './CampaignButtons';
import Comments from '../../comments/Comments';
import { getVoteValue } from '../../helpers/user';
import './CampaignFooter.less';
import { getRate, getAppUrl } from '../../reducers';
import Confirmation from '../../components/StoryFooter/Confirmation';
import withAuthActions from '../../auth/withAuthActions';

@withAuthActions
@connect(state => ({
  rate: getRate(state),
  appUrl: getAppUrl(state),
}))
class CampaignFooter extends React.Component {
  static propTypes = {
    user: PropTypes.shape().isRequired,
    post: PropTypes.shape().isRequired,
    postState: PropTypes.shape().isRequired,
    buttonsLayout: PropTypes.shape().isRequired,
    rewardFund: PropTypes.shape().isRequired,
    requiredObjectPermlink: PropTypes.string.isRequired,
    rate: PropTypes.number.isRequired,
    defaultVotePercent: PropTypes.number.isRequired,
    votePost: PropTypes.func.isRequired,
    unfollowUser: PropTypes.func.isRequired,
    unfollowObject: PropTypes.func.isRequired,
    followUser: PropTypes.func.isRequired,
    followObject: PropTypes.func.isRequired,
    onActionInitiated: PropTypes.func.isRequired,
    ownPost: PropTypes.bool,
    sliderMode: PropTypes.bool,
    pendingLike: PropTypes.bool,
    pendingFollow: PropTypes.bool,
    pendingFollowObject: PropTypes.bool,
    saving: PropTypes.bool,
    singlePostVew: PropTypes.bool,
    onLikeClick: PropTypes.func,
  };

  static defaultProps = {
    pendingLike: false,
    pendingFlag: false,
    ownPost: false,
    pendingFollow: false,
    pendingFollowObject: false,
    pendingBookmark: false,
    saving: false,
    singlePostVew: false,
    sliderMode: false,
    onLikeClick: () => {},
    onShareClick: () => {},
    handlePostPopoverMenuClick: () => {},
  };

  constructor(props) {
    super(props);

    this.state = {
      sliderVisible: false,
      commentsVisible: !props.post.children,
      sliderValue: 100,
      voteWorth: 0,
    };
    this.handlePostPopoverMenuClick = this.handlePostPopoverMenuClick.bind(this);
  }

  componentWillMount() {
    const { user, post, defaultVotePercent } = this.props;
    if (user) {
      const userVote = find(post.active_votes, { voter: user.name }) || {};

      if (userVote.percent && userVote.percent > 0) {
        this.setState({
          sliderValue: userVote.percent / 100,
        });
      } else {
        this.setState({
          sliderValue: defaultVotePercent / 100,
        });
      }
    }
  }

  onLikeClick = (post, postState, weight = 10000) => {
    const { sliderMode, defaultVotePercent } = this.props;
    const author = post.author_original || post.author;

    if (sliderMode) {
      this.props.votePost(post.id, author, post.permlink, weight);
    } else if (postState.isLiked) {
      this.props.votePost(post.id, author, post.permlink, 0);
    } else {
      this.props.votePost(post.id, author, post.permlink, defaultVotePercent);
    }
  };

  handleLikeClick = () => {
    if (this.props.sliderMode) {
      if (!this.state.sliderVisible) {
        this.setState(prevState => ({ sliderVisible: !prevState.sliderVisible }));
      }
    } else {
      this.onLikeClick(this.props.post, this.props.postState);
    }
  };

  handleFollowClick(post) {
    const { userFollowed } = this.props.postState;
    if (userFollowed) {
      this.props.unfollowUser(post.author);
    } else {
      this.props.followUser(post.author);
    }
  }

  handleFollowObjectClick() {
    const { objectFollowed } = this.props.postState;
    if (objectFollowed) {
      this.props.unfollowObject(this.props.requiredObjectPermlink);
    } else {
      this.props.followObject(this.props.requiredObjectPermlink);
    }
  }

  clickMenuItem(key) {
    const { post } = this.props;
    switch (key) {
      case 'follow':
        this.handleFollowClick(post);
        break;
      case 'followObject':
        this.handleFollowObjectClick(post);
        break;
      default:
    }
  }

  handlePostPopoverMenuClick(key) {
    this.props.onActionInitiated(this.clickMenuItem.bind(this, key));
  }

  handleLikeConfirm = () => {
    this.setState({ sliderVisible: false }, () => {
      this.props.onLikeClick(this.props.post, this.props.postState, this.state.sliderValue * 100);
    });
  };

  handleSliderCancel = () => this.setState({ sliderVisible: false });

  handleSliderChange = value => {
    const { user, rewardFund, rate } = this.props;
    const voteWorth = getVoteValue(
      user,
      rewardFund.recent_claims,
      rewardFund.reward_balance,
      rate,
      value * 100,
    );
    this.setState({ sliderValue: value, voteWorth });
  };

  toggleCommentsVisibility = isVisible => {
    if (this.props.post.children > 0) {
      this.setState(prevState => ({ commentsVisible: isVisible || !prevState.commentsVisible }));
    }
  };

  render() {
    const { commentsVisible } = this.state;
    const {
      post,
      postState,
      pendingLike,
      ownPost,
      defaultVotePercent,
      pendingFollow,
      saving,
      singlePostVew,
      pendingFollowObject,
      buttonsLayout,
      requiredObjectPermlink,
    } = this.props;

    return (
      <div className="CampaignFooter">
        <div className="CampaignFooter__actions">
          <Payout post={post} />
          {this.state.sliderVisible && (
            <Confirmation onConfirm={this.handleLikeConfirm} onCancel={this.handleSliderCancel} />
          )}
          {!this.state.sliderVisible && (
            <CampaignButtons
              post={post}
              postState={postState}
              pendingLike={pendingLike}
              pendingFollow={pendingFollow}
              pendingFollowObject={pendingFollowObject}
              saving={saving}
              ownPost={ownPost}
              defaultVotePercent={defaultVotePercent}
              onLikeClick={this.handleLikeClick}
              onEditClick={this.handleEditClick}
              onCommentClick={this.toggleCommentsVisibility}
              handlePostPopoverMenuClick={this.handlePostPopoverMenuClick}
              buttonsLayout={buttonsLayout}
              requiredObjectPermlink={requiredObjectPermlink}
            />
          )}
        </div>
        {this.state.sliderVisible && (
          <Slider
            value={this.state.sliderValue}
            voteWorth={this.state.voteWorth}
            onChange={this.handleSliderChange}
          />
        )}
        {!singlePostVew && (
          <Comments show={commentsVisible} isQuickComments={!singlePostVew} post={post} />
        )}
      </div>
    );
  }
}

export default CampaignFooter;