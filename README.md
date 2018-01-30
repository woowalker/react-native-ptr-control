# react-native-ptr-control
React-native pull to refresh and pull-up load more component, supported custom refresh and load more component

Supported Scroll Component is:
<br>
* **ScrollView**
* **ListView**
* **FlatList**
* **VirtualizedList**
<br>

Supported React-Native Version is **>= 0.43.0**, because this lib supported FlatList
## example
example in the folder of example, the app.js is the entrance, example version is:
* **expo: 23**
* **react-native: 0.50.0**
* **react: 16.0.0**
### run example
**Suggest: run example in real device, the performance will perfect**
<br>

1、`cd example`

2、`yarn install`

3、`yarn start`

and then take your iphone or android device, use the **_Expo_** app scan the QRCode, and have fun
<br>

**Be careful:**
* if can not load project, see the detail, sometimes it cost long time to load, and sometimes, the **_Expo_** version
is incorrect
## Installation
`$ npm install react-native-ptr-control --save`
## Usage
here is a simple usage of this lib, see example folder and find app.js for full usage

    import React, {Component} from 'react'
    import {View, Text} from 'react-native'
    import PTRControl from 'react-native-ptr-control'
    export default class MyScrollComponent extends Component {
      render () {
        return (
          <PTRControl
            dataSource={this.state.dataSource}
            renderRow={this.renderRow}
            showsVerticalScrollIndicator={false}
            scrollComponent={'ListView'}
            />
          )
      }
    }
    
## Properties
**_Note: list of below props is extends props, the origin props of scroll component (for example: ScrollView) 
should also be passed_**

| Prop | Description | Type | Default | Platform | isRequired |
|---|---|---|---|---|---|
| *scrollComponent* | mark the scroll component, can be 'ScrollView', 'ListView', 'FlatList', 'VirtualizedList' | *string* | 'FlatList' | all | yes |
| *getRef* | get the scroll component`s ref | *func* | _None_ | all | no |
| *enableHeaderRefresh* | whether to enable header refresh | *bool* | true | all | no |
| *setHeaderHeight* | if header refresh is set, this prop mark the header height, if header refresh is set, **this prop should be set** | *number* | 60 | _Android_ | no |
| *onTopReachedThreshold* | threshold to trigger refresh | *number* | 10 | _Android_ | no |
| *renderHeaderRefresh* | render the custom component of refresh header, and the *gestureStatus* will be passed, see example for detail | *func* | default function | all | no |
| *onHeaderRefreshing* | when release to refresh, this fun will be called, see example for detail | *func* | default function | all | no |
| *enableFooterInfinite* | whether to enable footer load-more | *bool* | true | all | no |
| *setFooterHeight* | if footer load-more is set, this prop mark the footer height, if footer load-more is set, **this prop should be set** | *number* | 60 | _Android_ | no |
| *onEndReachedThreshold* | threshold to trigger load-more | *number* | 10 | _Android_ | no |
| *renderFooterInfinite* | render the custom component of load-more, and the *gestureStatus* will be passed, see example for detail | *func* | default function | all | no |
| *onFooterInfiniting* | when release to load-more, this fun will be called, see example for detail | *func* | default function | all | no |

## static methods
**_Important: when header refresh done, or footer load-more done, should call this static method_**
#### headerRefreshDone
on prop: onHeaderRefreshing, when refresh done, and the data load complete, call this method to stop refresh
<br>

`PTRControl.headerRefreshDone()`
#### footerInfiniteDone
on prop: onFooterInfiniting, when load-more done, and the data load complete, call this method to stop load-more
<br>

`PTRControl.footerInfiniteDone()`