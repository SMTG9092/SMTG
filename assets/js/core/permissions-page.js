/**
 * التحقق مما إذا كان الدور أو المستخدم يمتلك صلاحية فتح الصفحة الحالية
 * @param {string} pageFile مسار أو كود الصفحة
 * @returns {boolean}
 */
export function canAccessPage(pageFile) {
    if (!pageFile) return true;
    
    const roleCode = (window.currentUserRoleCode || '').trim().toUpperCase();
    
    // إذا كان الأدمن أو أن الرول ما زال لم يتم تحميله بعد في اللحظات الأولى، نسمح بالمرور المؤقت
    if (!roleCode || roleCode === 'ADMIN') return true;
    
    // استخراج اسم الصفحة من المسار (مثال: dashboard/dashboard-admin.html -> dashboard-admin)
    const cleanName = pageFile.split('/').pop().replace('.html', '');
    
    // التحقق عبر دوال الصلاحيات الأساسية
    return canPage(cleanName) || can(cleanName);
}
