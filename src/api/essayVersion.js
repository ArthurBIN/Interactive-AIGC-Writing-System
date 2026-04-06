import {supabase} from '@/config/supabase'

/**
 * 保存一个新版本（每次"保存作品"时调用）
 */
export const saveVersion = async (essayId, {title, content}) => {
    // 查当前最大版本号
    const {count} = await supabase
        .from('essay_versions')
        .select('id', {count: 'exact', head: true})
        .eq('essay_id', essayId)

    const {data, error} = await supabase
        .from('essay_versions')
        .insert([{
            essay_id: essayId,
            title: title || '',
            content,
            word_count: content.length,
            version_num: (count || 0) + 1
        }])
        .select()
        .single()

    if (error) throw error
    return data
}

/**
 * 获取某篇作文的所有历史版本（按版本号倒序）
 */
export const getVersions = async (essayId) => {
    const {data, error} = await supabase
        .from('essay_versions')
        .select('*')
        .eq('essay_id', essayId)
        .order('version_num', {ascending: false})

    if (error) throw error
    return data || []
}

/**
 * 删除某个版本
 */
export const deleteVersion = async (versionId) => {
    const {error} = await supabase
        .from('essay_versions')
        .delete()
        .eq('id', versionId)

    if (error) throw error
}
