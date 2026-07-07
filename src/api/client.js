const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function apiRequest(path, { method = 'GET', token, params, body, version = 'v1' } = {}) {
    const url = new URL(`${API_BASE_URL}/${version}${path}`);

    if (params) {
        Object.entries(params).forEach(([k, v]) => {
            if (v === undefined || v === null || v === '') return;
            url.searchParams.set(k, String(v));
        });
    }

    const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    const res = await fetch(url.toString(), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        if (res.status === 401 && path !== '/auth/login') {
            localStorage.removeItem('erp_token');
            localStorage.removeItem('erp_user');
            window.location.href = '/login';
            return;
        }
        const message = data?.message || `Request failed (${res.status})`;
        const err = new Error(message);
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

function getToken() {
    return localStorage.getItem('erp_token') || '';
}

export const api = {
    auth: {
        login: async ({ username, password }) => {
            return apiRequest('/auth/login', {
                method: 'POST',
                body: { username, password }
            });
        },
        me: async () => apiRequest('/auth/me', { token: getToken() })
    },
    students: {
        list: async ({ page = 1, limit = 200, class: className, section, search } = {}) => {
            return apiRequest('/students', {
                token: getToken(),
                params: { page, limit, class: className, section, search }
            });
        },
        byId: async (id) => apiRequest(`/students/${id}`, { token: getToken() }),
        create: async (payload) => apiRequest('/students', { token: getToken(), method: 'POST', body: payload }),
        update: async (id, payload) =>
            apiRequest(`/students/${id}`, { token: getToken(), method: 'PUT', body: payload }),
        delete: async (id) => apiRequest(`/students/${id}`, { token: getToken(), method: 'DELETE' }),
        listDeleted: async () => apiRequest('/students/deleted', { token: getToken() }),
        permanentDelete: async (id) => apiRequest(`/students/${id}/permanent`, { token: getToken(), method: 'DELETE' }),
        restore: async (id) => apiRequest(`/students/${id}/restore`, { token: getToken(), method: 'PUT' }),
        importFromExcel: async () =>
            apiRequest('/students/import-excel', { token: getToken(), method: 'POST' }),
    },
    staff: {
        list: async ({ page = 1, limit = 500, search } = {}) =>
            apiRequest('/staff', { token: getToken(), params: { page, limit, search } }),
        byId: async (id) => apiRequest(`/staff/${id}`, { token: getToken() }),
        create: async (payload) => apiRequest('/staff', { token: getToken(), method: 'POST', body: payload }),
        update: async (id, payload) => apiRequest(`/staff/${id}`, { token: getToken(), method: 'PUT', body: payload }),
        remove: async (id) => apiRequest(`/staff/${id}`, { token: getToken(), method: 'DELETE' })
    },
    classSubjects: {
        list: async ({ page = 1, limit = 500, search } = {}) =>
            apiRequest('/class-subjects', { token: getToken(), params: { page, limit, search } }),
        create: async (payload) => apiRequest('/class-subjects', { token: getToken(), method: 'POST', body: payload }),
        update: async (id, payload) => apiRequest(`/class-subjects/${id}`, { token: getToken(), method: 'PUT', body: payload }),
        remove: async (id) => apiRequest(`/class-subjects/${id}`, { token: getToken(), method: 'DELETE' })
    },
    exams: {
        list: async ({ page = 1, limit = 500, search } = {}) =>
            apiRequest('/exams', { token: getToken(), params: { page, limit, search } }),
        create: async (payload) => apiRequest('/exams', { token: getToken(), method: 'POST', body: payload }),
        update: async (id, payload) => apiRequest(`/exams/${id}`, { token: getToken(), method: 'PUT', body: payload }),
        remove: async (id) => apiRequest(`/exams/${id}`, { token: getToken(), method: 'DELETE' }),
        reportCard: async (studentId) =>
            apiRequest(`/exams/report-card/${studentId}`, { token: getToken() }),
        bulkUpsertResults: async (payload) =>
            apiRequest('/exams/results/bulk', { token: getToken(), method: 'POST', body: payload }),
        resultsByExam: async (examId) => apiRequest(`/exams/results/${examId}`, { token: getToken() }),
        syllabus: {
            list: async ({ page = 1, limit = 500, search } = {}) =>
                apiRequest('/exams/syllabus', { token: getToken(), params: { page, limit, search } }),
            create: async (payload) => apiRequest('/exams/syllabus', { token: getToken(), method: 'POST', body: payload }),
            update: async (id, payload) =>
                apiRequest(`/exams/syllabus/${id}`, { token: getToken(), method: 'PUT', body: payload }),
            remove: async (id) => apiRequest(`/exams/syllabus/${id}`, { token: getToken(), method: 'DELETE' }),
            progress: async () => apiRequest('/exams/syllabus/progress', { token: getToken() })
        }
    },
    fees: {
        structures: async () => apiRequest('/fees/fee-structures', { token: getToken() }),
        createFeeStructure: async (payload) =>
            apiRequest('/fees/fee-structures', { token: getToken(), method: 'POST', body: payload }),
        updateFeeStructure: async (id, payload) =>
            apiRequest(`/fees/fee-structures/${id}`, { token: getToken(), method: 'PUT', body: payload }),
        deleteFeeStructure: async (id) =>
            apiRequest(`/fees/fee-structures/${id}`, { token: getToken(), method: 'DELETE' }),
        collect: async (payload) => apiRequest('/fees/collect', { token: getToken(), method: 'POST', body: payload }),
        receipts: async (id) => apiRequest(`/fees/receipts/${id}`, { token: getToken() }),
        printReceipt: async (id) => {
            const token = getToken();
            const url = `${API_BASE_URL}/v1/fees/receipts/${id}/print`;
            const res = await fetch(url, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Failed to load print receipt');
            const html = await res.text();
            const win = window.open('', '_blank', 'width=900,height=700');
            if (win) {
                win.document.open();
                win.document.write(html);
                win.document.close();
            }
        },
        collections: async (params) => apiRequest('/fees/collections', { token: getToken(), params }),
        updateCollection: async (id, payload) => apiRequest(`/fees/collections/${id}`, { token: getToken(), method: 'PUT', body: payload }),
        deleteCollection: async (id) => apiRequest(`/fees/collections/${id}`, { token: getToken(), method: 'DELETE' }),
        defaulters: async () => apiRequest('/fees/defaulters', { token: getToken() }),
        studentSummary: async (studentId) => apiRequest(`/fees/student-summary/${studentId}`, { token: getToken() }),
        discounts: {
            list: async ({ page = 1, limit = 500, search } = {}) =>
                apiRequest('/fees/discounts', { token: getToken(), params: { page, limit, search } }),
            create: async (payload) =>
                apiRequest('/fees/discounts', { token: getToken(), method: 'POST', body: payload }),
            update: async (id, payload) =>
                apiRequest(`/fees/discounts/${id}`, { token: getToken(), method: 'PUT', body: payload }),
            remove: async (id) =>
                apiRequest(`/fees/discounts/${id}`, { token: getToken(), method: 'DELETE' }),
            approve: async (id) =>
                apiRequest(`/fees/discounts/${id}/approve`, { token: getToken(), method: 'POST' }),
            reject: async (id, rejectionReason) =>
                apiRequest(`/fees/discounts/${id}/reject`, { token: getToken(), method: 'POST', body: { rejectionReason } }),
            revoke: async (id) =>
                apiRequest(`/fees/discounts/${id}/revoke`, { token: getToken(), method: 'POST' })
        }
    },
    expenses: {
        list: async () => apiRequest('/fees/expenses', { token: getToken() }),
        create: async (payload) => apiRequest('/fees/expenses', { token: getToken(), method: 'POST', body: payload }),
        remove: async (id) => apiRequest(`/fees/expenses/${id}`, { token: getToken(), method: 'DELETE' })
    },
    payroll: {
        list: async ({ page = 1, limit = 200, search } = {}) =>
            apiRequest('/payroll', { token: getToken(), params: { page, limit, search } }),
        create: async (payload) => apiRequest('/payroll', { token: getToken(), method: 'POST', body: payload }),
        update: async (id, payload) => apiRequest(`/payroll/${id}`, { token: getToken(), method: 'PUT', body: payload }),
        remove: async (id) => apiRequest(`/payroll/${id}`, { token: getToken(), method: 'DELETE' })
    },
    audit: {
        list: async ({ page = 1, limit = 200, module, action, riskLevel, userId, startDate, endDate } = {}) =>
            apiRequest('/audit-logs', {
                token: getToken(),
                params: { page, limit, module, action, riskLevel, userId, startDate, endDate }
            }),
        export: async ({ module, startDate, endDate } = {}) =>
            apiRequest('/audit-logs/export', { token: getToken(), params: { module, startDate, endDate } })
    },
    users: {
        list: async ({ page = 1, limit = 200, search } = {}) =>
            apiRequest('/users', { token: getToken(), params: { page, limit, search } }),
        roles: async () => apiRequest('/users/roles', { token: getToken() }),
        create: async (payload) => apiRequest('/users', { token: getToken(), method: 'POST', body: payload }),
        update: async (id, payload) => apiRequest(`/users/${id}`, { token: getToken(), method: 'PUT', body: payload }),
        remove: async (id) => apiRequest(`/users/${id}`, { token: getToken(), method: 'DELETE' }),
        resetPassword: async (userId, newPassword) => apiRequest('/users/reset-password', { token: getToken(), method: 'POST', body: { userId, newPassword } })
    },
    tc: {
        generate: async (payload) => apiRequest('/tc', { token: getToken(), method: 'POST', body: payload }),
        register: async () => apiRequest('/tc', { token: getToken(), method: 'GET' }),
        reprint: async (id) => apiRequest(`/tc/${id}/reprint`, { token: getToken() })
    }
    ,
    communication: {
        sendSms: async ({ recipient, message, templateId, variables = {} }) =>
            apiRequest('/communication/sms/send', {
                token: getToken(),
                method: 'POST',
                body: { recipient, message, templateId, variables }
            }),
        smsHistory: async () => apiRequest('/communication/sms/history', { token: getToken() }),
        smsBalance: async () => apiRequest('/communication/sms/balance', { token: getToken() }),
        approveSms: async (id) => apiRequest(`/communication/sms/history/${id}/approve`, { token: getToken(), method: 'POST' }),
        rejectSms: async (id) => apiRequest(`/communication/sms/history/${id}/reject`, { token: getToken(), method: 'POST' }),
        approveAllSms: async () => apiRequest('/communication/sms/history/approve-all', { token: getToken(), method: 'POST' }),
        templates: {
            list: async () => apiRequest('/communication/sms/templates', { token: getToken() }),
            create: async (payload) =>
                apiRequest('/communication/sms/templates', { token: getToken(), method: 'POST', body: payload }),
            update: async (id, payload) =>
                apiRequest(`/communication/sms/templates/${id}`, { token: getToken(), method: 'PUT', body: payload }),
            remove: async (id) =>
                apiRequest(`/communication/sms/templates/${id}`, { token: getToken(), method: 'DELETE' })
        },
        calendar: {
            list: async () => apiRequest('/communication/calendar', { token: getToken() }),
            create: async (payload) =>
                apiRequest('/communication/calendar', { token: getToken(), method: 'POST', body: payload }),
            update: async (id, payload) =>
                apiRequest(`/communication/calendar/${id}`, { token: getToken(), method: 'PUT', body: payload }),
            remove: async (id) =>
                apiRequest(`/communication/calendar/${id}`, { token: getToken(), method: 'DELETE' })
        }
    },
    attendance: {
        get: async ({ date, type, staffId, className } = {}) =>
            apiRequest('/attendance', { token: getToken(), params: { date, type, staffId, className } }),
        bulkUpsert: async (payload) =>
            apiRequest('/attendance/bulk', { token: getToken(), method: 'POST', body: payload }),
        report: async ({ month, year, type, staffId } = {}) =>
            apiRequest('/attendance/report', { token: getToken(), params: { month, year, type, staffId } }),
        myAttendance: async ({ month, year } = {}) =>
            apiRequest('/attendance/my', { token: getToken(), params: { month, year } }),
        leaveRequests: async () =>
            apiRequest('/attendance/leave-requests', { token: getToken() }),
        createLeaveRequest: async (payload) =>
            apiRequest('/attendance/leave-requests', { token: getToken(), method: 'POST', body: payload }),
        approveLeaveRequest: async (id, payload) =>
            apiRequest(`/attendance/leave-requests/${id}`, { token: getToken(), method: 'PUT', body: payload }),
        lopSummary: async ({ month, year } = {}) =>
            apiRequest('/attendance/lop-summary', { token: getToken(), params: { month, year } })
    },
    settings: {
        get: async () => apiRequest('/settings', { token: getToken() }),
        upsert: async (key, value, password) =>
            apiRequest('/settings', { token: getToken(), method: 'PUT', body: { key, value, password } }),
        rollover: async (targetYear, password) =>
            apiRequest('/settings/rollover', { token: getToken(), method: 'POST', body: { targetYear, password } })
    },
    income: {
        list: async () => apiRequest('/finance/income', { token: getToken() }),
        create: async (payload) =>
            apiRequest('/finance/income', { token: getToken(), method: 'POST', body: payload }),
        remove: async (id) =>
            apiRequest(`/finance/income/${id}`, { token: getToken(), method: 'DELETE' })
    }
};

