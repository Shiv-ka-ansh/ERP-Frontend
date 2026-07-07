import Dexie from 'dexie';

export const db = new Dexie('School_ERP_DB');

db.version(1).stores({
    students: '++id, roll, name, className, section, feeStatus, dues, attendance, status',
    fees: '++id, studentId, amount, date, status, receiptNo',
    attendance: '++id, studentId, date, status, remarks',
    users: '++id, username, role, password'
});

db.version(2).stores({
    students: '++id, roll, name, className, section, feeStatus, dues, attendance, status',
    fees: '++id, studentId, amount, date, status, receiptNo',
    attendance: '++id, studentId, date, status, remarks',
    users: '++id, username, role, password',
    teachers: '++id, name, subject, qualification, joinDate, phone, basic, hra, allowances, deductions',
    salary_payments: '++id, teacherId, month, year, amount, mode, paidDate, remarks',
    fee_structure: '++id, className, feeHeads, totalMonthly, academicYear',
    exams: '++id, name, className, subject, date, maxMarks, passingMarks, status, academicYear',
    results: '++id, examId, studentId, marks, absent, grade, rank',
    syllabus: '++id, className, subject, chapterNo, chapterName, status, completedDate',
    sms_log: '++id, recipient, recipientType, message, sentAt, status, templateId',
    discounts: '++id, studentId, feeHead, type, value, reason, academicYear'
});

db.version(3).stores({
    students: '++id, roll, name, className, section, feeStatus, dues, attendance, status',
    fees: '++id, studentId, amount, date, status, receiptNo',
    attendance: '++id, studentId, date, status, remarks',
    users: '++id, username, role, password',
    teachers: '++id, name, subject, qualification, joinDate, phone, basic, hra, allowances, deductions',
    salary_payments: '++id, teacherId, month, year, amount, mode, paidDate, remarks',
    fee_structure: '++id, className, feeHeads, totalMonthly, academicYear',
    exams: '++id, name, className, subject, date, maxMarks, passingMarks, status, academicYear',
    results: '++id, examId, studentId, marks, absent, grade, rank',
    syllabus: '++id, className, subject, chapterNo, chapterName, status, completedDate',
    sms_log: '++id, recipient, recipientType, message, sentAt, status, templateId',
    discounts: '++id, studentId, feeHead, type, value, reason, academicYear',
    expenses: '++id, date, amount, category, description, paymentMode, vendor, billNo'
});

db.version(4).stores({
    students: '++id, roll, name, className, section, feeStatus, dues, attendance, status',
    fees: '++id, studentId, amount, date, status, receiptNo',
    attendance: '++id, studentId, date, status, remarks',
    users: '++id, username, role, password',
    teachers: '++id, name, subject, qualification, joinDate, phone, basic, hra, allowances, deductions',
    salary_payments: '++id, teacherId, month, year, amount, mode, paidDate, remarks',
    fee_structure: '++id, className, feeHeads, totalMonthly, academicYear',
    exams: '++id, name, className, subject, date, maxMarks, passingMarks, status, academicYear',
    results: '++id, examId, studentId, marks, absent, grade, rank',
    syllabus: '++id, className, subject, chapterNo, chapterName, status, completedDate',
    sms_log: '++id, recipient, recipientType, message, sentAt, status, templateId',
    discounts: '++id, studentId, feeHead, type, value, reason, academicYear',
    expenses: '++id, date, amount, category, description, paymentMode, vendor, billNo',
    audit_logs: '++id, timestamp, user, role, module, action, ip, device, browser, risk'
});

