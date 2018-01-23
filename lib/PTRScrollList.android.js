/**
 * Created by hebao on 2017/8/28.
 */
'use strict'
import React, {Component} from 'react'
import {
  View,
  Dimensions,
  Animated,
  Text,
  ScrollView,
  ListView,
  FlatList,
  VirtualizedList,
  PanResponder,
  ActivityIndicator
} from 'react-native'
import PropTypes from 'prop-types'

const {width, height} = Dimensions.get('window')
const
  G_STATUS_NONE = 0,// 正常手势，没有上拉或者下拉刷新
  G_STATUS_PULLING_UP = 1,// ListView 处于底部，上拉加载更多
  G_STATUS_PULLING_DOWN = 2,// ListView 处于顶部，下拉刷新
  G_STATUS_RELEASE_TO_REFRESH = 3,// 拉动距离处于可触发刷新或者加载状态
  G_STATUS_HEADER_REFRESHING = 4,// 顶部正在刷新
  G_STATUS_FOOTER_REFRESHING = 5;// 底部正在加载更多

let
  G_PULL_UP_DISTANCE = 60,//上拉加载更多最大上拉距离
  G_PULL_UP_THRESHOLD = 10,
  G_PULL_DOWN_DISTANCE = 60,//下拉刷新下拉距离大于 60 时触发下拉刷新
  G_PULL_DOWN_THRESHOLD = 10,
  T_HEADER_ANI = 260//刷新头部动画时间

const _onHeaderRefreshing = () => {
  setTimeout(() => {
    PTRScrollList.headerRefreshDone();
  }, 2000)
}

