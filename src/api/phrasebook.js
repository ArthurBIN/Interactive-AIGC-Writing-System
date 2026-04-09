import { supabase } from '@/config/supabase'

export const getPhraseList = async (userId) => {
    const { data, error } = await supabase
        .from('phrasebook')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    if (error) throw error
    return data
}

export const addPhrase = async ({ userId, content, category, source }) => {
    const { data, error } = await supabase
        .from('phrasebook')
        .insert([{ user_id: userId, content, category, source }])
        .select()
        .single()
    if (error) throw error
    return data
}

export const deletePhrase = async (id) => {
    const { error } = await supabase
        .from('phrasebook')
        .delete()
        .eq('id', id)
    if (error) throw error
}
