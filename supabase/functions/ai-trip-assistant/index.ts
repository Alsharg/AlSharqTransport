import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('ONSPACE_AI_API_KEY');
    const baseUrl = Deno.env.get('ONSPACE_AI_BASE_URL');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    if (!apiKey || !baseUrl) {
      return new Response(JSON.stringify({ error: 'AI service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { prompt, context } = await req.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch system context from database
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const [driversRes, tripsRes, earningsRes] = await Promise.all([
      supabase.from('user_profiles').select('id, full_name, role, status, rating, total_trips, level, is_active').eq('role', 'driver'),
      supabase.from('trips').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('earnings').select('*').order('created_at', { ascending: false }).limit(50),
    ]);

    const drivers = driversRes.data || [];
    const trips = tripsRes.data || [];
    const earnings = earningsRes.data || [];

    const activeDrivers = drivers.filter((d: any) => d.is_active).length;
    const availableTrips = trips.filter((t: any) => t.status === 'available').length;
    const completedTrips = trips.filter((t: any) => t.status === 'completed').length;
    const totalRevenue = earnings.reduce((s: number, e: any) => s + Number(e.total_amount || 0), 0);
    const totalCommission = earnings.reduce((s: number, e: any) => s + Number(e.platform_commission || 0), 0);

    const systemPrompt = `أنت مساعد ذكي لمنصة "الشرق للنقل والتوصيل". تساعد الإدارة في اتخاذ القرارات المتعلقة بالمشاوير والسائقين.

بيانات النظام الحالية:
- عدد السائقين: ${drivers.length} (${activeDrivers} نشط)
- عدد المشاوير: ${trips.length} (${availableTrips} متاح، ${completedTrips} مكتمل)
- إجمالي الإيرادات: ${totalRevenue.toFixed(0)} ر.س
- عمولة المنصة: ${totalCommission.toFixed(0)} ر.س

${context ? `سياق إضافي: ${context}` : ''}

قواعد:
1. أجب باللغة العربية دائماً
2. كن موجزاً ومفيداً
3. قدم اقتراحات عملية بناءً على البيانات
4. إذا سُئلت عن أفضل سائق لمشوار، اقترح بناءً على التقييم والموقع والخبرة
5. قدم تحليلات مبنية على الأرقام الفعلية`;

    const aiResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', errorText);
      return new Response(JSON.stringify({ error: `AI service error: ${aiResponse.status}` }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const reply = aiData.choices?.[0]?.message?.content ?? 'لم أتمكن من الإجابة';

    return new Response(JSON.stringify({ reply, stats: { drivers: drivers.length, activeDrivers, trips: trips.length, availableTrips, completedTrips, totalRevenue, totalCommission } }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
