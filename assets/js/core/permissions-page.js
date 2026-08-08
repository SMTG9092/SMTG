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
    
    // استخراج اسم الصفحة من المسار
    const cleanName = pageFile.split('/').pop().replace('.html', '');
    
    const currentPerms = getPermissions();
    
    // إذا لم تنتهِ عملية الجلب بعد من قاعدة البيانات، ننتظر لحظة ولا نحظر مباشرة لكي لا يتم إغلاق كل شيء خطأً
    if (!window.permissionsLoaded) {
        return true; 
    }
    
    // إذا انتهى التحميل ولم يتم العثور على صلاحيات نهائياً في الجدول لهذا الدور، تُمنع الصفحة
    if (!currentPerms || currentPerms.length === 0) {
        return false;
    }
    
    // التحقق الصارم من الجدول
    return canPage(cleanName) || can(cleanName);
}

/**
 * تطبيق قيود الحذف أو التعديل بناءً على الصلاحيات في واجهة المستخدم
 * @param {string} roleCode 
 */
export function applyDeletePermissionsUI(roleCode) {
    const currentRole = (roleCode || window.currentUserRoleCode || '').trim().toUpperCase();
    if (currentRole === 'ADMIN') return;

    const deleteButtons = document.querySelectorAll('.btn-danger, [data-action="delete"], .delete-action-btn');
    deleteButtons.forEach(btn => {
        btn.style.display = 'none';
    });
}
