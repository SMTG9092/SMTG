/**
 * ============================================================
 * SMTG Enterprise ERP/WMS
 * File : assets/js/core/permissions-page.js
 * ============================================================
 */

"use strict";

import { canPage, can, getPermissions } from './permissions.js';

/**
 * التحقق مما إذا كان الدور أو المستخدم يمتلك صلاحية فتح الصفحة الحالية بناءً على الجدول حصراً
 * @param {string} pageFile مسار أو كود الصفحة
 * @returns {boolean}
 */
export function canAccessPage(pageFile) {
    if (!pageFile) return true;
    
    const roleCode = (window.currentUserRoleCode || '').trim().toUpperCase();
    
    // إذا كان الأدمن، فله حق الوصول الكامل مباشرة
    if (roleCode === 'ADMIN') return true;
    
    // استخراج اسم الصفحة من المسار (مثال: dashboard/dashboard-admin.html -> dashboard-admin)
    const cleanName = pageFile.split('/').pop().replace('.html', '');
    
    // جلب الصلاحيات المحملة من جدول role_page_permissions و user_page_actions
    const currentPerms = getPermissions();
    
    // إذا لم يتم العثور على أي صلاحيات للدور في الجدول أو كانت القائمة فارغة، تُمنع جميع الصفحات من الظهور فوراً
    if (!currentPerms || currentPerms.length === 0) {
        return false;
    }
    
    // التحقق الصارم: هل الصفحة مسجلة ضمن الصلاحيات المسموحة (can_view = true)؟
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
