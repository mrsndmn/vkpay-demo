import React, { Component } from 'react';

const VK = window.VK;

class App extends Component {
  componentDidMount() {
    VK.init(
      function() {
        console.log("VK was inited");
      },
      function() {
        console.log("VK init FAILED");
      }
    );
  }

  payVKPay() {
    fetch("/app_params")
      .then( res => res.json() )
      .then( params => {
        console.log("params:", params);
        console.log("params stringified:", JSON.stringify(params));
        VK.callMethod("openExternalApp", "vkpay", params); }
      )
  }

  render() {
    return (
      <div>
        <button onClick={this.payVKPay} > Pay vkpay </button>
      </div>
    );
  }
}

export default App;
