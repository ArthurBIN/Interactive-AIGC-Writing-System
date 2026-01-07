import {supabase} from '@/config/supabase'

/**
 * 保存作文
 */
export const saveEssay = async (essayData) => {
    const {data, error} = await supabase
        .from('essays')
        .insert([essayData])
        .select().single();

    if (error) throw error;
    return data;
}

/**
 * 获取当前用户的所有作文列表
 */
export const getUserEssays = async (userId) => {
    const {data, error} = await supabase
        .from('essays')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', {ascending: false});

    if (error) throw error;
    return data;
}

/**
 * 根据 ID 获取作文详情
 */
export const getEssayDetail = async (id) => {
    const {data, error} = await supabase
        .from('essays')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
}

/**
 * 更新作文内容
 */
export const updateEssay = async (id, updateData) => {
    const {data, error} = await supabase
        .from('essays')
        .update(updateData)
        .eq('id', id);

    if (error) throw error;
    return data;
}