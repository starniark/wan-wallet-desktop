import intl from 'react-intl-universal';
import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Table, Row, Col } from 'antd';

import 'containers/CrossChain/CrossETH/index.less';
import totalImg from 'static/image/eth.png';
import CopyAndQrcode from 'components/CopyAndQrcode';
import { INBOUND, OUTBOUND } from 'utils/settings';
import ETHTrans from 'components/CrossChain/SendCrossChainTrans/ETHTrans';
import CrossChainTransHistory from 'components/CrossChain/CrossChainTransHistory';

const CHAINTYPE = 'ETH';
const WANCHAIN = 'WAN';

@inject(stores => ({
  tokensList: stores.tokens.tokensList,
  addrInfo: stores.ethAddress.addrInfo,
  language: stores.languageIntl.language,
  getAmount: stores.ethAddress.getNormalAmount,
  getTokensListInfo: stores.tokens.getTokensListInfo,
  transParams: stores.sendCrossChainParams.transParams,
  getE20TokensListInfo: stores.tokens.getE20TokensListInfo,
  changeTitle: newTitle => stores.languageIntl.changeTitle(newTitle),
  setCurrToken: (addr, symbol) => stores.tokens.setCurrToken(addr, symbol),
  updateTokensBalance: tokenScAddr => stores.tokens.updateTokensBalance(tokenScAddr),
  updateE20TokensBalance: tokenScAddr => stores.tokens.updateE20TokensBalance(tokenScAddr)
}))

@observer
class CrossE20 extends Component {
  constructor (props) {
    super(props);
    this.props.changeTitle('CrossChain.CrossChain');
    this.props.setCurrToken(this.props.tokenAddr);
  }

  componentDidMount() {
    let tokenOrigAddr = this.props.tokensList[this.props.tokenAddr].tokenOrigAddr;
    this.timer = setInterval(() => {
      this.props.updateTokensBalance(this.props.tokenAddr);
      this.props.updateE20TokensBalance(tokenOrigAddr);
    }, 5000)
  }

  componentWillUnmount() {
    clearInterval(this.timer);
  }

  inboundHandleSend = from => {
    let transParams = this.props.transParams[from];
    let input = {
      from: transParams.from,
      to: transParams.to,
      amount: transParams.amount,
      gasPrice: transParams.gasPrice,
      gasLimit: transParams.gasLimit,
      storeman: transParams.storeman,
      txFeeRatio: transParams.txFeeRatio
    };
    return new Promise((resolve, reject) => {
      wand.request('crosschain_crossE20', { input, source: 'ETH', destination: 'WAN', type: 'LOCK' }, (err, ret) => {
        if (err) {
          console.log('crosschain_lockE20Inbound:', err);
          return reject(err);
        } else {
          console.log(JSON.stringify(ret, null, 4));
          return resolve(ret)
        }
      })
    })
  }

  outboundHandleSend = from => {
    let transParams = this.props.transParams[from];
    let input = {
      from: transParams.from,
      to: transParams.to,
      amount: transParams.amount,
      gasPrice: transParams.gasPrice,
      gasLimit: transParams.gasLimit,
      storeman: transParams.storeman,
      txFeeRatio: transParams.txFeeRatio
    };
    return new Promise((resolve, reject) => {
      wand.request('crosschain_crossE20', { input, source: 'WAN', destination: 'ETH', type: 'LOCK' }, (err, ret) => {
        if (err) {
          console.log('crosschain_lockWTokenInbound:', err);
          return reject(err);
        } else {
          console.log(JSON.stringify(ret, null, 4));
          return resolve(ret)
        }
      })
    })
  }

  inboundColumns = [
    {
      dataIndex: 'name',
    },
    {
      dataIndex: 'address',
      render: text => <div className="addrText"><p className="address">{text}</p><CopyAndQrcode addr={text} /></div>
    },
    {
      dataIndex: 'balance',
      sorter: (a, b) => a.balance - b.balance,
    },
    {
      dataIndex: 'action',
      render: (text, record) => <div><ETHTrans tokenAddr={this.props.tokenAddr} from={record.address} path={record.path} handleSend={this.inboundHandleSend} chainType={CHAINTYPE} type={INBOUND}/></div>
    }
  ];

  outboundColumns = [
    {
      dataIndex: 'name',
    },
    {
      dataIndex: 'address',
      render: text => <div className="addrText"><p className="address">{text}</p><CopyAndQrcode addr={text} /></div>
    },
    {
      dataIndex: 'balance',
      sorter: (a, b) => a.balance - b.balance,
    },
    {
      dataIndex: 'action',
      render: (text, record) => <div><ETHTrans tokenAddr={this.props.tokenAddr} from={record.address} path={record.path} handleSend={this.outboundHandleSend} chainType={WANCHAIN} type={OUTBOUND}/></div>
    }
  ];

  render () {
    const { getE20TokensListInfo, getTokensListInfo, symbol } = this.props;
    this.props.language && this.inboundColumns.forEach(col => {
      col.title = intl.get(`WanAccount.${col.dataIndex}`)
    })

    this.props.language && this.outboundColumns.forEach(col => {
      col.title = intl.get(`WanAccount.${col.dataIndex}`)
    })

    return (
      <div className="account">
        <Row className="title">
          <Col span={12} className="col-left"><img className="totalImg" src={totalImg} /><span className="wanTotal">{symbol.slice(1)} </span></Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" pagination={false} columns={this.inboundColumns} dataSource={getE20TokensListInfo} />
          </Col>
        </Row>
        <Row className="title">
          <Col span={12} className="col-left"><img className="totalImg" src={totalImg} /><span className="wanTotal">{symbol} </span></Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <Table className="content-wrap" pagination={false} columns={this.outboundColumns} dataSource={getTokensListInfo} />
          </Col>
        </Row>
        <Row className="mainBody">
          <Col>
            <CrossChainTransHistory name={['normal']} />
          </Col>
        </Row>
      </div>
    );
  }
}

export default props => <CrossE20 {...props} symbol={props.match.params.symbol} key={props.match.params.tokenAddr} tokenAddr={props.match.params.tokenAddr} />;