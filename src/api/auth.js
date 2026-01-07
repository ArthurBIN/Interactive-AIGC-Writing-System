import { supabase } from '@/config/supabase'

/**
 * 用户注册
 */
export const registerUser = async (email, password, displayName) => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            display_name: displayName
        }
    })

    if (error) throw error;
    return data;
}

/**
 * 用户登录
 */
export const loginUser = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    })
    if (error) throw error;
    return data;
}

/**
 * 用户登出
 */
export const logoutUser = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
}

/**
 * 获取当前登录用户信息
 */
export const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    return user
}

/**
 * 获取当前的 Session (包含 Token)
 */
export const getSession = async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
}