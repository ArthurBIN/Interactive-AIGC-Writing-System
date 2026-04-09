import { supabase } from '@/config/supabase'

export const getMonthCheckins = async (userId, year, month) => {
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const end = `${year}-${String(month).padStart(2, '0')}-31`
    const { data, error } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', userId)
        .gte('checkin_date', start)
        .lte('checkin_date', end)
        .order('checkin_date', { ascending: true })
    if (error) throw error
    return data
}

export const getTodayCheckin = async (userId) => {
    const today = new Date().toISOString().slice(0, 10)
    const { data, error } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', userId)
        .eq('checkin_date', today)
        .maybeSingle()
    if (error) throw error
    return data
}

export const doCheckin = async ({ userId, wordCount, note }) => {
    const today = new Date().toISOString().slice(0, 10)
    const { data, error } = await supabase
        .from('checkins')
        .upsert([{ user_id: userId, checkin_date: today, word_count: wordCount, note }],
            { onConflict: 'user_id,checkin_date' })
        .select()
        .single()
    if (error) throw error
    return data
}

export const getAllCheckins = async (userId) => {
    const { data, error } = await supabase
        .from('checkins')
        .select('checkin_date')
        .eq('user_id', userId)
        .order('checkin_date', { ascending: true })
    if (error) throw error
    return data
}
