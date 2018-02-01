/**
 * Created by woowalker on 2018/1/23.
 */
import React, {Component} from 'react'
import PropTypes from 'prop-types'
import PTRScrollList from './lib/PTRScrollList'

export default class PTRControl extends Component {
  static headerRefreshDone = () => PTRScrollList.headerRefreshDone()
  static footerInfiniteDone = () => PTRScrollList.footerInfiniteDone()

  static propTypes = {
    scrollComponent: PropTypes.oneOf(['ScrollView', 'ListView', 'FlatList', 'VirtualizedList']).isRequired,

    getRef: PropTypes.func,

    enableHeaderRefresh: PropTypes.bool,
    setHeaderHeight: PropTypes.number,
    onTopReachedThreshold: PropTypes.number,
    renderHeaderRefresh: PropTypes.func,
    onHeaderRefreshing: PropTypes.func,

    pullFriction: PropTypes.number,

    enableFooterInfinite: PropTypes.bool,
    setFooterHeight: PropTypes.number,
    onEndReachedThreshold: PropTypes.number,
    renderFooterInfinite: PropTypes.func,
    onFooterInfiniting: PropTypes.func,
  }

  render() {
    return <PTRScrollList {...this.props}/>
  }
}