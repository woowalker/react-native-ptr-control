/**
 * Created by woowalker on 2017/8/28.
 */
'use strict'
import React, {Component} from 'react'
import {
  View,
  StyleSheet,
  Dimensions,
  Text,
  ScrollView,
  ListView,
  FlatList,
  VirtualizedList,
  DeviceEventEmitter
} from 'react-native'
import PropTypes from 'prop-types'

const {width, height} = Dimensions.get('window')
const
  G_STATUS_NONE = 0,// 正常手势，没有上拉或者下拉刷新
  G_STATUS_PULLING_UP = 1,// ListView 处于底部，上拉加载更多
  G_STATUS_PULLING_DOWN = 2,// ListView 处于顶部，下拉刷新
  G_STATUS_RELEASE_TO_REFRESH = 3,// 拉动距离处于可触发刷新或者加载状态
  G_STATUS_HEADER_REFRESHING = 4,// 顶部正在刷新
  G_STATUS_FOOTER_REFRESHING = 5,// 底部正在加载更多
  EVENT_HEADER_REFRESH = 'PTR_SCROLL_LIST_HEADER_REFRESH_DONE',//刷新事件
  EVENT_FOOTER_INFINITE = 'PTR_SCROLL_LIST_FOOTER_REFRESH_DONE'//加载事件

let
  G_PULL_UP_DISTANCE = 60,//上拉加载更多最大上拉距离
  G_PULL_DOWN_DISTANCE = 60;//下拉刷新下拉距离大于 60 时触发下拉刷新

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
        <View style={{width, height: 60, justifyContent: 'center', alignItems: 'center'}}>
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
  static defaultProps = {
    renderHeaderRefresh: () => null
  };

  constructor(props) {
    super(props)
    this.state = {
      gestureStatus: G_STATUS_NONE,
    }
    props.getInstance instanceof Function && props.getInstance(this)
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextState.gestureStatus !== this.state.gestureStatus
  }

  setGestureStatus = (gestureStatus, callback) => {
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
        <View style={{width, height: 60, justifyContent: 'center', alignItems: 'center'}}>
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
  static defaultProps = {
    renderFooterInfinite: () => null
  };

  constructor(props) {
    super(props)
    this.state = {
      gestureStatus: G_STATUS_NONE,
    }
    props.getInstance instanceof Function && props.getInstance(this)
  }

  shouldComponentUpdate(nextProps, nextState) {
    return nextState.gestureStatus !== this.state.gestureStatus
  }

  setGestureStatus = (gestureStatus, callback) => {
    if (gestureStatus !== this.state.gestureStatus) {
      this.setState({gestureStatus}, () => callback instanceof Function && callback())
    }
  }

  render() {
    return this.props.renderFooterInfinite(this.state.gestureStatus)
  }
}

export default class PTRScrollList extends Component {
  _headerRefreshDoneHandle = null//刷新操作完成监听句柄
  _headerRefreshInstance = null//刷新头实例
  _footerInfiniteDoneHandle = null//加载操作完成监听句柄
  _footerInfiniteInstance = null//加载尾实例

  static headerRefreshDone = () => DeviceEventEmitter.emit(EVENT_HEADER_REFRESH, true)
  static footerInfiniteDone = () => DeviceEventEmitter.emit(EVENT_FOOTER_INFINITE, true)

  static propTypes = {
    scrollComponent: PropTypes.oneOf(['ScrollView', 'ListView', 'FlatList', 'VirtualizedList']).isRequired,

    getRef: PropTypes.func,

    enableHeaderRefresh: PropTypes.bool,
    renderHeaderRefresh: PropTypes.func,
    onHeaderRefreshing: PropTypes.func,

    enableFooterInfinite: PropTypes.bool,
    renderFooterInfinite: PropTypes.func,
    onFooterInfiniting: PropTypes.func,
  }

