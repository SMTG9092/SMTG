/**
 * ============================================================
 * SMTG Enterprise ERP/WMS
 * File : assets/js/core/permissions.js
 * ============================================================
 */

"use strict";

import supabase from "./supabase.js";
import APP_CONFIG from "./config.js";
import { getProfile } from "./auth.js";

let role = null;
let permissions = [];
let activePagesCache = [];

export async function loadPermissions() {
    const profile = await getProfile();

    if (!profile) {
        permissions = [];
        role = null;
        window.permissionsLoaded = true;
        window.dispatchEvent(new CustomEvent('permissionsLoaded'));
        return [];
    }

    role = profile.role_id;
    const userId = profile.id;

    try {
        // 1. جلب الصلاحيات الفردية
        const { data: userPerms, error } = await supabase
            .from("user_page_actions")
            .select(`
                autorise,
                page_action_id,
                page_actions (
                    id,
                    page_id,
                    action_id,
                    pages ( code, url, module, nom ),
                    actions ( code, nom )
                )
            `)
            .eq("user_id", userId)
            .eq("autorise", true);

        if (!error && userPerms) {
            permissions = userPerms
                .filter(item => item.autorise && item.page_actions)
                .map(item => {
                    const pa = item.page_actions;
                    const page = pa.pages || {};
                    const action = pa.actions || {};
                    const pageCode = page.code || '';
                    const actionCode = action.code || '';
                    return {
                        code: actionCode ? `${pageCode}.${actionCode}` : pageCode,
                        module: page.module,
                        page: pageCode,
                        action: actionCode
                    };
                });
        }

        // 2. جلب صلاحيات الدور حصراً من جدول role_page_permissions حيث can_view = true
        if (role) {
            const { data: rolePerms, error: rolePermsError } = await supabase
                .from("role_page_permissions")
                .select(`
                    can_view,
                    pages ( code, url, module, nom )
                `)
                .eq("role_id", role)
                .eq("can_view", true);

            if (!rolePermsError && rolePerms) {
                const rolePagePermissions = rolePerms
                    .filter(item => item.can_view && item.pages)
                    .map(item => {
                        const page = item.pages;
                        const pageCode = page.code || '';
                        return {
                            code: pageCode,
                            module: page.module,
                            page: pageCode,
                            action: ''
                        };
                    });
                
                permissions = [...permissions, ...rolePagePermissions];
            }
        }

        // 3. جلب الصفحات النشطة
        const { data: pagesData } = await supabase
            .from("pages")
            .select("code, url, nom, module")
            .eq("actif", true);

        if (pagesData) {
            activePagesCache = pagesData;
        }

    } catch (err) {
        console.error("Erreur technique lors du chargement des permissions:", err);
    } finally {
        window.permissionsLoaded = true;
        // إشعار الواجهة فور انتهاء تحميل الصلاحيات لتحديث القائمة الجانبية
        window.dispatchEvent(new CustomEvent('permissionsLoaded'));
    }

    return permissions;
}

export function getPermissions() {
    return permissions;
}

export function can(code) {
    if (!code) return true;
    const roleCode = (window.currentUserRoleCode || '').trim().toUpperCase();
    if (roleCode === 'ADMIN') return true;

    return permissions.some(
        permission => permission.code === code || permission.page === code
    );
}

export function canPage(page) {
    const roleCode = (window.currentUserRoleCode || '').trim().toUpperCase();
    if (roleCode === 'ADMIN') return true;

    return permissions.some(
        permission => permission.page === page || permission.code === page
    );
}

export function canModule(module) {
    const roleCode = (window.currentUserRoleCode || '').trim().toUpperCase();
    if (roleCode === 'ADMIN') return true;

    return permissions.some(permission => permission.module === module);
}

export function visibleMenus() {
    const roleCode = (window.currentUserRoleCode || '').trim().toUpperCase();
    if (roleCode === 'ADMIN') {
        return activePagesCache.map(item => item.module);
    }
    return permissions.map(item => item.module);
}

export async function initPermissions() {
    await loadPermissions();
}