db.version(5).stores({
    students: '++id, roll, name, className, section, feeStatus, dues, attendance, status',
    fees: '++id, studentId, amount, date, status, receiptNo',
    attendance: '++id, studentId, date, status, remarks',
    users: '++id, username, role, password',
    teachers: '++id, name, subject, qualification, joinDate, phone, basic, hra, allowances, deductions',
    salary_payments: '++id, teacherId, month, year, amount, mode, paidDate, remarks',
    fee_structure: '++id, className, feeHeads, totalMonthly, academicYear',
    exams: '++id, name, term, className, subject, date, maxMarks, theoryMax, projectMax, status, academicYear',
    results: '++id, examId, studentId, theoryMarks, projectMarks, totalMarks, absent, grade, rank',
    syllabus: '++id, className, subject, chapterNo, chapterName, status, completedDate',
    sms_log: '++id, recipient, recipientType, message, sentAt, status, templateId',
    discounts: '++id, studentId, feeHead, type, value, reason, academicYear',
    expenses: '++id, date, amount, category, description, paymentMode, vendor, billNo',
    audit_logs: '++id, timestamp, user, role, module, action, ip, device, browser, risk',
    class_subjects: '++id, className, subjects'
});

db.version(6).stores({
    students: '++id, roll, name, className, section, feeStatus, dues, attendance, status',
    fees: '++id, studentId, amount, date, status, receiptNo',
    attendance: '++id, studentId, date, status, remarks',
    users: '++id, username, role, password',
    teachers: '++id, name, subject, qualification, joinDate, phone, basic, hra, allowances, deductions, assignedClasses, userId',
    salary_payments: '++id, teacherId, month, year, amount, mode, paidDate, remarks',
    fee_structure: '++id, className, feeHeads, totalMonthly, academicYear',
    exams: '++id, name, examType, term, className, subject, date, maxMarks, theoryMax, projectMax, status, academicYear',
    results: '++id, examId, studentId, theoryMarks, projectMarks, totalMarks, absent, grade, rank',
    syllabus: '++id, className, subject, chapterNo, chapterName, status, completedDate',
    sms_log: '++id, recipient, recipientType, message, sentAt, status, templateId',
    discounts: '++id, studentId, feeHead, type, value, reason, academicYear',
    expenses: '++id, date, amount, category, description, paymentMode, vendor, billNo',
    audit_logs: '++id, timestamp, user, role, module, action, ip, device, browser, risk',
    class_subjects: '++id, className, subjects'
});

