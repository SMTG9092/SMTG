/**
 * ============================================================
 * SMTG Enterprise ERP/WMS
 * File : assets/js/core/permissions-page.js
 * ============================================================
 */

"use strict";

import { canPage, can, getPermissions } from './permissions.js';

/**
 * التحقق مما إذا كان الدور أو المستخدم يمتلك صلاحية فتح الصفحة الحالية
 * @param {string} pageFile مسار أو كود الصفحة
 * @returns {boolean}
 */
export function canAccessPage(pageFile) {
    if (!pageFile) return true;
    
    const roleCode = (window.currentUserRoleCode || '').trim().toUpperCase();
    
    // إذا كان الأدمن، فله حق الوصول الكامل مباشرة[cite: 2]
    if (roleCode === 'ADMIN') return true;
    
    // استخراج اسم الصفحة من المسار (مثال: dashboard/dashboard-admin.html -> dashboard-admin)[cite: 2]
    const cleanName = pageFile.split('/').pop().replace('.html', '');
    
    // حل مشكلة اللحظات الأولى: إذا لم تكن الصلاحيات قد جُلبت بعد أو لم يتم تحديد الدور، نسمح بالمرور مؤقتاً لتفادي الاختفاء الشامل
    const currentPerms = getPermissions();
    if (!roleCode && (!currentPerms || currentPerms.length === 0)) {
        return true; 
    }
    
    // التحقق عبر دوال الصلاحيات الأساسية[cite: 2]
    return canPage(cleanName) || can(cleanName);
}

/**
 * تطبيق قيود الحذف أو التعديل بناءً على الصلاحيات في واجهة المستخدم
 * @param {string} roleCode 
 */
export function applyDeletePermissionsUI(roleCode) {
    const currentRole = (roleCode || window.currentUserRoleCode || '').trim().toUpperCase();
    if (currentRole === 'ADMIN') return; // الأدمن عنده كل الصلاحيات[cite: 2]

    // إخفاء أو تعطيل أزرار الحذف للمستخدمين العاديين إذا لم تكن لديهم صلاحية[cite: 2]
    const deleteButtons = document.querySelectorAll('.btn-danger, [data-action="delete"], .delete-action-btn');
    deleteButtons.forEach(btn => {
        btn.style.display = 'none';
    });
}
