import { createApp, h } from 'vue'
import {
  create,
  NButton,
  NCard,
  NConfigProvider,
  NDataTable,
  NDatePicker,
  NForm,
  NFormItem,
  NGradientText,
  NInput,
  NInputNumber,
  NLayout,
  NLayoutContent,
  NLayoutHeader,
  NMessageProvider,
  NModal,
  NSelect,
  NSpace,
  NSwitch,
  NTag,
  NText
} from 'naive-ui'
import App from './App.vue'
import './style.css'

const naive = create({
  components: [
    NButton,
    NCard,
    NConfigProvider,
    NDataTable,
    NDatePicker,
    NForm,
    NFormItem,
    NGradientText,
    NInput,
    NInputNumber,
    NLayout,
    NLayoutContent,
    NLayoutHeader,
    NMessageProvider,
    NModal,
    NSelect,
    NSpace,
    NSwitch,
    NTag,
    NText
  ]
})

createApp({
  render() {
    return h(NConfigProvider, null, {
      default: () =>
        h(NMessageProvider, null, {
          default: () => h(App)
        })
    })
  }
})
  .use(naive)
  .mount('#app')
