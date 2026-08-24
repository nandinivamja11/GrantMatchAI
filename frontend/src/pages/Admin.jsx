import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, IndianRupee, Layers } from "lucide-react";

const Stat = ({ icon: Icon, label, value }) => (
  <Card className="p-6 border-slate-200">
    <div className="flex items-center justify-between"><div className="text-xs uppercase tracking-widest text-slate-400 font-semibold">{label}</div><Icon className="h-4 w-4 text-slate-400" /></div>
    <div className="text-3xl font-extrabold text-[#0B192C] mt-3">{value}</div>
  </Card>
);

export default function Admin() {
  const [stats, setStats] = useState(null);
  const [leads, setLeads] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [schemes, setSchemes] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get("/admin/stats").then((r) => setStats(r.data)),
      api.get("/admin/leads").then((r) => setLeads(r.data)),
      api.get("/admin/bookings").then((r) => setBookings(r.data)),
      api.get("/admin/payments").then((r) => setPayments(r.data)),
      api.get("/schemes").then((r) => setSchemes(r.data)),
    ]).catch(() => {});
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10">
      <h1 className="text-3xl sm:text-4xl font-bold text-[#0B192C]">Admin Dashboard</h1>
      <p className="text-slate-500 mt-1">Manage leads, bookings, payments, and schemes.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
        <Stat icon={Users} label="Total Leads" value={stats?.total_users ?? "—"} />
        <Stat icon={IndianRupee} label="Pro Subscribers" value={stats?.pro_users ?? "—"} />
        <Stat icon={Calendar} label="Consultations" value={stats?.total_bookings ?? "—"} />
        <Stat icon={Layers} label="Revenue (₹)" value={stats?.revenue_inr?.toLocaleString("en-IN") ?? "—"} />
      </div>

      <Tabs defaultValue="leads" className="mt-10">
        <TabsList data-testid="admin-tabs"><TabsTrigger value="leads">Leads</TabsTrigger><TabsTrigger value="bookings">Bookings</TabsTrigger><TabsTrigger value="payments">Payments</TabsTrigger><TabsTrigger value="schemes">Schemes</TabsTrigger></TabsList>

        <TabsContent value="leads">
          <Card className="border-slate-200 overflow-x-auto"><Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Plan</TableHead><TableHead>Business</TableHead><TableHead>Stage</TableHead><TableHead>State</TableHead></TableRow></TableHeader>
            <TableBody>{leads.map((u) => (<TableRow key={u.id} data-testid={`lead-${u.id}`}><TableCell className="font-medium">{u.full_name}</TableCell><TableCell>{u.email}</TableCell><TableCell><Badge variant="outline" className={u.plan === "pro" ? "border-[#FF9933] text-[#FF9933]" : ""}>{u.plan}</Badge></TableCell><TableCell>{u.profile?.business_name || "—"}</TableCell><TableCell>{u.profile?.stage || "—"}</TableCell><TableCell>{u.profile?.state || "—"}</TableCell></TableRow>))}</TableBody>
          </Table></Card>
        </TabsContent>

        <TabsContent value="bookings">
          <Card className="border-slate-200 overflow-x-auto"><Table>
            <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Date</TableHead><TableHead>Slot</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{bookings.map((b) => (<TableRow key={b.id}><TableCell>{b.name}</TableCell><TableCell>{b.email}</TableCell><TableCell>{b.phone}</TableCell><TableCell>{b.date}</TableCell><TableCell>{b.time_slot}</TableCell><TableCell><Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">{b.status}</Badge></TableCell></TableRow>))}</TableBody>
          </Table></Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card className="border-slate-200 overflow-x-auto"><Table>
            <TableHeader><TableRow><TableHead>Email</TableHead><TableHead>Type</TableHead><TableHead>Amount (₹)</TableHead><TableHead>Payment ID</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>{payments.map((p) => (<TableRow key={p.id}><TableCell>{p.email}</TableCell><TableCell>{p.type}</TableCell><TableCell>{p.amount_inr}</TableCell><TableCell className="font-mono text-xs">{p.payment_id}</TableCell><TableCell><Badge variant="outline">{p.status}</Badge></TableCell></TableRow>))}</TableBody>
          </Table></Card>
        </TabsContent>

        <TabsContent value="schemes">
          <Card className="border-slate-200 overflow-x-auto"><Table>
            <TableHeader><TableRow><TableHead>Code</TableHead><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Authority</TableHead><TableHead>Grant (₹)</TableHead></TableRow></TableHeader>
            <TableBody>{schemes.map((s) => (<TableRow key={s.id}><TableCell className="font-mono text-xs">{s.code}</TableCell><TableCell className="font-medium">{s.name_en}</TableCell><TableCell>{s.category}</TableCell><TableCell>{s.authority}</TableCell><TableCell>{s.grant_amount_inr?.toLocaleString("en-IN")}</TableCell></TableRow>))}</TableBody>
          </Table></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
