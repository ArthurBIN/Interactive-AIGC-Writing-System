import {supabase} from '@/config/supabase'

/**
 * 保存或创建作文分析记录
 */
export const saveComposition = async (data) => {
    // 自动从当前 session 获取用户 ID，确保数据归属正确
    const {data: {user}} = await supabase.auth.getUser()
    if (!user) throw new Error('用户未登录')

    const {data: result, error} = await supabase
        .from('compositions')
        .insert([
            {
                user_id: user.id,
                title: data.title,
                content: data.content,
                result: data.result,
            }
        ])
        .select()

    if (error) throw error
    return result[0]
}

/**
 * 根据 ID 获取详情
 */
export const getCompositionById = async (id) => {
    const {data, error} = await supabase
        .from('compositions')
        .select('*')
        .eq('id', id)
        .single()

    if (error) throw error
    return data
}

/**
 * 更新现有记录（如果需要重新生成分析）
 */
export const updateComposition = async (id, updateData) => {
    const {data, error} = await supabase
        .from('compositions')
        .update({
            result: updateData.result,
            title: updateData.title,
            content: updateData.content
        })
        .eq('id', id)
        .select()

    if (error) throw error
    return data[0]
}

/**
 * 删除作文分析记录
 */
export const deleteComposition = async (id) => {
    const {error} = await supabase
        .from('compositions')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

/**
 * 获取作文列表（用于目录页/历史记录页）
 * 按照创建时间倒序排列
 */
export const getCompositionList = async () => {
    const {data, error} = await supabase
        .from('compositions')
        // 我们只需要查询 ID、标题、存储 AI 结果的对象以及创建时间
        .select('id, title, result, created_at')
        .order('created_at', {ascending: false});

    if (error) {
        console.error('Supabase fetch error:', error);
        throw error;
    }

    return data;
};