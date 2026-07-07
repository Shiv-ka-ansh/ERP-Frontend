import React, { useState, useEffect, useMemo } from "react";
import { Send, Clock, Users, CheckCircle2, AlertCircle } from "lucide-react";
import CustomSelect from "../components/ui/CustomSelect";
import { useAppContext } from "../context/AppContext";
import { api } from "../api/client";
import { ALL_CLASSES } from "../constants/classes";

export default function SMSModule() {
  const { showToast, students, teachers } = useAppContext();
  const [message, setMessage] = useState("");
  const [recipientType, setRecipientType] = useState("parents");
  const [selectedClass, setSelectedClass] = useState("Class 8");
  const [history, setHistory] = useState([]);
  const [sending, setSending] = useState(false);
  const [balance, setBalance] = useState("12,450");

  // Load SMS history and balance from backend
  useEffect(() => {
    api.communication
      .smsHistory()
      .then((res) => setHistory(res?.data || []))
      .catch(() => setHistory([]));

    api.communication
      .smsBalance()
      .then((res) => {
        if (res?.data?.balance !== undefined) {
          setBalance(Number(res.data.balance).toLocaleString("en-IN"));
        }
      })
      .catch(() => {});
  }, []);

  // Look up student or teacher name by phone number
  const getRecipientName = (phone) => {
    if (!phone) return "";
    if (phone === "all_teachers") return "All Teachers";

    // Search in students
    const matchedStudents = students.filter((s) => s.phone === phone);
    if (matchedStudents.length > 0) {
      return matchedStudents
        .map((s) => `${s.name} (${s.className}-${s.section})`)
        .join(", ");
    }

    // Search in teachers
    const matchedTeachers = (teachers || []).filter((t) => t.phone === phone);
    if (matchedTeachers.length > 0) {
      return matchedTeachers.map((t) => `${t.name} (Teacher)`).join(", ");
    }

    return "";
  };

  const pendingApprovals = useMemo(() => {
    return history.filter((item) => item.status === "PENDING_APPROVAL");
  }, [history]);

  const handleApprove = async (id) => {
    try {
      await api.communication.approveSms(id);
      showToast("success", "SMS approved and sent successfully");
      const res = await api.communication.smsHistory();
      setHistory(res?.data || []);
    } catch (err) {
      showToast("error", err?.message || "Failed to approve SMS");
      api.communication.smsHistory().then((res) => setHistory(res?.data || []));
    }
  };

  const handleReject = async (id) => {
    try {
      await api.communication.rejectSms(id);
      showToast("success", "SMS rejected successfully");
      const res = await api.communication.smsHistory();
      setHistory(res?.data || []);
    } catch (err) {
      showToast("error", err?.message || "Failed to reject SMS");
    }
  };

  const handleApproveAll = async () => {
    try {
      const resApprove = await api.communication.approveAllSms();
      showToast("success", resApprove?.message || "All pending SMS processed");
      const res = await api.communication.smsHistory();
      setHistory(res?.data || []);
    } catch (err) {
      showToast("error", err?.message || "Failed to approve all SMS");
    }
  };

  // Build recipient list based on selected type
  const recipients = useMemo(() => {
    if (recipientType === "specific") {
      return students
        .filter((s) => s.className === selectedClass)
        .map((s) => s.phone)
        .filter(Boolean);
    }
    if (recipientType === "parents") {
      return students.map((s) => s.phone).filter(Boolean);
    }
    // teachers — handled separately
    return [];
  }, [recipientType, selectedClass, students]);

  const handleSend = async () => {
    if (!message.trim()) {
      showToast("error", "Please enter a message");
      return;
    }
    if (recipients.length === 0 && recipientType !== "teachers") {
      showToast("error", "No recipients found");
      return;
    }

    setSending(true);
    try {
      // Send to each recipient in parallel batches of 10
      const phones =
        recipientType === "teachers" ? ["all_teachers"] : recipients;
      const batchSize = 10;
      // Sequential await intentional — order-dependent
      for (let i = 0; i < phones.length; i += batchSize) {
        const batch = phones.slice(i, i + batchSize);
        await Promise.all(
          batch.map((phone) =>
            api.communication.sendSms({
              recipient: phone,
              message: message.trim(),
            }),
          ),
        );
      }
      showToast("success", `SMS sent to ${phones.length} recipient(s)`);
      setMessage("");
      // Refresh history
      const res = await api.communication.smsHistory();
      setHistory(res?.data || []);
    } catch {
      showToast("error", "Failed to send SMS");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-navy font-brand">SMS Center</h1>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal/10 text-teal text-xs font-medium rounded-full">
          SMS Credits: {balance}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-card p-6">
          <h2 className="font-brand font-semibold text-navy text-lg mb-5">
            Compose Message
          </h2>
          <div className="flex flex-col gap-1 mb-4">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Send To
            </label>
            <div className="flex gap-2 mt-1">
              {["parents", "teachers", "specific"].map((type) => (
                <button
                  key={type}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all border ${recipientType === type ? "bg-cta text-white border-teal" : "bg-white text-gray-500 border-gray-200 hover:border-cta"}`}
                  onClick={() => setRecipientType(type)}
                >
                  <Users size={14} />{" "}
                  {type === "parents"
                    ? "Parents"
                    : type === "teachers"
                      ? "Teachers"
                      : "Specific Class"}
                </button>
              ))}
            </div>
          </div>

          {recipientType === "specific" && (
            <div className="flex flex-col gap-1 mb-4">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Select Class
              </label>
              <CustomSelect
                value={selectedClass}
                onChange={setSelectedClass}
                options={ALL_CLASSES}
              />
            </div>
          )}

          <div className="flex flex-col gap-1 mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Message
              </label>
              <div className="w-36">
                <CustomSelect
                  value=""
                  onChange={(val) => {
                    if (val === "fee")
                      setMessage(
                        "Dear Parent, your ward's fee of ₹[AMOUNT] for [MONTH] is pending. Please pay by [DATE] to avoid late fine.",
                      );
                    if (val === "holiday")
                      setMessage(
                        "Dear Parent, the school will remain closed tomorrow on account of [REASON]. Regular classes will resume from [DATE].",
                      );
                  }}
                  options={["Use Template...", "fee", "holiday"]}
                />
              </div>
            </div>
            <textarea
              rows="6"
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20 transition-colors resize-none"
            ></textarea>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>{message.length} chars</span>
              <span>
                {Math.ceil(message.length / 160) || 1} SMS credit(s) per person
              </span>
            </div>
          </div>

          <div className="flex gap-4">
            <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border border-cta text-cta rounded-lg text-sm font-medium hover:bg-cta/10 transition-colors">
              <Clock size={18} /> Schedule
            </button>
            <button
              className="flex-[2] inline-flex items-center justify-center gap-2 px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleSend}
              disabled={sending}
            >
              <Send size={18} /> {sending ? "Sending..." : "Send SMS Now"}
            </button>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl shadow-card p-6">
          <h2 className="font-brand font-semibold text-navy text-lg mb-5">
            Recent Broadcasts
          </h2>

          {pendingApprovals.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-2.5">
                <Clock className="text-amber-600" size={20} />
                <div>
                  <h4 className="text-sm font-bold text-amber-900 font-brand">
                    {pendingApprovals.length} SMS Pending Approval
                  </h4>
                  <p className="text-[11px] text-amber-700 font-medium">
                    Automatic broadcasts waiting for confirmation
                  </p>
                </div>
              </div>
              <button
                onClick={handleApproveAll}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-705 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
              >
                Approve All
              </button>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {history.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                No SMS history found.
              </div>
            )}
            {history.map((item, idx) => (
              <div
                key={item._id || idx}
                className="bg-white rounded-xl shadow-card p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <strong className="font-brand text-sm">
                      {item.recipient || "Unknown"}
                    </strong>
                    {getRecipientName(item.recipient) && (
                      <span className="text-xs text-gray-500 mt-0.5 font-medium">
                        {getRecipientName(item.recipient)}
                      </span>
                    )}
                  </div>
                  {item.status === "PENDING_APPROVAL" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-medium rounded-full">
                      <Clock size={12} /> Pending Approval
                    </span>
                  ) : (item.status || "").toUpperCase() === "SENT" ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-teal/10 text-teal text-[11px] font-medium rounded-full">
                      <CheckCircle2 size={12} /> Sent
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-cta/10 text-cta text-[11px] font-medium rounded-full">
                      <AlertCircle size={12} /> Failed
                    </span>
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  {item.message || "—"}
                </p>
                <div className="flex justify-between items-center text-gray-400 font-mono text-[11px]">
                  <span>
                    {item.sentAt
                      ? new Date(item.sentAt).toLocaleString("en-IN")
                      : item.createdAt
                        ? new Date(item.createdAt).toLocaleString("en-IN")
                        : "—"}
                  </span>
                  {item.status === "PENDING_APPROVAL" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleReject(item._id)}
                        className="px-2.5 py-1 text-xs font-semibold text-cta border border-cta/20 hover:bg-cta/5 rounded transition-colors"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(item._id)}
                        className="px-2.5 py-1 text-xs font-semibold text-white bg-teal hover:bg-teal-dark rounded transition-colors shadow-sm"
                      >
                        Approve & Send
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
