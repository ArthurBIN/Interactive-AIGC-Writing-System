import Vue from 'vue'
import VueRouter from 'vue-router'

import ChatPage from '../views/ChatPage.vue'
import IndexPage from "@/views/IndexPage.vue";
import LoginPage from "@/views/LoginPage.vue";
import EditPage from "@/views/EditPage.vue";
import EditStoryPage from "@/views/EditStoryPage.vue";
import PrintImgPage from "@/views/PrintImgPage.vue";
import EditItemPage from "@/views/EditItemPage.vue";
import StoryItemPage from "@/views/StoryItemPage.vue";
import UserPage from "@/views/UserPage.vue";
import UploadPage from "@/views/UploadPage.vue";
import {supabase} from "@/config/supabase";
import CompositionsPage from "@/views/CompositionsPage.vue";

Vue.use(VueRouter)

const routes = [
    {
        path: '/login',
        name: 'login',
        component: LoginPage,
    },
    {
        path: '/',
        name: 'index',
        component: IndexPage,
    },
    {
        path: '/chat',
        name: 'chat',
        component: ChatPage,
        meta: {requiresAuth: true}
    },
    {
        path: '/edit',
        name: 'edit',
        component: EditPage,
        meta: {requiresAuth: true}
    },
    {
        path: '/editstory',
        name: 'editstory',
        component: EditStoryPage,
        meta: {requiresAuth: true}
    },
    {
        path: '/printimg',
        name: 'printimg',
        component: PrintImgPage,
        meta: {requiresAuth: true}
    },
    {
        path: '/edititem',
        name: 'edititem',
        component: EditItemPage,
        meta: {requiresAuth: true}
    },
    {
        path: '/storyitem',
        name: 'storyitem',
        component: StoryItemPage,
        meta: {requiresAuth: true}
    },
    {
        path: '/upload',
        name: 'upload',
        component: UploadPage,
        meta: {requiresAuth: true}
    },
    {
        path: '/compositions',
        name: 'compositions',
        component: CompositionsPage,
        meta: {requiresAuth: true}
    },
    {
        path: '/user',
        name: 'user',
        component: UserPage,
        meta: {requiresAuth: true}
    },
]
const originalPush = VueRouter.prototype.push
VueRouter.prototype.push = function push(location) {
    return originalPush.call(this, location).catch(err => err)
}

const originalReplace = VueRouter.prototype.replace
VueRouter.prototype.replace = function replace(location) {
    return originalReplace.call(this, location).catch(err => err)
}
const router = new VueRouter({
    routes
})

// 3. 实现路由守卫
router.beforeEach(async (to, from, next) => {
    // 获取当前的会话状态
    const {data: {session}} = await supabase.auth.getSession()

    // 判断目标路由是否需要登录
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth)

    if (requiresAuth && !session) {
        // 情况1：需要登录但未登录 -> 跳转登录页，并记录原本想去的页面
        next({
            name: 'login',
            query: {redirect: to.fullPath}
        })
    } else if ((to.name === 'login' || to.name === 'register') && session) {
        // 情况2：已登录用户访问登录/注册页 -> 直接跳转到首页
        next({name: 'index'})
    } else {
        // 情况3：直接放行
        next()
    }
})

export default router