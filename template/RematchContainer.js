import React from 'react';
import { init } from '@rematch/core'
import { Provider } from 'react-redux'
import createLoadingPlugin from '@rematch/loading'
const options = {}
const loading = createLoadingPlugin(options)

const store = init({
  models: <%= RegisterModels %>,
  plugins: [
    ...<%= RegisterPlugins %>,
    loading,
  ],
  <%= ExtendRematchConfig %>
})
window.g_store = store

export default class RematchProvider extends React.Component {
  render() {
    return <Provider store={store}>{this.props.children}</Provider>;
  }
}
