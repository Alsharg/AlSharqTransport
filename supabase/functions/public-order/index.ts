import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed. Use POST." }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();

    // Validate required fields
    const { client_name, client_phone, pickup_location, dropoff_location, service_type } = body;
    if (!client_name || !client_phone || !pickup_location || !dropoff_location) {
      return new Response(
        JSON.stringify({ error: "الحقول المطلوبة: client_name, client_phone, pickup_location, dropoff_location" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Insert order
    const orderData = {
      client_name: String(client_name).trim(),
      client_phone: String(client_phone).trim(),
      pickup_location: String(pickup_location).trim(),
      pickup_lat: body.pickup_lat ?? null,
      pickup_lng: body.pickup_lng ?? null,
      dropoff_location: String(dropoff_location).trim(),
      dropoff_lat: body.dropoff_lat ?? null,
      dropoff_lng: body.dropoff_lng ?? null,
      departure_time: body.departure_time ?? "",
      return_time: body.return_time ?? "",
      passengers: body.passengers ?? 1,
      passenger_type: body.passenger_type ?? "",
      service_type: service_type ?? "monthly",
      work_days_count: body.work_days_count ?? 5,
      work_days: body.work_days ?? "",
      contract_duration: body.contract_duration ?? "month",
      has_waiting: body.has_waiting ?? false,
      trip_direction: body.trip_direction ?? "round_trip",
      notes: body.notes ?? "",
      status: "new",
    };

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error("Order insert error:", orderError);
      return new Response(
        JSON.stringify({ error: "فشل حفظ الطلب: " + orderError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Order created:", order.id);

    // Send notification to all admins and supervisors
    const { data: admins } = await supabaseAdmin
      .from("user_profiles")
      .select("id, full_name, role")
      .in("role", ["admin", "supervisor"]);

    if (admins && admins.length > 0) {
      const notifications = admins.map((admin: any) => ({
        user_id: admin.id,
        title: "طلب جديد من الموقع",
        body: `طلب ${service_type === "monthly" ? "اشتراك شهري" : service_type} جديد من ${client_name} - ${client_phone}`,
        type: "order",
        is_read: false,
      }));

      const { error: notifError } = await supabaseAdmin
        .from("notifications")
        .insert(notifications);

      if (notifError) {
        console.error("Notification error:", notifError);
      } else {
        console.log(`Sent ${notifications.length} notifications to admins`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "تم استلام طلبك بنجاح. سيتم التواصل معك قريباً.",
        order_id: order.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("public-order error:", err);
    return new Response(
      JSON.stringify({ error: "حدث خطأ غير متوقع: " + (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