// Seed sample data on first load (ONLY if user is not logged in)
async function seedDatabase() {
    // Skip seeding when authenticated — backend is the source of truth
    if (localStorage.getItem('erp_token')) return;

    const teacherCount = await db.teachers.count();
    if (teacherCount === 0) {
        await db.teachers.bulkAdd([
            { name: 'Rajesh Kumar', subject: 'Mathematics', qualification: 'M.Sc., B.Ed.', joinDate: '2019-04-01', phone: '9876543201', basic: 25000, hra: 5000, allowances: 3000, deductions: 2000 },
            { name: 'Sunita Verma', subject: 'Science', qualification: 'M.Sc., B.Ed.', joinDate: '2020-07-15', phone: '9876543202', basic: 22000, hra: 4400, allowances: 2500, deductions: 1800 },
            { name: 'Amit Tiwari', subject: 'English', qualification: 'M.A., B.Ed.', joinDate: '2021-01-10', phone: '9876543203', basic: 20000, hra: 4000, allowances: 2000, deductions: 1500 },
        ]);
    }

    const subjectCount = await db.class_subjects.count();
    if (subjectCount === 0) {
        await db.class_subjects.bulkAdd([
            { className: 'Playcenter', subjects: ['Activities', 'Drawing', 'Oral'] },
            { className: 'Nursery', subjects: ['English (Writing)', 'English (Reading/Oral)', 'Hindi (Writing)', 'Hindi (Reading/Oral)', 'Maths', 'GK/Drawing'] },
            { className: 'LKG', subjects: ['English (Writing)', 'English (Oral)', 'Hindi (Writing)', 'Hindi (Oral)', 'Maths', 'GK/Drawing'] },
            { className: 'UKG', subjects: ['English (Writing)', 'English (Oral)', 'Hindi (Writing)', 'Hindi (Oral)', 'Maths', 'GK/Drawing'] },
            { className: 'Class 1', subjects: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'GK', 'Drawing'] },
            { className: 'Class 2', subjects: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'GK', 'Drawing'] },
            { className: 'Class 3', subjects: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'GK', 'Drawing'] },
            { className: 'Class 4', subjects: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'GK', 'Drawing'] },
            { className: 'Class 5', subjects: ['English', 'Hindi', 'Maths', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'GK', 'Drawing'] },
            { className: 'Class 6', subjects: ['Hindi', 'English', 'Maths', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'GK', 'Drawing'] },
            { className: 'Class 7', subjects: ['Hindi', 'English', 'Maths', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'GK', 'Drawing'] },
            { className: 'Class 8', subjects: ['Hindi', 'English', 'Maths', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'GK', 'Drawing'] },
            { className: 'Class 9', subjects: ['Hindi', 'English', 'Maths', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'Home Science', 'Drawing', 'PT/Games'] },
            { className: 'Class 10', subjects: ['Hindi', 'English', 'Maths', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'Home Science', 'Drawing', 'PT/Games'] },
        ]);
    }

    const feeCount = await db.fee_structure.count();
    if (feeCount === 0) {
        await db.fee_structure.bulkAdd([
            { className: 'Class 6', feeHeads: [{ head: 'Tuition', amount: 1500 }, { head: 'Lab', amount: 300 }, { head: 'Library', amount: 200 }, { head: 'Sports', amount: 200 }], totalMonthly: 2200, academicYear: '2026-27' },
            { className: 'Class 7', feeHeads: [{ head: 'Tuition', amount: 1600 }, { head: 'Lab', amount: 350 }, { head: 'Library', amount: 200 }, { head: 'Sports', amount: 200 }], totalMonthly: 2350, academicYear: '2026-27' },
            { className: 'Class 8', feeHeads: [{ head: 'Tuition', amount: 1700 }, { head: 'Lab', amount: 400 }, { head: 'Library', amount: 250 }, { head: 'Sports', amount: 250 }], totalMonthly: 2600, academicYear: '2026-27' },
            { className: 'Class 9', feeHeads: [{ head: 'Tuition', amount: 1800 }, { head: 'Lab', amount: 450 }, { head: 'Library', amount: 250 }, { head: 'Sports', amount: 250 }], totalMonthly: 2750, academicYear: '2026-27' },
            { className: 'Class 10', feeHeads: [{ head: 'Tuition', amount: 2000 }, { head: 'Lab', amount: 500 }, { head: 'Library', amount: 300 }, { head: 'Sports', amount: 300 }], totalMonthly: 3100, academicYear: '2026-27' },
        ]);
    }

    const syllabusCount = await db.syllabus.count();
    if (syllabusCount === 0) {
        await db.syllabus.bulkAdd([
            { className: 'Class 8', subject: 'Mathematics', chapterNo: 1, chapterName: 'Rational Numbers', status: 'done', completedDate: '2025-05-15' },
            { className: 'Class 8', subject: 'Mathematics', chapterNo: 2, chapterName: 'Linear Equations in One Variable', status: 'done', completedDate: '2025-06-10' },
            { className: 'Class 8', subject: 'Mathematics', chapterNo: 3, chapterName: 'Understanding Quadrilaterals', status: 'progress', completedDate: null },
            { className: 'Class 8', subject: 'Mathematics', chapterNo: 4, chapterName: 'Data Handling', status: 'pending', completedDate: null },
            { className: 'Class 8', subject: 'Mathematics', chapterNo: 5, chapterName: 'Squares and Square Roots', status: 'pending', completedDate: null },
        ]);
    }

    // Seed students if empty (migrated from mock data)
    const studentCount = await db.students.count();
    if (studentCount === 0) {
        await db.students.bulkAdd([
            { roll: '101', name: 'Aarav Sharma', className: 'Class 5', section: 'A', feeStatus: 'Cleared', dues: 0, attendance: '92%', status: 'Active', phone: '9800000001', dob: '2013-03-15', gender: 'Male', parentName: 'Vikram Sharma', bloodGroup: 'B+' },
            { roll: '102', name: 'Diya Patel', className: 'Class 5', section: 'A', feeStatus: 'Due', dues: 1500, attendance: '85%', status: 'Active', phone: '9800000002', dob: '2013-07-22', gender: 'Female', parentName: 'Ramesh Patel', bloodGroup: 'O+' },
            { roll: '103', name: 'Rohan Verma', className: 'Class 5', section: 'B', feeStatus: 'Cleared', dues: 0, attendance: '98%', status: 'Active', phone: '9800000003', dob: '2013-01-10', gender: 'Male', parentName: 'Suresh Verma', bloodGroup: 'A+' },
            { roll: '104', name: 'Ananya Singh', className: 'Class 6', section: 'A', feeStatus: 'Due', dues: 2400, attendance: '76%', status: 'Active', phone: '9800000004', dob: '2012-11-05', gender: 'Female', parentName: 'Amit Singh', bloodGroup: 'AB+' },
            { roll: '105', name: 'Kabir Das', className: 'Class 8', section: 'C', feeStatus: 'Cleared', dues: 0, attendance: '95%', status: 'Active', phone: '9800000005', dob: '2010-08-18', gender: 'Male', parentName: 'Arun Das', bloodGroup: 'O-' },
            { roll: '106', name: 'Meera Reddy', className: 'Class 3', section: 'B', feeStatus: 'Cleared', dues: 0, attendance: '89%', status: 'Active', phone: '9800000006', dob: '2015-02-28', gender: 'Female', parentName: 'Krishna Reddy', bloodGroup: 'B+' },
            { roll: '107', name: 'Arjun Nair', className: 'Class 10', section: 'A', feeStatus: 'Due', dues: 4500, attendance: '82%', status: 'Active', phone: '9800000007', dob: '2008-05-12', gender: 'Male', parentName: 'Vinod Nair', bloodGroup: 'A-' },
            { roll: '108', name: 'Priya Menon', className: 'Class 1', section: 'A', feeStatus: 'Cleared', dues: 0, attendance: '99%', status: 'Active', phone: '9800000008', dob: '2017-09-20', gender: 'Female', parentName: 'Mohan Menon', bloodGroup: 'O+' },
            { roll: '109', name: 'Ravi Kumar', className: 'Class 10', section: 'B', feeStatus: 'Cleared', dues: 0, attendance: '91%', status: 'Active', phone: '9800000009', dob: '2008-12-03', gender: 'Male', parentName: 'Rajesh Kumar', bloodGroup: 'B-' },
            { roll: '110', name: 'Sneha Gupta', className: 'Class 7', section: 'A', feeStatus: 'Due', dues: 800, attendance: '88%', status: 'Active', phone: '9800000010', dob: '2011-06-25', gender: 'Female', parentName: 'Sanjay Gupta', bloodGroup: 'AB+' },
            { roll: '111', name: 'Aditya Jain', className: 'Class 9', section: 'B', feeStatus: 'Cleared', dues: 0, attendance: '94%', status: 'Active', phone: '9800000011', dob: '2009-04-08', gender: 'Male', parentName: 'Manoj Jain', bloodGroup: 'A+' },
            { roll: '112', name: 'Tara Menon', className: 'Class 2', section: 'C', feeStatus: 'Cleared', dues: 0, attendance: '97%', status: 'Active', phone: '9800000012', dob: '2016-10-14', gender: 'Female', parentName: 'Mohan Menon', bloodGroup: 'O+' },
        ]);
    }
}

seedDatabase().catch(err => console.error('Seed error:', err));

