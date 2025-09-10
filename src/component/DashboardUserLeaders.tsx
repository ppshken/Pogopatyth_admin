import { useEffect, useMemo, useState } from "react";
import { Button, Spinner, TextInput, Label } from "flowbite-react";
import { AlertComponent } from "../component/alert";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

type LeaderCreators = { user_id:number; username:string; rooms_created:number };
type LeaderJoiners  = { user_id:number; username:string; rooms_joined:number };
type LeaderRatings  = { user_id:number; username:string; reviews:number; avg_rating:number };

type ApiPayload = {
  range: { start:string; end:string };
  top_creators: LeaderCreators[];
  top_joiners: LeaderJoiners[];
  top_host_ratings: LeaderRatings[];
};

type ApiResponse = { success:boolean; data?:ApiPayload; message?:string };

export default function DashboardUserLeaders(){
  const [start, setStart] = useState<string>(() => {
    const d = new Date(); d.setDate(d.getDate()-30);
    return d.toISOString().slice(0,10);
  });
  const [end, setEnd] = useState<string>(() => new Date().toISOString().slice(0,10));
  const [limit, setLimit] = useState<number>(10);

  const [data, setData] = useState<ApiPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string|null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load(){
    try{
      setError(null);
      const API_BASE = import.meta.env.VITE_API_BASE as string;
      const token = localStorage.getItem("auth_token") || "";
      const url = new URL(`${API_BASE}/api/admin/dashboard/dashboard_user_stats.php`);
      url.searchParams.set("start", start);
      url.searchParams.set("end", end);
      url.searchParams.set("limit", String(limit));

      const res = await fetch(url.toString(), {
        headers: { Authorization: token ? `Bearer ${token}` : "" }
      });
      const json: ApiResponse = await res.json();
      if(!res.ok || !json.success || !json.data){
        throw new Error(json.message || `Server returned ${res.status}`);
      }
      setData(json.data);
    }catch(e:any){
      setError(e?.message || "โหลดข้อมูลไม่สำเร็จ");
    }finally{
      setLoading(false); setRefreshing(false);
    }
  }

  useEffect(()=>{ load(); /* initial */ }, []);

  const creators = useMemo(()=> (data?.top_creators ?? [])
      .map(x=>({ name:x.username, value:x.rooms_created })), [data]);
  const joiners = useMemo(()=> (data?.top_joiners ?? [])
      .map(x=>({ name:x.username, value:x.rooms_joined })), [data]);
  const ratings = useMemo(()=> (data?.top_host_ratings ?? [])
      .map(x=>({ name:x.username, value:x.avg_rating, reviews:x.reviews })), [data]);

  return (
    <div className="mt-8">
      <div className="mb-3 text-sm font-semibold text-gray-800 dark:text-gray-200">
        User Leaderboards
      </div>

      {/* Filters */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-5">
        <div className="sm:col-span-2">
          <Label htmlFor="start">วันที่เริ่มต้น</Label>
          <TextInput id="start" type="date" value={start}
                     onChange={(e)=>setStart(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="end">วันที่สิ้นสุด</Label>
          <TextInput id="end" type="date" value={end}
                     min={start || undefined}
                     onChange={(e)=>setEnd(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="limit">จำนวนอันดับ</Label>
          <TextInput id="limit" type="number" min={3} max={50}
                     value={limit} onChange={(e)=>setLimit(Number(e.target.value||10))}/>
        </div>
        <div className="sm:col-span-5">
          <Button color="light"
            onClick={()=>{ setRefreshing(true); setLoading(true); load(); }}
            disabled={refreshing}>
            {refreshing && <Spinner size="sm" className="mr-2" />} ใช้ฟิลเตอร์
          </Button>
        </div>
      </div>

      {/* Error */}
      {error && <div className="mb-4"><AlertComponent type="failure" message={error} /></div>}

      {/* Skeleton */}
      {loading ? (
        <div className="text-gray-500">กำลังโหลด…</div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* สร้างห้องมากสุด */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-2 text-sm font-medium dark:text-white">ผู้สร้างห้องมากสุด</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={creators}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} hide />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#46d8acff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 space-y-1 text-sm dark:text-white">
              {data?.top_creators?.map((x,i)=>(
                <li key={x.user_id} className="flex justify-between">
                  <span>{i+1}. {x.username}</span>
                  <span className="font-semibold">{x.rooms_created}</span>
                </li>
              ))}
              {(!data?.top_creators?.length) && <li className="text-gray-500">ไม่มีข้อมูล</li>}
            </ul>
          </div>

          {/* เข้าร่วมห้องมากสุด */}
          <div className=" dark:text-white rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-2 text-sm font-medium">ผู้เข้าร่วมห้องมากสุด</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={joiners}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} hide />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#d8b646ff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 space-y-1 text-sm">
              {data?.top_joiners?.map((x,i)=>(
                <li key={x.user_id} className="flex justify-between">
                  <span>{i+1}. {x.username}</span>
                  <span className="font-semibold">{x.rooms_joined}</span>
                </li>
              ))}
              {(!data?.top_joiners?.length) && <li className="text-gray-500">ไม่มีข้อมูล</li>}
            </ul>
          </div>

          {/* โฮสต์ได้คะแนนเฉลี่ยสูงสุด */}
          <div className="dark:text-white rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <div className="mb-2 text-sm font-medium">โฮสต์คะแนนเฉลี่ยสูงสุด (มีรีวิว ≥ 3)</div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratings}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} hide />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#4668d8ff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 space-y-1 text-sm">
              {data?.top_host_ratings?.map((x,i)=>(
                <li key={x.user_id} className="flex justify-between">
                  <span>{i+1}. {x.username} <span className="text-xs text-gray-500">(รีวิว {x.reviews})</span></span>
                  <span className="font-semibold">{x.avg_rating.toFixed(2)}</span>
                </li>
              ))}
              {(!data?.top_host_ratings?.length) && <li className="text-gray-500">ไม่มีข้อมูล</li>}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
