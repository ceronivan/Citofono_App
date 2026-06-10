import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import vuetify from './vuetify'
import './assets/styles/global.css'

// Base components — globally registered
import ScreenHeader from '@/components/base/ScreenHeader.vue'
import BtnPrimary from '@/components/base/BtnPrimary.vue'
import BtnSecondary from '@/components/base/BtnSecondary.vue'
import BtnIcon from '@/components/base/BtnIcon.vue'
import AppAvatar from '@/components/base/AppAvatar.vue'
import StatusBadge from '@/components/base/StatusBadge.vue'
import EmptyState from '@/components/shared/EmptyState.vue'
import LoadingSpinner from '@/components/shared/LoadingSpinner.vue'
import NotificationBell from '@/components/shared/NotificationBell.vue'
import ContentDetail from '@/components/shared/ContentDetail.vue'
import BuildingSwitcher from '@/components/shared/BuildingSwitcher.vue'
import BackBtn from '@/components/base/BackBtn.vue'
import ConfirmDialog from '@/components/shared/ConfirmDialog.vue'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(vuetify)

// Global components
app.component('ScreenHeader', ScreenHeader)
app.component('BtnPrimary', BtnPrimary)
app.component('BtnSecondary', BtnSecondary)
app.component('BtnIcon', BtnIcon)
app.component('AppAvatar', AppAvatar)
app.component('StatusBadge', StatusBadge)
app.component('EmptyState', EmptyState)
app.component('LoadingSpinner', LoadingSpinner)
app.component('NotificationBell', NotificationBell)
app.component('ContentDetail', ContentDetail)
app.component('BuildingSwitcher', BuildingSwitcher)
app.component('BackBtn', BackBtn)
app.component('ConfirmDialog', ConfirmDialog)

// Init auth before mounting so the router guard has user state
import { useAuthStore } from '@/stores/auth.store'
const authStore = useAuthStore()
authStore.init()

app.mount('#app')
