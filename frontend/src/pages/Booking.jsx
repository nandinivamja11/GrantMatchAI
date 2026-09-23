import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LangContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import {
  Sparkles,
  MessageCircle,
  IndianRupee,
  Pencil,
  Save,
  X,
  CalendarDays,
} from "lucide-react";

const SLOTS = [
  "10:00 AM",
  "12:00 PM",
  "3:00 PM",
  "5:00 PM",
  "7:00 PM",
];

export default function Booking() {
  const { user } = useAuth();
  const { lang, t } = useLang();
  const nav = useNavigate();

  const [date, setDate] = useState(null);
  const [slot, setSlot] = useState("");
  const [notes, setNotes] = useState("");

  const [contact, setContact] = useState({
    name: user?.full_name || "",
    email: user?.email || "",
    phone: "",
  });

  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loading, setLoading] = useState(false);

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  // Load logged-in user's bookings
  const loadBookings = async () => {
    try {
      setLoadingBookings(true);

      // Backend currently exposes GET /bookings
      const res = await api.get("/bookings");

      setBookings(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Load bookings error:", err);

      toast.error(
        err.response?.data?.detail ||
          (lang === "en"
            ? "Unable to load your bookings"
            : "आपकी बुकिंग लोड नहीं हो सकी")
      );

      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadBookings();
    } else {
      setLoadingBookings(false);
    }
  }, [user]);

  // Required-field validation
  const validateForm = () => {
    if (!contact.name.trim()) {
      toast.error(
        lang === "en"
          ? "Please enter your full name"
          : "कृपया अपना पूरा नाम दर्ज करें"
      );
      return false;
    }

    if (!contact.email.trim()) {
      toast.error(
        lang === "en"
          ? "Please enter your email"
          : "कृपया अपना ईमेल दर्ज करें"
      );
      return false;
    }

    if (!contact.phone.trim()) {
      toast.error(
        lang === "en"
          ? "Please enter your phone number"
          : "कृपया अपना फोन नंबर दर्ज करें"
      );
      return false;
    }

    if (!date) {
      toast.error(
        lang === "en"
          ? "Please select a date"
          : "कृपया तारीख चुनें"
      );
      return false;
    }

    if (!slot) {
      toast.error(
        lang === "en"
          ? "Please select a time slot"
          : "कृपया समय स्लॉट चुनें"
      );
      return false;
    }

    if (!notes.trim()) {
      toast.error(
        lang === "en"
          ? "Please enter what you would like to discuss"
          : "कृपया बताएं कि आप क्या चर्चा करना चाहते हैं"
      );
      return false;
    }

    return true;
  };

  const submit = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      const payload = {
        name: contact.name.trim(),
        email: contact.email.trim(),
        phone: contact.phone.trim(),
        date: date.toISOString().split("T")[0],
        time_slot: slot,
        notes: notes.trim(),
      };

      const res = await api.post("/bookings", payload);

      toast.success(t("bookSuccess"));

      // Immediately show newly created booking
      if (res.data) {
        setBookings((prev) => [res.data, ...prev]);
      } else {
        await loadBookings();
      }

      // Reset form after booking
      setDate(null);
      setSlot("");
      setNotes("");
      setContact({
        name: user?.full_name || "",
        email: user?.email || "",
        phone: "",
      });
    } catch (err) {
      console.error("Create booking error:", err);

      toast.error(
        err.response?.data?.detail ||
          (lang === "en"
            ? "Booking failed"
            : "बुकिंग विफल हुई")
      );
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (booking) => {
  setEditingId(booking.id);
  setEditName(booking.name || "");
  setEditPhone(booking.phone || "");
};

  const cancelEdit = () => {
  setEditingId(null);
  setEditName("");
  setEditPhone("");
};

  const saveEdit = async (bookingId) => {
  const name = editName.trim();
  const phone = editPhone.trim();

  if (!name) {
    toast.error(
      lang === "en"
        ? "Name cannot be empty"
        : "Name cannot be empty"
    );
    return;
  }

  if (!phone) {
    toast.error(
      lang === "en"
        ? "Phone number cannot be empty"
        : "Phone number cannot be empty"
    );
    return;
  }

  setSavingEdit(true);

  try {
    const res = await api.patch(`/bookings/${bookingId}`, {
      name,
      phone,
    });

    setBookings((prev) =>
      prev.map((booking) =>
        booking.id === bookingId
          ? {
              ...booking,
              ...(res.data || {}),
              name: res.data?.name || name,
              phone: res.data?.phone || phone,
            }
          : booking
      )
    );

    toast.success(
      lang === "en"
        ? "Booking updated successfully"
        : "Booking successfully updated"
    );

    cancelEdit();
  } catch (err) {
    console.error("Update booking error:", err);

    toast.error(
      err.response?.data?.detail ||
        (lang === "en"
          ? "Unable to update booking"
          : "Unable to update booking")
    );
  } finally {
    setSavingEdit(false);
  }
};

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-[#FF9933]" />
        <span className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
          {lang === "en"
            ? "Expert Consultation"
            : "विशेषज्ञ परामर्श"}
        </span>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-[#0B192C]">
        {t("bookTitle")}
      </h1>

      <p className="text-slate-500 mt-2 flex items-center gap-1">
        <IndianRupee className="h-4 w-4" />
        {t("bookSub")}
      </p>

      {/* Booking Form */}
      <div className="grid md:grid-cols-2 gap-6 mt-8">
        {/* Date + Time */}
        <Card className="p-6 border-slate-200">
          <Label className="mb-3 block">
            {t("bookDate")} <span className="text-red-500">*</span>
          </Label>

          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            disabled={{ before: new Date() }}
            className="border border-slate-200 rounded-md"
            data-testid="booking-calendar"
          />

          <Label className="mt-6 mb-3 block">
            {t("bookTime")} <span className="text-red-500">*</span>
          </Label>

          <div className="grid grid-cols-3 gap-2">
            {SLOTS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSlot(s)}
                className={`text-sm py-2 rounded-md border transition-all ${
                  slot === s
                    ? "border-[#FF9933] bg-orange-50 text-[#FF9933] font-semibold"
                    : "border-slate-200 hover:border-slate-300 text-slate-600"
                }`}
                data-testid={`slot-${s.replace(/[: ]/g, "")}`}
              >
                {s}
              </button>
            ))}
          </div>
        </Card>

        {/* Contact */}
        <Card className="p-6 border-slate-200">
          <div className="space-y-4">
            <div>
              <Label>
                {t("fullName")}{" "}
                <span className="text-red-500">*</span>
              </Label>

              <Input
                value={contact.name}
                onChange={(e) =>
                  setContact({
                    ...contact,
                    name: e.target.value,
                  })
                }
                className="mt-1.5 h-11"
                data-testid="book-name"
                required
              />
            </div>

            <div>
              <Label>
                {t("email")}{" "}
                <span className="text-red-500">*</span>
              </Label>

              <Input
                type="email"
                value={contact.email}
                onChange={(e) =>
                  setContact({
                    ...contact,
                    email: e.target.value,
                  })
                }
                className="mt-1.5 h-11"
                data-testid="book-email"
                required
              />
            </div>

            <div>
              <Label>
                {t("phone")}{" "}
                <span className="text-red-500">*</span>
              </Label>

              <Input
                type="tel"
                value={contact.phone}
                onChange={(e) =>
                  setContact({
                    ...contact,
                    phone: e.target.value,
                  })
                }
                className="mt-1.5 h-11"
                data-testid="book-phone"
                required
              />
            </div>

            <div>
              <Label>
                {t("bookNotes")}{" "}
                <span className="text-red-500">*</span>
              </Label>

              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1.5"
                rows={4}
                data-testid="book-notes"
                required
              />
            </div>

            <Button
              onClick={submit}
              disabled={loading}
              className="w-full rounded-md bg-[#FF9933] hover:bg-[#e6842b] text-white h-11 font-semibold"
              data-testid="book-confirm"
            >
              {loading
                ? "Saving..."
                : `${t("bookConfirm")} · ₹999`}
            </Button>

            <p className="text-xs text-center text-slate-400">
              MOCKED payment — no real charge
            </p>
          </div>
        </Card>
      </div>

      {/* My Bookings */}
      <section className="mt-12">
        <div className="mb-5">
          <h2 className="text-2xl font-bold text-[#0B192C]">
            {lang === "en"
              ? "My Bookings"
              : "मेरी बुकिंग"}
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            {lang === "en"
              ? "Your consultation bookings."
              : "आपकी परामर्श बुकिंग।"}
          </p>
        </div>

        {loadingBookings ? (
          <Card className="p-8 border-slate-200">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <div className="h-5 w-5 border-2 border-slate-300 border-t-[#FF9933] rounded-full animate-spin" />
              Loading bookings...
            </div>
          </Card>
        ) : bookings.length === 0 ? (
          <Card className="p-8 border-slate-200 text-center">
            <div className="h-12 w-12 rounded-full bg-orange-50 flex items-center justify-center mx-auto mb-3">
              <CalendarDays className="h-5 w-5 text-[#FF9933]" />
            </div>

            <p className="text-slate-500 text-sm">
              {lang === "en"
                ? "No bookings yet."
                : "अभी कोई बुकिंग नहीं है।"}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card
                key={booking.id}
                className="p-6 border-slate-200"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 flex-1">
                    {/* Name */}
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                        Name
                      </div>

                    {editingId === booking.id ? (
                    <Input
                       value={editName}
                       onChange={(e) => setEditName(e.target.value)}
                       className="mt-1 h-9"
                       placeholder="Enter name"
                       autoFocus/>
                    ) : (
                    <div className="text-sm font-semibold text-[#0B192C] mt-1">
                       {booking.name || "—"}
                    </div>
                      )}
                    </div>

                    {/* Date */}
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                        Date
                      </div>

                      <div className="text-sm font-semibold text-[#0B192C] mt-1">
                        {booking.date || "—"}
                      </div>
                    </div>

                    {/* Time */}
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                        Time Slot
                      </div>

                      <div className="text-sm font-semibold text-[#0B192C] mt-1">
                        {booking.time_slot || "—"}
                      </div>
                    </div>

                    {/* Status */}
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                        Status
                      </div>

                      <div className="text-sm font-semibold text-emerald-600 mt-1 capitalize">
                        {booking.status || "Confirmed"}
                      </div>
                    </div>
                  </div>

                  {/* Edit buttons */}
                  <div className="flex gap-2 shrink-0">
                    {editingId === booking.id ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() =>
                            saveEdit(booking.id)
                          }
                          disabled={savingEdit}
                          className="bg-[#FF9933] hover:bg-[#e6842b] text-white"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          {savingEdit ? "Saving..." : "Save"}
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={cancelEdit}
                          disabled={savingEdit}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startEdit(booking)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit Name
                      </Button>
                    )}
                  </div>
                </div>

                {/* Full booking details */}
                <div className="border-t border-slate-100 mt-5 pt-5 grid sm:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                      Email
                    </div>

                    <div className="text-sm text-slate-700 mt-1">
                      {booking.email || "—"}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                      Phone
                    </div>

                  {editingId === booking.id ? (
                  <Input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="mt-1 h-9"
                    placeholder="Enter phone number"/>
                  ) : (
                  <div className="text-sm text-slate-700 mt-1">
                     {booking.phone || "—"}
                  </div>
                    )}
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                      Amount
                    </div>

                    <div className="text-sm font-semibold text-[#0B192C] mt-1">
                      ₹{booking.amount_inr || 999}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                      Payment
                    </div>

                    <div className="text-sm text-slate-700 mt-1 capitalize">
                      {(booking.payment_status || "mocked_paid").replace(
                        "_",
                        " "
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <div className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                      Notes
                    </div>

                    <div className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">
                      {booking.notes || "—"}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Bottom actions */}
      <div className="flex gap-3 justify-center mt-8">
        <a
          href="https://wa.me/919999999999"
          target="_blank"
          rel="noreferrer"
        >
          <Button
            variant="outline"
            className="rounded-full"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            {t("whatsappCta")}
          </Button>
        </a>

        <Button
          onClick={() => nav("/dashboard")}
          className="rounded-full bg-[#FF9933] hover:bg-[#e6842b] text-white"
        >
          {t("dashboard")}
        </Button>
      </div>
    </div>
  );
}