const _renderHeaderRefresh = (gestureStatus) => {
  switch (gestureStatus) {
    case G_STATUS_PULLING_DOWN:
      return (
        <View style={{width, height: 60, justifyContent: 'center', alignItems: 'center'}}>
          <Text>{'下拉刷新'}</Text>
        </View>
      )
      break
    case G_STATUS_RELEASE_TO_REFRESH:
      return (
        <View style={{width, height: 60, justifyContent: 'center', alignItems: 'center'}}>
          <Text>{'松开即可刷新'}</Text>
        </View>
      )
      break
    case G_STATUS_HEADER_REFRESHING:
      return (
        <View style={{width, height: 60, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator
            size={'small'}
            animating={true}
            color={'#75c5fe'}
            style={{marginRight: 10}}/>
          <Text>{'正在刷新...'}</Text>
        </View>
      )
      break
    default:
      return (
        <View style={{width, height: 60, justifyContent: 'center', alignItems: 'center'}}>
          <Text>{'下拉刷新'}</Text>
        </View>
      )
  }
}

class HeaderRefresh extends Component {
  static setGestureStatus = (gestureStatus, callback) => null

  static defaultProps = {
    renderHeaderRefresh: () => null
  };

  constructor(props) {
    super(props);
    this.state = {
      gestureStatus: G_STATUS_NONE,
    }
    HeaderRefresh.setGestureStatus = this._setGestureStatus
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextState.gestureStatus !== this.state.gestureStatus
  }

  _setGestureStatus = (gestureStatus, callback) => {
    if (gestureStatus !== this.state.gestureStatus) {
      this.setState({gestureStatus}, () => callback instanceof Function && callback())
    }
  }

  render() {
    return this.props.renderHeaderRefresh(this.state.gestureStatus)
  }
}

const _onFooterInfiniting = () => {
  setTimeout(() => {
    PTRScrollList.footerInfiniteDone()
  }, 2000)
}

const _renderFooterInfinite = (gestureStatus) => {
  switch (gestureStatus) {
    case G_STATUS_PULLING_UP:
      return (
        <View style={{width, height: 60, justifyContent: 'center', alignItems: 'center'}}>
          <Text>{'上拉即可加载更多...'}</Text>
        </View>
      )
      break
    case G_STATUS_RELEASE_TO_REFRESH:
      return (
        <View style={{width, height: 60, justifyContent: 'center', alignItems: 'center'}}>
          <Text>{'松开即可加载更多...'}</Text>
        </View>
      )
      break
    case G_STATUS_FOOTER_REFRESHING:
      return (
        <View style={{width, height: 60, flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
          <ActivityIndicator
            size={'small'}
            animating={true}
            color={'#75c5fe'}
            style={{marginRight: 10}}/>
          <Text>{'正在加载...'}</Text>
        </View>
      )
      break;
    default:
      return (
        <View style={{width, height: 60, justifyContent: 'center', alignItems: 'center'}}>
          <Text>{'上拉即可加载更多...'}</Text>
        </View>
      )
  }
}

class FooterInfinite extends Component {
  static setGestureStatus = (gestureStatus, callback) => null

  static defaultProps = {
    renderFooterInfinite: () => null
  };

  constructor(props) {
    super(props);
    this.state = {
      gestureStatus: G_STATUS_NONE,
    }
    FooterInfinite.setGestureStatus = this._setGestureStatus
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextState.gestureStatus !== this.state.gestureStatus
  }

  _setGestureStatus = (gestureStatus, callback) => {
    if (gestureStatus !== this.state.gestureStatus) {
      this.setState({gestureStatus}, () => callback instanceof Function && callback())
    }
  }

  render() {
    return this.props.renderFooterInfinite(this.state.gestureStatus)
  }
}

class PTRScrollComponent extends Component {
  _headerRefreshHandle = -1//刷新完成句柄
  static headerRefreshDone = () => null
  static footerInfiniteDone = () => null

  constructor(props) {
    super(props)
    this.state = {
      //当前手势状态
      gestureStatus: G_STATUS_NONE,
      //当前拖动状态
      onDrag: false,
      //当前是否惯性滚动状态
      onScrollWithoutDrag: false,

      startPageY: 0,
      movePageY: 0,
      dragDirection: 0,//-1上拉 0无 1下拉

      p_translateY: new Animated.Value(0),
      p_currPullDistance: G_PULL_DOWN_DISTANCE,
      p_lastPullDistance: 0,
      l_onTopReached_down: false,
    }
    PTRScrollComponent.headerRefreshDone = this._headerRefreshDone
    PTRScrollComponent.footerInfiniteDone = this._footerInfiniteDone
  }

  componentWillMount() {
    this._panResponder = PanResponder.create({
      onMoveShouldSetPanResponderCapture: this.onMoveShouldSetPanResponderCapture,
      onPanResponderMove: this.onPanResponderMove,
      onPanResponderEnd: this.onPanResponderEnd,
    });
  }

  componentDidMount() {
    let {enableHeaderRefresh, onHeaderRefreshing} = this.props
    if (enableHeaderRefresh) {
      onHeaderRefreshing instanceof Function && onHeaderRefreshing()
      this._setGestureStatus(G_STATUS_HEADER_REFRESHING, null, true, true)
    }
  }

  componentWillUnmount() {
    clearTimeout(this._headerRefreshHandle)
  }

  _headerRefreshDone = () => {
    //定时是因为：存在可能scrollContentLayout函数调用比_headerRefreshDone函数调用慢，导致两个值的比较没有真实反映出scrollView的内容宽度
    this._headerRefreshHandle = setTimeout(() => {
      if (this.scrollContentHeight - G_PULL_DOWN_DISTANCE <= this.scrollViewHeight) {
        this._scrollView.setNativeProps({scrollEnabled: false})
        Animated.timing(this.state.p_translateY, {
          toValue: -G_PULL_DOWN_DISTANCE,
          duration: T_HEADER_ANI,
          useNativeDriver: true
        }).start(() => {
          this._setGestureStatus(G_STATUS_NONE, null, false, true)
          this.state.p_currPullDistance = 0
        })
      }
      else {
        this._scrollView.setNativeProps({scrollEnabled: true})
        this.state.p_translateY.setValue(0)
        this.state.p_currPullDistance = 0
        this._setGestureStatus(G_STATUS_NONE, null, false, true)
        this._scrollToPos(0, G_PULL_DOWN_DISTANCE, true)
      }
    }, 200)
  }

  _footerInfiniteDone = () => {
    this.props.enableHeaderRefresh && this._headerRefresh.setNativeProps({style: {height: this.props.setHeaderHeight}})
    this._setGestureStatus(G_STATUS_NONE, null, false, false)
    this._footerInfinite.setNativeProps({style: {height: 0}})
  }

  _setGestureStatus = (status, callback, refresh, updateHeader) => {
    this.state.gestureStatus = status
    if (refresh) {
      updateHeader ? HeaderRefresh.setGestureStatus(status, callback) : FooterInfinite.setGestureStatus(status, callback)
    }
  }

  _scrollToPos = (x, y, animated) => {
    this._scrollView.scrollTo({x, y, animated})
  }

  onScroll = (e) => {
    let {y} = e.nativeEvent.contentOffset
    let {contentSize, layoutMeasurement} = e.nativeEvent
    let {gestureStatus, onDrag, onScrollWithoutDrag, dragDirection} = this.state
    let _maxOffsetY = contentSize.height - layoutMeasurement.height

    //下拉
    if (dragDirection === 1) {
      //手指正在拖动视图
      if (onDrag) {
        if (gestureStatus === G_STATUS_PULLING_DOWN) {
          if (y <= G_PULL_DOWN_THRESHOLD) {
            //释放刷新
            this._setGestureStatus(G_STATUS_RELEASE_TO_REFRESH, null, true, true)
          }
        }
        else if (gestureStatus === G_STATUS_RELEASE_TO_REFRESH) {
          if (y > G_PULL_DOWN_THRESHOLD) {
            //下拉刷新
            this._setGestureStatus(G_STATUS_PULLING_DOWN, null, true, true)
          }
        }
      }
      //交互操作之后，视图正在滚动
      else if (onScrollWithoutDrag) {

      }
      //函数滚动，scrollTo，scrollTo不会触发 onMomentumScrollBegin
      else {
        if (gestureStatus === G_STATUS_NONE) {
          if (y === G_PULL_DOWN_DISTANCE) {
            this._setGestureStatus(G_STATUS_NONE, null, true, true)
          }
        }
      }
    }
    //上拉
    else if (dragDirection === -1) {
      //手指正在拖动视图
      if (onDrag) {
        if (gestureStatus === G_STATUS_PULLING_UP) {
          if (y >= _maxOffsetY - G_PULL_UP_THRESHOLD) {
            //释放加载
            this._setGestureStatus(G_STATUS_RELEASE_TO_REFRESH, null, true, false)
          }
        }
        else if (gestureStatus === G_STATUS_RELEASE_TO_REFRESH) {
          if (y < _maxOffsetY - G_PULL_UP_THRESHOLD) {
            //上拉加载
            this._setGestureStatus(G_STATUS_PULLING_UP, null, true, false)
          }
        }
      }
      //交互操作之后，视图正在滚动
      else if (onScrollWithoutDrag) {
        if (y <= _maxOffsetY - G_PULL_UP_DISTANCE) {
          //惯性滚动位置滚出加载区域时，重置加载区域
          this._setGestureStatus(G_STATUS_NONE, null, true, false)
          this._footerInfinite.setNativeProps({style: {height: 0}})
        }
      }
      //函数滚动，scrollTo，scrollTo不会触发 onMomentumScrollBegin
      else {
        if (y <= _maxOffsetY - G_PULL_UP_DISTANCE) {
          //加载完毕归位
          this._setGestureStatus(G_STATUS_NONE, null, true, false)
          this._footerInfinite.setNativeProps({style: {height: 0}})
        }
      }
    }
    //未确定方向，可能从中部下拉到下拉刷新的阈值，也可能是从中部上拉到上拉加载的阈值
    else {
      //手指正在拖动视图
      if (onDrag) {
        //无状态
        if (gestureStatus === G_STATUS_NONE) {
          //开始下拉
          if (y <= G_PULL_DOWN_DISTANCE) {
            this.state.dragDirection = 1
            this._setGestureStatus(G_STATUS_PULLING_DOWN, null, true, true)
          }
          //开始上拉
          else if (y >= _maxOffsetY && this.props.enableFooterInfinite) {
            this.state.dragDirection = -1
            this._setGestureStatus(G_STATUS_PULLING_UP, null, true, false)
            this._footerInfinite.setNativeProps({style: {height: G_PULL_UP_DISTANCE}})
          }
        }
      }
      //交互操作之后，视图正在滚动
      else if (onScrollWithoutDrag) {

      }
      //函数滚动，scrollTo，scrollTo不会触发 onMomentumScrollBegin
      else {
        if (gestureStatus === G_STATUS_NONE) {
          if (y === G_PULL_DOWN_DISTANCE) {
            //刷新完毕归位
            this._setGestureStatus(G_STATUS_NONE, null, true, true)
          }
        }
      }
    }

    this.props.onScroll instanceof Function && this.props.onScroll(e)
  }

  onTouchStart = (e) => {
    this.state.startPageY = e.nativeEvent.pageY
    this.props.onTouchStart instanceof Function && this.props.onTouchStart(e)
  }

  onTouchMove = (e) => {
    this.state.movePageY = e.nativeEvent.pageY
    this.props.onTouchMove instanceof Function && this.props.onTouchMove(e)
  }

  onScrollBeginDrag = (e) => {
    this.state.onDrag = true
    this.state.dragDirection = 0

    let {contentOffset, contentSize, layoutMeasurement} = e.nativeEvent
    let {gestureStatus, startPageY, movePageY} = this.state
    if (contentOffset.y <= G_PULL_DOWN_DISTANCE) {
      //到顶部
      if (movePageY > startPageY) {
        //下拉
        if (gestureStatus !== G_STATUS_HEADER_REFRESHING && gestureStatus !== G_STATUS_FOOTER_REFRESHING) {
          this.state.dragDirection = 1
          this._setGestureStatus(G_STATUS_PULLING_DOWN, null, true, true)
        }
      }
    }
    else if (contentOffset.y >= contentSize.height - layoutMeasurement.height) {
      //到底部
      if (movePageY < startPageY) {
        //上拉
        if (gestureStatus !== G_STATUS_HEADER_REFRESHING && gestureStatus !== G_STATUS_FOOTER_REFRESHING && this.props.enableFooterInfinite) {
          this.state.dragDirection = -1
          this._setGestureStatus(G_STATUS_PULLING_UP, null, true, false)
          this._footerInfinite.setNativeProps({style: {height: G_PULL_UP_DISTANCE}})
        }
      }
    }

    this.props.onScrollBeginDrag instanceof Function && this.props.onScrollBeginDrag(e)
  }

  onScrollEndDrag = (e) => {
    this.state.onDrag = false
    this.state.startPageY = this.state.movePageY = 0

    let {gestureStatus, dragDirection} = this.state
    let {contentSize, layoutMeasurement} = e.nativeEvent
    let _maxOffsetY = contentSize.height - layoutMeasurement.height
    //下拉
    if (dragDirection === 1) {
      if (gestureStatus === G_STATUS_PULLING_DOWN) {
        this._setGestureStatus(G_STATUS_NONE, null, false, true)
        this._scrollToPos(0, G_PULL_DOWN_DISTANCE, true)
      }
      else if (gestureStatus === G_STATUS_RELEASE_TO_REFRESH) {
        this._setGestureStatus(G_STATUS_HEADER_REFRESHING, null, true, true)
        this.props.onHeaderRefreshing instanceof Function && this.props.onHeaderRefreshing()
      }
    }
    //上拉
    else if (dragDirection === -1) {
      if (gestureStatus === G_STATUS_PULLING_UP) {
        this._setGestureStatus(G_STATUS_NONE, null, false, false)
        this._scrollToPos(0, _maxOffsetY - G_PULL_UP_DISTANCE, true)
      }
      else if (gestureStatus === G_STATUS_RELEASE_TO_REFRESH) {
        this.props.enableHeaderRefresh && this._headerRefresh.setNativeProps({style: {height: 0}})
        this._setGestureStatus(G_STATUS_FOOTER_REFRESHING, null, true, false)
        this.props.onFooterInfiniting instanceof Function && this.props.onFooterInfiniting()
      }
    }

    this.props.onScrollEndDrag instanceof Function && this.props.onScrollEndDrag(e)
  }

  onMomentumScrollBegin = (e) => {
    //scrollTo 设置 animated 为 true 时，不会触发 onMomentumScrollBegin
    this.state.onScrollWithoutDrag = true
    this.props.onMomentumScrollBegin instanceof Function && this.props.onMomentumScrollBegin(e)
  }

  onMomentumScrollEnd = (e) => {
    this.state.onScrollWithoutDrag = false

    let {gestureStatus, dragDirection} = this.state
    let {contentOffset, contentSize, layoutMeasurement} = e.nativeEvent

    if (dragDirection === 0) {
      if (gestureStatus === G_STATUS_NONE) {
        if (contentOffset.y < G_PULL_DOWN_DISTANCE) {
          this._scrollToPos(0, G_PULL_DOWN_DISTANCE, true)
        }
      }
    }

    this.props.onMomentumScrollEnd instanceof Function && this.props.onMomentumScrollEnd(e)
  }

  scrollViewLayout = (e) => {
    this.scrollViewHeight = e.nativeEvent.layout.height
  }

  scrollContentLayout = (e) => {
    this.scrollContentHeight = e.nativeEvent.layout.height
  }

  onMoveShouldSetPanResponderCapture = (evt, gestureState) => {
    this.state.l_onTopReached_down = this.state.l_onTopReached_up = false
    this.state.p_lastPullDistance = this.state.p_currPullDistance

    let _pullDown = gestureState.dy > 0 && gestureState.vy > 0
    let _pullUp = gestureState.dy < 0 && gestureState.vy < 0

    if (this.scrollContentHeight - G_PULL_DOWN_DISTANCE <= this.scrollViewHeight) {
      //到顶部
      if (_pullDown) {//下拉
        this.state.l_onTopReached_down = this.state.p_currPullDistance === 0
      }
      else if (_pullUp) {//上拉
        this.state.l_onTopReached_up = this.state.p_currPullDistance !== 0
      }
    }

    return this.props.enableHeaderRefresh && (this.state.l_onTopReached_down || this.state.l_onTopReached_up)
  }

  onPanResponderMove = (evt, gestureState) => {
    let _translateY = Math.ceil(Math.abs(gestureState.dy)) * 0.48
    //下拉刷新
    if (this.state.l_onTopReached_down && gestureState.dy > 0) {
      this.state.p_currPullDistance = _translateY >= G_PULL_DOWN_DISTANCE ? G_PULL_DOWN_DISTANCE : _translateY
      this.state.p_translateY.setValue(-G_PULL_DOWN_DISTANCE + this.state.p_currPullDistance)

      if (this.state.gestureStatus !== G_STATUS_HEADER_REFRESHING) {
        if (this.state.p_currPullDistance >= G_PULL_DOWN_DISTANCE) {
          if (this.state.gestureStatus !== G_STATUS_RELEASE_TO_REFRESH) {
            this._setGestureStatus(G_STATUS_RELEASE_TO_REFRESH, null, true, true)
          }
        }
        else {
          if (this.state.gestureStatus !== G_STATUS_PULLING_DOWN) {
            this._setGestureStatus(G_STATUS_PULLING_DOWN, null, true, true)
          }
        }
      }
    }
    //上拉隐藏刷新面板
    else if (this.state.l_onTopReached_up && gestureState.dy < 0) {
      let _currPullDistance = this.state.p_lastPullDistance - _translateY
      this.state.p_currPullDistance = _currPullDistance <= 0 ? 0 : _currPullDistance
      this.state.p_translateY.setValue(-G_PULL_DOWN_DISTANCE + this.state.p_currPullDistance)

      if (this.state.gestureStatus !== G_STATUS_HEADER_REFRESHING) {
        if (this.state.p_currPullDistance < G_PULL_DOWN_DISTANCE) {
          if (this.state.gestureStatus !== G_STATUS_PULLING_DOWN) {
            this._setGestureStatus(G_STATUS_PULLING_DOWN, null, true, true)
          }
        }
      }
    }
  }

  onPanResponderEnd = () => {
    //下拉刷新
    if (this.state.l_onTopReached_down) {
      if (this.state.p_currPullDistance < G_PULL_DOWN_DISTANCE) {
        Animated.timing(this.state.p_translateY, {
          toValue: -G_PULL_DOWN_DISTANCE,
          duration: T_HEADER_ANI,
          useNativeDriver: true
        }).start(() => this.state.p_currPullDistance = 0)
      }
      else {
        if (this.state.gestureStatus !== G_STATUS_HEADER_REFRESHING) {
          this.props.onHeaderRefreshing instanceof Function && this.props.onHeaderRefreshing()
          this._setGestureStatus(G_STATUS_HEADER_REFRESHING, null, true, true)
        }
      }
    }
    //上拉隐藏刷新面板
    else if (this.state.l_onTopReached_up) {
      Animated.timing(this.state.p_translateY, {
        toValue: -G_PULL_DOWN_DISTANCE,
        duration: T_HEADER_ANI,
        useNativeDriver: true
      }).start(() => this.state.p_currPullDistance = 0)
    }
  }

  render() {
    let {enableHeaderRefresh, enableFooterInfinite} = this.props
    return (
      <View style={{flex: 1}} {...this._panResponder.panHandlers}>
        <ScrollView
          {...this.props}
          ref={ref => this._scrollView = ref}
          onLayout={this.scrollViewLayout}
          onTouchStart={this.onTouchStart}
          onTouchMove={this.onTouchMove}
          scrollEventThrottle={16}
          onScroll={this.onScroll}
          onScrollBeginDrag={this.onScrollBeginDrag}
          onScrollEndDrag={this.onScrollEndDrag}
          onMomentumScrollBegin={this.onMomentumScrollBegin}
          onMomentumScrollEnd={this.onMomentumScrollEnd}>
          <Animated.View
            style={{transform: [{translateY: this.state.p_translateY}]}}
            onLayout={this.scrollContentLayout}>
            <View ref={ref => this._headerRefresh = ref} style={{backgroundColor: 'transparent'}}>
              {enableHeaderRefresh ? <HeaderRefresh {...this.props}/> : null}
            </View>
            {this.props.children}
            <View ref={ref => this._footerInfinite = ref} style={{height: 0, backgroundColor: 'transparent'}}>
              {enableFooterInfinite ? <FooterInfinite {...this.props}/> : null}
            </View>
          </Animated.View>
        </ScrollView>
      </View>
    )
  }
}

export default class PTRScrollList extends Component {
  static headerRefreshDone = () => PTRScrollComponent.headerRefreshDone()
  static footerInfiniteDone = () => PTRScrollComponent.footerInfiniteDone()

  static propTypes = {
    scrollComponent: PropTypes.oneOf(['ScrollView', 'ListView', 'FlatList', 'VirtualizedList']).isRequired,

    enableHeaderRefresh: PropTypes.bool,
    renderHeaderRefresh: PropTypes.func,
    setHeaderHeight: PropTypes.number,
    onHeaderRefreshing: PropTypes.func,

    enableFooterInfinite: PropTypes.bool,
    renderFooterInfinite: PropTypes.func,
    setFooterHeight: PropTypes.number,
    onFooterInfiniting: PropTypes.func,
  }

  static defaultProps = {
    scrollComponent: 'FlatList',

    enableHeaderRefresh: false,
    renderHeaderRefresh: _renderHeaderRefresh,
    setHeaderHeight: G_PULL_DOWN_DISTANCE,
    onHeaderRefreshing: _onHeaderRefreshing,

    enableFooterInfinite: false,
    renderFooterInfinite: _renderFooterInfinite,
    setFooterHeight: G_PULL_UP_DISTANCE,
    onFooterInfiniting: _onFooterInfiniting,
  }

  constructor(props) {
    super(props)
    G_PULL_DOWN_DISTANCE = props.enableHeaderRefresh ? props.setHeaderHeight : -height
    G_PULL_UP_DISTANCE = props.setFooterHeight
  }

  componentWillReceiveProps(nextProps, nextState) {
    if (nextProps.enableHeaderRefresh !== undefined) {
      G_PULL_DOWN_DISTANCE = nextProps.enableHeaderRefresh ? this.props.setHeaderHeight : -height
    }
  }

  render() {
    let {scrollComponent} = this.props
    let ScrollComponent = null
    switch (scrollComponent) {
      case 'ScrollView':
        ScrollComponent = <PTRScrollComponent {...this.props}/>
        break
      case 'ListView':
        ScrollComponent = <ListView {...this.props}/>
        break
      case 'FlatList':
        ScrollComponent = <FlatList {...this.props}/>
        break
      case 'VirtualizedList':
        ScrollComponent = <VirtualizedList {...this.props}/>
        break
      default:
        ScrollComponent = <FlatList {...this.props}/>
        break
    }
    return (
      React.cloneElement(ScrollComponent, {
        renderScrollComponent: props => <PTRScrollComponent {...props}/>
      })
    )
  }
}