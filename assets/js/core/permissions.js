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

/* ============================================================
   CACHE
============================================================ */

let role = null;
let permissions = [];
let activePagesCache = [];

/* ============================================================
   LOAD PERMISSIONS & PAGES
============================================================ */

export async function loadPermissions() {
    const profile = await getProfile();

    if (!profile) {
        permissions = [];
        role = null;
        window.permissionsLoaded = true; // تعيين العلامة حتى لو لم يتم العثور على بروفایل لتفادي الانتظار اللانهائي
        return [];
    }

    role = profile.role_id;
    const userId = profile.id;
    const roleCode = (window.currentUserRoleCode || '').trim().toUpperCase();

    try {
        // 1. جلب الصلاحيات الفردية الخاصة بالمستخدم من user_page_actions
        const { data: userPerms, error } = await supabase
            .from("user_page_actions")
            .select(`
                autorise,
                page_action_id,
                page_actions (
                    id,
                    page_id,
                    action_id,
                    pages (
                        code,
                        url,
                        module,
                        nom
                    ),
                    actions (
                        code,
                        nom
                    )
                )
            `)
            .eq("user_id", userId)
            .eq("autorise", true);

        if (error) {
            console.error("Erreur chargement user_page_actions:", error);
            permissions = [];
        } else if (userPerms) {
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

        // 2. جلب صلاحيات الدور بصرامة من جدول role_page_permissions الجديد
        if (role) {
            const { data: rolePerms, error: rolePermsError } = await supabase
                .from("role_page_permissions")
                .select(`
                    can_view,
                    pages (
                        code,
                        url,
                        module,
                        nom
                    )
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

        // 3. جلب الصفحات النشطة فقط للمقارنة العامة
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
        // الإعلان بأن عملية تحميل الصلاحيات قد انتهت رسمياً
        window.permissionsLoaded = true;
    }

    return permissions;
}

/* ============================================================
   GET ALL
============================================================ */

export function getPermissions() {
    return permissions;
}

/* ============================================================
   HAS PERMISSION
============================================================ */

export function can(code) {
    if (!code) return true;

    // إذا كان المستخدم ADMIN، فلديه الصلاحية المطلقة
    const roleCode = (window.currentUserRoleCode || '').trim().toUpperCase();
    if (roleCode === 'ADMIN') return true;

    // التحقق الصارم هل الصلاحية موجودة ضمن صلاحيات الدور أو الفردية الخاصة بالمستخدم
    const hasPerm = permissions.some(
        permission => permission.code === code || permission.page === code
    );
    
    return hasPerm;
}

/* ============================================================
   HAS MODULE
============================================================ */

export function canModule(module) {
    const roleCode = (window.currentUserRoleCode || '').trim().toUpperCase();
    if (roleCode === 'ADMIN') return true;

    return permissions.some(
        permission => permission.module === module
    );
}

/* ============================================================
   HAS PAGE
============================================================ */

export function canPage(page) {
    const roleCode = (window.currentUserRoleCode || '').trim().toUpperCase();
    if (roleCode === 'ADMIN') return true;

    return permissions.some(
        permission => permission.page === page || permission.code === page
    );
}

/* ============================================================
   HAS ACTION
============================================================ */

export function canAction(action) {
    const roleCode = (window.currentUserRoleCode || '').trim().toUpperCase();
    if (roleCode === 'ADMIN') return true;

    return permissions.some(
        permission => permission.action === action
    );
}

/* ============================================================
   ANY
============================================================ */

export function canAny(list) {
    return list.some(
        item => can(item)
    );
}

/* ============================================================
   ALL
============================================================ */

export function canAll(list) {
    return list.every(
        item => can(item)
    );
}

/* ============================================================
   CURRENT ROLE
============================================================ */

export function currentRoleId() {
    return role;
}

/* ============================================================
   REQUIRE
============================================================ */

export function requirePermission(code) {
    if (!can(code)) {
        window.location.replace("403.html");
        return false;
    }
    return true;
}

/* ============================================================
   SIDEBAR FILTER
============================================================ */

export function visibleMenus() {
    const roleCode = (window.currentUserRoleCode || '').trim().toUpperCase();
    if (roleCode === 'ADMIN') {
        return activePagesCache.map(item => item.module);
    }
    return permissions.map(item => item.module);
}

/* ============================================================
   RELOAD
============================================================ */

export async function refreshPermissions() {
    return await loadPermissions();
}

/* ============================================================
   INIT
============================================================ */

export async function initPermissions() {
    await loadPermissions();
}
