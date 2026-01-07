import { supabase } from '@/config/supabase'

/**
 * 创建新会话 (仅在发送第一条消息时调用)
 */
export const createChat = async (userId, title, initialMessages = []) => {
    const { data, error } = await supabase
        .from('chats')
        .insert([{
            user_id: userId,
            title: title,
            messages: initialMessages,
            updated_at: new Date().toISOString()
        }])
        .select().single();

    if (error) throw error;
    return data;
}

/**
 * 全量更新会话内容
 */
export const updateChatMessages = async (chatId, messageList) => {
    const { data, error } = await supabase
        .from('chats')
        .update({
            messages: messageList,
            updated_at: new Date().toISOString()
        })
        .eq('id', chatId)
        .select().single();

    if (error) throw error;
    return data;
}

/**
 * 获取单个会话详情 (用于加载历史)
 */
export const getChatDetail = async (chatId) => {
    const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .single();

    if (error) throw error;
    return data;
}

/**
 * 获取当前用户的所有会话列表（按更新时间倒序）
 */
export const getUserChatList = async (userId) => {
    const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

    if (error) throw error;
    return data;
}

export const deleteChat = async (chatId) => {
    const { data, error } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

    if (error) throw error;
    return data;
}