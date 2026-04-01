import { createApp } from 'vue'
import { startLoop } from './engine'
import App from './App.vue'

createApp(App).mount('#app')
startLoop()
