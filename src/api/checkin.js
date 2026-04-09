import { supabase } from '@/config/supabase'

export const getMonthCheckins = async (userId, year, month) => {
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    // 用下个月1日作为上界（lt），避免硬编码31导致非法日期
    const nextYear  = month === 12 ? year + 1 : year
    const nextMonth = month === 12 ? 1 : month + 1
    const nextStart = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`
    const { data, error } = await supabase
        .from('checkins')
        .select('*')
        .eq('user_id', userId)
        .gte('checkin_date', start)
        .lt('checkin_date', nextStart)
        .order('checkin_date', { ascending: true })
    if (error) throw error
    return data
}

const localDateStr = () => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const getTodayCheckin = async (userId) => {
    const today = localDateStr()
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
    const today = localDateStr()
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
