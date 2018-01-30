import React, {Component} from 'react'
import {
  View,
  Text,
  StyleSheet,
  ListView,
  Dimensions,
  ActivityIndicator
}  from 'react-native'
import PTRControl from 'react-native-ptr-control'

class FooterInfinite extends Component {
  static defaultProps = {
    gestureStatus: 1
  }

  constructor(props) {
    super(props)
  }

  render() {
    let {gestureStatus} = this.props, _refreshFont = ''
    switch (gestureStatus) {
      case 1:
        _refreshFont = 'pull-up-to-load-more'
        break;
      case 3:
        _refreshFont = 'release-to-load...'
        break;
      case 5:
        _refreshFont = 'loading'
        break;
      default:
        _refreshFont = 'pull-up-to-load-more'
    }
    return (
      <View style={Styles.footerInfinite}>
        {gestureStatus === 5 ?
          <ActivityIndicator
            size={'small'}
            animating={true}
            color={'#75c5fe'}
            style={{marginRight: 10}}/> : null}
        <Text style={Styles.refreshFont}>{_refreshFont}</Text>
      </View>
    );
  }
}

class HeaderRefresh extends Component {
  static defaultProps = {
    gestureStatus: 2
  }

  constructor(props) {
    super(props)
  }

  render() {
    let {gestureStatus} = this.props, _refreshFont = ''
    switch (gestureStatus) {
      case 2:
        _refreshFont = 'pull-to-refresh'
        break;
      case 3:
        _refreshFont = 'release-to-refresh'
        break;
      case 4:
        _refreshFont = 'refreshing'
        break;
      default:
        _refreshFont = 'pull-to-refresh'
    }
    return (
      <View style={Styles.headerRefresh}>
        {gestureStatus === 4 ?
          <ActivityIndicator
            size={'small'}
            animating={true}
            color={'#75c5fe'}
            style={{marginRight: 10}}/> : null}
        <Text style={Styles.refreshFont}>{_refreshFont}</Text>
      </View>
    )
  }
}

const ds = new ListView.DataSource({rowHasChanged: (r1, r2) => r1 !== r2})
export default class Example extends Component {
  _timer = -1
  data = []

  constructor(props) {
    super(props)
    this.getData()
    this.state = {
      dataSource: ds.cloneWithRows(this.data)
    }
  }

  getData(init) {
    let total = 14
    if (init) {
      this.data = []
      total = Math.ceil(Math.random() * 17)
    }
    for (let i = 0; i < total; i++) {
      this.data.push('row' + Math.ceil(Math.random() * total))
    }
  }

  renderRow = (rowData, sectionID, rowID) => {
    return (
      <View
        style={Styles.flatListItem}>
        <Text style={Styles.fontItem}>{rowData + ':' + rowID}</Text>
      </View>
    )
  }

  render() {
    return (
      <View style={Styles.wrap}>
        <View style={{height: 40, width: Dimensions.get('window').width, backgroundColor: '#d5c639'}}/>
        <PTRControl
          dataSource={this.state.dataSource}
          renderRow={this.renderRow}
          showsVerticalScrollIndicator={false}

          scrollComponent={'ListView'}
          getRef={ref => this.refOfScrollList = ref}

          enableHeaderRefresh={true}
          setHeaderHeight={100}
          onTopReachedThreshold={10}
          renderHeaderRefresh={(gestureStatus) => <HeaderRefresh gestureStatus={gestureStatus}/>}
          onHeaderRefreshing={() => {
            clearTimeout(this._timer)
            this._timer = setTimeout(() => {
              this.getData(true)
              this.setState({
                dataSource: ds.cloneWithRows(this.data)
              }, () => {
                PTRControl.headerRefreshDone()
              })
            }, 1000)
          }}

          enableFooterInfinite={true}
          setFooterHeight={60}
          onEndReachedThreshold={10}
          renderFooterInfinite={(gestureStatus) => <FooterInfinite gestureStatus={gestureStatus}/>}
          onFooterInfiniting={() => {
            clearTimeout(this._timer)
            this._timer = setTimeout(() => {
              this.getData()
              this.setState({
                dataSource: ds.cloneWithRows(this.data)
              }, () => {
                PTRControl.footerInfiniteDone()
              })
            }, 1000)
          }}
        />
      </View>
    )
  }
}

const Styles = StyleSheet.create({
  wrap: {
    flex: 1,
    overflow: 'hidden'
  },
  headerRefresh: {
    width: Dimensions.get('window').width,
    height: 100,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  footerInfinite: {
    width: Dimensions.get('window').width,
    height: 60,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center'
  },
  refreshFont: {
    fontSize: 16,
    color: '#b84f35'
  },
  flatListItem: {
    width: Dimensions.get('window').width,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#feafea'
  },
  fontItem: {
    fontSize: 15,
  },
})