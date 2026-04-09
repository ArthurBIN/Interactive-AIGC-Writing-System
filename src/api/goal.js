import { supabase } from '@/config/supabase'

export const getGoalList = async (userId) => {
    const { data, error } = await supabase
        .from('writing_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    if (error) throw error
    return data
}

export const addGoal = async ({ userId, title, description, targetCount, deadline }) => {
    const { data, error } = await supabase
        .from('writing_goals')
        .insert([{
            user_id: userId,
            title,
            description,
            target_count: targetCount,
            deadline: deadline || null
        }])
        .select()
        .single()
    if (error) throw error
    return data
}

export const updateGoal = async (id, updates) => {
    const { data, error } = await supabase
        .from('writing_goals')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
    if (error) throw error
    return data
}

export const deleteGoal = async (id) => {
    const { error } = await supabase
        .from('writing_goals')
        .delete()
        .eq('id', id)
    if (error) throw error
}
