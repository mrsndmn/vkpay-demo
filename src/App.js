import React, { Component } from 'react';

const VK = window.VK;

class App extends Component {

  constructor(props) {
    super(props);
    this.state = { want_cashback_percent: 0, amount: 1 }
  }

  componentDidMount() {
    VK.init(
      function() {
        console.log("VK was inited");
      },
      function() {
        console.log("VK init FAILED");
      }
    );

    VK.addCallback('onExternalAppDone', (data) => {
      console.log("onExternalAppDone")
      console.log(data);
  });
  }

  payVKPay() {

    var url = new URL("/app_params"),
    params  = { want_cashback_percent: 0 || 0, amount: 1 || 1 }
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
    // todo
    // на самом деже id приложеньки можно получить из урла запроса фронта. Его нужно сохранить и передавать на бэкенд в случае, когда хочешь поднять платежное окно
    fetch(url)
      .then( res => res.json() )
      .then( params => {
        console.log("params:", params);
        console.log("params stringified:", JSON.stringify(params));
        VK.callMethod("openExternalApp", "vkpay", params); }
      )
  }

  handleChangeCB(event) {
    this.setState({amount: event.target.value});
  }
  handleChangeAmount(event) {
    this.setState({want_cashback_percent: event.target.value});
  }

  render() {
    return (
      <div>
        <label>
          Amount:
          <input type='number' onChange={()=>{this.handleChangeAmount(this.state.amount);}}  value={this.state.want_cashback_percent} />
        </label>
        <label>
          Cashback:
          <input type='number' onChange={()=>{this.handleChangeCB(this.state.want_cashback_percent);}}  value={this.state.want_cashback_percent} />
        </label>

        <button onClick={this.payVKPay} > Pay vkpay </button>
      </div>
    );
  }
}

export default App;