  static defaultProps = {
    scrollComponent: 'FlatList',

    enableHeaderRefresh: false,
    renderHeaderRefresh: _renderHeaderRefresh,
    onHeaderRefreshing: _onHeaderRefreshing,

    enableFooterInfinite: false,
    renderFooterInfinite: _renderFooterInfinite,
    onFooterInfiniting: _onFooterInfiniting,
  }

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
    }
  }

  componentWillMount() {
    this.props.enableHeaderRefresh ? this._headerRefreshDoneHandle = DeviceEventEmitter.addListener(EVENT_HEADER_REFRESH, this._headerRefreshDone) : null
    this.props.enableFooterInfinite ? this._footerInfiniteDoneHandle = DeviceEventEmitter.addListener(EVENT_FOOTER_INFINITE, this._footerInfiniteDone) : null
  }

  componentWillUnmount() {
    this._headerRefreshDoneHandle && this._headerRefreshDoneHandle.remove()
    this._footerInfiniteDoneHandle && this._footerInfiniteDoneHandle.remove()
  }

  _headerRefreshDone = () => {
    this._setGestureStatus(G_STATUS_NONE, null, false, true)
    !this.state.onScrollWithoutDrag && this._scrollToPos(0, true)
  }

  _footerInfiniteDone = () => {
    this._setGestureStatus(G_STATUS_NONE, null, false, false)
    this._footerInfinite.setNativeProps({style: {transform: [{translateY: G_PULL_UP_DISTANCE}]}})
  }

  _setGestureStatus = (status, callback, refresh, updateHeader) => {
    this.state.gestureStatus = status
    if (refresh) {
      updateHeader ? this._headerRefreshInstance.setGestureStatus(status, callback) : this._footerInfiniteInstance.setGestureStatus(status, callback)
    }
  }

  _scrollToPos = (offset, animated) => {
    let {scrollComponent} = this.props
    switch (scrollComponent) {
      case 'ScrollView':
      case 'ListView':
        this._scrollInstance.scrollTo({x: 0, y: offset, animated})
        break
      case 'FlatList':
      case 'VirtualizedList':
        this._scrollInstance.scrollToOffset({offset, animated})
        break
    }
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
          if (y <= 0 && Math.abs(y) >= G_PULL_DOWN_DISTANCE) {
            //释放刷新
            this._setGestureStatus(G_STATUS_RELEASE_TO_REFRESH, null, true, true)
          }
        }
        else if (gestureStatus === G_STATUS_RELEASE_TO_REFRESH) {
          if (y <= 0 && Math.abs(y) < G_PULL_DOWN_DISTANCE) {
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
          if (y === 0) {
            this._setGestureStatus(G_STATUS_NONE, null, true, true)
          }
        }
      }

      //位移刷新头 刷新头位移固定位置之后，不再移动
      if (this.state.gestureStatus === G_STATUS_PULLING_DOWN || this.state.gestureStatus === G_STATUS_NONE) {
        this._headerRefresh.setNativeProps({style: {transform: [{translateY: -G_PULL_DOWN_DISTANCE - y}]}})
      }
      else if (this.state.gestureStatus === G_STATUS_RELEASE_TO_REFRESH || this.state.gestureStatus === G_STATUS_HEADER_REFRESHING) {
        this._headerRefresh.setNativeProps({style: {transform: [{translateY: 0}]}})
      }
    }
    //上拉
    else if (dragDirection === -1) {
      //手指正在拖动视图
      if (onDrag) {
        if (gestureStatus === G_STATUS_PULLING_UP) {
          if (y - _maxOffsetY >= G_PULL_UP_DISTANCE) {
            //释放加载
            this._setGestureStatus(G_STATUS_RELEASE_TO_REFRESH, null, true, false)
          }
        }
        else if (gestureStatus === G_STATUS_RELEASE_TO_REFRESH) {
          if (y - _maxOffsetY < G_PULL_UP_DISTANCE) {
            //上拉加载
            this._setGestureStatus(G_STATUS_PULLING_UP, null, true, false)
          }
        }
      }
      //交互操作之后，视图正在滚动
      else if (onScrollWithoutDrag) {

      }
      //函数滚动，scrollTo，scrollTo不会触发 onMomentumScrollBegin
      else {
        if (y <= _maxOffsetY) {
          //加载完毕归位
          this._setGestureStatus(G_STATUS_NONE, null, true, false)
        }
      }

      //位移加载头 加载头位移固定位置之后，不再移动
      if (this.state.gestureStatus === G_STATUS_PULLING_UP || this.state.gestureStatus === G_STATUS_NONE) {
        this._footerInfinite.setNativeProps({style: {transform: [{translateY: G_PULL_UP_DISTANCE - (y - (contentSize.height - layoutMeasurement.height))}]}})
      }
      else if (this.state.gestureStatus === G_STATUS_RELEASE_TO_REFRESH || this.state.gestureStatus === G_STATUS_FOOTER_REFRESHING) {
        this._footerInfinite.setNativeProps({style: {transform: [{translateY: 0}]}})
      }
    }
    //未确定方向，可能从中部下拉到下拉刷新的阈值，也可能是从中部上拉到上拉加载的阈值
    else {
      //手指正在拖动视图
      if (onDrag) {
        //无状态
        if (gestureStatus === G_STATUS_NONE) {
          //开始下拉
          if (y <= 0) {
            this.state.dragDirection = 1
            this._setGestureStatus(G_STATUS_PULLING_DOWN, null, true, true)
          }
          //开始上拉
          else if (y >= _maxOffsetY && layoutMeasurement.height < contentSize.height) {
            this.state.dragDirection = -1
            this._setGestureStatus(G_STATUS_PULLING_UP, null, true, false)
          }
        }
      }
      //交互操作之后，视图正在滚动
      else if (onScrollWithoutDrag) {

      }
      //函数滚动，scrollTo，scrollTo不会触发 onMomentumScrollBegin
      else {
        if (gestureStatus === G_STATUS_NONE) {
          if (y === 0) {
            //刷新完毕归位
            this._setGestureStatus(G_STATUS_NONE, null, true, true)
          }
          else if (y <= _maxOffsetY) {
            //加载完毕归位
            this._setGestureStatus(G_STATUS_NONE, null, true, false)
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
    if (layoutMeasurement.height >= contentSize.height) {
      //不足一屏
      if (movePageY > startPageY) {
        //下拉
        if (gestureStatus !== G_STATUS_HEADER_REFRESHING && gestureStatus !== G_STATUS_FOOTER_REFRESHING) {
          this.state.dragDirection = 1
          this._setGestureStatus(G_STATUS_PULLING_DOWN, null, true, true)
        }
      }
      else {
        // 不足一屏不允许上拉
        // this.state.dragDirection = -1
        // if (gestureStatus !== G_STATUS_FOOTER_REFRESHING) {
        //   this._setGestureStatus(G_STATUS_PULLING_UP, null, true, false)
        // }
      }
    }
    else {
      if (contentOffset.y <= 0) {
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
          if (gestureStatus !== G_STATUS_HEADER_REFRESHING && gestureStatus !== G_STATUS_FOOTER_REFRESHING) {
            this.state.dragDirection = -1
            this._setGestureStatus(G_STATUS_PULLING_UP, null, true, false)
          }
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
      }
      else if (gestureStatus === G_STATUS_RELEASE_TO_REFRESH) {
        this._setGestureStatus(G_STATUS_HEADER_REFRESHING, null, true, true)
        this.props.onHeaderRefreshing instanceof Function && this.props.onHeaderRefreshing()
        this._scrollToPos(-G_PULL_DOWN_DISTANCE, false)
      }
    }
    //上拉
    else if (dragDirection === -1) {
      if (gestureStatus === G_STATUS_PULLING_UP) {
        this._setGestureStatus(G_STATUS_NONE, null, false, false)
      }
      else if (gestureStatus === G_STATUS_RELEASE_TO_REFRESH) {
        this._setGestureStatus(G_STATUS_FOOTER_REFRESHING, null, true, false)
        this.props.onFooterInfiniting instanceof Function && this.props.onFooterInfiniting()
        this._scrollToPos(_maxOffsetY + G_PULL_UP_DISTANCE, false)
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
    this.props.onMomentumScrollEnd instanceof Function && this.props.onMomentumScrollEnd(e)
  }

  render() {
    let {scrollComponent, enableHeaderRefresh, enableFooterInfinite} = this.props
    let ScrollComponent = null
    switch (scrollComponent) {
      case 'ScrollView':
        ScrollComponent = <ScrollView {...this.props}/>
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
      <View style={Styles.wrap}>
        <View
          ref={ref => this._headerRefresh = ref}
          onLayout={e => G_PULL_DOWN_DISTANCE = enableHeaderRefresh ? e.nativeEvent.layout.height : height}
          style={[Styles.refresh, {
            transform: [{
              translateY: -height
            }]
          }]}>
          {enableHeaderRefresh ?
            <HeaderRefresh getInstance={ins => this._headerRefreshInstance = ins} {...this.props}/> : null}
        </View>
        <View
          ref={ref => this._footerInfinite = ref}
          onLayout={e => G_PULL_UP_DISTANCE = enableFooterInfinite ? e.nativeEvent.layout.height : height}
          style={[Styles.infinite, {
            transform: [{
              translateY: height
            }]
          }]}>
          {enableFooterInfinite ?
            <FooterInfinite getInstance={ins => this._footerInfiniteInstance = ins} {...this.props}/> : null}
        </View>
        {
          React.cloneElement(ScrollComponent, {
            ref: ref => {
              this._scrollInstance = ref
              this.props.getRef instanceof Function && this.props.getRef(ref)
            },
            scrollEventThrottle: this.props.scrollEventThrottle || 4,
            contentContainerStyle: this.props.contentContainerStyle || {backgroundColor: '#ffffff'},
            onTouchStart: this.onTouchStart,
            onTouchMove: this.onTouchMove,
            onScroll: this.onScroll,
            onScrollBeginDrag: this.onScrollBeginDrag,
            onScrollEndDrag: this.onScrollEndDrag,
            onMomentumScrollBegin: this.onMomentumScrollBegin,
            onMomentumScrollEnd: this.onMomentumScrollEnd
          }, this.props.children)
        }
      </View>
    )
  }
}

const Styles = StyleSheet.create({
  wrap: {
    flex: 1,
    overflow: 'hidden'
  },
  refresh: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  infinite: {
    position: 'absolute',
    bottom: 0,
    left: 0,
  }
});