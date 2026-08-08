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
        return [];
    }

    role = profile.role_id;
    const userId = profile.id;

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

        // 2. جلب صلاحيات الصفحات العامة الخاصة بدور المستخدم من جدول role_page_permissions الجديد
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
                
                // دمج صلاحيات الدور مع الصلاحيات الفردية
                permissions = [...permissions, ...rolePagePermissions];
            }
        }

        // 3. جلب جميع الصفحات النشطة من public.pages
        const { data: pagesData } = await supabase
            .from("pages")
            .select("code, url, nom, module")
            .eq("actif", true);

        if (pagesData) {
            activePagesCache = pagesData;
        }

    } catch (err) {
        console.error("Erreur technique lors du chargement des permissions:", err);
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

    // 1. التحقق مما إذا كانت الصلاحية موجودة في permissions (الفردية أو الخاصة بالدور)
    const hasPerm = permissions.some(
        permission => permission.code === code || permission.page === code
    );
    if (hasPerm) return true;

    // 2. Fallback: التحقق مما إذا كانت الصفحة موجودة ونشطة
    const pageExists = activePagesCache.some(p => p.code === code);
    if (pageExists) {
        return true; 
    }

    return false;
}

/* ============================================================
   HAS MODULE
============================================================ */

export function canModule(module) {
    return permissions.some(
        permission => permission.module === module
    ) || activePagesCache.some(p => p.module === module);
}

/* ============================================================
   HAS PAGE
============================================================ */

export function canPage(page) {
    return permissions.some(
        permission => permission.page === page
    ) || activePagesCache.some(p => p.code === page);
}

/* ============================================================
   HAS ACTION
============================================================ */

export function canAction(action) {
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
    return activePagesCache.map(
        item => item.module
    );
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
