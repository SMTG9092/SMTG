/**
 * ============================================================
 * SMTG Enterprise ERP/WMS
 * File : assets/js/core/permissions-page.js
 * ============================================================
 */

"use strict";

import { canPage, can } from './permissions.js';

/**
 * التحقق مما إذا كان الدور أو المستخدم يمتلك صلاحية فتح الصفحة الحالية
 * @param {string} pageFile مسار أو كود الصفحة
 * @returns {boolean}
 */
export function canAccessPage(pageFile) {
    if (!pageFile) return true;
    
    // إذا كان المستخدم الحالي مديراً عاماً، فله حق الوصول الكامل مباشرة
    const roleCode = (window.currentUserRoleCode || '').trim().toUpperCase();
    if (roleCode === 'ADMIN') return true;
    
    // استخراج اسم الصفحة من المسار (مثال: dashboard/dashboard-admin.html -> dashboard-admin)
    const cleanName = pageFile.split('/').pop().replace('.html', '');
    
    // التحقق عبر دوال الصلاحيات الأساسية
    return canPage(cleanName) || can(cleanName);
}

/**
 * تطبيق قيود الحذف أو التعديل بناءً على الصلاحيات في واجهة المستخدم
 * @param {string} roleCode 
 */
export function applyDeletePermissionsUI(roleCode) {
    const currentRole = (roleCode || window.currentUserRoleCode || '').trim().toUpperCase();
    if (currentRole === 'ADMIN') return; // الأدمن عنده كل الصلاحيات

    // إخفاء أو تعطيل أزرار الحذف للمستخدمين العاديين إذا لم تكن لديهم صلاحية
    const deleteButtons = document.querySelectorAll('.btn-danger, [data-action="delete"], .delete-action-btn');
    deleteButtons.forEach(btn => {
        btn.style.display = 'none';
    });
}
